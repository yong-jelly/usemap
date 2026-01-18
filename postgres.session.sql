select * from tbl_user_profile order by updated_at desc limit 10;


WITH recent AS (
  SELECT category, category_code
  FROM tbl_place
  ORDER BY created_at DESC
  LIMIT 1500
)
SELECT
  category,
  category_code,
  COUNT(*) AS cnt
FROM recent
GROUP BY category, category_code
ORDER BY cnt DESC, category, category_code;
