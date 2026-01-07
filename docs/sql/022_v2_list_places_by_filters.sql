-- =====================================================
-- 022_v2_list_places_by_filters.sql
-- 필터 기반 장소 목록 조회 RPC 함수 정의 (V2)
-- 
-- 개선 사항:
--   1. p_theme_codes: 단일 테마 코드 대신 배열로 받아 다중 정렬 지원
--   2. 정렬 순서: p_theme_codes 배열의 순서대로 우선순위 정렬
--   3. p_image_limit: 반환할 이미지 개수를 인자로 설정 (기본값 3)
--   4. themes 응답 추가: p_theme_codes에 해당하는 테마 정보 상세 반환
-- 
-- 인자:
--   @p_group1: 대분류 지역
--   @p_group2: 중분류 지역
--   @p_group3: 소분류 지역
--   @p_category: 카테고리 배열
--   @p_convenience: 편의시설 배열
--   @p_limit: 조회 제한 수 (기본 10)
--   @p_offset: 오프셋 (기본 0)
--   @p_theme_codes: 테마 코드 배열 (정렬 기준)
--   @p_exclude_franchises: 프랜차이즈 제외 여부 (기본 true)
--   @p_image_limit: 이미지 반환 개수 (기본 3)
-- 
-- 실행 방법:
--   psql "postgresql://postgres.xyqpggpilgcdsawuvpzn:ZNDqDunnaydr0aFQ@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres" -f docs/sql/022_v2_list_places_by_filters.sql
-- =====================================================

CREATE OR REPLACE FUNCTION public.v2_list_places_by_filters(
    p_group1 character varying DEFAULT NULL::character varying,
    p_group2 character varying DEFAULT NULL::character varying,
    p_group3 character varying DEFAULT NULL::character varying,
    p_category character varying[] DEFAULT NULL::character varying[],
    p_convenience character varying[] DEFAULT NULL::character varying[],
    p_limit integer DEFAULT 10,
    p_offset integer DEFAULT 0,
    p_theme_codes character varying[] DEFAULT NULL::character varying[],
    p_exclude_franchises boolean DEFAULT true,
    p_image_limit integer DEFAULT 3
)
RETURNS TABLE(place_data jsonb)
LANGUAGE plpgsql
STABLE
AS $function$
DECLARE
    v_where_clause TEXT := 'WHERE 1=1';
    v_order_by_clause TEXT := '';
    v_theme_code TEXT;
BEGIN
    -- 1. 필터 조건 동적 추가
    IF p_group1 IS NOT NULL THEN
        v_where_clause := v_where_clause || format(' AND p.group1 = %L', p_group1);
    END IF;

    IF p_group2 IS NOT NULL THEN
        v_where_clause := v_where_clause || format(' AND p.group2 = %L', p_group2);
    END IF;

    IF p_group3 IS NOT NULL THEN
        v_where_clause := v_where_clause || format(' AND p.group3 = %L', p_group3);
    END IF;

    IF p_category IS NOT NULL AND array_length(p_category, 1) > 0 THEN
        v_where_clause := v_where_clause || format(' AND p.category = ANY(%L)', p_category);
    END IF;

    IF p_exclude_franchises THEN
        v_where_clause := v_where_clause || ' AND p.is_franchise = FALSE';
    END IF;

    IF p_convenience IS NOT NULL AND array_length(p_convenience, 1) > 0 THEN
        v_where_clause := v_where_clause || format(' AND p.conveniences @> %L', p_convenience);
    END IF;

    -- 2. 테마 코드를 기반으로 정렬 구문 생성
    IF p_theme_codes IS NOT NULL AND array_length(p_theme_codes, 1) > 0 THEN
        FOREACH v_theme_code IN ARRAY p_theme_codes
        LOOP
            v_order_by_clause := v_order_by_clause || 
                format('(SELECT (details->>''count'')::INT FROM jsonb_array_elements(p.visitor_review_stats->''analysis''->''votedKeyword''->''details'') AS details WHERE details->>''code'' = %L LIMIT 1) DESC NULLS LAST, ', v_theme_code);
        END LOOP;
    END IF;

    -- 기본 정렬 추가 (리뷰 수, 별점 순)
    v_order_by_clause := v_order_by_clause || 'p.visitor_reviews_total DESC NULLS LAST, p.visitor_reviews_score DESC NULLS LAST';

    -- 3. 메인 쿼리 실행
    -- $1: p_limit, $2: p_offset, $3: p_theme_codes, $4: p_image_limit
    BEGIN
        RETURN QUERY EXECUTE format(
            $q$
            WITH ranked_places AS (
                SELECT
                    p.*,
                    -- 첫 번째 테마 코드의 투표 수를 voted_keyword_count로 반환 (하위 호환성 및 단일 지표용)
                    CASE WHEN $3 IS NOT NULL AND array_length($3, 1) > 0 THEN
                        (
                            SELECT (details->>'count')::INT
                            FROM jsonb_array_elements(p.visitor_review_stats->'analysis'->'votedKeyword'->'details') AS details
                            WHERE details->>'code' = $3[1]
                            LIMIT 1
                        )
                    ELSE NULL
                    END AS voted_keyword_count
                FROM
                    public.tbl_place p
                %s
            )
            SELECT
                jsonb_build_object(
                    'is_franchise', is_franchise,
                    'id', p.id,
                    'name', p.name,
                    'group1', p.group1,
                    'group2', p.group2,
                    'group3', p.group3,
                    'road', p.road,
                    'category', p.category,
                    'category_code', null,
                    'category_code_list', null,
                    'road_address', p.road_address,
                    'payment_info', null,
                    'conveniences', null,
                    'address', p.address,
                    'phone', p.phone,
                    'visitor_reviews_total', p.visitor_reviews_total,
                    'visitor_reviews_score', p.visitor_reviews_score,
                    'x', p.x,
                    'y', p.y,
                    'homepage', null,
                    'keyword_list', p.keyword_list,
                    'images',
                        CASE
                            WHEN p.images IS NOT NULL THEN
                                to_jsonb(p.images[1:LEAST(array_length(p.images, 1), $4)])
                            ELSE
                                '[]'::jsonb
                        END,
                    'static_map_url', p.static_map_url,
                    'themes', 
                        CASE 
                            WHEN $3 IS NOT NULL AND array_length($3, 1) > 0 THEN
                                (
                                    SELECT jsonb_agg(
                                        jsonb_build_object(
                                            'code', d->>'code',
                                            'name', d->>'displayName',
                                            'count', (d->>'count')::int
                                        )
                                    )
                                    FROM jsonb_array_elements(p.visitor_review_stats->'analysis'->'votedKeyword'->'details') AS d
                                    WHERE d->>'code' = ANY($3)
                                )
                            ELSE NULL
                        END,
                    'visitor_review_medias_total', p.visitor_review_medias_total,
                    'visitor_review_stats', null,
                    'voted_keyword_count', p.voted_keyword_count,
                    'menus', null,
                    'avg_price', calculate_menu_avg_price(p.menus),
                    'street_panorama', p.street_panorama,
                    'place_images', p.place_images,
                    'updated_at', p.updated_at,
                    'created_at', p.created_at,
                    'interaction', public.v1_common_place_interaction(p.id),
                    'features', public.v1_common_place_features(p.id),
                    'experience', jsonb_build_object('is_visited', public.v1_has_visited_place(p.id))
                )
            FROM
                ranked_places p
            ORDER BY
                %s
            LIMIT $1
            OFFSET $2
            $q$,
            v_where_clause,
            v_order_by_clause
        )
        USING p_limit, p_offset, p_theme_codes, p_image_limit;
    EXCEPTION
        WHEN others THEN
            RAISE LOG '쿼리 실행 오류: %', SQLERRM;
            RETURN QUERY SELECT jsonb_build_object(
                'error', '쿼리 실행 오류',
                'message', SQLERRM,
                'hint', '시스템 관리자에게 문의하세요'
            );
    END;
END;
$function$;
