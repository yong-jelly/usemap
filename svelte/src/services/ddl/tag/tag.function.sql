-- v1_get_tags 함수는 활성화된 모든 태그를 가져오는 함수입니다.
-- 이 함수는 SQL 언어로 작성되었으며, 보안 정의자 권한으로 실행됩니다.
-- SETOF는 여러 행을 반환할 수 있음을 의미합니다.
CREATE OR REPLACE FUNCTION public.v1_get_tags()
RETURNS SETOF public.tbl_tag_master_for_place
LANGUAGE sql
SECURITY DEFINER
AS $$
  -- tbl_tag_master_for_place 테이블에서 is_active가 true인 모든 행을 선택합니다.
  -- 결과는 tag_group과 tag_order로 정렬됩니다.
  SELECT *
  FROM public.tbl_tag_master_for_place
  WHERE is_active = true
  ORDER BY tag_group, tag_order;
$$;

-- v1_get_user_tags 함수는 특정 장소에 대해 사용자가 추가한 태그를 가져오는 함수입니다.
-- 이 함수는 PL/pgSQL 언어로 작성되었으며, 보안 정의자 권한으로 실행됩니다.
-- p_business_id는 장소의 ID를 나타내는 매개변수입니다.
CREATE OR REPLACE FUNCTION public.v1_get_user_tags(
  p_business_id text
)
RETURNS SETOF public.tbl_place_tag
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- tbl_place_tag 테이블에서 business_id가 p_business_id와 일치하고,
  -- user_id가 현재 인증된 사용자 ID(auth.uid())와 일치하는 모든 행을 반환합니다.
  RETURN QUERY
  SELECT *
  FROM public.tbl_place_tag
  WHERE business_id = p_business_id
  AND user_id = auth.uid();
END;
$$;

-- v1_add_tag 함수는 사용자가 특정 장소에 태그를 추가하는 함수입니다.
-- p_business_id는 장소의 ID, p_tag_id는 태그의 ID를 나타내는 매개변수입니다.
CREATE OR REPLACE FUNCTION public.v1_add_tag(
  p_business_id text,
  p_tag_id uuid
)
RETURNS public.tbl_place_tag
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid; -- 현재 인증된 사용자의 ID를 저장할 변수
  v_result public.tbl_place_tag; -- 추가된 태그 정보를 저장할 변수
BEGIN
  -- 현재 인증된 사용자 ID를 가져옵니다.
  v_user_id := auth.uid();
  
  -- 사용자 인증을 확인합니다. 인증되지 않은 경우 예외를 발생시킵니다.
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION '인증되지 않은 사용자입니다';
  END IF;
  
  -- 태그가 존재하는지 확인합니다. 존재하지 않으면 예외를 발생시킵니다.
  IF NOT EXISTS (SELECT 1 FROM public.tbl_tag_master_for_place WHERE id = p_tag_id AND is_active = true) THEN
    RAISE EXCEPTION '존재하지 않는 태그입니다';
  END IF;
  
  -- 중복 태그 추가를 방지합니다. 이미 추가된 경우 예외를 발생시킵니다.
  IF EXISTS (
    SELECT 1 FROM public.tbl_place_tag 
    WHERE user_id = v_user_id 
    AND business_id = p_business_id 
    AND tag_id = p_tag_id
  ) THEN
    RAISE EXCEPTION '이미 추가된 태그입니다';
  END IF;
  
  -- 태그를 추가하고, 추가된 행을 v_result 변수에 저장합니다.
  INSERT INTO public.tbl_place_tag (
    user_id,
    business_id,
    tag_id
  ) VALUES (
    v_user_id,
    p_business_id,
    p_tag_id
  )
  RETURNING * INTO v_result;
  
  -- 추가된 태그 정보를 반환합니다.
  RETURN v_result;
END;
$$;

-- v1_remove_tag 함수는 사용자가 추가한 태그를 삭제하는 함수입니다.
-- p_tag_id는 삭제할 태그의 ID를 나타내는 매개변수입니다.
CREATE OR REPLACE FUNCTION public.v1_remove_tag(
  p_tag_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid; -- 현재 인증된 사용자의 ID를 저장할 변수
  v_success boolean; -- 삭제 성공 여부를 저장할 변수
BEGIN
  -- 현재 인증된 사용자 ID를 가져옵니다.
  v_user_id := auth.uid();
  
  -- 사용자 인증을 확인합니다. 인증되지 않은 경우 예외를 발생시킵니다.
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION '인증되지 않은 사용자입니다';
  END IF;
  
  -- 태그 소유자를 확인하고, 태그를 삭제합니다.
  DELETE FROM public.tbl_place_tag
  WHERE id = p_tag_id AND user_id = v_user_id;
  
  -- 삭제 성공 여부를 확인합니다.
  v_success := FOUND;
  
  -- 삭제 성공 여부를 반환합니다.
  RETURN v_success;
END;
$$;