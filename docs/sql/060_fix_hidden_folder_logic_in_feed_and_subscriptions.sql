-- =====================================================
-- 060_fix_hidden_folder_logic_in_feed_and_subscriptions.sql
-- 숨김 처리된 폴더가 구독 목록 및 피드에서 제외되도록 로직 수정
-- 
-- 실행 방법:
--   psql "postgresql://postgres.xyqpggpilgcdsawuvpzn:ZNDqDunnaydr0aFQ@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres" -f docs/sql/060_fix_hidden_folder_logic_in_feed_and_subscriptions.sql
-- =====================================================

-- 1. v1_list_my_subscriptions 수정 (숨김 폴더 제외 로직 추가)
DROP FUNCTION IF EXISTS public.v1_list_my_subscriptions();
CREATE OR REPLACE FUNCTION public.v1_list_my_subscriptions()
RETURNS TABLE (
    subscription_type VARCHAR, -- 'folder', 'naver_folder', 'youtube_channel', 'community_region'
    feature_id VARCHAR,
    title VARCHAR,
    description VARCHAR,
    thumbnail TEXT,
    created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
#variable_conflict use_column
BEGIN
    RETURN QUERY
    -- 사용자 폴더 구독 (f.is_hidden = FALSE 조건 추가)
    SELECT 
        'folder'::VARCHAR as subscription_type,
        f.id::VARCHAR as feature_id,
        f.title,
        f.description,
        p.profile_image_url as thumbnail,
        fs.created_at::TIMESTAMPTZ
    FROM public.tbl_folder_subscribed fs
    JOIN public.tbl_folder f ON fs.folder_id = f.id
    LEFT JOIN public.tbl_user_profile p ON f.owner_id = p.auth_user_id
    WHERE fs.user_id = auth.uid() 
      AND fs.deleted_at IS NULL
      AND f.is_hidden = FALSE -- 숨김 처리된 폴더 제외
    
    UNION ALL
    
    -- 시스템 피쳐 구독 (네이버 폴더, 유튜브 채널, 커뮤니티 지역 등)
    SELECT 
        fts.feature_type as subscription_type,
        fts.feature_id,
        CASE 
            WHEN fts.feature_type = 'naver_folder' THEN (SELECT name::text FROM public.tbl_naver_folder WHERE folder_id::varchar = fts.feature_id)
            WHEN fts.feature_type = 'youtube_channel' THEN (SELECT metadata->>'channelTitle' FROM public.tbl_place_features WHERE metadata->>'channelId' = fts.feature_id LIMIT 1)
            WHEN fts.feature_type = 'community_region' THEN fts.feature_id -- 지역명 자체가 제목
            WHEN fts.feature_type = 'region_recommend' THEN fts.feature_id -- 지역명 자체가 제목
            ELSE 'Unknown'
        END as title,
        NULL::VARCHAR as description,
        CASE 
            WHEN fts.feature_type = 'youtube_channel' THEN (SELECT metadata->'thumbnails'->'medium'->>'url' FROM public.tbl_place_features WHERE metadata->>'channelId' = fts.feature_id LIMIT 1)
            ELSE NULL
        END as thumbnail,
        fts.created_at::TIMESTAMPTZ
    FROM public.tbl_feature_subscription fts
    WHERE fts.user_id = auth.uid() AND fts.deleted_at IS NULL
    
    ORDER BY created_at DESC;
END;
$$;

-- 2. v1_get_my_feed 수정 (숨김 폴더 제외 로직 추가)
DROP FUNCTION IF EXISTS public.v1_get_my_feed(INT, INT, INT, INT);
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
        -- 구독 중인 사용자 폴더 (f.is_hidden = FALSE 조건 추가)
        SELECT 'folder'::VARCHAR as s_type, fs.folder_id::VARCHAR as s_id 
        FROM public.tbl_folder_subscribed fs
        JOIN public.tbl_folder f ON fs.folder_id = f.id
        WHERE fs.user_id = auth.uid() AND fs.deleted_at IS NULL AND f.is_hidden = FALSE
        
        UNION 
        -- 내가 소유한 폴더 (숨겨지지 않은 것)
        SELECT 'folder'::VARCHAR as s_type, id::VARCHAR as s_id 
        FROM public.tbl_folder 
        WHERE owner_id = auth.uid() AND is_hidden = FALSE
        
        UNION 
        -- 내가 기여한 폴더 (f.is_hidden = FALSE 조건 추가)
        SELECT 'folder'::VARCHAR as s_type, fp.folder_id::VARCHAR as s_id 
        FROM public.tbl_folder_place fp
        JOIN public.tbl_folder f ON fp.folder_id = f.id
        WHERE fp.user_id = auth.uid() AND fp.deleted_at IS NULL AND f.is_hidden = FALSE
        
        UNION 
        -- 구독 중인 시스템 피쳐
        SELECT feature_type as s_type, feature_id as s_id 
        FROM public.tbl_feature_subscription 
        WHERE user_id = auth.uid() AND deleted_at IS NULL
    )
    SELECT 
        s.s_type::VARCHAR as source_type, s.s_id::VARCHAR as source_id,
        (CASE 
            WHEN s.s_type = 'folder' THEN (SELECT f_inner.title FROM public.tbl_folder f_inner WHERE f_inner.id = s.s_id)
            WHEN s.s_type = 'naver_folder' THEN (SELECT nf_inner.name::text FROM public.tbl_naver_folder nf_inner WHERE nf_inner.folder_id::varchar = s.s_id)
            WHEN s.s_type = 'youtube_channel' THEN (SELECT pf_inner.metadata->>'channelTitle' FROM public.tbl_place_features pf_inner WHERE pf_inner.metadata->>'channelId' = s.s_id LIMIT 1)
            WHEN s.s_type = 'community_region' THEN s.s_id
            WHEN s.s_type = 'region_recommend' THEN s.s_id
            ELSE 'Unknown' 
        END)::VARCHAR as source_title,
        (CASE 
            WHEN s.s_type = 'folder' THEN (
                SELECT up_inner.profile_image_url 
                FROM public.tbl_folder f_inner 
                JOIN public.tbl_user_profile up_inner ON f_inner.owner_id::uuid = up_inner.auth_user_id 
                WHERE f_inner.id = s.s_id
            )
            WHEN s.s_type = 'youtube_channel' THEN (
                SELECT pf_inner.metadata->'thumbnails'->'default'->>'url' 
                FROM public.tbl_place_features pf_inner 
                WHERE pf_inner.metadata->>'channelId' = s.s_id 
                LIMIT 1
            )
            ELSE NULL 
        END)::VARCHAR as source_image,
        p.id::VARCHAR as place_id,
        (to_jsonb(p) - '{themes, street_panorama, category_code_list, visitor_review_stats, algo_avg_len, algo_stdev_len, algo_revisit_rate, algo_media_ratio, algo_avg_views, algo_recency_score, algo_engagement_score, algo_length_variation_index, algo_loyalty_index, algo_growth_rate_1m, algo_growth_rate_2m, algo_growth_rate_3m}'::text[] || jsonb_build_object(
            'image_urls', p.images, 
            'avg_price', calculate_menu_avg_price(p.menus),
            'interaction', public.v1_common_place_interaction(p.id),
            'features', public.v1_common_place_features(p.id),
            'experience', public.v1_get_place_experience(p.id)
        )) as place_data,
        feed_data.added_time::TIMESTAMPTZ as added_at,
        feed_data.comment::TEXT as comment
    FROM (
        -- 각 소스별 장소 데이터 결합
        SELECT 'folder' as type, fp.folder_id::varchar as sid, fp.place_id as pid, fp.created_at::TIMESTAMPTZ as added_time, fp.comment FROM public.tbl_folder_place fp WHERE fp.deleted_at IS NULL
        UNION ALL
        SELECT 'naver_folder' as type, nfp.folder_id::varchar as sid, nfp.place_id as pid, nf.created_at::TIMESTAMPTZ as added_time, NULL::text as comment FROM public.tbl_naver_folder_place nfp JOIN public.tbl_naver_folder nf ON nfp.folder_id = nf.folder_id
        UNION ALL
        SELECT CASE 
                 WHEN pf.platform_type = 'youtube' THEN 'youtube_channel'::text
                 WHEN pf.platform_type = 'community' THEN 'community_region'::text
                 ELSE pf.platform_type::text
               END as type, 
               CASE WHEN pf.platform_type = 'youtube' THEN pf.metadata->>'channelId' ELSE (SELECT p_inner.group1 FROM public.tbl_place p_inner WHERE p_inner.id = pf.place_id) END as sid,
               pf.place_id as pid, 
               pf.published_at::TIMESTAMPTZ as added_time,
               NULL::text as comment
        FROM public.tbl_place_features pf
        WHERE pf.status = 'active'
    ) feed_data
    JOIN all_sources s ON s.s_type = feed_data.type AND s.s_id = feed_data.sid
    JOIN public.tbl_place p ON feed_data.pid = p.id
    WHERE (p_price_min IS NULL OR calculate_menu_avg_price(p.menus) >= p_price_min)
      AND (p_price_max IS NULL OR calculate_menu_avg_price(p.menus) <= p_price_max)
    ORDER BY feed_data.added_time DESC 
    LIMIT p_limit OFFSET p_offset;
END;
$$;

COMMENT ON FUNCTION public.v1_list_my_subscriptions() IS '내 구독 목록 조회 (숨김 처리된 폴더 제외)';
COMMENT ON FUNCTION public.v1_get_my_feed(INT, INT, INT, INT) IS '내 피드 조회 (숨김 처리된 폴더 데이터 제외)';
