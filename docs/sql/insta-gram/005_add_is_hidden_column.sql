-- =====================================================
-- 005_add_is_hidden_column.sql
-- 인스타그램 콘텐츠 숨김 처리를 위한 컬럼 추가
-- 
-- 실행 방법:
--   psql "postgresql://postgres.xyqpggpilgcdsawuvpzn:ZNDqDunnaydr0aFQ@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres" -f docs/sql/insta-gram/005_add_is_hidden_column.sql
-- =====================================================

-- 1. is_hidden 컬럼 추가
ALTER TABLE public.tbl_instagram_content 
ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN DEFAULT false;

COMMENT ON COLUMN public.tbl_instagram_content.is_hidden IS '목록에서 숨김 여부';

-- 2. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_instagram_content_is_hidden ON public.tbl_instagram_content(is_hidden);
