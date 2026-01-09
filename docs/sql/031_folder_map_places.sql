-- =====================================================
-- 031_folder_map_places.sql
-- 피쳐(네이버폴더, 유튜브, 커뮤니티, 맛탐정) 지도 표시용 장소 목록 조회 함수
-- 
-- 실행 방법:
--   psql "postgresql://postgres.xyqpggpilgcdsawuvpzn:ZNDqDunnaydr0aFQ@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres" -f docs/sql/031_folder_map_places.sql
-- =====================================================

-- =====================================================
-- 1. 맛탐정 폴더 (tbl_folder) 지도용 조회
-- =====================================================
DROP FUNCTION IF EXISTS public.v1_get_folder_places_for_map(VARCHAR);
CREATE OR REPLACE FUNCTION public.v1_get_folder_places_for_map(
    p_folder_id VARCHAR
)
RETURNS TABLE (
    place_id VARCHAR,
    name VARCHAR,
    x VARCHAR,
    y VARCHAR
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
#variable_conflict use_column
DECLARE
    v_user_id UUID;
    v_folder_owner_id UUID;
    v_folder_permission VARCHAR;
    v_is_owner BOOLEAN;
    v_is_subscribed BOOLEAN;
BEGIN
    v_user_id := auth.uid();

    -- 폴더 정보 및 권한 확인
    SELECT f.owner_id, f.permission INTO v_folder_owner_id, v_folder_permission 
    FROM public.tbl_folder f
    WHERE f.id = p_folder_id AND f.is_hidden = FALSE;

    IF v_folder_owner_id IS NULL THEN
        RETURN;
    END IF;

    v_is_owner := (v_user_id IS NOT NULL AND v_folder_owner_id = v_user_id);

    -- 구독 여부 확인
    IF v_user_id IS NOT NULL THEN
        SELECT EXISTS (
            SELECT 1 FROM public.tbl_folder_subscribed sub
            WHERE sub.folder_id = p_folder_id AND sub.user_id = v_user_id AND sub.deleted_at IS NULL
        ) INTO v_is_subscribed;
    ELSE
        v_is_subscribed := FALSE;
    END IF;

    -- 접근 권한 체크
    IF v_folder_permission = 'hidden' AND NOT v_is_owner THEN
        RETURN;
    END IF;

    IF v_folder_permission = 'invite' AND NOT (v_is_owner OR v_is_subscribed) THEN
        RETURN;
    END IF;

    IF v_folder_permission = 'default' AND NOT v_is_owner THEN
        RETURN;
    END IF;

    -- 지도용 경량 데이터 반환 (전체 목록, 페이지네이션 없음)
    RETURN QUERY
    SELECT 
        pl.id AS place_id,
        pl.name,
        pl.x,
        pl.y
    FROM public.tbl_folder_place fp
    JOIN public.tbl_place pl ON fp.place_id = pl.id
    WHERE fp.folder_id = p_folder_id 
      AND fp.deleted_at IS NULL
      AND pl.x IS NOT NULL 
      AND pl.y IS NOT NULL
    ORDER BY fp.created_at DESC;
END;
$$;

COMMENT ON FUNCTION public.v1_get_folder_places_for_map IS '맛탐정 폴더 내 장소의 지도 표시용 경량 데이터 조회 (전체 목록)';


-- =====================================================
-- 2. 네이버 폴더 (tbl_naver_folder) 지도용 조회
-- =====================================================
DROP FUNCTION IF EXISTS public.v2_get_places_by_naver_folder_for_map(BIGINT);
CREATE OR REPLACE FUNCTION public.v2_get_places_by_naver_folder_for_map(
    p_folder_id BIGINT
)
RETURNS TABLE (
    place_id VARCHAR,
    name VARCHAR,
    x VARCHAR,
    y VARCHAR
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id AS place_id,
        p.name,
        p.x,
        p.y
    FROM public.tbl_naver_folder_place nfp
    JOIN public.tbl_place p ON nfp.place_id = p.id
    WHERE nfp.folder_id = p_folder_id
      AND p.x IS NOT NULL 
      AND p.y IS NOT NULL
    ORDER BY p.name;
END;
$$;

COMMENT ON FUNCTION public.v2_get_places_by_naver_folder_for_map IS '네이버 폴더 내 장소의 지도 표시용 경량 데이터 조회 (전체 목록)';


-- =====================================================
-- 3. 유튜브 채널 지도용 조회
-- =====================================================
DROP FUNCTION IF EXISTS public.v2_get_places_by_youtube_channel_for_map(VARCHAR);
CREATE OR REPLACE FUNCTION public.v2_get_places_by_youtube_channel_for_map(
    p_channel_id VARCHAR
)
RETURNS TABLE (
    place_id VARCHAR,
    name VARCHAR,
    x VARCHAR,
    y VARCHAR
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id AS place_id,
        p.name,
        p.x,
        p.y
    FROM public.tbl_place_features pf
    JOIN public.tbl_place p ON pf.place_id = p.id
    WHERE pf.platform_type = 'youtube'
      AND pf.metadata->>'channelId' = p_channel_id
      AND pf.status = 'active'
      AND p.x IS NOT NULL 
      AND p.y IS NOT NULL
    ORDER BY pf.published_at DESC;
END;
$$;

COMMENT ON FUNCTION public.v2_get_places_by_youtube_channel_for_map IS '유튜브 채널 내 장소의 지도 표시용 경량 데이터 조회 (전체 목록)';


-- =====================================================
-- 4. 커뮤니티 지역 지도용 조회
-- =====================================================
DROP FUNCTION IF EXISTS public.v2_get_places_by_community_region_for_map(VARCHAR, VARCHAR);
CREATE OR REPLACE FUNCTION public.v2_get_places_by_community_region_for_map(
    p_region_name VARCHAR,
    p_domain VARCHAR DEFAULT NULL
)
RETURNS TABLE (
    place_id VARCHAR,
    name VARCHAR,
    x VARCHAR,
    y VARCHAR
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id AS place_id,
        p.name,
        p.x,
        p.y
    FROM public.tbl_place_features pf
    JOIN public.tbl_place p ON pf.place_id = p.id
    WHERE pf.platform_type = 'community'
      AND p.group1 = p_region_name
      AND (p_domain IS NULL OR pf.metadata->>'domain' = p_domain)
      AND pf.status = 'active'
      AND p.x IS NOT NULL 
      AND p.y IS NOT NULL
    ORDER BY pf.published_at DESC;
END;
$$;

COMMENT ON FUNCTION public.v2_get_places_by_community_region_for_map IS '커뮤니티 지역 내 장소의 지도 표시용 경량 데이터 조회 (전체 목록)';
