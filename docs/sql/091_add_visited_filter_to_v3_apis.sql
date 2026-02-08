-- =====================================================
-- 091_add_visited_filter_to_v3_apis.sql
-- v3 API 및 폴더 API에 방문한 장소 필터링 기능 추가
-- 
-- 수정 대상:
--   1. v3_get_places_by_naver_folder
--   2. v3_get_places_by_youtube_channel
--   3. v3_get_places_by_community_region
--   4. v3_get_places_by_social_region
--   5. v3_get_places_by_region
--   6. v1_get_folder_places
-- 
-- 변경 사항:
--   - p_visited_only (BOOLEAN) 파라미터 추가
--   - WHERE 절에 방문 여부 체크 로직 추가 (EXISTS 사용)
-- =====================================================
-- 로그인 유저만 해당
-- 실행 방법:
--   psql "postgresql://postgres.xyqpggpilgcdsawuvpzn:ZNDqDunnaydr0aFQ@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres" -f docs/sql/091_add_visited_filter_to_v3_apis.sql
-- =====================================================

-- 1. v3_get_places_by_naver_folder
DROP FUNCTION IF EXISTS public.v3_get_places_by_naver_folder(BIGINT, INT, INT);
DROP FUNCTION IF EXISTS public.v3_get_places_by_naver_folder(BIGINT, INT, INT, BOOLEAN);

CREATE OR REPLACE FUNCTION public.v3_get_places_by_naver_folder(
    p_folder_id BIGINT,
    p_limit INT DEFAULT 20,
    p_offset INT DEFAULT 0,
    p_visited_only BOOLEAN DEFAULT FALSE
)
RETURNS TABLE (
    place_id VARCHAR,
    place_data JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
#variable_conflict use_column
DECLARE
    v_user_id UUID := auth.uid();
BEGIN
    RETURN QUERY
    WITH 
    folder_places AS (
        SELECT 
            fp.place_id as pid,
            p.id, p.name, p.group1, p.group2, p.group3, p.road, p.category,
            p.road_address, p.address, p.phone, p.visitor_reviews_total, p.visitor_reviews_score,
            p.x, p.y, p.images, p.static_map_url, p.keyword_list, p.visitor_review_medias_total,
            p.menus, p.place_images, p.updated_at as place_updated_at, p.created_at as place_created_at,
            p.is_franchise, p.conveniences, p.homepage,
            calculate_menu_avg_price(p.menus) as avg_price
        FROM tbl_naver_folder_place fp 
        JOIN tbl_place p ON fp.place_id = p.id
        WHERE fp.folder_id = p_folder_id
          AND (
            NOT p_visited_only 
            OR (v_user_id IS NOT NULL AND EXISTS (
              SELECT 1 FROM tbl_visited v 
              WHERE v.user_id = v_user_id 
              AND v.place_id = fp.place_id
            ))
          )
        ORDER BY p.visitor_reviews_score DESC NULLS LAST, p.visitor_reviews_total DESC NULLS LAST
        LIMIT p_limit OFFSET p_offset
    ),
    place_interactions AS (
        SELECT 
            fp.pid as place_id,
            COALESCE(lk.liked_count, 0) as liked_count,
            COALESCE(sv.saved_count, 0) as saved_count,
            COALESCE(cm.comment_count, 0) as comment_count,
            COALESCE(rv.reviews_count, 0) as reviews_count,
            COALESCE(my_lk.is_liked, false) as is_liked,
            COALESCE(my_sv.is_saved, false) as is_saved,
            COALESCE(my_cm.is_commented, false) as is_commented,
            COALESCE(my_rv.is_reviewed, false) as is_reviewed
        FROM folder_places fp
        LEFT JOIN LATERAL (SELECT count(*)::int as liked_count FROM public.tbl_like WHERE liked_id = fp.pid AND liked_type = 'place' AND liked = true) lk ON true
        LEFT JOIN LATERAL (SELECT count(*)::int as saved_count FROM public.tbl_save WHERE saved_id = fp.pid AND saved_type = 'place' AND saved = true) sv ON true
        LEFT JOIN LATERAL (SELECT count(*)::int as comment_count FROM public.tbl_comment_for_place WHERE business_id = fp.pid AND is_active = true) cm ON true
        LEFT JOIN LATERAL (SELECT count(*)::int as reviews_count FROM public.tbl_place_user_review WHERE place_id = fp.pid AND is_active = true) rv ON true
        LEFT JOIN LATERAL (SELECT liked as is_liked FROM public.tbl_like WHERE liked_id = fp.pid AND liked_type = 'place' AND user_id = v_user_id LIMIT 1) my_lk ON true
        LEFT JOIN LATERAL (SELECT saved as is_saved FROM public.tbl_save WHERE saved_id = fp.pid AND saved_type = 'place' AND user_id = v_user_id LIMIT 1) my_sv ON true
        LEFT JOIN LATERAL (SELECT true as is_commented FROM public.tbl_comment_for_place WHERE business_id = fp.pid AND user_id = v_user_id AND is_active = true LIMIT 1) my_cm ON true
        LEFT JOIN LATERAL (SELECT true as is_reviewed FROM public.tbl_place_user_review WHERE place_id = fp.pid AND user_id = v_user_id AND is_active = true LIMIT 1) my_rv ON true
    ),
    place_experiences AS (
        SELECT 
            fp.pid as place_id,
            COALESCE(v.visit_count, 0) as visit_count,
            v.last_visited_at
        FROM folder_places fp
        LEFT JOIN LATERAL (
            SELECT count(*)::int as visit_count, max(visited_at) as last_visited_at
            FROM public.tbl_visited WHERE user_id = v_user_id AND place_id = fp.pid
        ) v ON true
    ),
    place_features AS (
        SELECT 
            fp.pid as place_id,
            COALESCE(pf.features, '[]'::jsonb) as features
        FROM folder_places fp
        LEFT JOIN LATERAL (
            SELECT jsonb_agg(to_jsonb(af.*)) as features
            FROM (
                SELECT pf.id::text as id, pf.title, pf.status, pf.user_id::text, pf.metadata,
                    pf.created_at, pf.updated_at, pf.content_url, pf.is_verified, pf.published_at, pf.platform_type
                FROM public.tbl_place_features pf WHERE pf.place_id = fp.pid AND pf.status = 'active'
                UNION ALL
                SELECT nf.folder_id::text, nf.name, 'active', NULL::text,
                    jsonb_build_object('url', NULL, 'title', nf.name, 'domain', 'naver', 'description', nf.memo),
                    nf.created_at, nf.updated_at, NULL, false, nf.created_at, 'folder'
                FROM public.tbl_naver_folder_place nfp
                JOIN public.tbl_naver_folder nf ON nfp.folder_id = nf.folder_id WHERE nfp.place_id = fp.pid
                UNION ALL
                SELECT f.id, f.title, 'active', f.owner_id::text,
                    jsonb_build_object('url', '/folder/' || f.id, 'title', f.title, 'domain', 'feature', 'description', f.description),
                    f.created_at, f.updated_at, '/folder/' || f.id, false, f.created_at, 'public_user'
                FROM public.tbl_folder_place tfp
                JOIN public.tbl_folder f ON tfp.folder_id = f.id
                WHERE tfp.place_id = fp.pid AND tfp.deleted_at IS NULL AND f.permission = 'public' AND f.is_hidden = FALSE
            ) af
        ) pf ON true
    )
    SELECT 
        fp.pid::VARCHAR as place_id,
        jsonb_build_object(
            'id', fp.id, 'name', fp.name, 'group1', fp.group1, 'group2', fp.group2, 'group3', fp.group3,
            'road', fp.road, 'category', fp.category, 'road_address', fp.road_address, 'address', fp.address,
            'phone', fp.phone, 'visitor_reviews_total', fp.visitor_reviews_total, 'visitor_reviews_score', fp.visitor_reviews_score,
            'x', fp.x, 'y', fp.y, 'images', fp.images, 'image_urls', fp.images,
            'static_map_url', fp.static_map_url, 'keyword_list', fp.keyword_list,
            'visitor_review_medias_total', fp.visitor_review_medias_total, 'menus', fp.menus, 'avg_price', fp.avg_price,
            'place_images', fp.place_images, 'updated_at', fp.place_updated_at, 'created_at', fp.place_created_at,
            'is_franchise', fp.is_franchise, 'conveniences', fp.conveniences, 'homepage', fp.homepage,
            'interaction', jsonb_build_object(
                'place_liked_count', pi.liked_count, 'place_saved_count', pi.saved_count,
                'is_liked', pi.is_liked, 'is_saved', pi.is_saved,
                'place_comment_count', pi.comment_count, 'place_reviews_count', pi.reviews_count,
                'is_commented', pi.is_commented, 'is_reviewed', pi.is_reviewed,
                'visit_count', pe.visit_count, 'last_visited_at', pe.last_visited_at
            ),
            'features', pfeat.features,
            'experience', jsonb_build_object(
                'is_visited', pe.visit_count > 0, 'visit_count', pe.visit_count, 'last_visited_at', pe.last_visited_at
            )
        ) as place_data
    FROM folder_places fp
    LEFT JOIN place_interactions pi ON pi.place_id = fp.pid
    LEFT JOIN place_experiences pe ON pe.place_id = fp.pid
    LEFT JOIN place_features pfeat ON pfeat.place_id = fp.pid
    ORDER BY fp.visitor_reviews_score DESC NULLS LAST, fp.visitor_reviews_total DESC NULLS LAST;
END;
$$;

-- 2. v3_get_places_by_youtube_channel
DROP FUNCTION IF EXISTS public.v3_get_places_by_youtube_channel(TEXT, INT, INT);
DROP FUNCTION IF EXISTS public.v3_get_places_by_youtube_channel(TEXT, INT, INT, BOOLEAN);

CREATE OR REPLACE FUNCTION public.v3_get_places_by_youtube_channel(
    p_channel_id TEXT,
    p_limit INT DEFAULT 20,
    p_offset INT DEFAULT 0,
    p_visited_only BOOLEAN DEFAULT FALSE
)
RETURNS TABLE (
    place_id VARCHAR,
    place_data JSONB,
    published_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
#variable_conflict use_column
DECLARE
    v_user_id UUID := auth.uid();
BEGIN
    RETURN QUERY
    WITH 
    unique_places AS (
        SELECT DISTINCT ON (f.place_id)
            f.place_id as pid,
            f.published_at as pub_at
        FROM tbl_place_features f
        WHERE f.platform_type = 'youtube'
          AND f.status = 'active'
          AND f.metadata->>'channelId' = p_channel_id
          AND (
            NOT p_visited_only 
            OR (v_user_id IS NOT NULL AND EXISTS (
              SELECT 1 FROM tbl_visited v 
              WHERE v.user_id = v_user_id 
              AND v.place_id = f.place_id
            ))
          )
        ORDER BY f.place_id, f.published_at DESC
    ),
    paged_places AS (
        SELECT up.pid, up.pub_at
        FROM unique_places up
        ORDER BY up.pub_at DESC
        LIMIT p_limit OFFSET p_offset
    ),
    channel_places AS (
        SELECT 
            pp.pid, pp.pub_at,
            p.id, p.name, p.group1, p.group2, p.group3, p.road, p.category,
            p.road_address, p.address, p.phone, p.visitor_reviews_total, p.visitor_reviews_score,
            p.x, p.y, p.images, p.static_map_url, p.keyword_list, p.visitor_review_medias_total,
            p.menus, p.place_images, p.updated_at as place_updated_at, p.created_at as place_created_at,
            p.is_franchise, p.conveniences, p.homepage,
            calculate_menu_avg_price(p.menus) as avg_price
        FROM paged_places pp
        JOIN tbl_place p ON pp.pid = p.id
    ),
    place_interactions AS (
        SELECT 
            cp.pid as place_id,
            COALESCE(lk.liked_count, 0) as liked_count,
            COALESCE(sv.saved_count, 0) as saved_count,
            COALESCE(cm.comment_count, 0) as comment_count,
            COALESCE(rv.reviews_count, 0) as reviews_count,
            COALESCE(my_lk.is_liked, false) as is_liked,
            COALESCE(my_sv.is_saved, false) as is_saved,
            COALESCE(my_cm.is_commented, false) as is_commented,
            COALESCE(my_rv.is_reviewed, false) as is_reviewed
        FROM channel_places cp
        LEFT JOIN LATERAL (SELECT count(*)::int as liked_count FROM public.tbl_like WHERE liked_id = cp.pid AND liked_type = 'place' AND liked = true) lk ON true
        LEFT JOIN LATERAL (SELECT count(*)::int as saved_count FROM public.tbl_save WHERE saved_id = cp.pid AND saved_type = 'place' AND saved = true) sv ON true
        LEFT JOIN LATERAL (SELECT count(*)::int as comment_count FROM public.tbl_comment_for_place WHERE business_id = cp.pid AND is_active = true) cm ON true
        LEFT JOIN LATERAL (SELECT count(*)::int as reviews_count FROM public.tbl_place_user_review WHERE place_id = cp.pid AND is_active = true) rv ON true
        LEFT JOIN LATERAL (SELECT liked as is_liked FROM public.tbl_like WHERE liked_id = cp.pid AND liked_type = 'place' AND user_id = v_user_id LIMIT 1) my_lk ON true
        LEFT JOIN LATERAL (SELECT saved as is_saved FROM public.tbl_save WHERE saved_id = cp.pid AND saved_type = 'place' AND user_id = v_user_id LIMIT 1) my_sv ON true
        LEFT JOIN LATERAL (SELECT true as is_commented FROM public.tbl_comment_for_place WHERE business_id = cp.pid AND user_id = v_user_id AND is_active = true LIMIT 1) my_cm ON true
        LEFT JOIN LATERAL (SELECT true as is_reviewed FROM public.tbl_place_user_review WHERE place_id = cp.pid AND user_id = v_user_id AND is_active = true LIMIT 1) my_rv ON true
    ),
    place_experiences AS (
        SELECT 
            cp.pid as place_id,
            COALESCE(v.visit_count, 0) as visit_count,
            v.last_visited_at
        FROM channel_places cp
        LEFT JOIN LATERAL (
            SELECT count(*)::int as visit_count, max(visited_at) as last_visited_at
            FROM public.tbl_visited WHERE user_id = v_user_id AND place_id = cp.pid
        ) v ON true
    ),
    place_features AS (
        SELECT 
            cp.pid as place_id,
            COALESCE(pf.features, '[]'::jsonb) as features
        FROM channel_places cp
        LEFT JOIN LATERAL (
            SELECT jsonb_agg(to_jsonb(af.*)) as features
            FROM (
                SELECT pf.id::text as id, pf.title, pf.status, pf.user_id::text, pf.metadata,
                    pf.created_at, pf.updated_at, pf.content_url, pf.is_verified, pf.published_at, pf.platform_type
                FROM public.tbl_place_features pf WHERE pf.place_id = cp.pid AND pf.status = 'active'
                UNION ALL
                SELECT nf.folder_id::text, nf.name, 'active', NULL::text,
                    jsonb_build_object('url', NULL, 'title', nf.name, 'domain', 'naver', 'description', nf.memo),
                    nf.created_at, nf.updated_at, NULL, false, nf.created_at, 'folder'
                FROM public.tbl_naver_folder_place nfp
                JOIN public.tbl_naver_folder nf ON nfp.folder_id = nf.folder_id WHERE nfp.place_id = cp.pid
                UNION ALL
                SELECT f.id, f.title, 'active', f.owner_id::text,
                    jsonb_build_object('url', '/folder/' || f.id, 'title', f.title, 'domain', 'feature', 'description', f.description),
                    f.created_at, f.updated_at, '/folder/' || f.id, false, f.created_at, 'public_user'
                FROM public.tbl_folder_place tfp
                JOIN public.tbl_folder f ON tfp.folder_id = f.id
                WHERE tfp.place_id = cp.pid AND tfp.deleted_at IS NULL AND f.permission = 'public' AND f.is_hidden = FALSE
            ) af
        ) pf ON true
    )
    SELECT 
        cp.pid::VARCHAR as place_id,
        jsonb_build_object(
            'id', cp.id, 'name', cp.name, 'group1', cp.group1, 'group2', cp.group2, 'group3', cp.group3,
            'road', cp.road, 'category', cp.category, 'road_address', cp.road_address, 'address', cp.address,
            'phone', cp.phone, 'visitor_reviews_total', cp.visitor_reviews_total, 'visitor_reviews_score', cp.visitor_reviews_score,
            'x', cp.x, 'y', cp.y, 'images', cp.images, 'image_urls', cp.images,
            'static_map_url', cp.static_map_url, 'keyword_list', cp.keyword_list,
            'visitor_review_medias_total', cp.visitor_review_medias_total, 'menus', cp.menus, 'avg_price', cp.avg_price,
            'place_images', cp.place_images, 'updated_at', cp.place_updated_at, 'created_at', cp.place_created_at,
            'is_franchise', cp.is_franchise, 'conveniences', cp.conveniences, 'homepage', cp.homepage,
            'interaction', jsonb_build_object(
                'place_liked_count', pi.liked_count, 'place_saved_count', pi.saved_count,
                'is_liked', pi.is_liked, 'is_saved', pi.is_saved,
                'place_comment_count', pi.comment_count, 'place_reviews_count', pi.reviews_count,
                'is_commented', pi.is_commented, 'is_reviewed', pi.is_reviewed,
                'visit_count', pe.visit_count, 'last_visited_at', pe.last_visited_at
            ),
            'features', pfeat.features,
            'experience', jsonb_build_object(
                'is_visited', pe.visit_count > 0, 'visit_count', pe.visit_count, 'last_visited_at', pe.last_visited_at
            )
        ) as place_data,
        cp.pub_at::TIMESTAMPTZ as published_at
    FROM channel_places cp
    LEFT JOIN place_interactions pi ON pi.place_id = cp.pid
    LEFT JOIN place_experiences pe ON pe.place_id = cp.pid
    LEFT JOIN place_features pfeat ON pfeat.place_id = cp.pid
    ORDER BY cp.pub_at DESC;
END;
$$;

-- 3. v3_get_places_by_community_region
DROP FUNCTION IF EXISTS public.v3_get_places_by_community_region(TEXT, TEXT, INT, INT);
DROP FUNCTION IF EXISTS public.v3_get_places_by_community_region(TEXT, TEXT, INT, INT, BOOLEAN);

CREATE OR REPLACE FUNCTION public.v3_get_places_by_community_region(
    p_region_name TEXT,
    p_domain TEXT DEFAULT NULL,
    p_limit INT DEFAULT 20,
    p_offset INT DEFAULT 0,
    p_visited_only BOOLEAN DEFAULT FALSE
)
RETURNS TABLE (
    place_id VARCHAR,
    place_data JSONB,
    published_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
#variable_conflict use_column
DECLARE
    v_user_id UUID := auth.uid();
BEGIN
    RETURN QUERY
    WITH 
    unique_places AS (
        SELECT DISTINCT ON (pf.place_id)
            pf.place_id as pid,
            pf.published_at as pub_at
        FROM tbl_place_features pf
        JOIN tbl_place p ON pf.place_id = p.id
        WHERE pf.platform_type = 'community'
          AND pf.status = 'active'
          AND p.group1 = p_region_name
          AND (p_domain IS NULL OR pf.metadata->>'domain' = p_domain)
          AND (
            NOT p_visited_only 
            OR (v_user_id IS NOT NULL AND EXISTS (
              SELECT 1 FROM tbl_visited v 
              WHERE v.user_id = v_user_id 
              AND v.place_id = pf.place_id
            ))
          )
        ORDER BY pf.place_id, pf.published_at DESC
    ),
    paged_places AS (
        SELECT up.pid, up.pub_at
        FROM unique_places up
        ORDER BY up.pub_at DESC
        LIMIT p_limit OFFSET p_offset
    ),
    places_with_data AS (
        SELECT 
            pp.pid, pp.pub_at,
            p.id, p.name, p.group1, p.group2, p.group3, p.road, p.category,
            p.road_address, p.address, p.phone, p.visitor_reviews_total, p.visitor_reviews_score,
            p.x, p.y, p.images, p.static_map_url, p.keyword_list, p.visitor_review_medias_total,
            p.menus, p.place_images, p.updated_at as place_updated_at, p.created_at as place_created_at,
            p.is_franchise, p.conveniences, p.homepage,
            calculate_menu_avg_price(p.menus) as avg_price
        FROM paged_places pp
        JOIN tbl_place p ON pp.pid = p.id
    ),
    place_interactions AS (
        SELECT 
            pd.pid as place_id,
            COALESCE(lk.liked_count, 0) as liked_count,
            COALESCE(sv.saved_count, 0) as saved_count,
            COALESCE(cm.comment_count, 0) as comment_count,
            COALESCE(rv.reviews_count, 0) as reviews_count,
            COALESCE(my_lk.is_liked, false) as is_liked,
            COALESCE(my_sv.is_saved, false) as is_saved,
            COALESCE(my_cm.is_commented, false) as is_commented,
            COALESCE(my_rv.is_reviewed, false) as is_reviewed
        FROM places_with_data pd
        LEFT JOIN LATERAL (SELECT count(*)::int as liked_count FROM public.tbl_like WHERE liked_id = pd.pid AND liked_type = 'place' AND liked = true) lk ON true
        LEFT JOIN LATERAL (SELECT count(*)::int as saved_count FROM public.tbl_save WHERE saved_id = pd.pid AND saved_type = 'place' AND saved = true) sv ON true
        LEFT JOIN LATERAL (SELECT count(*)::int as comment_count FROM public.tbl_comment_for_place WHERE business_id = pd.pid AND is_active = true) cm ON true
        LEFT JOIN LATERAL (SELECT count(*)::int as reviews_count FROM public.tbl_place_user_review WHERE place_id = pd.pid AND is_active = true) rv ON true
        LEFT JOIN LATERAL (SELECT liked as is_liked FROM public.tbl_like WHERE liked_id = pd.pid AND liked_type = 'place' AND user_id = v_user_id LIMIT 1) my_lk ON true
        LEFT JOIN LATERAL (SELECT saved as is_saved FROM public.tbl_save WHERE saved_id = pd.pid AND saved_type = 'place' AND user_id = v_user_id LIMIT 1) my_sv ON true
        LEFT JOIN LATERAL (SELECT true as is_commented FROM public.tbl_comment_for_place WHERE business_id = pd.pid AND user_id = v_user_id AND is_active = true LIMIT 1) my_cm ON true
        LEFT JOIN LATERAL (SELECT true as is_reviewed FROM public.tbl_place_user_review WHERE place_id = pd.pid AND user_id = v_user_id AND is_active = true LIMIT 1) my_rv ON true
    ),
    place_experiences AS (
        SELECT 
            pd.pid as place_id,
            COALESCE(v.visit_count, 0) as visit_count,
            v.last_visited_at
        FROM places_with_data pd
        LEFT JOIN LATERAL (
            SELECT count(*)::int as visit_count, max(visited_at) as last_visited_at
            FROM public.tbl_visited WHERE user_id = v_user_id AND place_id = pd.pid
        ) v ON true
    ),
    place_features AS (
        SELECT 
            pd.pid as place_id,
            COALESCE(pf.features, '[]'::jsonb) as features
        FROM places_with_data pd
        LEFT JOIN LATERAL (
            SELECT jsonb_agg(to_jsonb(af.*)) as features
            FROM (
                SELECT pf.id::text as id, pf.title, pf.status, pf.user_id::text, pf.metadata,
                    pf.created_at, pf.updated_at, pf.content_url, pf.is_verified, pf.published_at, pf.platform_type
                FROM public.tbl_place_features pf WHERE pf.place_id = pd.pid AND pf.status = 'active'
                UNION ALL
                SELECT nf.folder_id::text, nf.name, 'active', NULL::text,
                    jsonb_build_object('url', NULL, 'title', nf.name, 'domain', 'naver', 'description', nf.memo),
                    nf.created_at, nf.updated_at, NULL, false, nf.created_at, 'folder'
                FROM public.tbl_naver_folder_place nfp
                JOIN public.tbl_naver_folder nf ON nfp.folder_id = nf.folder_id WHERE nfp.place_id = pd.pid
                UNION ALL
                SELECT f.id, f.title, 'active', f.owner_id::text,
                    jsonb_build_object('url', '/folder/' || f.id, 'title', f.title, 'domain', 'feature', 'description', f.description),
                    f.created_at, f.updated_at, '/folder/' || f.id, false, f.created_at, 'public_user'
                FROM public.tbl_folder_place fp
                JOIN public.tbl_folder f ON fp.folder_id = f.id
                WHERE fp.place_id = pd.pid AND fp.deleted_at IS NULL AND f.permission = 'public' AND f.is_hidden = FALSE
            ) af
        ) pf ON true
    )
    SELECT 
        pd.pid::VARCHAR as place_id,
        jsonb_build_object(
            'id', pd.id, 'name', pd.name, 'group1', pd.group1, 'group2', pd.group2, 'group3', pd.group3,
            'road', pd.road, 'category', pd.category, 'road_address', pd.road_address, 'address', pd.address,
            'phone', pd.phone, 'visitor_reviews_total', pd.visitor_reviews_total, 'visitor_reviews_score', pd.visitor_reviews_score,
            'x', pd.x, 'y', pd.y, 'images', pd.images, 'image_urls', pd.images,
            'static_map_url', pd.static_map_url, 'keyword_list', pd.keyword_list,
            'visitor_review_medias_total', pd.visitor_review_medias_total, 'menus', pd.menus, 'avg_price', pd.avg_price,
            'place_images', pd.place_images, 'updated_at', pd.place_updated_at, 'created_at', pd.place_created_at,
            'is_franchise', pd.is_franchise, 'conveniences', pd.conveniences, 'homepage', pd.homepage,
            'interaction', jsonb_build_object(
                'place_liked_count', pi.liked_count, 'place_saved_count', pi.saved_count,
                'is_liked', pi.is_liked, 'is_saved', pi.is_saved,
                'place_comment_count', pi.comment_count, 'place_reviews_count', pi.reviews_count,
                'is_commented', pi.is_commented, 'is_reviewed', pi.is_reviewed,
                'visit_count', pe.visit_count, 'last_visited_at', pe.last_visited_at
            ),
            'features', pfeat.features,
            'experience', jsonb_build_object(
                'is_visited', pe.visit_count > 0, 'visit_count', pe.visit_count, 'last_visited_at', pe.last_visited_at
            )
        ) as place_data,
        pd.pub_at::TIMESTAMPTZ as published_at
    FROM places_with_data pd
    LEFT JOIN place_interactions pi ON pi.place_id = pd.pid
    LEFT JOIN place_experiences pe ON pe.place_id = pd.pid
    LEFT JOIN place_features pfeat ON pfeat.place_id = pd.pid
    ORDER BY pd.pub_at DESC;
END;
$$;

-- 4. v3_get_places_by_social_region
DROP FUNCTION IF EXISTS public.v3_get_places_by_social_region(TEXT, TEXT, INT, INT);
DROP FUNCTION IF EXISTS public.v3_get_places_by_social_region(TEXT, TEXT, INT, INT, BOOLEAN);

CREATE OR REPLACE FUNCTION public.v3_get_places_by_social_region(
    p_region_name TEXT,
    p_service TEXT DEFAULT NULL,
    p_limit INT DEFAULT 20,
    p_offset INT DEFAULT 0,
    p_visited_only BOOLEAN DEFAULT FALSE
)
RETURNS TABLE (
    place_id VARCHAR,
    place_data JSONB,
    published_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
#variable_conflict use_column
DECLARE
    v_user_id UUID := auth.uid();
BEGIN
    RETURN QUERY
    WITH 
    unique_places AS (
        SELECT DISTINCT ON (pf.place_id)
            pf.place_id as pid,
            pf.published_at as pub_at
        FROM tbl_place_features pf
        JOIN tbl_place p ON pf.place_id = p.id
        WHERE pf.platform_type = 'social'
          AND pf.status = 'active'
          AND p.group1 = p_region_name
          AND (p_service IS NULL OR pf.metadata->>'service' = p_service)
          AND (
            NOT p_visited_only 
            OR (v_user_id IS NOT NULL AND EXISTS (
              SELECT 1 FROM tbl_visited v 
              WHERE v.user_id = v_user_id 
              AND v.place_id = pf.place_id
            ))
          )
        ORDER BY pf.place_id, pf.published_at DESC
    ),
    paged_places AS (
        SELECT up.pid, up.pub_at
        FROM unique_places up
        ORDER BY up.pub_at DESC
        LIMIT p_limit OFFSET p_offset
    ),
    places_with_data AS (
        SELECT 
            pp.pid, pp.pub_at,
            p.id, p.name, p.group1, p.group2, p.group3, p.road, p.category,
            p.road_address, p.address, p.phone, p.visitor_reviews_total, p.visitor_reviews_score,
            p.x, p.y, p.images, p.static_map_url, p.keyword_list, p.visitor_review_medias_total,
            p.menus, p.place_images, p.updated_at as place_updated_at, p.created_at as place_created_at,
            p.is_franchise, p.conveniences, p.homepage,
            calculate_menu_avg_price(p.menus) as avg_price
        FROM paged_places pp
        JOIN tbl_place p ON pp.pid = p.id
    ),
    place_interactions AS (
        SELECT 
            pd.pid as place_id,
            COALESCE(lk.liked_count, 0) as liked_count,
            COALESCE(sv.saved_count, 0) as saved_count,
            COALESCE(cm.comment_count, 0) as comment_count,
            COALESCE(rv.reviews_count, 0) as reviews_count,
            COALESCE(my_lk.is_liked, false) as is_liked,
            COALESCE(my_sv.is_saved, false) as is_saved,
            COALESCE(my_cm.is_commented, false) as is_commented,
            COALESCE(my_rv.is_reviewed, false) as is_reviewed
        FROM places_with_data pd
        LEFT JOIN LATERAL (SELECT count(*)::int as liked_count FROM public.tbl_like WHERE liked_id = pd.pid AND liked_type = 'place' AND liked = true) lk ON true
        LEFT JOIN LATERAL (SELECT count(*)::int as saved_count FROM public.tbl_save WHERE saved_id = pd.pid AND saved_type = 'place' AND saved = true) sv ON true
        LEFT JOIN LATERAL (SELECT count(*)::int as comment_count FROM public.tbl_comment_for_place WHERE business_id = pd.pid AND is_active = true) cm ON true
        LEFT JOIN LATERAL (SELECT count(*)::int as reviews_count FROM public.tbl_place_user_review WHERE place_id = pd.pid AND is_active = true) rv ON true
        LEFT JOIN LATERAL (SELECT liked as is_liked FROM public.tbl_like WHERE liked_id = pd.pid AND liked_type = 'place' AND user_id = v_user_id LIMIT 1) my_lk ON true
        LEFT JOIN LATERAL (SELECT saved as is_saved FROM public.tbl_save WHERE saved_id = pd.pid AND saved_type = 'place' AND user_id = v_user_id LIMIT 1) my_sv ON true
        LEFT JOIN LATERAL (SELECT true as is_commented FROM public.tbl_comment_for_place WHERE business_id = pd.pid AND user_id = v_user_id AND is_active = true LIMIT 1) my_cm ON true
        LEFT JOIN LATERAL (SELECT true as is_reviewed FROM public.tbl_place_user_review WHERE place_id = pd.pid AND user_id = v_user_id AND is_active = true LIMIT 1) my_rv ON true
    ),
    place_experiences AS (
        SELECT 
            pd.pid as place_id,
            COALESCE(v.visit_count, 0) as visit_count,
            v.last_visited_at
        FROM places_with_data pd
        LEFT JOIN LATERAL (
            SELECT count(*)::int as visit_count, max(visited_at) as last_visited_at
            FROM public.tbl_visited WHERE user_id = v_user_id AND place_id = pd.pid
        ) v ON true
    ),
    place_features AS (
        SELECT 
            pd.pid as place_id,
            COALESCE(pf.features, '[]'::jsonb) as features
        FROM places_with_data pd
        LEFT JOIN LATERAL (
            SELECT jsonb_agg(to_jsonb(af.*)) as features
            FROM (
                SELECT pf.id::text as id, pf.title, pf.status, pf.user_id::text, pf.metadata,
                    pf.created_at, pf.updated_at, pf.content_url, pf.is_verified, pf.published_at, pf.platform_type
                FROM public.tbl_place_features pf WHERE pf.place_id = pd.pid AND pf.status = 'active'
                UNION ALL
                SELECT nf.folder_id::text, nf.name, 'active', NULL::text,
                    jsonb_build_object('url', NULL, 'title', nf.name, 'domain', 'naver', 'description', nf.memo),
                    nf.created_at, nf.updated_at, NULL, false, nf.created_at, 'folder'
                FROM public.tbl_naver_folder_place nfp
                JOIN public.tbl_naver_folder nf ON nfp.folder_id = nf.folder_id WHERE nfp.place_id = pd.pid
                UNION ALL
                SELECT f.id, f.title, 'active', f.owner_id::text,
                    jsonb_build_object('url', '/folder/' || f.id, 'title', f.title, 'domain', 'feature', 'description', f.description),
                    f.created_at, f.updated_at, '/folder/' || f.id, false, f.created_at, 'public_user'
                FROM public.tbl_folder_place fp
                JOIN public.tbl_folder f ON fp.folder_id = f.id
                WHERE fp.place_id = pd.pid AND fp.deleted_at IS NULL AND f.permission = 'public' AND f.is_hidden = FALSE
            ) af
        ) pf ON true
    )
    SELECT 
        pd.pid::VARCHAR as place_id,
        jsonb_build_object(
            'id', pd.id, 'name', pd.name, 'group1', pd.group1, 'group2', pd.group2, 'group3', pd.group3,
            'road', pd.road, 'category', pd.category, 'road_address', pd.road_address, 'address', pd.address,
            'phone', pd.phone, 'visitor_reviews_total', pd.visitor_reviews_total, 'visitor_reviews_score', pd.visitor_reviews_score,
            'x', pd.x, 'y', pd.y, 'images', pd.images, 'image_urls', pd.images,
            'static_map_url', pd.static_map_url, 'keyword_list', pd.keyword_list,
            'visitor_review_medias_total', pd.visitor_review_medias_total, 'menus', pd.menus, 'avg_price', pd.avg_price,
            'place_images', pd.place_images, 'updated_at', pd.place_updated_at, 'created_at', pd.place_created_at,
            'is_franchise', pd.is_franchise, 'conveniences', pd.conveniences, 'homepage', pd.homepage,
            'interaction', jsonb_build_object(
                'place_liked_count', pi.liked_count, 'place_saved_count', pi.saved_count,
                'is_liked', pi.is_liked, 'is_saved', pi.is_saved,
                'place_comment_count', pi.comment_count, 'place_reviews_count', pi.reviews_count,
                'is_commented', pi.is_commented, 'is_reviewed', pi.is_reviewed,
                'visit_count', pe.visit_count, 'last_visited_at', pe.last_visited_at
            ),
            'features', pfeat.features,
            'experience', jsonb_build_object(
                'is_visited', pe.visit_count > 0, 'visit_count', pe.visit_count, 'last_visited_at', pe.last_visited_at
            )
        ) as place_data,
        pd.pub_at::TIMESTAMPTZ as published_at
    FROM places_with_data pd
    LEFT JOIN place_interactions pi ON pi.place_id = pd.pid
    LEFT JOIN place_experiences pe ON pe.place_id = pd.pid
    LEFT JOIN place_features pfeat ON pfeat.place_id = pd.pid
    ORDER BY pd.pub_at DESC;
END;
$$;

-- 5. v3_get_places_by_region
DROP FUNCTION IF EXISTS public.v3_get_places_by_region(TEXT, TEXT, INT, INT);
DROP FUNCTION IF EXISTS public.v3_get_places_by_region(TEXT, TEXT, INT, INT, BOOLEAN);

CREATE OR REPLACE FUNCTION public.v3_get_places_by_region(
    p_region_name TEXT,
    p_source TEXT DEFAULT NULL,
    p_limit INT DEFAULT 20,
    p_offset INT DEFAULT 0,
    p_visited_only BOOLEAN DEFAULT FALSE
)
RETURNS TABLE (
    place_id VARCHAR,
    place_data JSONB,
    published_at TIMESTAMPTZ,
    src TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
#variable_conflict use_column
DECLARE
    v_user_id UUID := auth.uid();
BEGIN
    RETURN QUERY
    WITH 
    all_source_places AS (
        -- 1. 커뮤니티
        SELECT pf.place_id, 'community'::text as src, pf.published_at, pf.title
        FROM tbl_place_features pf
        JOIN tbl_place p ON pf.place_id = p.id
        WHERE pf.platform_type = 'community' AND pf.status = 'active' AND p.group1 = p_region_name AND (p_source IS NULL OR p_source = 'community')
        UNION ALL
        -- 2. 유튜브
        SELECT pf.place_id, 'youtube'::text as src, pf.published_at, pf.title
        FROM tbl_place_features pf
        JOIN tbl_place p ON pf.place_id = p.id
        WHERE pf.platform_type = 'youtube' AND pf.status = 'active' AND p.group1 = p_region_name AND (p_source IS NULL OR p_source = 'youtube')
        UNION ALL
        -- 3. 플레이스 (네이버 폴더)
        SELECT nfp.place_id, 'folder'::text as src, p.updated_at as published_at, f.name as title
        FROM tbl_naver_folder_place nfp
        JOIN tbl_naver_folder f ON nfp.folder_id = f.folder_id
        JOIN tbl_place p ON nfp.place_id = p.id
        WHERE p.group1 = p_region_name AND (p_source IS NULL OR p_source = 'folder')
        UNION ALL
        -- 4. 맛탐정 (공개 폴더)
        SELECT fp.place_id, 'detective'::text as src, p.updated_at as published_at, f.title as title
        FROM tbl_folder_place fp
        JOIN tbl_folder f ON fp.folder_id = f.id
        JOIN tbl_place p ON fp.place_id = p.id
        WHERE f.permission = 'public' AND f.is_hidden = FALSE AND fp.deleted_at IS NULL AND p.group1 = p_region_name AND (p_source IS NULL OR p_source = 'detective')
    ),
    unique_places AS (
        SELECT DISTINCT ON (asp.place_id)
            asp.place_id as pid,
            asp.published_at as pub_at,
            asp.src,
            asp.title
        FROM all_source_places asp
        WHERE (
            NOT p_visited_only 
            OR (v_user_id IS NOT NULL AND EXISTS (
              SELECT 1 FROM tbl_visited v 
              WHERE v.user_id = v_user_id 
              AND v.place_id = asp.place_id
            ))
        )
        ORDER BY asp.place_id, asp.published_at DESC
    ),
    paged_places AS (
        SELECT up.pid, up.pub_at, up.src, up.title
        FROM unique_places up
        ORDER BY up.pub_at DESC
        LIMIT p_limit OFFSET p_offset
    ),
    places_with_data AS (
        SELECT 
            pp.pid, pp.pub_at, pp.src, pp.title as source_title,
            p.id, p.name, p.group1, p.group2, p.group3, p.road, p.category,
            p.road_address, p.address, p.phone, p.visitor_reviews_total, p.visitor_reviews_score,
            p.x, p.y, p.images, p.static_map_url, p.keyword_list, p.visitor_review_medias_total,
            p.menus, p.place_images, p.updated_at as place_updated_at, p.created_at as place_created_at,
            p.is_franchise, p.conveniences, p.homepage,
            calculate_menu_avg_price(p.menus) as avg_price,
            COALESCE(NULLIF(p.images, '{}'), ARRAY_REMOVE(ARRAY[p.place_images[1]], NULL), '{}') as final_images
        FROM paged_places pp
        JOIN tbl_place p ON pp.pid = p.id
    ),
    place_interactions AS (
        SELECT 
            pd.pid as place_id,
            COALESCE(lk.liked_count, 0) as liked_count,
            COALESCE(sv.saved_count, 0) as saved_count,
            COALESCE(cm.comment_count, 0) as comment_count,
            COALESCE(rv.reviews_count, 0) as reviews_count,
            COALESCE(my_lk.is_liked, false) as is_liked,
            COALESCE(my_sv.is_saved, false) as is_saved,
            COALESCE(my_cm.is_commented, false) as is_commented,
            COALESCE(my_rv.is_reviewed, false) as is_reviewed
        FROM places_with_data pd
        LEFT JOIN LATERAL (SELECT count(*)::int as liked_count FROM public.tbl_like WHERE liked_id = pd.pid AND liked_type = 'place' AND liked = true) lk ON true
        LEFT JOIN LATERAL (SELECT count(*)::int as saved_count FROM public.tbl_save WHERE saved_id = pd.pid AND saved_type = 'place' AND saved = true) sv ON true
        LEFT JOIN LATERAL (SELECT count(*)::int as comment_count FROM public.tbl_comment_for_place WHERE business_id = pd.pid AND is_active = true) cm ON true
        LEFT JOIN LATERAL (SELECT count(*)::int as reviews_count FROM public.tbl_place_user_review WHERE place_id = pd.pid AND is_active = true) rv ON true
        LEFT JOIN LATERAL (SELECT liked as is_liked FROM public.tbl_like WHERE liked_id = pd.pid AND liked_type = 'place' AND user_id = v_user_id LIMIT 1) my_lk ON true
        LEFT JOIN LATERAL (SELECT saved as is_saved FROM public.tbl_save WHERE saved_id = pd.pid AND saved_type = 'place' AND user_id = v_user_id LIMIT 1) my_sv ON true
        LEFT JOIN LATERAL (SELECT true as is_commented FROM public.tbl_comment_for_place WHERE business_id = pd.pid AND user_id = v_user_id AND is_active = true LIMIT 1) my_cm ON true
        LEFT JOIN LATERAL (SELECT true as is_reviewed FROM public.tbl_place_user_review WHERE place_id = pd.pid AND user_id = v_user_id AND is_active = true LIMIT 1) my_rv ON true
    ),
    place_experiences AS (
        SELECT 
            pd.pid as place_id,
            COALESCE(v.visit_count, 0) as visit_count,
            v.last_visited_at
        FROM places_with_data pd
        LEFT JOIN LATERAL (
            SELECT count(*)::int as visit_count, max(visited_at) as last_visited_at
            FROM public.tbl_visited WHERE user_id = v_user_id AND place_id = pd.pid
        ) v ON true
    ),
    place_features AS (
        SELECT 
            pd.pid as place_id,
            COALESCE(pf.features, '[]'::jsonb) as features
        FROM places_with_data pd
        LEFT JOIN LATERAL (
            SELECT jsonb_agg(to_jsonb(af.*)) as features
            FROM (
                SELECT pf.id::text as id, pf.title, pf.status, pf.user_id::text, pf.metadata,
                    pf.created_at, pf.updated_at, pf.content_url, pf.is_verified, pf.published_at, pf.platform_type
                FROM public.tbl_place_features pf WHERE pf.place_id = pd.pid AND pf.status = 'active'
                UNION ALL
                SELECT nf.folder_id::text, nf.name, 'active', NULL::text,
                    jsonb_build_object('url', NULL, 'title', nf.name, 'domain', 'naver', 'description', nf.memo),
                    nf.created_at, nf.updated_at, NULL, false, nf.created_at, 'folder'
                FROM public.tbl_naver_folder_place nfp
                JOIN public.tbl_naver_folder nf ON nfp.folder_id = nf.folder_id WHERE nfp.place_id = pd.pid
                UNION ALL
                SELECT f.id, f.title, 'active', f.owner_id::text,
                    jsonb_build_object('url', '/folder/' || f.id, 'title', f.title, 'domain', 'feature', 'description', f.description),
                    f.created_at, f.updated_at, '/folder/' || f.id, false, f.created_at, 'public_user'
                FROM public.tbl_folder_place fp
                JOIN public.tbl_folder f ON fp.folder_id = f.id
                WHERE fp.place_id = pd.pid AND fp.deleted_at IS NULL AND f.permission = 'public' AND f.is_hidden = FALSE
            ) af
        ) pf ON true
    ),
    place_voted AS (
        SELECT 
            pd.pid as place_id,
            (SELECT (v->>'description')::text FROM tbl_place_analysis a, jsonb_array_elements(a.voted) v WHERE a.business_id = pd.pid LIMIT 1) as voted_summary_text
        FROM places_with_data pd
    )
    SELECT 
        pd.pid::VARCHAR as place_id,
        jsonb_build_object(
            'id', pd.id, 'name', pd.name, 'group1', pd.group1, 'group2', pd.group2, 'group3', pd.group3,
            'road', pd.road, 'category', pd.category, 'road_address', pd.road_address, 'address', pd.address,
            'phone', pd.phone, 'visitor_reviews_total', pd.visitor_reviews_total, 'visitor_reviews_score', pd.visitor_reviews_score,
            'x', pd.x, 'y', pd.y, 'images', pd.final_images, 'image_urls', pd.final_images,
            'static_map_url', pd.static_map_url, 'keyword_list', pd.keyword_list,
            'visitor_review_medias_total', pd.visitor_review_medias_total, 'menus', pd.menus, 'avg_price', pd.avg_price,
            'place_images', pd.place_images, 'updated_at', pd.place_updated_at, 'created_at', pd.place_created_at,
            'is_franchise', pd.is_franchise, 'conveniences', pd.conveniences, 'homepage', pd.homepage,
            'voted_summary_text', pv.voted_summary_text,
            'interaction', jsonb_build_object(
                'place_liked_count', pi.liked_count, 'place_saved_count', pi.saved_count,
                'is_liked', pi.is_liked, 'is_saved', pi.is_saved,
                'place_comment_count', pi.comment_count, 'place_reviews_count', pi.reviews_count,
                'is_commented', pi.is_commented, 'is_reviewed', pi.is_reviewed,
                'visit_count', pe.visit_count, 'last_visited_at', pe.last_visited_at
            ),
            'features', pfeat.features,
            'experience', jsonb_build_object(
                'is_visited', pe.visit_count > 0, 'visit_count', pe.visit_count, 'last_visited_at', pe.last_visited_at
            )
        ) as place_data,
        pd.pub_at::TIMESTAMPTZ as published_at,
        pd.src::TEXT as src
    FROM places_with_data pd
    LEFT JOIN place_interactions pi ON pi.place_id = pd.pid
    LEFT JOIN place_experiences pe ON pe.place_id = pd.pid
    LEFT JOIN place_features pfeat ON pfeat.place_id = pd.pid
    LEFT JOIN place_voted pv ON pv.place_id = pd.pid
    ORDER BY pd.pub_at DESC;
END;
$$;

-- 6. v1_get_folder_places
DROP FUNCTION IF EXISTS public.v1_get_folder_places(VARCHAR, INT, INT);
DROP FUNCTION IF EXISTS public.v1_get_folder_places(VARCHAR, INT, INT, BOOLEAN);

CREATE OR REPLACE FUNCTION public.v1_get_folder_places(
    p_folder_id VARCHAR,
    p_limit INT DEFAULT 20,
    p_offset INT DEFAULT 0,
    p_visited_only BOOLEAN DEFAULT FALSE
)
RETURNS TABLE (
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
        (to_jsonb(pl) - '{themes, street_panorama, category_code_list, visitor_review_stats, algo_avg_len, algo_stdev_len, algo_revisit_rate, algo_media_ratio, algo_avg_views, algo_recency_score, algo_engagement_score, algo_length_variation_index, algo_loyalty_index, algo_growth_rate_1m, algo_growth_rate_2m, algo_growth_rate_3m}'::text[] || jsonb_build_object('image_urls', pl.images)) AS p_data,
        fp.created_at::TIMESTAMPTZ AS a_at,
        fp.comment
    FROM public.tbl_folder_place fp
    JOIN public.tbl_place pl ON fp.place_id = pl.id
    WHERE fp.folder_id = p_folder_id 
      AND fp.deleted_at IS NULL
      AND (
        NOT p_visited_only 
        OR (v_user_id IS NOT NULL AND EXISTS (
          SELECT 1 FROM tbl_visited v 
          WHERE v.user_id = v_user_id 
          AND v.place_id = fp.place_id
        ))
      )
    ORDER BY fp.created_at DESC
    LIMIT p_limit OFFSET p_offset;
END;
$$;
