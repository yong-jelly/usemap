-- =====================================================
-- 012_v1_comment_functions.sql
-- 장소 댓글 생성 및 조회 관련 RPC 함수 정의
-- =====================================================

-- 1. 장소 댓글 생성 함수
CREATE OR REPLACE FUNCTION public.v1_create_comment_for_place(p_business_id text, p_content text, p_title text DEFAULT NULL::text, p_image_paths text[] DEFAULT NULL::text[], p_parent_comment_id uuid DEFAULT NULL::uuid, p_comment_level integer DEFAULT 0)
 RETURNS TABLE(id uuid, user_id uuid, username text, avatar_url text, title text, content text, business_id text, image_paths text[], parent_comment_id uuid, comment_level integer, is_active boolean, created_at timestamp with time zone, updated_at timestamp with time zone, reply_count bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
#variable_conflict use_column
DECLARE
    new_comment_id uuid;
    caller_user_id uuid := auth.uid();
BEGIN
    IF caller_user_id IS NULL THEN
        RAISE EXCEPTION 'User must be authenticated to create a comment.';
    END IF;

    INSERT INTO public.tbl_comment_for_place (user_id, business_id, content, title, image_paths, parent_comment_id, comment_level)
    VALUES (caller_user_id, p_business_id, p_content, p_title, p_image_paths, p_parent_comment_id, p_comment_level)
    RETURNING tbl_comment_for_place.id INTO new_comment_id;

    RETURN QUERY
    SELECT c.id, c.user_id, u.nickname as username, u.profile_image_url as avatar_url, c.title, c.content, c.business_id, c.image_paths, c.parent_comment_id, c.comment_level, c.is_active, c.created_at, c.updated_at, 0::bigint AS reply_count
    FROM public.tbl_comment_for_place c
    LEFT JOIN tbl_user_profile u ON c.user_id = u.auth_user_id
    WHERE c.id = new_comment_id;
END;
$function$;

-- 2. 장소별 댓글 목록 조회 함수
CREATE OR REPLACE FUNCTION public.v1_get_comments_for_place(p_business_id text, p_limit integer DEFAULT 200, p_offset integer DEFAULT 0)
 RETURNS TABLE(id uuid, user_id uuid, username text, avatar_url text, title text, content text, business_id text, image_paths text[], parent_comment_id uuid, comment_level integer, is_active boolean, created_at timestamp with time zone, updated_at timestamp with time zone, reply_count bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
#variable_conflict use_column
BEGIN
    RETURN QUERY
    SELECT c.id, 
           CASE WHEN c.is_active = false THEN NULL::uuid ELSE c.user_id END as user_id,
           CASE WHEN c.is_active = false THEN NULL::text ELSE u.nickname END as username,
           CASE WHEN c.is_active = false THEN NULL::text ELSE u.profile_image_url END as avatar_url,
           CASE WHEN c.is_active = false THEN NULL::text ELSE c.title END as title,
           CASE WHEN c.is_active = false THEN NULL::text ELSE c.content END as content,
           c.business_id, 
           CASE WHEN c.is_active = false THEN NULL::text[] ELSE c.image_paths END as image_paths,
           c.parent_comment_id, c.comment_level, c.is_active, c.created_at, c.updated_at, 0::bigint AS reply_count
    FROM public.tbl_comment_for_place c
    LEFT JOIN tbl_user_profile u ON c.user_id = u.auth_user_id
    WHERE c.business_id = p_business_id
    ORDER BY c.created_at DESC LIMIT p_limit OFFSET p_offset;
END;
$function$;

-- 3. 댓글 좋아요 토글 함수
CREATE OR REPLACE FUNCTION public.v1_toggle_comment_like_for_place(p_comment_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
#variable_conflict use_column
DECLARE
    current_user_id uuid := auth.uid();
    is_liked boolean;
BEGIN
    SELECT EXISTS (SELECT 1 FROM public.tbl_comment_likes_for_place WHERE comment_id = p_comment_id AND user_id = current_user_id) INTO is_liked;
    IF is_liked THEN
        DELETE FROM public.tbl_comment_likes_for_place WHERE comment_id = p_comment_id AND user_id = current_user_id;
        RETURN false;
    ELSE
        INSERT INTO public.tbl_comment_likes_for_place (comment_id, user_id) VALUES (p_comment_id, current_user_id);
        RETURN true;
    END IF;
END;
$function$;
