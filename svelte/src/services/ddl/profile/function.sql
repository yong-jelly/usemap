-- 프로필 조회 함수: 현재 로그인한 사용자의 프로필 정보 조회
CREATE OR REPLACE FUNCTION public.get_user_profile()
RETURNS SETOF public.tbl_user_profile
LANGUAGE sql
SECURITY INVOKER
STABLE
AS $$
    SELECT * FROM public.tbl_user_profile
    WHERE auth_user_id = auth.uid();
$$;

-- 프로필 조회 함수: 특정 public_profile_id로 프로필 정보 조회
CREATE OR REPLACE FUNCTION public.get_user_profile_by_id(p_public_profile_id uuid)
RETURNS SETOF public.tbl_user_profile
LANGUAGE sql
SECURITY INVOKER
STABLE
AS $$
    SELECT * FROM public.tbl_user_profile
    WHERE public_profile_id = p_public_profile_id;
$$;

-- 프로필 조회 함수: 닉네임 검색
CREATE OR REPLACE FUNCTION public.search_profiles_by_nickname(p_nickname text, p_limit int DEFAULT 10)
RETURNS SETOF public.tbl_user_profile
LANGUAGE sql
SECURITY INVOKER
STABLE
AS $$
    SELECT * FROM public.tbl_user_profile
    WHERE nickname ILIKE '%' || p_nickname || '%'
    ORDER BY CASE 
        WHEN nickname ILIKE p_nickname THEN 0  -- 정확한 일치
        WHEN nickname ILIKE p_nickname || '%' THEN 1  -- 접두사 일치
        ELSE 2  -- 부분 일치
    END, 
    created_at DESC
    LIMIT p_limit;
$$;

-- 프로필 존재 여부 확인 함수
CREATE OR REPLACE FUNCTION public.check_user_profile_exists()
RETURNS SETOF public.tbl_user_profile
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    current_user_id uuid;
BEGIN
    -- 현재 로그인한 사용자 ID 확인
    current_user_id := auth.uid();
    
    -- 프로필이 없는 경우 기본 프로필 생성
    IF NOT EXISTS (SELECT 1 FROM public.tbl_user_profile WHERE auth_user_id = current_user_id) THEN
        INSERT INTO public.tbl_user_profile (
            auth_user_id,
            nickname,
            bio,
            profile_image_url,
            created_at,
            updated_at
        )
        VALUES (
            current_user_id,
            '사용자_' || substr(current_user_id::text, 1, 8),
            NULL,
            NULL,
            timezone('utc'::text, now()),
            timezone('utc'::text, now())
        );
    END IF;
    
    -- 프로필 정보 반환
    RETURN QUERY 
    SELECT * FROM public.tbl_user_profile 
    WHERE auth_user_id = current_user_id;
END;
$$;


-- 프로필 업데이트 함수: 닉네임, 소개, 프로필 이미지 업데이트
CREATE OR REPLACE FUNCTION public.update_user_profile(
    p_nickname text,
    p_bio text,
    p_profile_image_url text
)
RETURNS json
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    result jsonb;
BEGIN
    -- 프로필 존재 여부 확인 및 생성
    PERFORM public.check_user_profile_exists();

    -- 닉네임, 소개, 프로필 이미지 업데이트
    UPDATE public.tbl_user_profile
    SET 
        nickname = p_nickname,
        bio = CASE WHEN p_bio IS NULL THEN bio ELSE p_bio END,
        profile_image_url = CASE WHEN p_profile_image_url IS NULL THEN profile_image_url ELSE p_profile_image_url END,
        updated_at = timezone('utc'::text, now())
    WHERE auth_user_id = auth.uid()
    RETURNING to_jsonb(tbl_user_profile.*) INTO result;

    -- 결과 반환
    IF result IS NULL THEN
        RETURN json_build_object('success', false, 'message', '프로필을 찾을 수 없습니다.');
    ELSE
        RETURN json_build_object('success', true, 'profile', result);
    END IF;
END;
$$;

-- 프로필 생성 함수: 트리거가 자동으로 생성하지 않을 경우를 위한 함수
CREATE OR REPLACE FUNCTION public.create_user_profile(
    p_nickname text,
    p_bio text DEFAULT NULL,
    p_profile_image_url text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    result jsonb;
    profile_exists boolean;
    current_user_id uuid;
BEGIN
    -- 현재 로그인한 사용자 ID 확인
    current_user_id := auth.uid();
    
    IF current_user_id IS NULL THEN
        RETURN json_build_object('success', false, 'message', '로그인이 필요합니다.');
    END IF;

    -- 이미 프로필이 존재하는지 확인
    SELECT EXISTS (
        SELECT 1 FROM public.tbl_user_profile 
        WHERE auth_user_id = current_user_id
    ) INTO profile_exists;

    IF profile_exists THEN
        RETURN json_build_object('success', false, 'message', '이미 프로필이 존재합니다.');
    END IF;

    -- 새 프로필 생성
    INSERT INTO public.tbl_user_profile (
        auth_user_id,
        nickname,
        bio,
        profile_image_url
    )
    VALUES (
        current_user_id,
        p_nickname,
        p_bio,
        p_profile_image_url
    )
    RETURNING to_jsonb(tbl_user_profile.*) INTO result;

    RETURN json_build_object('success', true, 'profile', result);
END;
$$;

-- RPC 함수들에 권한 부여
GRANT EXECUTE ON FUNCTION public.get_user_profile() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_profile_by_id(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.search_profiles_by_nickname(text, int) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.update_user_profile(text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_user_profile(text, text, text) TO authenticated;