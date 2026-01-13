-- =====================================================
-- 042_update_v1_get_my_feed_add_source_image.sql
-- 피드 조회 시 소스의 프로필 이미지를 포함하도록 개선
-- 
-- 실행 방법:
--   psql "postgresql://postgres.xyqpggpilgcdsawuvpzn:ZNDqDunnaydr0aFQ@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres" -f docs/sql/042_update_v1_get_my_feed_add_source_image.sql
-- =====================================================

DROP FUNCTION IF EXISTS public.v1_get_my_feed(integer, integer, integer, integer);
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
    added_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
#variable_conflict use_column
BEGIN
    RETURN QUERY
    WITH all_sources AS (
        -- 구독 중인 사용자 폴더
        SELECT 'folder'::VARCHAR as s_type, folder_id::VARCHAR as s_id
        FROM public.tbl_folder_subscribed
        WHERE user_id = auth.uid() AND deleted_at IS NULL
        
        UNION
        
        -- 내가 소유한 폴더
        SELECT 'folder'::VARCHAR as s_type, id::VARCHAR as s_id
        FROM public.tbl_folder
        WHERE owner_id = auth.uid() AND is_hidden = FALSE
        
        UNION
        
        -- 내가 장소를 추가하여 참여한 폴더
        SELECT 'folder'::VARCHAR as s_type, folder_id::VARCHAR as s_id
        FROM public.tbl_folder_place
        WHERE user_id = auth.uid() AND deleted_at IS NULL
        
        UNION
        
        -- 구독 중인 시스템 피쳐
        SELECT feature_type as s_type, feature_id as s_id
        FROM public.tbl_feature_subscription
        WHERE user_id = auth.uid() AND deleted_at IS NULL
    )
    SELECT 
        s.s_type::VARCHAR as source_type,
        s.s_id::VARCHAR as source_id,
        (CASE 
            WHEN s.s_type = 'folder' THEN (SELECT f_inner.title FROM public.tbl_folder f_inner WHERE f_inner.id = s.s_id)
            WHEN s.s_type = 'naver_folder' THEN (SELECT nf_inner.name::text FROM public.tbl_naver_folder nf_inner WHERE nf_inner.folder_id::varchar = s.s_id)
            WHEN s.s_type = 'youtube_channel' THEN (SELECT pf_inner.metadata->>'channelTitle' FROM public.tbl_place_features pf_inner WHERE pf_inner.metadata->>'channelId' = s.s_id LIMIT 1)
            WHEN s.s_type = 'community_region' THEN COALESCE(feed_data.meta, 'unknown') || '|' || s.s_id
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
        (to_jsonb(p) - '{themes, street_panorama, category_code_list, visitor_review_stats, algo_avg_len, algo_stdev_len, algo_revisit_rate, algo_media_ratio, algo_avg_views, algo_recency_score, algo_engagement_score, algo_length_variation_index, algo_loyalty_index, algo_growth_rate_1m, algo_growth_rate_2m, algo_growth_rate_3m}'::text[] || jsonb_build_object('image_urls', p.images, 'avg_price', calculate_menu_avg_price(p.menus))) as place_data,
        feed_data.added_time::TIMESTAMPTZ as added_at
    FROM (
        -- 각 소스별 장소 데이터 결합
        SELECT 'folder' as type, fp.folder_id as sid, fp.place_id as pid, fp.created_at::TIMESTAMPTZ as added_time, NULL::text as meta FROM public.tbl_folder_place fp WHERE fp.deleted_at IS NULL
        UNION ALL
        SELECT 'naver_folder' as type, nfp.folder_id::varchar as sid, nfp.place_id as pid, nf.created_at::TIMESTAMPTZ as added_time, NULL::text as meta FROM public.tbl_naver_folder_place nfp JOIN public.tbl_naver_folder nf ON nfp.folder_id = nf.folder_id
        UNION ALL
        -- youtube/community는 tbl_place_features에서 가져옴
        SELECT CASE 
                 WHEN pf.platform_type = 'youtube' THEN 'youtube_channel'::text
                 WHEN pf.platform_type = 'community' THEN 'community_region'::text
                 ELSE pf.platform_type::text
               END as type, 
               CASE WHEN pf.platform_type = 'youtube' THEN pf.metadata->>'channelId' ELSE (SELECT p_inner.group1 FROM public.tbl_place p_inner WHERE p_inner.id = pf.place_id) END as sid,
               pf.place_id as pid, 
               pf.published_at::TIMESTAMPTZ as added_time,
               pf.metadata->>'domain' as meta
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
