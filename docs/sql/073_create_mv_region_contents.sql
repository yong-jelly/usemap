-- =====================================================
-- 073_create_mv_region_contents.sql
-- 지역별 통합 컨텐츠 집계 성능 최적화를 위한 Materialized View 도입
-- 
-- 주요 변경 사항:
--   1. mv_region_contents 머터리얼라이즈드 뷰 생성 (소스별/지역별 미리 집계)
--   2. v2_get_region_contents 함수가 MV를 조회하도록 수정 (성능 개선)
--   3. 3시간마다 MV 자동 갱신을 위한 pg_cron 스케줄 등록
-- 
-- 실행 방법:
--   psql "postgresql://postgres.xyqpggpilgcdsawuvpzn:ZNDqDunnaydr0aFQ@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres" -f docs/sql/073_create_mv_region_contents.sql
-- =====================================================

-- 1. 머터리얼라이즈드 뷰 생성
DROP MATERIALIZED VIEW IF EXISTS public.mv_region_contents;

CREATE MATERIALIZED VIEW public.mv_region_contents AS
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
),
source_combinations AS (
    -- 각 소스별 데이터와 전체('all') 데이터를 위한 조합 생성
    SELECT place_id, r_name, src as source_key, published_at, title, content_url, domain FROM all_source_places
    UNION ALL
    SELECT place_id, r_name, 'all' as source_key, published_at, title, content_url, domain FROM all_source_places
),
region_stats AS (
    SELECT 
        source_key,
        r_name,
        count(DISTINCT place_id) as p_count
    FROM source_combinations
    GROUP BY source_key, r_name
),
place_latest_info AS (
    SELECT 
        sc.source_key,
        sc.r_name,
        sc.place_id,
        p.name as place_name,
        p.category,
        COALESCE(p.images[1], p.place_images[1]) as thumbnail,
        p.visitor_reviews_score as score,
        p.visitor_reviews_total as review_count,
        p.group1,
        p.group2,
        sc.title,
        sc.content_url,
        sc.domain,
        sc.published_at,
        (CASE WHEN sc.source_key = 'all' THEN (SELECT src FROM all_source_places WHERE place_id = sc.place_id AND r_name = sc.r_name ORDER BY published_at DESC LIMIT 1) ELSE sc.source_key END) as src,
        public.v1_common_place_features(p.id) as features,
        (public.v1_common_place_interaction(p.id))->'place_liked_count' as place_liked_count,
        (public.v1_common_place_interaction(p.id))->'place_reviews_count' as place_reviews_count,
        row_number() OVER (PARTITION BY sc.source_key, sc.r_name, sc.place_id ORDER BY sc.published_at DESC) as place_rn
    FROM source_combinations sc
    JOIN tbl_place p ON sc.place_id = p.id
),
content_previews AS (
    SELECT 
        pli.*,
        row_number() OVER (PARTITION BY pli.source_key, pli.r_name ORDER BY pli.published_at DESC) as rn
    FROM place_latest_info pli
    WHERE pli.place_rn = 1
)
SELECT 
    rs.source_key::text as source,
    rs.r_name::text as region_name,
    rs.p_count as place_count,
    (
        SELECT jsonb_agg(to_jsonb(cp.*) - 'source_key' - 'r_name' - 'place_rn' - 'rn')
        FROM content_previews cp
        WHERE cp.source_key = rs.source_key AND cp.r_name = rs.r_name AND cp.rn <= 10
    ) as preview_contents
FROM region_stats rs
WITH DATA;

-- 2. 동시 갱신을 위한 유니크 인덱스 생성
CREATE UNIQUE INDEX idx_mv_region_contents_source_region ON public.mv_region_contents (source, region_name);

-- 3. v2_get_region_contents 함수 수정 (MV 조회)
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
    SELECT 
        mv.region_name,
        mv.place_count,
        mv.preview_contents
    FROM public.mv_region_contents mv
    WHERE mv.source = COALESCE(p_source, 'all')
    ORDER BY mv.place_count DESC
    LIMIT p_limit OFFSET p_offset;
END;
$$;

-- 4. Supabase Cron 설정 (3시간마다 갱신)
-- pg_cron 익스텐션이 활성화되어 있어야 합니다.
DO $$
BEGIN
    -- 기존 스케줄이 있다면 삭제
    PERFORM cron.unschedule('refresh-region-contents');
EXCEPTION WHEN OTHERS THEN
    -- 스케줄이 없는 경우 무시
END $$;

SELECT cron.schedule(
    'refresh-region-contents', 
    '0 */3 * * *', 
    'REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_region_contents'
);

COMMENT ON MATERIALIZED VIEW public.mv_region_contents IS '지역별 통합 맛집 컨텐츠 집계 데이터 (3시간 주기 갱신)';
COMMENT ON FUNCTION public.v2_get_region_contents IS '지역별 통합 맛집 컨텐츠를 조회합니다 (MV 기반 최적화)';
