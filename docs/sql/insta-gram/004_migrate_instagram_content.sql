-- =====================================================
-- 004_migrate_instagram_content.sql
-- 기존 인스타그램 콘텐츠 데이터 마이그레이션 및 컬럼 정리
-- 
-- 실행 방법:
--   psql "postgresql://postgres.xyqpggpilgcdsawuvpzn:ZNDqDunnaydr0aFQ@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres" -f docs/sql/insta-gram/004_migrate_instagram_content.sql
-- =====================================================

-- 1. 기존 place_id를 tbl_instagram_place로 마이그레이션
-- tbl_place에 실제로 존재하는 ID만 마이그레이션합니다.
INSERT INTO public.tbl_instagram_place (content_id, place_id)
SELECT id, place_id 
FROM public.tbl_instagram_content 
WHERE place_id IS NOT NULL AND place_id != ''
  AND EXISTS (SELECT 1 FROM public.tbl_place WHERE id = place_id)
ON CONFLICT (content_id, place_id) DO NOTHING;

-- 2. is_place 자동 업데이트
-- tbl_instagram_place에 매핑된 업체가 있으면 true, 없으면 false (기존에 null이거나 true인 것들 대상)
UPDATE public.tbl_instagram_content
SET is_place = EXISTS (
  SELECT 1 FROM public.tbl_instagram_place WHERE content_id = public.tbl_instagram_content.id
)
WHERE is_place IS NULL OR is_place = true;

-- 3. 기존 컬럼 제거
-- 마이그레이션이 완료되었으므로 더 이상 필요 없는 컬럼을 삭제합니다.
ALTER TABLE public.tbl_instagram_content DROP COLUMN IF EXISTS place_name;
ALTER TABLE public.tbl_instagram_content DROP COLUMN IF EXISTS place_id;
