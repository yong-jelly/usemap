-- =====================================================
-- 081_optimize_v4_get_my_feed.sql
-- v3_get_my_feed 성능 최적화 버전
-- 
-- 개선 사항:
--   1. calculate_menu_avg_price 중복 호출 제거 (3회 → 1회)
--   2. place_interactions N+1 쿼리 → LEFT JOIN + GROUP BY 배치 처리
--   3. 이중 DISTINCT ON 제거 → 한 번에 place_id 기준으로 중복 제거
--   4. v1_common_place_features를 LATERAL JOIN으로 배치화
-- 
-- 인자:
--   @p_limit: 조회할 개수 (기본 20)
--   @p_offset: 오프셋 (기본 0)
--   @p_price_min: 최소 평균 가격 필터
--   @p_price_max: 최대 평균 가격 필터
--   @p_cursor_timestamp: 커서 기반 페이지네이션용 (옵션)
--   @p_sort_by: 정렬 기준 ('recent' or 'distance')
--   @p_user_lat: 사용자 위도 (거리 계산용)
--   @p_user_lng: 사용자 경도 (거리 계산용)
-- 
-- 실행 방법:
--   psql "postgresql://postgres.xyqpggpilgcdsawuvpzn:ZNDqDunnaydr0aFQ@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres" -f docs/sql/081_optimize_v4_get_my_feed.sql
-- =====================================================

DROP FUNCTION IF EXISTS public.v4_get_my_feed(INT, INT, INT, INT, TIMESTAMPTZ, VARCHAR, DOUBLE PRECISION, DOUBLE PRECISION);
CREATE OR REPLACE FUNCTION public.v4_get_my_feed(
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
    -- =========================================================
    -- 1단계: 사용자의 모든 소스를 미리 계산 (UNION으로 중복 제거)
    -- =========================================================
    all_sources AS (
        SELECT 'folder'::VARCHAR as s_type, f.id::VARCHAR as s_id, f.title::VARCHAR as s_title, up.profile_image_url::VARCHAR as s_image
        FROM public.tbl_folder_subscribed fs
        JOIN public.tbl_folder f ON fs.folder_id = f.id AND f.is_hidden = FALSE
        LEFT JOIN public.tbl_user_profile up ON f.owner_id = up.auth_user_id
        WHERE fs.user_id = v_user_id AND fs.deleted_at IS NULL
        
        UNION
        
        SELECT 'folder'::VARCHAR, f.id::VARCHAR, f.title::VARCHAR, up.profile_image_url::VARCHAR
        FROM public.tbl_folder f
        LEFT JOIN public.tbl_user_profile up ON f.owner_id = up.auth_user_id
        WHERE f.owner_id = v_user_id AND f.is_hidden = FALSE
        
        UNION
        
        SELECT 'folder'::VARCHAR, f.id::VARCHAR, f.title::VARCHAR, up.profile_image_url::VARCHAR
        FROM public.tbl_folder_place fp
        JOIN public.tbl_folder f ON fp.folder_id = f.id AND f.is_hidden = FALSE
        LEFT JOIN public.tbl_user_profile up ON f.owner_id = up.auth_user_id
        WHERE fp.user_id = v_user_id AND fp.deleted_at IS NULL
        
        UNION
        
        SELECT fts.feature_type::VARCHAR, fts.feature_id::VARCHAR, nf.name::VARCHAR, NULL::VARCHAR
        FROM public.tbl_feature_subscription fts
        LEFT JOIN public.tbl_naver_folder nf ON nf.folder_id::varchar = fts.feature_id
        WHERE fts.user_id = v_user_id AND fts.deleted_at IS NULL AND fts.feature_type = 'naver_folder'
        
        UNION
        
        SELECT fts.feature_type::VARCHAR, fts.feature_id::VARCHAR,
               (SELECT pf.metadata->>'channelTitle' FROM public.tbl_place_features pf WHERE pf.metadata->>'channelId' = fts.feature_id LIMIT 1)::VARCHAR,
               (SELECT pf.metadata->'thumbnails'->'default'->>'url' FROM public.tbl_place_features pf WHERE pf.metadata->>'channelId' = fts.feature_id LIMIT 1)::VARCHAR
        FROM public.tbl_feature_subscription fts
        WHERE fts.user_id = v_user_id AND fts.deleted_at IS NULL AND fts.feature_type = 'youtube_channel'
        
        UNION
        
        SELECT fts.feature_type::VARCHAR, fts.feature_id::VARCHAR, fts.feature_id::VARCHAR, NULL::VARCHAR
        FROM public.tbl_feature_subscription fts
        WHERE fts.user_id = v_user_id AND fts.deleted_at IS NULL AND fts.feature_type IN ('community_region', 'region_recommend')
    ),
    
    -- =========================================================
    -- 2단계: 피드 아이템 수집 (UNION ALL로 빠르게)
    -- =========================================================
    raw_feed_items AS (
        SELECT 'folder'::text as type, fp.folder_id::varchar as sid, fp.place_id as pid, fp.created_at as added_time, fp.comment
        FROM public.tbl_folder_place fp
        WHERE fp.deleted_at IS NULL 
          AND EXISTS (SELECT 1 FROM all_sources s WHERE s.s_type = 'folder' AND s.s_id = fp.folder_id)
        
        UNION ALL
        
        SELECT 'naver_folder'::text, nfp.folder_id::varchar, nfp.place_id, nf.created_at, NULL::text
        FROM public.tbl_naver_folder_place nfp
        JOIN public.tbl_naver_folder nf ON nfp.folder_id = nf.folder_id
        WHERE EXISTS (SELECT 1 FROM all_sources s WHERE s.s_type = 'naver_folder' AND s.s_id = nfp.folder_id::varchar)
        
        UNION ALL
        
        SELECT 
            CASE WHEN pf.platform_type = 'youtube' THEN 'youtube_channel' WHEN pf.platform_type = 'community' THEN 'community_region' ELSE pf.platform_type END,
            CASE WHEN pf.platform_type = 'youtube' THEN pf.metadata->>'channelId' ELSE (SELECT p_inner.group1 FROM public.tbl_place p_inner WHERE p_inner.id = pf.place_id) END,
            pf.place_id, pf.published_at, NULL::text
        FROM public.tbl_place_features pf
        WHERE pf.status = 'active' 
          AND ((pf.platform_type = 'youtube' AND EXISTS (SELECT 1 FROM all_sources s WHERE s.s_type = 'youtube_channel' AND s.s_id = pf.metadata->>'channelId'))
               OR (pf.platform_type = 'community' AND EXISTS (SELECT 1 FROM all_sources s WHERE s.s_type = 'community_region')))
    ),
    
    -- =========================================================
    -- 3단계: 장소 데이터 조인 + avg_price 1회 계산 + 거리 계산
    -- =========================================================
    feed_with_place AS (
        SELECT 
            fi.type, fi.sid, fi.pid, fi.added_time, fi.comment,
            p.id, p.name, p.group1, p.group2, p.group3, p.road, p.category,
            p.road_address, p.address, p.phone, p.visitor_reviews_total, p.visitor_reviews_score,
            p.x, p.y, p.images, p.static_map_url, p.keyword_list, p.visitor_review_medias_total,
            p.menus, p.place_images, p.updated_at as place_updated_at, p.created_at as place_created_at,
            p.is_franchise, p.conveniences, p.homepage,
            -- avg_price 1회만 계산
            calculate_menu_avg_price(p.menus) as avg_price,
            -- 거리 계산
            CASE 
                WHEN p_user_lat IS NOT NULL AND p_user_lng IS NOT NULL 
                     AND p.x IS NOT NULL AND p.y IS NOT NULL 
                     AND p.x ~ '^[0-9.]+$' AND p.y ~ '^[0-9.]+$'
                THEN (6371 * acos(LEAST(1.0, GREATEST(-1.0, 
                    cos(radians(p_user_lat)) * cos(radians(p.y::double precision)) * 
                    cos(radians(p.x::double precision) - radians(p_user_lng)) + 
                    sin(radians(p_user_lat)) * sin(radians(p.y::double precision))
                )))) * 1000
                ELSE NULL
            END as dist_m
        FROM raw_feed_items fi
        JOIN public.tbl_place p ON fi.pid = p.id
    ),
    
    -- =========================================================
    -- 4단계: 가격 필터 적용 + 커서 필터 (avg_price 재계산 없음)
    -- =========================================================
    filtered_feed AS (
        SELECT *
        FROM feed_with_place
        WHERE (p_cursor_timestamp IS NULL OR added_time < p_cursor_timestamp)
          AND (p_price_min IS NULL OR avg_price >= p_price_min)
          AND (p_price_max IS NULL OR avg_price <= p_price_max)
    ),
    
    -- =========================================================
    -- 5단계: place_id 기준 중복 제거 (한 번만 수행)
    -- 정렬 기준에 따라 대표 행 선택
    -- =========================================================
    deduplicated_feed AS (
        SELECT DISTINCT ON (pid) *
        FROM filtered_feed
        ORDER BY pid,
            CASE WHEN p_sort_by = 'distance' THEN dist_m END ASC NULLS LAST,
            CASE WHEN p_sort_by = 'recent' THEN added_time END DESC
    ),
    
    -- =========================================================
    -- 6단계: 소스 정보 조인 + 최종 정렬 + 페이지네이션
    -- =========================================================
    target_feed AS (
        SELECT 
            s.s_type, s.s_id, s.s_title, s.s_image,
            df.*
        FROM deduplicated_feed df
        JOIN all_sources s ON s.s_type = df.type AND s.s_id = df.sid
        ORDER BY 
            CASE WHEN p_sort_by = 'distance' THEN df.dist_m END ASC NULLS LAST,
            CASE WHEN p_sort_by = 'recent' THEN df.added_time END DESC
        LIMIT p_limit OFFSET p_offset
    ),
    
    -- =========================================================
    -- 7단계: interaction 데이터 배치 조회 (LEFT JOIN 기반)
    -- =========================================================
    place_interactions AS (
        SELECT 
            tf.pid as place_id,
            COALESCE(lk.liked_count, 0) as liked_count,
            COALESCE(sv.saved_count, 0) as saved_count,
            COALESCE(cm.comment_count, 0) as comment_count,
            COALESCE(rv.reviews_count, 0) as reviews_count,
            COALESCE(my_lk.is_liked, false) as is_liked,
            COALESCE(my_sv.is_saved, false) as is_saved,
            COALESCE(my_cm.is_commented, false) as is_commented,
            COALESCE(my_rv.is_reviewed, false) as is_reviewed
        FROM target_feed tf
        LEFT JOIN LATERAL (
            SELECT count(*)::int as liked_count 
            FROM public.tbl_like 
            WHERE liked_id = tf.pid AND liked_type = 'place' AND liked = true
        ) lk ON true
        LEFT JOIN LATERAL (
            SELECT count(*)::int as saved_count 
            FROM public.tbl_save 
            WHERE saved_id = tf.pid AND saved_type = 'place' AND saved = true
        ) sv ON true
        LEFT JOIN LATERAL (
            SELECT count(*)::int as comment_count 
            FROM public.tbl_comment_for_place 
            WHERE business_id = tf.pid AND is_active = true
        ) cm ON true
        LEFT JOIN LATERAL (
            SELECT count(*)::int as reviews_count 
            FROM public.tbl_place_user_review 
            WHERE place_id = tf.pid AND is_active = true
        ) rv ON true
        LEFT JOIN LATERAL (
            SELECT liked as is_liked 
            FROM public.tbl_like 
            WHERE liked_id = tf.pid AND liked_type = 'place' AND user_id = v_user_id
            LIMIT 1
        ) my_lk ON true
        LEFT JOIN LATERAL (
            SELECT saved as is_saved 
            FROM public.tbl_save 
            WHERE saved_id = tf.pid AND saved_type = 'place' AND user_id = v_user_id
            LIMIT 1
        ) my_sv ON true
        LEFT JOIN LATERAL (
            SELECT true as is_commented 
            FROM public.tbl_comment_for_place 
            WHERE business_id = tf.pid AND user_id = v_user_id AND is_active = true
            LIMIT 1
        ) my_cm ON true
        LEFT JOIN LATERAL (
            SELECT true as is_reviewed 
            FROM public.tbl_place_user_review 
            WHERE place_id = tf.pid AND user_id = v_user_id AND is_active = true
            LIMIT 1
        ) my_rv ON true
    ),
    
    -- =========================================================
    -- 8단계: experience(방문) 데이터 배치 조회
    -- =========================================================
    place_experiences AS (
        SELECT 
            tf.pid as place_id,
            COALESCE(v.visit_count, 0) as visit_count,
            v.last_visited_at
        FROM target_feed tf
        LEFT JOIN LATERAL (
            SELECT count(*)::int as visit_count, max(visited_at) as last_visited_at
            FROM public.tbl_visited
            WHERE user_id = v_user_id AND place_id = tf.pid
        ) v ON true
    ),
    
    -- =========================================================
    -- 9단계: features 배치 조회 (LATERAL JOIN)
    -- =========================================================
    place_features AS (
        SELECT 
            tf.pid as place_id,
            COALESCE(pf.features, '[]'::jsonb) as features
        FROM target_feed tf
        LEFT JOIN LATERAL (
            SELECT jsonb_agg(to_jsonb(af.*)) as features
            FROM (
                SELECT 
                    pf.id::text as id, pf.title, pf.status, pf.user_id::text, pf.metadata,
                    pf.created_at, pf.updated_at, pf.content_url, pf.is_verified, pf.published_at, pf.platform_type
                FROM public.tbl_place_features pf
                WHERE pf.place_id = tf.pid AND pf.status = 'active'
                
                UNION ALL
                
                SELECT 
                    nf.folder_id::text, nf.name, 'active', NULL::text,
                    jsonb_build_object('url', NULL, 'title', nf.name, 'domain', 'naver', 'description', nf.memo),
                    nf.created_at, nf.updated_at, NULL, false, nf.created_at, 'folder'
                FROM public.tbl_naver_folder_place nfp
                JOIN public.tbl_naver_folder nf ON nfp.folder_id = nf.folder_id
                WHERE nfp.place_id = tf.pid
                
                UNION ALL
                
                SELECT 
                    f.id, f.title, 'active', f.owner_id::text,
                    jsonb_build_object('url', '/folder/' || f.id, 'title', f.title, 'domain', 'feature', 'description', f.description),
                    f.created_at, f.updated_at, '/folder/' || f.id, false, f.created_at, 'public_user'
                FROM public.tbl_folder_place fp
                JOIN public.tbl_folder f ON fp.folder_id = f.id
                WHERE fp.place_id = tf.pid AND fp.deleted_at IS NULL AND f.permission = 'public' AND f.is_hidden = FALSE
            ) af
        ) pf ON true
    )
    
    -- =========================================================
    -- 최종 SELECT
    -- =========================================================
    SELECT 
        tf.s_type::VARCHAR as source_type,
        tf.s_id::VARCHAR as source_id,
        tf.s_title::VARCHAR as source_title,
        tf.s_image::VARCHAR as source_image,
        tf.pid::VARCHAR as place_id,
        jsonb_build_object(
            'id', tf.id,
            'name', tf.name,
            'group1', tf.group1,
            'group2', tf.group2,
            'group3', tf.group3,
            'road', tf.road,
            'category', tf.category,
            'road_address', tf.road_address,
            'address', tf.address,
            'phone', tf.phone,
            'visitor_reviews_total', tf.visitor_reviews_total,
            'visitor_reviews_score', tf.visitor_reviews_score,
            'x', tf.x,
            'y', tf.y,
            'images', tf.images,
            'image_urls', tf.images,
            'static_map_url', tf.static_map_url,
            'keyword_list', tf.keyword_list,
            'visitor_review_medias_total', tf.visitor_review_medias_total,
            'menus', tf.menus,
            'avg_price', tf.avg_price,
            'place_images', tf.place_images,
            'updated_at', tf.place_updated_at,
            'created_at', tf.place_created_at,
            'is_franchise', tf.is_franchise,
            'conveniences', tf.conveniences,
            'homepage', tf.homepage,
            'interaction', jsonb_build_object(
                'place_liked_count', pi.liked_count,
                'place_saved_count', pi.saved_count,
                'is_liked', pi.is_liked,
                'is_saved', pi.is_saved,
                'place_comment_count', pi.comment_count,
                'place_reviews_count', pi.reviews_count,
                'is_commented', pi.is_commented,
                'is_reviewed', pi.is_reviewed,
                'visit_count', pe.visit_count,
                'last_visited_at', pe.last_visited_at
            ),
            'features', pfeat.features,
            'experience', jsonb_build_object(
                'is_visited', pe.visit_count > 0,
                'visit_count', pe.visit_count,
                'last_visited_at', pe.last_visited_at
            )
        ) as place_data,
        tf.added_time::TIMESTAMPTZ as added_at,
        tf.comment::TEXT as comment,
        tf.dist_m as distance_meters
    FROM target_feed tf
    LEFT JOIN place_interactions pi ON pi.place_id = tf.pid
    LEFT JOIN place_experiences pe ON pe.place_id = tf.pid
    LEFT JOIN place_features pfeat ON pfeat.place_id = tf.pid
    ORDER BY 
        CASE WHEN p_sort_by = 'distance' THEN tf.dist_m END ASC NULLS LAST,
        CASE WHEN p_sort_by = 'recent' THEN tf.added_time END DESC;
END;
$$;

COMMENT ON FUNCTION public.v4_get_my_feed IS '내 피드 조회 v4 - v3 성능 최적화 버전 (avg_price 1회 계산, interaction 배치 처리, features 인라인화)';
GRANT EXECUTE ON FUNCTION public.v4_get_my_feed TO authenticated;
