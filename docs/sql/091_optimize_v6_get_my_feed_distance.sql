-- =====================================================
-- 091_optimize_v6_get_my_feed_distance.sql
-- v5_get_my_feed 거리순 정렬 최적화 버전
-- 
-- 개선 사항:
--   1. 거리순 정렬 시 바운딩 박스 사전 필터링 적용
--   2. p_max_distance_km 파라미터 추가 (기본 5km, 최대 20km)
--   3. 정확한 거리 필터링 (바운딩 박스 모서리 제외)
--   4. tbl_place x, y 컬럼 인덱스 활용
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
--   @p_max_distance_km: 최대 거리 제한 (기본 5km, 최대 20km)
-- 
-- 실행 방법:
--   psql "postgresql://postgres.xyqpggpilgcdsawuvpzn:ZNDqDunnaydr0aFQ@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres" -f docs/sql/091_optimize_v6_get_my_feed_distance.sql
-- =====================================================

-- 인덱스 생성 (없으면 생성)
CREATE INDEX IF NOT EXISTS idx_place_lat ON public.tbl_place ((y::double precision));
CREATE INDEX IF NOT EXISTS idx_place_lng ON public.tbl_place ((x::double precision));

DROP FUNCTION IF EXISTS public.v6_get_my_feed(INT, INT, INT, INT, TIMESTAMPTZ, VARCHAR, DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION);
CREATE OR REPLACE FUNCTION public.v6_get_my_feed(
    p_limit INT DEFAULT 20,
    p_offset INT DEFAULT 0,
    p_price_min INT DEFAULT NULL,
    p_price_max INT DEFAULT NULL,
    p_cursor_timestamp TIMESTAMPTZ DEFAULT NULL,
    p_sort_by VARCHAR DEFAULT 'recent',
    p_user_lat DOUBLE PRECISION DEFAULT NULL,
    p_user_lng DOUBLE PRECISION DEFAULT NULL,
    p_max_distance_km DOUBLE PRECISION DEFAULT 5.0
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
    v_use_fast_path BOOLEAN;
    v_use_distance_sort BOOLEAN;
    v_lat_delta DOUBLE PRECISION;
    v_lng_delta DOUBLE PRECISION;
    v_max_distance_m DOUBLE PRECISION;
BEGIN
    IF v_user_id IS NULL THEN
        RETURN;
    END IF;

    -- 최대 거리 제한 (최대 20km)
    IF p_max_distance_km IS NULL OR p_max_distance_km <= 0 THEN
        p_max_distance_km := 5.0;
    ELSIF p_max_distance_km > 20.0 THEN
        p_max_distance_km := 20.0;
    END IF;
    
    v_max_distance_m := p_max_distance_km * 1000;
    
    -- 바운딩 박스 델타 계산 (한국 평균 위도 37도 기준)
    -- 위도 1도 ≈ 111km, 경도 1도 ≈ 88km (위도 37도)
    v_lat_delta := p_max_distance_km * 0.009;   -- 1km당 0.009도
    v_lng_delta := p_max_distance_km * 0.0114;  -- 1km당 0.0114도

    -- Fast Path 조건: 가격 필터 없음 + 최신순 정렬
    v_use_fast_path := (p_price_min IS NULL AND p_price_max IS NULL AND COALESCE(p_sort_by, 'recent') = 'recent');
    
    -- 거리순 정렬 조건
    v_use_distance_sort := (COALESCE(p_sort_by, 'recent') = 'distance' AND p_user_lat IS NOT NULL AND p_user_lng IS NOT NULL);

    -- =========================================================
    -- Fast Path: 가격 필터 없음 + 최신순 → Early LIMIT 적용
    -- =========================================================
    IF v_use_fast_path THEN
        RETURN QUERY
        WITH 
        -- 1단계: 사용자의 모든 소스 (MATERIALIZED)
        all_sources AS MATERIALIZED (
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
        
        -- 2단계: 피드 아이템 수집 (MATERIALIZED)
        raw_feed_items AS MATERIALIZED (
            SELECT 'folder'::text as type, fp.folder_id::varchar as sid, fp.place_id as pid, fp.created_at as added_time, fp.comment as fi_comment
            FROM public.tbl_folder_place fp
            WHERE fp.deleted_at IS NULL 
              AND (p_cursor_timestamp IS NULL OR fp.created_at < p_cursor_timestamp)
              AND EXISTS (SELECT 1 FROM all_sources s WHERE s.s_type = 'folder' AND s.s_id = fp.folder_id)
            
            UNION ALL
            
            SELECT 'naver_folder'::text, nfp.folder_id::varchar, nfp.place_id, nf.created_at, NULL::text
            FROM public.tbl_naver_folder_place nfp
            JOIN public.tbl_naver_folder nf ON nfp.folder_id = nf.folder_id
            WHERE (p_cursor_timestamp IS NULL OR nf.created_at < p_cursor_timestamp)
              AND EXISTS (SELECT 1 FROM all_sources s WHERE s.s_type = 'naver_folder' AND s.s_id = nfp.folder_id::varchar)
            
            UNION ALL
            
            SELECT 
                CASE WHEN pf.platform_type = 'youtube' THEN 'youtube_channel' WHEN pf.platform_type = 'community' THEN 'community_region' ELSE pf.platform_type END,
                CASE WHEN pf.platform_type = 'youtube' THEN pf.metadata->>'channelId' ELSE (SELECT p_inner.group1 FROM public.tbl_place p_inner WHERE p_inner.id = pf.place_id) END,
                pf.place_id, pf.published_at, NULL::text
            FROM public.tbl_place_features pf
            WHERE pf.status = 'active' 
              AND (p_cursor_timestamp IS NULL OR pf.published_at < p_cursor_timestamp)
              AND ((pf.platform_type = 'youtube' AND EXISTS (SELECT 1 FROM all_sources s WHERE s.s_type = 'youtube_channel' AND s.s_id = pf.metadata->>'channelId'))
                   OR (pf.platform_type = 'community' AND EXISTS (SELECT 1 FROM all_sources s WHERE s.s_type = 'community_region')))
        ),
        
        -- 3단계: ★ Early LIMIT - 먼저 중복 제거하고 정렬해서 자른다
        early_limited AS MATERIALIZED (
            SELECT * FROM (
                SELECT DISTINCT ON (pid) type, sid, pid, added_time, fi_comment
                FROM raw_feed_items rfi
                WHERE EXISTS (SELECT 1 FROM public.tbl_place p WHERE p.id = rfi.pid)
                ORDER BY pid, added_time DESC
            ) sub
            ORDER BY added_time DESC
            LIMIT p_limit OFFSET p_offset
        ),
        
        -- 4단계: 20개에 대해서만 place 조인 + avg_price 계산 + 거리 계산
        target_feed AS MATERIALIZED (
            SELECT 
                s.s_type, s.s_id, s.s_title, s.s_image,
                el.type, el.sid, el.pid, el.added_time, el.fi_comment,
                p.id, p.name, p.group1, p.group2, p.group3, p.road, p.category,
                p.road_address, p.address, p.phone, p.visitor_reviews_total, p.visitor_reviews_score,
                p.x, p.y, p.images, p.static_map_url, p.keyword_list, p.visitor_review_medias_total,
                p.menus, p.place_images, p.updated_at as place_updated_at, p.created_at as place_created_at,
                p.is_franchise, p.conveniences, p.homepage,
                calculate_menu_avg_price(p.menus) as avg_price,
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
            FROM early_limited el
            JOIN all_sources s ON s.s_type = el.type AND s.s_id = el.sid
            JOIN public.tbl_place p ON el.pid = p.id
        ),
        
        -- 5단계: interaction 데이터 배치 조회
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
        
        -- 6단계: experience(방문) 데이터 배치 조회
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
        
        -- 7단계: features 배치 조회
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
        
        -- 최종 SELECT (Fast Path)
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
            tf.fi_comment::TEXT as comment,
            tf.dist_m as distance_meters
        FROM target_feed tf
        LEFT JOIN place_interactions pi ON pi.place_id = tf.pid
        LEFT JOIN place_experiences pe ON pe.place_id = tf.pid
        LEFT JOIN place_features pfeat ON pfeat.place_id = tf.pid
        ORDER BY tf.added_time DESC;

    -- =========================================================
    -- Distance Path: 거리순 정렬 → 바운딩 박스 사전 필터링
    -- =========================================================
    ELSIF v_use_distance_sort THEN
        RETURN QUERY
        WITH 
        all_sources AS MATERIALIZED (
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
        
        -- ★ 바운딩 박스 필터링 적용된 피드 아이템
        raw_feed_items AS MATERIALIZED (
            SELECT 'folder'::text as type, fp.folder_id::varchar as sid, fp.place_id as pid, fp.created_at as added_time, fp.comment as fi_comment
            FROM public.tbl_folder_place fp
            JOIN public.tbl_place p ON fp.place_id = p.id
            WHERE fp.deleted_at IS NULL 
              AND (p_cursor_timestamp IS NULL OR fp.created_at < p_cursor_timestamp)
              AND EXISTS (SELECT 1 FROM all_sources s WHERE s.s_type = 'folder' AND s.s_id = fp.folder_id)
              -- ★ 바운딩 박스 필터링
              AND p.x ~ '^[0-9.]+$' AND p.y ~ '^[0-9.]+$'
              AND p.y::double precision BETWEEN p_user_lat - v_lat_delta AND p_user_lat + v_lat_delta
              AND p.x::double precision BETWEEN p_user_lng - v_lng_delta AND p_user_lng + v_lng_delta
            
            UNION ALL
            
            SELECT 'naver_folder'::text, nfp.folder_id::varchar, nfp.place_id, nf.created_at, NULL::text
            FROM public.tbl_naver_folder_place nfp
            JOIN public.tbl_naver_folder nf ON nfp.folder_id = nf.folder_id
            JOIN public.tbl_place p ON nfp.place_id = p.id
            WHERE (p_cursor_timestamp IS NULL OR nf.created_at < p_cursor_timestamp)
              AND EXISTS (SELECT 1 FROM all_sources s WHERE s.s_type = 'naver_folder' AND s.s_id = nfp.folder_id::varchar)
              -- ★ 바운딩 박스 필터링
              AND p.x ~ '^[0-9.]+$' AND p.y ~ '^[0-9.]+$'
              AND p.y::double precision BETWEEN p_user_lat - v_lat_delta AND p_user_lat + v_lat_delta
              AND p.x::double precision BETWEEN p_user_lng - v_lng_delta AND p_user_lng + v_lng_delta
            
            UNION ALL
            
            SELECT 
                CASE WHEN pf.platform_type = 'youtube' THEN 'youtube_channel' WHEN pf.platform_type = 'community' THEN 'community_region' ELSE pf.platform_type END,
                CASE WHEN pf.platform_type = 'youtube' THEN pf.metadata->>'channelId' ELSE (SELECT p_inner.group1 FROM public.tbl_place p_inner WHERE p_inner.id = pf.place_id) END,
                pf.place_id, pf.published_at, NULL::text
            FROM public.tbl_place_features pf
            JOIN public.tbl_place p ON pf.place_id = p.id
            WHERE pf.status = 'active' 
              AND (p_cursor_timestamp IS NULL OR pf.published_at < p_cursor_timestamp)
              AND ((pf.platform_type = 'youtube' AND EXISTS (SELECT 1 FROM all_sources s WHERE s.s_type = 'youtube_channel' AND s.s_id = pf.metadata->>'channelId'))
                   OR (pf.platform_type = 'community' AND EXISTS (SELECT 1 FROM all_sources s WHERE s.s_type = 'community_region')))
              -- ★ 바운딩 박스 필터링
              AND p.x ~ '^[0-9.]+$' AND p.y ~ '^[0-9.]+$'
              AND p.y::double precision BETWEEN p_user_lat - v_lat_delta AND p_user_lat + v_lat_delta
              AND p.x::double precision BETWEEN p_user_lng - v_lng_delta AND p_user_lng + v_lng_delta
        ),
        
        -- 장소 데이터 조인 + 거리 계산
        feed_with_place AS MATERIALIZED (
            SELECT 
                fi.type, fi.sid, fi.pid, fi.added_time, fi.fi_comment,
                p.id, p.name, p.group1, p.group2, p.group3, p.road, p.category,
                p.road_address, p.address, p.phone, p.visitor_reviews_total, p.visitor_reviews_score,
                p.x, p.y, p.images, p.static_map_url, p.keyword_list, p.visitor_review_medias_total,
                p.menus, p.place_images, p.updated_at as place_updated_at, p.created_at as place_created_at,
                p.is_franchise, p.conveniences, p.homepage,
                calculate_menu_avg_price(p.menus) as avg_price,
                (6371 * acos(LEAST(1.0, GREATEST(-1.0, 
                    cos(radians(p_user_lat)) * cos(radians(p.y::double precision)) * 
                    cos(radians(p.x::double precision) - radians(p_user_lng)) + 
                    sin(radians(p_user_lat)) * sin(radians(p.y::double precision))
                )))) * 1000 as dist_m
            FROM raw_feed_items fi
            JOIN public.tbl_place p ON fi.pid = p.id
        ),
        
        -- 가격 필터 적용 + ★ 정확한 거리 필터링 (바운딩 박스 모서리 제외)
        filtered_feed AS MATERIALIZED (
            SELECT *
            FROM feed_with_place
            WHERE (p_price_min IS NULL OR avg_price >= p_price_min)
              AND (p_price_max IS NULL OR avg_price <= p_price_max)
              AND dist_m <= v_max_distance_m
        ),
        
        -- 중복 제거 (거리순)
        deduplicated_feed AS (
            SELECT DISTINCT ON (pid) *
            FROM filtered_feed
            ORDER BY pid, dist_m ASC NULLS LAST
        ),
        
        target_feed AS MATERIALIZED (
            SELECT 
                s.s_type, s.s_id, s.s_title, s.s_image,
                df.*
            FROM deduplicated_feed df
            JOIN all_sources s ON s.s_type = df.type AND s.s_id = df.sid
            ORDER BY df.dist_m ASC NULLS LAST
            LIMIT p_limit OFFSET p_offset
        ),
        
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
        
        -- 최종 SELECT (Distance Path)
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
            tf.fi_comment::TEXT as comment,
            tf.dist_m as distance_meters
        FROM target_feed tf
        LEFT JOIN place_interactions pi ON pi.place_id = tf.pid
        LEFT JOIN place_experiences pe ON pe.place_id = tf.pid
        LEFT JOIN place_features pfeat ON pfeat.place_id = tf.pid
        ORDER BY tf.dist_m ASC NULLS LAST;

    -- =========================================================
    -- Slow Path: 가격 필터 있음 + 최신순 → 전체 스캔 후 필터링
    -- =========================================================
    ELSE
        RETURN QUERY
        WITH 
        all_sources AS MATERIALIZED (
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
        
        raw_feed_items AS MATERIALIZED (
            SELECT 'folder'::text as type, fp.folder_id::varchar as sid, fp.place_id as pid, fp.created_at as added_time, fp.comment as fi_comment
            FROM public.tbl_folder_place fp
            WHERE fp.deleted_at IS NULL 
              AND (p_cursor_timestamp IS NULL OR fp.created_at < p_cursor_timestamp)
              AND EXISTS (SELECT 1 FROM all_sources s WHERE s.s_type = 'folder' AND s.s_id = fp.folder_id)
            
            UNION ALL
            
            SELECT 'naver_folder'::text, nfp.folder_id::varchar, nfp.place_id, nf.created_at, NULL::text
            FROM public.tbl_naver_folder_place nfp
            JOIN public.tbl_naver_folder nf ON nfp.folder_id = nf.folder_id
            WHERE (p_cursor_timestamp IS NULL OR nf.created_at < p_cursor_timestamp)
              AND EXISTS (SELECT 1 FROM all_sources s WHERE s.s_type = 'naver_folder' AND s.s_id = nfp.folder_id::varchar)
            
            UNION ALL
            
            SELECT 
                CASE WHEN pf.platform_type = 'youtube' THEN 'youtube_channel' WHEN pf.platform_type = 'community' THEN 'community_region' ELSE pf.platform_type END,
                CASE WHEN pf.platform_type = 'youtube' THEN pf.metadata->>'channelId' ELSE (SELECT p_inner.group1 FROM public.tbl_place p_inner WHERE p_inner.id = pf.place_id) END,
                pf.place_id, pf.published_at, NULL::text
            FROM public.tbl_place_features pf
            WHERE pf.status = 'active' 
              AND (p_cursor_timestamp IS NULL OR pf.published_at < p_cursor_timestamp)
              AND ((pf.platform_type = 'youtube' AND EXISTS (SELECT 1 FROM all_sources s WHERE s.s_type = 'youtube_channel' AND s.s_id = pf.metadata->>'channelId'))
                   OR (pf.platform_type = 'community' AND EXISTS (SELECT 1 FROM all_sources s WHERE s.s_type = 'community_region')))
        ),
        
        -- 장소 데이터 조인 + avg_price 1회 계산
        feed_with_place AS MATERIALIZED (
            SELECT 
                fi.type, fi.sid, fi.pid, fi.added_time, fi.fi_comment,
                p.id, p.name, p.group1, p.group2, p.group3, p.road, p.category,
                p.road_address, p.address, p.phone, p.visitor_reviews_total, p.visitor_reviews_score,
                p.x, p.y, p.images, p.static_map_url, p.keyword_list, p.visitor_review_medias_total,
                p.menus, p.place_images, p.updated_at as place_updated_at, p.created_at as place_created_at,
                p.is_franchise, p.conveniences, p.homepage,
                calculate_menu_avg_price(p.menus) as avg_price,
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
        
        -- 가격 필터 적용 (avg_price 재사용)
        filtered_feed AS MATERIALIZED (
            SELECT *
            FROM feed_with_place
            WHERE (p_price_min IS NULL OR avg_price >= p_price_min)
              AND (p_price_max IS NULL OR avg_price <= p_price_max)
        ),
        
        -- 중복 제거 (최신순)
        deduplicated_feed AS (
            SELECT DISTINCT ON (pid) *
            FROM filtered_feed
            ORDER BY pid, added_time DESC
        ),
        
        target_feed AS MATERIALIZED (
            SELECT 
                s.s_type, s.s_id, s.s_title, s.s_image,
                df.*
            FROM deduplicated_feed df
            JOIN all_sources s ON s.s_type = df.type AND s.s_id = df.sid
            ORDER BY df.added_time DESC
            LIMIT p_limit OFFSET p_offset
        ),
        
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
        
        -- 최종 SELECT (Slow Path)
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
            tf.fi_comment::TEXT as comment,
            tf.dist_m as distance_meters
        FROM target_feed tf
        LEFT JOIN place_interactions pi ON pi.place_id = tf.pid
        LEFT JOIN place_experiences pe ON pe.place_id = tf.pid
        LEFT JOIN place_features pfeat ON pfeat.place_id = tf.pid
        ORDER BY tf.added_time DESC;
    END IF;
END;
$$;

COMMENT ON FUNCTION public.v6_get_my_feed IS '내 피드 조회 v6 - 거리순 정렬 최적화 (바운딩 박스 필터링, 최대 거리 제한)';
GRANT EXECUTE ON FUNCTION public.v6_get_my_feed TO authenticated;
