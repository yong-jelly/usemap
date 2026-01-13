-- =====================================================
-- 065_fix_folder_conflicts_and_overloads.sql
-- 1. v1_add_place_to_folder 함수 오버로드 해결 (TEXT 타입 제거)
-- 2. 기본 폴더(default) 중복 방지를 위한 유니크 인덱스 추가
-- 3. 기존 중복 기본 폴더 정리
-- 4. v1_ensure_default_folder 함수 개선 (동시성 보장)
-- =====================================================

-- 1. v1_add_place_to_folder 함수 오버로드 해결
-- p_comment가 text인 구버전 함수 삭제 (현재는 VARCHAR 사용)
DROP FUNCTION IF EXISTS public.v1_add_place_to_folder(character varying, character varying, text);

-- 2. 기존 중복 기본 폴더 정리 로직
DO $$
DECLARE
    r RECORD;
    v_target_folder_id VARCHAR;
BEGIN
    -- 중복된 유저들 순회
    FOR r IN (
        SELECT owner_id, count(*) 
        FROM public.tbl_folder 
        WHERE permission = 'default' 
        GROUP BY owner_id 
        HAVING count(*) > 1
    ) LOOP
        -- 남길 폴더 선정 (가장 먼저 생성된 것)
        SELECT id INTO v_target_folder_id 
        FROM public.tbl_folder 
        WHERE owner_id = r.owner_id AND permission = 'default'
        ORDER BY created_at ASC
        LIMIT 1;

        -- 다른 중복 폴더들에 담긴 장소들을 남길 폴더로 이동 (이미 있으면 무시)
        UPDATE public.tbl_folder_place
        SET folder_id = v_target_folder_id
        WHERE folder_id IN (
            SELECT id FROM public.tbl_folder 
            WHERE owner_id = r.owner_id AND permission = 'default' AND id <> v_target_folder_id
        )
        AND place_id NOT IN (
            SELECT place_id FROM public.tbl_folder_place WHERE folder_id = v_target_folder_id
        );

        -- 장소 이동 후 남은 중복 폴더의 장소 연결 삭제 (중복 방지)
        DELETE FROM public.tbl_folder_place
        WHERE folder_id IN (
            SELECT id FROM public.tbl_folder 
            WHERE owner_id = r.owner_id AND permission = 'default' AND id <> v_target_folder_id
        );

        -- 중복 폴더 삭제
        DELETE FROM public.tbl_folder
        WHERE owner_id = r.owner_id 
        AND permission = 'default' 
        AND id <> v_target_folder_id;
        
        -- 장소 개수 업데이트
        UPDATE public.tbl_folder 
        SET place_count = (SELECT count(*) FROM public.tbl_folder_place WHERE folder_id = v_target_folder_id AND deleted_at IS NULL)
        WHERE id = v_target_folder_id;
    END LOOP;
END $$;

-- 3. 유니크 인덱스 추가 (유저당 하나의 기본 폴더만 허용)
-- 이미 중복이 제거되었으므로 생성 가능
DROP INDEX IF EXISTS idx_folder_owner_default_unique;
CREATE UNIQUE INDEX idx_folder_owner_default_unique ON public.tbl_folder (owner_id, permission) 
WHERE (permission = 'default');

-- 4. v1_ensure_default_folder 함수 개선
CREATE OR REPLACE FUNCTION public.v1_ensure_default_folder()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
#variable_conflict use_column
DECLARE
    v_user_id UUID;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RETURN FALSE;
    END IF;

    -- INSERT ... ON CONFLICT 사용하여 동시성 이슈 방지
    INSERT INTO public.tbl_folder (owner_id, title, description, permission)
    VALUES (v_user_id, '기본 폴더', '본인만 확인 가능한 기본 폴더입니다.', 'default')
    ON CONFLICT (owner_id, permission) WHERE (permission = 'default') 
    DO NOTHING;

    RETURN TRUE;
END;
$$;

COMMENT ON FUNCTION public.v1_ensure_default_folder() IS '사용자별 기본 폴더 존재 확인 및 자동 생성 (중복 방지)';
