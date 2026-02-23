-- =====================================================
-- 097_create_v2_comment_functions.sql
-- 장소 댓글 목록 조회(v2) 및 삭제 함수 정의
-- PlaceCommentSheet 목업 구조에 맞는 중첩 댓글+좋아요 응답 및 소프트 삭제 지원
--
-- 인자:
--   @p_place_id: 장소 ID (business_id)
--   @p_comment_id: 삭제할 댓글 UUID
--
-- 실행 방법:
--   psql "postgresql://postgres.xyqpggpilgcdsawuvpzn:ZNDqDunnaydr0aFQ@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres" -f docs/sql/097_create_v2_comment_functions.sql
-- =====================================================

-- 1. 장소 댓글 목록 조회 (중첩 구조, 좋아요, 툼스톤 포함)
CREATE OR REPLACE FUNCTION public.v2_list_place_comments(p_place_id text)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SECURITY DEFINER
 SET search_path = public
AS $function$
DECLARE
    v_user_id uuid := auth.uid();
    v_result jsonb := '[]'::jsonb;
    r RECORD;
    reply RECORD;
    v_replies jsonb;
    v_comment jsonb;
    v_user_status text;
    v_user_nickname text;
    v_user_avatar text;
BEGIN
    FOR r IN
        SELECT c.id, c.user_id, c.content, c.created_at, c.is_active,
               up.nickname, up.profile_image_url,
               (SELECT count(*)::int FROM public.tbl_comment_likes_for_place WHERE comment_id = c.id) AS like_count,
               (v_user_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.tbl_comment_likes_for_place WHERE comment_id = c.id AND user_id = v_user_id)) AS is_liked
        FROM public.tbl_comment_for_place c
        LEFT JOIN public.tbl_user_profile up ON c.user_id = up.auth_user_id
        WHERE c.business_id = p_place_id AND (c.comment_level = 0 OR c.parent_comment_id IS NULL)
        ORDER BY c.created_at DESC
    LOOP
        v_replies := '[]'::jsonb;
        FOR reply IN
            SELECT c.id, c.user_id, c.content, c.created_at, c.is_active,
                   up.nickname, up.profile_image_url,
                   (SELECT count(*)::int FROM public.tbl_comment_likes_for_place WHERE comment_id = c.id) AS like_count,
                   (v_user_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.tbl_comment_likes_for_place WHERE comment_id = c.id AND user_id = v_user_id)) AS is_liked
            FROM public.tbl_comment_for_place c
            LEFT JOIN public.tbl_user_profile up ON c.user_id = up.auth_user_id
            WHERE c.parent_comment_id = r.id
            ORDER BY c.created_at ASC
        LOOP
            v_user_status := CASE WHEN reply.user_id IS NULL THEN 'deleted' ELSE 'active' END;
            v_user_nickname := CASE WHEN reply.user_id IS NULL THEN '탈퇴한 사용자' WHEN NOT reply.is_active THEN '사용자' ELSE COALESCE(reply.nickname, '사용자') END;
            v_user_avatar := CASE WHEN reply.is_active THEN reply.profile_image_url ELSE NULL END;

            v_comment := jsonb_build_object(
                'id', reply.id,
                'user_id', reply.user_id,
                'content', CASE WHEN reply.is_active THEN reply.content ELSE '삭제된 댓글입니다.' END,
                'created_at', reply.created_at,
                'like_count', CASE WHEN reply.is_active THEN reply.like_count ELSE 0 END,
                'is_liked', reply.is_liked AND reply.is_active,
                'is_tombstoned', NOT reply.is_active,
                'user_profile', jsonb_build_object(
                    'nickname', v_user_nickname,
                    'profile_image_url', v_user_avatar,
                    'status', v_user_status
                ),
                'replies', '[]'::jsonb
            );
            v_replies := v_replies || v_comment;
        END LOOP;

        v_user_status := CASE WHEN r.user_id IS NULL THEN 'deleted' ELSE 'active' END;
        v_user_nickname := CASE WHEN r.user_id IS NULL THEN '탈퇴한 사용자' WHEN NOT r.is_active THEN '사용자' ELSE COALESCE(r.nickname, '사용자') END;
        v_user_avatar := CASE WHEN r.is_active THEN r.profile_image_url ELSE NULL END;

        v_comment := jsonb_build_object(
            'id', r.id,
            'user_id', r.user_id,
            'content', CASE WHEN r.is_active THEN r.content ELSE '삭제된 댓글입니다.' END,
            'created_at', r.created_at,
            'like_count', CASE WHEN r.is_active THEN r.like_count ELSE 0 END,
            'is_liked', r.is_liked AND r.is_active,
            'is_tombstoned', NOT r.is_active,
            'user_profile', jsonb_build_object(
                'nickname', v_user_nickname,
                'profile_image_url', v_user_avatar,
                'status', v_user_status
            ),
            'replies', v_replies
        );
        v_result := v_result || v_comment;
    END LOOP;

    RETURN v_result;
END;
$function$;

-- 2. 장소 댓글 소프트 삭제 (본인 댓글만)
CREATE OR REPLACE FUNCTION public.v1_delete_place_comment(p_comment_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
DECLARE
    v_user_id uuid := auth.uid();
    v_updated int;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User must be authenticated to delete a comment.';
    END IF;

    UPDATE public.tbl_comment_for_place
    SET is_active = false
    WHERE id = p_comment_id AND user_id = v_user_id;

    GET DIAGNOSTICS v_updated = ROW_COUNT;
    RETURN v_updated > 0;
END;
$function$;

COMMENT ON FUNCTION public.v2_list_place_comments IS '장소별 댓글 목록을 중첩 구조로 조회합니다. like_count, is_liked, user_profile, tombstone 포함.';
COMMENT ON FUNCTION public.v1_delete_place_comment IS '본인 댓글을 소프트 삭제(is_active=false)합니다.';

GRANT EXECUTE ON FUNCTION public.v2_list_place_comments TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.v1_delete_place_comment TO authenticated;
