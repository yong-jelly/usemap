-- [내 음식 취향 분석]
-- 총 활동
-- 좋아요
select
  count(*)
from
  tbl_like
where
  user_id = 'b75408a1-c1cf-43b6-b6f1-3b7288745b62'
  and liked = true
  and liked_type = 'place';

-- 저장
select
  count(*)
from
  tbl_save
where
  user_id = 'b75408a1-c1cf-43b6-b6f1-3b7288745b62'
  and saved = true
  and saved_type = 'place';

-- 방문
select
  count(*)
from
  tbl_visited
where
  user_id = 'b75408a1-c1cf-43b6-b6f1-3b7288745b62';

-- 지역 탐방 횟수 (전체 258개)
select
  count(distinct b.group2)
from
  tbl_visited a
  left join tbl_place b on a.place_id = b.id
where
  a.user_id = 'b75408a1-c1cf-43b6-b6f1-3b7288745b62';

-- * 카테고리별 활동 횟수
WITH user_places_categorized AS (
  -- liked places
  SELECT
    p.category,
    up.place_id,
    'liked' as source_type
  FROM
    (
      SELECT
        ref_liked_id as place_id
      FROM
        tbl_like
      WHERE
        user_id = 'b75408a1-c1cf-43b6-b6f1-3b7288745b62'
        AND liked = true
        AND liked_type = 'place'
    ) up
    LEFT JOIN tbl_place p ON up.place_id = p.id
  WHERE
    p.category IS NOT NULL
  UNION
  ALL -- saved places
  SELECT
    p.category,
    up.place_id,
    'saved' as source_type
  FROM
    (
      SELECT
        ref_saved_id as place_id
      FROM
        tbl_save
      WHERE
        user_id = 'b75408a1-c1cf-43b6-b6f1-3b7288745b62'
        AND saved = true
        AND saved_type = 'place'
    ) up
    LEFT JOIN tbl_place p ON up.place_id = p.id
  WHERE
    p.category IS NOT NULL
  UNION
  ALL -- visited places
  SELECT
    p.category,
    up.place_id,
    'visited' as source_type
  FROM
    (
      SELECT
        place_id
      FROM
        tbl_visited
      WHERE
        user_id = 'b75408a1-c1cf-43b6-b6f1-3b7288745b62'
    ) up
    LEFT JOIN tbl_place p ON up.place_id = p.id
  WHERE
    p.category IS NOT NULL
),
category_aggregations AS (
  SELECT
    category,
    COUNT(DISTINCT place_id) as all_count,
    jsonb_build_object(
      'agg_group',
      category,
      -- 카테고리명 추가
      'all',
      COUNT(DISTINCT place_id),
      'liked',
      COUNT(
        DISTINCT CASE
          WHEN source_type = 'liked' THEN place_id
        END
      ),
      'saved',
      COUNT(
        DISTINCT CASE
          WHEN source_type = 'saved' THEN place_id
        END
      ),
      'visited',
      COUNT(
        DISTINCT CASE
          WHEN source_type = 'visited' THEN place_id
        END
      )
    ) as category_data
  FROM
    user_places_categorized
  GROUP BY
    category
  ORDER BY
    all_count DESC
)
SELECT
  'taste_aggr_category' :: TEXT as agg_name,
  jsonb_agg(
    category_data
    ORDER BY
      all_count DESC
  ) as aggregation -- 배열 형태로 변경
FROM
  category_aggregations;

-- * 지역(group1)별 활동 횟수
WITH user_places_detailed AS (
  -- liked places
  SELECT
    p.group1,
    upd.place_id,
    'liked' as source_type
  FROM
    (
      SELECT
        ref_liked_id as place_id
      FROM
        tbl_like
      WHERE
        user_id = 'b75408a1-c1cf-43b6-b6f1-3b7288745b62'
        AND liked = true
        AND liked_type = 'place'
    ) upd
    LEFT JOIN tbl_place p ON upd.place_id = p.id
  WHERE
    p.group1 IS NOT NULL
  UNION
  ALL -- saved places
  SELECT
    p.group1,
    upd.place_id,
    'saved' as source_type
  FROM
    (
      SELECT
        ref_saved_id as place_id
      FROM
        tbl_save
      WHERE
        user_id = 'b75408a1-c1cf-43b6-b6f1-3b7288745b62'
        AND saved = true
        AND saved_type = 'place'
    ) upd
    LEFT JOIN tbl_place p ON upd.place_id = p.id
  WHERE
    p.group1 IS NOT NULL
  UNION
  ALL -- visited places
  SELECT
    p.group1,
    upd.place_id,
    'visited' as source_type
  FROM
    (
      SELECT
        place_id
      FROM
        tbl_visited
      WHERE
        user_id = 'b75408a1-c1cf-43b6-b6f1-3b7288745b62'
    ) upd
    LEFT JOIN tbl_place p ON upd.place_id = p.id
  WHERE
    p.group1 IS NOT NULL
),
group1_aggregations AS (
  SELECT
    group1,
    COUNT(*) as all_count,
    jsonb_build_object(
      'agg_group',
      group1,
      'all',
      COUNT(*),
      'liked',
      COUNT(
        CASE
          WHEN source_type = 'liked' THEN 1
        END
      ),
      'saved',
      COUNT(
        CASE
          WHEN source_type = 'saved' THEN 1
        END
      ),
      'visited',
      COUNT(
        CASE
          WHEN source_type = 'visited' THEN 1
        END
      )
    ) as group1_data
  FROM
    user_places_detailed
  GROUP BY
    group1
  ORDER BY
    all_count DESC
)
SELECT
  'taste_aggr_group1' :: TEXT as agg_name,
  jsonb_agg(
    group1_data
    ORDER BY
      all_count DESC
  ) as aggregation -- 배열 형태로 반환
FROM
  group1_aggregations;

-- [기본쿼리]
-- 활동한 장소의 시/도별 분포 (중복 제거)
with user_places_detailed as (
  select
    ref_liked_id as place_id,
    'liked' as source
  from
    tbl_like
  where
    user_id = 'b75408a1-c1cf-43b6-b6f1-3b7288745b62'
    and liked = true
    and liked_type = 'place'
  union
  all -- UNION ALL 사용으로 중복 허용
  select
    ref_saved_id as place_id,
    'saved' as source
  from
    tbl_save
  where
    user_id = 'b75408a1-c1cf-43b6-b6f1-3b7288745b62'
    and saved = true
    and saved_type = 'place'
  union
  all
  select
    place_id,
    'visited' as source
  from
    tbl_visited
  where
    user_id = 'b75408a1-c1cf-43b6-b6f1-3b7288745b62'
)
select
  p.group1,
  count(*) as total_count
from
  user_places_detailed upd
  left join tbl_place p on upd.place_id = p.id
where
  p.group1 is not null
group by
  p.group1
order by
  total_count desc;

-- 음식별 카테고리 분포
with user_places as (
  select
    place_id
  from
    (
      select
        ref_liked_id as place_id
      from
        tbl_like
      where
        user_id = 'b75408a1-c1cf-43b6-b6f1-3b7288745b62'
        and liked = true
        and liked_type = 'place'
      union
      all
      select
        ref_saved_id as place_id
      from
        tbl_save
      where
        user_id = 'b75408a1-c1cf-43b6-b6f1-3b7288745b62'
        and saved = true
        and saved_type = 'place'
      union
      all
      select
        place_id
      from
        tbl_visited
      where
        user_id = 'b75408a1-c1cf-43b6-b6f1-3b7288745b62'
    ) combined_places
)
select
  p.category,
  count(*) as place_count
from
  user_places up
  left join tbl_place p on up.place_id = p.id
where
  p.category is not null
group by
  p.category
order by
  place_count desc;
