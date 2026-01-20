-- =====================================================
-- 084_optimize_v3_get_places_by_region.sql
-- v2_get_places_by_region 최적화 버전
-- 
-- 개선 사항:
--   1. v1_common_place_interaction N+1 호출 → LATERAL JOIN 배치 처리
--   2. v1_common_place_features N+1 호출 → LATERAL JOIN 배치 처리
--   3. v1_get_place_experience N+1 호출 → LATERAL JOIN 배치 처리
--   4. calculate_menu_avg_price 중복 호출 제거 (CTE에서 1회 계산)
-- 
-- 인자:
--   @p_region_name: 지역명 (group1)
--   @p_source: 소스 필터 ('community', 'youtube', 'folder', 'detective' 중 선택, 옵션)
--   @p_limit: 조회할 개수 (기본 20)
--   @p_offset: 오프셋 (기본 0)
-- 
-- 실행 방법:
--   psql "postgresql://postgres.xyqpggpilgcdsawuvpzn:ZNDqDunnaydr0aFQ@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres" -f docs/sql/084_optimize_v3_get_places_by_region.sql
-- =====================================================

DROP FUNCTION IF EXISTS public.v3_get_places_by_region(TEXT, TEXT, INT, INT);
CREATE OR REPLACE FUNCTION public.v3_get_places_by_region(
    p_region_name TEXT,
    p_source TEXT DEFAULT NULL,
    p_limit INT DEFAULT 20,
    p_offset INT DEFAULT 0
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
    -- =========================================================
    -- 1단계: 모든 소스에서 장소 수집
    -- =========================================================
    all_source_places AS (
        -- 1. 커뮤니티
        SELECT 
            pf.place_id, 
            'community'::text as src, 
            pf.published_at,
            pf.title
        FROM tbl_place_features pf
        JOIN tbl_place p ON pf.place_id = p.id
        WHERE pf.platform_type = 'community' 
          AND pf.status = 'active'
          AND p.group1 = p_region_name
          AND (p_source IS NULL OR p_source = 'community')

        UNION ALL

        -- 2. 유튜브
        SELECT 
            pf.place_id, 
            'youtube'::text as src, 
            pf.published_at,
            pf.title
        FROM tbl_place_features pf
        JOIN tbl_place p ON pf.place_id = p.id
        WHERE pf.platform_type = 'youtube' 
          AND pf.status = 'active'
          AND p.group1 = p_region_name
          AND (p_source IS NULL OR p_source = 'youtube')

        UNION ALL

        -- 3. 플레이스 (네이버 폴더)
        SELECT 
            nfp.place_id, 
            'folder'::text as src, 
            p.updated_at as published_at,
            f.name as title
        FROM tbl_naver_folder_place nfp
        JOIN tbl_naver_folder f ON nfp.folder_id = f.folder_id
        JOIN tbl_place p ON nfp.place_id = p.id
        WHERE p.group1 = p_region_name
          AND (p_source IS NULL OR p_source = 'folder')

        UNION ALL

        -- 4. 맛탐정 (공개 폴더)
        SELECT 
            fp.place_id, 
            'detective'::text as src, 
            p.updated_at as published_at,
            f.title as title
        FROM tbl_folder_place fp
        JOIN tbl_folder f ON fp.folder_id = f.id
        JOIN tbl_place p ON fp.place_id = p.id
        WHERE f.permission = 'public'
          AND f.is_hidden = FALSE
          AND fp.deleted_at IS NULL
          AND p.group1 = p_region_name
          AND (p_source IS NULL OR p_source = 'detective')
    ),
    
    -- 중복 제거: 한 장소가 여러 소스에 있을 경우 가장 최신 것 선택
    unique_places AS (
        SELECT DISTINCT ON (asp.place_id)
            asp.place_id as pid,
            asp.published_at as pub_at,
            asp.src,
            asp.title
        FROM all_source_places asp
        ORDER BY asp.place_id, asp.published_at DESC
    ),
    
    -- 페이지네이션 적용
    paged_places AS (
        SELECT up.pid, up.pub_at, up.src, up.title
        FROM unique_places up
        ORDER BY up.pub_at DESC
        LIMIT p_limit OFFSET p_offset
    ),
    
    -- 장소 기본 데이터 + avg_price 계산
    places_with_data AS (
        SELECT 
            pp.pid,
            pp.pub_at,
            pp.src,
            pp.title as source_title,
            p.id, p.name, p.group1, p.group2, p.group3, p.road, p.category,
            p.road_address, p.address, p.phone, p.visitor_reviews_total, p.visitor_reviews_score,
            p.x, p.y, p.images, p.static_map_url, p.keyword_list, p.visitor_review_medias_total,
            p.menus, p.place_images, p.updated_at as place_updated_at, p.created_at as place_created_at,
            p.is_franchise, p.conveniences, p.homepage,
            -- avg_price 1회만 계산
            calculate_menu_avg_price(p.menus) as avg_price,
            -- 이미지 처리
            COALESCE(NULLIF(p.images, '{}'), ARRAY_REMOVE(ARRAY[p.place_images[1]], NULL), '{}') as final_images
        FROM paged_places pp
        JOIN tbl_place p ON pp.pid = p.id
    ),
    
    -- =========================================================
    -- 2단계: interaction 데이터 배치 조회
    -- =========================================================
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
        LEFT JOIN LATERAL (
            SELECT count(*)::int as liked_count 
            FROM public.tbl_like 
            WHERE liked_id = pd.pid AND liked_type = 'place' AND liked = true
        ) lk ON true
        LEFT JOIN LATERAL (
            SELECT count(*)::int as saved_count 
            FROM public.tbl_save 
            WHERE saved_id = pd.pid AND saved_type = 'place' AND saved = true
        ) sv ON true
        LEFT JOIN LATERAL (
            SELECT count(*)::int as comment_count 
            FROM public.tbl_comment_for_place 
            WHERE business_id = pd.pid AND is_active = true
        ) cm ON true
        LEFT JOIN LATERAL (
            SELECT count(*)::int as reviews_count 
            FROM public.tbl_place_user_review 
            WHERE place_id = pd.pid AND is_active = true
        ) rv ON true
        LEFT JOIN LATERAL (
            SELECT liked as is_liked 
            FROM public.tbl_like 
            WHERE liked_id = pd.pid AND liked_type = 'place' AND user_id = v_user_id
            LIMIT 1
        ) my_lk ON true
        LEFT JOIN LATERAL (
            SELECT saved as is_saved 
            FROM public.tbl_save 
            WHERE saved_id = pd.pid AND saved_type = 'place' AND user_id = v_user_id
            LIMIT 1
        ) my_sv ON true
        LEFT JOIN LATERAL (
            SELECT true as is_commented 
            FROM public.tbl_comment_for_place 
            WHERE business_id = pd.pid AND user_id = v_user_id AND is_active = true
            LIMIT 1
        ) my_cm ON true
        LEFT JOIN LATERAL (
            SELECT true as is_reviewed 
            FROM public.tbl_place_user_review 
            WHERE place_id = pd.pid AND user_id = v_user_id AND is_active = true
            LIMIT 1
        ) my_rv ON true
    ),
    
    -- =========================================================
    -- 3단계: experience(방문) 데이터 배치 조회
    -- =========================================================
    place_experiences AS (
        SELECT 
            pd.pid as place_id,
            COALESCE(v.visit_count, 0) as visit_count,
            v.last_visited_at
        FROM places_with_data pd
        LEFT JOIN LATERAL (
            SELECT count(*)::int as visit_count, max(visited_at) as last_visited_at
            FROM public.tbl_visited
            WHERE user_id = v_user_id AND place_id = pd.pid
        ) v ON true
    ),
    
    -- =========================================================
    -- 4단계: features 배치 조회
    -- =========================================================
    place_features AS (
        SELECT 
            pd.pid as place_id,
            COALESCE(pf.features, '[]'::jsonb) as features
        FROM places_with_data pd
        LEFT JOIN LATERAL (
            SELECT jsonb_agg(to_jsonb(af.*)) as features
            FROM (
                SELECT 
                    pf.id::text as id, pf.title, pf.status, pf.user_id::text, pf.metadata,
                    pf.created_at, pf.updated_at, pf.content_url, pf.is_verified, pf.published_at, pf.platform_type
                FROM public.tbl_place_features pf
                WHERE pf.place_id = pd.pid AND pf.status = 'active'
                
                UNION ALL
                
                SELECT 
                    nf.folder_id::text, nf.name, 'active', NULL::text,
                    jsonb_build_object('url', NULL, 'title', nf.name, 'domain', 'naver', 'description', nf.memo),
                    nf.created_at, nf.updated_at, NULL, false, nf.created_at, 'folder'
                FROM public.tbl_naver_folder_place nfp
                JOIN public.tbl_naver_folder nf ON nfp.folder_id = nf.folder_id
                WHERE nfp.place_id = pd.pid
                
                UNION ALL
                
                SELECT 
                    f.id, f.title, 'active', f.owner_id::text,
                    jsonb_build_object('url', '/folder/' || f.id, 'title', f.title, 'domain', 'feature', 'description', f.description),
                    f.created_at, f.updated_at, '/folder/' || f.id, false, f.created_at, 'public_user'
                FROM public.tbl_folder_place fp
                JOIN public.tbl_folder f ON fp.folder_id = f.id
                WHERE fp.place_id = pd.pid AND fp.deleted_at IS NULL AND f.permission = 'public' AND f.is_hidden = FALSE
            ) af
        ) pf ON true
    ),
    
    -- =========================================================
    -- 5단계: voted_summary_text 배치 조회
    -- =========================================================
    place_voted AS (
        SELECT 
            pd.pid as place_id,
            (
                SELECT (v->>'description')::text
                FROM tbl_place_analysis a, jsonb_array_elements(a.voted) v
                WHERE a.business_id = pd.pid
                LIMIT 1
            ) as voted_summary_text
        FROM places_with_data pd
    )
    
    -- =========================================================
    -- 최종 SELECT
    -- =========================================================
    SELECT 
        pd.pid::VARCHAR as place_id,
        jsonb_build_object(
            'id', pd.id,
            'name', pd.name,
            'group1', pd.group1,
            'group2', pd.group2,
            'group3', pd.group3,
            'road', pd.road,
            'category', pd.category,
            'road_address', pd.road_address,
            'address', pd.address,
            'phone', pd.phone,
            'visitor_reviews_total', pd.visitor_reviews_total,
            'visitor_reviews_score', pd.visitor_reviews_score,
            'x', pd.x,
            'y', pd.y,
            'images', pd.final_images,
            'image_urls', pd.final_images,
            'static_map_url', pd.static_map_url,
            'keyword_list', pd.keyword_list,
            'visitor_review_medias_total', pd.visitor_review_medias_total,
            'menus', pd.menus,
            'avg_price', pd.avg_price,
            'place_images', pd.place_images,
            'updated_at', pd.place_updated_at,
            'created_at', pd.place_created_at,
            'is_franchise', pd.is_franchise,
            'conveniences', pd.conveniences,
            'homepage', pd.homepage,
            'voted_summary_text', pv.voted_summary_text,
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

COMMENT ON FUNCTION public.v3_get_places_by_region IS '지역 통합 장소 조회 v3 - 최적화 버전 (N+1 제거, 배치 처리)';
GRANT EXECUTE ON FUNCTION public.v3_get_places_by_region TO authenticated, anon;
