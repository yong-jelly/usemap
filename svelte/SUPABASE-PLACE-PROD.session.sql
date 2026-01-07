select
  name,
  count(*)
from
  tbl_naver_folder
group by
  name
order by
  2 desc;

SELECT
  *
FROM
  pg_collation
WHERE
  collname LIKE '%ko%'
  OR collname LIKE '%KR%';

select
  b.name,
  a.folder_id,
  count(*)
from
  tbl_naver_folder_place a
  left join tbl_naver_folder b on a.folder_id = b.folder_id
group by
  b.name,
  a.folder_id
order by
  b.name COLLATE "ko-KP-x-icu" ASC;

-- 해당 폴더의 장소 데이터 삭제
delete from
  tbl_naver_folder_place
where
  folder_id in (
    select
      folder_id
    from
      tbl_naver_folder
    where
      name like '[히든아카이브]%'
  );

-- 해당 폴더 삭제
delete from
  tbl_naver_folder
where
  folder_id in (
    select
      folder_id
    from
      tbl_naver_folder
    where
      name like '[히든아카이브]%'
  );

-- 테이블이 이미 존재할 경우 삭제 (개발 환경에서 편의를 위해 사용)
DROP TABLE IF EXISTS tbl_naver_folder;

CREATE TABLE tbl_naver_folder (
  id VARCHAR(255) NOT NULL,
  -- 폴더 고유 ID
  place_id VARCHAR(50) NOT NULL,
  -- 장소 ID
  name VARCHAR(255) NOT NULL,
  -- 폴더 이름
  memo TEXT,
  -- 폴더에 대한 설명/메모
  last_use_time TIMESTAMPTZ,
  -- 폴더 마지막 사용 시각
  creation_time TIMESTAMPTZ,
  -- 폴더 생성 시각
  is_ping_place boolean,
  -- place id를 네이버에서 정보가 있는지 체크했는지 여부
  ping_place_at TIMESTAMPTZ,
  -- is_ping_place 실행날짜
  url VARCHAR(2048),
  -- 북마크 관련 URL
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  PRIMARY KEY (id, place_id),
  -- 복합 기본 키 설정
  CONSTRAINT fk_place FOREIGN KEY (place_id) REFERENCES tbl_place(id)
);

-- 각 컬럼에 대한 설명(주석) 추가
COMMENT ON COLUMN tbl_naver_folder.id IS '테이블의 고유 식별자 (자동 증가)';

COMMENT ON COLUMN tbl_naver_folder.id IS '네이버 폴더의 고유 ID (원본 데이터)';

COMMENT ON COLUMN tbl_naver_folder.name IS '네이버 폴더의 이름';

COMMENT ON COLUMN tbl_naver_folder.memo IS '네이버 폴더에 대한 설명';

COMMENT ON COLUMN tbl_naver_folder.last_use_time IS '폴더가 마지막으로 사용된 시각';

COMMENT ON COLUMN tbl_naver_folder.creation_time IS '폴더가 생성된 시각';

COMMENT ON COLUMN tbl_naver_folder.place_id IS '장소의 고유 ID (tbl_place 테이블과 연결되는 외래 키)';

COMMENT ON COLUMN tbl_naver_folder.url IS '장소(북마크) 관련 URL';

COMMENT ON COLUMN tbl_naver_folder.created_at IS '데이터베이스 레코드 생성 시각 (UTC)';

COMMENT ON COLUMN tbl_naver_folder.updated_at IS '데이터베이스 레코드 마지막 수정 시각 (UTC)';

delete from
  tbl_place
where
  id in ('2017243702', '18457716');

-- 전체 추천 음식점
-- 음식점 갯수
select
  distinct(count(place_id))
from
  tbl_place_features
where
  status = 'active';

-- row 갯수
select
  count(*)
from
  tbl_place_features
where
  status = 'active';

-- 등록에 참여한 사용자 수
select
  count(distinct(user_id))
from
  tbl_place_features
where
  status = 'active';

-- 카테고리별
select
  b.category,
  count(*) as place_count
from
  tbl_place_features a
  left join tbl_place b on a.place_id = b.id
where
  a.status = 'active'
  and b.category is not null
group by
  b.category
order by
  2 desc;

-- platform_type별, metadata.domain별(platform_type별=community인 경우 metadata.domain으로 조회) 카운트
with platform_domains as (
  select
    platform_type,
    case
      when platform_type = 'youtube' then platform_type
      else metadata ->> 'domain'
    end as domain
  from
    tbl_place_features
  where
    status = 'active'
    and (
      (
        platform_type = 'community'
        and metadata ->> 'domain' is not null
      )
      or platform_type = 'youtube'
    )
)
select
  platform_type,
  domain,
  count(*) as place_count
from
  platform_domains
group by
  platform_type,
  domain
order by
  3 desc;

-- 내 기여도(row갯수 user_id=b75408a1-c1cf-43b6-b6f1-3b7288745b62)와 도메인별 카운트
with my_contributions as (
  select
    platform_type,
    case
      when platform_type = 'youtube' then platform_type
      else metadata ->> 'domain'
    end as domain,
    count(*) as my_count
  from
    tbl_place_features
  where
    status = 'active'
    and user_id = 'b75408a1-c1cf-43b6-b6f1-3b7288745b62'
    and (
      (
        platform_type = 'community'
        and metadata ->> 'domain' is not null
      )
      or platform_type = 'youtube'
    )
  group by
    platform_type,
    domain
),
total_contributions as (
  select
    platform_type,
    case
      when platform_type = 'youtube' then platform_type
      else metadata ->> 'domain'
    end as domain,
    count(*) as total_count
  from
    tbl_place_features
  where
    status = 'active'
    and (
      (
        platform_type = 'community'
        and metadata ->> 'domain' is not null
      )
      or platform_type = 'youtube'
    )
  group by
    platform_type,
    domain
)
select
  coalesce(t.platform_type, m.platform_type) as platform_type,
  coalesce(t.domain, m.domain) as domain,
  coalesce(m.my_count, 0) as my_count,
  t.total_count,
  round(
    (
      coalesce(m.my_count, 0) :: numeric / t.total_count :: numeric
    ) * 100,
    0
  ) as contribution_percentage
from
  total_contributions t full
  outer join my_contributions m on t.platform_type = m.platform_type
  and t.domain = m.domain
order by
  my_count desc,
  total_count desc;

-- 지역
select
  b.group1,
  count(*) as place_count
from
  tbl_place_features a
  left join tbl_place b on a.place_id = b.id
where
  a.status = 'active'
  and b.group1 is not null
group by
  b.group1
order by
  2 desc;

--  가봤어요 수
select
  *
from
  tbl_place_features -- 가봤어요INSERT INTO tbl_visited (
  id,
  user_id,
  place_id,
  visited_at,
  created_at,
  updated_at
)
VALUES
  (
    'id:uuid',
    'user_id:uuid',
    'place_id:character varying',
    'visited_at:timestamp with time zone',
    'created_at:timestamp with time zone',
    'updated_at:timestamp with time zone'
  );

tbl_place_features.metadata.channelId -- 유튜브 채널 목록 조회
WITH ranked_channels AS (
  SELECT
    (metadata ->> 'channelId') as channel_id,
    (metadata ->> 'channelTitle') as channel_title,
    created_at,
    ROW_NUMBER() OVER (
      PARTITION BY (metadata ->> 'channelId')
      ORDER BY
        created_at DESC
    ) as rn
  FROM
    tbl_place_features
  WHERE
    platform_type = 'youtube'
    AND metadata ->> 'channelId' IS NOT NULL
)
SELECT
  rc.channel_id,
  rc.channel_title,
  COUNT(t.id) as place_count
FROM
  ranked_channels rc
  LEFT JOIN tbl_place_features t ON (t.metadata ->> 'channelId') = rc.channel_id
  AND t.platform_type = 'youtube'
WHERE
  rc.rn = 1
GROUP BY
  rc.channel_id,
  rc.channel_title
ORDER BY
  place_count DESC;

select
  *
from
  tbl_place_features
where
  platform_type = 'community'
order by
  created_at desc;

select
  *
from
  tbl_visited
where
  place_id = '1167659600';

GRANT EXECUTE ON FUNCTION public.v1_save_or_update_visited_place TO authenticated;

GRANT EXECUTE ON FUNCTION public.v1_get_visited_place TO anon,
authenticated;

DO $ $ DECLARE func_record RECORD;

BEGIN FOR func_record IN
SELECT
  pg_get_function_identity_arguments(p.oid) as args
FROM
  pg_proc p
  LEFT JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE
  n.nspname = 'public'
  AND p.proname = 'v1_upsert_place_user_review' LOOP EXECUTE 'DROP FUNCTION IF EXISTS public.v1_upsert_place_user_review(' || func_record.args || ');';

END LOOP;

END $ $;

CREATE
OR REPLACE FUNCTION public.v1_upsert_place_user_review(
  p_place_id varchar,
  p_review_content text,
  p_score numeric(2, 1) DEFAULT NULL,
  p_is_private boolean DEFAULT FALSE,
  p_is_active boolean DEFAULT TRUE,
  p_review_id uuid DEFAULT NULL,
  p_media_urls jsonb DEFAULT NULL,
  p_gender_code varchar DEFAULT NULL,
  p_age_group_code varchar DEFAULT NULL,
  p_tag_codes varchar [] DEFAULT NULL
) RETURNS TABLE (
  id uuid,
  user_id uuid,
  place_id varchar,
  review_content text,
  score numeric(2, 1),
  media_urls jsonb,
  gender_code varchar,
  age_group_code varchar,
  is_private boolean,
  is_active boolean,
  created_at timestamptz,
  updated_at timestamptz,
  is_my_review boolean,
  tags jsonb,
  user_profile jsonb
) LANGUAGE plpgsql SECURITY DEFINER AS $ $ DECLARE caller_user_id uuid := auth.uid();

v_id uuid;

BEGIN IF caller_user_id IS NULL THEN RAISE EXCEPTION '인증된 사용자만 리뷰를 작성/수정할 수 있습니다.';

END IF;

-- 신규 등록
IF p_review_id IS NULL THEN
INSERT INTO
  tbl_place_user_review (
    user_id,
    place_id,
    review_content,
    score,
    is_private,
    is_active,
    media_urls,
    gender_code,
    age_group_code
  )
VALUES
  (
    caller_user_id,
    p_place_id,
    p_review_content,
    p_score,
    p_is_private,
    p_is_active,
    p_media_urls,
    p_gender_code,
    p_age_group_code
  ) RETURNING tbl_place_user_review.id INTO v_id;

-- 수정(업데이트)
ELSE
UPDATE
  tbl_place_user_review
SET
  review_content = COALESCE(
    p_review_content,
    tbl_place_user_review.review_content
  ),
  score = COALESCE(p_score, tbl_place_user_review.score),
  is_private = COALESCE(p_is_private, tbl_place_user_review.is_private),
  is_active = COALESCE(p_is_active, tbl_place_user_review.is_active),
  media_urls = COALESCE(p_media_urls, tbl_place_user_review.media_urls),
  gender_code = COALESCE(p_gender_code, tbl_place_user_review.gender_code),
  age_group_code = COALESCE(
    p_age_group_code,
    tbl_place_user_review.age_group_code
  ),
  updated_at = now()
WHERE
  tbl_place_user_review.id = p_review_id
  AND tbl_place_user_review.user_id = caller_user_id RETURNING tbl_place_user_review.id INTO v_id;

IF v_id IS NULL THEN RAISE EXCEPTION '리뷰가 없거나 수정 권한이 없습니다.';

END IF;

END IF;

-- 태그 매핑 관리
IF v_id IS NOT NULL THEN
DELETE FROM
  tbl_place_user_review_tag_map
WHERE
  tbl_place_user_review_tag_map.review_id = v_id;

IF p_tag_codes IS NOT NULL THEN
INSERT INTO
  tbl_place_user_review_tag_map(review_id, tag_code)
SELECT
  v_id,
  UNNEST(p_tag_codes);

END IF;

END IF;

-- 결과 반환
RETURN QUERY
SELECT
  r.id,
  r.user_id,
  r.place_id,
  r.review_content,
  r.score,
  r.media_urls,
  r.gender_code,
  r.age_group_code,
  r.is_private,
  r.is_active,
  r.created_at,
  r.updated_at,
  (r.user_id = caller_user_id) AS is_my_review,
  (
    SELECT
      COALESCE(
        jsonb_agg(
          jsonb_build_object(
            'code',
            m.tag_code,
            'label',
            t.tag_label,
            'is_positive',
            t.is_positive,
            'group',
            t.tag_group
          )
        ),
        '[]' :: jsonb
      )
    FROM
      tbl_place_user_review_tag_map m
      LEFT JOIN tbl_place_review_tag_master t ON m.tag_code = t.tag_code
    WHERE
      m.review_id = r.id
  ) AS tags,
  jsonb_build_object(
    'nickname',
    COALESCE(u.nickname, ''),
    'profile_image_url',
    u.profile_image_url
  ) AS user_profile
FROM
  tbl_place_user_review r
  LEFT JOIN tbl_user_profile u ON r.user_id = u.auth_user_id
WHERE
  r.id = v_id;

END;

$ $;

select
  *
from
  tbl_place_user_review
order by
  created_at desc;
