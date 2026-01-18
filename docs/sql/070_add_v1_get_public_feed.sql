-- =====================================================
-- 070_add_v1_get_public_feed.sql
-- 로그인하지 않은 사용자를 위한 공개 피드 조회 RPC 함수 정의
-- 
-- 실행 방법:
--   psql "postgresql://postgres.xyqpggpilgcdsawuvpzn:ZNDqDunnaydr0aFQ@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres" -f docs/sql/070_add_v1_get_public_feed.sql
-- =====================================================

CREATE OR REPLACE FUNCTION public.v1_get_public_feed(
    p_source_type VARCHAR DEFAULT NULL, -- 'folder', 'naver_folder', 'youtube_channel', 'community_region'
    p_limit INT DEFAULT 10,
    p_offset INT DEFAULT 0
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
SET search_path = public, auth, public
AS $$
#variable_conflict use_column
BEGIN
    RETURN QUERY
    WITH latest_data AS (
        -- 맛탐정 폴더 (공개된 폴더들)
        SELECT 
            'folder'::VARCHAR as type, 
            fp.folder_id::VARCHAR as sid,
            fp.place_id as pid,
            fp.created_at::TIMESTAMPTZ as added_time,
            NULL::text as meta
        FROM public.tbl_folder_place fp
        JOIN public.tbl_folder f ON fp.folder_id = f.id
        WHERE f.permission = 'public' AND f.is_hidden = FALSE AND fp.deleted_at IS NULL
        
        UNION ALL
        
        -- 플레이스 폴더
        SELECT 
            'naver_folder'::VARCHAR as type, 
            nfp.folder_id::VARCHAR as sid,
            nfp.place_id as pid,
            nf.created_at::TIMESTAMPTZ as added_time,
            NULL::text as meta
        FROM public.tbl_naver_folder_place nfp
        JOIN public.tbl_naver_folder nf ON nfp.folder_id = nf.folder_id
        
        UNION ALL
        
        -- 유튜브 / 커뮤니티
        SELECT 
            CASE 
                WHEN pf.platform_type = 'youtube' THEN 'youtube_channel'::VARCHAR
                WHEN pf.platform_type = 'community' THEN 'community_region'::VARCHAR
                ELSE pf.platform_type::VARCHAR
            END as type, 
            CASE 
                WHEN pf.platform_type = 'youtube' THEN pf.metadata->>'channelId' 
                ELSE (SELECT p_inner.group1 FROM public.tbl_place p_inner WHERE p_inner.id = pf.place_id) 
            END::VARCHAR as sid,
            pf.place_id as pid, 
            pf.published_at::TIMESTAMPTZ as added_time,
            pf.metadata->>'domain' as meta
        FROM public.tbl_place_features pf
        WHERE pf.status = 'active'
    )
    SELECT 
        d.type::VARCHAR as source_type,
        d.sid::VARCHAR as source_id,
        (CASE 
            WHEN d.type = 'folder' THEN (SELECT f_inner.title FROM public.tbl_folder f_inner WHERE f_inner.id = d.sid)
            WHEN d.type = 'naver_folder' THEN (SELECT nf_inner.name::text FROM public.tbl_naver_folder nf_inner WHERE nf_inner.folder_id::varchar = d.sid)
            WHEN d.type = 'youtube_channel' THEN (SELECT pf_inner.metadata->>'channelTitle' FROM public.tbl_place_features pf_inner WHERE pf_inner.metadata->>'channelId' = d.sid LIMIT 1)
            WHEN d.type = 'community_region' THEN COALESCE(d.meta, 'unknown') || '|' || d.sid
            ELSE 'Unknown'
        END)::VARCHAR as source_title,
        (CASE 
            WHEN d.type = 'folder' THEN (
                SELECT up_inner.profile_image_url 
                FROM public.tbl_folder f_inner 
                JOIN public.tbl_user_profile up_inner ON f_inner.owner_id::uuid = up_inner.auth_user_id 
                WHERE f_inner.id = d.sid
            )
            WHEN d.type = 'youtube_channel' THEN (
                SELECT pf_inner.metadata->'thumbnails'->'default'->>'url' 
                FROM public.tbl_place_features pf_inner 
                WHERE pf_inner.metadata->>'channelId' = d.sid 
                LIMIT 1
            )
            ELSE NULL
        END)::VARCHAR as source_image,
        p.id::VARCHAR as place_id,
        (to_jsonb(p) - '{themes, street_panorama, category_code_list, visitor_review_stats, algo_avg_len, algo_stdev_len, algo_revisit_rate, algo_media_ratio, algo_avg_views, algo_recency_score, algo_engagement_score, algo_length_variation_index, algo_loyalty_index, algo_growth_rate_1m, algo_growth_rate_2m, algo_growth_rate_3m}'::text[] || 
         jsonb_build_object(
            'image_urls', p.images, 
            'avg_price', calculate_menu_avg_price(p.menus),
            'interaction', jsonb_build_object(
                'place_liked_count', COALESCE((SELECT count(*) FROM public.tbl_like WHERE liked_id = p.id AND liked_type = 'place' AND liked = true), 0),
                'place_saved_count', COALESCE((SELECT count(*) FROM public.tbl_save WHERE saved_id = p.id AND saved_type = 'place' AND saved = true), 0),
                'place_comment_count', COALESCE((SELECT count(*) FROM public.tbl_comment_for_place WHERE business_id = p.id AND is_active = true), 0),
                'place_reviews_count', COALESCE((SELECT count(*) FROM public.tbl_place_user_review pur WHERE pur.place_id = p.id AND pur.is_active = true), 0),
                'is_liked', false,
                'is_saved', false,
                'is_commented', false,
                'is_reviewed', false,
                'visit_count', 0,
                'last_visited_at', NULL
            ),
            'experience', jsonb_build_object(
                'is_visited', false,
                'visit_count', 0,
                'last_visited_at', NULL
            )
         )) as place_data,
        d.added_time as added_at
    FROM latest_data d
    JOIN public.tbl_place p ON d.pid = p.id
    WHERE (p_source_type IS NULL OR d.type = p_source_type)
    ORDER BY d.added_time DESC
    LIMIT p_limit OFFSET p_offset;
END;
$$;

GRANT EXECUTE ON FUNCTION public.v1_get_public_feed TO authenticated, anon;
