-- =====================================================
-- 028_v2_community_functions.sql
-- 커뮤니티 맛집 지역별 목록 조회 RPC 함수 정의 (v2)
-- 
-- 인자:
--   @p_domain: 필터링할 커뮤니티 도메인 (clien.net, damoang.net 등)
--   @p_limit: 조회할 지역 개수 (기본 20)
--   @p_offset: 페이징 오프셋
-- 
-- 실행 방법:
--   psql "postgresql://postgres.xyqpggpilgcdsawuvpzn:ZNDqDunnaydr0aFQ@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres" -f docs/sql/028_v2_community_functions.sql
-- =====================================================

CREATE OR REPLACE FUNCTION public.v2_get_community_contents(
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
SET search_path = public, public
AS $$
BEGIN
    RETURN QUERY
    WITH region_stats AS (
        -- 지역별(group1) 매장 수 집계
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
    ),
    place_latest_features AS (
        -- 지역별 각 매장의 가장 최신 게시글 1개만 추출 (중복 제거)
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
          AND p.group1 IS NOT NULL
    ),
    content_previews AS (
        -- 지역별로 중복 제거된 매장들 중 최신순으로 10개씩 추출
        SELECT 
            plf.*,
            row_number() OVER (PARTITION BY plf.r_name ORDER BY plf.published_at DESC) as rn
        FROM place_latest_features plf
        WHERE plf.place_rn = 1
    )
    SELECT 
        rs.r_name::text,
        rs.p_count,
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

COMMENT ON FUNCTION public.v2_get_community_contents IS '커뮤니티 맛집을 지역별로 그룹화하여 조회합니다 (v2)';
GRANT EXECUTE ON FUNCTION public.v2_get_community_contents TO authenticated, anon;
