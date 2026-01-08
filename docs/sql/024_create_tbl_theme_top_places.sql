-- =====================================================
-- 024_create_tbl_theme_top_places.sql
-- 각 테마별 상위 인기 장소 캐시 테이블
-- 실시간 연산량을 획기적으로 줄여 5초 타임아웃 해결
-- =====================================================

CREATE TABLE IF NOT EXISTS public.tbl_theme_top_places (
    theme_code TEXT,
    place_id TEXT,
    count INT,
    group1 TEXT,
    visitor_reviews_total INT,
    visitor_reviews_score NUMERIC(3,2),
    PRIMARY KEY (theme_code, place_id)
);

CREATE INDEX idx_theme_top_lookup ON public.tbl_theme_top_places (theme_code, group1);
CREATE INDEX idx_theme_top_place_id ON public.tbl_theme_top_places (place_id);

-- 데이터 채우기 (각 테마별 상위 2000개)
-- 이 작업은 배치로 실행되어야 하며, 여기서는 주요 테마에 대해 우선 실행
INSERT INTO public.tbl_theme_top_places
SELECT 
    theme_code, place_id, count, group1, visitor_reviews_total, visitor_reviews_score
FROM (
    SELECT 
        d->>'code' AS theme_code,
        p.id AS place_id,
        (d->>'count')::INT AS count,
        p.group1,
        p.visitor_reviews_total,
        p.visitor_reviews_score,
        ROW_NUMBER() OVER(PARTITION BY d->>'code' ORDER BY (d->>'count')::INT DESC) as rank
    FROM 
        public.tbl_place p,
        jsonb_array_elements(COALESCE(p.visitor_review_stats->'analysis'->'votedKeyword'->'details', '[]'::jsonb)) AS d
) t
WHERE rank <= 2000
ON CONFLICT (theme_code, place_id) DO UPDATE SET count = EXCLUDED.count;
