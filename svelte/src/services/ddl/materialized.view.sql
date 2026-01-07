-- [2025/04//18]
-- 4개의 mv리뷰 데이터를 하나의 mv로 생성, 사용자 북마크 및 좋아요를 위한 join 테이블로 사용
-- [todo] 4개의 mv를 처음부터 1개의 mv로 만들고 컬럼을 추가해서 분류하는게 더 좋을듯?
CREATE MATERIALIZED VIEW mv_place_review_combined AS
WITH ranked_reviews AS (
  SELECT 
    r.id,
    r.business_id,
    r.business_name,
    r.x,
    r.y,
    
    r.common_address,
    r.category,
    r.visitor_review_score,
    r.visitor_review_count,
    r.author_nickname,
    r.body,
    r.media,
    r.visit_count,
    r.visited,
    r.created,
    COALESCE(r.view_count, 0) as view_count,
    r.parsed_date,
    r.parsed_visit_date,
    COALESCE(r.quality_score, 0) as quality_score,
    COALESCE(r.avg_visit_count, 0) as avg_visit_count,
    COALESCE(r.p75_visit_count, 0) as p75_visit_count,
    COALESCE(r.p90_visit_count, 0) as p90_visit_count,
    COALESCE(r.regular_customer_score, 0) as regular_customer_score,
    'regular_customer' as review_type,
    ROW_NUMBER() OVER (PARTITION BY r.business_id ORDER BY r.regular_customer_score DESC NULLS LAST) as rn
  FROM mv_place_review_regular_customer_for_10k r
  
  UNION ALL
  
  SELECT 
    r.id,
    r.business_id,
    r.business_name,
    r.x,
    r.y,
    
    r.common_address,
    r.category,
    r.visitor_review_score,
    r.visitor_review_count,
    r.author_nickname,
    r.body,
    r.media,
    r.visit_count,
    r.visited,
    r.created,
    COALESCE(r.view_count, 0) as view_count,
    r.parsed_date,
    NULL as parsed_visit_date,
    COALESCE(r.quality_score, 0) as quality_score,
    0 as avg_visit_count,
    0 as p75_visit_count,
    0 as p90_visit_count,
    0 as regular_customer_score,
    'hidden_gem' as review_type,
    ROW_NUMBER() OVER (PARTITION BY r.business_id ORDER BY r.quality_score DESC NULLS LAST) as rn
  FROM mv_place_review_hidden_gem_for_10k r
  
  UNION ALL
  
  SELECT 
    r.id,
    r.business_id,
    r.business_name,
    r.x,
    r.y,
    
    r.common_address,
    r.category,
    r.visitor_review_score,
    r.visitor_review_count,
    r.author_nickname,
    r.body,
    r.media,
    r.visit_count,
    r.visited,
    r.created,
    COALESCE(r.view_count, 0) as view_count,
    NULL as parsed_date,
    NULL as parsed_visit_date,
    0 as quality_score,
    0 as avg_visit_count,
    0 as p75_visit_count,
    0 as p90_visit_count,
    0 as regular_customer_score,
    'seasonal' as review_type,
    ROW_NUMBER() OVER (PARTITION BY r.business_id ORDER BY r.base_popularity_score DESC NULLS LAST) as rn
  FROM mv_place_review_seasonal_for_2y_10k r
  
  UNION ALL
  
  SELECT 
    r.id,
    r.business_id,
    r.business_name,
    r.x,
    r.y,
    
    r.common_address,
    r.category,
    r.visitor_review_score,
    r.visitor_review_count,
    r.author_nickname,
    r.body,
    r.media,
    r.visit_count,
    r.visited,
    r.created,
    COALESCE(r.view_count, 0) as view_count,
    NULL as parsed_date,
    NULL as parsed_visit_date,
    0 as quality_score,
    0 as avg_visit_count,
    0 as p75_visit_count,
    0 as p90_visit_count,
    0 as regular_customer_score,
    'popularity' as review_type,
    ROW_NUMBER() OVER (PARTITION BY r.business_id ORDER BY r.base_popularity_score DESC NULLS LAST) as rn
  FROM mv_place_review_popularity_for_3m_10k r
)
SELECT 
  id,
  business_id,
  business_name,
  x,
  y,
  common_address,
  category,
  visitor_review_score,
  visitor_review_count,
  author_nickname,
  body,
  media,
  visit_count,
  visited,
  created,
  view_count,
  parsed_date,
  parsed_visit_date,
  quality_score,
  avg_visit_count,
  p75_visit_count,
  p90_visit_count,
  regular_customer_score,
  review_type
FROM ranked_reviews
WHERE rn = 1;