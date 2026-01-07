-- [2025/04/13] 최초 작성
-- 특정 아이템에 대한 좋아요/저장 수 및 현재 사용자 상태 조회 함수
CREATE OR REPLACE FUNCTION public.v1_get_interaction_info(
    p_id text,    -- 아이템 ID (예: 리뷰 ID)
    p_type text   -- 아이템 타입 (예: 'place_review')
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
AS $$
DECLARE
    v_user_id uuid := auth.uid(); -- 현재 사용자 ID (로그인 안했으면 NULL)
    v_like_count int := 0;        -- 초기값을 0으로 설정
    v_save_count int := 0;        -- 초기값을 0으로 설정
    v_is_liked boolean := false;  -- 초기값을 false로 설정
    v_is_saved boolean := false;  -- 초기값을 false로 설정
BEGIN
    -- 좋아요 수 계산 (liked = true 인 것만)
    SELECT count(*)
    INTO v_like_count
    FROM public.tbl_like
    WHERE liked_id = p_id
      AND liked_type = p_type
      AND liked = true;

    -- 저장 수 계산 (saved = true 인 것만)
    SELECT count(*)
    INTO v_save_count
    FROM public.tbl_save
    WHERE saved_id = p_id
      AND saved_type = p_type
      AND saved = true;

    -- 현재 사용자의 좋아요 상태 조회 (로그인 상태일 때만 유효)
    IF v_user_id IS NOT NULL THEN
        SELECT liked
        INTO v_is_liked
        FROM public.tbl_like
        WHERE liked_id = p_id
          AND liked_type = p_type
          AND user_id = v_user_id;

        -- 현재 사용자의 저장 상태 조회 (로그인 상태일 때만 유효)
        SELECT saved
        INTO v_is_saved
        FROM public.tbl_save
        WHERE saved_id = p_id
          AND saved_type = p_type
          AND user_id = v_user_id;
    END IF;

    -- 최종 결과 반환
    RETURN jsonb_build_object(
        'like_count', v_like_count,  -- 항상 카운트 반환
        'is_liked', v_is_liked,      -- 로그인 상태에 따라 좋아요 여부 처리
        'save_count', v_save_count,  -- 항상 카운트 반환
        'is_saved', v_is_saved       -- 로그인 상태에 따라 저장 여부 처리
    );
END;
$$;

-- 함수 실행 권한 부여 (anon만 할것)
-- GRANT EXECUTE ON FUNCTION public.v1_get_interaction_info(text, text) TO anon;
-- GRANT EXECUTE ON FUNCTION public.v1_get_interaction_info(text, text) TO authenticated, anon;
-- GRANT EXECUTE ON FUNCTION public.v1_get_interaction_info(text, text) TO authenticated, anon;


-- [2025/04/13] 최초 작성
-- 최신 리뷰 목록과 함께 좋아요/저장 정보를 조회하는 함수
CREATE OR REPLACE FUNCTION public.v1_get_latest_reviews(
    p_limit integer DEFAULT 20, -- 한 번에 가져올 리뷰 수 (기본값 20)
    p_offset integer DEFAULT 0  -- 건너뛸 리뷰 수 (기본값 0, 페이지네이션용)
)
RETURNS json -- 결과는 JSON 배열 형태로 반환
LANGUAGE sql
STABLE -- 데이터 변경 없음, 동일 입력 시 동일 트랜잭션 내 동일 결과
AS $$
WITH latest_reviews_cte AS (
    -- 최신순으로 정렬된 기본 리뷰 목록 조회 (필터링, 정렬, 페이지네이션 적용)
    SELECT *
    FROM public.tbl_review_all -- 인기 리뷰 뷰 사용
    -- 제외할 업체 필터
    WHERE business_name !~ '(배스킨라빈스|뚜레쥬르|교촌치킨|맥도날드|MGC|맘스터치|이디야|푸라닭|카페블루하우스|하은이네|더벤티|엔제리너스|DT점|빽다방|컴포즈|스타벅스|에이바우트|도시락|롯데리아|버거킹|BBQ|파리바게뜨|네네치킨)'
      AND media IS NOT NULL -- 미디어가 있는 리뷰만
    ORDER BY
        created DESC -- 최신순 정렬
    LIMIT p_limit
    OFFSET p_offset
)
-- 최종 결과: 각 리뷰에 대해 인터랙션 정보를 포함하여 JSON 배열로 만듦
SELECT COALESCE(json_agg(
    -- 각 리뷰 행을 예시 JSON 구조에 맞춰 변환
    jsonb_build_object(
        -- mv_place_review_popularity_for_3m_10k 뷰의 컬럼들 (예시 JSON 기반)
        'id', r.id, -- 예시 JSON의 id 사용
        'business_id', r.business_id,
        'business_name', r.business_name,
        'x', r.x,
        'y', r.y,
        'common_address', r.common_address,
        'category', r.category,
        'visitor_review_score', r.visitor_review_score,
        'visitor_review_count', r.visitor_review_count,
        'author_nickname', r.author_nickname,
        'body', r.body,
        'media', r.media,
        'visit_count', r.visit_count,
        'visited', r.visited,
        'created', r.created,
        'view_count', r.view_count,
        -- 'base_popularity_score', r.base_popularity_score,
        -- 'days_since_creation', r.days_since_creation,
        -- 'final_popularity_score', r.final_popularity_score,
        -- 공통 함수 호출하여 좋아요/저장 정보 추가
        'like_count', (interaction_info ->> 'like_count')::int,
        'is_liked', (interaction_info ->> 'is_liked')::boolean,
        'save_count', (interaction_info ->> 'save_count')::int,
        'is_saved', (interaction_info ->> 'is_saved')::boolean
    ) ORDER BY -- json_agg 내부에서도 정렬 순서 유지 중요!
        r.created DESC NULLS LAST, -- 최신순 정렬 유지
        r.id
), '[]'::json) -- 결과가 없을 경우 빈 JSON 배열 반환
FROM latest_reviews_cte r
-- 각 리뷰에 대해 인터랙션 정보 조회 (LATERAL JOIN 사용)
CROSS JOIN LATERAL public.v1_get_interaction_info(r.id::text, 'place_review') AS interaction_info;

$$;

-- 함수 실행 권한 부여 (로그인 사용자 및 익명 사용자 모두)
-- GRANT EXECUTE ON FUNCTION public.v1_get_latest_reviews(integer, integer) TO authenticated, anon;

-- [2025/04/13] 최초 작성
-- 시즌별 추천 리뷰 목록과 함께 좋아요/저장 정보를 조회하는 함수
CREATE OR REPLACE FUNCTION public.v1_get_seasonal_reviews(
    p_limit integer DEFAULT 20, -- 한 번에 가져올 리뷰 수 (기본값 20)
    p_offset integer DEFAULT 0  -- 건너뛸 리뷰 수 (기본값 0, 페이지네이션용)
)
RETURNS json -- 결과는 JSON 배열 형태로 반환
LANGUAGE sql
STABLE -- 데이터 변경 없음, 동일 입력 시 동일 트랜잭션 내 동일 결과
AS $$
WITH seasonal_reviews_cte AS (
    -- 시즌별 뷰에서 기본 리뷰 목록 조회 (필터링, 복잡한 정렬, 페이지네이션 적용)
    SELECT *
    FROM public.mv_place_review_seasonal_for_2y_10k -- 시즌별 뷰 사용
    -- 제외할 업체 필터
    WHERE business_name !~ '(배스킨라빈스|뚜레쥬르|교촌치킨|맥도날드|MGC|맘스터치|이디야|푸라닭|카페블루하우스|하은이네|더벤티|엔제리너스|DT점|빽다방|컴포즈|스타벅스|에이바우트|도시락|롯데리아|버거킹|BBQ|파리바게뜨|네네치킨)'
      AND media IS NOT NULL -- 미디어가 있는 리뷰만
    ORDER BY
        -- 1. ID와 시간 기반의 안정적인 랜덤 정렬 (5분 단위 캐싱 효과)
        md5(id::text || (extract(epoch FROM date_trunc('minute', now())) / 300)::text),
        -- 2. 시간대별 동적 정렬 전략
        CASE
            WHEN EXTRACT(HOUR FROM NOW()) BETWEEN 6 AND 11 THEN final_popularity_score
            WHEN EXTRACT(HOUR FROM NOW()) BETWEEN 12 AND 17 THEN (COALESCE(visit_count, 0) * 0.3) + (final_popularity_score * 0.7) -- visit_count 사용 (view에 있다고 가정)
            WHEN EXTRACT(HOUR FROM NOW()) BETWEEN 18 AND 23 THEN final_popularity_score * (1.0 + (0.5 * EXP(-0.1 * days_since_creation))) -- days_since_creation 사용 (view에 있다고 가정)
            ELSE base_popularity_score + (CASE WHEN media IS NOT NULL THEN 20 ELSE 0 END) -- base_popularity_score 사용 (view에 있다고 가정)
        END DESC,
        -- 3. 요일별 2차 정렬 전략
        CASE
            WHEN EXTRACT(DOW FROM NOW()) IN (0, 6) THEN COALESCE(visit_count, 0) * (1.0 + (EXTRACT(DOW FROM NOW())::float / 10)) -- visit_count 사용
            ELSE
                CASE EXTRACT(DOW FROM NOW())::integer
                    WHEN 1 THEN COALESCE(rating, 0) * 15        -- 월: 별점 강조 (rating 사용, view에 있다고 가정)
                    WHEN 2 THEN COALESCE(LENGTH(body)/10, 0)   -- 화: 리뷰 길이 강조 (body 사용, view에 있다고 가정)
                    WHEN 3 THEN COALESCE(view_count, 0) * 0.2  -- 수: 조회수 강조 (view_count 사용, view에 있다고 가정)
                    WHEN 4 THEN final_popularity_score * 1.2   -- 목: 전체 인기도 강조
                    WHEN 5 THEN days_since_creation * (-0.5)   -- 금: 최신성 강조
                    ELSE 0 -- 예외 처리
                END
        END DESC,
        -- 4. 시간 기반 변동 요소 (정오 거리 기반)
        final_popularity_score * (1.0 + (ABS(EXTRACT(HOUR FROM NOW()) - 12) / 24)) DESC,
        -- 5. 날짜 기반 회전 정렬 (월의 날짜 기반)
        ((base_popularity_score + COALESCE(visitor_review_score, 0)) * -- visitor_review_score 사용 (view에 있다고 가정)
         (MOD(EXTRACT(DAY FROM NOW())::integer, 7) + 1) / 7) DESC,
        -- 6. 최종 우선순위: 시즌 관련성 다음 최신순
        season_relevance_score DESC, -- season_relevance_score 사용 (view에 있다고 가정)
        created DESC                 -- created 사용 (view에 있다고 가정)
    LIMIT p_limit
    OFFSET p_offset
)
-- 최종 결과: 각 리뷰에 대해 인터랙션 정보를 포함하여 JSON 배열로 만듦
SELECT COALESCE(json_agg(
    -- 각 리뷰 행을 예시 JSON 구조에 맞춰 변환
    jsonb_build_object(
        'id', r.id, -- id를 id로 사용
        'business_id', r.business_id,
        'business_name', r.business_name,
        'x', r.x,
        'y', r.y,
        'rating', r.rating, -- 예시 JSON에 rating 포함
        'common_address', r.common_address,
        'category', r.category,
        'visitor_review_score', r.visitor_review_score,
        'visitor_review_count', r.visitor_review_count,
        'author_nickname', r.author_nickname,
        'body', r.body,
        'media', r.media,
        'visit_count', r.visit_count,
        'visited', r.visited,
        'created', r.created,
        'view_count', r.view_count,
        'base_popularity_score', r.base_popularity_score,
        'created_year', r.created_year, -- 예시 JSON에 있음
        'created_month', r.created_month, -- 예시 JSON에 있음
        'months_since_creation', r.months_since_creation, -- 예시 JSON에 있음
        'days_since_creation', r.days_since_creation,
        'season_relevance_score', r.season_relevance_score,
        'final_popularity_score', r.final_popularity_score,
        -- 공통 함수 호출하여 좋아요/저장 정보 추가
        'like_count', (interaction_info ->> 'like_count')::int,
        'is_liked', (interaction_info ->> 'is_liked')::boolean,
        'save_count', (interaction_info ->> 'save_count')::int,
        'is_saved', (interaction_info ->> 'is_saved')::boolean
    ) ORDER BY -- json_agg 내부에서도 정렬 순서 유지 중요!
        -- seasonal_reviews_cte CTE와 동일한 ORDER BY 절 적용
        md5(r.id::text || (extract(epoch FROM date_trunc('minute', now())) / 300)::text),
        CASE WHEN EXTRACT(HOUR FROM NOW()) BETWEEN 6 AND 11 THEN r.final_popularity_score WHEN EXTRACT(HOUR FROM NOW()) BETWEEN 12 AND 17 THEN (COALESCE(r.visit_count, 0) * 0.3) + (r.final_popularity_score * 0.7) WHEN EXTRACT(HOUR FROM NOW()) BETWEEN 18 AND 23 THEN r.final_popularity_score * (1.0 + (0.5 * EXP(-0.1 * r.days_since_creation))) ELSE r.base_popularity_score + (CASE WHEN r.media IS NOT NULL THEN 20 ELSE 0 END) END DESC,
        CASE WHEN EXTRACT(DOW FROM NOW()) IN (0, 6) THEN COALESCE(r.visit_count, 0) * (1.0 + (EXTRACT(DOW FROM NOW())::float / 10)) ELSE CASE EXTRACT(DOW FROM NOW())::integer WHEN 1 THEN COALESCE(r.rating, 0) * 15 WHEN 2 THEN COALESCE(LENGTH(r.body)/10, 0) WHEN 3 THEN COALESCE(r.view_count, 0) * 0.2 WHEN 4 THEN r.final_popularity_score * 1.2 WHEN 5 THEN r.days_since_creation * (-0.5) ELSE 0 END END DESC,
        r.final_popularity_score * (1.0 + (ABS(EXTRACT(HOUR FROM NOW()) - 12) / 24)) DESC,
        ((r.base_popularity_score + COALESCE(r.visitor_review_score, 0)) * (MOD(EXTRACT(DAY FROM NOW())::integer, 7) + 1) / 7) DESC,
        r.season_relevance_score DESC,
        r.created DESC
), '[]'::json) -- 결과가 없을 경우 빈 JSON 배열 반환
FROM seasonal_reviews_cte r
-- 각 리뷰에 대해 인터랙션 정보 조회 (LATERAL JOIN 사용)
CROSS JOIN LATERAL public.v1_get_interaction_info(r.id::text, 'place_review') AS interaction_info;

$$;


-- 함수 실행 권한 부여 (로그인 사용자 및 익명 사용자 모두)
-- GRANT EXECUTE ON FUNCTION public.v1_get_seasonal_reviews(integer, integer) TO authenticated, anon;


-- [2025/04/13] 최초 작성
-- 단골 고객 리뷰 목록과 함께 좋아요/저장 정보를 조회하는 함수
CREATE OR REPLACE FUNCTION public.v1_get_regular_customer_reviews(
    p_limit integer DEFAULT 20,
    p_offset integer DEFAULT 0
)
RETURNS json
LANGUAGE sql
STABLE
AS $$
WITH ranked_reviews_cte AS (
    SELECT *,
           -- 알고리즘 점수 계산 (algorithm_meta 데이터 활용)
           CAST(algorithm_score AS numeric) AS calculated_score,
           ROW_NUMBER() OVER (
               PARTITION BY business_id, author_nickname
               ORDER BY
                   -- 1. 알고리즘 점수 우선 (단골 지표)
                   CAST(algorithm_score AS numeric) DESC,
                   -- 2. 시간대별 컨텍스트 점수
                   CASE
                       WHEN EXTRACT(HOUR FROM CURRENT_TIME) BETWEEN 7 AND 9
                            OR EXTRACT(HOUR FROM CURRENT_TIME) BETWEEN 11 AND 14
                            OR EXTRACT(HOUR FROM CURRENT_TIME) BETWEEN 17 AND 21
                       THEN
                           (CASE WHEN category IN ('음식점', '식당', '레스토랑', '카페', '베이커리', '패스트푸드', '찐빵') THEN 20 ELSE 0 END) + visit_count * 2
                       ELSE
                           ((EXTRACT(DOW FROM CURRENT_DATE)::int * visit_count) % 5)
                   END DESC,
                   -- 3. 주말/평일 및 방문횟수, 별점 기반 점수
                   CASE
                       WHEN EXTRACT(DOW FROM CURRENT_DATE) IN (0, 6) THEN visitor_reviews_score * 5 -- 주말: 별점 가중치
                       ELSE EXTRACT(DOW FROM CURRENT_DATE)::int * 2 + visit_count                 -- 평일: 요일 + 방문횟수
                   END DESC,
                   -- 4. 방문 횟수 (단골 지표의 핵심)
                   visit_count DESC,
                   -- 5. 별점 점수
                   visitor_reviews_score DESC,
                   -- 6. 최신 리뷰 우선
                   created DESC
           ) AS rn
    FROM tbl_review_all
    WHERE feed_type = 'regular' -- 단골 피드 타입만 필터링 
      AND business_name !~ '(배스킨라빈스|뚜레쥬르|교촌치킨|맥도날드|MGC|맘스터치|이디야|푸라닭|카페블루하우스|하은이네|더벤티|엔제리너스|DT점|빽다방|컴포즈|스타벅스|에이바우트|도시락|롯데리아|버거킹|BBQ|파리바게뜨|네네치킨)'
),
filtered_reviews AS (
    SELECT *
    FROM ranked_reviews_cte
    WHERE rn = 1
    ORDER BY
        -- 최종 정렬 순서
        calculated_score DESC, -- 알고리즘 점수 우선
        CASE WHEN EXTRACT(HOUR FROM CURRENT_TIME) BETWEEN 7 AND 9 OR EXTRACT(HOUR FROM CURRENT_TIME) BETWEEN 11 AND 14 OR EXTRACT(HOUR FROM CURRENT_TIME) BETWEEN 17 AND 21 THEN (CASE WHEN category IN ('음식점', '식당', '레스토랑', '카페', '베이커리', '패스트푸드', '찐빵') THEN 20 ELSE 0 END) + visit_count * 2 ELSE ((EXTRACT(DOW FROM CURRENT_DATE)::int * visit_count) % 5) END DESC,
        CASE WHEN EXTRACT(DOW FROM CURRENT_DATE) IN (0, 6) THEN visitor_reviews_score * 5 ELSE EXTRACT(DOW FROM CURRENT_DATE)::int * 2 + visit_count END DESC,
        visit_count DESC,
        visitor_reviews_score DESC,
        created DESC
    LIMIT p_limit
    OFFSET p_offset
)
SELECT COALESCE(json_agg(
    jsonb_build_object(
        'id', r.id,
        'business_id', r.business_id,
        'business_name', r.business_name,
        'x', r.x,
        'y', r.y,
        'address', r.address, -- common_address를 address로 변경
        'category', r.category,
        'visitor_reviews_score', r.visitor_reviews_score, -- 변수명 일관성 유지
        'visitor_reviews_total', r.visitor_reviews_total, -- visitor_review_count를 visitor_reviews_total로 변경
        'author_id', r.author_id, -- author_id 추가
        'author_nickname', r.author_nickname,
        'body', r.body,
        'media', r.media,
        'visit_count', r.visit_count,
        'visited', r.visited,
        'created', r.created,
        'algorithm_score', r.algorithm_score, -- 알고리즘 점수 추가
        'algorithm_meta', r.algorithm_meta, -- 알고리즘 메타 추가
        'group1', r.group1, -- 지역 정보 추가
        'group2', r.group2,
        'group3', r.group3,
        'feed_type', r.feed_type, -- 피드 타입 추가
        
        -- 인터랙션 정보 추가
        'like_count', (interaction_info ->> 'like_count')::int,
        'is_liked', (interaction_info ->> 'is_liked')::boolean,
        'save_count', (interaction_info ->> 'save_count')::int,
        'is_saved', (interaction_info ->> 'is_saved')::boolean
    ) ORDER BY
        r.calculated_score DESC,
        CASE WHEN EXTRACT(HOUR FROM CURRENT_TIME) BETWEEN 7 AND 9 OR EXTRACT(HOUR FROM CURRENT_TIME) BETWEEN 11 AND 14 OR EXTRACT(HOUR FROM CURRENT_TIME) BETWEEN 17 AND 21 THEN (CASE WHEN r.category IN ('음식점', '식당', '레스토랑', '카페', '베이커리', '패스트푸드', '찐빵') THEN 20 ELSE 0 END) + r.visit_count * 2 ELSE ((EXTRACT(DOW FROM CURRENT_DATE)::int * r.visit_count) % 5) END DESC,
        CASE WHEN EXTRACT(DOW FROM CURRENT_DATE) IN (0, 6) THEN r.visitor_reviews_score * 5 ELSE EXTRACT(DOW FROM CURRENT_DATE)::int * 2 + r.visit_count END DESC,
        r.visit_count DESC,
        r.visitor_reviews_score DESC,
        r.created DESC
), '[]'::json)
FROM filtered_reviews r
CROSS JOIN LATERAL public.v1_common_review_interaction(r.id::text, 'place_review') AS interaction_info;
$$;


-- 함수 실행 권한 부여 (로그인 사용자 및 익명 사용자 모두)
--GRANT EXECUTE ON FUNCTION public.v1_get_regular_customer_reviews(integer, integer) TO authenticated, anon;
-- select created from tbl_place_review limit 1
-- [2025/04/13] 최초 작성
-- 숨은 맛집 리뷰 목록과 함께 좋아요/저장 정보를 조회하는 함수
CREATE OR REPLACE FUNCTION public.v1_get_hidden_gem_reviews(
    p_limit integer DEFAULT 20, -- 한 번에 가져올 리뷰 수 (기본값 20)
    p_offset integer DEFAULT 0  -- 건너뛸 리뷰 수 (기본값 0, 페이지네이션용)
)
RETURNS json -- 결과는 JSON 배열 형태로 반환
LANGUAGE sql
STABLE -- 데이터 변경 없음, 동일 입력 시 동일 트랜잭션 내 동일 결과
AS $$
WITH hidden_gem_reviews AS (
    -- 숨은 맛집 뷰에서 기본 리뷰 목록 조회 (페이지네이션 및 정렬 적용)
    SELECT *
    FROM public.tbl_review_all -- 숨은 맛집 뷰 사용
    -- 제외할 업체 필터
    WHERE business_name !~ '(배스킨라빈스|뚜레쥬르|교촌치킨|맥도날드|MGC|맘스터치|이디야|푸라닭|카페블루하우스|하은이네|더벤티|엔제리너스|DT점|빽다방|컴포즈|스타벅스|에이바우트|도시락|롯데리아|버거킹|BBQ|파리바게뜨|네네치킨)'
      AND media IS NOT NULL -- 미디어가 있는 리뷰만
    ORDER BY
        -- ID와 시간 기반의 안정적인 랜덤 정렬 (5분 단위 캐싱 효과)
        md5(id::text || (extract(epoch FROM date_trunc('minute', now())) / 300)::text)
    LIMIT p_limit
    OFFSET p_offset
)
-- 최종 결과: 각 리뷰에 대해 인터랙션 정보를 포함하여 JSON 배열로 만듦
SELECT COALESCE(json_agg(
    -- 각 리뷰 행을 지정된 JSON 객체 구조로 변환
    -- 주의: mv_place_review_hidden_gem_for_10k 뷰의 실제 컬럼에 맞춰 아래 필드를 조정해야 할 수 있습니다.
    jsonb_build_object(
        -- mv_place_review_hidden_gem_for_10k 뷰의 컬럼들 (존재한다고 가정)
        'id', r.id, -- review_id를 id로 사용
        'business_id', r.business_id,
        'business_name', r.business_name,
        'x', r.x,
        'y', r.y,
        'common_address', r.common_address,
        'category', r.category,
        'visitor_review_score', r.visitor_review_score,
        'visitor_review_count', r.visitor_review_count,
        'author_nickname', r.author_nickname,
        'body', r.body,
        'media', r.media,
        'visit_count', r.visit_count,
        'visited', r.visited,
        'created', r.created,
        -- 필요한 경우 숨은 맛집 뷰의 다른 컬럼들도 추가
        -- 'some_hidden_gem_score', r.some_hidden_gem_score,

        -- 공통 함수 호출하여 좋아요/저장 정보 추가
        'like_count', (interaction_info ->> 'like_count')::int,
        'is_liked', (interaction_info ->> 'is_liked')::boolean,
        'save_count', (interaction_info ->> 'save_count')::int,
        'is_saved', (interaction_info ->> 'is_saved')::boolean
    ) ORDER BY -- json_agg 내부에서도 정렬 순서 유지 중요!
        -- hidden_gem_reviews CTE와 동일한 ORDER BY 절 적용
        md5(r.id::text || (extract(epoch FROM date_trunc('minute', now())) / 300)::text),
        r.created DESC NULLS LAST,
        r.id
), '[]'::json) -- 결과가 없을 경우 빈 JSON 배열 반환
FROM hidden_gem_reviews r
-- 각 리뷰에 대해 인터랙션 정보 조회 (LATERAL JOIN 사용)
CROSS JOIN LATERAL public.v1_get_interaction_info(r.id::text, 'place_review') AS interaction_info;

$$;

-- 함수 실행 권한 부여 (로그인 사용자 및 익명 사용자 모두)
--GRANT EXECUTE ON FUNCTION public.v1_get_hidden_gem_reviews(integer, integer) TO authenticated, anon;
-- select count(*) from mv_place_review_popularity_for_3m_10k
-- [2025/04/13] 최초 작성
-- 인기 리뷰 목록과 함께 좋아요/저장 정보를 조회하는 함수
CREATE OR REPLACE FUNCTION public.v1_get_popularity_reviews(
    p_limit integer DEFAULT 20, -- 한 번에 가져올 리뷰 수 (기본값 20)
    p_offset integer DEFAULT 0  -- 건너뛸 리뷰 수 (기본값 0, 페이지네이션용)
)
RETURNS json -- 결과는 JSON 배열 형태로 반환
LANGUAGE sql
STABLE -- 데이터 변경 없음, 동일 입력 시 동일 트랜잭션 내 동일 결과
AS $$
WITH popular_reviews AS (
    -- 복잡한 정렬 로직을 사용하여 기본 리뷰 목록 조회 (페이지네이션 적용)
    SELECT *,
           -- 인기도 점수 계산 로직 직접 추가
           COALESCE(visit_count, 0) + 
           COALESCE(view_count, 0) * 0.1 + 
           COALESCE(visitor_review_score, 0) * 5 +
           CASE WHEN media IS NOT NULL THEN 20 ELSE 0 END AS calculated_popularity,
           -- 최신성 계산 (현재 날짜와 생성 날짜 사이의 일수)
           GREATEST(1, EXTRACT(EPOCH FROM (NOW() - created::timestamp)) / 86400) AS days_age
    FROM public.tbl_review_all -- 머티리얼라이즈드 뷰 사용
    -- 제외할 업체 필터
    WHERE business_name !~ '(배스킨라빈스|뚜레쥬르|교촌치킨|맥도날드|MGC|맘스터치|이디야|푸라닭|카페블루하우스|하은이네|더벤티|엔제리너스|DT점|빽다방|컴포즈|스타벅스|에이바우트|도시락|롯데리아|버거킹|BBQ|파리바게뜨|네네치킨)'
      AND media IS NOT NULL -- 미디어가 있는 리뷰만
    ORDER BY
        -- 1. ID와 시간 기반의 안정적인 랜덤 정렬 (5분 단위 캐싱 효과)
        md5(id::text || (extract(epoch FROM date_trunc('minute', now())) / 300)::text),
        -- 2. 시간대별 주요 정렬 기준
        CASE
            WHEN EXTRACT(HOUR FROM NOW()) BETWEEN 6 AND 11 THEN 
                COALESCE(visitor_review_score, 0) * 10 + COALESCE(visit_count, 0) -- 오전: 별점과 방문 중심
            WHEN EXTRACT(HOUR FROM NOW()) BETWEEN 12 AND 17 THEN 
                (COALESCE(visit_count, 0) * 0.6) + (COALESCE(view_count, 0) * 0.4) -- 오후: 방문과 조회수
            WHEN EXTRACT(HOUR FROM NOW()) BETWEEN 18 AND 23 THEN 
                COALESCE(visit_count, 0) * (1.0 + (0.5 * EXP(-0.1 * GREATEST(1, EXTRACT(EPOCH FROM (NOW() - created::timestamp)) / 86400)))) -- 저녁: 최신성 가중치
            ELSE 
                (CASE WHEN media IS NOT NULL THEN 20 ELSE 0 END) + COALESCE(LENGTH(body)/20, 0) -- 심야/새벽: 미디어 + 본문길이
        END DESC,
        -- 3. 요일별 2차 정렬 기준
        CASE
            WHEN EXTRACT(DOW FROM NOW()) IN (0, 6) THEN 
                COALESCE(visit_count, 0) * (1.0 + (EXTRACT(DOW FROM NOW())::float / 10)) -- 주말: 방문횟수 가중치
            ELSE -- 평일: 요일별 다른 속성 강조
                CASE EXTRACT(DOW FROM NOW())::integer
                    WHEN 1 THEN COALESCE(visitor_review_score, 0) * 15  -- 월: 별점
                    WHEN 2 THEN COALESCE(LENGTH(body)/10, 0)            -- 화: 리뷰 길이
                    WHEN 3 THEN COALESCE(view_count, 0) * 0.2           -- 수: 조회수
                    WHEN 4 THEN COALESCE(visit_count, 0) * 1.2          -- 목: 방문수 중심
                    WHEN 5 THEN GREATEST(1, EXTRACT(EPOCH FROM (NOW() - created::timestamp)) / 86400) * (-0.5) -- 금: 최신성
                    ELSE 0 -- 예외 처리
                END
        END DESC,
        -- 4. 시간 기반 변동 요소
        (COALESCE(visit_count, 0) * 2 + COALESCE(view_count, 0) * 0.1) * 
        (1.0 + (ABS(EXTRACT(HOUR FROM NOW()) - 12) / 24)) DESC,
        -- 5. 날짜 기반 회전 정렬 (매일 다른 기준으로 약간씩 변동)
        ((COALESCE(visit_count, 0) + COALESCE(visitor_review_score, 0)) *
         (MOD(EXTRACT(DAY FROM NOW())::integer, 7) + 1) / 7) DESC,
        -- 6. 기본 최신순 정렬 (동점자 처리 등)
        created DESC
    LIMIT p_limit
    OFFSET p_offset
)
-- 최종 결과: 각 리뷰에 대해 인터랙션 정보를 포함하여 JSON 배열로 만듦
SELECT COALESCE(json_agg(
    -- 각 리뷰 행을 지정된 JSON 객체 구조로 변환
    jsonb_build_object(
        'id', r.id,
        'business_id', r.business_id,
        'business_name', r.business_name,
        'x', r.x,
        'y', r.y,
        'common_address', r.common_address,
        'category', r.category,
        'visitor_review_score', r.visitor_review_score,
        'visitor_review_count', r.visitor_review_count,
        'author_nickname', r.author_nickname,
        'body', r.body,
        'media', r.media,
        'visit_count', r.visit_count,
        'visited', r.visited,
        'created', r.created,
        'view_count', r.view_count,
        'popularity_score', r.calculated_popularity, -- 계산된 인기도 점수
        -- 공통 함수 호출하여 좋아요/저장 정보 추가
        'like_count', (interaction_info ->> 'like_count')::int,
        'is_liked', (interaction_info ->> 'is_liked')::boolean,
        'save_count', (interaction_info ->> 'save_count')::int,
        'is_saved', (interaction_info ->> 'is_saved')::boolean
    ) ORDER BY -- json_agg 내부에서도 정렬 순서 유지 중요!
        -- popular_reviews CTE와 동일한 ORDER BY 절 적용
        md5(r.id::text || (extract(epoch FROM date_trunc('minute', now())) / 300)::text),
        CASE 
            WHEN EXTRACT(HOUR FROM NOW()) BETWEEN 6 AND 11 THEN 
                COALESCE(r.visitor_review_score, 0) * 10 + COALESCE(r.visit_count, 0)
            WHEN EXTRACT(HOUR FROM NOW()) BETWEEN 12 AND 17 THEN 
                (COALESCE(r.visit_count, 0) * 0.6) + (COALESCE(r.view_count, 0) * 0.4)
            WHEN EXTRACT(HOUR FROM NOW()) BETWEEN 18 AND 23 THEN 
                COALESCE(r.visit_count, 0) * (1.0 + (0.5 * EXP(-0.1 * r.days_age))) 
            ELSE 
                (CASE WHEN r.media IS NOT NULL THEN 20 ELSE 0 END) + COALESCE(LENGTH(r.body)/20, 0)
        END DESC,
        CASE 
            WHEN EXTRACT(DOW FROM NOW()) IN (0, 6) THEN 
                COALESCE(r.visit_count, 0) * (1.0 + (EXTRACT(DOW FROM NOW())::float / 10))
            ELSE
                CASE EXTRACT(DOW FROM NOW())::integer
                    WHEN 1 THEN COALESCE(r.visitor_review_score, 0) * 15
                    WHEN 2 THEN COALESCE(LENGTH(r.body)/10, 0)
                    WHEN 3 THEN COALESCE(r.view_count, 0) * 0.2
                    WHEN 4 THEN COALESCE(r.visit_count, 0) * 1.2
                    WHEN 5 THEN r.days_age * (-0.5)
                    ELSE 0
                END
        END DESC,
        (COALESCE(r.visit_count, 0) * 2 + COALESCE(r.view_count, 0) * 0.1) * 
        (1.0 + (ABS(EXTRACT(HOUR FROM NOW()) - 12) / 24)) DESC,
        ((COALESCE(r.visit_count, 0) + COALESCE(r.visitor_review_score, 0)) *
         (MOD(EXTRACT(DAY FROM NOW())::integer, 7) + 1) / 7) DESC,
        r.visited DESC NULLS LAST,
        r.created DESC NULLS LAST
), '[]'::json) -- 결과가 없을 경우 빈 JSON 배열 반환
FROM popular_reviews r
-- 각 리뷰에 대해 인터랙션 정보 조회 (LATERAL JOIN 또는 서브쿼리 형태)
CROSS JOIN LATERAL public.v1_get_interaction_info(r.id::text, 'place_review') AS interaction_info;
$$



select * from tbl_like a
left join tbl_place b on a.liked_id = b.id
where a.liked_type = 'place'
order by a.updated_at desc
lmit offset

tbl_like 
    id,
    user_id,
    user_id,
    liked_id,
    liked_type,
    liked,
    created_at,
    updated_at,
    ref_liked_id

tbl_place 
    id,
    name,
    category,
    category_code_list,
    road_address,
    address,
    phone,
    x,
    y,
    updated_at,
    created_at,
    road,
    category_code,
    payment_info,
    conveniences,
    visitor_reviews_total,
    visitor_reviews_score,
    homepage,
    keyword_list,
    images,
    static_map_url,
    themes,
    visitor_review_medias_total,
    visitor_review_stats,
    menus,
    street_panorama,
    place_images,
    group1,
    group2,
    group3,
    is_franchise
-- 함수 실행 권한 부여 (로그인 사용자 및 익명 사용자 모두)
-- GRANT EXECUTE ON FUNCTION public.v1_get_popularity_reviews(integer, integer) TO authenticated, anon;

-- [2025/04/17] 내가 좋아요 누른 리뷰 목록 조회 함수
CREATE OR REPLACE FUNCTION public.v1_get_my_liked_reviews(
    p_limit integer DEFAULT 20,
    p_offset integer DEFAULT 0
)
RETURNS json -- JSON 배열 반환
LANGUAGE sql
STABLE -- 데이터 변경 없음
SECURITY INVOKER -- 호출자의 권한으로 실행 (auth.uid() 사용)
AS $$
-- 로그인 상태 확인은 필수. auth.uid()가 NULL이면 아무 결과도 반환되지 않음.
-- SECURITY INVOKER는 호출자가 authenticated 역할이 있어야 실행 가능하게 함.
WITH my_liked_reviews_cte AS (
    SELECT
        r.id,
        p.id AS business_id,
        p.x,
        p.y,
        p.name AS business_name,
        0 AS rating,
        p.common_address,
        p.category,
        p.visitor_review_score,
        p.visitor_review_count,
        r.author_nickname,
        r.body,
        r.media,
        r.visit_count,
        r.visited,
        r.created,
        COALESCE(r.view_count, 0) AS view_count,
        l.created_at AS liked_at -- 좋아요 누른 시간 기준으로 정렬하기 위함
    FROM public.tbl_like AS l
    JOIN mv_place_review_combined AS r ON l.liked_id = r.id AND l.liked_type = 'place_review'
    JOIN public.tbl_place AS p ON r.business_id = p.id
    WHERE l.user_id = auth.uid() -- 현재 로그인된 사용자
      AND l.liked = true           -- 좋아요 상태가 true인 것만
      AND l.liked_type = 'place_review' -- 리뷰에 대한 좋아요만
    ORDER BY
        l.created_at DESC -- 좋아요 누른 시간 최신순
    LIMIT p_limit
    OFFSET p_offset
)
SELECT COALESCE(json_agg(
    jsonb_build_object(
        'id', lr.id,
        'business_id', lr.business_id,
        'x', lr.x,
        'y', lr.y,
        'business_name', lr.business_name,
        'rating', lr.rating,
        'common_address', lr.common_address,
        'category', lr.category,
        'visitor_review_score', lr.visitor_review_score,
        'visitor_review_count', lr.visitor_review_count,
        'author_nickname', lr.author_nickname,
        'body', lr.body,
        'media', lr.media,
        'visit_count', lr.visit_count,
        'visited', lr.visited,
        'created', lr.created,
        'view_count', lr.view_count,
        -- 인터랙션 정보 추가 (v1_get_interaction_info 함수 사용)
        'like_count', (interaction_info ->> 'like_count')::int,
        'is_liked', true, -- 내가 좋아요 누른 목록이므로 항상 true
        'save_count', (interaction_info ->> 'save_count')::int,
        'is_saved', (interaction_info ->> 'is_saved')::boolean
    ) ORDER BY lr.liked_at DESC -- 최종 집계 시에도 정렬 순서 유지
), '[]'::json)
FROM my_liked_reviews_cte lr
-- 각 리뷰에 대해 인터랙션 정보 조회 (LATERAL JOIN 사용)
CROSS JOIN LATERAL public.v1_get_interaction_info(lr.id::text, 'place_review') AS interaction_info;
$$;

-- 함수 실행 권한 부여 (로그인된 사용자만)
-- GRANT EXECUTE ON FUNCTION public.v1_get_my_liked_reviews(integer, integer) TO authenticated;

-- 사용자 콘텐츠 저장 상태를 토글하는 함수 (tbl_save 테이블의 'saved' 컬럼 업데이트 방식)
CREATE OR REPLACE FUNCTION public.v1_toggle_save(
    p_saved_id text,       -- 저장 대상 아이템의 ID (예: 리뷰 ID, 장소 ID)
    p_saved_type text      -- 저장 대상 아이템의 타입 (예: 'place_review', 'place')
)
RETURNS jsonb -- 결과를 JSONB 형태로 반환 ('saved': true/false 또는 'error': '메시지')
LANGUAGE plpgsql
SECURITY DEFINER -- 함수 정의자의 권한으로 실행 (테이블 접근 등에 필요)
AS $$
DECLARE
    v_user_id uuid;             -- 인증된 사용자의 ID를 저장할 변수
    current_saved_status boolean; -- 현재 저장 상태를 저장할 변수
    new_saved_status boolean;      -- 새로 설정될 저장 상태
    result jsonb;             -- 반환할 JSONB 결과 객체
BEGIN
    -- 인증 컨텍스트에서 현재 로그인된 사용자의 ID 가져오기
    v_user_id := auth.uid();

    -- 사용자가 인증(로그인)되었는지 확인
    IF v_user_id IS NULL THEN
        RETURN jsonb_build_object('error', '로그인이 필요합니다.');
    END IF;

    -- public.tbl_save 테이블에서 해당 사용자, 아이템, 타입에 대한 행을 찾고
    -- 현재 'saved' 상태를 가져옵니다. 행이 없으면 null이 반환됩니다.
    SELECT saved
    INTO current_saved_status -- 조회 결과를 current_saved_status 변수에 저장
    FROM public.tbl_save
    WHERE user_id = v_user_id
      AND saved_id = p_saved_id
      AND saved_type = p_saved_type;

    IF current_saved_status IS NULL THEN
        -- 해당 저장 기록이 없는 경우: 새로운 행 삽입 (저장 상태: true)
        new_saved_status := true; -- 처음 저장하는 것이므로 true

        -- [TODO] 저장 대상 아이템이 실제로 존재하는지 확인 후 삽입 가능
        -- 예: if not exists(select 1 from public.tbl_place_review where id = p_saved_id and p_saved_type = 'place_review') then ...

        INSERT INTO public.tbl_save (user_id, saved_id, saved_type, saved)
        VALUES (v_user_id, p_saved_id, p_saved_type, new_saved_status);

        result := jsonb_build_object('saved', new_saved_status);

    ELSE
        -- 이미 저장 기록이 있는 경우: 'saved' 상태를 반전시킵니다.
        new_saved_status := NOT current_saved_status; -- 현재 상태의 반대 값으로 설정

        UPDATE public.tbl_save
        SET saved = new_saved_status -- 'saved' 컬럼 값을 새로운 상태로 업데이트
        WHERE user_id = v_user_id
          AND saved_id = p_saved_id
          AND saved_type = p_saved_type;

        result := jsonb_build_object('saved', new_saved_status);
    END IF;

    -- 최종 결과 (변경된 저장 상태) 반환
    RETURN result;

EXCEPTION
    -- 함수 실행 중 예기치 않은 오류가 발생했을 때 처리하는 블록
    WHEN others THEN
        -- 개발/디버깅 목적으로 실제 오류(SQLERRM)를 Supabase 로그 등에 기록하는 것이 좋습니다.
        -- 예: raise log 'v1_toggle_save 함수 오류: %', SQLERRM;
        -- 클라이언트에는 민감한 정보 노출을 피하기 위해 일반적인 오류 메시지를 반환합니다.
        RETURN jsonb_build_object('error', '저장 처리 중 예상치 못한 오류가 발생했습니다: ' || SQLERRM);
END;
$$;

DO $$
DECLARE
    func_record RECORD;
BEGIN
    FOR func_record IN 
        SELECT pg_get_function_identity_arguments(p.oid) as args
        FROM pg_proc p
        LEFT JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' AND p.proname = 'v1_toggle_like'
    LOOP
        EXECUTE 'DROP FUNCTION IF EXISTS public.v1_list_places_by_filters(' || func_record.args || ');';
    END LOOP;
END $$;

SELECT 
    p.proname as 함수명,
    pg_get_function_identity_arguments(p.oid) as 매개변수,
    t.typname as 반환타입
FROM pg_proc p
LEFT JOIN pg_namespace n ON p.pronamespace = n.oid
LEFT JOIN pg_type t ON p.prorettype = t.oid
WHERE n.nspname = 'public' AND p.proname = 'v1_list_places_by_filters';


-- 'authenticated' 역할을 가진 (로그인된) 사용자에게 이 함수를 실행할 권한 부여
--GRANT EXECUTE ON FUNCTION public.v1_toggle_save(text, text) TO authenticated;

-- 리뷰 좋아요 상태를 토글하는 함수 (tbl_like 테이블의 'liked' 컬럼 업데이트 방식)
create or replace function v1_toggle_like(
    p_liked_id text,       -- 좋아요 대상 아이템의 ID (예: 리뷰 ID)
    p_liked_type text      -- 좋아요 대상 아이템의 타입 (예: 'place_review')
)
returns jsonb -- 결과를 JSONB 형태로 반환 ('liked': true/false 또는 'error': '메시지')
language plpgsql
security definer -- 함수 정의자의 권한으로 실행 (테이블 접근 등에 필요)
as $$
declare
    v_user_id uuid;        -- 인증된 사용자의 ID를 저장할 변수
    current_liked_status boolean; -- 현재 좋아요 상태를 저장할 변수
    new_liked_status boolean;     -- 새로 설정될 좋아요 상태
    result jsonb;        -- 반환할 JSONB 결과 객체
begin
    -- 인증 컨텍스트에서 현재 로그인된 사용자의 ID 가져오기
    v_user_id := auth.uid();

    -- 사용자가 인증(로그인)되었는지 확인
    if v_user_id is null then
        return jsonb_build_object('error', '로그인이 필요합니다.');
    end if;

    -- public.tbl_like 테이블에서 해당 사용자, 아이템, 타입에 대한 행을 찾고
    -- 현재 'liked' 상태를 가져옵니다. 행이 없으면 null이 반환됩니다.
    select liked
    into current_liked_status -- 조회 결과를 current_liked_status 변수에 저장
    from public.tbl_like
    where user_id = v_user_id
    and liked_id = p_liked_id
    and liked_type = p_liked_type;

    if current_liked_status is null then
        -- 해당 좋아요 기록이 없는 경우: 새로운 행 삽입 (좋아요 상태: true)
        new_liked_status := true; -- 처음 좋아요를 누르는 것이므로 true

        -- [TODO] 좋아요가 존재하지 않는 경우, 새로운 좋아요 추가
        -- 선택적으로: 좋아요 대상 항목(리뷰)이 실제로 존재하는지 확인 후 삽입 가능
        -- if not exists(select 1 from public.tbl_place_review where id = p_liked_id) then
        --    -- 리뷰가 존재하지 않으면 오류 반환
        --    return jsonb_build_object('error', '좋아요 대상 리뷰를 찾을 수 없습니다.');
        -- end if;

        insert into public.tbl_like (user_id, liked_id, liked_type, liked)
        values (v_user_id, p_liked_id, p_liked_type, new_liked_status);

        result := jsonb_build_object('liked', new_liked_status);

    else
        -- 이미 좋아요 기록이 있는 경우: 'liked' 상태를 반전시킵니다.
        new_liked_status := not current_liked_status; -- 현재 상태의 반대 값으로 설정

        update public.tbl_like
        set liked = new_liked_status -- 'liked' 컬럼 값을 새로운 상태로 업데이트
        where user_id = v_user_id
        and liked_id = p_liked_id
        and liked_type = p_liked_type;

        result := jsonb_build_object('liked', new_liked_status);
    end if;

    -- 최종 결과 (변경된 좋아요 상태) 반환
    return result;

exception
    -- 함수 실행 중 예기치 않은 오류가 발생했을 때 처리하는 블록
    when others then
        -- 개발/디버깅 목적으로 실제 오류(SQLERRM)를 Supabase 로그 등에 기록하는 것이 좋습니다.
        -- 예: raise log 'toggle_like 함수 오류: %', SQLERRM;
        -- 클라이언트에는 민감한 정보 노출을 피하기 위해 일반적인 오류 메시지를 반환합니다.
        return jsonb_build_object('error', '좋아요 처리 중 예상치 못한 오류가 발생했습니다: ' || SQLERRM);
end;
$$;

-- 'authenticated' 역할을 가진 (로그인된) 사용자에게 이 함수를 실행할 권한 부여
-- grant execute on function public.v1_toggle_like(text, text) to authenticated; -- 기존 권한이 있다면 이 줄은 필요 없을 수 있습니다.
-- 만약 기존 함수 시그니처가 달랐다면, 이전 권한은 revoke하고 새로 grant해야 할 수 있습니다.
-- revoke execute on function public.v1_toggle_like(...) from authenticated; -- 이전 시그니처
-- grant execute on function public.v1_toggle_like(text, text) to authenticated; -- 새 시그니처
