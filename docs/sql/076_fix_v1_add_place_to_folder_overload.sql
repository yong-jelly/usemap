-- =====================================================
-- 076_fix_v1_add_place_to_folder_overload.sql
-- v1_add_place_to_folder 함수 오버로드 충돌 해결
-- 
-- 문제: PostgREST가 VARCHAR와 TEXT 타입을 구분하여 함수 오버로드 해결 불가
-- 해결: 모든 오버로드 버전 삭제 후 통일된 함수만 생성
-- 
-- 실행 방법:
--   psql "postgresql://postgres.xyqpggpilgcdsawuvpzn:ZNDqDunnaydr0aFQ@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres" -f docs/sql/076_fix_v1_add_place_to_folder_overload.sql
-- =====================================================

-- 1. 모든 오버로드된 v1_add_place_to_folder 함수 삭제
-- 2개 파라미터 버전 (구버전)
DROP FUNCTION IF EXISTS public.v1_add_place_to_folder(VARCHAR, VARCHAR);
DROP FUNCTION IF EXISTS public.v1_add_place_to_folder(character varying, character varying);

-- 3개 파라미터 버전 - TEXT 타입
DROP FUNCTION IF EXISTS public.v1_add_place_to_folder(VARCHAR, VARCHAR, TEXT);
DROP FUNCTION IF EXISTS public.v1_add_place_to_folder(character varying, character varying, text);

-- 3개 파라미터 버전 - VARCHAR 타입
DROP FUNCTION IF EXISTS public.v1_add_place_to_folder(VARCHAR, VARCHAR, VARCHAR);
DROP FUNCTION IF EXISTS public.v1_add_place_to_folder(character varying, character varying, character varying);

-- 2. 통일된 함수 생성 (TEXT 타입 사용, 최신 버전 기준)
CREATE OR REPLACE FUNCTION public.v1_add_place_to_folder(
    p_folder_id VARCHAR,
    p_place_id VARCHAR,
    p_comment TEXT DEFAULT NULL
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
    ELSIF v_permission = 'invite' AND v_permission_write_type = 1 THEN
        -- invite 폴더이고 공동 편집이 허용된 경우, 구독자인지 확인
        SELECT EXISTS (
            SELECT 1 FROM public.tbl_folder_subscribed 
            WHERE folder_id = p_folder_id AND user_id = v_user_id AND deleted_at IS NULL
        ) INTO v_is_subscribed;
        v_can_write := v_is_subscribed;
    END IF;

    IF NOT v_can_write THEN
        RAISE EXCEPTION '권한이 없습니다.';
    END IF;

    -- 현재 추가하려는 폴더에만 장소 정보 및 메모 Upsert
    INSERT INTO public.tbl_folder_place (folder_id, user_id, place_id, comment, updated_at)
    VALUES (p_folder_id, v_user_id, p_place_id, p_comment, NOW())
    ON CONFLICT (folder_id, place_id) DO UPDATE 
        SET deleted_at = NULL, 
            user_id = v_user_id,
            comment = COALESCE(p_comment, tbl_folder_place.comment),
            updated_at = CASE WHEN p_comment IS NOT NULL THEN NOW() ELSE tbl_folder_place.updated_at END;

    -- 카운트 업데이트
    UPDATE public.tbl_folder 
    SET place_count = (SELECT count(*) FROM public.tbl_folder_place WHERE folder_id = p_folder_id AND deleted_at IS NULL),
        updated_at = NOW()
    WHERE id = p_folder_id;

    RETURN TRUE;
END;
$$;

COMMENT ON FUNCTION public.v1_add_place_to_folder(VARCHAR, VARCHAR, TEXT) IS '폴더에 장소 추가 및 폴더별 독립적인 메모 관리';
