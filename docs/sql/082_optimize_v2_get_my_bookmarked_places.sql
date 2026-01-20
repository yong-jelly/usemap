-- =====================================================
-- 082_optimize_v2_get_my_bookmarked_places.sql
-- v1_get_my_bookmarked_places 최적화 버전
-- 
-- 개선 사항:
--   1. interaction 데이터 배치 조회 (좋아요, 저장, 댓글, 리뷰 수)
--   2. experience (방문) 데이터 배치 조회
--   3. features 배치 조회
--   4. avg_price 1회 계산
-- 
-- 인자:
--   @p_limit: 조회할 개수 (기본 20)
--   @p_offset: 오프셋 (기본 0)
-- 
-- 실행 방법:
--   psql "postgresql://postgres.xyqpggpilgcdsawuvpzn:ZNDqDunnaydr0aFQ@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres" -f docs/sql/082_optimize_v2_get_my_bookmarked_places.sql
-- =====================================================

DROP FUNCTION IF EXISTS public.v2_get_my_bookmarked_places(INT, INT);
CREATE OR REPLACE FUNCTION public.v2_get_my_bookmarked_places(
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
    v_user_id UUID := auth.uid();
BEGIN
    IF v_user_id IS NULL THEN
        RETURN;
    END IF;

    RETURN QUERY
    WITH 
    -- =========================================================
    -- 1단계: 저장된 장소 목록 조회 + 기본 데이터
    -- =========================================================
    saved_places AS (
        SELECT 
            s.saved_id as pid,
            s.created_at as saved_at,
            p.id, p.name, p.group1, p.group2, p.group3, p.road, p.category,
            p.road_address, p.address, p.phone, p.visitor_reviews_total, p.visitor_reviews_score,
            p.x, p.y, p.images, p.static_map_url, p.keyword_list, p.visitor_review_medias_total,
            p.menus, p.place_images, p.updated_at as place_updated_at, p.created_at as place_created_at,
            p.is_franchise, p.conveniences, p.homepage,
            -- avg_price 1회만 계산
            calculate_menu_avg_price(p.menus) as avg_price
        FROM public.tbl_save s
        JOIN public.tbl_place p ON s.saved_id = p.id
        WHERE s.user_id = v_user_id 
          AND s.saved_type = 'place' 
          AND s.saved = true
        ORDER BY s.created_at DESC
        LIMIT p_limit OFFSET p_offset
    ),
    
    -- =========================================================
    -- 2단계: interaction 데이터 배치 조회
    -- =========================================================
    place_interactions AS (
        SELECT 
            sp.pid as place_id,
            COALESCE(lk.liked_count, 0) as liked_count,
            COALESCE(sv.saved_count, 0) as saved_count,
            COALESCE(cm.comment_count, 0) as comment_count,
            COALESCE(rv.reviews_count, 0) as reviews_count,
            COALESCE(my_lk.is_liked, false) as is_liked,
            COALESCE(my_sv.is_saved, false) as is_saved,
            COALESCE(my_cm.is_commented, false) as is_commented,
            COALESCE(my_rv.is_reviewed, false) as is_reviewed
        FROM saved_places sp
        LEFT JOIN LATERAL (
            SELECT count(*)::int as liked_count 
            FROM public.tbl_like 
            WHERE liked_id = sp.pid AND liked_type = 'place' AND liked = true
        ) lk ON true
        LEFT JOIN LATERAL (
            SELECT count(*)::int as saved_count 
            FROM public.tbl_save 
            WHERE saved_id = sp.pid AND saved_type = 'place' AND saved = true
        ) sv ON true
        LEFT JOIN LATERAL (
            SELECT count(*)::int as comment_count 
            FROM public.tbl_comment_for_place 
            WHERE business_id = sp.pid AND is_active = true
        ) cm ON true
        LEFT JOIN LATERAL (
            SELECT count(*)::int as reviews_count 
            FROM public.tbl_place_user_review 
            WHERE place_id = sp.pid AND is_active = true
        ) rv ON true
        LEFT JOIN LATERAL (
            SELECT liked as is_liked 
            FROM public.tbl_like 
            WHERE liked_id = sp.pid AND liked_type = 'place' AND user_id = v_user_id
            LIMIT 1
        ) my_lk ON true
        LEFT JOIN LATERAL (
            SELECT saved as is_saved 
            FROM public.tbl_save 
            WHERE saved_id = sp.pid AND saved_type = 'place' AND user_id = v_user_id
            LIMIT 1
        ) my_sv ON true
        LEFT JOIN LATERAL (
            SELECT true as is_commented 
            FROM public.tbl_comment_for_place 
            WHERE business_id = sp.pid AND user_id = v_user_id AND is_active = true
            LIMIT 1
        ) my_cm ON true
        LEFT JOIN LATERAL (
            SELECT true as is_reviewed 
            FROM public.tbl_place_user_review 
            WHERE place_id = sp.pid AND user_id = v_user_id AND is_active = true
            LIMIT 1
        ) my_rv ON true
    ),
    
    -- =========================================================
    -- 3단계: experience(방문) 데이터 배치 조회
    -- =========================================================
    place_experiences AS (
        SELECT 
            sp.pid as place_id,
            COALESCE(v.visit_count, 0) as visit_count,
            v.last_visited_at
        FROM saved_places sp
        LEFT JOIN LATERAL (
            SELECT count(*)::int as visit_count, max(visited_at) as last_visited_at
            FROM public.tbl_visited
            WHERE user_id = v_user_id AND place_id = sp.pid
        ) v ON true
    ),
    
    -- =========================================================
    -- 4단계: features 배치 조회
    -- =========================================================
    place_features AS (
        SELECT 
            sp.pid as place_id,
            COALESCE(pf.features, '[]'::jsonb) as features
        FROM saved_places sp
        LEFT JOIN LATERAL (
            SELECT jsonb_agg(to_jsonb(af.*)) as features
            FROM (
                SELECT 
                    pf.id::text as id, pf.title, pf.status, pf.user_id::text, pf.metadata,
                    pf.created_at, pf.updated_at, pf.content_url, pf.is_verified, pf.published_at, pf.platform_type
                FROM public.tbl_place_features pf
                WHERE pf.place_id = sp.pid AND pf.status = 'active'
                
                UNION ALL
                
                SELECT 
                    nf.folder_id::text, nf.name, 'active', NULL::text,
                    jsonb_build_object('url', NULL, 'title', nf.name, 'domain', 'naver', 'description', nf.memo),
                    nf.created_at, nf.updated_at, NULL, false, nf.created_at, 'folder'
                FROM public.tbl_naver_folder_place nfp
                JOIN public.tbl_naver_folder nf ON nfp.folder_id = nf.folder_id
                WHERE nfp.place_id = sp.pid
                
                UNION ALL
                
                SELECT 
                    f.id, f.title, 'active', f.owner_id::text,
                    jsonb_build_object('url', '/folder/' || f.id, 'title', f.title, 'domain', 'feature', 'description', f.description),
                    f.created_at, f.updated_at, '/folder/' || f.id, false, f.created_at, 'public_user'
                FROM public.tbl_folder_place fp
                JOIN public.tbl_folder f ON fp.folder_id = f.id
                WHERE fp.place_id = sp.pid AND fp.deleted_at IS NULL AND f.permission = 'public' AND f.is_hidden = FALSE
            ) af
        ) pf ON true
    )
    
    -- =========================================================
    -- 최종 SELECT
    -- =========================================================
    SELECT 
        sp.pid::VARCHAR as place_id,
        jsonb_build_object(
            'id', sp.id,
            'name', sp.name,
            'group1', sp.group1,
            'group2', sp.group2,
            'group3', sp.group3,
            'road', sp.road,
            'category', sp.category,
            'road_address', sp.road_address,
            'address', sp.address,
            'phone', sp.phone,
            'visitor_reviews_total', sp.visitor_reviews_total,
            'visitor_reviews_score', sp.visitor_reviews_score,
            'x', sp.x,
            'y', sp.y,
            'images', sp.images,
            'image_urls', sp.images,
            'static_map_url', sp.static_map_url,
            'keyword_list', sp.keyword_list,
            'visitor_review_medias_total', sp.visitor_review_medias_total,
            'menus', sp.menus,
            'avg_price', sp.avg_price,
            'place_images', sp.place_images,
            'updated_at', sp.place_updated_at,
            'created_at', sp.place_created_at,
            'is_franchise', sp.is_franchise,
            'conveniences', sp.conveniences,
            'homepage', sp.homepage,
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
        sp.saved_at::TIMESTAMPTZ as added_at
    FROM saved_places sp
    LEFT JOIN place_interactions pi ON pi.place_id = sp.pid
    LEFT JOIN place_experiences pe ON pe.place_id = sp.pid
    LEFT JOIN place_features pfeat ON pfeat.place_id = sp.pid
    ORDER BY sp.saved_at DESC;
END;
$$;

COMMENT ON FUNCTION public.v2_get_my_bookmarked_places IS '내 저장 장소 조회 v2 - 최적화 버전 (interaction, features, experience 포함)';
GRANT EXECUTE ON FUNCTION public.v2_get_my_bookmarked_places TO authenticated;
