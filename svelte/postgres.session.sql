ALTER TABLE "tbl_place"
  ADD COLUMN "group1" varchar,
  ADD COLUMN "group2" varchar,
  ADD COLUMN "group3" varchar;

ALTER TABLE "tbl_place_review"
  ADD COLUMN "group1" varchar,
  ADD COLUMN "group2" varchar,
  ADD COLUMN "group3" varchar;




select
  rolname,
  rolconfig
from pg_roles
where
  rolname in (
    'anon',
    'authenticated',
    'postgres',
    'service_role'
    -- ,<ANY CUSTOM ROLES>
  );

  alter database postgres set statement_timeout TO '10s';

  alter role anon set statement_timeout = '10min'; -- could also use seconds '10s'


  show statement_timeout;



CREATE INDEX idx_votedKeyword ON tbl_place USING GIN ((visitor_review_stats->'analysis'->'votedKeyword'->'details'));


-- food_good이 가장 많은 장소 50개 조회
SELECT 
  p.id, p.name, p.group1, p.group2, p.group3, 
  -- 기타 필요한 컬럼들
  kw->>'code' as keyword_code,
  (kw->>'count')::int as keyword_count
FROM 
  tbl_place p,
  jsonb_array_elements(p.visitor_review_stats->'analysis'->'votedKeyword'->'details') as kw
WHERE 
  kw->>'code' = 'food_good'
  and group1 = '부산'
  and group2 = '동래구'
ORDER BY 
  (kw->>'count')::int DESC
LIMIT 50;



SELECT 
    p.category,
    COUNT(r.id) AS total_reviews,
    AVG(r.rating) AS avg_rating,
    MIN(r.rating) AS min_rating,
    MAX(r.rating) AS max_rating,
    STDDEV_SAMP(r.rating) AS rating_stddev  -- PostgreSQL의 표본 표준편차 함수
FROM 
    tbl_place p
JOIN 
    tbl_place_review r ON p.id = r.business_id
WHERE 
    r.rating IS NOT NULL
GROUP BY 
    p.category
HAVING 
    COUNT(r.id) >= 10  -- 최소 10개 이상의 리뷰가 있는 카테고리만 선택
ORDER BY 
    avg_rating DESC, total_reviews DESC;


copy (select category,category_code, count(*) from tbl_place 
group by category,category_code
order by 3 desc) to '/Users/kwon/codes/supabase/duckdb/data/category_result.csv' (FORMAT CSV, HEADER);

COPY (SELECT * FROM 테이블명) TO '/tmp/temp_result.csv' (FORMAT CSV, HEADER);
