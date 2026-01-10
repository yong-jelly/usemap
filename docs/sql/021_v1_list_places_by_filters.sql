-- =====================================================
-- 021_v1_list_places_by_filters.sql
-- 필터 기반 장소 목록 조회 RPC 함수 정의
-- 
-- 실행 방법:
--   psql "postgresql://postgres.xyqpggpilgcdsawuvpzn:ZNDqDunnaydr0aFQ@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres" -f docs/sql/021_v1_list_places_by_filters.sql
-- =====================================================

CREATE OR REPLACE FUNCTION public.v1_list_places_by_filters(
    p_group1 character varying DEFAULT NULL::character varying,
    p_group2 character varying DEFAULT NULL::character varying,
    p_group3 character varying DEFAULT NULL::character varying,
    p_category character varying[] DEFAULT NULL::character varying[],
    p_convenience character varying[] DEFAULT NULL::character varying[],
    p_limit integer DEFAULT 10,
    p_offset integer DEFAULT 0,
    p_theme_code character varying DEFAULT NULL::character varying,
    p_exclude_franchises boolean DEFAULT true
)
RETURNS TABLE(place_data jsonb)
LANGUAGE plpgsql
STABLE
AS $function$
DECLARE
    v_where_clause TEXT := 'WHERE 1=1';
BEGIN
    -- 필터 조건 동적 추가
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

    BEGIN
        RETURN QUERY EXECUTE format(
            $q$
            WITH ranked_places AS (
                SELECT
                    p.*,
                    CASE WHEN %L IS NOT NULL THEN
                        (
                            SELECT (details->>'count')::INT
                            FROM jsonb_array_elements(p.visitor_review_stats->'analysis'->'votedKeyword'->'details') AS details
                            WHERE details->>'code' = %L
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
                                to_jsonb(p.images[1:LEAST(array_length(p.images, 1), 3)])
                            ELSE
                                '[]'::jsonb
                        END,
                    'static_map_url', p.static_map_url,
                    'themes', null,
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
                CASE WHEN %L IS NOT NULL THEN p.voted_keyword_count ELSE NULL END DESC NULLS LAST,
                p.visitor_reviews_total DESC NULLS LAST,
                p.visitor_reviews_score DESC NULLS LAST
            LIMIT $1
            OFFSET $2
            $q$,
            p_theme_code,
            p_theme_code,
            v_where_clause,
            p_theme_code
        )
        USING p_limit, p_offset;
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
