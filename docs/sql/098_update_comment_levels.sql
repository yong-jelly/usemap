-- =====================================================
-- 098_update_comment_levels.sql
-- 대댓글 레벨 2(Depth 3)까지 허용하도록 제약조건 수정 및 v2_list_place_comments 갱신
-- 최상위 댓글은 최신순(created_at DESC) 정렬
--
-- 실행 방법:
--   psql "postgresql://postgres.xyqpggpilgcdsawuvpzn:ZNDqDunnaydr0aFQ@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres" -f docs/sql/098_update_comment_levels.sql
-- =====================================================

-- 1. 제약조건 수정
ALTER TABLE public.tbl_comment_for_place DROP CONSTRAINT IF EXISTS tbl_comment_for_place_comment_level_check;
ALTER TABLE public.tbl_comment_for_place DROP CONSTRAINT IF EXISTS check_comment_hierarchy;

ALTER TABLE public.tbl_comment_for_place ADD CONSTRAINT tbl_comment_for_place_comment_level_check CHECK (comment_level = ANY (ARRAY[0, 1, 2]));
ALTER TABLE public.tbl_comment_for_place ADD CONSTRAINT check_comment_hierarchy CHECK (
    (comment_level = 0 AND parent_comment_id IS NULL) OR 
    (comment_level IN (1, 2) AND parent_comment_id IS NOT NULL)
);

-- 2. v2_list_place_comments 수정 (최상위 최신순, 3 Depth 지원)
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
    subreply RECORD;
    v_replies jsonb;
    v_subreplies jsonb;
    v_comment jsonb;
    v_subcomment jsonb;
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
        ORDER BY c.created_at DESC -- 최상위 댓글 최근 순
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
            ORDER BY c.created_at DESC
        LOOP
            v_subreplies := '[]'::jsonb;
            FOR subreply IN
                SELECT c.id, c.user_id, c.content, c.created_at, c.is_active,
                       up.nickname, up.profile_image_url,
                       (SELECT count(*)::int FROM public.tbl_comment_likes_for_place WHERE comment_id = c.id) AS like_count,
                       (v_user_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.tbl_comment_likes_for_place WHERE comment_id = c.id AND user_id = v_user_id)) AS is_liked
                FROM public.tbl_comment_for_place c
                LEFT JOIN public.tbl_user_profile up ON c.user_id = up.auth_user_id
                WHERE c.parent_comment_id = reply.id
                ORDER BY c.created_at DESC
            LOOP
                v_user_status := CASE WHEN subreply.user_id IS NULL THEN 'deleted' ELSE 'active' END;
                v_user_nickname := CASE WHEN subreply.user_id IS NULL THEN '탈퇴한 사용자' WHEN NOT subreply.is_active THEN '사용자' ELSE COALESCE(subreply.nickname, '사용자') END;
                v_user_avatar := CASE WHEN subreply.is_active THEN subreply.profile_image_url ELSE NULL END;

                v_subcomment := jsonb_build_object(
                    'id', subreply.id,
                    'user_id', subreply.user_id,
                    'content', CASE WHEN subreply.is_active THEN subreply.content ELSE '삭제된 댓글입니다.' END,
                    'created_at', subreply.created_at,
                    'like_count', CASE WHEN subreply.is_active THEN subreply.like_count ELSE 0 END,
                    'is_liked', subreply.is_liked AND subreply.is_active,
                    'is_tombstoned', NOT subreply.is_active,
                    'user_profile', jsonb_build_object(
                        'nickname', v_user_nickname,
                        'profile_image_url', v_user_avatar,
                        'status', v_user_status
                    ),
                    'replies', '[]'::jsonb
                );
                v_subreplies := v_subreplies || v_subcomment;
            END LOOP;

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
                'replies', v_subreplies
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
