-- place_feed.sql 파일에 추가될 뷰 정의
CREATE OR REPLACE VIEW public.v1_common_view_place_with_images AS
WITH place_images AS (
  SELECT
    business_id,
    array_agg(thumbnail ORDER BY updated_at DESC) AS image_urls -- business_id 별로 최신 10개 이미지 URL을 최신순으로 배열로 집계
  FROM (
    SELECT
      business_id,
      jsonb_array_elements(media)->>'thumbnail' AS thumbnail,
      updated_at,
      ROW_NUMBER() OVER(PARTITION BY business_id ORDER BY updated_at DESC) as rn
    FROM tbl_place_review
    WHERE media IS NOT NULL
    AND jsonb_typeof(media) = 'array'
    AND jsonb_array_length(media) > 0
  ) ranked_images
  WHERE rn <= 10 -- 각 business_id별 최신 10개만 선택
  AND thumbnail IS NOT NULL
  GROUP BY business_id
)
SELECT
  p.*,
  img.image_urls,
  split_part(p.address,' ',1) AS group1,
  split_part(p.address,' ',2) AS group2,
  split_part(p.address,' ',3) AS group3

FROM tbl_place AS p
LEFT JOIN place_images AS img ON p.id = img.business_id
limit 100;
-- 뷰에 대한 접근 권한 부여 (필요시)
GRANT SELECT ON public.v1_common_view_place_with_images TO authenticated, anon;
