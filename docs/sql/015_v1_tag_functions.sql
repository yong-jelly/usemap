-- =====================================================
-- 015_v1_tag_functions.sql
-- 장소 태그 추가, 삭제 및 조회 관련 RPC 함수 정의
-- =====================================================

-- 1. 장소에 태그 추가 함수
CREATE OR REPLACE FUNCTION public.v1_add_tag(p_business_id text, p_tag_id uuid)
 RETURNS tbl_place_tag
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_user_id uuid := auth.uid();
  v_result public.tbl_place_tag;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION '인증되지 않은 사용자입니다'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.tbl_tag_master_for_place WHERE id = p_tag_id AND is_active = true) THEN RAISE EXCEPTION '존재하지 않는 태그입니다'; END IF;
  IF EXISTS (SELECT 1 FROM public.tbl_place_tag WHERE user_id = v_user_id AND business_id = p_business_id AND tag_id = p_tag_id) THEN RAISE EXCEPTION '이미 추가된 태그입니다'; END IF;
  
  INSERT INTO public.tbl_place_tag (user_id, business_id, tag_id) VALUES (v_user_id, p_business_id, p_tag_id) RETURNING * INTO v_result;
  RETURN v_result;
END;
$function$;

-- 2. 추가한 태그 삭제 함수
CREATE OR REPLACE FUNCTION public.v1_remove_tag(p_tag_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_user_id uuid := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION '인증되지 않은 사용자입니다'; END IF;
  DELETE FROM public.tbl_place_tag WHERE id = p_tag_id AND user_id = v_user_id;
  RETURN FOUND;
END;
$function$;

-- 3. 활성화된 모든 마스터 태그 목록 조회 함수
CREATE OR REPLACE FUNCTION public.v1_get_tags()
 RETURNS SETOF tbl_tag_master_for_place
 LANGUAGE sql
 SECURITY DEFINER
AS $function$
  SELECT * FROM public.tbl_tag_master_for_place WHERE is_active = true ORDER BY tag_group, tag_order;
$function$;

-- 4. 특정 장소에 내가 추가한 태그 목록 조회 함수
CREATE OR REPLACE FUNCTION public.v1_get_user_tags(p_business_id text)
 RETURNS SETOF tbl_place_tag
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  RETURN QUERY SELECT * FROM public.tbl_place_tag WHERE business_id = p_business_id AND user_id = auth.uid();
END;
$function$;
