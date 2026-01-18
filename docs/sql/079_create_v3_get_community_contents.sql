-- =====================================================
-- 079_create_v3_get_community_contents.sql
-- v2_get_community_contents의 성능 최적화 버전
-- 
-- 개선 사항:
--   1. 상위 N개 지역만 먼저 확정 후 해당 지역 장소만 처리
--   2. like/review count를 배치 JOIN으로 처리 (N+1 제거)
--   3. v1_common_place_features는 최종 필요한 장소에만 적용
--   4. Window function 범위 최소화
-- 
-- 인자:
--   @p_domain: 필터링할 커뮤니티 도메인 (clien.net, damoang.net 등)
--   @p_limit: 조회할 지역 개수 (기본 20)
--   @p_offset: 페이징 오프셋
-- 
-- 실행 방법:
--   psql "postgresql://postgres.xyqpggpilgcdsawuvpzn:ZNDqDunnaydr0aFQ@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres" -f docs/sql/079_create_v3_get_community_contents.sql
-- =====================================================

DROP FUNCTION IF EXISTS public.v3_get_community_contents(text, integer, integer);
CREATE OR REPLACE FUNCTION public.v3_get_community_contents(
    p_domain text DEFAULT NULL,
    p_limit integer DEFAULT 20,
    p_offset integer DEFAULT 0
)
RETURNS TABLE (
    region_name text,
    place_count bigint,
    preview_contents jsonb
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
    RETURN QUERY
    WITH 
    -- =========================================================
    -- 1단계: 상위 N개 지역만 먼저 확정 (LIMIT 먼저 적용)
    -- =========================================================
    target_regions AS (
        SELECT 
            p.group1 as r_name,
            count(DISTINCT p.id) as p_count
        FROM tbl_place_features pf
        JOIN tbl_place p ON pf.place_id = p.id
        WHERE pf.platform_type = 'community'
          AND pf.status = 'active'
          AND (p_domain IS NULL OR pf.metadata->>'domain' = p_domain)
          AND p.group1 IS NOT NULL
        GROUP BY p.group1
        ORDER BY count(DISTINCT p.id) DESC
        LIMIT p_limit OFFSET p_offset
    ),
    
    -- =========================================================
    -- 2단계: 해당 지역의 장소들만 추출 + 장소별 최신 게시글 1개
    -- =========================================================
    region_places AS (
        SELECT 
            p.group1 as r_name,
            p.id as place_id,
            p.name as place_name,
            p.category,
            p.images[1] as thumbnail,
            p.visitor_reviews_score as score,
            p.visitor_reviews_total as review_count,
            p.group1,
            p.group2,
            pf.title,
            pf.content_url,
            pf.metadata->>'domain' as domain,
            pf.published_at,
            row_number() OVER (PARTITION BY p.group1, p.id ORDER BY pf.published_at DESC) as place_rn
        FROM tbl_place_features pf
        JOIN tbl_place p ON pf.place_id = p.id
        WHERE pf.platform_type = 'community'
          AND pf.status = 'active'
          AND (p_domain IS NULL OR pf.metadata->>'domain' = p_domain)
          AND p.group1 IN (SELECT r_name FROM target_regions)  -- ← 타겟 지역만
    ),
    
    -- =========================================================
    -- 3단계: 지역별 상위 10개 장소만 선택
    -- =========================================================
    top_places_per_region AS (
        SELECT 
            rp.*,
            row_number() OVER (PARTITION BY rp.r_name ORDER BY rp.published_at DESC) as region_rn
        FROM region_places rp
        WHERE rp.place_rn = 1  -- 장소별 최신 게시글 1개만
    ),
    
    final_places AS (
        SELECT * FROM top_places_per_region
        WHERE region_rn <= 10  -- 지역당 10개
    ),
    
    -- =========================================================
    -- 4단계: like/review count 배치 조회 (N+1 제거)
    -- =========================================================
    place_like_counts AS (
        SELECT 
            l.liked_id as place_id,
            count(*) as liked_count
        FROM public.tbl_like l
        WHERE l.liked_id IN (SELECT place_id FROM final_places)
          AND l.liked_type = 'place'
          AND l.liked = true
        GROUP BY l.liked_id
    ),
    
    place_review_counts AS (
        SELECT 
            r.place_id,
            count(*) as reviews_count
        FROM public.tbl_place_user_review r
        WHERE r.place_id IN (SELECT place_id FROM final_places)
          AND r.is_active = true
        GROUP BY r.place_id
    ),
    
    -- =========================================================
    -- 5단계: 최종 장소 데이터 조합 (features 포함)
    -- =========================================================
    enriched_places AS (
        SELECT 
            fp.r_name,
            fp.place_id,
            fp.place_name,
            fp.category,
            fp.thumbnail,
            fp.score,
            fp.review_count,
            fp.group1,
            fp.group2,
            fp.title,
            fp.content_url,
            fp.domain,
            fp.published_at,
            COALESCE(plc.liked_count, 0) as place_liked_count,
            COALESCE(prc.reviews_count, 0) as place_reviews_count,
            public.v1_common_place_features(fp.place_id) as features,
            fp.region_rn
        FROM final_places fp
        LEFT JOIN place_like_counts plc ON plc.place_id = fp.place_id
        LEFT JOIN place_review_counts prc ON prc.place_id = fp.place_id
    ),
    
    -- =========================================================
    -- 6단계: 지역별로 그룹핑하여 preview_contents 생성
    -- =========================================================
    region_contents AS (
        SELECT 
            ep.r_name,
            jsonb_agg(
                jsonb_build_object(
                    'place_id', ep.place_id,
                    'place_name', ep.place_name,
                    'category', ep.category,
                    'thumbnail', ep.thumbnail,
                    'score', ep.score,
                    'review_count', ep.review_count,
                    'group1', ep.group1,
                    'group2', ep.group2,
                    'title', ep.title,
                    'content_url', ep.content_url,
                    'domain', ep.domain,
                    'published_at', ep.published_at,
                    'place_liked_count', ep.place_liked_count,
                    'place_reviews_count', ep.place_reviews_count,
                    'features', ep.features
                ) ORDER BY ep.region_rn
            ) as contents
        FROM enriched_places ep
        GROUP BY ep.r_name
    )
    
    -- =========================================================
    -- 최종 SELECT
    -- =========================================================
    SELECT 
        tr.r_name::text as region_name,
        tr.p_count as place_count,
        COALESCE(rc.contents, '[]'::jsonb) as preview_contents
    FROM target_regions tr
    LEFT JOIN region_contents rc ON rc.r_name = tr.r_name
    ORDER BY tr.p_count DESC;
END;
$$;

COMMENT ON FUNCTION public.v3_get_community_contents IS '커뮤니티 맛집을 지역별로 그룹화하여 조회 (v3 - 성능 최적화: 타겟 지역 먼저 확정, 배치 조회)';
GRANT EXECUTE ON FUNCTION public.v3_get_community_contents TO authenticated, anon;
