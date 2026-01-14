-- =====================================================
-- 002_create_functions.sql
-- 인스타그램 데이터 관리를 위한 RPC 함수 정의 (중복 컬럼 참조 수정 버전)
-- 
-- 실행 방법:
--   psql "postgresql://postgres.xyqpggpilgcdsawuvpzn:ZNDqDunnaydr0aFQ@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres" -f docs/sql/insta-gram/002_create_functions.sql
-- =====================================================

-- 1. 사용자 정보 등록/수정 (Upsert)
CREATE OR REPLACE FUNCTION public.v1_set_insta_user(
    p_id TEXT,
    p_user_name TEXT,
    p_full_name TEXT DEFAULT NULL,
    p_bio TEXT DEFAULT NULL,
    p_followers INTEGER DEFAULT 0
)
RETURNS public.tbl_instagram_user
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_result public.tbl_instagram_user;
BEGIN
    INSERT INTO public.tbl_instagram_user (id, user_name, full_name, bio, followers)
    VALUES (p_id, p_user_name, p_full_name, p_bio, p_followers)
    ON CONFLICT (id) DO UPDATE SET
        user_name = EXCLUDED.user_name,
        full_name = EXCLUDED.full_name,
        bio = EXCLUDED.bio,
        followers = EXCLUDED.followers,
        updated_at = now()
    RETURNING * INTO v_result;

    RETURN v_result;
END;
$$;

COMMENT ON FUNCTION public.v1_set_insta_user IS '인스타그램 사용자 정보 등록 및 업데이트 (Upsert)';
GRANT EXECUTE ON FUNCTION public.v1_set_insta_user TO authenticated, service_role;

-- 2. 콘텐츠 정보 등록/수정 (Upsert)
CREATE OR REPLACE FUNCTION public.v1_set_insta_content(
    p_id TEXT,
    p_code TEXT,
    p_taken_at TIMESTAMPTZ,
    p_caption TEXT DEFAULT NULL
)
RETURNS public.tbl_instagram_content
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id TEXT;
    v_result public.tbl_instagram_content;
BEGIN
    -- ID 패턴: [content_id]_[user_id]
    v_user_id := split_part(p_id, '_', 2);
    
    IF v_user_id = '' THEN
        RAISE EXCEPTION 'Invalid content ID format. Expected [content_id]_[user_id]';
    END IF;

    -- 사용자가 존재하는지 확인
    IF NOT EXISTS (SELECT 1 FROM public.tbl_instagram_user u WHERE u.id = v_user_id) THEN
        RAISE EXCEPTION 'User with ID % does not exist. Register the user first.', v_user_id;
    END IF;

    INSERT INTO public.tbl_instagram_content (id, user_id, code, taken_at, caption)
    VALUES (p_id, v_user_id, p_code, p_taken_at, p_caption)
    ON CONFLICT (id) DO UPDATE SET
        code = EXCLUDED.code,
        taken_at = EXCLUDED.taken_at,
        caption = EXCLUDED.caption,
        updated_at = now()
    RETURNING * INTO v_result;

    RETURN v_result;
END;
$$;

COMMENT ON FUNCTION public.v1_set_insta_content IS '인스타그램 콘텐츠 등록 및 업데이트. ID에서 user_id를 자동으로 추출합니다.';
GRANT EXECUTE ON FUNCTION public.v1_set_insta_content TO authenticated, service_role;

-- 2-1. 콘텐츠 정보 일괄 등록/수정 (Bulk Upsert)
CREATE OR REPLACE FUNCTION public.v1_set_insta_contents(
    p_contents JSONB
)
RETURNS TABLE (
    success_count INTEGER,
    error_count INTEGER,
    errors JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_content JSONB;
    v_user_id TEXT;
    v_success_count INTEGER := 0;
    v_error_count INTEGER := 0;
    v_errors JSONB := '[]'::JSONB;
    v_error_record JSONB;
BEGIN
    -- JSONB 배열을 순회하며 각 콘텐츠 처리
    FOR v_content IN SELECT * FROM jsonb_array_elements(p_contents)
    LOOP
        BEGIN
            -- ID 패턴: [content_id]_[user_id]
            v_user_id := split_part(v_content->>'id', '_', 2);
            
            IF v_user_id = '' OR v_user_id IS NULL THEN
                v_error_count := v_error_count + 1;
                v_error_record := jsonb_build_object(
                    'id', v_content->>'id',
                    'error', 'Invalid content ID format. Expected [content_id]_[user_id]'
                );
                v_errors := v_errors || v_error_record;
                CONTINUE;
            END IF;

            -- 사용자가 존재하는지 확인
            IF NOT EXISTS (SELECT 1 FROM public.tbl_instagram_user u WHERE u.id = v_user_id) THEN
                v_error_count := v_error_count + 1;
                v_error_record := jsonb_build_object(
                    'id', v_content->>'id',
                    'error', format('User with ID %s does not exist. Register the user first.', v_user_id)
                );
                v_errors := v_errors || v_error_record;
                CONTINUE;
            END IF;

            -- Upsert 실행
            INSERT INTO public.tbl_instagram_content (id, user_id, code, taken_at, caption)
            VALUES (
                v_content->>'id',
                v_user_id,
                v_content->>'code',
                (v_content->>'taken_at')::TIMESTAMPTZ,
                v_content->>'caption'
            )
            ON CONFLICT (id) DO UPDATE SET
                code = EXCLUDED.code,
                taken_at = EXCLUDED.taken_at,
                caption = EXCLUDED.caption,
                updated_at = now();

            v_success_count := v_success_count + 1;
        EXCEPTION WHEN OTHERS THEN
            v_error_count := v_error_count + 1;
            v_error_record := jsonb_build_object(
                'id', COALESCE(v_content->>'id', 'unknown'),
                'error', SQLERRM
            );
            v_errors := v_errors || v_error_record;
        END;
    END LOOP;

    RETURN QUERY SELECT v_success_count, v_error_count, v_errors;
END;
$$;

COMMENT ON FUNCTION public.v1_set_insta_contents IS '인스타그램 콘텐츠 일괄 등록 및 업데이트 (Bulk Upsert). JSONB 배열을 받아 처리합니다.';
GRANT EXECUTE ON FUNCTION public.v1_set_insta_contents TO authenticated, service_role;

-- 3. 사용자 목록 조회 (통계 포함)
CREATE OR REPLACE FUNCTION public.v1_get_insta_user_list(
    p_page INTEGER DEFAULT 1,
    p_page_size INTEGER DEFAULT 20
)
RETURNS TABLE (
    id TEXT,
    user_name TEXT,
    full_name TEXT,
    bio TEXT,
    followers INTEGER,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    content_count BIGINT,
    place_filled_count BIGINT,
    last_content_at TIMESTAMPTZ,
    total_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_offset INTEGER := (p_page - 1) * p_page_size;
    v_total BIGINT;
BEGIN
    SELECT count(*) INTO v_total FROM public.tbl_instagram_user;

    RETURN QUERY
    SELECT 
        u.id,
        u.user_name,
        u.full_name,
        u.bio,
        u.followers,
        u.created_at,
        u.updated_at,
        (SELECT count(*) FROM public.tbl_instagram_content c WHERE c.user_id = u.id AND c.is_hidden = false) as content_count,
        (SELECT count(*) FROM public.tbl_instagram_content c 
         WHERE c.user_id = u.id AND c.is_place = true AND c.is_hidden = false) as place_filled_count,
        (SELECT max(c.taken_at) FROM public.tbl_instagram_content c WHERE c.user_id = u.id AND c.is_hidden = false) as last_content_at,
        v_total as total_count
    FROM public.tbl_instagram_user u
    ORDER BY u.created_at DESC
    LIMIT p_page_size
    OFFSET v_offset;
END;
$$;

COMMENT ON FUNCTION public.v1_get_insta_user_list IS '인스타그램 사용자 목록 조회 (통계 및 페이징 포함, 숨김 처리된 콘텐츠 제외)';
GRANT EXECUTE ON FUNCTION public.v1_get_insta_user_list TO authenticated, service_role;

-- 4. 콘텐츠 목록 조회 (사용자 정보 Join)
DROP FUNCTION IF EXISTS public.v1_get_insta_content_list(TEXT, BOOLEAN, INTEGER, INTEGER);
CREATE OR REPLACE FUNCTION public.v1_get_insta_content_list(
    p_user_id TEXT DEFAULT NULL,
    p_is_place BOOLEAN DEFAULT NULL,
    p_page INTEGER DEFAULT 1,
    p_page_size INTEGER DEFAULT 50,
    p_show_hidden BOOLEAN DEFAULT false
)
RETURNS TABLE (
    id TEXT,
    user_id TEXT,
    user_name TEXT,
    code TEXT,
    taken_at TIMESTAMPTZ,
    caption TEXT,
    is_place BOOLEAN,
    is_hidden BOOLEAN,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    total_count BIGINT,
    mapped_places JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_offset INTEGER := (p_page - 1) * p_page_size;
    v_total BIGINT;
BEGIN
    -- 필터 조건에 맞는 전체 개수 계산
    SELECT count(*) INTO v_total 
    FROM public.tbl_instagram_content tc
    WHERE (p_user_id IS NULL OR tc.user_id = p_user_id)
      AND (p_is_place IS NULL OR tc.is_place = p_is_place)
      AND (p_show_hidden = true OR tc.is_hidden = false);

    RETURN QUERY
    SELECT 
        c.id,
        c.user_id,
        u.user_name,
        c.code,
        c.taken_at,
        c.caption,
        c.is_place,
        c.is_hidden,
        c.created_at,
        c.updated_at,
        v_total as total_count,
        (
            SELECT jsonb_agg(jsonb_build_object(
                'place_id', p.id,
                'place_name', p.name,
                'thumbnail_url', p.images[1]
            ))
            FROM public.tbl_instagram_place ip
            JOIN public.tbl_place p ON ip.place_id = p.id
            WHERE ip.content_id = c.id
        ) as mapped_places
    FROM public.tbl_instagram_content c
    JOIN public.tbl_instagram_user u ON c.user_id = u.id
    WHERE (p_user_id IS NULL OR c.user_id = p_user_id)
      AND (p_is_place IS NULL OR c.is_place = p_is_place)
      AND (p_show_hidden = true OR c.is_hidden = false)
    ORDER BY c.taken_at DESC
    LIMIT p_page_size
    OFFSET v_offset;
END;
$$;

COMMENT ON FUNCTION public.v1_get_insta_content_list IS '인스타그램 콘텐츠 목록 조회 (사용자 정보 조인, 매핑된 업체 포함, 숨김 처리 필터 포함 및 페이징)';
GRANT EXECUTE ON FUNCTION public.v1_get_insta_content_list TO authenticated, service_role;

-- 5. 업체 정보 심플 조회 (ID 기반)
CREATE OR REPLACE FUNCTION public.v1_list_places_simple_by_ids(
    p_place_ids TEXT[]
)
RETURNS TABLE (
    place_id TEXT,
    place_name TEXT,
    thumbnail_url TEXT,
    road_address TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        id::TEXT as place_id,
        name::TEXT as place_name,
        images[1]::TEXT as thumbnail_url,
        public.tbl_place.road_address::TEXT
    FROM public.tbl_place
    WHERE id = ANY(p_place_ids);
END;
$$;

COMMENT ON FUNCTION public.v1_list_places_simple_by_ids IS '장소 ID 목록으로 최소 정보(ID, 이름, 썸네일, 주소)만 조회';
GRANT EXECUTE ON FUNCTION public.v1_list_places_simple_by_ids TO authenticated, service_role;

-- 6. 인스타그램 업체 매핑 추가
CREATE OR REPLACE FUNCTION public.v1_add_instagram_places(
    p_content_id TEXT,
    p_place_ids TEXT[]
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- 업체 매핑 추가 (중복 무시)
    INSERT INTO public.tbl_instagram_place (content_id, place_id)
    SELECT p_content_id, unnest(p_place_ids)
    ON CONFLICT (content_id, place_id) DO NOTHING;

    -- is_place 자동 업데이트 (true)
    UPDATE public.tbl_instagram_content
    SET is_place = true
    WHERE id = p_content_id;
END;
$$;

COMMENT ON FUNCTION public.v1_add_instagram_places IS '콘텐츠에 여러 업체 매핑 추가 및 업체 여부(is_place) 자동 업데이트';
GRANT EXECUTE ON FUNCTION public.v1_add_instagram_places TO authenticated, service_role;

-- 7. 인스타그램 업체 매핑 제거
CREATE OR REPLACE FUNCTION public.v1_remove_instagram_place(
    p_content_id TEXT,
    p_place_id TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- 업체 매핑 제거
    DELETE FROM public.tbl_instagram_place
    WHERE content_id = p_content_id AND place_id = p_place_id;

    -- is_place 자동 업데이트
    UPDATE public.tbl_instagram_content
    SET is_place = EXISTS (
        SELECT 1 FROM public.tbl_instagram_place WHERE content_id = p_content_id
    )
    WHERE id = p_content_id;
END;
$$;

COMMENT ON FUNCTION public.v1_remove_instagram_place IS '콘텐츠에서 특정 업체 매핑 제거 및 업체 여부(is_place) 자동 업데이트';
GRANT EXECUTE ON FUNCTION public.v1_remove_instagram_place TO authenticated, service_role;

-- 8. 인스타그램 업체 여부 수동 설정 (비업체 지정용)
CREATE OR REPLACE FUNCTION public.v1_set_insta_content_is_place(
    p_content_id TEXT,
    p_is_place BOOLEAN
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE public.tbl_instagram_content
    SET is_place = p_is_place
    WHERE id = p_content_id;
    
    -- 만약 비업체(false)로 지정하면 기존 매핑 데이터 삭제
    IF p_is_place = false THEN
        DELETE FROM public.tbl_instagram_place WHERE content_id = p_content_id;
    END IF;
END;
$$;

COMMENT ON FUNCTION public.v1_set_insta_content_is_place IS '콘텐츠의 업체 여부를 수동으로 설정 (비업체 지정 시 매핑 데이터 삭제)';
GRANT EXECUTE ON FUNCTION public.v1_set_insta_content_is_place TO authenticated, service_role;

-- 9. 인스타그램 콘텐츠 숨김 설정
CREATE OR REPLACE FUNCTION public.v1_set_insta_content_hidden(
    p_content_id TEXT,
    p_is_hidden BOOLEAN
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE public.tbl_instagram_content
    SET is_hidden = p_is_hidden
    WHERE id = p_content_id;
END;
$$;

COMMENT ON FUNCTION public.v1_set_insta_content_hidden IS '콘텐츠의 숨김 여부를 설정합니다.';
GRANT EXECUTE ON FUNCTION public.v1_set_insta_content_hidden TO authenticated, service_role;

-- 기존 함수 삭제
DROP FUNCTION IF EXISTS public.v1_update_insta_content_place(TEXT, BOOLEAN, TEXT, TEXT);
