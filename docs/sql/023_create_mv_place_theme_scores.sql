-- =====================================================
-- 023_create_mv_place_theme_scores.sql (경량화 버전)
-- 실행 방법:
--   psql "postgresql://postgres.xyqpggpilgcdsawuvpzn:ZNDqDunnaydr0aFQ@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres" -f docs/sql/023_create_mv_place_theme_scores.sql
-- =====================================================

DROP MATERIALIZED VIEW IF EXISTS public.mv_place_theme_scores;

CREATE MATERIALIZED VIEW public.mv_place_theme_scores AS
SELECT 
    p.id AS place_id,
    d->>'code' AS theme_code,
    (d->>'count')::INT AS count
FROM 
    public.tbl_place p,
    jsonb_array_elements(COALESCE(p.visitor_review_stats->'analysis'->'votedKeyword'->'details', '[]'::jsonb)) AS d
WITH DATA;

-- 필수 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_mv_theme_code ON public.mv_place_theme_scores (theme_code);
CREATE INDEX IF NOT EXISTS idx_mv_theme_place_id ON public.mv_place_theme_scores (place_id);
CREATE INDEX IF NOT EXISTS idx_mv_theme_code_place_id ON public.mv_place_theme_scores (theme_code, place_id);
