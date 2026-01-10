-- =====================================================
-- 029_v2_feature_detail_functions.sql
-- 피쳐 상세 페이지용 장소 목록 조회 RPC 함수 정의 (v2)
-- 
-- 인자:
--   @p_id: 폴더 ID 또는 채널 ID
--   @p_region: 커뮤니티 지역명
--   @p_domain: 커뮤니티 도메인
--   @p_limit: 조회할 장소 개수
--   @p_offset: 페이징 오프셋
-- 
-- 실행 방법:
--   psql "postgresql://postgres.xyqpggpilgcdsawuvpzn:ZNDqDunnaydr0aFQ@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres" -f docs/sql/029_v2_feature_detail_functions.sql
-- =====================================================

-- 기존 함수 삭제 (반환 타입 변경을 위함)
DROP FUNCTION IF EXISTS public.v2_get_places_by_naver_folder(bigint, integer, integer);
DROP FUNCTION IF EXISTS public.v2_get_places_by_youtube_channel(text, integer, integer);
DROP FUNCTION IF EXISTS public.v2_get_places_by_community_region(text, text, integer, integer);

-- 1. 네이버 폴더 상세 장소 목록 조회
CREATE OR REPLACE FUNCTION public.v2_get_places_by_naver_folder(
    p_folder_id bigint,
    p_limit integer DEFAULT 20,
    p_offset integer DEFAULT 0
)
RETURNS TABLE (
    id character varying,
    name character varying,
    category character varying,
    address character varying,
    road_address character varying,
    thumbnail character varying,
    images character varying[],
    visitor_reviews_score numeric,
    visitor_reviews_total integer,
    avg_price integer,
    voted_summary_text text,
    group1 character varying,
    group2 character varying,
    group3 character varying,
    x character varying,
    y character varying
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.name,
        p.category,
        p.address,
        p.road_address,
        p.images[1] as thumbnail,
        p.images,
        p.visitor_reviews_score,
        p.visitor_reviews_total,
        calculate_menu_avg_price(p.menus) as avg_price,
        (
            SELECT (v->>'description')::text
            FROM tbl_place_analysis a, jsonb_array_elements(a.voted) v
            WHERE a.business_id = p.id
            LIMIT 1
        ) as voted_summary_text,
        p.group1,
        p.group2,
        p.group3,
        p.x,
        p.y
    FROM tbl_naver_folder_place fp 
    JOIN tbl_place p ON fp.place_id = p.id
    WHERE fp.folder_id = p_folder_id
    ORDER BY p.visitor_reviews_score DESC NULLS LAST, p.visitor_reviews_total DESC NULLS LAST
    LIMIT p_limit OFFSET p_offset;
END;
$$;

COMMENT ON FUNCTION public.v2_get_places_by_naver_folder IS '네이버 폴더 내의 모든 장소를 조회합니다.';
GRANT EXECUTE ON FUNCTION public.v2_get_places_by_naver_folder TO authenticated, anon;

-- 2. 유튜브 채널 상세 장소 목록 조회
CREATE OR REPLACE FUNCTION public.v2_get_places_by_youtube_channel(
    p_channel_id text,
    p_limit integer DEFAULT 20,
    p_offset integer DEFAULT 0
)
RETURNS TABLE (
    id character varying,
    name character varying,
    category character varying,
    address character varying,
    road_address character varying,
    thumbnail character varying,
    images character varying[],
    visitor_reviews_score numeric,
    visitor_reviews_total integer,
    avg_price integer,
    voted_summary_text text,
    group1 character varying,
    group2 character varying,
    group3 character varying,
    x character varying,
    y character varying,
    published_at timestamp with time zone
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, public
AS $$
BEGIN
    RETURN QUERY
    WITH unique_places AS (
        SELECT DISTINCT ON (f.place_id)
            f.place_id,
            f.published_at
        FROM tbl_place_features f
        WHERE f.platform_type = 'youtube'
          AND f.status = 'active'
          AND f.metadata->>'channelId' = p_channel_id
        ORDER BY f.place_id, f.published_at DESC
    )
    SELECT 
        p.id,
        p.name,
        p.category,
        p.address,
        p.road_address,
        p.images[1] as thumbnail,
        p.images,
        p.visitor_reviews_score,
        p.visitor_reviews_total,
        calculate_menu_avg_price(p.menus) as avg_price,
        (
            SELECT (v->>'description')::text
            FROM tbl_place_analysis a, jsonb_array_elements(a.voted) v
            WHERE a.business_id = p.id
            LIMIT 1
        ) as voted_summary_text,
        p.group1,
        p.group2,
        p.group3,
        p.x,
        p.y,
        up.published_at
    FROM unique_places up
    JOIN tbl_place p ON up.place_id = p.id
    ORDER BY up.published_at DESC
    LIMIT p_limit OFFSET p_offset;
END;
$$;

COMMENT ON FUNCTION public.v2_get_places_by_youtube_channel IS '유튜브 채널에서 소개된 모든 장소를 조회합니다.';
GRANT EXECUTE ON FUNCTION public.v2_get_places_by_youtube_channel TO authenticated, anon;

-- 3. 커뮤니티 지역 상세 장소 목록 조회
CREATE OR REPLACE FUNCTION public.v2_get_places_by_community_region(
    p_region_name text,
    p_domain text DEFAULT NULL,
    p_limit integer DEFAULT 20,
    p_offset integer DEFAULT 0
)
RETURNS TABLE (
    id character varying,
    name character varying,
    category character varying,
    address character varying,
    road_address character varying,
    thumbnail character varying,
    images character varying[],
    visitor_reviews_score numeric,
    visitor_reviews_total integer,
    avg_price integer,
    voted_summary_text text,
    group1 character varying,
    group2 character varying,
    group3 character varying,
    x character varying,
    y character varying,
    published_at timestamp with time zone
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, public
AS $$
BEGIN
    RETURN QUERY
    WITH unique_places AS (
        SELECT DISTINCT ON (pf.place_id)
            pf.place_id,
            pf.published_at
        FROM tbl_place_features pf
        JOIN tbl_place p ON pf.place_id = p.id
        WHERE pf.platform_type = 'community'
          AND pf.status = 'active'
          AND p.group1 = p_region_name
          AND (p_domain IS NULL OR pf.metadata->>'domain' = p_domain)
        ORDER BY pf.place_id, pf.published_at DESC
    )
    SELECT 
        p.id,
        p.name,
        p.category,
        p.address,
        p.road_address,
        p.images[1] as thumbnail,
        p.images,
        p.visitor_reviews_score,
        p.visitor_reviews_total,
        calculate_menu_avg_price(p.menus) as avg_price,
        (
            SELECT (v->>'description')::text
            FROM tbl_place_analysis a, jsonb_array_elements(a.voted) v
            WHERE a.business_id = p.id
            LIMIT 1
        ) as voted_summary_text,
        p.group1,
        p.group2,
        p.group3,
        p.x,
        p.y,
        up.published_at
    FROM unique_places up
    JOIN tbl_place p ON up.place_id = p.id
    ORDER BY up.published_at DESC
    LIMIT p_limit OFFSET p_offset;
END;
$$;

COMMENT ON FUNCTION public.v2_get_places_by_community_region IS '커뮤니티에서 언급된 특정 지역의 모든 장소를 조회합니다.';
GRANT EXECUTE ON FUNCTION public.v2_get_places_by_community_region TO authenticated, anon;

-- 4. 네이버 폴더 정보 조회
DROP FUNCTION IF EXISTS public.v2_get_naver_folder_info(bigint);
CREATE OR REPLACE FUNCTION public.v2_get_naver_folder_info(p_folder_id bigint)
RETURNS TABLE (
    folder_id bigint,
    name text,
    memo text,
    place_count bigint,
    share_id text,
    is_subscribed boolean
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        f.folder_id,
        f.name::text,
        f.memo,
        (SELECT count(*) FROM tbl_naver_folder_place fp WHERE fp.folder_id = f.folder_id) as place_count,
        f.share_id::text,
        COALESCE((
            SELECT EXISTS(
                SELECT 1 FROM tbl_feature_subscription fs
                WHERE fs.feature_type = 'naver_folder'
                  AND fs.feature_id = f.folder_id::text
                  AND fs.user_id = auth.uid()
                  AND fs.deleted_at IS NULL
            )
        ), false) as is_subscribed
    FROM tbl_naver_folder f
    WHERE f.folder_id = p_folder_id;
END;
$$;

COMMENT ON FUNCTION public.v2_get_naver_folder_info IS '네이버 폴더 정보를 조회합니다.';
GRANT EXECUTE ON FUNCTION public.v2_get_naver_folder_info TO authenticated, anon;

-- 5. 유튜브 채널 정보 조회
DROP FUNCTION IF EXISTS public.v2_get_youtube_channel_info(text);
CREATE OR REPLACE FUNCTION public.v2_get_youtube_channel_info(p_channel_id text)
RETURNS TABLE (
    channel_id text,
    channel_title text,
    channel_thumbnail text,
    description text,
    place_count bigint,
    is_subscribed boolean
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        metadata->>'channelId' as c_id,
        MAX(metadata->>'channelTitle') as c_title,
        MAX(metadata->'thumbnails'->'medium'->>'url') as c_thumb,
        MAX(metadata->'localized'->>'description') as c_desc,
        count(DISTINCT place_id) as p_count,
        COALESCE((
            SELECT EXISTS(
                SELECT 1 FROM tbl_feature_subscription fs
                WHERE fs.feature_type = 'youtube_channel'
                  AND fs.feature_id = p_channel_id
                  AND fs.user_id = auth.uid()
                  AND fs.deleted_at IS NULL
            )
        ), false) as is_subscribed
    FROM tbl_place_features
    WHERE platform_type = 'youtube'
      AND status = 'active'
      AND metadata->>'channelId' = p_channel_id
    GROUP BY 1;
END;
$$;

COMMENT ON FUNCTION public.v2_get_youtube_channel_info IS '유튜브 채널 정보를 조회합니다.';
GRANT EXECUTE ON FUNCTION public.v2_get_youtube_channel_info TO authenticated, anon;

-- 6. 커뮤니티 지역 정보 조회
CREATE OR REPLACE FUNCTION public.v2_get_community_region_info(p_region_name text)
RETURNS TABLE (
    region_name text,
    place_count bigint,
    is_subscribed boolean
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p_region_name as region_name,
        count(DISTINCT pf.place_id) as place_count,
        COALESCE((
            SELECT EXISTS(
                SELECT 1 FROM tbl_feature_subscription fs
                WHERE fs.feature_type = 'community_region'
                  AND fs.feature_id = p_region_name
                  AND fs.user_id = auth.uid()
                  AND fs.deleted_at IS NULL
            )
        ), false) as is_subscribed
    FROM tbl_place_features pf
    JOIN tbl_place p ON pf.place_id = p.id
    WHERE pf.platform_type = 'community'
      AND pf.status = 'active'
      AND p.group1 = p_region_name;
END;
$$;

COMMENT ON FUNCTION public.v2_get_community_region_info IS '커뮤니티 지역 정보를 조회합니다.';
GRANT EXECUTE ON FUNCTION public.v2_get_community_region_info TO authenticated, anon;
