-- =====================================================
-- 071_add_v2_get_region_contents.sql
-- 피쳐 페이지 지역 탭용 통합 컨텐츠 조회 RPC 함수 정의 (v2)
-- 
-- 인자:
--   @p_source: 필터링할 소스 (community, detective, folder, youtube) - NULL이면 전체
--   @p_limit: 조회할 지역 개수 (기본 20)
--   @p_offset: 페이징 오프셋
-- 
-- 실행 방법:
--   psql "postgresql://postgres.xyqpggpilgcdsawuvpzn:ZNDqDunnaydr0aFQ@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres" -f docs/sql/071_add_v2_get_region_contents.sql
-- =====================================================

CREATE OR REPLACE FUNCTION public.v2_get_region_contents(
    p_source text DEFAULT NULL,
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
SET search_path = public, auth, public
AS $$
BEGIN
    RETURN QUERY
    WITH all_source_places AS (
        -- 1. 커뮤니티
        SELECT 
            p.id as place_id, 
            p.group1 as r_name, 
            'community' as src, 
            pf.published_at,
            pf.title,
            pf.content_url,
            pf.metadata->>'domain' as domain
        FROM tbl_place_features pf
        JOIN tbl_place p ON pf.place_id = p.id
        WHERE pf.platform_type = 'community' 
          AND pf.status = 'active'
          AND p.group1 IS NOT NULL
          AND (p_source IS NULL OR p_source = 'community')

        UNION ALL

        -- 2. 유튜브
        SELECT 
            p.id as place_id, 
            p.group1 as r_name, 
            'youtube' as src, 
            pf.published_at,
            pf.title,
            pf.content_url,
            pf.metadata->>'channelTitle' as domain
        FROM tbl_place_features pf
        JOIN tbl_place p ON pf.place_id = p.id
        WHERE pf.platform_type = 'youtube' 
          AND pf.status = 'active'
          AND p.group1 IS NOT NULL
          AND (p_source IS NULL OR p_source = 'youtube')

        UNION ALL

        -- 3. 플레이스 (네이버 폴더)
        SELECT 
            p.id as place_id, 
            p.group1 as r_name, 
            'folder' as src, 
            p.updated_at as published_at,
            f.name as title,
            NULL as content_url,
            'Naver' as domain
        FROM tbl_naver_folder_place nfp
        JOIN tbl_naver_folder f ON nfp.folder_id = f.folder_id
        JOIN tbl_place p ON nfp.place_id = p.id
        WHERE p.group1 IS NOT NULL
          AND (p_source IS NULL OR p_source = 'folder')

        UNION ALL

        -- 4. 맛탐정 (공개 폴더)
        SELECT 
            p.id as place_id, 
            p.group1 as r_name, 
            'detective' as src, 
            p.updated_at as published_at,
            f.title as title,
            NULL as content_url,
            up.nickname as domain
        FROM tbl_folder_place fp
        JOIN tbl_folder f ON fp.folder_id = f.id
        JOIN tbl_place p ON fp.place_id = p.id
        LEFT JOIN tbl_user_profile up ON f.owner_id = up.auth_user_id
        WHERE f.permission = 'public'
          AND p.group1 IS NOT NULL
          AND (p_source IS NULL OR p_source = 'detective')
    ),
    region_stats AS (
        -- 지역별 매장 수 집계 (중복 매장 제외)
        SELECT 
            r_name,
            count(DISTINCT place_id) as p_count
        FROM all_source_places
        GROUP BY r_name
    ),
    place_latest_info AS (
        -- 지역별 각 매장의 정보와 가장 최신 소스 연결
        SELECT 
            asp.r_name,
            asp.place_id,
            p.name as place_name,
            p.category,
            COALESCE(p.images[1], p.place_images[1]) as thumbnail,
            p.visitor_reviews_score as score,
            p.visitor_reviews_total as review_count,
            p.group1,
            p.group2,
            asp.title,
            asp.content_url,
            asp.domain,
            asp.published_at,
            asp.src,
            public.v1_common_place_features(p.id) as features,
            (public.v1_common_place_interaction(p.id))->'place_liked_count' as place_liked_count,
            (public.v1_common_place_interaction(p.id))->'place_reviews_count' as place_reviews_count,
            row_number() OVER (PARTITION BY asp.r_name, asp.place_id ORDER BY asp.published_at DESC) as place_rn
        FROM all_source_places asp
        JOIN tbl_place p ON asp.place_id = p.id
    ),
    content_previews AS (
        -- 지역별로 최신순 10개 추출
        SELECT 
            pli.*,
            row_number() OVER (PARTITION BY pli.r_name ORDER BY pli.published_at DESC) as rn
        FROM place_latest_info pli
        WHERE pli.place_rn = 1
    )
    SELECT 
        rs.r_name::text as region_name,
        rs.p_count as place_count,
        (
            SELECT jsonb_agg(to_jsonb(cp.*) - 'r_name' - 'place_rn' - 'rn')
            FROM content_previews cp
            WHERE cp.r_name = rs.r_name AND cp.rn <= 10
        ) as preview_contents
    FROM region_stats rs
    ORDER BY rs.p_count DESC
    LIMIT p_limit OFFSET p_offset;
END;
$$;

COMMENT ON FUNCTION public.v2_get_region_contents IS '지역별 통합 맛집 컨텐츠를 조회합니다 (v2)';
GRANT EXECUTE ON FUNCTION public.v2_get_region_contents TO authenticated, anon;
