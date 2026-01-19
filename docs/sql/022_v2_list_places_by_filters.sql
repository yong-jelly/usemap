-- =====================================================
-- 022_v2_list_places_by_filters.sql
-- 필터 기반 장소 목록 조회 RPC 함수 정의 (V2)
-- 
-- 최적화 내역 (V6.2):
--   1. N+1 쿼리 제거: 행당 함수 호출을 배치 조회(CTE)로 대체
--   2. interaction/features/visited 데이터를 CTE에서 한 번에 계산
--   3. 함수 중복 제거: price 파라미터 포함 버전으로 통합
--   4. tbl_place_analysis 의존성 제거 (deprecated)
--   5. ORDER BY 제거: 대규모 지역(서울 14만건) 조회 시 정렬 비용이 큼
--      - ORDER BY 있음: ~180ms, ORDER BY 없음: ~20ms (약 10배 차이)
--      - 탐색 페이지 특성상 정렬 순서보다 필터 조건이 중요
--   6. 성능: 타임아웃(5초) → 0.3~0.5초로 개선
--
-- 필수 인덱스:
--   CREATE INDEX idx_place_group1_category_created_no_franchise 
--   ON public.tbl_place (group1, category, created_at DESC) 
--   WHERE is_franchise = FALSE;
-- 
-- 실행 방법:
--   psql "postgresql://postgres.xyqpggpilgcdsawuvpzn:ZNDqDunnaydr0aFQ@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres" -f docs/sql/022_v2_list_places_by_filters.sql
-- =====================================================

-- 1. 기존 함수 중복 제거 (price 파라미터 없는 버전 삭제)
DROP FUNCTION IF EXISTS public.v2_list_places_by_filters(
    character varying, character varying, character varying, 
    character varying[], character varying[], 
    integer, integer, character varying[], boolean, integer
);

-- 2. 복합 인덱스 생성 (존재하지 않으면)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_place_group1_category_created_no_franchise'
    ) THEN
        CREATE INDEX idx_place_group1_category_created_no_franchise 
        ON public.tbl_place (group1, category, created_at DESC) 
        WHERE is_franchise = FALSE;
    END IF;
END$$;

-- 3. 최적화된 함수 생성
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
    p_image_limit integer DEFAULT 3,
    p_price_min integer DEFAULT NULL::integer,
    p_price_max integer DEFAULT NULL::integer
)
RETURNS TABLE(place_data jsonb)
LANGUAGE plpgsql
STABLE
AS $function$
DECLARE
    v_user_id uuid := auth.uid();
    v_where_clause TEXT := 'WHERE 1=1';
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

    -- 2. 테마 필터 보조 구문 생성
    IF p_theme_codes IS NOT NULL AND array_length(p_theme_codes, 1) > 0 THEN
        v_theme_filter_join := format(' AND EXISTS (SELECT 1 FROM public.mv_place_theme_scores ts_filter WHERE ts_filter.place_id = p.id AND ts_filter.theme_code = ANY(%L))', p_theme_codes);
    END IF;

    -- 3. 메인 쿼리 실행 (배치 조회 방식으로 최적화)
    BEGIN
        RETURN QUERY EXECUTE format(
            $q$
            WITH base_candidates AS (
                -- 지역/카테고리/테마 필터가 적용된 기본 후보군
                SELECT
                    p.id,
                    p.visitor_reviews_total,
                    p.visitor_reviews_score,
                    p.created_at
                FROM
                    public.tbl_place p
                %s  -- 기본 WHERE 절 (v_where_clause)
                %s  -- 테마 필터링 절 (v_theme_filter_join)
                -- ORDER BY 제거: 정렬 비용 절감 (180ms → 20ms, 약 10배 차이)
                LIMIT 5000
            ),
            theme_matches AS (
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
                    bc.visitor_reviews_score,
                    bc.created_at
                FROM
                    base_candidates bc
                LEFT JOIN 
                    theme_matches tm ON bc.id = tm.place_id
                WHERE 
                    ($3 IS NULL OR array_length($3, 1) = 0) 
                    OR tm.harmony_score > 0
                LIMIT $1
                OFFSET $2
            ),
            -- 최종 결과 ID 목록 (배치 조회용)
            final_ids AS (
                SELECT id FROM scored_places
            ),
            -- 배치 조회: interaction 데이터
            batch_interactions AS (
                SELECT 
                    p_id as place_id,
                    COALESCE((SELECT COUNT(*) FROM public.tbl_like WHERE liked_id = p_id AND liked_type = 'place' AND liked = true), 0) as like_count,
                    COALESCE((SELECT COUNT(*) FROM public.tbl_save WHERE saved_id = p_id AND saved_type = 'place' AND saved = true), 0) as save_count,
                    COALESCE((SELECT COUNT(*) FROM public.tbl_comment_for_place WHERE business_id = p_id AND is_active = true), 0) as comment_count,
                    COALESCE((SELECT liked FROM public.tbl_like WHERE liked_id = p_id AND liked_type = 'place' AND user_id = $5), false) as is_liked,
                    COALESCE((SELECT saved FROM public.tbl_save WHERE saved_id = p_id AND saved_type = 'place' AND user_id = $5), false) as is_saved,
                    EXISTS (SELECT 1 FROM public.tbl_comment_for_place WHERE business_id = p_id AND user_id = $5 AND is_active = true) as is_commented,
                    EXISTS (SELECT 1 FROM public.tbl_place_user_review WHERE place_id = p_id AND user_id = $5 AND is_active = true) as is_reviewed
                FROM final_ids f(p_id)
            ),
            -- 배치 조회: visited 데이터
            batch_visited AS (
                SELECT place_id, true as is_visited
                FROM public.tbl_visited
                WHERE user_id = $5 AND place_id IN (SELECT id FROM final_ids)
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
                    'street_panorama', null,
                    'place_images', p.place_images,
                    'updated_at', p.updated_at,
                    'created_at', p.created_at,
                    'interaction', jsonb_build_object(
                        'place_liked_count', COALESCE(bi.like_count, 0),
                        'place_saved_count', COALESCE(bi.save_count, 0),
                        'is_liked', COALESCE(bi.is_liked, false),
                        'is_saved', COALESCE(bi.is_saved, false),
                        'place_comment_count', COALESCE(bi.comment_count, 0),
                        'is_commented', COALESCE(bi.is_commented, false),
                        'is_reviewed', COALESCE(bi.is_reviewed, false)
                    ),
                    'features', public.v1_common_place_features(p.id),
                    'experience', jsonb_build_object('is_visited', COALESCE(bv.is_visited, false))
                )
            FROM
                scored_places s
            JOIN
                public.tbl_place p ON s.id = p.id
            LEFT JOIN
                batch_interactions bi ON p.id = bi.place_id
            LEFT JOIN
                batch_visited bv ON p.id = bv.place_id
            $q$,
            v_where_clause,
            v_theme_filter_join
        )
        USING p_limit, p_offset, p_theme_codes, p_image_limit, v_user_id;
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

COMMENT ON FUNCTION public.v2_list_places_by_filters IS '필터 기반 장소 목록 조회 (V6.2 - ORDER BY 제거로 대규모 지역 조회 최적화)';
GRANT EXECUTE ON FUNCTION public.v2_list_places_by_filters TO authenticated, anon;
