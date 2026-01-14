-- =====================================================
-- 003_create_instagram_place_table.sql
-- 인스타그램 콘텐츠와 업체(tbl_place) 간의 다대다 매핑 테이블 생성
-- 
-- 실행 방법:
--   psql "postgresql://postgres.xyqpggpilgcdsawuvpzn:ZNDqDunnaydr0aFQ@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres" -f docs/sql/insta-gram/003_create_instagram_place_table.sql
-- =====================================================

-- 1. 인스타그램 업체 매핑 테이블 생성
CREATE TABLE IF NOT EXISTS public.tbl_instagram_place (
    id SERIAL PRIMARY KEY,
    content_id TEXT NOT NULL REFERENCES public.tbl_instagram_content(id) ON DELETE CASCADE,
    place_id TEXT NOT NULL REFERENCES public.tbl_place(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(content_id, place_id)
);

COMMENT ON TABLE public.tbl_instagram_place IS '인스타그램 콘텐츠와 매핑된 업체 정보';
COMMENT ON COLUMN public.tbl_instagram_place.id IS '고유 ID (PK)';
COMMENT ON COLUMN public.tbl_instagram_place.content_id IS '인스타그램 콘텐츠 ID (FK)';
COMMENT ON COLUMN public.tbl_instagram_place.place_id IS '업체 ID (FK, tbl_place.id)';

-- 2. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_instagram_place_content_id ON public.tbl_instagram_place(content_id);
CREATE INDEX IF NOT EXISTS idx_instagram_place_place_id ON public.tbl_instagram_place(place_id);

-- 3. 트리거 설정 (updated_at 자동 갱신)
DROP TRIGGER IF EXISTS tr_tbl_instagram_place_updated_at ON public.tbl_instagram_place;
CREATE TRIGGER tr_tbl_instagram_place_updated_at
BEFORE UPDATE ON public.tbl_instagram_place
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. 권한 부여
GRANT ALL ON public.tbl_instagram_place TO postgres, authenticated, service_role;
