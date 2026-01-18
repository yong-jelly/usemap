-- =====================================================
-- 080_location_functions.sql
-- 사용자 위치 정보 관리 및 거리순 정렬을 위한 함수 정의
-- =====================================================

-- 1. 사용자 위치 저장 (가장 가까운 음식점 정보 포함)
-- 성능 최적화: 경계 박스로 먼저 필터링 후 거리 계산
CREATE OR REPLACE FUNCTION public.v1_save_user_location(
    p_latitude DOUBLE PRECISION,
    p_longitude DOUBLE PRECISION
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_nearest_place RECORD;
    v_location_id UUID;
    v_search_radius DOUBLE PRECISION := 0.05; -- 약 5km 반경 (위도/경도 기준)
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION '로그인이 필요합니다.';
    END IF;

    -- 가장 가까운 음식점 조회 (경계 박스 필터 후 하버사인 거리 계산)
    -- x: longitude, y: latitude
    SELECT 
        id, name, road_address,
        (6371 * acos(
            LEAST(1.0, GREATEST(-1.0,
                cos(radians(p_latitude)) * cos(radians(y::double precision)) * 
                cos(radians(x::double precision) - radians(p_longitude)) + 
                sin(radians(p_latitude)) * sin(radians(y::double precision))
            ))
        )) * 1000 as dist_m
    INTO v_nearest_place
    FROM public.tbl_place
    WHERE x IS NOT NULL AND y IS NOT NULL
      AND x ~ '^[0-9.]+$' AND y ~ '^[0-9.]+$'
      -- 경계 박스로 먼저 필터링 (인덱스 활용 가능)
      AND x::double precision BETWEEN p_longitude - v_search_radius AND p_longitude + v_search_radius
      AND y::double precision BETWEEN p_latitude - v_search_radius AND p_latitude + v_search_radius
    ORDER BY dist_m ASC
    LIMIT 1;

    -- 근처에 장소가 없으면 더 넓은 범위로 재시도 (약 20km)
    IF v_nearest_place IS NULL THEN
        v_search_radius := 0.2;
        SELECT 
            id, name, road_address,
            (6371 * acos(
                LEAST(1.0, GREATEST(-1.0,
                    cos(radians(p_latitude)) * cos(radians(y::double precision)) * 
                    cos(radians(x::double precision) - radians(p_longitude)) + 
                    sin(radians(p_latitude)) * sin(radians(y::double precision))
                ))
            )) * 1000 as dist_m
        INTO v_nearest_place
        FROM public.tbl_place
        WHERE x IS NOT NULL AND y IS NOT NULL
          AND x ~ '^[0-9.]+$' AND y ~ '^[0-9.]+$'
          AND x::double precision BETWEEN p_longitude - v_search_radius AND p_longitude + v_search_radius
          AND y::double precision BETWEEN p_latitude - v_search_radius AND p_latitude + v_search_radius
        ORDER BY dist_m ASC
        LIMIT 1;
    END IF;

    -- 위치 정보 저장
    INSERT INTO public.tbl_location (
        user_id,
        latitude,
        longitude,
        nearest_place_id,
        nearest_place_name,
        nearest_place_address,
        distance_meters
    ) VALUES (
        v_user_id,
        p_latitude,
        p_longitude,
        v_nearest_place.id,
        v_nearest_place.name,
        v_nearest_place.road_address,
        v_nearest_place.dist_m
    )
    RETURNING id INTO v_location_id;

    RETURN jsonb_build_object(
        'id', v_location_id,
        'nearest_place_name', v_nearest_place.name,
        'nearest_place_address', v_nearest_place.road_address,
        'distance_meters', v_nearest_place.dist_m
    );
END;
$$;

-- 2. 사용자 위치 목록 조회 (최근 10개)
CREATE OR REPLACE FUNCTION public.v1_get_user_locations(
    p_limit INT DEFAULT 10
)
RETURNS TABLE (
    id UUID,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    nearest_place_id VARCHAR,
    nearest_place_name VARCHAR,
    nearest_place_address VARCHAR,
    distance_meters DOUBLE PRECISION,
    created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        l.id, l.latitude, l.longitude, 
        l.nearest_place_id, l.nearest_place_name, l.nearest_place_address, 
        l.distance_meters, l.created_at
    FROM public.tbl_location l
    WHERE l.user_id = auth.uid()
    ORDER BY l.created_at DESC
    LIMIT p_limit;
END;
$$;

-- 3. 사용자 위치 삭제
CREATE OR REPLACE FUNCTION public.v1_delete_user_location(
    p_location_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
    DELETE FROM public.tbl_location
    WHERE id = p_location_id AND user_id = auth.uid();
    
    RETURN FOUND;
END;
$$;

-- 4. 내 피드 조회 v3 (거리순 정렬 지원)
DROP FUNCTION IF EXISTS public.v3_get_my_feed(INT, INT, INT, INT, TIMESTAMPTZ, VARCHAR, DOUBLE PRECISION, DOUBLE PRECISION);
CREATE OR REPLACE FUNCTION public.v3_get_my_feed(
    p_limit INT DEFAULT 20,
    p_offset INT DEFAULT 0,
    p_price_min INT DEFAULT NULL,
    p_price_max INT DEFAULT NULL,
    p_cursor_timestamp TIMESTAMPTZ DEFAULT NULL,
    p_sort_by VARCHAR DEFAULT 'recent', -- 'recent' or 'distance'
    p_user_lat DOUBLE PRECISION DEFAULT NULL,
    p_user_lng DOUBLE PRECISION DEFAULT NULL
)
RETURNS TABLE (
    source_type VARCHAR,
    source_id VARCHAR,
    source_title VARCHAR,
    source_image VARCHAR,
    place_id VARCHAR,
    place_data JSONB,
    added_at TIMESTAMPTZ,
    comment TEXT,
    distance_meters DOUBLE PRECISION
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
#variable_conflict use_column
DECLARE
    v_user_id UUID := auth.uid();
BEGIN
    IF v_user_id IS NULL THEN
        RETURN;
    END IF;

    RETURN QUERY
    WITH 
    -- 소스 목록 (동일 소스 중복 제거)
    all_sources AS (
        SELECT DISTINCT ON (s_type, s_id) s_type, s_id, s_title, s_image
        FROM (
            SELECT 'folder'::VARCHAR as s_type, f.id::VARCHAR as s_id, f.title::VARCHAR as s_title, up.profile_image_url::VARCHAR as s_image
            FROM public.tbl_folder_subscribed fs
            JOIN public.tbl_folder f ON fs.folder_id = f.id AND f.is_hidden = FALSE
            LEFT JOIN public.tbl_user_profile up ON f.owner_id = up.auth_user_id
            WHERE fs.user_id = v_user_id AND fs.deleted_at IS NULL
            UNION ALL
            SELECT 'folder'::VARCHAR as s_type, f.id::VARCHAR as s_id, f.title::VARCHAR as s_title, up.profile_image_url::VARCHAR as s_image
            FROM public.tbl_folder f
            LEFT JOIN public.tbl_user_profile up ON f.owner_id = up.auth_user_id
            WHERE f.owner_id = v_user_id AND f.is_hidden = FALSE
            UNION ALL
            SELECT 'folder'::VARCHAR as s_type, f.id::VARCHAR as s_id, f.title::VARCHAR as s_title, up.profile_image_url::VARCHAR as s_image
            FROM public.tbl_folder_place fp
            JOIN public.tbl_folder f ON fp.folder_id = f.id AND f.is_hidden = FALSE
            LEFT JOIN public.tbl_user_profile up ON f.owner_id = up.auth_user_id
            WHERE fp.user_id = v_user_id AND fp.deleted_at IS NULL
            UNION ALL
            SELECT fts.feature_type::VARCHAR as s_type, fts.feature_id::VARCHAR as s_id, nf.name::VARCHAR as s_title, NULL::VARCHAR as s_image
            FROM public.tbl_feature_subscription fts
            LEFT JOIN public.tbl_naver_folder nf ON nf.folder_id::varchar = fts.feature_id
            WHERE fts.user_id = v_user_id AND fts.deleted_at IS NULL AND fts.feature_type = 'naver_folder'
            UNION ALL
            SELECT fts.feature_type::VARCHAR as s_type, fts.feature_id::VARCHAR as s_id, (SELECT pf.metadata->>'channelTitle' FROM public.tbl_place_features pf WHERE pf.metadata->>'channelId' = fts.feature_id LIMIT 1)::VARCHAR as s_title, (SELECT pf.metadata->'thumbnails'->'default'->>'url' FROM public.tbl_place_features pf WHERE pf.metadata->>'channelId' = fts.feature_id LIMIT 1)::VARCHAR as s_image
            FROM public.tbl_feature_subscription fts
            WHERE fts.user_id = v_user_id AND fts.deleted_at IS NULL AND fts.feature_type = 'youtube_channel'
            UNION ALL
            SELECT fts.feature_type::VARCHAR as s_type, fts.feature_id::VARCHAR as s_id, fts.feature_id::VARCHAR as s_title, NULL::VARCHAR as s_image
            FROM public.tbl_feature_subscription fts
            WHERE fts.user_id = v_user_id AND fts.deleted_at IS NULL AND fts.feature_type IN ('community_region', 'region_recommend')
        ) raw_sources
        ORDER BY s_type, s_id
    ),
    -- 원본 피드 아이템 (중복 가능)
    raw_feed_items AS (
        SELECT 'folder'::text as type, fp.folder_id::varchar as sid, fp.place_id as pid, fp.created_at as added_time, fp.comment
        FROM public.tbl_folder_place fp
        WHERE fp.deleted_at IS NULL AND EXISTS (SELECT 1 FROM all_sources s WHERE s.s_type = 'folder' AND s.s_id = fp.folder_id)
        UNION ALL
        SELECT 'naver_folder'::text as type, nfp.folder_id::varchar as sid, nfp.place_id as pid, nf.created_at as added_time, NULL::text as comment
        FROM public.tbl_naver_folder_place nfp
        JOIN public.tbl_naver_folder nf ON nfp.folder_id = nf.folder_id
        WHERE EXISTS (SELECT 1 FROM all_sources s WHERE s.s_type = 'naver_folder' AND s.s_id = nfp.folder_id::varchar)
        UNION ALL
        SELECT CASE WHEN pf.platform_type = 'youtube' THEN 'youtube_channel' WHEN pf.platform_type = 'community' THEN 'community_region' ELSE pf.platform_type END as type, 
               CASE WHEN pf.platform_type = 'youtube' THEN pf.metadata->>'channelId' ELSE (SELECT p_inner.group1 FROM public.tbl_place p_inner WHERE p_inner.id = pf.place_id) END as sid,
               pf.place_id as pid, pf.published_at as added_time, NULL::text as comment
        FROM public.tbl_place_features pf
        WHERE pf.status = 'active' AND ((pf.platform_type = 'youtube' AND EXISTS (SELECT 1 FROM all_sources s WHERE s.s_type = 'youtube_channel' AND s.s_id = pf.metadata->>'channelId')) OR (pf.platform_type = 'community' AND EXISTS (SELECT 1 FROM all_sources s WHERE s.s_type = 'community_region')))
    ),
    -- 같은 소스 내에서 동일 장소 중복 제거 (가장 최신 항목 유지)
    feed_items AS (
        SELECT DISTINCT ON (type, sid, pid) type, sid, pid, added_time, comment
        FROM raw_feed_items
        ORDER BY type, sid, pid, added_time DESC
    ),
    -- 장소 데이터와 거리 계산
    feed_with_distance AS (
        SELECT 
            s.s_type, s.s_id, s.s_title, s.s_image, p.id as place_id, fi.added_time, fi.comment,
            calculate_menu_avg_price(p.menus) as avg_price,
            p.id, p.name, p.group1, p.group2, p.group3, p.road, p.category, p.road_address, p.address, p.phone, p.visitor_reviews_total, p.visitor_reviews_score, p.x, p.y, p.images, p.static_map_url, p.keyword_list, p.visitor_review_medias_total, p.menus, p.place_images, p.updated_at as place_updated_at, p.created_at as place_created_at, p.is_franchise, p.conveniences, p.homepage,
            CASE 
                WHEN p_user_lat IS NOT NULL AND p_user_lng IS NOT NULL AND p.x IS NOT NULL AND p.y IS NOT NULL AND p.x ~ '^[0-9.]+$' AND p.y ~ '^[0-9.]+$'
                THEN (6371 * acos(LEAST(1.0, GREATEST(-1.0, cos(radians(p_user_lat)) * cos(radians(p.y::double precision)) * cos(radians(p.x::double precision) - radians(p_user_lng)) + sin(radians(p_user_lat)) * sin(radians(p.y::double precision)))))) * 1000
                ELSE NULL
            END as dist_m
        FROM feed_items fi
        JOIN all_sources s ON s.s_type = fi.type AND s.s_id = fi.sid
        JOIN public.tbl_place p ON fi.pid = p.id
        WHERE (p_cursor_timestamp IS NULL OR fi.added_time < p_cursor_timestamp)
          AND (p_price_min IS NULL OR calculate_menu_avg_price(p.menus) >= p_price_min)
          AND (p_price_max IS NULL OR calculate_menu_avg_price(p.menus) <= p_price_max)
    ),
    -- 동일 장소 중복 제거: 거리순일 때는 가장 가까운 것 기준, 최신순일 때는 가장 최신 것 기준
    deduplicated_feed AS (
        SELECT DISTINCT ON (place_id) *
        FROM feed_with_distance
        ORDER BY place_id,
            CASE WHEN p_sort_by = 'distance' THEN dist_m END ASC NULLS LAST,
            CASE WHEN p_sort_by = 'recent' THEN added_time END DESC
    ),
    target_feed AS (
        SELECT *
        FROM deduplicated_feed
        ORDER BY 
            CASE WHEN p_sort_by = 'distance' THEN dist_m END ASC NULLS LAST,
            CASE WHEN p_sort_by = 'recent' THEN added_time END DESC
        LIMIT p_limit OFFSET p_offset
    ),
    place_interactions AS (
        SELECT tf.place_id,
            COALESCE((SELECT count(*) FROM public.tbl_like WHERE liked_id = tf.place_id AND liked_type = 'place' AND liked = true), 0) as liked_count,
            COALESCE((SELECT count(*) FROM public.tbl_save WHERE saved_id = tf.place_id AND saved_type = 'place' AND saved = true), 0) as saved_count,
            COALESCE((SELECT count(*) FROM public.tbl_comment_for_place WHERE business_id = tf.place_id AND is_active = true), 0) as comment_count,
            COALESCE((SELECT count(*) FROM public.tbl_place_user_review WHERE place_id = tf.place_id AND is_active = true), 0) as reviews_count,
            COALESCE((SELECT liked FROM public.tbl_like WHERE liked_id = tf.place_id AND liked_type = 'place' AND user_id = v_user_id), false) as is_liked,
            COALESCE((SELECT saved FROM public.tbl_save WHERE saved_id = tf.place_id AND saved_type = 'place' AND user_id = v_user_id), false) as is_saved,
            EXISTS (SELECT 1 FROM public.tbl_comment_for_place WHERE business_id = tf.place_id AND user_id = v_user_id AND is_active = true) as is_commented,
            EXISTS (SELECT 1 FROM public.tbl_place_user_review WHERE place_id = tf.place_id AND user_id = v_user_id AND is_active = true) as is_reviewed
        FROM target_feed tf
    ),
    place_experiences AS (
        SELECT tf.place_id, COALESCE(v.visit_count, 0) as visit_count, v.last_visited_at
        FROM target_feed tf
        LEFT JOIN LATERAL (SELECT count(*) as visit_count, max(visited_at) as last_visited_at FROM public.tbl_visited WHERE user_id = v_user_id AND place_id = tf.place_id) v ON true
    )
    SELECT 
        tf.s_type::VARCHAR as source_type, tf.s_id::VARCHAR as source_id, tf.s_title::VARCHAR as source_title, tf.s_image::VARCHAR as source_image, tf.place_id::VARCHAR as place_id,
        jsonb_build_object(
            'id', tf.id, 'name', tf.name, 'group1', tf.group1, 'group2', tf.group2, 'group3', tf.group3, 'road', tf.road, 'category', tf.category, 'road_address', tf.road_address, 'address', tf.address, 'phone', tf.phone, 'visitor_reviews_total', tf.visitor_reviews_total, 'visitor_reviews_score', tf.visitor_reviews_score, 'x', tf.x, 'y', tf.y, 'images', tf.images, 'image_urls', tf.images, 'static_map_url', tf.static_map_url, 'keyword_list', tf.keyword_list, 'visitor_review_medias_total', tf.visitor_review_medias_total, 'menus', tf.menus, 'avg_price', tf.avg_price, 'place_images', tf.place_images, 'updated_at', tf.place_updated_at, 'created_at', tf.place_created_at, 'is_franchise', tf.is_franchise, 'conveniences', tf.conveniences, 'homepage', tf.homepage,
            'interaction', jsonb_build_object('place_liked_count', pi.liked_count, 'place_saved_count', pi.saved_count, 'is_liked', pi.is_liked, 'is_saved', pi.is_saved, 'place_comment_count', pi.comment_count, 'place_reviews_count', pi.reviews_count, 'is_commented', pi.is_commented, 'is_reviewed', pi.is_reviewed, 'visit_count', pe.visit_count, 'last_visited_at', pe.last_visited_at),
            'features', public.v1_common_place_features(tf.place_id),
            'experience', jsonb_build_object('is_visited', pe.visit_count > 0, 'visit_count', pe.visit_count, 'last_visited_at', pe.last_visited_at)
        ) as place_data,
        tf.added_time::TIMESTAMPTZ as added_at, tf.comment::TEXT as comment,
        tf.dist_m as distance_meters
    FROM target_feed tf
    LEFT JOIN place_interactions pi ON pi.place_id = tf.place_id
    LEFT JOIN place_experiences pe ON pe.place_id = tf.place_id
    ORDER BY 
        CASE WHEN p_sort_by = 'distance' THEN tf.dist_m END ASC NULLS LAST,
        CASE WHEN p_sort_by = 'recent' THEN tf.added_time END DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.v1_save_user_location TO authenticated;
GRANT EXECUTE ON FUNCTION public.v1_get_user_locations TO authenticated;
GRANT EXECUTE ON FUNCTION public.v1_delete_user_location TO authenticated;
GRANT EXECUTE ON FUNCTION public.v3_get_my_feed TO authenticated;
