 "tbl_user_profile"
   "gender_code" varchar DEFAULT NULL,
  "age_group_code" varchar DEFAULT NULL;


-- 사용자 프로필 정보를 저장하는 테이블
CREATE TABLE public.tbl_user_profile (
    -- 기본 키: Supabase 인증 사용자 ID (auth.users 테이블 참조)
    -- 각 인증 사용자는 하나의 프로필만 가짐
    auth_user_id uuid PRIMARY KEY NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, -- auth.users 레코드 삭제 시 연관된 프로필 자동 삭제

    -- 공개 프로필 ID: 외부에 노출될 수 있는 고유하고 변경되지 않는 식별자
    -- 예: 프로필 URL (/profile/{public_profile_id}) 등에 사용
    public_profile_id uuid NOT NULL UNIQUE DEFAULT uuid_generate_v4(),

    -- 닉네임: 사용자가 설정하는 별명 (화면 표시용)
    -- UNIQUE 제약 조건은 제거함 (동일 닉네임 허용). 필요시 추가 가능.
    nickname text NOT NULL CHECK (length(nickname) >= 2 AND length(nickname) <= 30),

    -- 소개: 사용자 자기소개글 (선택 사항)
    bio text NULL CHECK (length(bio) <= 200), -- 최대 길이 제한

    -- 프로필 이미지 URL: 사용자가 설정한 프로필 사진의 경로 또는 URL (선택 사항)
    profile_image_url text NULL,

    -- 생성 시각: 프로필 레코드 생성 시각
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,

    -- 수정 시각: 프로필 정보 마지막 수정 시각
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 테이블 및 컬럼에 대한 주석 (설명 추가)
COMMENT ON TABLE public.tbl_user_profile IS '사용자의 공개 프로필 정보를 저장하는 테이블';
COMMENT ON COLUMN public.tbl_user_profile.auth_user_id IS 'Supabase 인증 사용자 ID (PK, FK - auth.users.id 참조)';
COMMENT ON COLUMN public.tbl_user_profile.public_profile_id IS '공개적으로 사용될 고유 프로필 ID (UUID)';
COMMENT ON COLUMN public.tbl_user_profile.nickname IS '사용자 닉네임 (화면 표시용, 2~30자)';
COMMENT ON COLUMN public.tbl_user_profile.bio IS '사용자 자기소개 (최대 200자)';
COMMENT ON COLUMN public.tbl_user_profile.profile_image_url IS '프로필 이미지 URL';
COMMENT ON COLUMN public.tbl_user_profile.created_at IS '프로필 생성 시각 (UTC)';
COMMENT ON COLUMN public.tbl_user_profile.updated_at IS '프로필 마지막 수정 시각 (UTC)';

-- 인덱스 생성: 조회 성능 향상
-- 공개 프로필 ID로 사용자 조회 (UNIQUE 인덱스는 UNIQUE 제약조건으로 자동 생성됨)
-- 닉네임으로 사용자 검색 (부분 일치 검색 등)
-- CREATE INDEX idx_user_profile_nickname ON public.tbl_user_profile USING gin (nickname gin_trgm_ops); -- trigram 인덱스 (pg_trgm 확장 필요) 또는 일반 B-tree 인덱스
-- CREATE INDEX idx_user_profile_nickname ON public.tbl_user_profile (nickname text_pattern_ops); -- 접두사 검색용 B-tree 인덱스

-- RLS(행 수준 보안) 활성화
ALTER TABLE public.tbl_user_profile ENABLE ROW LEVEL SECURITY;

-- RLS 정책 예시

-- 누구나 프로필 정보를 읽을 수 있도록 허용
CREATE POLICY "Allow public read access to profiles"
ON public.tbl_user_profile FOR SELECT
USING (true);

-- 로그인한 사용자는 자신의 프로필 정보를 삽입할 수 있도록 허용 (보통 가입 시 트리거 등으로 자동 생성)
CREATE POLICY "Allow users to insert their own profile"
ON public.tbl_user_profile FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = auth_user_id);

-- 사용자는 자신의 프로필 정보(닉네임, 소개, 이미지 URL 등)를 수정할 수 있도록 허용
CREATE POLICY "Allow users to update their own profile"
ON public.tbl_user_profile FOR UPDATE
USING (auth.uid() = auth_user_id)
WITH CHECK (auth.uid() = auth_user_id);

-- (프로필 삭제는 auth.users 삭제 시 자동으로 처리되므로 별도 DELETE 정책 불필요)


-- updated_at 자동 업데이트 트리거 함수 (이전에 생성했다면 생략 가능)
-- CREATE OR REPLACE FUNCTION public.update_updated_at_column()...

-- tbl_user_profile 테이블에 트리거 적용: 행이 업데이트될 때마다 updated_at 자동 갱신
CREATE TRIGGER update_tbl_user_profile_updated_at
BEFORE UPDATE ON public.tbl_user_profile
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();


-- (선택 사항) auth.users 테이블에 새 사용자가 추가될 때 자동으로 프로필 생성하는 트리거
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER -- auth.users 테이블 접근 권한 필요
AS $$
DECLARE
  base_nickname TEXT;
  final_nickname TEXT;
  random_suffix TEXT;
BEGIN
  -- 이메일에서 @ 앞 부분을 기본 닉네임으로 사용하거나, 없다면 'user' 사용
  base_nickname := split_part(NEW.email, '@', 1);
  IF base_nickname = '' OR base_nickname IS NULL THEN
    base_nickname := 'user';
  END IF;
  -- 기본 닉네임 길이 제한
  base_nickname := left(base_nickname, 20);

  -- 랜덤 숫자 4자리 추가 (혹시 모를 초기 중복 방지 및 식별 용이)
  random_suffix := floor(random() * 9000 + 1000)::text;
  final_nickname := base_nickname || '_' || random_suffix;

  -- tbl_user_profile에 새 레코드 삽입
  INSERT INTO public.tbl_user_profile (auth_user_id, nickname)
  VALUES (NEW.id, final_nickname);
  RETURN NEW;
END;
$$;

-- auth.users 테이블에 트리거 부착
-- CREATE TRIGGER on_auth_user_created
--   AFTER INSERT ON auth.users
--   FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
