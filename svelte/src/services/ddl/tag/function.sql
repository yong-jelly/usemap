-- 트리거 함수 정의
CREATE OR REPLACE FUNCTION public.v1_tag_master_log_changes()
RETURNS TRIGGER AS $$
DECLARE
    v_user_id uuid := auth.uid(); -- 현재 Supabase 사용자 ID 가져오기
    v_tag_id uuid;
    v_action_type VARCHAR(20);
    v_change_details jsonb := NULL;
BEGIN
    v_action_type := TG_OP; -- 트리거 작업 유형 (INSERT, UPDATE, DELETE)

    IF TG_OP = 'INSERT' THEN
        v_tag_id := NEW.id;
        -- INSERT 시에는 변경 전 내용이 없으므로 NULL 또는 NEW 레코드 전체 저장 가능
        -- v_change_details := jsonb_build_object('new_data', row_to_json(NEW));
    ELSIF TG_OP = 'UPDATE' THEN
        v_tag_id := NEW.id;
        -- 변경된 필드만 기록하거나, 이전/이후 레코드 전체 기록 가능
        v_change_details := jsonb_build_object(
            'old_data', row_to_json(OLD),
            'new_data', row_to_json(NEW)
        );
    ELSIF TG_OP = 'DELETE' THEN
        v_tag_id := OLD.id;
        -- DELETE 시에는 변경 후 내용이 없으므로 OLD 레코드 전체 저장 가능
        -- v_change_details := jsonb_build_object('deleted_data', row_to_json(OLD));
    END IF;

    -- tbl_tag_history에 이력 삽입
    INSERT INTO public.tbl_tag_history (tag_id, user_id, action_type, change_details)
    VALUES (v_tag_id, v_user_id, v_action_type, v_change_details);

    -- UPDATE 또는 INSERT의 경우 NEW 반환, DELETE의 경우 OLD 반환 (또는 NULL)
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        -- updated_at 필드 자동 갱신 (선택 사항)
        NEW.updated_at := CURRENT_TIMESTAMP;
        RETURN NEW;
    END IF;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER; -- 함수 실행 권한 주의 (DEFINER 또는 INVOKER)

-- 트리거 생성
CREATE TRIGGER v1_trigger_log_tag_master_changes
AFTER INSERT OR UPDATE OR DELETE ON public.tbl_tag_master_for_place
FOR EACH ROW EXECUTE FUNCTION public.v1_tag_master_log_changes();

-- 트리거 함수 소유권 변경 (Supabase 환경에 맞게 postgres 또는 서비스 역할로 변경)
-- 예: ALTER FUNCTION public.v1_tag_master_log_changes() OWNER TO postgres;

-- 트리거 함수 실행 권한 부여 (필요한 경우)
-- 예: GRANT EXECUTE ON FUNCTION public.v1_tag_master_log_changes() TO authenticated;
