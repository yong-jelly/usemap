-- =====================================================
-- 022_v2_list_places_by_filters.sql
-- 필터 기반 장소 목록 조회 RPC 함수 정의 (V2)
-- 
-- 최적화 내역 (V5.1):
--   1. 테마 인덱스 우선 활용: MV에서 테마가 일치하는 ID를 먼저 추출하여 연산 대상 대폭 축소
--   2. 하이브리드 필터링: 지역 필터와 테마 필터의 교집합을 선계산하여 조인 부하 제거
--   3. 성능: 대규모 지역(대전, 서울 등)에서도 5초 타임아웃 없이 1초 내외 응답 보장
--
-- 필수 인덱스:
--   CREATE INDEX idx_place_group_reviews_no_franchise 
--   ON public.tbl_place (group1, visitor_reviews_total DESC NULLS LAST)
--   WHERE is_franchise = FALSE;
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
    v_order_by_clause_internal TEXT := '';
    v_order_by_clause_external TEXT := '';
    v_theme_filter_join TEXT := '';
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

    -- 2. 정렬 및 필터 보조 구문 생성
    IF p_theme_codes IS NOT NULL AND array_length(p_theme_codes, 1) > 0 THEN
        v_order_by_clause_internal := 'harmony_score DESC NULLS LAST, ';
        v_order_by_clause_external := 's.harmony_score DESC NULLS LAST, ';
        -- 테마 필터가 있을 경우 후보군 추출 시 조인 추가
        v_theme_filter_join := format(' AND EXISTS (SELECT 1 FROM public.mv_place_theme_scores ts_filter WHERE ts_filter.place_id = p.id AND ts_filter.theme_code = ANY(%L))', p_theme_codes);
    END IF;

    v_order_by_clause_internal := v_order_by_clause_internal || 'visitor_reviews_total DESC NULLS LAST, visitor_reviews_score DESC NULLS LAST';
    v_order_by_clause_external := v_order_by_clause_external || 's.visitor_reviews_total DESC NULLS LAST, s.visitor_reviews_score DESC NULLS LAST';

    -- 3. 메인 쿼리 실행
    BEGIN
        RETURN QUERY EXECUTE format(
            $q$
            WITH base_candidates AS (
                -- 지역/카테고리/테마 필터가 적용된 기본 후보군
                SELECT
                    p.id,
                    p.visitor_reviews_total,
                    p.visitor_reviews_score
                FROM
                    public.tbl_place p
                %s  -- 기본 WHERE 절 (v_where_clause)
                %s  -- 테마 필터링 절 (v_theme_filter_join)
                ORDER BY p.visitor_reviews_total DESC NULLS LAST
                LIMIT 10000
            ),
            theme_matches AS (
                -- 선택된 테마를 가진 장소들의 점수 계산
                SELECT 
                    ts.place_id,
                    (COUNT(*) * 1000000 + COALESCE(SUM(ts.count * (1.0 / GREATEST(array_position($3, ts.theme_code), 1))), 0))::NUMERIC AS harmony_score,
                    MAX(CASE WHEN ts.theme_code = $3[1] THEN ts.count ELSE NULL END) AS first_theme_count
                FROM 
                    public.mv_place_theme_scores ts
                JOIN
                    base_candidates bc ON ts.place_id = bc.id
                WHERE 
                    $3 IS NOT NULL AND array_length($3, 1) > 0 
                    AND ts.theme_code = ANY($3)
                GROUP BY 
                    ts.place_id
            ),
            scored_places AS (
                SELECT
                    bc.id,
                    COALESCE(tm.harmony_score, 0) AS harmony_score,
                    COALESCE(tm.first_theme_count, 0) AS voted_keyword_count,
                    bc.visitor_reviews_total,
                    bc.visitor_reviews_score
                FROM
                    base_candidates bc
                LEFT JOIN 
                    theme_matches tm ON bc.id = tm.place_id
                WHERE 
                    ($3 IS NULL OR array_length($3, 1) = 0) 
                    OR tm.harmony_score > 0
                ORDER BY
                    %s
                LIMIT $1
                OFFSET $2
            )
            SELECT
                jsonb_build_object(
                    'is_franchise', p.is_franchise,
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
                    'themes', null,
                    'visitor_review_medias_total', p.visitor_review_medias_total,
                    'visitor_review_stats', null,
                    'voted_keyword_count', s.voted_keyword_count,
                    'menus', null,
                    'avg_price', calculate_menu_avg_price(p.menus),
                    'voted_summary_text', (
                        SELECT (v->>'description')::text
                        FROM tbl_place_analysis a, jsonb_array_elements(a.voted) v
                        WHERE a.business_id = p.id
                        LIMIT 1
                    ),
                    'street_panorama', null,
                    'place_images', p.place_images,
                    'updated_at', p.updated_at,
                    'created_at', p.created_at,
                    'interaction', public.v1_common_place_interaction(p.id),
                    'features', public.v1_common_place_features(p.id),
                    'experience', jsonb_build_object('is_visited', public.v1_has_visited_place(p.id))
                )
            FROM
                scored_places s
            JOIN
                public.tbl_place p ON s.id = p.id
            ORDER BY
                %s
            $q$,
            v_where_clause,
            v_theme_filter_join,
            v_order_by_clause_internal,
            v_order_by_clause_external
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
