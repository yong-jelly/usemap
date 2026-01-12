-- =====================================================
-- 003_create_tbl_user_profile.sql
-- 사용자 프로필 테이블 생성 및 관련 트리거/정책 설정
-- 
-- 실행 방법:
--   psql "postgresql://postgres.xyqpggpilgcdsawuvpzn:ZNDqDunnaydr0aFQ@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres" -f docs/sql/003_create_tbl_user_profile.sql
-- =====================================================

-- 1. 사용자 프로필 테이블 생성
CREATE TABLE IF NOT EXISTS public.tbl_user_profile (
    auth_user_id uuid NOT NULL,
    public_profile_id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    nickname text NOT NULL,
    bio text,
    profile_image_url text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    gender_code character varying,
    age_group_code character varying,
    CONSTRAINT tbl_user_profile_bio_check CHECK ((length(bio) <= 200)),
    CONSTRAINT tbl_user_profile_nickname_check CHECK (((length(nickname) >= 2) AND (length(nickname) <= 30)))
);

-- 2. 제약 조건 및 인덱스
ALTER TABLE ONLY public.tbl_user_profile
    ADD CONSTRAINT tbl_user_profile_pkey PRIMARY KEY (auth_user_id);

ALTER TABLE ONLY public.tbl_user_profile
    ADD CONSTRAINT tbl_user_profile_public_profile_id_key UNIQUE (public_profile_id);

-- 3. 트리거 설정
CREATE TRIGGER update_tbl_user_profile_updated_at 
BEFORE UPDATE ON public.tbl_user_profile 
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auth 가입 시 자동 생성 트리거
-- CREATE TRIGGER on_auth_user_created
--   AFTER INSERT ON auth.users
--   FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. 외래 키 설정
ALTER TABLE ONLY public.tbl_user_profile
    ADD CONSTRAINT tbl_user_profile_auth_user_id_fkey 
    FOREIGN KEY (auth_user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 5. RLS (Row Level Security) 설정
ALTER TABLE public.tbl_user_profile ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to profiles" 
ON public.tbl_user_profile FOR SELECT USING (true);

CREATE POLICY "Allow users to insert their own profile" 
ON public.tbl_user_profile FOR INSERT 
TO authenticated 
WITH CHECK ((auth.uid() = auth_user_id));

CREATE POLICY "Allow users to update their own profile" 
ON public.tbl_user_profile FOR UPDATE 
USING ((auth.uid() = auth_user_id)) 
WITH CHECK ((auth.uid() = auth_user_id));

-- 6. 권한 부여
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.tbl_user_profile TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.tbl_user_profile TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.tbl_user_profile TO service_role;

-- 7. 코멘트 추가
COMMENT ON TABLE public.tbl_user_profile IS '사용자의 공개 프로필 정보를 저장하는 테이블';
COMMENT ON COLUMN public.tbl_user_profile.auth_user_id IS 'Supabase 인증 사용자 ID (PK, FK - auth.users.id 참조)';
COMMENT ON COLUMN public.tbl_user_profile.public_profile_id IS '공개적으로 사용될 고유 프로필 ID (UUID)';
COMMENT ON COLUMN public.tbl_user_profile.nickname IS '사용자 닉네임 (화면 표시용, 2~30자)';
COMMENT ON COLUMN public.tbl_user_profile.bio IS '사용자 자기소개 (최대 200자)';
COMMENT ON COLUMN public.tbl_user_profile.profile_image_url IS '프로필 이미지 URL';
COMMENT ON COLUMN public.tbl_user_profile.created_at IS '프로필 생성 시각 (UTC)';
COMMENT ON COLUMN public.tbl_user_profile.updated_at IS '프로필 마지막 수정 시각 (UTC)';
COMMENT ON COLUMN public.tbl_user_profile.gender_code IS '성별 코드';
COMMENT ON COLUMN public.tbl_user_profile.age_group_code IS '연령대 코드';
