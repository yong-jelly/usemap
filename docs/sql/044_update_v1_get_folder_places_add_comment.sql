-- =====================================================
-- 044_update_v1_get_folder_places_add_comment.sql
-- 폴더 장소 목록 조회 시 코멘트 정보 포함
-- 
-- 실행 방법:
--   psql "postgresql://postgres.xyqpggpilgcdsawuvpzn:ZNDqDunnaydr0aFQ@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres" -f docs/sql/044_update_v1_get_folder_places_add_comment.sql
-- =====================================================

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
    ORDER BY fp.created_at DESC
    LIMIT p_limit OFFSET p_offset;
END;
$$;

COMMENT ON FUNCTION public.v1_get_folder_places IS '폴더 내 장소 목록 조회 (코멘트 포함)';
