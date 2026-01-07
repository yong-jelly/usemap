-- =====================================================
-- 011_v1_place_functions.sql
-- 장소 조회 및 상세 정보 관련 RPC 함수 정의
-- =====================================================

-- 1. 장소 상세 정보 조회 (댓글, 좋아요, 저장 상태 포함)
CREATE OR REPLACE FUNCTION public.v1_get_place_details(p_place_id text)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
AS $function$
DECLARE
    v_user_id uuid := auth.uid();
    v_place_review_liked_count int := 0;
    v_place_review_saved_count int := 0;
    v_place_liked_count int := 0;
    v_place_saved_count int := 0;
    v_is_liked boolean := false;
    v_is_saved boolean := false;
    v_place_comment_count int := 0;
    v_is_commented boolean := false;
    v_comments jsonb := '[]'::jsonb;
    v_place_tag_count int := 0;
    v_is_place_tagged boolean := false;
    v_tags jsonb := '[]'::jsonb;
BEGIN
    -- 'place' 타입 좋아요/저장 수
    SELECT count(*) INTO v_place_liked_count FROM public.tbl_like WHERE liked_id = p_place_id AND liked_type = 'place' AND liked = true;
    SELECT count(*) INTO v_place_saved_count FROM public.tbl_save WHERE saved_id = p_place_id AND saved_type = 'place' AND saved = true;

    -- 댓글 수 및 목록 조회
    SELECT count(*) INTO v_place_comment_count FROM public.tbl_comment_for_place WHERE business_id = p_place_id AND is_active = true;

    SELECT jsonb_agg(
               jsonb_build_object(
                   'id', c.id, 'user_id', c.user_id, 'content', c.content, 'created_at', c.created_at,
                   'user_profile', jsonb_build_object('nickname', up.nickname, 'profile_image_url', up.profile_image_url)
               ) ORDER BY c.created_at ASC
           ) INTO v_comments
    FROM public.tbl_comment_for_place c
    LEFT JOIN public.tbl_user_profile up ON c.user_id = up.auth_user_id
    WHERE c.business_id = p_place_id AND c.is_active = true;

    -- 사용자별 상태 (로그인 시)
    IF v_user_id IS NOT NULL THEN
        SELECT liked INTO v_is_liked FROM public.tbl_like WHERE liked_id = p_place_id AND liked_type = 'place' AND user_id = v_user_id;
        SELECT saved INTO v_is_saved FROM public.tbl_save WHERE saved_id = p_place_id AND saved_type = 'place' AND user_id = v_user_id;
        SELECT EXISTS (SELECT 1 FROM public.tbl_comment_for_place WHERE business_id = p_place_id AND user_id = v_user_id AND is_active = true) INTO v_is_commented;
    END IF;

    RETURN jsonb_build_object(
        'place_liked_count', COALESCE(v_place_liked_count, 0),
        'place_saved_count', COALESCE(v_place_saved_count, 0),
        'is_liked', COALESCE(v_is_liked, false),
        'is_saved', COALESCE(v_is_saved, false),
        'place_comment_count', COALESCE(v_place_comment_count, 0),
        'is_commented', COALESCE(v_is_commented, false),
        'comments', COALESCE(v_comments, '[]'::jsonb)
    );
END;
$function$;

-- 2. ID 기반 장소 상세 데이터 조회
CREATE OR REPLACE FUNCTION public.v1_get_place_by_id(p_business_id text)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
AS $function$
BEGIN
    RETURN (
        SELECT to_jsonb(p.*) || jsonb_build_object(
            'interaction', public.v1_common_place_interaction(p.id),
            'features', public.v1_common_place_features(p.id)
        )
        FROM public.tbl_place p
        WHERE p.id = p_business_id
    );
END;
$function$;

-- 3. 탭(인기, 탐색 등)별 장소 목록 조회
CREATE OR REPLACE FUNCTION public.v1_list_places_by_tab(p_tab_name character varying DEFAULT NULL::character varying, p_group1 character varying DEFAULT NULL::character varying, p_offset integer DEFAULT 0, p_limit integer DEFAULT 10, p_order_by character varying DEFAULT 'rank_in_region'::character varying)
 RETURNS TABLE(place_data jsonb)
 LANGUAGE plpgsql
 STABLE
AS $function$
BEGIN
    RETURN QUERY 
    SELECT
        jsonb_build_object(
            'id', p.id, 'name', p.name, 'group1', p.group1, 'category', p.category,
            'road_address', p.road_address, 'visitor_reviews_score', p.visitor_reviews_score,
            'images', p.images, 'feed_info', to_jsonb(pfg.*)
        )
    FROM
        public.tbl_place_feed_group pfg
        LEFT JOIN public.tbl_place p ON pfg.place_id = p.id
    WHERE 
        (p_tab_name IS NULL OR pfg.tab_name = p_tab_name)
        AND (p_group1 IS NULL OR pfg.group1 = p_group1)
    ORDER BY 
        CASE WHEN p_order_by = 'total_score' THEN pfg.total_score END DESC NULLS LAST,
        CASE WHEN p_order_by = 'visitor_reviews_score' THEN p.visitor_reviews_score END DESC NULLS LAST,
        pfg.rank_in_region ASC
    LIMIT p_limit OFFSET p_offset;
END;
$function$;
