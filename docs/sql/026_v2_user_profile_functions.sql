-- =====================================================
-- 026_v2_user_profile_functions.sql
-- 사용자 프로필 관리 고도화 (자동 생성, 랜덤 이름/아바타, username 체계)
-- 
-- 실행 방법:
--   psql "postgresql://postgres.xyqpggpilgcdsawuvpzn:ZNDqDunnaydr0aFQ@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres" -f docs/sql/026_v2_user_profile_functions.sql
-- =====================================================

-- 1. 테이블 스키마 변경 (username 컬럼 추가)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tbl_user_profile' AND column_name='username') THEN
        ALTER TABLE public.tbl_user_profile ADD COLUMN username text;
        ALTER TABLE public.tbl_user_profile ADD CONSTRAINT tbl_user_profile_username_key UNIQUE (username);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tbl_user_profile' AND column_name='email') THEN
        ALTER TABLE public.tbl_user_profile ADD COLUMN email text;
    END IF;
END $$;

-- 2. v2_upsert_user_profile 함수 생성
-- OAuth 로그인 시 또는 프로필 정보 업데이트 시 사용
-- 프로필이 없으면 자동 생성 (랜덤 닉네임, 랜덤 아바타 적용)
CREATE OR REPLACE FUNCTION public.v2_upsert_user_profile(
    p_nickname text DEFAULT NULL,
    p_bio text DEFAULT NULL,
    p_profile_image_url text DEFAULT NULL,
    p_email text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_current_user_id uuid;
    v_existing_profile record;
    v_username text;
    v_nickname text := p_nickname;
    v_profile_image_url text := p_profile_image_url;
    v_result jsonb;
    v_random_seed text;
BEGIN
    v_current_user_id := auth.uid();
    IF v_current_user_id IS NULL THEN
        RETURN json_build_object('success', false, 'message', '인증된 사용자만 접근 가능합니다.');
    END IF;

    -- 기존 프로필 확인
    SELECT * INTO v_existing_profile FROM public.tbl_user_profile WHERE auth_user_id = v_current_user_id;

    -- 신규 사용자인 경우 기본값 설정
    IF v_existing_profile IS NULL THEN
        -- 1. username 생성 (user_ + auth_id 앞 8자리)
        v_username := 'user_' || substring(v_current_user_id::text from 1 for 8);
        
        -- 2. 닉네임이 없으면 username을 기본값으로 사용
        IF v_nickname IS NULL OR v_nickname = '' THEN
            v_nickname := v_username;
        END IF;

        -- 3. 프로필 이미지가 없으면 랜덤 아바타 (DiceBear) 적용
        IF v_profile_image_url IS NULL OR v_profile_image_url = '' THEN
            v_random_seed := substring(v_current_user_id::text from 1 for 6);
            v_profile_image_url := 'https://api.dicebear.com/7.x/avataaars/svg?seed=' || v_random_seed;
        END IF;

        -- INSERT 수행
        INSERT INTO public.tbl_user_profile (
            auth_user_id, 
            username, 
            nickname, 
            bio, 
            profile_image_url, 
            email
        )
        VALUES (
            v_current_user_id, 
            v_username, 
            v_nickname, 
            p_bio, 
            v_profile_image_url, 
            p_email
        )
        RETURNING to_jsonb(tbl_user_profile.*) INTO v_result;
    ELSE
        -- 기존 사용자 UPDATE 수행
        UPDATE public.tbl_user_profile
        SET 
            nickname = COALESCE(p_nickname, nickname),
            bio = COALESCE(p_bio, bio),
            profile_image_url = COALESCE(p_profile_image_url, profile_image_url),
            email = COALESCE(p_email, email),
            updated_at = now()
        WHERE auth_user_id = v_current_user_id
        RETURNING to_jsonb(tbl_user_profile.*) INTO v_result;
    END IF;

    RETURN json_build_object('success', true, 'profile', v_result);
END;
$$;

COMMENT ON FUNCTION public.v2_upsert_user_profile IS 'v2: 프로필 자동 생성 및 업데이트 (랜덤 아바타/username 지원)';
GRANT EXECUTE ON FUNCTION public.v2_upsert_user_profile TO authenticated;
