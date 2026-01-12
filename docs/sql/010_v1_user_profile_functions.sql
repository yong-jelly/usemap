-- =====================================================
-- 010_v1_user_profile_functions.sql
-- 사용자 프로필 관리 관련 RPC 함수 정의 (v1 & v2)
-- 
-- 실행 방법:
--   psql "postgresql://postgres.xyqpggpilgcdsawuvpzn:ZNDqDunnaydr0aFQ@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres" -f docs/sql/010_v1_user_profile_functions.sql
-- =====================================================

-- 1. 프로필 상세 조회 (v1)
DROP FUNCTION IF EXISTS public.v1_get_user_profile(uuid);
CREATE OR REPLACE FUNCTION public.v1_get_user_profile(p_auth_user_id uuid)
 RETURNS SETOF public.tbl_user_profile
 LANGUAGE sql
 STABLE
 SECURITY DEFINER
 SET search_path = public, auth
AS $function$
    SELECT * FROM public.tbl_user_profile WHERE auth_user_id = p_auth_user_id;
$function$;

-- 2. 프로필 정보 수정 (v1)
DROP FUNCTION IF EXISTS public.v1_update_user_profile(text, text, text);
CREATE OR REPLACE FUNCTION public.v1_update_user_profile(
    p_nickname text,
    p_bio text,
    p_profile_image_url text
)
 RETURNS SETOF public.tbl_user_profile
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public, auth
AS $function$
DECLARE
    v_user_id uuid;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    UPDATE public.tbl_user_profile
    SET 
        nickname = COALESCE(p_nickname, nickname),
        bio = COALESCE(p_bio, bio),
        profile_image_url = COALESCE(p_profile_image_url, profile_image_url),
        updated_at = now()
    WHERE auth_user_id = v_user_id;

    RETURN QUERY SELECT * FROM public.tbl_user_profile WHERE auth_user_id = v_user_id;
END;
$function$;

-- 3. 프로필 업서트 (v2) - 이메일 정보 포함 (로그인 서비스용)
DROP FUNCTION IF EXISTS public.v2_upsert_user_profile(text, text, text, text);
CREATE OR REPLACE FUNCTION public.v2_upsert_user_profile(
    p_nickname text,
    p_bio text DEFAULT NULL,
    p_profile_image_url text DEFAULT NULL,
    p_email text DEFAULT NULL
)
 RETURNS SETOF public.tbl_user_profile
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public, auth
AS $function$
DECLARE
    v_user_id uuid;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    INSERT INTO public.tbl_user_profile (
        auth_user_id,
        nickname,
        bio,
        profile_image_url
    )
    VALUES (
        v_user_id,
        p_nickname,
        p_bio,
        p_profile_image_url
    )
    ON CONFLICT (auth_user_id) DO UPDATE
    SET
        nickname = EXCLUDED.nickname,
        bio = COALESCE(EXCLUDED.bio, tbl_user_profile.bio),
        profile_image_url = COALESCE(EXCLUDED.profile_image_url, tbl_user_profile.profile_image_url),
        updated_at = now();

    RETURN QUERY SELECT * FROM public.tbl_user_profile WHERE auth_user_id = v_user_id;
END;
$function$;

-- 기존 함수 유지 (호환성용)
CREATE OR REPLACE FUNCTION public.get_user_profile()
 RETURNS SETOF tbl_user_profile
 LANGUAGE sql
 STABLE
AS $function$
    SELECT * FROM public.tbl_user_profile WHERE auth_user_id = auth.uid();
$function$;

CREATE OR REPLACE FUNCTION public.get_user_profile_by_id(p_public_profile_id uuid)
 RETURNS SETOF tbl_user_profile
 LANGUAGE sql
 STABLE
AS $function$
    SELECT * FROM public.tbl_user_profile WHERE public_profile_id = p_public_profile_id;
$function$;
