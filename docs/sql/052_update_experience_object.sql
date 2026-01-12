-- =====================================================
-- 052_update_experience_object.sql
-- experience 객체에 방문 횟수 및 마지막 방문일 추가
-- =====================================================
-- 실행 방법:
--   psql "postgresql://postgres.xyqpggpilgcdsawuvpzn:ZNDqDunnaydr0aFQ@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres" -f docs/sql/052_update_experience_object.sql
-- =====================================================
-- 1. v1_has_visited_place_v2 (상세 정보를 포함하는 버전)
CREATE OR REPLACE FUNCTION public.v1_get_place_experience(p_place_id text)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
AS $function$
DECLARE
    v_user_id uuid := auth.uid();
    v_count int := 0;
    v_last_at timestamp with time zone := NULL;
BEGIN
    IF v_user_id IS NULL THEN 
        RETURN jsonb_build_object('is_visited', false, 'visit_count', 0, 'last_visited_at', NULL); 
    END IF;

    SELECT count(*), max(visited_at) INTO v_count, v_last_at
    FROM public.tbl_visited 
    WHERE user_id = v_user_id AND place_id = p_place_id;

    RETURN jsonb_build_object(
        'is_visited', v_count > 0,
        'visit_count', v_count,
        'last_visited_at', v_last_at
    );
END;
$function$;

-- 2. 관련 함수들 업데이트 (v1_get_folder_places, v1_get_my_feed 등)
-- 이들은 common_place_interaction을 쓰거나 직접 experience를 구축함.

-- v1_get_folder_places 업데이트
CREATE OR REPLACE FUNCTION public.v1_get_folder_places(
    p_folder_id VARCHAR,
    p_limit INT DEFAULT 20,
    p_offset INT DEFAULT 0
)
RETURNS TABLE (
    place_id VARCHAR,
    place_data JSONB,
    added_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
#variable_conflict use_column
DECLARE
    v_user_id UUID;
    v_folder_owner_id UUID;
    v_folder_permission VARCHAR;
    v_is_owner BOOLEAN;
    v_is_subscribed BOOLEAN;
BEGIN
    v_user_id := auth.uid();
    SELECT f.owner_id, f.permission INTO v_folder_owner_id, v_folder_permission 
    FROM public.tbl_folder f WHERE f.id = p_folder_id AND f.is_hidden = FALSE;
    IF v_folder_owner_id IS NULL THEN RETURN; END IF;
    v_is_owner := (v_user_id IS NOT NULL AND v_folder_owner_id = v_user_id);
    IF v_user_id IS NOT NULL THEN
        SELECT EXISTS (SELECT 1 FROM public.tbl_folder_subscribed sub WHERE sub.folder_id = p_folder_id AND sub.user_id = v_user_id AND sub.deleted_at IS NULL) INTO v_is_subscribed;
    ELSE v_is_subscribed := FALSE; END IF;
    IF v_folder_permission = 'hidden' AND NOT v_is_owner THEN RETURN; END IF;
    IF v_folder_permission = 'invite' AND NOT (v_is_owner OR v_is_subscribed) THEN RETURN; END IF;
    IF v_folder_permission = 'default' AND NOT v_is_owner THEN RETURN; END IF;

    RETURN QUERY
    SELECT 
        pl.id,
        (to_jsonb(pl) || jsonb_build_object(
            'image_urls', pl.images,
            'interaction', public.v1_common_place_interaction(pl.id),
            'features', public.v1_common_place_features(pl.id),
            'experience', public.v1_get_place_experience(pl.id)
        )) AS p_data,
        fp.created_at::TIMESTAMPTZ AS a_at
    FROM public.tbl_folder_place fp
    JOIN public.tbl_place pl ON fp.place_id = pl.id
    WHERE fp.folder_id = p_folder_id AND fp.deleted_at IS NULL
    ORDER BY fp.created_at DESC LIMIT p_limit OFFSET p_offset;
END;
$$;

-- v1_get_my_feed 업데이트
CREATE OR REPLACE FUNCTION public.v1_get_my_feed(
    p_limit INT DEFAULT 20,
    p_offset INT DEFAULT 0,
    p_price_min INT DEFAULT NULL,
    p_price_max INT DEFAULT NULL
)
RETURNS TABLE (
    source_type VARCHAR,
    source_id VARCHAR,
    source_title VARCHAR,
    source_image VARCHAR,
    place_id VARCHAR,
    place_data JSONB,
    added_at TIMESTAMPTZ,
    comment TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
#variable_conflict use_column
BEGIN
    RETURN QUERY
    WITH all_sources AS (
        SELECT 'folder'::VARCHAR as s_type, folder_id::VARCHAR as s_id FROM public.tbl_folder_subscribed WHERE user_id = auth.uid() AND deleted_at IS NULL
        UNION SELECT 'folder'::VARCHAR as s_type, id::VARCHAR as s_id FROM public.tbl_folder WHERE owner_id = auth.uid() AND is_hidden = FALSE
        UNION SELECT 'folder'::VARCHAR as s_type, folder_id::VARCHAR as s_id FROM public.tbl_folder_place WHERE user_id = auth.uid() AND deleted_at IS NULL
        UNION SELECT feature_type as s_type, feature_id as s_id FROM public.tbl_feature_subscription WHERE user_id = auth.uid() AND deleted_at IS NULL
    )
    SELECT 
        s.s_type::VARCHAR as source_type, s.s_id::VARCHAR as source_id,
        (CASE WHEN s.s_type = 'folder' THEN (SELECT f_inner.title FROM public.tbl_folder f_inner WHERE f_inner.id = s.s_id) ELSE 'Unknown' END)::VARCHAR as source_title,
        (CASE WHEN s.s_type = 'folder' THEN (SELECT up_inner.profile_image_url FROM public.tbl_folder f_inner JOIN public.tbl_user_profile up_inner ON f_inner.owner_id::uuid = up_inner.auth_user_id WHERE f_inner.id = s.s_id) ELSE NULL END)::VARCHAR as source_image,
        p.id::VARCHAR as place_id,
        (to_jsonb(p) || jsonb_build_object(
            'image_urls', p.images, 
            'avg_price', calculate_menu_avg_price(p.menus),
            'interaction', public.v1_common_place_interaction(p.id),
            'features', public.v1_common_place_features(p.id),
            'experience', public.v1_get_place_experience(p.id)
        )) as place_data,
        feed_data.added_time::TIMESTAMPTZ as added_at,
        feed_data.comment::TEXT as comment
    FROM (
        SELECT 'folder' as type, fp.folder_id as sid, fp.place_id as pid, fp.created_at::TIMESTAMPTZ as added_time, fp.comment FROM public.tbl_folder_place fp WHERE fp.deleted_at IS NULL
    ) feed_data
    JOIN all_sources s ON s.s_type = feed_data.type AND s.s_id = feed_data.sid
    JOIN public.tbl_place p ON feed_data.pid = p.id
    WHERE (p_price_min IS NULL OR calculate_menu_avg_price(p.menus) >= p_price_min)
      AND (p_price_max IS NULL OR calculate_menu_avg_price(p.menus) <= p_price_max)
    ORDER BY feed_data.added_time DESC LIMIT p_limit OFFSET p_offset;
END;
$$;

-- v2_list_places_by_filters 업데이트
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
    IF p_group1 IS NOT NULL THEN v_where_clause := v_where_clause || format(' AND p.group1 = %L', p_group1); END IF;
    IF p_group2 IS NOT NULL THEN v_where_clause := v_where_clause || format(' AND p.group2 = %L', p_group2); END IF;
    IF p_group3 IS NOT NULL THEN v_where_clause := v_where_clause || format(' AND p.group3 = %L', p_group3); END IF;
    IF p_category IS NOT NULL AND array_length(p_category, 1) > 0 THEN v_where_clause := v_where_clause || format(' AND p.category = ANY(%L)', p_category); END IF;
    IF p_exclude_franchises THEN v_where_clause := v_where_clause || ' AND p.is_franchise = FALSE'; END IF;
    IF p_convenience IS NOT NULL AND array_length(p_convenience, 1) > 0 THEN v_where_clause := v_where_clause || format(' AND p.conveniences @> %L', p_convenience); END IF;

    IF p_theme_codes IS NOT NULL AND array_length(p_theme_codes, 1) > 0 THEN
        v_order_by_clause_internal := 'harmony_score DESC NULLS LAST, ';
        v_order_by_clause_external := 's.harmony_score DESC NULLS LAST, ';
        v_theme_filter_join := format(' AND EXISTS (SELECT 1 FROM public.mv_place_theme_scores ts_filter WHERE ts_filter.place_id = p.id AND ts_filter.theme_code = ANY(%L))', p_theme_codes);
    END IF;

    v_order_by_clause_internal := v_order_by_clause_internal || 'visitor_reviews_total DESC NULLS LAST, visitor_reviews_score DESC NULLS LAST';
    v_order_by_clause_external := v_order_by_clause_external || 's.visitor_reviews_total DESC NULLS LAST, s.visitor_reviews_score DESC NULLS LAST';

    BEGIN
        RETURN QUERY EXECUTE format(
            $q$
            WITH base_candidates AS (
                SELECT p.id, p.visitor_reviews_total, p.visitor_reviews_score FROM public.tbl_place p %s %s ORDER BY p.visitor_reviews_total DESC NULLS LAST LIMIT 10000
            ),
            theme_matches AS (
                SELECT ts.place_id, (COUNT(*) * 1000000 + COALESCE(SUM(ts.count * (1.0 / GREATEST(array_position($3, ts.theme_code), 1))), 0))::NUMERIC AS harmony_score, MAX(CASE WHEN ts.theme_code = $3[1] THEN ts.count ELSE NULL END) AS first_theme_count FROM public.mv_place_theme_scores ts JOIN base_candidates bc ON ts.place_id = bc.id WHERE $3 IS NOT NULL AND array_length($3, 1) > 0 AND ts.theme_code = ANY($3) GROUP BY ts.place_id
            ),
            scored_places AS (
                SELECT bc.id, COALESCE(tm.harmony_score, 0) AS harmony_score, COALESCE(tm.first_theme_count, 0) AS voted_keyword_count, bc.visitor_reviews_total, bc.visitor_reviews_score FROM base_candidates bc LEFT JOIN theme_matches tm ON bc.id = tm.place_id WHERE ($3 IS NULL OR array_length($3, 1) = 0) OR tm.harmony_score > 0 ORDER BY %s LIMIT $1 OFFSET $2
            )
            SELECT jsonb_build_object(
                'is_franchise', p.is_franchise, 'id', p.id, 'name', p.name, 'group1', p.group1, 'group2', p.group2, 'group3', p.group3, 'road', p.road, 'category', p.category, 'category_code', null, 'category_code_list', null, 'road_address', p.road_address, 'payment_info', null, 'conveniences', null, 'address', p.address, 'phone', p.phone, 'visitor_reviews_total', p.visitor_reviews_total, 'visitor_reviews_score', p.visitor_reviews_score, 'x', p.x, 'y', p.y, 'homepage', null, 'keyword_list', p.keyword_list, 'images', CASE WHEN p.images IS NOT NULL THEN to_jsonb(p.images[1:LEAST(array_length(p.images, 1), $4)]) ELSE '[]'::jsonb END, 'static_map_url', p.static_map_url,
                'themes', CASE WHEN $3 IS NOT NULL AND array_length($3, 1) > 0 THEN (SELECT jsonb_agg(jsonb_build_object('code', d->>'code', 'name', d->>'displayName', 'count', (d->>'count')::int)) FROM jsonb_array_elements(p.visitor_review_stats->'analysis'->'votedKeyword'->'details') AS d WHERE d->>'code' = ANY($3)) ELSE NULL END,
                'visitor_review_medias_total', p.visitor_review_medias_total, 'visitor_review_stats', null, 'voted_keyword_count', s.voted_keyword_count, 'menus', null, 'avg_price', calculate_menu_avg_price(p.menus),
                'voted_summary_text', (SELECT (v->>'description')::text FROM tbl_place_analysis a, jsonb_array_elements(a.voted) v WHERE a.business_id = p.id LIMIT 1),
                'street_panorama', p.street_panorama, 'place_images', p.place_images, 'updated_at', p.updated_at, 'created_at', p.created_at,
                'interaction', public.v1_common_place_interaction(p.id),
                'features', public.v1_common_place_features(p.id),
                'experience', public.v1_get_place_experience(p.id)
            )
            FROM scored_places s JOIN public.tbl_place p ON s.id = p.id ORDER BY %s
            $q$,
            v_where_clause, v_theme_filter_join, v_order_by_clause_internal, v_order_by_clause_external
        ) USING p_limit, p_offset, p_theme_codes, p_image_limit;
    EXCEPTION WHEN others THEN
        RAISE LOG '쿼리 실행 오류: %', SQLERRM;
        RETURN QUERY SELECT jsonb_build_object('error', '쿼리 실행 오류', 'message', SQLERRM, 'hint', '시스템 관리자에게 문의하세요');
    END;
END;
$function$;
