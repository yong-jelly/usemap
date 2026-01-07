-- 리뷰 점수 순 음식점 목록 조회 쿼리 (공통 함수 사용)
SELECT
  p.id,
  p.normalized_name,
  p.category,
  p.road_address,
  p.common_address,
  p.group1,
  p.group2,
  p.visitor_review_count,
  p.visitor_review_score,
  p.blog_cafe_review_count,
  p.updated_at,
  p.convenience,
  p.direction,
  p.website,
  p.description,
  p.url,
  p.original_url,
  p.voted_summary_text,
  p.voted_summary_code,
  -- 공통 함수를 호출하여 상세 정보 추가
  public.v1_get_place_details(p.id) AS details
FROM
  mv_place_summary p
ORDER BY
  p.visitor_review_score DESC NULLS LAST, -- 리뷰 점수 높은 순
  p.visitor_review_count DESC NULLS LAST  -- 리뷰 개수 많은 순 (점수 같을 시)
LIMIT 1;