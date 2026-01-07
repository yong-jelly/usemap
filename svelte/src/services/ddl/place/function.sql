SELECT
  p.id,
  p.x,
  p.y,
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

-- 장소 상세 정보 조회 공통 함수 (좋아요, 저장, 댓글 정보 포함)
CREATE OR REPLACE FUNCTION public.v1_get_place_details(
    p_place_id text -- 장소 ID
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
AS $$
DECLARE
    v_user_id uuid := auth.uid();
    v_place_review_liked_count int := 0;
    v_place_review_saved_count int := 0;
    v_place_liked_count int := 0;
    v_place_saved_count int := 0;
    v_is_liked boolean := false;
    v_is_saved boolean := false;
    v_place_comment_count int := 0;
    v_is_commented boolean := false;
    v_comments jsonb := '[]'::jsonb; -- 기본값 빈 배열
    -- 태그 관련 변수 추가
    v_place_tag_count int := 0;
    v_is_place_tagged boolean := false;
    v_tags jsonb := '[]'::jsonb; -- 기본값 빈 배열
BEGIN
    -- 'place_review' 타입 좋아요 수 (ref_liked_id = p_place_id 기준)
    SELECT count(*)
    INTO v_place_review_liked_count
    FROM public.tbl_like
    WHERE ref_liked_id = p_place_id -- 'place_review'의 참조 ID가 장소 ID라고 가정
      AND liked_type = 'place_review'
      AND liked = true;

    -- 'place_review' 타입 저장 수 (ref_saved_id = p_place_id 기준)
    SELECT count(*)
    INTO v_place_review_saved_count
    FROM public.tbl_save
    WHERE ref_saved_id = p_place_id -- 'place_review'의 참조 ID가 장소 ID라고 가정
      AND saved_type = 'place_review'
      AND saved = true;

    -- 'place' 타입 좋아요 수 (liked_id = p_place_id 기준)
    SELECT count(*)
    INTO v_place_liked_count
    FROM public.tbl_like
    WHERE liked_id = p_place_id
      AND liked_type = 'place'
      AND liked = true;

    -- 'place' 타입 저장 수 (saved_id = p_place_id 기준)
    SELECT count(*)
    INTO v_place_saved_count
    FROM public.tbl_save
    WHERE saved_id = p_place_id
      AND saved_type = 'place'
      AND saved = true;

    -- 활성 댓글 수
    SELECT count(*)
    INTO v_place_comment_count
    FROM public.tbl_comment_for_place
    WHERE business_id = p_place_id
      AND is_active = true;

    -- 장소 태그 정보 조회
    -- 1. 전체 태그 수 계산
    SELECT count(*)
    INTO v_place_tag_count
    FROM public.tbl_place_tag
    WHERE business_id = p_place_id;

    -- 2. 태그 목록 및 각 태그별 개수 조회
    SELECT COALESCE(jsonb_agg(tag_info ORDER BY tag_count DESC), '[]'::jsonb) -- 태그 개수 많은 순 정렬
    INTO v_tags
    FROM (
        SELECT
            jsonb_build_object(
                'tag_id', tm.id,
                'tag_group', tm.tag_group,
                'tag_group_ko', tm.tag_group_ko,
                'tag_name', tm.tag_name,
                'count', COUNT(pt.id) -- 해당 장소에 이 태그가 몇 번 달렸는지 count
            ) AS tag_info,
            COUNT(pt.id) as tag_count -- 정렬용 count
        FROM public.tbl_place_tag pt
        JOIN public.tbl_tag_master_for_place tm ON pt.tag_id = tm.id
        WHERE pt.business_id = p_place_id
          AND tm.is_active = true -- 활성화된 마스터 태그만 고려 (선택적)
        GROUP BY tm.id, tm.tag_group, tm.tag_group_ko, tm.tag_name
    ) AS aggregated_tags;

    -- 현재 사용자의 상태 조회 (로그인 상태일 때만)
    IF v_user_id IS NOT NULL THEN
        -- 'place' 타입 좋아요 여부
        SELECT liked
        INTO v_is_liked
        FROM public.tbl_like
        WHERE liked_id = p_place_id
          AND liked_type = 'place'
          AND user_id = v_user_id;
        -- 결과가 없으면 false 유지

        -- 'place' 타입 저장 여부
        SELECT saved
        INTO v_is_saved
        FROM public.tbl_save
        WHERE saved_id = p_place_id
          AND saved_type = 'place'
          AND user_id = v_user_id;
        -- 결과가 없으면 false 유지

        -- 현재 사용자의 활성 댓글 작성 여부
        SELECT EXISTS (
            SELECT 1
            FROM public.tbl_comment_for_place
            WHERE business_id = p_place_id
              AND user_id = v_user_id
              AND is_active = true
        )
        INTO v_is_commented;

        -- 3. 현재 사용자의 태그 추가 여부 확인
        SELECT EXISTS (
            SELECT 1
            FROM public.tbl_place_tag
            WHERE business_id = p_place_id
              AND user_id = v_user_id
        )
        INTO v_is_place_tagged;
    END IF;

    -- 관련 활성 댓글 목록 조회 (작성자 프로필 포함)
    SELECT jsonb_agg(
               jsonb_build_object(
                   'id', c.id,
                   'user_id', c.user_id,
                   'title', c.title,
                   'content', c.content,
                   'image_paths', c.image_paths,
                   'parent_comment_id', c.parent_comment_id,
                   'comment_level', c.comment_level,
                   'created_at', c.created_at,
                   'updated_at', c.updated_at,
                   'user_profile', jsonb_build_object(
                       -- tbl_user_profile 구조에 맞게 수정 필요
                       'nickname', up.nickname,
                       'profile_image_url', up.profile_image_url
                   )
               ) ORDER BY c.created_at ASC -- 필요에 따라 정렬 기준 변경
           )
    INTO v_comments
    FROM public.tbl_comment_for_place c
    LEFT JOIN public.tbl_user_profile up ON c.user_id = up.auth_user_id -- 프로필 테이블 조인
    WHERE c.business_id = p_place_id
      AND c.is_active = true;

    -- 결과 반환
    RETURN jsonb_build_object(
        'place_review_liked_count', COALESCE(v_place_review_liked_count, 0),
        'place_review_saved_count', COALESCE(v_place_review_saved_count, 0),
        'place_liked_count', COALESCE(v_place_liked_count, 0),
        'place_saved_count', COALESCE(v_place_saved_count, 0),
        'is_liked', COALESCE(v_is_liked, false),
        'is_saved', COALESCE(v_is_saved, false),
        'place_comment_count', COALESCE(v_place_comment_count, 0),
        'is_commented', COALESCE(v_is_commented, false),
        'comments', COALESCE(v_comments, '[]'::jsonb), -- NULL일 경우 빈 배열 반환
        -- 태그 정보 추가
        'place_tag_count', COALESCE(v_place_tag_count, 0),
        'is_place_tagged', COALESCE(v_is_place_tagged, false),
        'tags', COALESCE(v_tags, '[]'::jsonb) -- NULL일 경우 빈 배열 반환
    );
END;
$$;

-- 함수 실행 권한 부여 (anon 및 authenticated 역할에 부여)
GRANT EXECUTE ON FUNCTION public.v1_get_place_details(text) TO authenticated, anon;

-- 장소 분석 정보 조회 함수
CREATE OR REPLACE FUNCTION public.v1_get_place_analysis(
    p_place_id text -- 장소 ID
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
AS $$
DECLARE
    v_analysis jsonb;
BEGIN
    -- 장소 분석 정보 조회
    SELECT 
        jsonb_build_object(
            'review_avg_rating', a.review_avg_rating,
            'total_reviews', a.total_reviews,
            'themes', a.themes,
            'menus', a.menus,
            'voted', a.voted,
            'voted_sum_count', a.voted_sum_count,
            'voted_user_count', a.voted_user_count
        )
    INTO v_analysis
    FROM public.tbl_place_analysis a
    WHERE a.business_id = p_place_id;

    -- 결과가 없을 경우 빈 객체 반환
    RETURN COALESCE(v_analysis, '{}'::jsonb);
END;
$$;

-- 함수 실행 권한 부여 (anon 및 authenticated 역할에 부여)
GRANT EXECUTE ON FUNCTION public.v1_get_place_analysis(text) TO authenticated, anon;


-- 장소별 리뷰 조회 함수
CREATE OR REPLACE FUNCTION public.v1_get_place_reviews(
    p_place_id text, -- 장소 ID
    p_limit int DEFAULT 20 -- 조회할 리뷰 수, 기본값 15개
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
AS $$
DECLARE
    v_reviews jsonb;
BEGIN
    -- 장소 리뷰 정보 조회 (하드코딩 테스트용)
    SELECT 
        CASE 
            WHEN COUNT(*) > 0 THEN 
                jsonb_agg(
                    jsonb_build_object(
                        'id', r.id,
                        'rating', r.rating,
                        'author_id', r.author_id,
                        'author_nickname', r.author_nickname,
                        'author_from', r.author_from,
                        'author_object_id', r.author_object_id,
                        'author_url', r.author_url,
                        'body', r.body,
                        'media', r.media,
                        'visit_count', r.visit_count,
                        'view_count', r.view_count,
                        'visited', r.visited,
                        'created', r.created
                    )
                )
            ELSE 
                '[]'::jsonb 
        END
    INTO v_reviews
    FROM (
        SELECT *
        FROM public.tbl_place_review r
        WHERE r.business_id = p_place_id
          AND r.body IS NOT NULL AND r.body <> ''
          AND r.media IS NOT NULL
        ORDER BY r.visited DESC, r.visit_count DESC, r.view_count DESC, r.id
        LIMIT p_limit
    ) r;

    -- 결과가 없을 경우 빈 배열 반환
    RETURN COALESCE(v_reviews, '[]'::jsonb);
END;
$$;

-- 함수 실행 권한 부여 (anon 및 authenticated 역할에 부여)
GRANT EXECUTE ON FUNCTION public.v1_get_place_reviews(text, int) TO authenticated, anon;

-- -- 쿼리 속도 향상을 위한 인덱스 생성
-- -- 1. business_id 기반 인덱스 (기본)
-- CREATE INDEX IF NOT EXISTS idx_place_review_business_id ON public.tbl_place_review(business_id);

-- -- 2. 정렬 및 필터링을 위한 복합 인덱스
-- CREATE INDEX IF NOT EXISTS idx_place_review_query_optimization ON public.tbl_place_review(business_id, visited DESC, visit_count DESC, view_count DESC)
-- WHERE body IS NOT NULL AND body <> '';

-- -- 3. business_id와 body 기반 부분 인덱스
-- CREATE INDEX IF NOT EXISTS idx_place_review_business_id_has_body ON public.tbl_place_review(business_id)
-- WHERE body IS NOT NULL AND body <> '';