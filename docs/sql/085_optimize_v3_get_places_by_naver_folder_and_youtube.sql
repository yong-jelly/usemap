-- =====================================================
-- 085_optimize_v3_get_places_by_naver_folder_and_youtube.sql
-- v2_get_places_by_naver_folder, v2_get_places_by_youtube_channel 최적화 버전
-- 
-- 개선 사항:
--   1. v1_common_place_interaction N+1 호출 → LATERAL JOIN 배치 처리
--   2. v1_common_place_features N+1 호출 → LATERAL JOIN 배치 처리
--   3. v1_get_place_experience N+1 호출 → LATERAL JOIN 배치 처리
--   4. calculate_menu_avg_price 중복 호출 제거 (CTE에서 1회 계산)
-- 
-- 실행 방법:
--   psql "postgresql://postgres.xyqpggpilgcdsawuvpzn:ZNDqDunnaydr0aFQ@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres" -f docs/sql/085_optimize_v3_get_places_by_naver_folder_and_youtube.sql
-- =====================================================

-- =====================================================
-- 1. v3_get_places_by_naver_folder
-- =====================================================
DROP FUNCTION IF EXISTS public.v3_get_places_by_naver_folder(BIGINT, INT, INT);
CREATE OR REPLACE FUNCTION public.v3_get_places_by_naver_folder(
    p_folder_id BIGINT,
    p_limit INT DEFAULT 20,
    p_offset INT DEFAULT 0
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
    -- =========================================================
    -- 1단계: 장소 목록 + 기본 데이터 + avg_price 계산
    -- =========================================================
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
        ORDER BY p.visitor_reviews_score DESC NULLS LAST, p.visitor_reviews_total DESC NULLS LAST
        LIMIT p_limit OFFSET p_offset
    ),
    
    -- =========================================================
    -- 2단계: interaction 데이터 배치 조회
    -- =========================================================
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
        LEFT JOIN LATERAL (
            SELECT count(*)::int as liked_count 
            FROM public.tbl_like WHERE liked_id = fp.pid AND liked_type = 'place' AND liked = true
        ) lk ON true
        LEFT JOIN LATERAL (
            SELECT count(*)::int as saved_count 
            FROM public.tbl_save WHERE saved_id = fp.pid AND saved_type = 'place' AND saved = true
        ) sv ON true
        LEFT JOIN LATERAL (
            SELECT count(*)::int as comment_count 
            FROM public.tbl_comment_for_place WHERE business_id = fp.pid AND is_active = true
        ) cm ON true
        LEFT JOIN LATERAL (
            SELECT count(*)::int as reviews_count 
            FROM public.tbl_place_user_review WHERE place_id = fp.pid AND is_active = true
        ) rv ON true
        LEFT JOIN LATERAL (
            SELECT liked as is_liked FROM public.tbl_like 
            WHERE liked_id = fp.pid AND liked_type = 'place' AND user_id = v_user_id LIMIT 1
        ) my_lk ON true
        LEFT JOIN LATERAL (
            SELECT saved as is_saved FROM public.tbl_save 
            WHERE saved_id = fp.pid AND saved_type = 'place' AND user_id = v_user_id LIMIT 1
        ) my_sv ON true
        LEFT JOIN LATERAL (
            SELECT true as is_commented FROM public.tbl_comment_for_place 
            WHERE business_id = fp.pid AND user_id = v_user_id AND is_active = true LIMIT 1
        ) my_cm ON true
        LEFT JOIN LATERAL (
            SELECT true as is_reviewed FROM public.tbl_place_user_review 
            WHERE place_id = fp.pid AND user_id = v_user_id AND is_active = true LIMIT 1
        ) my_rv ON true
    ),
    
    -- =========================================================
    -- 3단계: experience 배치 조회
    -- =========================================================
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
    
    -- =========================================================
    -- 4단계: features 배치 조회
    -- =========================================================
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
    
    -- =========================================================
    -- 최종 SELECT
    -- =========================================================
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

COMMENT ON FUNCTION public.v3_get_places_by_naver_folder IS '네이버 폴더 장소 조회 v3 - 최적화 버전 (N+1 제거, 배치 처리)';
GRANT EXECUTE ON FUNCTION public.v3_get_places_by_naver_folder TO authenticated, anon;


-- =====================================================
-- 2. v3_get_places_by_youtube_channel
-- =====================================================
DROP FUNCTION IF EXISTS public.v3_get_places_by_youtube_channel(TEXT, INT, INT);
CREATE OR REPLACE FUNCTION public.v3_get_places_by_youtube_channel(
    p_channel_id TEXT,
    p_limit INT DEFAULT 20,
    p_offset INT DEFAULT 0
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
    -- =========================================================
    -- 1단계: 유니크 장소 목록 + 기본 데이터 + avg_price 계산
    -- =========================================================
    unique_places AS (
        SELECT DISTINCT ON (f.place_id)
            f.place_id as pid,
            f.published_at as pub_at
        FROM tbl_place_features f
        WHERE f.platform_type = 'youtube'
          AND f.status = 'active'
          AND f.metadata->>'channelId' = p_channel_id
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
            pp.pid,
            pp.pub_at,
            p.id, p.name, p.group1, p.group2, p.group3, p.road, p.category,
            p.road_address, p.address, p.phone, p.visitor_reviews_total, p.visitor_reviews_score,
            p.x, p.y, p.images, p.static_map_url, p.keyword_list, p.visitor_review_medias_total,
            p.menus, p.place_images, p.updated_at as place_updated_at, p.created_at as place_created_at,
            p.is_franchise, p.conveniences, p.homepage,
            calculate_menu_avg_price(p.menus) as avg_price
        FROM paged_places pp
        JOIN tbl_place p ON pp.pid = p.id
    ),
    
    -- =========================================================
    -- 2단계: interaction 데이터 배치 조회
    -- =========================================================
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
        LEFT JOIN LATERAL (
            SELECT count(*)::int as liked_count 
            FROM public.tbl_like WHERE liked_id = cp.pid AND liked_type = 'place' AND liked = true
        ) lk ON true
        LEFT JOIN LATERAL (
            SELECT count(*)::int as saved_count 
            FROM public.tbl_save WHERE saved_id = cp.pid AND saved_type = 'place' AND saved = true
        ) sv ON true
        LEFT JOIN LATERAL (
            SELECT count(*)::int as comment_count 
            FROM public.tbl_comment_for_place WHERE business_id = cp.pid AND is_active = true
        ) cm ON true
        LEFT JOIN LATERAL (
            SELECT count(*)::int as reviews_count 
            FROM public.tbl_place_user_review WHERE place_id = cp.pid AND is_active = true
        ) rv ON true
        LEFT JOIN LATERAL (
            SELECT liked as is_liked FROM public.tbl_like 
            WHERE liked_id = cp.pid AND liked_type = 'place' AND user_id = v_user_id LIMIT 1
        ) my_lk ON true
        LEFT JOIN LATERAL (
            SELECT saved as is_saved FROM public.tbl_save 
            WHERE saved_id = cp.pid AND saved_type = 'place' AND user_id = v_user_id LIMIT 1
        ) my_sv ON true
        LEFT JOIN LATERAL (
            SELECT true as is_commented FROM public.tbl_comment_for_place 
            WHERE business_id = cp.pid AND user_id = v_user_id AND is_active = true LIMIT 1
        ) my_cm ON true
        LEFT JOIN LATERAL (
            SELECT true as is_reviewed FROM public.tbl_place_user_review 
            WHERE place_id = cp.pid AND user_id = v_user_id AND is_active = true LIMIT 1
        ) my_rv ON true
    ),
    
    -- =========================================================
    -- 3단계: experience 배치 조회
    -- =========================================================
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
    
    -- =========================================================
    -- 4단계: features 배치 조회
    -- =========================================================
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
    
    -- =========================================================
    -- 최종 SELECT
    -- =========================================================
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

COMMENT ON FUNCTION public.v3_get_places_by_youtube_channel IS '유튜브 채널 장소 조회 v3 - 최적화 버전 (N+1 제거, 배치 처리)';
GRANT EXECUTE ON FUNCTION public.v3_get_places_by_youtube_channel TO authenticated, anon;
