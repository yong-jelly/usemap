


-- 시/군/구 조회
SELECT 
  group1,
  jsonb_agg(DISTINCT group2) AS group2_json
FROM 
  tbl_place
GROUP BY 
  group1
having count(*) > 5000
ORDER BY 
  1 desc;


-- 그룹 코드
select category,count(*) from tbl_place
group by category
order by 2 desc;

select category,category_code_list,category_code from tbl_place where category_code in ('231430','231094','231034')


select * from tbl_place 
limit 10;




SELECT
  id, name, group1, group2, group3, category, 
  visitor_reviews_total, visitor_reviews_score,
  (
    SELECT details->>'count'
    FROM jsonb_array_elements(visitor_review_stats->'analysis'->'votedKeyword'->'details') AS details
    WHERE details->>'code' = 'food_good'
    LIMIT 1
  )::INT AS voted_keyword_count
FROM tbl_place
WHERE group1 = '대전'
  AND group2 = '중구'
  AND category = '한식'
  AND (conveniences IS NULL OR conveniences = '{}' OR conveniences @> ARRAY['포장']::varchar[])
ORDER BY voted_keyword_count DESC NULLS LAST, visitor_reviews_total DESC, visitor_reviews_score DESC
LIMIT 10;

