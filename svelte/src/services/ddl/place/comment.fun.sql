-- src/services/ddl/place/comment.fun.sql

-- ## 댓글 생성 함수 (수정: 반환값 변경 - 생성된 댓글 전체 데이터 반환) ##
-- 사용자가 특정 장소에 새 댓글(원본 또는 대댓글)을 작성합니다.
-- 함수 내부에서 auth.uid() 를 사용하여 작성자 ID를 설정합니다.
-- 성공 시 생성된 댓글의 전체 정보 (사용자 이름, 아바타 포함)를 반환합니다.
--
-- @param p_business_id 댓글이 달릴 장소(음식점) ID
-- @param p_content 댓글 내용 (필수)
-- @param p_title 댓글 제목 (선택)
-- @param p_image_paths 첨부 이미지 경로 배열 (선택)
-- @param p_parent_comment_id 부모 댓글 ID (대댓글인 경우 필수)
-- @param p_comment_level 댓글 레벨 (0: 원본, 1: 대댓글)
-- @returns 생성된 댓글 정보 (SupabaseComment 타입과 유사한 구조)
--  DROP FUNCTION IF EXISTS public.v1_create_comment_for_place(text, text,text, text[], uuid, integer);
CREATE OR REPLACE FUNCTION public.v1_create_comment_for_place(
    p_business_id text,
    p_content text,
    p_title text DEFAULT NULL,
    p_image_paths text[] DEFAULT NULL,
    p_parent_comment_id uuid DEFAULT NULL,
    p_comment_level integer DEFAULT 0
)
-- 반환 타입을 테이블 형태로 변경
RETURNS TABLE (
    id uuid,
    user_id uuid,
    username text,
    avatar_url text,
    title text,
    content text,
    business_id text,
    image_paths text[],
    parent_comment_id uuid,
    comment_level integer,
    is_active boolean,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    reply_count bigint -- 항상 0 또는 null 반환
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_comment_id uuid;
    caller_user_id uuid := auth.uid();
BEGIN
    IF caller_user_id IS NULL THEN
        RAISE EXCEPTION 'User must be authenticated to create a comment.';
    END IF;

    IF (p_comment_level = 0 AND p_parent_comment_id IS NOT NULL) OR
       (p_comment_level = 1 AND p_parent_comment_id IS NULL) THEN
        RAISE EXCEPTION 'Invalid comment hierarchy: comment_level=%, parent_comment_id=%', p_comment_level, p_parent_comment_id;
    END IF;

    -- 댓글 삽입하고 생성된 ID를 new_comment_id 변수에 저장
    INSERT INTO public.tbl_comment_for_place (
        user_id, business_id, content, title, image_paths, parent_comment_id, comment_level
    )
    VALUES (
        caller_user_id, p_business_id, p_content, p_title, p_image_paths, p_parent_comment_id, p_comment_level
    )
    RETURNING tbl_comment_for_place.id INTO new_comment_id;

    -- 생성된 댓글 정보와 사용자 정보를 함께 조회하여 반환
    RETURN QUERY
    SELECT
        c.id,
        c.user_id,
        u.nickname as username,
        u.profile_image_url as avatar_url,
        c.title,
        c.content,
        c.business_id,
        c.image_paths,
        c.parent_comment_id,
        c.comment_level,
        c.is_active,
        c.created_at,
        c.updated_at,
        0::bigint AS reply_count -- 생성 직후 답글 수는 0
    FROM public.tbl_comment_for_place c
    LEFT JOIN tbl_user_profile u ON c.user_id = u.auth_user_id
    WHERE c.id = new_comment_id; -- 생성된 ID로 조회

END;
$$;

-- 함수에 대한 주석 (반환값 변경 반영)
COMMENT ON FUNCTION public.v1_create_comment_for_place(text, text,text, text[], uuid, integer)
IS '사용자가 장소에 새 댓글(원본 또는 대댓글)을 생성하고, 생성된 댓글 정보를 반환합니다. 작성자 ID는 auth.uid()를 사용합니다. RLS 정책이 적용됩니다.';


-- ## 특정 장소의 댓글 목록 조회 함수 (단순화 버전) ##
-- ... (이하 다른 함수들은 동일하게 유지) ...
-- ## 특정 장소의 댓글 목록 조회 함수 (단순화 버전) ##
-- 특정 장소(business_id)에 달린 활성(is_active=true) 댓글 목록을 플랫 리스트로 조회합니다.
-- 사용자 정보를 함께 반환하기 위해 auth.users 테이블과 조인합니다.
-- 페이지네이션을 위한 limit, offset 파라미터를 받습니다.
-- 댓글 계층 구조(원본-대댓글) 조합은 UI 레이어에서 처리합니다.
--
-- @param p_business_id 조회할 장소 ID
-- @param p_limit 한 페이지에 가져올 댓글 수 (기본값 20으로 복원)
-- @param p_offset 조회 시작 위치 (페이지 번호)
-- @returns 댓글 플랫 목록 (사용자 정보 포함)
-- DROP FUNCTION IF EXISTS public.v1_get_comments_for_place(text, integer, integer);
CREATE OR REPLACE FUNCTION public.v1_get_comments_for_place(
    p_business_id text,
    p_limit integer DEFAULT 200, -- 최대한 많은 목록 노출, 페이징 사용안함
    p_offset integer DEFAULT 0
)
RETURNS TABLE (
    id uuid,
    user_id uuid,
    username text, -- 사용자 이름 추가
    avatar_url text, -- 사용자 아바타 URL 추가
    title text,
    content text,
    business_id text,
    image_paths text[],
    parent_comment_id uuid,
    comment_level integer,
    is_active boolean,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    reply_count bigint -- 이전 구조 호환성을 위해 유지, 값은 항상 0
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        c.id,
        c.user_id,
        u.nickname as username,
        u.profile_image_url as avatar_url,
        c.title,
        c.content,
        c.business_id,
        c.image_paths,
        c.parent_comment_id,
        c.comment_level,
        c.is_active,
        c.created_at,
        c.updated_at,
        0::bigint AS reply_count -- 댓글 수는 UI에서 계산하므로 0 반환
    FROM public.tbl_comment_for_place c
    LEFT JOIN tbl_user_profile u ON c.user_id = u.auth_user_id -- 사용자 정보 조인
    WHERE c.business_id = p_business_id-- AND c.is_active = true -- 활성 댓글만 조회
    ORDER BY c.created_at DESC -- 단순하게 최신순으로 정렬 (UI에서 재정렬 가능)
    LIMIT p_limit OFFSET p_offset; -- 페이지네이션 적용
END;
$$;

-- 함수 주석 업데이트
COMMENT ON FUNCTION public.v1_get_comments_for_place(text, integer, integer)
IS '특정 장소의 활성 댓글 목록(원본+대댓글, 플랫 리스트)과 사용자 정보를 페이지네이션하여 조회합니다. 최신순으로 정렬. 계층 구조는 UI에서 조합.';


-- ## 댓글 수정 함수 ##
-- ... (이하 동일)
CREATE OR REPLACE FUNCTION public.v1_update_comment_for_place(
    p_comment_id uuid,
    p_content text,
    p_title text DEFAULT NULL,
    p_image_paths text[] DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_user_id uuid := auth.uid();
    target_user_id uuid;
    is_comment_active boolean;
BEGIN
    SELECT user_id, is_active INTO target_user_id, is_comment_active
    FROM public.tbl_comment_for_place WHERE id = p_comment_id;
    IF NOT FOUND THEN RAISE EXCEPTION 'Comment not found: %', p_comment_id; END IF;
    IF target_user_id IS NULL OR target_user_id != current_user_id THEN RAISE EXCEPTION 'Permission denied to update comment: %', p_comment_id; END IF;
    IF NOT is_comment_active THEN RAISE EXCEPTION 'Cannot update an inactive comment: %', p_comment_id; END IF;
    UPDATE public.tbl_comment_for_place SET content = p_content, title = COALESCE(p_title, title), image_paths = COALESCE(p_image_paths, image_paths), updated_at = timezone('utc'::text, now())
    WHERE id = p_comment_id AND user_id = current_user_id AND is_active = true;
    RETURN FOUND;
END;
$$;

COMMENT ON FUNCTION public.v1_update_comment_for_place(uuid, text, text, text[])
IS '사용자가 자신의 활성 댓글 내용을 수정합니다. RLS 정책이 적용됩니다.';


-- ## 댓글 비활성화 (소프트 삭제) 함수 ##
-- ... (이하 동일)
CREATE OR REPLACE FUNCTION public.v1_deactivate_comment_for_place( p_comment_id uuid )
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE current_user_id uuid := auth.uid(); target_user_id uuid;
BEGIN
    SELECT user_id INTO target_user_id FROM public.tbl_comment_for_place WHERE id = p_comment_id;
    IF NOT FOUND THEN RAISE EXCEPTION 'Comment not found: %', p_comment_id; END IF;
    IF target_user_id IS NULL OR target_user_id != current_user_id THEN RAISE EXCEPTION 'Permission denied to deactivate comment: %', p_comment_id; END IF;
    UPDATE public.tbl_comment_for_place SET is_active = false, updated_at = timezone('utc'::text, now())
    WHERE id = p_comment_id AND user_id = current_user_id;
    RETURN FOUND;
END;
$$;
COMMENT ON FUNCTION public.v1_deactivate_comment_for_place(uuid)
IS '사용자가 자신의 댓글을 비활성화(소프트 삭제)합니다. RLS 정책이 적용됩니다.';

-- ## (선택적) 댓글 좋아요 기능 함수 ##
-- ... (이하 동일, tbl_comment_likes_for_place 테이블 이름 사용)
-- CREATE TABLE public.tbl_comment_likes_for_place ( comment_id uuid NOT NULL REFERENCES public.tbl_comment_for_place(id) ON DELETE CASCADE, user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL, PRIMARY KEY (comment_id, user_id) );
-- ALTER TABLE public.tbl_comment_likes_for_place ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Allow users to manage their own likes" ON public.tbl_comment_likes_for_place FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.v1_toggle_comment_like_for_place( p_comment_id uuid )
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE current_user_id uuid := auth.uid(); is_liked boolean;
BEGIN
    IF current_user_id IS NULL THEN RAISE EXCEPTION 'User must be authenticated to toggle a like.'; END IF;
    SELECT EXISTS ( SELECT 1 FROM public.tbl_comment_likes_for_place WHERE comment_id = p_comment_id AND user_id = current_user_id ) INTO is_liked;
    IF is_liked THEN DELETE FROM public.tbl_comment_likes_for_place WHERE comment_id = p_comment_id AND user_id = current_user_id; RETURN false;
    ELSE INSERT INTO public.tbl_comment_likes_for_place (comment_id, user_id) VALUES (p_comment_id, current_user_id); RETURN true; END IF;
END;
$$;
COMMENT ON FUNCTION public.v1_toggle_comment_like_for_place(uuid)
IS '사용자가 특정 댓글에 대한 좋아요 상태를 토글합니다 (추가/삭제). RLS 정책이 적용됩니다.';

-- ## (선택적) 특정 장소 댓글의 총 개수 조회 함수 ##
-- ... (이하 동일)
CREATE OR REPLACE FUNCTION public.v1_get_comment_count_for_place( p_business_id text )
RETURNS bigint LANGUAGE plpgsql AS $$
DECLARE comment_count bigint;
BEGIN SELECT count(*) INTO comment_count FROM public.tbl_comment_for_place WHERE business_id = p_business_id AND is_active = true; RETURN comment_count; END;
$$;
COMMENT ON FUNCTION public.v1_get_comment_count_for_place(text) IS '특정 장소의 활성 댓글 총 개수를 조회합니다.';

/*
--------------------------------------------------------------------------
-- 함수 실행 권한 부여 (업데이트: v1_create_comment_for_place 파라미터/반환값 변경)
--------------------------------------------------------------------------
-- REVOKE EXECUTE ON FUNCTION public.v1_create_comment_for_place(TEXT, TEXT, TEXT, TEXT[], UUID, INTEGER) FROM authenticated;
-- GRANT  EXECUTE ON FUNCTION public.v1_create_comment_for_place(TEXT, TEXT, TEXT, TEXT[], UUID, INTEGER) TO authenticated;

GRANT EXECUTE ON FUNCTION public.v1_get_comments_for_place(TEXT, INTEGER, INTEGER) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.v1_get_comments_for_place(TEXT, INTEGER, INTEGER) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.v1_update_comment_for_place(UUID, TEXT, TEXT, TEXT[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.v1_deactivate_comment_for_place(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.v1_toggle_comment_like_for_place(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.v1_get_comment_count_for_place(TEXT) TO authenticated, anon;
*/