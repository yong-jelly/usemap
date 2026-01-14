-- =====================================================
-- 001_create_tables.sql
-- 인스타그램 사용자 및 콘텐츠 관리를 위한 테이블 생성
-- 
-- 실행 방법:
--   psql "postgresql://postgres.xyqpggpilgcdsawuvpzn:ZNDqDunnaydr0aFQ@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres" -f docs/sql/insta-gram/001_create_tables.sql
-- =====================================================

-- 1. 인스타그램 사용자 테이블
CREATE TABLE IF NOT EXISTS public.tbl_instagram_user (
    id TEXT PRIMARY KEY,
    user_name TEXT NOT NULL,
    full_name TEXT,
    bio TEXT,
    followers INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE public.tbl_instagram_user IS '인스타그램 사용자 정보 테이블';
COMMENT ON COLUMN public.tbl_instagram_user.id IS '인스타그램 사용자 고유 ID (PK)';
COMMENT ON COLUMN public.tbl_instagram_user.user_name IS '인스타그램 사용자명 (ID)';
COMMENT ON COLUMN public.tbl_instagram_user.full_name IS '사용자 전체 이름';
COMMENT ON COLUMN public.tbl_instagram_user.bio IS '사용자 프로필 소개';
COMMENT ON COLUMN public.tbl_instagram_user.followers IS '팔로워 수';

-- 2. 인스타그램 콘텐츠 테이블
CREATE TABLE IF NOT EXISTS public.tbl_instagram_content (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES public.tbl_instagram_user(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    taken_at TIMESTAMPTZ NOT NULL,
    caption TEXT,
    place_name TEXT DEFAULT '',
    place_id TEXT DEFAULT '',
    is_place BOOLEAN DEFAULT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE public.tbl_instagram_content IS '인스타그램 콘텐츠 및 업체 매핑 테이블';
COMMENT ON COLUMN public.tbl_instagram_content.id IS '콘텐츠 고유 ID (PK)';
COMMENT ON COLUMN public.tbl_instagram_content.user_id IS '사용자 고유 ID (FK)';
COMMENT ON COLUMN public.tbl_instagram_content.code IS '게시물 숏코드 (URL 등에 사용)';
COMMENT ON COLUMN public.tbl_instagram_content.taken_at IS '게시물 작성 시각';
COMMENT ON COLUMN public.tbl_instagram_content.caption IS '게시물 캡션(본문)';
COMMENT ON COLUMN public.tbl_instagram_content.place_name IS '업체명 (관리자 입력)';
COMMENT ON COLUMN public.tbl_instagram_content.place_id IS '업체 고유 코드 (관리자 입력)';
COMMENT ON COLUMN public.tbl_instagram_content.is_place IS '업체 여부 (TRUE: 업체, FALSE: 비업체, NULL: 미분류)';

-- 3. 트리거 설정 (updated_at 자동 갱신)
DROP TRIGGER IF EXISTS tr_tbl_instagram_user_updated_at ON public.tbl_instagram_user;
CREATE TRIGGER tr_tbl_instagram_user_updated_at
BEFORE UPDATE ON public.tbl_instagram_user
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS tr_tbl_instagram_content_updated_at ON public.tbl_instagram_content;
CREATE TRIGGER tr_tbl_instagram_content_updated_at
BEFORE UPDATE ON public.tbl_instagram_content
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 권한 부여
GRANT ALL ON public.tbl_instagram_user TO postgres, authenticated, service_role;
GRANT ALL ON public.tbl_instagram_content TO postgres, authenticated, service_role;
