-- =====================================================
-- 051_visited_history_system.sql
-- 방문 기록 시스템 개선 (누구랑, 메모, 히스토리 관리)
-- 
-- 실행 방법:
--   psql "postgresql://postgres.xyqpggpilgcdsawuvpzn:ZNDqDunnaydr0aFQ@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres" -f docs/sql/051_visited_history_system.sql
-- =====================================================

-- 1. tbl_visited 테이블 컬럼 추가
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tbl_visited' AND column_name='companion') THEN
        ALTER TABLE public.tbl_visited ADD COLUMN companion text;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tbl_visited' AND column_name='note') THEN
        ALTER TABLE public.tbl_visited ADD COLUMN note text;
    END IF;
END $$;

-- 2. 방문 기록 유무 확인 함수
CREATE OR REPLACE FUNCTION public.v1_has_visited_place(p_place_id text)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE
AS $function$
DECLARE
    v_user_id uuid := auth.uid();
BEGIN
    IF v_user_id IS NULL THEN RETURN false; END IF;
    RETURN EXISTS (SELECT 1 FROM public.tbl_visited WHERE user_id = v_user_id AND place_id = p_place_id);
END;
$function$;

-- 3. 방문 기록 저장/수정 함수
CREATE OR REPLACE FUNCTION public.v1_save_or_update_visited_place(
    p_place_id text,
    p_visited_at timestamp with time zone DEFAULT now(),
    p_companion text DEFAULT NULL,
    p_note text DEFAULT NULL,
    p_visit_id uuid DEFAULT NULL
)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_user_id uuid := auth.uid();
    v_id uuid;
BEGIN
    IF v_user_id IS NULL THEN
        RETURN jsonb_build_object('error', '로그인이 필요합니다.');
    END IF;

    IF p_visit_id IS NOT NULL THEN
        -- 수정
        UPDATE public.tbl_visited 
        SET visited_at = COALESCE(p_visited_at, visited_at),
            companion = p_companion,
            note = p_note,
            updated_at = now()
        WHERE id = p_visit_id AND user_id = v_user_id
        RETURNING id INTO v_id;
    ELSE
        -- 신규 추가
        INSERT INTO public.tbl_visited (user_id, place_id, visited_at, companion, note)
        VALUES (v_user_id, p_place_id, COALESCE(p_visited_at, now()), p_companion, p_note)
        RETURNING id INTO v_id;
    END IF;

    RETURN jsonb_build_object('id', v_id, 'success', true);
EXCEPTION
    WHEN others THEN
        RETURN jsonb_build_object('error', '방문 기록 저장 중 오류: ' || SQLERRM);
END;
$function$;

-- 4. 특정 장소의 방문 히스토리 조회 함수
CREATE OR REPLACE FUNCTION public.v1_list_visited_history(p_place_id text)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SECURITY DEFINER
AS $function$
DECLARE
    v_user_id uuid := auth.uid();
    v_history jsonb;
BEGIN
    IF v_user_id IS NULL THEN
        RETURN '[]'::jsonb;
    END IF;

    SELECT jsonb_agg(
        jsonb_build_object(
            'id', id,
            'date', visited_at,
            'companion', COALESCE(companion, ''),
            'note', COALESCE(note, ''),
            'created_at', created_at
        ) ORDER BY visited_at DESC
    ) INTO v_history
    FROM public.tbl_visited
    WHERE user_id = v_user_id AND place_id = p_place_id;

    RETURN COALESCE(v_history, '[]'::jsonb);
END;
$function$;

-- 5. 방문 기록 삭제 함수
CREATE OR REPLACE FUNCTION public.v1_delete_visited_place(p_visit_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_user_id uuid := auth.uid();
BEGIN
    IF v_user_id IS NULL THEN
        RETURN jsonb_build_object('error', '로그인이 필요합니다.');
    END IF;

    DELETE FROM public.tbl_visited 
    WHERE id = p_visit_id AND user_id = v_user_id;

    RETURN jsonb_build_object('success', true);
EXCEPTION
    WHEN others THEN
        RETURN jsonb_build_object('error', '방문 기록 삭제 중 오류: ' || SQLERRM);
END;
$function$;

-- 6. 내 전체 방문 통계 조회 (상세 모달용 - 횟수, 마지막 방문일)
CREATE OR REPLACE FUNCTION public.v1_get_place_visit_stats(p_place_id text)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SECURITY DEFINER
AS $function$
DECLARE
    v_user_id uuid := auth.uid();
    v_count int;
    v_last_visited_at timestamp with time zone;
BEGIN
    IF v_user_id IS NULL THEN
        RETURN jsonb_build_object('visit_count', 0, 'last_visited_at', NULL);
    END IF;

    SELECT count(*), max(visited_at)
    INTO v_count, v_last_visited_at
    FROM public.tbl_visited
    WHERE user_id = v_user_id AND place_id = p_place_id;

    RETURN jsonb_build_object(
        'visit_count', v_count,
        'last_visited_at', v_last_visited_at
    );
END;
$function$;

-- 7. v1_common_place_interaction 업데이트 (방문 통계 포함)
-- 기존 함수를 확장하거나, 프론트에서 따로 부를 수 있도록 유지. 
-- 여기서는 상세 페이지에서 자주 쓰이므로 experience 객체에 추가 정보를 넣어주는 함수를 장소 조회 시 호출하도록 함.
