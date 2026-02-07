-- =====================================================
-- 094_update_v2_get_place_detail_themes.sql
-- v2_get_place_detail 함수 수정하여 voted_keyword 데이터 포함하도록 변경
-- 
-- 인자:
--   @p_business_id: 장소 ID (business_id)
-- 
-- 실행 방법:
--   psql "postgresql://postgres.xyqpggpilgcdsawuvpzn:ZNDqDunnaydr0aFQ@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres" -f docs/sql/094_update_v2_get_place_detail_themes.sql
-- =====================================================

CREATE OR REPLACE FUNCTION public.v2_get_place_detail(p_business_id text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public, auth
AS $function$
DECLARE
    v_user_id uuid := auth.uid();
    v_result jsonb;
BEGIN
    -- 1. 최근 본 장소 기록 (로그인한 경우)
    IF v_user_id IS NOT NULL THEN
        INSERT INTO public.tbl_recent_view (user_id, content_id, content_type, updated_at, count)
        VALUES (v_user_id, p_business_id, 'place', now(), 1)
        ON CONFLICT (user_id, content_id, content_type) 
        DO UPDATE SET updated_at = now(), count = public.tbl_recent_view.count + 1;
    END IF;

    -- 2. 장소 데이터 조회 및 응답 구성
    SELECT jsonb_build_object(
        -- 기본 정보
        'id', p.id,
        'name', p.name,
        'category', p.category,
        'category_code', p.category_code,
        'address', p.address,
        'road_address', p.road_address,
        'x', p.x,
        'y', p.y,
        'phone', p.phone,
        'homepage', p.homepage,
        'conveniences', p.conveniences,
        'payment_info', p.payment_info,
        'keyword_list', COALESCE(p.keyword_list, ARRAY[]::text[]),
        'images', p.images,
        'static_map_url', p.static_map_url,
        'place_images', p.place_images,
        'menus', p.menus,
        'road', p.road,
        'visitor_reviews_total', p.visitor_reviews_total,
        'visitor_reviews_score', p.visitor_reviews_score,
        'visitor_review_medias_total', p.visitor_review_medias_total,
        'group1', p.group1,
        'group2', p.group2,
        'group3', p.group3,
        'created_at', p.created_at,
        'updated_at', p.updated_at,
        -- 상호작용 정보
        'interaction', public.v1_common_place_interaction(p.id),
        -- features 배열 (빈 배열 보장)
        'features', COALESCE(public.v1_common_place_features(p.id), '[]'::jsonb),
        -- 경험 정보
        'experience', public.v1_get_place_experience(p.id),
        -- 키워드 정보 (visitor_review_stats에서 추출)
        'voted_keyword', COALESCE(p.visitor_review_stats->'analysis'->'votedKeyword', '[]'::jsonb)
    ) INTO v_result
    FROM public.tbl_place p
    WHERE p.id = p_business_id;

    RETURN v_result;
END;
$function$;

COMMENT ON FUNCTION public.v2_get_place_detail IS '장소 상세 조회 v2: voted_keyword 데이터(리뷰 통계 기반) 포함.';
GRANT EXECUTE ON FUNCTION public.v2_get_place_detail TO authenticated, anon;
