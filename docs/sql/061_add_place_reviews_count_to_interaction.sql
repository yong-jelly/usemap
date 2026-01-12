-- =====================================================
-- 061_add_place_reviews_count_to_interaction.sql
-- v1_common_place_interaction 및 관련 함수에 place_reviews_count 추가
-- tbl_place_user_review 테이블의 리뷰 개수를 집계합니다 (비공개 포함).
-- 
-- 실행 방법:
--   psql "postgresql://postgres.xyqpggpilgcdsawuvpzn:ZNDqDunnaydr0aFQ@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres" -f docs/sql/061_add_place_reviews_count_to_interaction.sql
-- =====================================================

-- 1. v1_common_place_interaction 함수 업데이트
CREATE OR REPLACE FUNCTION public.v1_common_place_interaction(p_place_id text)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
AS $function$
DECLARE
    v_user_id uuid := auth.uid();
    v_place_liked_count int := 0;
    v_place_saved_count int := 0;
    v_is_liked boolean := false;
    v_is_saved boolean := false;
    v_place_comment_count int := 0;
    v_place_reviews_count int := 0;
    v_is_commented boolean := false;
    v_is_reviewed boolean := false;
    v_visit_count int := 0;
    v_last_visited_at timestamp with time zone := NULL;
BEGIN
    SELECT count(*) INTO v_place_liked_count FROM public.tbl_like WHERE liked_id = p_place_id AND liked_type = 'place' AND liked = true;
    SELECT count(*) INTO v_place_saved_count FROM public.tbl_save WHERE saved_id = p_place_id AND saved_type = 'place' AND saved = true;
    SELECT count(*) INTO v_place_comment_count FROM public.tbl_comment_for_place WHERE business_id = p_place_id AND is_active = true;
    -- tbl_place_user_review에서 리뷰 개수 집계 (비공개 리뷰 포함)
    SELECT count(*) INTO v_place_reviews_count FROM public.tbl_place_user_review WHERE place_id = p_place_id AND is_active = true;

    IF v_user_id IS NOT NULL THEN
        SELECT liked INTO v_is_liked FROM public.tbl_like WHERE liked_id = p_place_id AND liked_type = 'place' AND user_id = v_user_id;
        SELECT saved INTO v_is_saved FROM public.tbl_save WHERE saved_id = p_place_id AND saved_type = 'place' AND user_id = v_user_id;
        SELECT EXISTS (SELECT 1 FROM public.tbl_comment_for_place WHERE business_id = p_place_id AND user_id = v_user_id AND is_active = true) INTO v_is_commented;
        SELECT EXISTS (SELECT 1 FROM public.tbl_place_user_review WHERE place_id = p_place_id AND user_id = v_user_id AND is_active = true) INTO v_is_reviewed;
        
        -- 방문 통계
        SELECT count(*), max(visited_at) INTO v_visit_count, v_last_visited_at 
        FROM public.tbl_visited WHERE user_id = v_user_id AND place_id = p_place_id;
    END IF;

    RETURN jsonb_build_object(
        'place_liked_count', COALESCE(v_place_liked_count, 0),
        'place_saved_count', COALESCE(v_place_saved_count, 0),
        'is_liked', COALESCE(v_is_liked, false),
        'is_saved', COALESCE(v_is_saved, false),
        'place_comment_count', COALESCE(v_place_comment_count, 0),
        'place_reviews_count', COALESCE(v_place_reviews_count, 0),
        'is_commented', COALESCE(v_is_commented, false),
        'is_reviewed', COALESCE(v_is_reviewed, false),
        'visit_count', COALESCE(v_visit_count, 0),
        'last_visited_at', v_last_visited_at
    );
END;
$function$;

-- 2. v1_get_place_details 함수 업데이트
CREATE OR REPLACE FUNCTION public.v1_get_place_details(p_place_id text)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
AS $function$
DECLARE
    v_user_id uuid := auth.uid();
    v_place_liked_count int := 0;
    v_place_saved_count int := 0;
    v_is_liked boolean := false;
    v_is_saved boolean := false;
    v_place_comment_count int := 0;
    v_place_reviews_count int := 0;
    v_is_commented boolean := false;
    v_is_reviewed boolean := false;
    v_comments jsonb := '[]'::jsonb;
BEGIN
    -- 'place' 타입 좋아요/저장 수
    SELECT count(*) INTO v_place_liked_count FROM public.tbl_like WHERE liked_id = p_place_id AND liked_type = 'place' AND liked = true;
    SELECT count(*) INTO v_place_saved_count FROM public.tbl_save WHERE saved_id = p_place_id AND saved_type = 'place' AND saved = true;

    -- 댓글 수 및 목록 조회
    SELECT count(*) INTO v_place_comment_count FROM public.tbl_comment_for_place WHERE business_id = p_place_id AND is_active = true;
    -- 리뷰 수 집계
    SELECT count(*) INTO v_place_reviews_count FROM public.tbl_place_user_review WHERE place_id = p_place_id AND is_active = true;

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
        SELECT EXISTS (SELECT 1 FROM public.tbl_place_user_review WHERE place_id = p_place_id AND user_id = v_user_id AND is_active = true) INTO v_is_reviewed;
    END IF;

    RETURN jsonb_build_object(
        'place_liked_count', COALESCE(v_place_liked_count, 0),
        'place_saved_count', COALESCE(v_place_saved_count, 0),
        'is_liked', COALESCE(v_is_liked, false),
        'is_saved', COALESCE(v_is_saved, false),
        'place_comment_count', COALESCE(v_place_comment_count, 0),
        'place_reviews_count', COALESCE(v_place_reviews_count, 0),
        'is_commented', COALESCE(v_is_commented, false),
        'is_reviewed', COALESCE(v_is_reviewed, false),
        'comments', COALESCE(v_comments, '[]'::jsonb)
    );
END;
$function$;

COMMENT ON FUNCTION public.v1_common_place_interaction IS '장소별 통합 상호작용 정보(좋아요, 저장, 댓글, 리뷰 수 등)를 조회합니다.';
COMMENT ON FUNCTION public.v1_get_place_details IS '장소 상세 정보를 위한 통합 인터랙션 정보를 조회합니다.';
