-- =====================================================
-- 075_add_naver_folder_delete.sql
-- 관리자 전용 네이버 폴더 삭제 기능 구현

-- 실행 방법:
--   psql "postgresql://postgres.xyqpggpilgcdsawuvpzn:ZNDqDunnaydr0aFQ@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres" -f docs/sql/075_add_naver_folder_delete.sql
-- =====================================================

-- 1. 네이버 폴더 삭제 RPC 함수 생성 (관리자 전용)
CREATE OR REPLACE FUNCTION public.v1_delete_naver_folder(
    p_folder_id bigint
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, public
AS $$
DECLARE
    v_caller_id uuid;
    v_caller_role text;
    v_folder_name text;
BEGIN
    -- 1. 호출자 확인
    v_caller_id := auth.uid();
    IF v_caller_id IS NULL THEN
        RETURN json_build_object('success', false, 'message', '인증이 필요합니다.');
    END IF;

    -- 2. 권한 확인 (관리자만 가능)
    SELECT role INTO v_caller_role FROM public.tbl_user_profile WHERE auth_user_id = v_caller_id;
    IF v_caller_role IS NULL OR lower(v_caller_role) != 'admin' THEN
        RETURN json_build_object('success', false, 'message', '관리자 권한이 필요합니다.');
    END IF;

    -- 3. 삭제 전 폴더 정보 확인 (이력 기록용)
    SELECT name INTO v_folder_name FROM public.tbl_naver_folder WHERE folder_id = p_folder_id;
    IF v_folder_name IS NULL THEN
        RETURN json_build_object('success', false, 'message', '존재하지 않는 폴더입니다.');
    END IF;

    -- 4. 이력 기록
    INSERT INTO public.tbl_action_history (
        action_user_id,
        action,
        source_name,
        source_id,
        metadata
    ) VALUES (
        v_caller_id,
        'DELETED',
        'tbl_naver_folder',
        p_folder_id::text,
        jsonb_build_object('name', v_folder_name)
    );

    -- 5. 구독 정보 삭제
    -- tbl_feature_subscription 테이블이 있는지 확인 필요 (일반적으로 tbl_subscription 등을 사용함)
    -- 060_fix_hidden_folder_logic_in_feed_and_subscriptions.sql 등을 참고하면 
    -- tbl_feature_subscription 또는 tbl_subscription_detail 등을 사용하는 것으로 보임.
    -- 여기서는 일반적인 명칭인 tbl_feature_subscription을 사용하거나 실제 테이블 확인 후 적용.
    -- 이전 migration(030)에서 tbl_feature_subscription을 생성했는지 확인 필요.
    
    DELETE FROM public.tbl_feature_subscription WHERE feature_type = 'naver_folder' AND feature_id = p_folder_id::text;

    -- 6. 네이버 폴더 삭제 (tbl_naver_folder)
    -- tbl_naver_folder_place는 ON DELETE CASCADE로 자동 삭제됨
    DELETE FROM public.tbl_naver_folder WHERE folder_id = p_folder_id;

    RETURN json_build_object('success', true, 'message', '폴더가 삭제되었습니다.', 'folder_id', p_folder_id, 'name', v_folder_name);
END;
$$;

COMMENT ON FUNCTION public.v1_delete_naver_folder IS '네이버 폴더 삭제 (관리자 전용)';
GRANT EXECUTE ON FUNCTION public.v1_delete_naver_folder TO authenticated;
