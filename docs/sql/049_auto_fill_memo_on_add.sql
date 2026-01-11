-- =====================================================
-- 049_auto_fill_memo_on_add.sql
-- 장소 추가 시 기존 메모 자동 연동
-- 
-- 실행 방법:
--   psql "postgresql://postgres.xyqpggpilgcdsawuvpzn:ZNDqDunnaydr0aFQ@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres" -f docs/sql/049_auto_fill_memo_on_add.sql
-- =====================================================

-- 1. v1_add_place_to_folder 함수 업데이트 (신규 추가 시 기존 메모 자동 연동)
DROP FUNCTION IF EXISTS public.v1_add_place_to_folder(VARCHAR, VARCHAR, TEXT);
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
    v_existing_comment TEXT;
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

    -- 1. 만약 신규 추가이고 입력된 메모가 없다면, 다른 폴더에 작성한 메모가 있는지 확인
    IF p_comment IS NULL THEN
        SELECT comment INTO v_existing_comment
        FROM public.tbl_folder_place
        WHERE user_id = v_user_id 
          AND place_id = p_place_id
          AND comment IS NOT NULL
        LIMIT 1;
    END IF;

    -- 2. 현재 추가하려는 폴더에 장소 정보 Upsert
    INSERT INTO public.tbl_folder_place (folder_id, user_id, place_id, comment, updated_at)
    VALUES (p_folder_id, v_user_id, p_place_id, COALESCE(p_comment, v_existing_comment), NOW())
    ON CONFLICT (folder_id, place_id) DO UPDATE 
        SET deleted_at = NULL, 
            user_id = v_user_id,
            comment = COALESCE(p_comment, v_existing_comment, tbl_folder_place.comment),
            updated_at = NOW();

    -- 3. 만약 메모가 명시적으로 입력되었다면, 해당 유저가 동일 장소를 담은 다른 모든 폴더의 메모도 동기화
    IF p_comment IS NOT NULL THEN
        UPDATE public.tbl_folder_place
        SET comment = p_comment,
            updated_at = NOW()
        WHERE user_id = v_user_id 
          AND place_id = p_place_id
          AND folder_id != p_folder_id;
    END IF;

    -- 카운트 업데이트
    UPDATE public.tbl_folder 
    SET place_count = (SELECT count(*) FROM public.tbl_folder_place WHERE folder_id = p_folder_id AND deleted_at IS NULL),
        updated_at = NOW()
    WHERE id = p_folder_id;

    RETURN TRUE;
END;
$$;

COMMENT ON FUNCTION public.v1_add_place_to_folder IS '폴더에 장소 추가 및 기존 메모 자동 연동/동기화';
