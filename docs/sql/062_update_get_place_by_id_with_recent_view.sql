-- =====================================================
-- 062_update_get_place_by_id_with_recent_view.sql
-- ID 기반 장소 조회 시 최근 본 장소 기록 및 interaction 정보(place_reviews_count 포함) 반환
-- 
-- 실행 방법:
--   psql "postgresql://postgres.xyqpggpilgcdsawuvpzn:ZNDqDunnaydr0aFQ@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres" -f docs/sql/062_update_get_place_by_id_with_recent_view.sql
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
    -- 주의: 테이블명은 tbl_recent_view 이며 content_id, content_type 컬럼을 사용합니다.
    IF v_user_id IS NOT NULL THEN
        INSERT INTO public.tbl_recent_view (user_id, content_id, content_type, updated_at, count)
        VALUES (v_user_id, p_business_id, 'place', now(), 1)
        ON CONFLICT (user_id, content_id, content_type) 
        DO UPDATE SET updated_at = now(), count = public.tbl_recent_view.count + 1;
    END IF;

    -- 2. 장소 데이터 반환 (interaction, features, experience 포함)
    -- v1_common_place_interaction은 이미 061 마이그레이션에서 place_reviews_count를 포함하도록 업데이트됨
    RETURN (
        SELECT (to_jsonb(p.*) - '{themes, street_panorama, category_code_list, visitor_review_stats, algo_avg_len, algo_stdev_len, algo_revisit_rate, algo_media_ratio, algo_avg_views, algo_recency_score, algo_engagement_score, algo_length_variation_index, algo_loyalty_index, algo_growth_rate_1m, algo_growth_rate_2m, algo_growth_rate_3m}'::text[]) || jsonb_build_object(
            'interaction', public.v1_common_place_interaction(p.id),
            'features', public.v1_common_place_features(p.id),
            'experience', public.v1_get_place_experience(p.id)
        )
        FROM public.tbl_place p
        WHERE p.id = p_business_id
    );
END;
$function$;

COMMENT ON FUNCTION public.v1_get_place_by_id_with_set_recent_view IS 'ID로 장소를 조회하면서 최근 본 장소로 기록하고, 상세 상호작용 정보를 반환합니다.';
GRANT EXECUTE ON FUNCTION public.v1_get_place_by_id_with_set_recent_view TO authenticated, anon;
