-- =====================================================
-- 072_add_v2_get_places_by_region.sql
-- 피쳐 상세 페이지 지역(통합)용 장소 목록 조회 RPC 함수 정의 (v2)
-- 
-- 인자:
--   @p_region_name: 지역명 (group1)
--   @p_source: 필터링할 소스 (community, detective, folder, youtube) - NULL이면 전체
--   @p_limit: 조회할 장소 개수
--   @p_offset: 페이징 오프셋
-- 
-- 실행 방법:
--   psql "postgresql://postgres.xyqpggpilgcdsawuvpzn:ZNDqDunnaydr0aFQ@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres" -f docs/sql/072_add_v2_get_places_by_region.sql
-- =====================================================

-- 1. 지역 상세 장소 목록 조회
DROP FUNCTION IF EXISTS public.v2_get_places_by_region(text, text, integer, integer);
CREATE OR REPLACE FUNCTION public.v2_get_places_by_region(
    p_region_name text,
    p_source text DEFAULT NULL,
    p_limit integer DEFAULT 20,
    p_offset integer DEFAULT 0
)
RETURNS TABLE (
    place_id character varying,
    place_data jsonb,
    published_at timestamp with time zone,
    src text
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
            pf.place_id, 
            'community' as src, 
            pf.published_at,
            pf.title
        FROM tbl_place_features pf
        JOIN tbl_place p ON pf.place_id = p.id
        WHERE pf.platform_type = 'community' 
          AND pf.status = 'active'
          AND p.group1 = p_region_name
          AND (p_source IS NULL OR p_source = 'community')

        UNION ALL

        -- 2. 유튜브
        SELECT 
            pf.place_id, 
            'youtube' as src, 
            pf.published_at,
            pf.title
        FROM tbl_place_features pf
        JOIN tbl_place p ON pf.place_id = p.id
        WHERE pf.platform_type = 'youtube' 
          AND pf.status = 'active'
          AND p.group1 = p_region_name
          AND (p_source IS NULL OR p_source = 'youtube')

        UNION ALL

        -- 3. 플레이스 (네이버 폴더)
        SELECT 
            nfp.place_id, 
            'folder' as src, 
            p.updated_at as published_at,
            f.name as title
        FROM tbl_naver_folder_place nfp
        JOIN tbl_naver_folder f ON nfp.folder_id = f.folder_id
        JOIN tbl_place p ON nfp.place_id = p.id
        WHERE p.group1 = p_region_name
          AND (p_source IS NULL OR p_source = 'folder')

        UNION ALL

        -- 4. 맛탐정 (공개 폴더)
        SELECT 
            fp.place_id, 
            'detective' as src, 
            p.updated_at as published_at,
            f.title as title
        FROM tbl_folder_place fp
        JOIN tbl_folder f ON fp.folder_id = f.id
        JOIN tbl_place p ON fp.place_id = p.id
        WHERE f.permission = 'public'
          AND p.group1 = p_region_name
          AND (p_source IS NULL OR p_source = 'detective')
    ),
    unique_places AS (
        -- 중복 제거: 한 장소가 여러 소스에 있을 경우 가장 최신 것 선택
        SELECT DISTINCT ON (asp.place_id)
            asp.place_id,
            asp.published_at,
            asp.src,
            asp.title
        FROM all_source_places asp
        ORDER BY asp.place_id, asp.published_at DESC
    )
    SELECT 
        p.id as place_id,
        (to_jsonb(p.*) - '{themes, street_panorama, category_code_list, visitor_review_stats, algo_avg_len, algo_stdev_len, algo_revisit_rate, algo_media_ratio, algo_avg_views, algo_recency_score, algo_engagement_score, algo_length_variation_index, algo_loyalty_index, algo_growth_rate_1m, algo_growth_rate_2m, algo_growth_rate_3m}'::text[] || jsonb_build_object(
            'image_urls', COALESCE(NULLIF(p.images, '{}'), ARRAY_REMOVE(ARRAY[p.place_images[1]], NULL), '{}'),
            'images', COALESCE(NULLIF(p.images, '{}'), ARRAY_REMOVE(ARRAY[p.place_images[1]], NULL), '{}'),
            'avg_price', calculate_menu_avg_price(p.menus),
            'interaction', public.v1_common_place_interaction(p.id),
            'features', public.v1_common_place_features(p.id),
            'experience', public.v1_get_place_experience(p.id),
            'voted_summary_text', (
                SELECT (v->>'description')::text
                FROM tbl_place_analysis a, jsonb_array_elements(a.voted) v
                WHERE a.business_id = p.id
                LIMIT 1
            )
        )) as place_data,
        up.published_at,
        up.src
    FROM unique_places up
    JOIN tbl_place p ON up.place_id = p.id
    ORDER BY up.published_at DESC
    LIMIT p_limit OFFSET p_offset;
END;
$$;

COMMENT ON FUNCTION public.v2_get_places_by_region IS '특정 지역의 통합 맛집 장소 목록을 조회합니다.';
GRANT EXECUTE ON FUNCTION public.v2_get_places_by_region TO authenticated, anon;


-- 2. 지역 상세 정보 조회
DROP FUNCTION IF EXISTS public.v2_get_region_info(text);
DROP FUNCTION IF EXISTS public.v2_get_region_info(text, text);
CREATE OR REPLACE FUNCTION public.v2_get_region_info(
    p_region_name text,
    p_source text DEFAULT NULL
)
RETURNS TABLE (
    region_name text,
    place_count bigint,
    is_subscribed boolean,
    subscriber_count bigint
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, public
AS $$
BEGIN
    RETURN QUERY
    WITH stats AS (
        SELECT count(DISTINCT place_id) as p_count
        FROM (
            -- 1. 커뮤니티 & 유튜브
            SELECT pf.place_id FROM tbl_place_features pf 
            JOIN tbl_place p ON pf.place_id = p.id 
            WHERE p.group1 = p_region_name 
              AND pf.status = 'active'
              AND (p_source IS NULL OR pf.platform_type = p_source)
            
            UNION
            
            -- 2. 플레이스 (네이버 폴더)
            SELECT nfp.place_id FROM tbl_naver_folder_place nfp
            JOIN tbl_place p ON nfp.place_id = p.id
            WHERE p.group1 = p_region_name
              AND (p_source IS NULL OR p_source = 'folder')
            
            UNION
            
            -- 3. 맛탐정 (공개 폴더)
            SELECT fp.place_id FROM tbl_folder_place fp
            JOIN tbl_folder f ON fp.folder_id = f.id
            JOIN tbl_place p ON fp.place_id = p.id
            WHERE p.group1 = p_region_name 
              AND f.permission = 'public'
              AND (p_source IS NULL OR p_source = 'detective')
        ) t
    ),
    sub_stats AS (
        SELECT count(*) as s_count
        FROM tbl_feature_subscription
        WHERE feature_type = 'region_recommend'
          AND feature_id = p_region_name
          AND deleted_at IS NULL
    )
    SELECT 
        p_region_name as region_name,
        (SELECT p_count FROM stats),
        COALESCE((
            SELECT EXISTS(
                SELECT 1 FROM tbl_feature_subscription fs
                WHERE fs.feature_type = 'region_recommend'
                  AND fs.feature_id = p_region_name
                  AND fs.user_id = auth.uid()
                  AND fs.deleted_at IS NULL
            )
        ), false) as is_subscribed,
        (SELECT s_count FROM sub_stats);
END;
$$;

COMMENT ON FUNCTION public.v2_get_region_info IS '지역 정보를 조회합니다.';
GRANT EXECUTE ON FUNCTION public.v2_get_region_info TO authenticated, anon;


-- 3. 지역 상세 지도용 경량 목록 조회
DROP FUNCTION IF EXISTS public.v2_get_places_by_region_for_map(text, text);
CREATE OR REPLACE FUNCTION public.v2_get_places_by_region_for_map(
    p_region_name text,
    p_source text DEFAULT NULL
)
RETURNS TABLE (
    place_id character varying,
    name character varying,
    x character varying,
    y character varying
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, public
AS $$
BEGIN
    RETURN QUERY
    WITH all_source_places AS (
        SELECT pf.place_id FROM tbl_place_features pf 
        JOIN tbl_place p ON pf.place_id = p.id 
        WHERE p.group1 = p_region_name AND pf.status = 'active'
          AND (p_source IS NULL OR (pf.platform_type = p_source))
        UNION
        SELECT nfp.place_id FROM tbl_naver_folder_place nfp
        JOIN tbl_place p ON nfp.place_id = p.id
        WHERE p.group1 = p_region_name
          AND (p_source IS NULL OR p_source = 'folder')
        UNION
        SELECT fp.place_id FROM tbl_folder_place fp
        JOIN tbl_folder f ON fp.folder_id = f.id
        JOIN tbl_place p ON fp.place_id = p.id
        WHERE p.group1 = p_region_name AND f.permission = 'public'
          AND (p_source IS NULL OR p_source = 'detective')
    )
    SELECT 
        p.id as place_id,
        p.name,
        p.x,
        p.y
    FROM all_source_places asp
    JOIN tbl_place p ON asp.place_id = p.id;
END;
$$;

COMMENT ON FUNCTION public.v2_get_places_by_region_for_map IS '지역 내의 모든 장소를 지도용으로 조회합니다.';
GRANT EXECUTE ON FUNCTION public.v2_get_places_by_region_for_map TO authenticated, anon;
