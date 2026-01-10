-- =====================================================
-- 019_v1_search_and_list_functions.sql
-- 장소 검색 및 개인화된 목록 조회 RPC 함수 정의
-- 
-- 실행 방법:
--   psql "postgresql://postgres.xyqpggpilgcdsawuvpzn:ZNDqDunnaydr0aFQ@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres" -f docs/sql/019_v1_search_and_list_functions.sql
-- =====================================================

-- 1. 이름 기반 장소 검색 함수
CREATE OR REPLACE FUNCTION public.v1_list_places_search_for_name(p_name text, p_group1 text DEFAULT NULL::text, p_limit integer DEFAULT 200)
 RETURNS TABLE(place_data jsonb)
 LANGUAGE plpgsql
 STABLE
AS $function$
BEGIN
    RETURN QUERY
    SELECT to_jsonb(p.*) || jsonb_build_object('interaction', public.v1_common_place_interaction(p.id))
    FROM public.tbl_place p
    WHERE p.name ILIKE '%' || p_name || '%'
      AND (p_group1 IS NULL OR p.group1 = p_group1)
    LIMIT p_limit;
END;
$function$;

-- 2. 내가 북마크(저장)한 장소 목록 조회 함수
CREATE OR REPLACE FUNCTION public.v1_get_my_bookmarked_places(p_limit integer DEFAULT 20, p_offset integer DEFAULT 0)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    RETURN (
        SELECT jsonb_agg(to_jsonb(p.*))
        FROM public.tbl_save s
        JOIN public.tbl_place p ON s.saved_id = p.id
        WHERE s.user_id = auth.uid() AND s.saved_type = 'place' AND s.saved = true
        ORDER BY s.created_at DESC LIMIT p_limit OFFSET p_offset
    );
END;
$function$;

-- 3. 내가 좋아요 누른 장소 목록 조회 함수
CREATE OR REPLACE FUNCTION public.v1_get_my_liked_places(p_limit integer DEFAULT 20, p_offset integer DEFAULT 0)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    RETURN (
        SELECT jsonb_agg(to_jsonb(p.*))
        FROM public.tbl_like l
        JOIN public.tbl_place p ON l.liked_id = p.id
        WHERE l.user_id = auth.uid() AND l.liked_type = 'place' AND l.liked = true
        ORDER BY l.created_at DESC LIMIT p_limit OFFSET p_offset
    );
END;
$function$;
