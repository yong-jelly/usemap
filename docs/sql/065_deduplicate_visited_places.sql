-- =====================================================
-- 065_deduplicate_visited_places.sql
-- 내가 방문한 장소 목록 조회 시 장소 중복 제거 (가장 최신 방문 기준 1개만 노출)
-- 
-- 실행 방법:
--   psql "postgresql://postgres.xyqpggpilgcdsawuvpzn:ZNDqDunnaydr0aFQ@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres" -f docs/sql/065_deduplicate_visited_places.sql
-- =====================================================

DROP FUNCTION IF EXISTS public.v1_list_visited_place(integer, integer);

CREATE OR REPLACE FUNCTION public.v1_list_visited_place(
    p_limit integer DEFAULT 20, 
    p_offset integer DEFAULT 0
)
RETURNS TABLE (
    place_id character varying,
    place_data jsonb,
    added_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, public
AS $$
BEGIN
    RETURN QUERY
    WITH latest_visits AS (
        -- 사용자별 장소당 가장 최근 방문일만 추출
        SELECT 
            v.place_id,
            MAX(v.visited_at) as max_visited_at
        FROM public.tbl_visited v
        WHERE v.user_id = auth.uid()
        GROUP BY v.place_id
    )
    SELECT 
        p.id as place_id,
        (to_jsonb(p.*) || jsonb_build_object(
            'image_urls', p.images, 
            'avg_price', calculate_menu_avg_price(p.menus),
            'interaction', public.v1_common_place_interaction(p.id),
            'features', public.v1_common_place_features(p.id),
            'experience', public.v1_get_place_experience(p.id)
        )) as place_data,
        lv.max_visited_at as added_at
    FROM latest_visits lv
    JOIN public.tbl_place p ON lv.place_id = p.id
    ORDER BY lv.max_visited_at DESC
    LIMIT p_limit OFFSET p_offset;
END;
$$;

GRANT EXECUTE ON FUNCTION public.v1_list_visited_place(integer, integer) TO authenticated;
