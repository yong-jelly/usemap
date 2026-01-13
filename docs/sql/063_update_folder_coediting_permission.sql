-- =====================================================
-- 063_update_folder_coediting_permission.sql
-- 공개 폴더에서도 공동 편집(함께 편집) 기능을 지원하도록 권한 로직 수정
-- =====================================================
-- 실행 방법:
--   psql "postgresql://postgres.xyqpggpilgcdsawuvpzn:ZNDqDunnaydr0aFQ@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres" -f docs/sql/063_update_folder_coediting_permission.sql

-- 1. 폴더 접근 권한 체크 함수 수정 (public 권한에서도 can_edit 허용)
CREATE OR REPLACE FUNCTION public.v1_check_folder_access(
    p_folder_id VARCHAR
)
RETURNS TABLE (
    access VARCHAR,
    can_view BOOLEAN,
    can_edit BOOLEAN,
    is_owner BOOLEAN,
    is_subscribed BOOLEAN,
    is_unlisted BOOLEAN,
    is_default BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
#variable_conflict use_column
DECLARE
    v_user_id UUID;
    v_folder RECORD;
    v_is_owner BOOLEAN;
    v_is_subscribed BOOLEAN;
BEGIN
    v_user_id := auth.uid();

    SELECT * INTO v_folder FROM public.tbl_folder WHERE id = p_folder_id;

    IF v_folder IS NULL OR v_folder.is_hidden THEN
        RETURN QUERY SELECT 'NOT_FOUND'::VARCHAR, false, false, false, false, false, false;
        RETURN;
    END IF;

    v_is_owner := (v_user_id IS NOT NULL AND v_folder.owner_id = v_user_id);
    
    IF v_user_id IS NOT NULL THEN
        SELECT EXISTS (
            SELECT 1 FROM public.tbl_folder_subscribed 
            WHERE folder_id = p_folder_id AND user_id = v_user_id AND deleted_at IS NULL
        ) INTO v_is_subscribed;
    ELSE
        v_is_subscribed := FALSE;
    END IF;

    -- 권한별 접근 판단
    CASE v_folder.permission
        WHEN 'public' THEN
            -- 공개 폴더: 모두가 볼 수 있고, 소유자 또는 (함께 편집 옵션 시) 구독자가 편집 가능
            RETURN QUERY SELECT 'ALLOWED'::VARCHAR, true, v_is_owner OR (v_is_subscribed AND v_folder.permission_write_type = 1), v_is_owner, v_is_subscribed, false, false;
        WHEN 'private' THEN
            -- URL 접속 가능하지만 목록에서는 안 보임
            RETURN QUERY SELECT 'ALLOWED'::VARCHAR, true, v_is_owner, v_is_owner, v_is_subscribed, true, false;
        WHEN 'hidden' THEN
            -- 소유자만 접근 가능
            IF v_is_owner THEN
                RETURN QUERY SELECT 'ALLOWED'::VARCHAR, true, true, true, false, false, false;
            ELSE
                RETURN QUERY SELECT 'NOT_FOUND'::VARCHAR, false, false, false, false, false, false;
            END IF;
        WHEN 'invite' THEN
            -- 소유자 또는 구독자만 접근 가능
            IF v_is_owner OR v_is_subscribed THEN
                RETURN QUERY SELECT 'ALLOWED'::VARCHAR, true, v_is_owner OR (v_is_subscribed AND v_folder.permission_write_type = 1), v_is_owner, v_is_subscribed, false, false;
            ELSIF v_user_id IS NOT NULL THEN
                -- 로그인 사용자: 코드 입력 필요
                RETURN QUERY SELECT 'INVITE_CODE_REQUIRED'::VARCHAR, false, false, false, false, false, false;
            ELSE
                -- 비로그인: 404
                RETURN QUERY SELECT 'NOT_FOUND'::VARCHAR, false, false, false, false, false, false;
            END IF;
        WHEN 'default' THEN
            -- 본인의 기본 폴더만 접근 가능
            IF v_is_owner THEN
                RETURN QUERY SELECT 'ALLOWED'::VARCHAR, true, true, true, false, false, true;
            ELSE
                RETURN QUERY SELECT 'NOT_FOUND'::VARCHAR, false, false, false, false, false, false;
            END IF;
        ELSE
            RETURN QUERY SELECT 'NOT_FOUND'::VARCHAR, false, false, false, false, false, false;
    END CASE;
END;
$$;

-- 2. 장소를 폴더에 추가 함수 수정 (public 폴더의 공동 편집 지원)
CREATE OR REPLACE FUNCTION public.v1_add_place_to_folder(
    p_folder_id VARCHAR,
    p_place_id VARCHAR,
    p_comment VARCHAR DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
#variable_conflict use_column
DECLARE
    v_user_id UUID;
    v_owner_id UUID;
    v_permission VARCHAR;
    v_permission_write_type INT;
    v_is_subscribed BOOLEAN;
    v_can_write BOOLEAN := FALSE;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION '로그인이 필요합니다.';
    END IF;

    -- 폴더 정보 조회
    SELECT f.owner_id, f.permission, f.permission_write_type 
    INTO v_owner_id, v_permission, v_permission_write_type 
    FROM public.tbl_folder f WHERE f.id = p_folder_id AND f.is_hidden = FALSE;
    
    IF v_owner_id IS NULL THEN
        RAISE EXCEPTION '폴더를 찾을 수 없습니다.';
    END IF;

    -- 권한 체크
    IF v_owner_id = v_user_id THEN
        v_can_write := TRUE;
    ELSIF (v_permission = 'invite' OR v_permission = 'public') AND v_permission_write_type = 1 THEN
        -- invite 또는 public 폴더이고 공동 편집이 허용된 경우, 구독자인지 확인
        SELECT EXISTS (
            SELECT 1 FROM public.tbl_folder_subscribed 
            WHERE folder_id = p_folder_id AND user_id = v_user_id AND deleted_at IS NULL
        ) INTO v_is_subscribed;
        v_can_write := v_is_subscribed;
    END IF;

    IF NOT v_can_write THEN
        RAISE EXCEPTION '권한이 없습니다.';
    END IF;

    INSERT INTO public.tbl_folder_place (folder_id, user_id, place_id, comment)
    VALUES (p_folder_id, v_user_id, p_place_id, p_comment)
    ON CONFLICT (folder_id, place_id) DO UPDATE SET 
        deleted_at = NULL, 
        user_id = v_user_id,
        comment = COALESCE(p_comment, tbl_folder_place.comment),
        updated_at = NOW();

    -- 카운트 업데이트
    UPDATE public.tbl_folder 
    SET place_count = (SELECT count(*) FROM public.tbl_folder_place WHERE folder_id = p_folder_id AND deleted_at IS NULL),
        updated_at = NOW()
    WHERE id = p_folder_id;

    RETURN TRUE;
END;
$$;
