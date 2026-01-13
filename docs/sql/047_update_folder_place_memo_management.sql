-- =====================================================
-- 047_update_folder_place_memo_management.sql
-- 폴더 내 장소 메모 관리 기능 강화 (수정일 추가 및 누락된 코멘트 복구)
-- 
-- 실행 방법:
--   psql "postgresql://postgres.xyqpggpilgcdsawuvpzn:ZNDqDunnaydr0aFQ@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres" -f docs/sql/047_update_folder_place_memo_management.sql
-- =====================================================

-- 1. tbl_folder_place 테이블에 updated_at 컬럼 추가
ALTER TABLE public.tbl_folder_place 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 2. v1_add_place_to_folder 함수 업데이트 (updated_at 처리 추가)
DROP FUNCTION IF EXISTS public.v1_add_place_to_folder(VARCHAR, VARCHAR, TEXT);
CREATE OR REPLACE FUNCTION public.v1_add_place_to_folder(
    p_folder_id VARCHAR,
    p_place_id VARCHAR,
    p_comment TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
#variable_conflict use_column
DECLARE
    v_user_id UUID;
    v_owner_id UUID;
    v_permission VARCHAR;
    v_permission_write_type INT;
    v_is_subscribed BOOLEAN;
    v_can_write BOOLEAN := FALSE;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION '로그인이 필요합니다.';
    END IF;

    -- 폴더 정보 조회
    SELECT f.owner_id, f.permission, f.permission_write_type 
    INTO v_owner_id, v_permission, v_permission_write_type 
    FROM public.tbl_folder f WHERE f.id = p_folder_id AND f.is_hidden = FALSE;
    
    IF v_owner_id IS NULL THEN
        RAISE EXCEPTION '폴더를 찾을 수 없습니다.';
    END IF;

    -- 권한 체크
    IF v_owner_id = v_user_id THEN
        v_can_write := TRUE;
    ELSIF v_permission = 'invite' AND v_permission_write_type = 1 THEN
        -- invite 폴더이고 공동 편집이 허용된 경우, 구독자인지 확인
        SELECT EXISTS (
            SELECT 1 FROM public.tbl_folder_subscribed 
            WHERE folder_id = p_folder_id AND user_id = v_user_id AND deleted_at IS NULL
        ) INTO v_is_subscribed;
        v_can_write := v_is_subscribed;
    END IF;

    IF NOT v_can_write THEN
        RAISE EXCEPTION '권한이 없습니다.';
    END IF;

    INSERT INTO public.tbl_folder_place (folder_id, user_id, place_id, comment, updated_at)
    VALUES (p_folder_id, v_user_id, p_place_id, p_comment, NOW())
    ON CONFLICT (folder_id, place_id) DO UPDATE 
        SET deleted_at = NULL, 
            user_id = v_user_id,
            comment = COALESCE(p_comment, tbl_folder_place.comment),
            updated_at = NOW();

    -- 카운트 업데이트
    UPDATE public.tbl_folder 
    SET place_count = (SELECT count(*) FROM public.tbl_folder_place WHERE folder_id = p_folder_id AND deleted_at IS NULL),
        updated_at = NOW()
    WHERE id = p_folder_id;

    RETURN TRUE;
END;
$$;

-- 3. v1_get_folder_places 함수 업데이트 (코멘트 및 수정일 포함)
DROP FUNCTION IF EXISTS public.v1_get_folder_places(VARCHAR, INT, INT);
CREATE OR REPLACE FUNCTION public.v1_get_folder_places(
    p_folder_id VARCHAR,
    p_limit INT DEFAULT 20,
    p_offset INT DEFAULT 0
)
RETURNS TABLE (
    place_id VARCHAR,
    place_data JSONB,
    added_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
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
        (to_jsonb(pl) - '{themes, street_panorama, category_code_list, visitor_review_stats, algo_avg_len, algo_stdev_len, algo_revisit_rate, algo_media_ratio, algo_avg_views, algo_recency_score, algo_engagement_score, algo_length_variation_index, algo_loyalty_index, algo_growth_rate_1m, algo_growth_rate_2m, algo_growth_rate_3m}'::text[] || jsonb_build_object(
            'image_urls', pl.images,
            'interaction', public.v1_common_place_interaction(pl.id),
            'features', public.v1_common_place_features(pl.id),
            'experience', jsonb_build_object('is_visited', public.v1_has_visited_place(pl.id))
        )) AS p_data,
        fp.created_at::TIMESTAMPTZ AS a_at,
        fp.updated_at::TIMESTAMPTZ AS u_at,
        fp.comment
    FROM public.tbl_folder_place fp
    JOIN public.tbl_place pl ON fp.place_id = pl.id
    WHERE fp.folder_id = p_folder_id 
      AND fp.deleted_at IS NULL
    ORDER BY fp.created_at DESC
    LIMIT p_limit OFFSET p_offset;
END;
$$;

-- 4. v1_get_my_feed 함수 업데이트 (수정일 정보 포함)
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
    updated_at TIMESTAMPTZ,
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
        feed_data.modified_time::TIMESTAMPTZ as updated_at,
        feed_data.comment::TEXT as comment
    FROM (
        -- 각 소스별 장소 데이터 결합
        SELECT 'folder' as type, fp.folder_id as sid, fp.place_id as pid, fp.created_at::TIMESTAMPTZ as added_time, fp.updated_at::TIMESTAMPTZ as modified_time, NULL::text as meta, fp.comment FROM public.tbl_folder_place fp WHERE fp.deleted_at IS NULL
        UNION ALL
        SELECT 'naver_folder' as type, nfp.folder_id::varchar as sid, nfp.place_id as pid, nf.created_at::TIMESTAMPTZ as added_time, nf.updated_at::TIMESTAMPTZ as modified_time, NULL::text as meta, NULL::text as comment FROM public.tbl_naver_folder_place nfp JOIN public.tbl_naver_folder nf ON nfp.folder_id = nf.folder_id
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
               pf.created_at::TIMESTAMPTZ as modified_time,
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

COMMENT ON FUNCTION public.v1_get_folder_places(VARCHAR, integer, integer) IS '폴더 내 장소 목록 조회 (코멘트 및 수정일 포함)';
COMMENT ON FUNCTION public.v1_get_my_feed(integer, integer, integer, integer) IS '내 피드 조회 (수정일 포함)';
