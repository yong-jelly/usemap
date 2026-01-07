-- =====================================================
-- 010_v1_user_profile_functions.sql
-- 사용자 프로필 관리 관련 RPC 함수 정의
-- =====================================================

-- 1. 프로필 생성 함수
CREATE OR REPLACE FUNCTION public.create_user_profile(p_nickname text, p_bio text DEFAULT NULL::text, p_profile_image_url text DEFAULT NULL::text)
 RETURNS json
 LANGUAGE plpgsql
AS $function$
DECLARE
    result jsonb;
    profile_exists boolean;
    current_user_id uuid;
BEGIN
    current_user_id := auth.uid();
    IF current_user_id IS NULL THEN
        RETURN json_build_object('success', false, 'message', '로그인이 필요합니다.');
    END IF;

    SELECT EXISTS (SELECT 1 FROM public.tbl_user_profile WHERE auth_user_id = current_user_id) INTO profile_exists;
    IF profile_exists THEN
        RETURN json_build_object('success', false, 'message', '이미 프로필이 존재합니다.');
    END IF;

    INSERT INTO public.tbl_user_profile (auth_user_id, nickname, bio, profile_image_url)
    VALUES (current_user_id, p_nickname, p_bio, p_profile_image_url)
    RETURNING to_jsonb(tbl_user_profile.*) INTO result;

    RETURN json_build_object('success', true, 'profile', result);
END;
$function$;

-- 2. 내 프로필 조회 함수
CREATE OR REPLACE FUNCTION public.get_user_profile()
 RETURNS SETOF tbl_user_profile
 LANGUAGE sql
 STABLE
AS $function$
    SELECT * FROM public.tbl_user_profile WHERE auth_user_id = auth.uid();
$function$;

-- 3. 특정 사용자의 프로필 조회 함수
CREATE OR REPLACE FUNCTION public.get_user_profile_by_id(p_public_profile_id uuid)
 RETURNS SETOF tbl_user_profile
 LANGUAGE sql
 STABLE
AS $function$
    SELECT * FROM public.tbl_user_profile WHERE public_profile_id = p_public_profile_id;
$function$;

-- 4. 프로필 정보 수정 함수
CREATE OR REPLACE FUNCTION public.update_user_profile(p_nickname text, p_bio text, p_profile_image_url text)
 RETURNS json
 LANGUAGE plpgsql
AS $function$
DECLARE
    result jsonb;
BEGIN
    UPDATE public.tbl_user_profile
    SET 
        nickname = p_nickname,
        bio = CASE WHEN p_bio IS NULL THEN bio ELSE p_bio END,
        profile_image_url = CASE WHEN p_profile_image_url IS NULL THEN profile_image_url ELSE p_profile_image_url END,
        updated_at = timezone('utc'::text, now())
    WHERE auth_user_id = auth.uid()
    RETURNING to_jsonb(tbl_user_profile.*) INTO result;

    IF result IS NULL THEN
        RETURN json_build_object('success', false, 'message', '프로필을 찾을 수 없습니다.');
    ELSE
        RETURN json_build_object('success', true, 'profile', result);
    END IF;
END;
$function$;

-- 5. 닉네임으로 프로필 검색 함수
CREATE OR REPLACE FUNCTION public.search_profiles_by_nickname(p_nickname text, p_limit integer DEFAULT 10)
 RETURNS SETOF tbl_user_profile
 LANGUAGE sql
 STABLE
AS $function$
    SELECT * FROM public.tbl_user_profile
    WHERE nickname ILIKE '%' || p_nickname || '%'
    ORDER BY CASE 
        WHEN nickname ILIKE p_nickname THEN 0
        WHEN nickname ILIKE p_nickname || '%' THEN 1
        ELSE 2
    END, 
    created_at DESC
    LIMIT p_limit;
$function$;
