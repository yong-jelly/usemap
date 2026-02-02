-- =====================================================
-- 093_v2_aggr_review_user_places.sql
-- 사용자 리뷰 분석 및 통계 집계 함수 (v2)
-- 
-- 인자:
--   @p_user_id: 대상 사용자 UUID (NULL일 경우 현재 인증된 사용자)
-- 
-- 실행 방법:
--   psql "postgresql://postgres.xyqpggpilgcdsawuvpzn:ZNDqDunnaydr0aFQ@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres" -f docs/sql/093_v2_aggr_review_user_places.sql
-- =====================================================

CREATE OR REPLACE FUNCTION public.v2_aggr_review_user_places(
    p_user_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public, auth, public
AS $$
DECLARE
    -- 사용자 ID 관련 변수
    target_user_id UUID;
    
    -- 반환할 JSON 결과 변수들
    review_summary JSONB;        -- 리뷰 현황 요약
    rating_distribution JSONB;   -- 별점 분포
    tag_reviews JSONB;          -- 태그별 리뷰 분석
    category_reviews JSONB;     -- 카테고리별 리뷰 분석
    recent_reviews JSONB;       -- 최근 리뷰 목록
    companion_analysis JSONB;   -- 동반자 분석
    revisit_analysis JSONB;     -- 재방문 분석
    
    -- 리뷰 현황 계산용 변수
    total_reviews BIGINT;       -- 총 리뷰 개수
    avg_rating NUMERIC(3,2);    -- 평균 별점 (0.0~5.0)
    satisfaction_score NUMERIC(5,2); -- 만족도 점수 (0~100+)
BEGIN
    -- ==============================================================================
    -- 1단계: 사용자 ID 유효성 검증 및 설정
    -- ==============================================================================
    
    -- 파라미터로 전달된 사용자 ID가 없으면 현재 인증된 사용자 ID 사용
    IF p_user_id IS NULL THEN
        target_user_id := auth.uid();
    ELSE
        target_user_id := p_user_id;
    END IF;
    
    -- 사용자 ID가 여전히 NULL인 경우 (인증되지 않은 사용자) 예외 발생
    IF target_user_id IS NULL THEN
        RAISE EXCEPTION '유효한 사용자 ID가 필요합니다.';
    END IF;

    -- ==============================================================================
    -- 2단계: 리뷰 현황 계산 (총 개수, 평균 별점, 만족도 점수)
    -- ==============================================================================
    
    -- 활성 상태인 리뷰만 대상으로 총 개수와 평균 별점 계산
    SELECT 
        COUNT(*),                    -- 총 리뷰 개수
        COALESCE(AVG(score), 0)     -- 평균 별점 (리뷰가 없으면 0)
    INTO total_reviews, avg_rating
    FROM tbl_place_user_review
    WHERE user_id = target_user_id AND is_active = true;
    
    -- 만족도 점수 계산 알고리즘
    -- 공식: (평균별점/5) * 100 * (1 + ln(리뷰수+1)/10)
    -- - 기본 점수: 평균별점을 100점 만점으로 환산
    -- - 보정 계수: 리뷰 개수가 많을수록 신뢰도 증가 (로그 함수 사용)
    -- - ln(리뷰수+1)/10: 리뷰가 많을수록 점수가 상승하지만 과도하지 않게 조정
    satisfaction_score := CASE 
        WHEN total_reviews = 0 THEN 0
        ELSE ROUND(
            ((avg_rating / 5.0) * 100 * (1 + LN(total_reviews + 1) / 10))::NUMERIC, 
            2
        )
    END;
    
    -- 리뷰 현황 JSON 객체 생성
    review_summary := jsonb_build_object(
        'total_reviews', total_reviews,
        'average_rating', COALESCE(avg_rating, 0),
        'satisfaction_score', COALESCE(satisfaction_score, 0)
    );

    -- ==============================================================================
    -- 3단계: 별점 분포 계산 (1~5점별 개수 및 비율)
    -- ==============================================================================
    
    WITH rating_counts AS (
        -- 먼저 각 별점별 리뷰 개수를 계산
        -- floor(score)를 사용하여 소수점 별점을 정수로 변환 (예: 4.5 -> 4)
        SELECT 
            floor(score) as rating,  -- 별점 (1~5)
            count(*) as cnt         -- 해당 별점의 리뷰 개수
        FROM tbl_place_user_review
        WHERE user_id = target_user_id 
        AND is_active = true
        AND score >= 1              -- 유효한 별점만 포함
        GROUP BY floor(score)
    )
    SELECT 
        COALESCE(
            jsonb_agg(
                jsonb_build_object(
                    'rating', s.rating,                    -- 별점 (1~5)
                    'count', COALESCE(rc.cnt, 0),         -- 해당 별점의 개수
                    'percentage', CASE                     -- 비율 계산
                        WHEN total_reviews = 0 THEN 0 
                        ELSE ROUND((COALESCE(rc.cnt, 0)::NUMERIC / total_reviews) * 100, 1) 
                    END
                ) ORDER BY s.rating  -- 별점 순으로 정렬
            ),
            '[]'::jsonb  -- 데이터가 없으면 빈 배열 반환
        )
    INTO rating_distribution
    FROM generate_series(1,5) as s(rating)  -- 1~5점 전체 범위 생성
    LEFT JOIN rating_counts rc ON s.rating = rc.rating;  -- 실제 데이터와 조인

    -- ==============================================================================
    -- 4단계: 태그별 리뷰 분석 (자주 사용한 태그 통계)
    -- ==============================================================================
    
    WITH tag_counts AS (
        -- 태그별 사용 횟수 계산
        -- tbl_place_user_review_tag_map과 tbl_place_user_review 조인
        SELECT 
            tag_code,               -- 태그 코드
            COUNT(*) as tag_count   -- 태그 사용 횟수
        FROM tbl_place_user_review_tag_map tm
        JOIN tbl_place_user_review r ON tm.review_id = r.id
        WHERE r.user_id = target_user_id AND r.is_active = true
        GROUP BY tag_code
    )
    SELECT 
        COALESCE(
            jsonb_agg(
                jsonb_build_object(
                    'tag_code', tag_code,               -- 태그 코드
                    'count', tag_count,                 -- 사용 횟수
                    'percentage', CASE                  -- 전체 리뷰 대비 비율
                        WHEN total_reviews = 0 THEN 0 
                        ELSE ROUND((tag_count::NUMERIC / total_reviews) * 100, 1) 
                    END
                ) ORDER BY tag_count DESC  -- 사용 횟수 내림차순 정렬
            ),
            '[]'::jsonb  -- 데이터가 없으면 빈 배열 반환
        )
    INTO tag_reviews
    FROM tag_counts;

    -- ==============================================================================
    -- 5단계: 카테고리별 리뷰 분석 (카테고리별 평균 별점 및 개수)
    -- ==============================================================================
    
    WITH category_stats AS (
        -- 카테고리별 평균 별점과 리뷰 개수 계산
        -- tbl_place_user_review와 tbl_place 조인하여 카테고리 정보 획득
        SELECT 
            p.category,                          -- 장소 카테고리
            ROUND(AVG(r.score), 1) as avg_score, -- 카테고리별 평균 별점
            COUNT(*) as review_count             -- 카테고리별 리뷰 개수
        FROM tbl_place_user_review r
        JOIN tbl_place p ON r.place_id = p.id
        WHERE r.user_id = target_user_id AND r.is_active = true
        GROUP BY p.category
    )
    SELECT 
        COALESCE(
            jsonb_agg(
                jsonb_build_object(
                    'category', category,           -- 카테고리명
                    'average_rating', avg_score,    -- 평균 별점
                    'count', review_count          -- 리뷰 개수
                ) ORDER BY review_count DESC  -- 리뷰 개수 내림차순 정렬
            ),
            '[]'::jsonb  -- 데이터가 없으면 빈 배열 반환
        )
    INTO category_reviews
    FROM category_stats;

    -- ==============================================================================
    -- 6단계: 최근 리뷰 목록 조회 (최근 10개 리뷰 상세 정보)
    -- ==============================================================================
    
    WITH recent_review_data AS (
        -- 최근 리뷰 기본 정보 조회 (장소 정보 포함)
        SELECT 
            r.id,                                                           -- 리뷰 ID
            r.is_private, -- 공개/숨김 상태
            p.group1, 
            p.group2, 
            p.group3, 
            p.id as place_id,
            COALESCE(p.category, '') as category,                           -- 카테고리
            COALESCE(p.name, '') as place_name,                            -- 장소명
            TO_CHAR(r.created_at, 'YYYY. MM. DD') as created_date,         -- 작성일 (포맷팅)
            COALESCE(r.review_content, '') as review_content,              -- 리뷰 내용
            r.score, -- 별점
            r.created_at                                                   -- 정렬용 원본 작성일
        FROM tbl_place_user_review r
        LEFT JOIN tbl_place p ON r.place_id = p.id
        WHERE r.user_id = target_user_id AND r.is_active = true
        ORDER BY r.created_at DESC  -- 최신순 정렬
        LIMIT 10                    -- 최근 10개만 조회
    ),
    review_tags AS (
        -- 최근 리뷰들의 태그 정보 별도 조회
        -- 리뷰별로 태그들을 JSON 배열로 집계
        SELECT 
            tm.review_id,                    -- 리뷰 ID
            jsonb_agg(tm.tag_code) as tags  -- 태그들을 JSON 배열로 집계
        FROM tbl_place_user_review_tag_map tm
        WHERE tm.review_id IN (SELECT id FROM recent_review_data)  -- 최근 리뷰들만 대상
        GROUP BY tm.review_id
    )
    SELECT 
        COALESCE(
            jsonb_agg(
                jsonb_build_object(
                    'is_private', rrd.is_private,      -- 공개/숨김 상태
                    'group1', rrd.group1,                  -- 지역 정보
                    'group2', rrd.group2,                  -- 지역 정보
                    'group3', rrd.group3,                  -- 지역 정보
                    'place_id', rrd.place_id,                  -- 지역 정보
                    'score', rrd.score,                  -- 지역 정보
                    'category', rrd.category,                  -- 카테고리
                    'place_name', rrd.place_name,              -- 장소명
                    'created_date', rrd.created_date,          -- 작성일
                    'tags', COALESCE(rt.tags, '[]'::jsonb),   -- 태그 목록
                    'review_content', rrd.review_content       -- 리뷰 내용
                ) ORDER BY rrd.created_at DESC  -- 최신순 정렬 유지
            ),
            '[]'::jsonb  -- 데이터가 없으면 빈 배열 반환
        )
    INTO recent_reviews
    FROM recent_review_data rrd
    LEFT JOIN review_tags rt ON rrd.id = rt.review_id;  -- 태그 정보와 조인

    -- ==============================================================================
    -- 7단계: 동반자 분석 (혼밥 vs 동반 식사 패턴)
    -- ==============================================================================
    
    WITH companion_stats AS (
        SELECT 
            COALESCE(NULLIF(TRIM(companion), ''), '기록없음') as companion_type,
            COUNT(*) as visit_count
        FROM tbl_visited
        WHERE user_id = target_user_id
        GROUP BY COALESCE(NULLIF(TRIM(companion), ''), '기록없음')
    ),
    total_visits AS (
        SELECT COUNT(*) as total FROM tbl_visited WHERE user_id = target_user_id
    )
    SELECT 
        COALESCE(
            jsonb_build_object(
                'total_visits', (SELECT total FROM total_visits),
                'breakdown', COALESCE(
                    (SELECT jsonb_agg(
                        jsonb_build_object(
                            'companion', companion_type,
                            'count', visit_count,
                            'percentage', CASE 
                                WHEN (SELECT total FROM total_visits) = 0 THEN 0 
                                ELSE ROUND((visit_count::NUMERIC / (SELECT total FROM total_visits)) * 100, 1) 
                            END
                        ) ORDER BY visit_count DESC
                    ) FROM companion_stats),
                    '[]'::jsonb
                )
            ),
            jsonb_build_object('total_visits', 0, 'breakdown', '[]'::jsonb)
        )
    INTO companion_analysis;

    -- ==============================================================================
    -- 8단계: 재방문 분석 (단골 장소 TOP 10)
    -- ==============================================================================
    
    WITH revisit_stats AS (
        SELECT 
            v.place_id,
            p.name as place_name,
            p.category,
            p.group1,
            p.group2,
            p.group3,
            COUNT(*) as visit_count,
            MAX(v.visited_at) as last_visited_at,
            MIN(v.visited_at) as first_visited_at
        FROM tbl_visited v
        JOIN tbl_place p ON v.place_id = p.id
        WHERE v.user_id = target_user_id
        GROUP BY v.place_id, p.name, p.category, p.group1, p.group2, p.group3
        HAVING COUNT(*) >= 2
        ORDER BY COUNT(*) DESC, MAX(v.visited_at) DESC
        LIMIT 10
    ),
    total_unique_places AS (
        SELECT COUNT(DISTINCT place_id) as total FROM tbl_visited WHERE user_id = target_user_id
    ),
    revisited_places_count AS (
        SELECT COUNT(*) as cnt FROM (
            SELECT place_id FROM tbl_visited WHERE user_id = target_user_id GROUP BY place_id HAVING COUNT(*) >= 2
        ) sq
    )
    SELECT 
        jsonb_build_object(
            'total_unique_places', (SELECT total FROM total_unique_places),
            'revisited_places_count', (SELECT cnt FROM revisited_places_count),
            'revisit_rate', CASE 
                WHEN (SELECT total FROM total_unique_places) = 0 THEN 0 
                ELSE ROUND(((SELECT cnt FROM revisited_places_count)::NUMERIC / (SELECT total FROM total_unique_places)) * 100, 1) 
            END,
            'top_revisited', COALESCE(
                (SELECT jsonb_agg(
                    jsonb_build_object(
                        'place_id', place_id,
                        'place_name', place_name,
                        'category', category,
                        'group1', group1,
                        'group2', group2,
                        'group3', group3,
                        'visit_count', visit_count,
                        'last_visited_at', TO_CHAR(last_visited_at, 'YYYY. MM. DD'),
                        'first_visited_at', TO_CHAR(first_visited_at, 'YYYY. MM. DD')
                    ) ORDER BY visit_count DESC, last_visited_at DESC
                ) FROM revisit_stats),
                '[]'::jsonb
            )
        )
    INTO revisit_analysis;

    -- ==============================================================================
    -- 9단계: 최종 결과 반환
    -- ==============================================================================
    
    -- 모든 분석 결과를 하나의 JSON 객체로 결합하여 반환
    RETURN jsonb_build_object(
        'review_summary', review_summary,           -- 리뷰 현황
        'rating_distribution', rating_distribution, -- 별점 분포
        'tag_analysis', tag_reviews,               -- 태그별 분석
        'category_analysis', category_reviews,     -- 카테고리별 분석
        'recent_reviews', recent_reviews,          -- 최근 리뷰 목록
        'companion_analysis', companion_analysis,  -- 동반자 분석
        'revisit_analysis', revisit_analysis       -- 재방문 분석
    );

EXCEPTION
    -- 예외 처리: 오류 발생시 상세한 오류 메시지와 함께 예외 재발생
    WHEN OTHERS THEN
        RAISE EXCEPTION 'v2_aggr_review_user_places 오류: %', SQLERRM;
END;
$$;

-- 권한 부여
GRANT EXECUTE ON FUNCTION public.v2_aggr_review_user_places(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.v2_aggr_review_user_places(UUID) TO service_role;

COMMENT ON FUNCTION public.v2_aggr_review_user_places IS '사용자 리뷰 분석 및 통계 집계 함수 (v2)';
