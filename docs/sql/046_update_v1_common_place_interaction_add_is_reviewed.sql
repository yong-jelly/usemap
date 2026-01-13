-- =====================================================
-- 046_update_v1_common_place_interaction_add_is_reviewed.sql
-- 장소 상호작용 정보에 사용자 리뷰 작성 여부(is_reviewed) 추가
-- 
-- 실행 방법:
--   psql "postgresql://postgres.xyqpggpilgcdsawuvpzn:ZNDqDunnaydr0aFQ@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres" -f docs/sql/046_update_v1_common_place_interaction_add_is_reviewed.sql
-- =====================================================

-- 1. v1_common_place_interaction 함수 업데이트
CREATE OR REPLACE FUNCTION public.v1_common_place_interaction(p_place_id text)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
AS $function$
DECLARE
    v_user_id uuid := auth.uid();
    v_place_liked_count int := 0;
    v_place_saved_count int := 0;
    v_is_liked boolean := false;
    v_is_saved boolean := false;
    v_place_comment_count int := 0;
    v_is_commented boolean := false;
    v_is_reviewed boolean := false;
    v_visit_count int := 0;
    v_last_visited_at timestamp with time zone := NULL;
    v_comments jsonb := '[]'::jsonb;
    v_tags jsonb := '[]'::jsonb;
BEGIN
    SELECT count(*) INTO v_place_liked_count FROM public.tbl_like WHERE liked_id = p_place_id AND liked_type = 'place' AND liked = true;
    SELECT count(*) INTO v_place_saved_count FROM public.tbl_save WHERE saved_id = p_place_id AND saved_type = 'place' AND saved = true;
    SELECT count(*) INTO v_place_comment_count FROM public.tbl_comment_for_place WHERE business_id = p_place_id AND is_active = true;

    IF v_user_id IS NOT NULL THEN
        SELECT liked INTO v_is_liked FROM public.tbl_like WHERE liked_id = p_place_id AND liked_type = 'place' AND user_id = v_user_id;
        SELECT saved INTO v_is_saved FROM public.tbl_save WHERE saved_id = p_place_id AND saved_type = 'place' AND user_id = v_user_id;
        SELECT EXISTS (SELECT 1 FROM public.tbl_comment_for_place WHERE business_id = p_place_id AND user_id = v_user_id AND is_active = true) INTO v_is_commented;
        SELECT EXISTS (SELECT 1 FROM public.tbl_place_user_review WHERE place_id = p_place_id AND user_id = v_user_id AND is_active = true) INTO v_is_reviewed;
        
        -- 방문 통계 추가
        SELECT count(*), max(visited_at) INTO v_visit_count, v_last_visited_at 
        FROM public.tbl_visited WHERE user_id = v_user_id AND place_id = p_place_id;
    END IF;

    RETURN jsonb_build_object(
        'place_liked_count', COALESCE(v_place_liked_count, 0),
        'place_saved_count', COALESCE(v_place_saved_count, 0),
        'is_liked', COALESCE(v_is_liked, false),
        'is_saved', COALESCE(v_is_saved, false),
        'place_comment_count', COALESCE(v_place_comment_count, 0),
        'is_commented', COALESCE(v_is_commented, false),
        'is_reviewed', COALESCE(v_is_reviewed, false),
        'visit_count', COALESCE(v_visit_count, 0),
        'last_visited_at', v_last_visited_at
    );
END;
$function$;

-- 2. v1_get_place_details 함수 업데이트
CREATE OR REPLACE FUNCTION public.v1_get_place_details(p_place_id text)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
AS $function$
DECLARE
    v_user_id uuid := auth.uid();
    v_place_review_liked_count int := 0;
    v_place_review_saved_count int := 0;
    v_place_liked_count int := 0;
    v_place_saved_count int := 0;
    v_is_liked boolean := false;
    v_is_saved boolean := false;
    v_place_comment_count int := 0;
    v_is_commented boolean := false;
    v_is_reviewed boolean := false;
    v_comments jsonb := '[]'::jsonb;
    v_place_tag_count int := 0;
    v_is_place_tagged boolean := false;
    v_tags jsonb := '[]'::jsonb;
BEGIN
    -- 'place' 타입 좋아요/저장 수
    SELECT count(*) INTO v_place_liked_count FROM public.tbl_like WHERE liked_id = p_place_id AND liked_type = 'place' AND liked = true;
    SELECT count(*) INTO v_place_saved_count FROM public.tbl_save WHERE saved_id = p_place_id AND saved_type = 'place' AND saved = true;

    -- 댓글 수 및 목록 조회
    SELECT count(*) INTO v_place_comment_count FROM public.tbl_comment_for_place WHERE business_id = p_place_id AND is_active = true;

    SELECT jsonb_agg(
               jsonb_build_object(
                   'id', c.id, 'user_id', c.user_id, 'content', c.content, 'created_at', c.created_at,
                   'user_profile', jsonb_build_object('nickname', up.nickname, 'profile_image_url', up.profile_image_url)
               ) ORDER BY c.created_at ASC
           ) INTO v_comments
    FROM public.tbl_comment_for_place c
    LEFT JOIN public.tbl_user_profile up ON c.user_id = up.auth_user_id
    WHERE c.business_id = p_place_id AND c.is_active = true;

    -- 사용자별 상태 (로그인 시)
    IF v_user_id IS NOT NULL THEN
        SELECT liked INTO v_is_liked FROM public.tbl_like WHERE liked_id = p_place_id AND liked_type = 'place' AND user_id = v_user_id;
        SELECT saved INTO v_is_saved FROM public.tbl_save WHERE saved_id = p_place_id AND saved_type = 'place' AND user_id = v_user_id;
        SELECT EXISTS (SELECT 1 FROM public.tbl_comment_for_place WHERE business_id = p_place_id AND user_id = v_user_id AND is_active = true) INTO v_is_commented;
        SELECT EXISTS (SELECT 1 FROM public.tbl_place_user_review WHERE place_id = p_place_id AND user_id = v_user_id AND is_active = true) INTO v_is_reviewed;
    END IF;

    RETURN jsonb_build_object(
        'place_liked_count', COALESCE(v_place_liked_count, 0),
        'place_saved_count', COALESCE(v_place_saved_count, 0),
        'is_liked', COALESCE(v_is_liked, false),
        'is_saved', COALESCE(v_is_saved, false),
        'place_comment_count', COALESCE(v_place_comment_count, 0),
        'is_commented', COALESCE(v_is_commented, false),
        'is_reviewed', COALESCE(v_is_reviewed, false),
        'comments', COALESCE(v_comments, '[]'::jsonb)
    );
END;
$function$;

-- 3. v1_get_folder_places 함수 업데이트 (상호작용 정보 포함)
DROP FUNCTION IF EXISTS public.v1_get_folder_places(VARCHAR, INT, INT);
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

    -- 폴더 정보 및 권한 확인
    SELECT f.owner_id, f.permission INTO v_folder_owner_id, v_folder_permission 
    FROM public.tbl_folder f
    WHERE f.id = p_folder_id AND f.is_hidden = FALSE;

    IF v_folder_owner_id IS NULL THEN
        RETURN;
    END IF;

    v_is_owner := (v_user_id IS NOT NULL AND v_folder_owner_id = v_user_id);

    -- 구독 여부 확인
    IF v_user_id IS NOT NULL THEN
        SELECT EXISTS (
            SELECT 1 FROM public.tbl_folder_subscribed sub
            WHERE sub.folder_id = p_folder_id AND sub.user_id = v_user_id AND sub.deleted_at IS NULL
        ) INTO v_is_subscribed;
    ELSE
        v_is_subscribed := FALSE;
    END IF;

    -- 접근 권한 체크
    IF v_folder_permission = 'hidden' AND NOT v_is_owner THEN
        RETURN;
    END IF;

    IF v_folder_permission = 'invite' AND NOT (v_is_owner OR v_is_subscribed) THEN
        RETURN;
    END IF;

    IF v_folder_permission = 'default' AND NOT v_is_owner THEN
        RETURN;
  END IF;

    RETURN QUERY
    SELECT 
        pl.id,
        (to_jsonb(pl) - '{themes, street_panorama, category_code_list, visitor_review_stats, algo_avg_len, algo_stdev_len, algo_revisit_rate, algo_media_ratio, algo_avg_views, algo_recency_score, algo_engagement_score, algo_length_variation_index, algo_loyalty_index, algo_growth_rate_1m, algo_growth_rate_2m, algo_growth_rate_3m}'::text[] || jsonb_build_object(
            'image_urls', pl.images,
            'interaction', public.v1_common_place_interaction(pl.id),
            'features', public.v1_common_place_features(pl.id),
            'experience', jsonb_build_object('is_visited', public.v1_has_visited_place(pl.id))
        )) AS p_data,
        fp.created_at::TIMESTAMPTZ AS a_at
    FROM public.tbl_folder_place fp
    JOIN public.tbl_place pl ON fp.place_id = pl.id
    WHERE fp.folder_id = p_folder_id 
      AND fp.deleted_at IS NULL
    ORDER BY fp.created_at DESC
    LIMIT p_limit OFFSET p_offset;
END;
$$;

-- 4. v1_get_my_feed 함수 업데이트 (상호작용 정보 포함)
DROP FUNCTION IF EXISTS public.v1_get_my_feed(INT, INT, INT, INT);
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
        (to_jsonb(p) - '{themes, street_panorama, category_code_list, visitor_review_stats, algo_avg_len, algo_stdev_len, algo_revisit_rate, algo_media_ratio, algo_avg_views, algo_recency_score, algo_engagement_score, algo_length_variation_index, algo_loyalty_index, algo_growth_rate_1m, algo_growth_rate_2m, algo_growth_rate_3m}'::text[] || jsonb_build_object(
            'image_urls', p.images, 
            'avg_price', calculate_menu_avg_price(p.menus),
            'interaction', public.v1_common_place_interaction(p.id),
            'features', public.v1_common_place_features(p.id),
            'experience', jsonb_build_object('is_visited', public.v1_has_visited_place(p.id))
        )) as place_data,
        feed_data.added_time::TIMESTAMPTZ as added_at,
        feed_data.comment::TEXT as comment
    FROM (
        -- 각 소스별 장소 데이터 결합
        SELECT 'folder' as type, fp.folder_id as sid, fp.place_id as pid, fp.created_at::TIMESTAMPTZ as added_time, NULL::text as meta, fp.comment FROM public.tbl_folder_place fp WHERE fp.deleted_at IS NULL
        UNION ALL
        SELECT 'naver_folder' as type, nfp.folder_id::varchar as sid, nfp.place_id as pid, nf.created_at::TIMESTAMPTZ as added_time, NULL::text as meta, NULL::text as comment FROM public.tbl_naver_folder_place nfp JOIN public.tbl_naver_folder nf ON nfp.folder_id = nf.folder_id
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
               pf.metadata->>'domain' as meta,
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

