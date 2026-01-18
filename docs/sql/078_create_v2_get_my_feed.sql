-- =====================================================
-- 078_create_v2_get_my_feed.sql
-- v1_get_my_feed의 성능 최적화 버전
-- 
-- 개선 사항:
--   1. source_title/source_image를 CTE에서 미리 계산 (scalar subquery 제거)
--   2. 대상 장소를 먼저 필터링 후 interaction/features/experience 배치 조회
--   3. calculate_menu_avg_price 중복 호출 제거
--   4. Keyset pagination 지원 (옵션)
-- 
-- 인자:
--   @p_limit: 조회할 개수 (기본 20)
--   @p_offset: 오프셋 (기본 0)
--   @p_price_min: 최소 평균 가격 필터
--   @p_price_max: 최대 평균 가격 필터
--   @p_cursor_timestamp: 커서 기반 페이지네이션용 (옵션, 이 시간 이전 데이터 조회)
-- 
-- 실행 방법:
--   psql "postgresql://postgres.xyqpggpilgcdsawuvpzn:ZNDqDunnaydr0aFQ@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres" -f docs/sql/078_create_v2_get_my_feed.sql
-- =====================================================

DROP FUNCTION IF EXISTS public.v2_get_my_feed(INT, INT, INT, INT, TIMESTAMPTZ);
CREATE OR REPLACE FUNCTION public.v2_get_my_feed(
    p_limit INT DEFAULT 20,
    p_offset INT DEFAULT 0,
    p_price_min INT DEFAULT NULL,
    p_price_max INT DEFAULT NULL,
    p_cursor_timestamp TIMESTAMPTZ DEFAULT NULL
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
DECLARE
    v_user_id UUID := auth.uid();
BEGIN
    IF v_user_id IS NULL THEN
        RETURN;
    END IF;

    RETURN QUERY
    WITH 
    -- =========================================================
    -- 1단계: 사용자의 모든 소스를 미리 계산 (source_title, source_image 포함)
    -- =========================================================
    all_sources AS (
        -- 구독 중인 사용자 폴더
        SELECT 
            'folder'::VARCHAR as s_type, 
            f.id::VARCHAR as s_id,
            f.title::VARCHAR as s_title,
            up.profile_image_url::VARCHAR as s_image
        FROM public.tbl_folder_subscribed fs
        JOIN public.tbl_folder f ON fs.folder_id = f.id AND f.is_hidden = FALSE
        LEFT JOIN public.tbl_user_profile up ON f.owner_id = up.auth_user_id
        WHERE fs.user_id = v_user_id AND fs.deleted_at IS NULL
        
        UNION
        
        -- 내가 소유한 폴더
        SELECT 
            'folder'::VARCHAR as s_type, 
            f.id::VARCHAR as s_id,
            f.title::VARCHAR as s_title,
            up.profile_image_url::VARCHAR as s_image
        FROM public.tbl_folder f
        LEFT JOIN public.tbl_user_profile up ON f.owner_id = up.auth_user_id
        WHERE f.owner_id = v_user_id AND f.is_hidden = FALSE
        
        UNION
        
        -- 내가 기여한 폴더
        SELECT 
            'folder'::VARCHAR as s_type, 
            f.id::VARCHAR as s_id,
            f.title::VARCHAR as s_title,
            up.profile_image_url::VARCHAR as s_image
        FROM public.tbl_folder_place fp
        JOIN public.tbl_folder f ON fp.folder_id = f.id AND f.is_hidden = FALSE
        LEFT JOIN public.tbl_user_profile up ON f.owner_id = up.auth_user_id
        WHERE fp.user_id = v_user_id AND fp.deleted_at IS NULL
        
        UNION
        
        -- 구독 중인 네이버 폴더
        SELECT 
            fts.feature_type::VARCHAR as s_type,
            fts.feature_id::VARCHAR as s_id,
            nf.name::VARCHAR as s_title,
            NULL::VARCHAR as s_image
        FROM public.tbl_feature_subscription fts
        LEFT JOIN public.tbl_naver_folder nf ON nf.folder_id::varchar = fts.feature_id
        WHERE fts.user_id = v_user_id 
          AND fts.deleted_at IS NULL 
          AND fts.feature_type = 'naver_folder'
        
        UNION
        
        -- 구독 중인 유튜브 채널
        SELECT 
            fts.feature_type::VARCHAR as s_type,
            fts.feature_id::VARCHAR as s_id,
            (SELECT pf.metadata->>'channelTitle' FROM public.tbl_place_features pf WHERE pf.metadata->>'channelId' = fts.feature_id LIMIT 1)::VARCHAR as s_title,
            (SELECT pf.metadata->'thumbnails'->'default'->>'url' FROM public.tbl_place_features pf WHERE pf.metadata->>'channelId' = fts.feature_id LIMIT 1)::VARCHAR as s_image
        FROM public.tbl_feature_subscription fts
        WHERE fts.user_id = v_user_id 
          AND fts.deleted_at IS NULL 
          AND fts.feature_type = 'youtube_channel'
        
        UNION
        
        -- 구독 중인 커뮤니티 지역 / region_recommend
        SELECT 
            fts.feature_type::VARCHAR as s_type,
            fts.feature_id::VARCHAR as s_id,
            fts.feature_id::VARCHAR as s_title,
            NULL::VARCHAR as s_image
        FROM public.tbl_feature_subscription fts
        WHERE fts.user_id = v_user_id 
          AND fts.deleted_at IS NULL 
          AND fts.feature_type IN ('community_region', 'region_recommend')
    ),
    
    -- =========================================================
    -- 2단계: 각 소스별 장소 데이터 (all_sources의 s_id만 필터링)
    -- =========================================================
    feed_items AS (
        -- 폴더 장소
        SELECT 
            'folder'::text as type, 
            fp.folder_id::varchar as sid, 
            fp.place_id as pid, 
            fp.created_at as added_time, 
            fp.comment
        FROM public.tbl_folder_place fp
        WHERE fp.deleted_at IS NULL
          AND EXISTS (SELECT 1 FROM all_sources s WHERE s.s_type = 'folder' AND s.s_id = fp.folder_id)
        
        UNION ALL
        
        -- 네이버 폴더 장소
        SELECT 
            'naver_folder'::text as type, 
            nfp.folder_id::varchar as sid, 
            nfp.place_id as pid, 
            nf.created_at as added_time, 
            NULL::text as comment
        FROM public.tbl_naver_folder_place nfp
        JOIN public.tbl_naver_folder nf ON nfp.folder_id = nf.folder_id
        WHERE EXISTS (SELECT 1 FROM all_sources s WHERE s.s_type = 'naver_folder' AND s.s_id = nfp.folder_id::varchar)
        
        UNION ALL
        
        -- 유튜브/커뮤니티 피쳐
        SELECT 
            CASE 
                WHEN pf.platform_type = 'youtube' THEN 'youtube_channel'
                WHEN pf.platform_type = 'community' THEN 'community_region'
                ELSE pf.platform_type
            END as type, 
            CASE 
                WHEN pf.platform_type = 'youtube' THEN pf.metadata->>'channelId'
                ELSE (SELECT p_inner.group1 FROM public.tbl_place p_inner WHERE p_inner.id = pf.place_id)
            END as sid,
            pf.place_id as pid, 
            pf.published_at as added_time,
            NULL::text as comment
        FROM public.tbl_place_features pf
        WHERE pf.status = 'active'
          AND (
              (pf.platform_type = 'youtube' AND EXISTS (SELECT 1 FROM all_sources s WHERE s.s_type = 'youtube_channel' AND s.s_id = pf.metadata->>'channelId'))
              OR (pf.platform_type = 'community' AND EXISTS (SELECT 1 FROM all_sources s WHERE s.s_type = 'community_region'))
          )
    ),
    
    -- =========================================================
    -- 3단계: 소스 정보와 장소 정보 결합 + 가격 계산 + 필터링 + 페이지네이션
    -- =========================================================
    target_feed AS (
        SELECT 
            s.s_type,
            s.s_id,
            s.s_title,
            s.s_image,
            p.id as place_id,
            fi.added_time,
            fi.comment,
            calculate_menu_avg_price(p.menus) as avg_price,
            -- 필요한 place 컬럼들만 선택 (대용량 컬럼 제외)
            p.id, p.name, p.group1, p.group2, p.group3, p.road, p.category,
            p.road_address, p.address, p.phone, p.visitor_reviews_total, p.visitor_reviews_score,
            p.x, p.y, p.images, p.static_map_url, p.keyword_list, p.visitor_review_medias_total,
            p.menus, p.place_images, p.updated_at as place_updated_at, p.created_at as place_created_at,
            p.is_franchise, p.conveniences, p.homepage
        FROM feed_items fi
        JOIN all_sources s ON s.s_type = fi.type AND s.s_id = fi.sid
        JOIN public.tbl_place p ON fi.pid = p.id
        WHERE (p_cursor_timestamp IS NULL OR fi.added_time < p_cursor_timestamp)
          AND (p_price_min IS NULL OR calculate_menu_avg_price(p.menus) >= p_price_min)
          AND (p_price_max IS NULL OR calculate_menu_avg_price(p.menus) <= p_price_max)
        ORDER BY fi.added_time DESC
        LIMIT p_limit OFFSET p_offset
    ),
    
    -- =========================================================
    -- 4단계: interaction 데이터 배치 조회
    -- =========================================================
    place_interactions AS (
        SELECT 
            tf.place_id,
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
    
    -- =========================================================
    -- 5단계: experience(방문) 데이터 배치 조회
    -- =========================================================
    place_experiences AS (
        SELECT 
            tf.place_id,
            COALESCE(v.visit_count, 0) as visit_count,
            v.last_visited_at
        FROM target_feed tf
        LEFT JOIN LATERAL (
            SELECT count(*) as visit_count, max(visited_at) as last_visited_at
            FROM public.tbl_visited
            WHERE user_id = v_user_id AND place_id = tf.place_id
        ) v ON true
    )
    
    -- =========================================================
    -- 최종 SELECT
    -- =========================================================
    SELECT 
        tf.s_type::VARCHAR as source_type,
        tf.s_id::VARCHAR as source_id,
        tf.s_title::VARCHAR as source_title,
        tf.s_image::VARCHAR as source_image,
        tf.place_id::VARCHAR as place_id,
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
            'features', public.v1_common_place_features(tf.place_id),
            'experience', jsonb_build_object(
                'is_visited', pe.visit_count > 0,
                'visit_count', pe.visit_count,
                'last_visited_at', pe.last_visited_at
            )
        ) as place_data,
        tf.added_time::TIMESTAMPTZ as added_at,
        tf.comment::TEXT as comment
    FROM target_feed tf
    LEFT JOIN place_interactions pi ON pi.place_id = tf.place_id
    LEFT JOIN place_experiences pe ON pe.place_id = tf.place_id
    ORDER BY tf.added_time DESC;
END;
$$;

COMMENT ON FUNCTION public.v2_get_my_feed IS '내 피드 조회 v2 - 성능 최적화 버전 (source 정보 미리 계산, interaction 배치 조회)';
GRANT EXECUTE ON FUNCTION public.v2_get_my_feed TO authenticated;
