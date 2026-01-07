-- =====================================================
-- 013_v1_interaction_functions.sql
-- 좋아요, 저장 등 사용자 상호작용 관련 RPC 함수 정의
-- =====================================================

-- 1. 좋아요 토글 함수
CREATE OR REPLACE FUNCTION public.v1_toggle_like(p_liked_id text, p_liked_type text, p_ref_liked_id text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
declare
    v_user_id uuid := auth.uid();
    new_status boolean;
begin
    if v_user_id is null then
        return jsonb_build_object('error', '로그인이 필요합니다.');
    end if;

    with upserted as (
        insert into public.tbl_like (user_id, liked_id, liked_type, ref_liked_id, liked)
        values (v_user_id, p_liked_id, p_liked_type, p_ref_liked_id, true)
        on conflict (user_id, liked_id, liked_type, ref_liked_id)
        do update set liked = not tbl_like.liked
        returning liked
    )
    select liked into new_status from upserted;

    return jsonb_build_object('liked', new_status);
exception
    when others then
        return jsonb_build_object('error', '처리 중 오류: ' || SQLERRM);
end;
$function$;

-- 2. 저장(북마크) 토글 함수
CREATE OR REPLACE FUNCTION public.v1_toggle_save(p_saved_id text, p_saved_type text, p_ref_saved_id text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_user_id uuid := auth.uid();
    new_status boolean;
BEGIN
    IF v_user_id IS NULL THEN
        RETURN jsonb_build_object('error', '로그인이 필요합니다.');
    END IF;

    WITH upserted AS (
        INSERT INTO public.tbl_save (user_id, saved_id, saved_type, ref_saved_id, saved)
        VALUES (v_user_id, p_saved_id, p_saved_type, p_ref_saved_id, true)
        ON CONFLICT (user_id, saved_id, saved_type, ref_saved_id)
        DO UPDATE SET saved = NOT tbl_save.saved
        RETURNING saved
    )
    SELECT saved INTO new_status FROM upserted;

    RETURN jsonb_build_object('saved', new_status);
EXCEPTION
    WHEN others THEN
        RETURN jsonb_build_object('error', '저장 처리 중 오류: ' || SQLERRM);
END;
$function$;

-- 3. 장소별 통합 상호작용 정보 조회 함수
CREATE OR REPLACE FUNCTION public.v1_common_place_interaction(p_place_id text)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
AS $function$
DECLARE
    v_user_id uuid := auth.uid();
    v_place_liked_count int := 0;
    v_place_saved_count int := 0;
    v_is_liked boolean := false;
    v_is_saved boolean := false;
    v_place_comment_count int := 0;
    v_is_commented boolean := false;
    v_comments jsonb := '[]'::jsonb;
    v_tags jsonb := '[]'::jsonb;
BEGIN
    SELECT count(*) INTO v_place_liked_count FROM public.tbl_like WHERE liked_id = p_place_id AND liked_type = 'place' AND liked = true;
    SELECT count(*) INTO v_place_saved_count FROM public.tbl_save WHERE saved_id = p_place_id AND saved_type = 'place' AND saved = true;
    SELECT count(*) INTO v_place_comment_count FROM public.tbl_comment_for_place WHERE business_id = p_place_id AND is_active = true;

    IF v_user_id IS NOT NULL THEN
        SELECT liked INTO v_is_liked FROM public.tbl_like WHERE liked_id = p_place_id AND liked_type = 'place' AND user_id = v_user_id;
        SELECT saved INTO v_is_saved FROM public.tbl_save WHERE saved_id = p_place_id AND saved_type = 'place' AND user_id = v_user_id;
        SELECT EXISTS (SELECT 1 FROM public.tbl_comment_for_place WHERE business_id = p_place_id AND user_id = v_user_id AND is_active = true) INTO v_is_commented;
    END IF;

    RETURN jsonb_build_object(
        'place_liked_count', COALESCE(v_place_liked_count, 0),
        'place_saved_count', COALESCE(v_place_saved_count, 0),
        'is_liked', COALESCE(v_is_liked, false),
        'is_saved', COALESCE(v_is_saved, false),
        'place_comment_count', COALESCE(v_place_comment_count, 0),
        'is_commented', COALESCE(v_is_commented, false)
    );
END;
$function$;
