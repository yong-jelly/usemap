-- =====================================================
-- 074_add_admin_role_and_place_delete.sql
-- 관리자 역할 체계 도입 및 장소 삭제 기능 구현

-- 실행 방법:
--   psql "postgresql://postgres.xyqpggpilgcdsawuvpzn:ZNDqDunnaydr0aFQ@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres" -f docs/sql/074_add_admin_role_and_place_delete.sql
-- =====================================================


-- 1. 사용자 프로필 테이블에 role 컬럼 추가
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tbl_user_profile' AND column_name='role') THEN
        ALTER TABLE public.tbl_user_profile ADD COLUMN role text DEFAULT 'user';
        COMMENT ON COLUMN public.tbl_user_profile.role IS '사용자 역할 (user, admin)';
    END IF;
END $$;

-- 2. 액션 히스토리 테이블 생성
CREATE TABLE IF NOT EXISTS public.tbl_action_history (
    id uuid DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    action_user_id uuid REFERENCES auth.users(id),
    action text NOT NULL, -- 예: 'DELETED'
    source_name text NOT NULL, -- 예: 'tbl_place'
    source_id text NOT NULL, -- 삭제된 항목의 ID
    metadata jsonb -- 추가 정보 (삭제된 항목의 이름 등)
);

COMMENT ON TABLE public.tbl_action_history IS '시스템 주요 액션 이력 관리 테이블';

-- 3. 특정 사용자(skillove@gmail.com)를 관리자로 설정
UPDATE public.tbl_user_profile
SET role = 'admin'
WHERE auth_user_id IN (
    SELECT id FROM auth.users WHERE email = 'skillove@gmail.com'
);

-- 4. 장소 삭제 RPC 함수 생성 (관리자 전용)
CREATE OR REPLACE FUNCTION public.v1_delete_place(
    p_place_id text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_caller_id uuid;
    v_caller_role text;
    v_place_name text;
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

    -- 3. 삭제 전 장소 정보 확인 (이력 기록용)
    SELECT name INTO v_place_name FROM public.tbl_place WHERE id = p_place_id;
    IF v_place_name IS NULL THEN
        RETURN json_build_object('success', false, 'message', '존재하지 않는 장소입니다.');
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
        'tbl_place',
        p_place_id,
        jsonb_build_object('name', v_place_name)
    );

    -- 5. 장소 관련 데이터 삭제 (CASCADE가 안 걸린 테이블들)
    DELETE FROM public.tbl_place_analysis WHERE business_id = p_place_id;
    DELETE FROM public.tbl_place_info WHERE business_id = p_place_id;
    DELETE FROM public.tbl_place_menu WHERE business_id = p_place_id;
    DELETE FROM public.tbl_place_features WHERE place_id = p_place_id;
    DELETE FROM public.tbl_place_view_stats WHERE place_id = p_place_id;
    DELETE FROM public.tbl_place_feed_group WHERE place_id = p_place_id;
    DELETE FROM public.tbl_place_review WHERE business_id = p_place_id;
    DELETE FROM public.tbl_place_review_voted WHERE business_id = p_place_id;
    DELETE FROM public.tbl_place_review_voted_summary WHERE business_id = p_place_id;
    
    -- 사용자 상호작용 삭제
    DELETE FROM public.tbl_place_user_review WHERE place_id = p_place_id;
    DELETE FROM public.tbl_like WHERE liked_id = p_place_id AND liked_type = 'place';
    DELETE FROM public.tbl_save WHERE saved_id = p_place_id AND saved_type = 'place';
    DELETE FROM public.tbl_visited WHERE place_id = p_place_id;

    -- 6. 최종적으로 장소 삭제 (tbl_place)
    DELETE FROM public.tbl_place WHERE id = p_place_id;

    RETURN json_build_object('success', true, 'message', '장소가 삭제되었습니다.', 'place_id', p_place_id, 'name', v_place_name);
END;
$$;

COMMENT ON FUNCTION public.v1_delete_place IS '장소 삭제 (관리자 전용)';
GRANT EXECUTE ON FUNCTION public.v1_delete_place TO authenticated;
GRANT ALL ON public.tbl_action_history TO service_role;
GRANT SELECT, INSERT ON public.tbl_action_history TO authenticated;
