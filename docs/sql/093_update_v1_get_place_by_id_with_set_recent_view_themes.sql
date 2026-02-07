-- =====================================================
-- 093_update_v1_get_place_by_id_with_set_recent_view_themes.sql
-- v1_get_place_by_id_with_set_recent_view 함수 수정하여 analysis.themes 포함하도록 변경
-- 
-- 인자:
--   @p_business_id: 장소 ID (business_id)
-- 
-- 실행 방법:
--   psql "postgresql://postgres.xyqpggpilgcdsawuvpzn:ZNDqDunnaydr0aFQ@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres" -f docs/sql/093_update_v1_get_place_by_id_with_set_recent_view_themes.sql
-- =====================================================

CREATE OR REPLACE FUNCTION public.v1_get_place_by_id_with_set_recent_view(p_business_id text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public, auth
AS $function$
DECLARE
    v_user_id uuid := auth.uid();
BEGIN
    -- 1. 최근 본 장소 기록 (로그인한 경우)
    IF v_user_id IS NOT NULL THEN
        INSERT INTO public.tbl_recent_view (user_id, content_id, content_type, updated_at, count)
        VALUES (v_user_id, p_business_id, 'place', now(), 1)
        ON CONFLICT (user_id, content_id, content_type) 
        DO UPDATE SET updated_at = now(), count = public.tbl_recent_view.count + 1;
    END IF;

    -- 2. 장소 데이터 반환 (interaction, features, experience 포함)
    -- visitor_review_stats->'analysis'->'votedKeyword'를 voted_keyword 필드로 추출하여 반환
    RETURN (
        SELECT (to_jsonb(p.*) - '{voted_keyword, street_panorama, category_code_list, visitor_review_stats, algo_avg_len, algo_stdev_len, algo_revisit_rate, algo_media_ratio, algo_avg_views, algo_recency_score, algo_engagement_score, algo_length_variation_index, algo_loyalty_index, algo_growth_rate_1m, algo_growth_rate_2m, algo_growth_rate_3m}'::text[]) || jsonb_build_object(
            'interaction', public.v1_common_place_interaction(p.id),
            'features', public.v1_common_place_features(p.id),
            'experience', public.v1_get_place_experience(p.id),
            'voted_keyword', p.visitor_review_stats->'analysis'->'votedKeyword'
        )
        FROM public.tbl_place p
        WHERE p.id = p_business_id
    );
END;
$function$;

COMMENT ON FUNCTION public.v1_get_place_by_id_with_set_recent_view IS 'ID로 장소를 조회하면서 최근 본 장소로 기록하고, 상세 상호작용 정보를 반환하며, 방문자 리뷰 테마 정보를 포함합니다.';
GRANT EXECUTE ON FUNCTION public.v1_get_place_by_id_with_set_recent_view TO authenticated, anon;
