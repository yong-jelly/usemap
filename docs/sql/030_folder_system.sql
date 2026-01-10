-- =====================================================
-- 030_folder_system.sql
-- 맛탐정(사용자 정의 폴더) 시스템 테이블 및 RPC 함수 정의
-- 
-- 실행 방법:
--   psql "postgresql://postgres.xyqpggpilgcdsawuvpzn:ZNDqDunnaydr0aFQ@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres" -f docs/sql/030_folder_system.sql
-- =====================================================

-- 1. 테이블 정의

-- 폴더 테이블
CREATE TABLE IF NOT EXISTS public.tbl_folder (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::varchar,
    owner_id UUID NOT NULL REFERENCES auth.users(id),
    title VARCHAR(20) NOT NULL,
    description VARCHAR(50),
    permission VARCHAR DEFAULT 'public', -- 'public', 'private', 'hidden', 'invite', 'default'
    permission_write_type INT DEFAULT 0, -- 0: 소유자만, 1: 초대자 함께
    invite_code VARCHAR(5),
    invite_code_expires_at TIMESTAMPTZ,
    subscriber_count INT DEFAULT 0,
    place_count INT DEFAULT 0,
    is_hidden BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 폴더 내 장소 테이블
CREATE TABLE IF NOT EXISTS public.tbl_folder_place (
    folder_id VARCHAR NOT NULL REFERENCES public.tbl_folder(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    place_id VARCHAR NOT NULL REFERENCES public.tbl_place(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    PRIMARY KEY (folder_id, place_id)
);

-- 폴더 구독 테이블
CREATE TABLE IF NOT EXISTS public.tbl_folder_subscribed (
    folder_id VARCHAR NOT NULL REFERENCES public.tbl_folder(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    activation BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    PRIMARY KEY (folder_id, user_id)
);

-- 피쳐 구독 테이블 (네이버 폴더, 유튜브 채널, 커뮤니티 지역 등)
CREATE TABLE IF NOT EXISTS public.tbl_feature_subscription (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    feature_type VARCHAR NOT NULL, -- 'naver_folder', 'youtube_channel', 'community_region'
    feature_id VARCHAR NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    UNIQUE(user_id, feature_type, feature_id)
);

-- 초대 히스토리 테이블 (invite 폴더용)
CREATE TABLE IF NOT EXISTS public.tbl_folder_invite_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    folder_id VARCHAR NOT NULL REFERENCES public.tbl_folder(id) ON DELETE CASCADE,
    invite_code VARCHAR(5) NOT NULL,
    invited_user_id UUID REFERENCES auth.users(id),
    status VARCHAR DEFAULT 'pending', -- 'pending', 'accepted', 'expired'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    accepted_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ NOT NULL
);

-- 비공개 리뷰 테이블 (invite 폴더 전용)
CREATE TABLE IF NOT EXISTS public.tbl_folder_review (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    folder_id VARCHAR NOT NULL REFERENCES public.tbl_folder(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    place_id VARCHAR NOT NULL REFERENCES public.tbl_place(id),
    review_content TEXT,
    score DECIMAL(2,1),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    UNIQUE(folder_id, user_id, place_id)
);

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_folder_owner ON public.tbl_folder(owner_id);
CREATE INDEX IF NOT EXISTS idx_folder_permission ON public.tbl_folder(permission) WHERE is_hidden = FALSE;
CREATE INDEX IF NOT EXISTS idx_folder_place_folder_id ON public.tbl_folder_place(folder_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_folder_subscribed_user_id ON public.tbl_folder_subscribed(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_folder_invite_history_folder ON public.tbl_folder_invite_history(folder_id);
CREATE INDEX IF NOT EXISTS idx_folder_invite_history_code ON public.tbl_folder_invite_history(invite_code) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_folder_review_folder ON public.tbl_folder_review(folder_id) WHERE deleted_at IS NULL;

-- 2. RPC 함수 정의

-- 공개 폴더 목록 조회
DROP FUNCTION IF EXISTS public.v1_list_public_folders(INT, INT);
CREATE OR REPLACE FUNCTION public.v1_list_public_folders(
    p_limit INT DEFAULT 20,
    p_offset INT DEFAULT 0
)
RETURNS TABLE (
    id VARCHAR,
    owner_id UUID,
    owner_nickname TEXT,
    owner_avatar_url TEXT,
    title VARCHAR,
    description VARCHAR,
    permission VARCHAR,
    subscriber_count INT,
    place_count INT,
    created_at TIMESTAMPTZ,
    preview_places JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
#variable_conflict use_column
BEGIN
    RETURN QUERY
    SELECT 
        f.id,
        f.owner_id,
        p.nickname AS owner_nickname,
        p.profile_image_url AS owner_avatar_url,
        f.title,
        f.description,
        f.permission,
        f.subscriber_count,
        f.place_count,
        f.created_at::TIMESTAMPTZ,
        (
            SELECT jsonb_agg(sub.place_info)
            FROM (
                SELECT jsonb_build_object(
                    'id', pl.id,
                    'name', pl.name,
                    'category', pl.category,
                    'image_urls', pl.images
                ) AS place_info
                FROM public.tbl_folder_place fp
                JOIN public.tbl_place pl ON fp.place_id = pl.id
                WHERE fp.folder_id = f.id AND fp.deleted_at IS NULL
                ORDER BY fp.created_at DESC
                LIMIT 5
            ) sub
        ) AS preview_places
    FROM public.tbl_folder f
    LEFT JOIN public.tbl_user_profile p ON f.owner_id = p.auth_user_id
    WHERE f.permission = 'public' 
      AND f.is_hidden = FALSE
    ORDER BY f.subscriber_count DESC, f.created_at DESC
    LIMIT p_limit OFFSET p_offset;
END;
$$;

-- 내 폴더 목록 조회
DROP FUNCTION IF EXISTS public.v1_list_my_folders();
CREATE OR REPLACE FUNCTION public.v1_list_my_folders()
RETURNS TABLE (
    id VARCHAR,
    title VARCHAR,
    description VARCHAR,
    permission VARCHAR,
    place_count INT,
    subscriber_count INT,
    created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
#variable_conflict use_column
BEGIN
    RETURN QUERY
    SELECT 
        f.id,
        f.title,
        f.description,
        f.permission,
        f.place_count,
        f.subscriber_count,
        f.created_at::TIMESTAMPTZ
    FROM public.tbl_folder f
    WHERE f.owner_id = auth.uid()
      AND f.is_hidden = FALSE
    ORDER BY (f.permission = 'default') DESC, f.created_at DESC;
END;
$$;

-- 폴더 상세 정보 조회
DROP FUNCTION IF EXISTS public.v1_get_folder_info(VARCHAR);
CREATE OR REPLACE FUNCTION public.v1_get_folder_info(
    p_folder_id VARCHAR
)
RETURNS TABLE (
    id VARCHAR,
    owner_id UUID,
    owner_nickname TEXT,
    owner_avatar_url TEXT,
    title VARCHAR,
    description VARCHAR,
    permission VARCHAR,
    permission_write_type INT,
    invite_code VARCHAR,
    invite_code_expires_at TIMESTAMPTZ,
    subscriber_count INT,
    place_count INT,
    created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
#variable_conflict use_column
DECLARE
    v_user_id UUID;
    v_folder_owner_id UUID;
    v_is_owner BOOLEAN;
    v_is_subscribed BOOLEAN;
    v_folder_permission VARCHAR;
BEGIN
    v_user_id := auth.uid();
    
    -- 기본 정보 및 권한 확인
    SELECT f.owner_id, f.permission INTO v_folder_owner_id, v_folder_permission 
    FROM public.tbl_folder f
    WHERE f.id = p_folder_id AND f.is_hidden = FALSE;

    IF v_folder_owner_id IS NULL THEN
        RETURN;
    END IF;

    v_is_owner := (v_user_id IS NOT NULL AND v_folder_owner_id = v_user_id);

    -- 구독 여부 확인
    IF v_user_id IS NOT NULL THEN
        SELECT EXISTS (
            SELECT 1 FROM public.tbl_folder_subscribed sub
            WHERE sub.folder_id = p_folder_id AND sub.user_id = v_user_id AND sub.deleted_at IS NULL
        ) INTO v_is_subscribed;
    ELSE
        v_is_subscribed := FALSE;
    END IF;

    -- 접근 권한 체크 (v1_check_folder_access와 동일한 로직)
    IF v_folder_permission = 'hidden' AND NOT v_is_owner THEN
        RETURN;
    END IF;

    IF v_folder_permission = 'invite' AND NOT (v_is_owner OR v_is_subscribed) THEN
        RETURN;
    END IF;

    IF v_folder_permission = 'default' AND NOT v_is_owner THEN
        RETURN;
    END IF;

    RETURN QUERY
    SELECT 
        f.id,
        f.owner_id,
        prof.nickname AS owner_nickname,
        prof.profile_image_url AS owner_avatar_url,
        f.title,
        f.description,
        f.permission,
        f.permission_write_type,
        CASE WHEN v_is_owner THEN f.invite_code ELSE NULL::VARCHAR END AS invite_code,
        CASE WHEN v_is_owner THEN f.invite_code_expires_at::TIMESTAMPTZ ELSE NULL::TIMESTAMPTZ END AS invite_code_expires_at,
        f.subscriber_count,
        f.place_count,
        f.created_at::TIMESTAMPTZ
    FROM public.tbl_folder f
    LEFT JOIN public.tbl_user_profile prof ON f.owner_id = prof.auth_user_id
    WHERE f.id = p_folder_id;
END;
$$;

-- 폴더 생성 (invite의 경우 초대 코드도 함께 생성)
DROP FUNCTION IF EXISTS public.v1_create_folder(VARCHAR, VARCHAR, VARCHAR, INT);
CREATE OR REPLACE FUNCTION public.v1_create_folder(
    p_title VARCHAR,
    p_description VARCHAR,
    p_permission VARCHAR DEFAULT 'public',
    p_permission_write_type INT DEFAULT 0
)
RETURNS TABLE (
    id VARCHAR,
    title VARCHAR,
    permission VARCHAR,
    invite_code VARCHAR,
    invite_code_expires_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
#variable_conflict use_column
DECLARE
    v_folder_id VARCHAR;
    v_invite_code VARCHAR(5);
    v_expires_at TIMESTAMPTZ;
BEGIN
    -- invite 권한의 경우 초대 코드 생성
    IF p_permission = 'invite' THEN
        v_invite_code := upper(substr(md5(random()::text), 1, 5));
        v_expires_at := NOW() + INTERVAL '24 hours';
    END IF;

    INSERT INTO public.tbl_folder (
        owner_id,
        title,
        description,
        permission,
        permission_write_type,
        invite_code,
        invite_code_expires_at
    ) VALUES (
        auth.uid(),
        p_title,
        p_description,
        p_permission,
        p_permission_write_type,
        v_invite_code,
        v_expires_at
    ) RETURNING tbl_folder.id INTO v_folder_id;

    -- invite의 경우 히스토리에도 기록
    IF p_permission = 'invite' THEN
        INSERT INTO public.tbl_folder_invite_history (folder_id, invite_code, expires_at)
        VALUES (v_folder_id, v_invite_code, v_expires_at);
    END IF;
    
    RETURN QUERY
    SELECT 
        f.id,
        f.title,
        f.permission,
        f.invite_code,
        f.invite_code_expires_at::TIMESTAMPTZ
    FROM public.tbl_folder f
    WHERE f.id = v_folder_id;
END;
$$;

-- 초대 코드 재생성 (관리자용, 24시간 유효)
DROP FUNCTION IF EXISTS public.v1_regenerate_invite_code(VARCHAR);
CREATE OR REPLACE FUNCTION public.v1_regenerate_invite_code(
    p_folder_id VARCHAR
)
RETURNS TABLE (
    invite_code VARCHAR,
    expires_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
#variable_conflict use_column
DECLARE
    v_owner_id UUID;
    v_permission VARCHAR;
    v_new_code VARCHAR(5);
    v_expires_at TIMESTAMPTZ;
BEGIN
    -- 권한 체크
    SELECT f.owner_id, f.permission INTO v_owner_id, v_permission 
    FROM public.tbl_folder f WHERE f.id = p_folder_id;
    
    IF v_owner_id != auth.uid() THEN
        RAISE EXCEPTION '권한이 없습니다.';
    END IF;
    
    IF v_permission != 'invite' THEN
        RAISE EXCEPTION 'invite 권한의 폴더만 초대 코드를 생성할 수 있습니다.';
    END IF;

    -- 기존 코드 만료 처리
    UPDATE public.tbl_folder_invite_history 
    SET status = 'expired' 
    WHERE folder_id = p_folder_id AND status = 'pending';

    -- 새 코드 생성
    v_new_code := upper(substr(md5(random()::text), 1, 5));
    v_expires_at := NOW() + INTERVAL '24 hours';

    -- 폴더 업데이트
    UPDATE public.tbl_folder 
    SET invite_code = v_new_code, invite_code_expires_at = v_expires_at, updated_at = NOW()
    WHERE id = p_folder_id;

    -- 히스토리 기록
    INSERT INTO public.tbl_folder_invite_history (folder_id, invite_code, expires_at)
    VALUES (p_folder_id, v_new_code, v_expires_at);

    RETURN QUERY SELECT v_new_code, v_expires_at;
END;
$$;

-- 초대 코드 검증 및 폴더 구독
DROP FUNCTION IF EXISTS public.v1_verify_invite_code(VARCHAR, VARCHAR);
CREATE OR REPLACE FUNCTION public.v1_verify_invite_code(
    p_folder_id VARCHAR,
    p_invite_code VARCHAR
)
RETURNS TABLE (
    success BOOLEAN,
    error VARCHAR,
    folder_id VARCHAR
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
#variable_conflict use_column
DECLARE
    v_user_id UUID;
    v_folder_permission VARCHAR;
    v_stored_code VARCHAR;
    v_expires_at TIMESTAMPTZ;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RETURN QUERY SELECT false, 'LOGIN_REQUIRED'::VARCHAR, NULL::VARCHAR;
        RETURN;
    END IF;

    -- 폴더 정보 조회
    SELECT f.permission, f.invite_code, f.invite_code_expires_at 
    INTO v_folder_permission, v_stored_code, v_expires_at
    FROM public.tbl_folder f WHERE f.id = p_folder_id AND f.is_hidden = FALSE;

    IF v_folder_permission IS NULL THEN
        RETURN QUERY SELECT false, 'FOLDER_NOT_FOUND'::VARCHAR, NULL::VARCHAR;
        RETURN;
    END IF;

    IF v_folder_permission != 'invite' THEN
        RETURN QUERY SELECT false, 'NOT_INVITE_FOLDER'::VARCHAR, NULL::VARCHAR;
        RETURN;
    END IF;

    IF v_stored_code IS NULL OR upper(p_invite_code) != upper(v_stored_code) THEN
        RETURN QUERY SELECT false, 'INVALID_CODE'::VARCHAR, NULL::VARCHAR;
        RETURN;
    END IF;

    IF v_expires_at < NOW() THEN
        RETURN QUERY SELECT false, 'CODE_EXPIRED'::VARCHAR, NULL::VARCHAR;
        RETURN;
    END IF;

    -- 구독 추가
    INSERT INTO public.tbl_folder_subscribed (folder_id, user_id, activation)
    VALUES (p_folder_id, v_user_id, TRUE)
    ON CONFLICT (folder_id, user_id) 
    DO UPDATE SET deleted_at = NULL, updated_at = NOW(), activation = TRUE;

    -- 구독자 수 업데이트
    UPDATE public.tbl_folder 
    SET subscriber_count = (
        SELECT count(*) FROM public.tbl_folder_subscribed 
        WHERE folder_id = p_folder_id AND deleted_at IS NULL
    )
    WHERE id = p_folder_id;

    -- 히스토리 업데이트
    UPDATE public.tbl_folder_invite_history 
    SET invited_user_id = v_user_id, status = 'accepted', accepted_at = NOW()
    WHERE folder_id = p_folder_id AND invite_code = upper(p_invite_code) AND status = 'pending';

    RETURN QUERY SELECT true, NULL::VARCHAR, p_folder_id;
END;
$$;

-- 폴더 접근 권한 체크
DROP FUNCTION IF EXISTS public.v1_check_folder_access(VARCHAR);
CREATE OR REPLACE FUNCTION public.v1_check_folder_access(
    p_folder_id VARCHAR
)
RETURNS TABLE (
    access VARCHAR,
    can_view BOOLEAN,
    can_edit BOOLEAN,
    is_owner BOOLEAN,
    is_subscribed BOOLEAN,
    is_unlisted BOOLEAN,
    is_default BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
#variable_conflict use_column
DECLARE
    v_user_id UUID;
    v_folder RECORD;
    v_is_owner BOOLEAN;
    v_is_subscribed BOOLEAN;
BEGIN
    v_user_id := auth.uid();

    SELECT * INTO v_folder FROM public.tbl_folder WHERE id = p_folder_id;

    IF v_folder IS NULL OR v_folder.is_hidden THEN
        RETURN QUERY SELECT 'NOT_FOUND'::VARCHAR, false, false, false, false, false, false;
        RETURN;
    END IF;

    v_is_owner := (v_user_id IS NOT NULL AND v_folder.owner_id = v_user_id);
    
    IF v_user_id IS NOT NULL THEN
        SELECT EXISTS (
            SELECT 1 FROM public.tbl_folder_subscribed 
            WHERE folder_id = p_folder_id AND user_id = v_user_id AND deleted_at IS NULL
        ) INTO v_is_subscribed;
    ELSE
        v_is_subscribed := FALSE;
    END IF;

    -- 권한별 접근 판단
    CASE v_folder.permission
        WHEN 'public' THEN
            RETURN QUERY SELECT 'ALLOWED'::VARCHAR, true, v_is_owner, v_is_owner, v_is_subscribed, false, false;
        WHEN 'private' THEN
            -- URL 접속 가능하지만 목록에서는 안 보임
            RETURN QUERY SELECT 'ALLOWED'::VARCHAR, true, v_is_owner, v_is_owner, v_is_subscribed, true, false;
        WHEN 'hidden' THEN
            -- 소유자만 접근 가능
            IF v_is_owner THEN
                RETURN QUERY SELECT 'ALLOWED'::VARCHAR, true, true, true, false, false, false;
            ELSE
                RETURN QUERY SELECT 'NOT_FOUND'::VARCHAR, false, false, false, false, false, false;
            END IF;
        WHEN 'invite' THEN
            -- 소유자 또는 구독자만 접근 가능
            IF v_is_owner OR v_is_subscribed THEN
                RETURN QUERY SELECT 'ALLOWED'::VARCHAR, true, v_is_owner OR (v_is_subscribed AND v_folder.permission_write_type = 1), v_is_owner, v_is_subscribed, false, false;
            ELSIF v_user_id IS NOT NULL THEN
                -- 로그인 사용자: 코드 입력 필요
                RETURN QUERY SELECT 'INVITE_CODE_REQUIRED'::VARCHAR, false, false, false, false, false, false;
            ELSE
                -- 비로그인: 404
                RETURN QUERY SELECT 'NOT_FOUND'::VARCHAR, false, false, false, false, false, false;
            END IF;
        WHEN 'default' THEN
            -- 본인의 기본 폴더만 접근 가능
            IF v_is_owner THEN
                RETURN QUERY SELECT 'ALLOWED'::VARCHAR, true, true, true, false, false, true;
            ELSE
                RETURN QUERY SELECT 'NOT_FOUND'::VARCHAR, false, false, false, false, false, false;
            END IF;
        ELSE
            RETURN QUERY SELECT 'NOT_FOUND'::VARCHAR, false, false, false, false, false, false;
    END CASE;
END;
$$;

-- 초대 히스토리 조회 (관리자용)
CREATE OR REPLACE FUNCTION public.v1_get_invite_history(
    p_folder_id VARCHAR
)
RETURNS TABLE (
    id UUID,
    invite_code VARCHAR,
    invited_user_nickname TEXT,
    status VARCHAR,
    created_at TIMESTAMPTZ,
    accepted_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
#variable_conflict use_column
DECLARE
    v_owner_id UUID;
BEGIN
    -- 권한 체크
    SELECT f.owner_id INTO v_owner_id 
    FROM public.tbl_folder f 
    WHERE f.id = p_folder_id;
    
    IF v_owner_id IS NULL OR v_owner_id != auth.uid() THEN
        RAISE EXCEPTION '권한이 없습니다.';
    END IF;

    RETURN QUERY
    SELECT 
        h.id,
        h.invite_code,
        p.nickname as invited_user_nickname,
        h.status,
        h.created_at,
        h.accepted_at,
        h.expires_at
    FROM public.tbl_folder_invite_history h
    LEFT JOIN public.tbl_user_profile p ON h.invited_user_id = p.auth_user_id
    WHERE h.folder_id = p_folder_id
    ORDER BY h.created_at DESC;
END;
$$;

-- 폴더 숨김 (삭제 대신)
CREATE OR REPLACE FUNCTION public.v1_hide_folder(
    p_folder_id VARCHAR
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
#variable_conflict use_column
DECLARE
    v_owner_id UUID;
    v_permission VARCHAR;
BEGIN
    SELECT owner_id, permission INTO v_owner_id, v_permission 
    FROM public.tbl_folder WHERE id = p_folder_id;
    
    IF v_owner_id != auth.uid() THEN
        RAISE EXCEPTION '권한이 없습니다.';
    END IF;

    -- 기본 폴더는 숨길 수 없음
    IF v_permission = 'default' THEN
        RAISE EXCEPTION '기본 폴더는 숨길 수 없습니다.';
    END IF;

    UPDATE public.tbl_folder SET is_hidden = TRUE, updated_at = NOW() WHERE id = p_folder_id;
    RETURN TRUE;
END;
$$;

-- 폴더 정보 업데이트 (기본 폴더 제외)
CREATE OR REPLACE FUNCTION public.v1_update_folder(
    p_folder_id VARCHAR,
    p_title VARCHAR DEFAULT NULL,
    p_description VARCHAR DEFAULT NULL,
    p_permission_write_type INT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
#variable_conflict use_column
DECLARE
    v_owner_id UUID;
    v_permission VARCHAR;
BEGIN
    SELECT owner_id, permission INTO v_owner_id, v_permission 
    FROM public.tbl_folder WHERE id = p_folder_id;
    
    IF v_owner_id != auth.uid() THEN
        RAISE EXCEPTION '권한이 없습니다.';
    END IF;

    -- 기본 폴더는 수정 불가
    IF v_permission = 'default' THEN
        RAISE EXCEPTION '기본 폴더는 수정할 수 없습니다.';
    END IF;

    UPDATE public.tbl_folder 
    SET 
        title = COALESCE(p_title, title),
        description = COALESCE(p_description, description),
        permission_write_type = COALESCE(p_permission_write_type, permission_write_type),
        updated_at = NOW()
    WHERE id = p_folder_id;
    
    RETURN TRUE;
END;
$$;

-- 장소를 폴더에 추가 (invite 폴더의 공동 편집 지원)
DROP FUNCTION IF EXISTS public.v1_add_place_to_folder(VARCHAR, VARCHAR);
CREATE OR REPLACE FUNCTION public.v1_add_place_to_folder(
    p_folder_id VARCHAR,
    p_place_id VARCHAR
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
#variable_conflict use_column
DECLARE
    v_user_id UUID;
    v_owner_id UUID;
    v_permission VARCHAR;
    v_permission_write_type INT;
    v_is_subscribed BOOLEAN;
    v_can_write BOOLEAN := FALSE;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION '로그인이 필요합니다.';
    END IF;

    -- 폴더 정보 조회
    SELECT f.owner_id, f.permission, f.permission_write_type 
    INTO v_owner_id, v_permission, v_permission_write_type 
    FROM public.tbl_folder f WHERE f.id = p_folder_id AND f.is_hidden = FALSE;
    
    IF v_owner_id IS NULL THEN
        RAISE EXCEPTION '폴더를 찾을 수 없습니다.';
    END IF;

    -- 권한 체크
    IF v_owner_id = v_user_id THEN
        v_can_write := TRUE;
    ELSIF v_permission = 'invite' AND v_permission_write_type = 1 THEN
        -- invite 폴더이고 공동 편집이 허용된 경우, 구독자인지 확인
        SELECT EXISTS (
            SELECT 1 FROM public.tbl_folder_subscribed 
            WHERE folder_id = p_folder_id AND user_id = v_user_id AND deleted_at IS NULL
        ) INTO v_is_subscribed;
        v_can_write := v_is_subscribed;
    END IF;

    IF NOT v_can_write THEN
        RAISE EXCEPTION '권한이 없습니다.';
    END IF;

    INSERT INTO public.tbl_folder_place (folder_id, user_id, place_id)
    VALUES (p_folder_id, v_user_id, p_place_id)
    ON CONFLICT (folder_id, place_id) DO UPDATE SET deleted_at = NULL, user_id = v_user_id;

    -- 카운트 업데이트
    UPDATE public.tbl_folder 
    SET place_count = (SELECT count(*) FROM public.tbl_folder_place WHERE folder_id = p_folder_id AND deleted_at IS NULL),
        updated_at = NOW()
    WHERE id = p_folder_id;

    RETURN TRUE;
END;
$$;

-- 폴더에서 장소 제거
CREATE OR REPLACE FUNCTION public.v1_remove_place_from_folder(
    p_folder_id VARCHAR,
    p_place_id VARCHAR
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
#variable_conflict use_column
DECLARE
    v_user_id UUID;
    v_owner_id UUID;
    v_permission VARCHAR;
    v_permission_write_type INT;
    v_place_added_by UUID;
    v_can_delete BOOLEAN := FALSE;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION '로그인이 필요합니다.';
    END IF;

    -- 폴더 정보 조회
    SELECT f.owner_id, f.permission, f.permission_write_type 
    INTO v_owner_id, v_permission, v_permission_write_type 
    FROM public.tbl_folder f WHERE f.id = p_folder_id;

    -- 장소 등록자 확인
    SELECT user_id INTO v_place_added_by 
    FROM public.tbl_folder_place 
    WHERE folder_id = p_folder_id AND place_id = p_place_id AND deleted_at IS NULL;

    -- 권한 체크: 소유자이거나, 본인이 등록한 장소인 경우
    IF v_owner_id = v_user_id OR v_place_added_by = v_user_id THEN
        v_can_delete := TRUE;
    END IF;

    IF NOT v_can_delete THEN
        RAISE EXCEPTION '권한이 없습니다.';
    END IF;

    -- 소프트 삭제
    UPDATE public.tbl_folder_place 
    SET deleted_at = NOW() 
    WHERE folder_id = p_folder_id AND place_id = p_place_id;

    -- 카운트 업데이트
    UPDATE public.tbl_folder 
    SET place_count = (SELECT count(*) FROM public.tbl_folder_place WHERE folder_id = p_folder_id AND deleted_at IS NULL),
        updated_at = NOW()
    WHERE id = p_folder_id;

    RETURN TRUE;
END;
$$;

-- 비공개 폴더 리뷰 작성/수정
CREATE OR REPLACE FUNCTION public.v1_upsert_folder_review(
    p_folder_id VARCHAR,
    p_place_id VARCHAR,
    p_review_content TEXT,
    p_score DECIMAL(2,1)
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
#variable_conflict use_column
DECLARE
    v_user_id UUID;
    v_permission VARCHAR;
    v_is_subscribed BOOLEAN;
    v_review_id UUID;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION '로그인이 필요합니다.';
    END IF;

    -- invite 폴더인지 확인
    SELECT permission INTO v_permission FROM public.tbl_folder WHERE id = p_folder_id;
    IF v_permission != 'invite' THEN
        RAISE EXCEPTION 'invite 폴더에서만 비공개 리뷰를 작성할 수 있습니다.';
    END IF;

    -- 구독자인지 확인
    SELECT EXISTS (
        SELECT 1 FROM public.tbl_folder_subscribed 
        WHERE folder_id = p_folder_id AND user_id = v_user_id AND deleted_at IS NULL
    ) INTO v_is_subscribed;

    IF NOT v_is_subscribed THEN
        RAISE EXCEPTION '구독 중인 폴더에서만 리뷰를 작성할 수 있습니다.';
    END IF;

    -- 리뷰 작성/수정
    INSERT INTO public.tbl_folder_review (folder_id, user_id, place_id, review_content, score)
    VALUES (p_folder_id, v_user_id, p_place_id, p_review_content, p_score)
    ON CONFLICT (folder_id, user_id, place_id) 
    DO UPDATE SET review_content = p_review_content, score = p_score, updated_at = NOW(), deleted_at = NULL
    RETURNING id INTO v_review_id;

    RETURN jsonb_build_object('id', v_review_id, 'success', true);
END;
$$;

-- 비공개 폴더 리뷰 조회
CREATE OR REPLACE FUNCTION public.v1_get_folder_reviews(
    p_folder_id VARCHAR,
    p_place_id VARCHAR DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    user_nickname TEXT,
    user_avatar TEXT,
    place_id VARCHAR,
    review_content TEXT,
    score DECIMAL(2,1),
    created_at TIMESTAMPTZ,
    is_my_review BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
#variable_conflict use_column
DECLARE
    v_user_id UUID;
    v_is_subscribed BOOLEAN;
    v_folder_owner_id UUID;
BEGIN
    v_user_id := auth.uid();

    -- 접근 권한 확인 (소유자 또는 구독자)
    SELECT f.owner_id INTO v_folder_owner_id FROM public.tbl_folder f WHERE f.id = p_folder_id;
    
    IF v_user_id IS NOT NULL THEN
        SELECT EXISTS (
            SELECT 1 FROM public.tbl_folder_subscribed sub
            WHERE sub.folder_id = p_folder_id AND sub.user_id = v_user_id AND sub.deleted_at IS NULL
        ) INTO v_is_subscribed;
    END IF;

    IF v_folder_owner_id != v_user_id AND NOT COALESCE(v_is_subscribed, FALSE) THEN
        RAISE EXCEPTION '권한이 없습니다.';
    END IF;

    RETURN QUERY
    SELECT 
        r.id,
        r.user_id,
        prof.nickname as user_nickname,
        prof.profile_image_url as user_avatar,
        r.place_id,
        r.review_content,
        r.score,
        r.created_at,
        (r.user_id = v_user_id) as is_my_review
    FROM public.tbl_folder_review r
    LEFT JOIN public.tbl_user_profile prof ON r.user_id = prof.auth_user_id
    WHERE r.folder_id = p_folder_id 
      AND r.deleted_at IS NULL
      AND (p_place_id IS NULL OR r.place_id = p_place_id)
    ORDER BY r.created_at DESC;
END;
$$;

-- 폴더 내 장소 목록 조회
DROP FUNCTION IF EXISTS public.v1_get_folder_places(VARCHAR, INT, INT);
CREATE OR REPLACE FUNCTION public.v1_get_folder_places(
    p_folder_id VARCHAR,
    p_limit INT DEFAULT 20,
    p_offset INT DEFAULT 0
)
RETURNS TABLE (
    place_id VARCHAR,
    place_data JSONB,
    added_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
#variable_conflict use_column
DECLARE
    v_user_id UUID;
    v_folder_owner_id UUID;
    v_folder_permission VARCHAR;
    v_is_owner BOOLEAN;
    v_is_subscribed BOOLEAN;
BEGIN
    v_user_id := auth.uid();

    -- 폴더 정보 및 권한 확인
    SELECT f.owner_id, f.permission INTO v_folder_owner_id, v_folder_permission 
    FROM public.tbl_folder f
    WHERE f.id = p_folder_id AND f.is_hidden = FALSE;

    IF v_folder_owner_id IS NULL THEN
        RETURN;
    END IF;

    v_is_owner := (v_user_id IS NOT NULL AND v_folder_owner_id = v_user_id);

    -- 구독 여부 확인
    IF v_user_id IS NOT NULL THEN
        SELECT EXISTS (
            SELECT 1 FROM public.tbl_folder_subscribed sub
            WHERE sub.folder_id = p_folder_id AND sub.user_id = v_user_id AND sub.deleted_at IS NULL
        ) INTO v_is_subscribed;
    ELSE
        v_is_subscribed := FALSE;
    END IF;

    -- 접근 권한 체크
    IF v_folder_permission = 'hidden' AND NOT v_is_owner THEN
        RETURN;
    END IF;

    IF v_folder_permission = 'invite' AND NOT (v_is_owner OR v_is_subscribed) THEN
        RETURN;
    END IF;

    IF v_folder_permission = 'default' AND NOT v_is_owner THEN
        RETURN;
    END IF;

    RETURN QUERY
    SELECT 
        pl.id,
        (to_jsonb(pl) || jsonb_build_object(
            'image_urls', pl.images,
            'interaction', public.v1_common_place_interaction(pl.id),
            'features', public.v1_common_place_features(pl.id),
            'experience', jsonb_build_object('is_visited', public.v1_has_visited_place(pl.id))
        )) AS p_data,
        fp.created_at::TIMESTAMPTZ AS a_at
    FROM public.tbl_folder_place fp
    JOIN public.tbl_place pl ON fp.place_id = pl.id
    WHERE fp.folder_id = p_folder_id 
      AND fp.deleted_at IS NULL
    ORDER BY fp.created_at DESC
    LIMIT p_limit OFFSET p_offset;
END;
$$;

-- 폴더 구독 토글
CREATE OR REPLACE FUNCTION public.v1_toggle_folder_subscription(
    p_folder_id VARCHAR
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
#variable_conflict use_column
DECLARE
    v_user_id UUID;
    v_exists BOOLEAN;
    v_is_subscribed BOOLEAN;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION '로그인이 필요합니다.';
    END IF;

    -- 이미 구독 중인지 확인
    SELECT EXISTS (
        SELECT 1 FROM public.tbl_folder_subscribed 
        WHERE folder_id = p_folder_id AND user_id = v_user_id AND deleted_at IS NULL
    ) INTO v_exists;

    IF v_exists THEN
        -- 구독 취소 (소프트 삭제)
        UPDATE public.tbl_folder_subscribed 
        SET deleted_at = NOW(), updated_at = NOW()
        WHERE folder_id = p_folder_id AND user_id = v_user_id;
        v_is_subscribed := FALSE;
    ELSE
        -- 구독 추가 또는 재활성화
        INSERT INTO public.tbl_folder_subscribed (folder_id, user_id, activation)
        VALUES (p_folder_id, v_user_id, TRUE)
        ON CONFLICT (folder_id, user_id) 
        DO UPDATE SET deleted_at = NULL, updated_at = NOW(), activation = TRUE;
        v_is_subscribed := TRUE;
    END IF;

    -- 폴더의 구독자 수 업데이트
    UPDATE public.tbl_folder 
    SET subscriber_count = (
        SELECT count(*) FROM public.tbl_folder_subscribed 
        WHERE folder_id = p_folder_id AND deleted_at IS NULL
    )
    WHERE id = p_folder_id;

    RETURN jsonb_build_object(
        'is_subscribed', v_is_subscribed,
        'subscriber_count', (SELECT subscriber_count FROM public.tbl_folder WHERE id = p_folder_id)
    );
END;
$$;

-- 피쳐 구독 토글
CREATE OR REPLACE FUNCTION public.v1_toggle_feature_subscription(
    p_feature_type VARCHAR,
    p_feature_id VARCHAR
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
#variable_conflict use_column
DECLARE
    v_user_id UUID;
    v_exists BOOLEAN;
    v_is_subscribed BOOLEAN;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION '로그인이 필요합니다.';
    END IF;

    -- 이미 구독 중인지 확인
    SELECT EXISTS (
        SELECT 1 FROM public.tbl_feature_subscription 
        WHERE feature_type = p_feature_type AND feature_id = p_feature_id AND user_id = v_user_id AND deleted_at IS NULL
    ) INTO v_exists;

    IF v_exists THEN
        -- 구독 취소 (소프트 삭제)
        UPDATE public.tbl_feature_subscription 
        SET deleted_at = NOW(), updated_at = NOW()
        WHERE feature_type = p_feature_type AND feature_id = p_feature_id AND user_id = v_user_id;
        v_is_subscribed := FALSE;
    ELSE
        -- 구독 추가 또는 재활성화
        INSERT INTO public.tbl_feature_subscription (feature_type, feature_id, user_id)
        VALUES (p_feature_type, p_feature_id, v_user_id)
        ON CONFLICT (user_id, feature_type, feature_id) 
        DO UPDATE SET deleted_at = NULL, updated_at = NOW();
        v_is_subscribed := TRUE;
    END IF;

    -- 필요하다면 여기서 각 피쳐 테이블의 카운트를 업데이트할 수 있음
    -- (현재는 클라이언트에서 처리하거나 조인으로 해결)

    RETURN jsonb_build_object(
        'is_subscribed', v_is_subscribed
    );
END;
$$;

-- 내 구독 목록 조회
DROP FUNCTION IF EXISTS public.v1_list_my_subscriptions();
CREATE OR REPLACE FUNCTION public.v1_list_my_subscriptions()
RETURNS TABLE (
    subscription_type VARCHAR, -- 'folder', 'naver_folder', 'youtube_channel', 'community_region'
    feature_id VARCHAR,
    title VARCHAR,
    description VARCHAR,
    thumbnail TEXT,
    created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
#variable_conflict use_column
BEGIN
    RETURN QUERY
    -- 사용자 폴더 구독
    SELECT 
        'folder'::VARCHAR as subscription_type,
        f.id::VARCHAR as feature_id,
        f.title,
        f.description,
        p.profile_image_url as thumbnail,
        fs.created_at::TIMESTAMPTZ
    FROM public.tbl_folder_subscribed fs
    JOIN public.tbl_folder f ON fs.folder_id = f.id
    LEFT JOIN public.tbl_user_profile p ON f.owner_id = p.auth_user_id
    WHERE fs.user_id = auth.uid() AND fs.deleted_at IS NULL
    
    UNION ALL
    
    -- 시스템 피쳐 구독
    SELECT 
        fts.feature_type as subscription_type,
        fts.feature_id,
        CASE 
            WHEN fts.feature_type = 'naver_folder' THEN (SELECT name::text FROM public.tbl_naver_folder WHERE folder_id::varchar = fts.feature_id)
            WHEN fts.feature_type = 'youtube_channel' THEN (SELECT metadata->>'channelTitle' FROM public.tbl_place_features WHERE metadata->>'channelId' = fts.feature_id LIMIT 1)
            WHEN fts.feature_type = 'community_region' THEN fts.feature_id -- 지역명 자체가 제목
            ELSE 'Unknown'
        END as title,
        NULL::VARCHAR as description,
        CASE 
            WHEN fts.feature_type = 'youtube_channel' THEN (SELECT metadata->'thumbnails'->'medium'->>'url' FROM public.tbl_place_features WHERE metadata->>'channelId' = fts.feature_id LIMIT 1)
            ELSE NULL
        END as thumbnail,
        fts.created_at::TIMESTAMPTZ
    FROM public.tbl_feature_subscription fts
    WHERE fts.user_id = auth.uid() AND fts.deleted_at IS NULL
    
    ORDER BY created_at DESC;
END;
$$;

-- 피드 조회 (구독 중인 폴더 및 피쳐의 새 장소)
DROP FUNCTION IF EXISTS public.v1_get_my_feed(INT, INT);
CREATE OR REPLACE FUNCTION public.v1_get_my_feed(
    p_limit INT DEFAULT 20,
    p_offset INT DEFAULT 0
)
RETURNS TABLE (
    source_type VARCHAR, -- 'folder', 'naver_folder', 'youtube_channel', 'community_region'
    source_id VARCHAR,
    source_title VARCHAR,
    place_id VARCHAR,
    place_data JSONB,
    added_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
#variable_conflict use_column
BEGIN
    RETURN QUERY
    WITH all_sources AS (
        -- 구독 중인 사용자 폴더
        SELECT 'folder'::VARCHAR as s_type, folder_id::VARCHAR as s_id
        FROM public.tbl_folder_subscribed
        WHERE user_id = auth.uid() AND deleted_at IS NULL
        
        UNION ALL
        
        -- 내가 소유한 폴더도 피드에 포함시킬지 여부 (기본은 포함)
        SELECT 'folder'::VARCHAR as s_type, id::VARCHAR as s_id
        FROM public.tbl_folder
        WHERE owner_id = auth.uid() AND is_hidden = FALSE
        
        UNION ALL
        
        -- 구독 중인 시스템 피쳐
        SELECT feature_type as s_type, feature_id as s_id
        FROM public.tbl_feature_subscription
        WHERE user_id = auth.uid() AND deleted_at IS NULL
    )
    SELECT 
        s.s_type as source_type,
        s.s_id as source_id,
        CASE 
            WHEN s.s_type = 'folder' THEN (SELECT f_inner.title FROM public.tbl_folder f_inner WHERE f_inner.id = s.s_id)
            WHEN s.s_type = 'naver_folder' THEN (SELECT nf_inner.name::text FROM public.tbl_naver_folder nf_inner WHERE nf_inner.folder_id::varchar = s.s_id)
            WHEN s.s_type = 'youtube_channel' THEN (SELECT pf_inner.metadata->>'channelTitle' FROM public.tbl_place_features pf_inner WHERE pf_inner.metadata->>'channelId' = s.s_id LIMIT 1)
            WHEN s.s_type = 'community_region' THEN COALESCE(feed_data.meta, 'unknown') || '|' || s.s_id
            ELSE 'Unknown'
        END as source_title,
        p.id as place_id,
        (to_jsonb(p) || jsonb_build_object('image_urls', p.images)) as place_data,
        feed_data.added_time::TIMESTAMPTZ as added_at
    FROM (
        -- 각 소스별 장소 데이터 결합
        SELECT 'folder' as type, fp.folder_id as sid, fp.place_id as pid, fp.created_at::TIMESTAMPTZ as added_time, NULL::text as meta FROM public.tbl_folder_place fp WHERE fp.deleted_at IS NULL
        UNION ALL
        SELECT 'naver_folder' as type, nfp.folder_id::varchar as sid, nfp.place_id as pid, nf.created_at::TIMESTAMPTZ as added_time, NULL::text as meta FROM public.tbl_naver_folder_place nfp JOIN public.tbl_naver_folder nf ON nfp.folder_id = nf.folder_id
        UNION ALL
        -- youtube/community는 tbl_place_features에서 가져옴
        SELECT CASE 
                 WHEN pf.platform_type = 'youtube' THEN 'youtube_channel'::text
                 WHEN pf.platform_type = 'community' THEN 'community_region'::text
                 ELSE pf.platform_type::text
               END as type, 
               CASE WHEN pf.platform_type = 'youtube' THEN pf.metadata->>'channelId' ELSE (SELECT p_inner.group1 FROM public.tbl_place p_inner WHERE p_inner.id = pf.place_id) END as sid,
               pf.place_id as pid, 
               pf.published_at::TIMESTAMPTZ as added_time,
               pf.metadata->>'domain' as meta
        FROM public.tbl_place_features pf
        WHERE pf.status = 'active'
    ) feed_data
    JOIN all_sources s ON s.s_type = feed_data.type AND s.s_id = feed_data.sid
    JOIN public.tbl_place p ON feed_data.pid = p.id
    ORDER BY feed_data.added_time DESC
    LIMIT p_limit OFFSET p_offset;
END;
$$;

-- 기본 폴더 생성 트리거 (신규 유저용 또는 수동 실행용)
CREATE OR REPLACE FUNCTION public.v1_ensure_default_folder()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
#variable_conflict use_column
DECLARE
    v_user_id UUID;
BEGIN
    v_user_id := auth.uid();
    IF NOT EXISTS (SELECT 1 FROM public.tbl_folder WHERE owner_id = v_user_id AND permission = 'default') THEN
        INSERT INTO public.tbl_folder (owner_id, title, description, permission)
        VALUES (v_user_id, '기본 폴더', '본인만 확인 가능한 기본 폴더입니다.', 'default');
    END IF;
    RETURN TRUE;
END;
$$;

-- 권한 설정
GRANT ALL ON TABLE public.tbl_folder TO authenticated;
GRANT ALL ON TABLE public.tbl_folder_place TO authenticated;
GRANT ALL ON TABLE public.tbl_folder_subscribed TO authenticated;
GRANT ALL ON TABLE public.tbl_feature_subscription TO authenticated;
GRANT ALL ON TABLE public.tbl_folder_invite_history TO authenticated;
GRANT ALL ON TABLE public.tbl_folder_review TO authenticated;

COMMENT ON TABLE public.tbl_folder IS '사용자 정의 맛탐정 폴더';
COMMENT ON TABLE public.tbl_folder_invite_history IS '폴더 초대 코드 히스토리';
COMMENT ON TABLE public.tbl_folder_review IS '비공개 폴더 전용 리뷰';
COMMENT ON FUNCTION public.v1_list_public_folders IS '공개 맛탐정 폴더 목록 조회';
COMMENT ON FUNCTION public.v1_list_my_folders IS '내 맛탐정 폴더 목록 조회';
COMMENT ON FUNCTION public.v1_get_folder_info IS '맛탐정 폴더 단건 정보 조회';
COMMENT ON FUNCTION public.v1_create_folder IS '신규 맛탐정 폴더 생성';
COMMENT ON FUNCTION public.v1_add_place_to_folder IS '폴더에 장소 추가';
COMMENT ON FUNCTION public.v1_remove_place_from_folder IS '폴더에서 장소 제거';
COMMENT ON FUNCTION public.v1_get_folder_places IS '폴더 내 장소 목록 조회';
COMMENT ON FUNCTION public.v1_check_folder_access IS '폴더 접근 권한 체크';
COMMENT ON FUNCTION public.v1_regenerate_invite_code IS '초대 코드 재생성';
COMMENT ON FUNCTION public.v1_verify_invite_code IS '초대 코드 검증';
COMMENT ON FUNCTION public.v1_get_invite_history IS '초대 히스토리 조회';
COMMENT ON FUNCTION public.v1_hide_folder IS '폴더 숨김';
COMMENT ON FUNCTION public.v1_update_folder IS '폴더 정보 수정';
COMMENT ON FUNCTION public.v1_upsert_folder_review IS '비공개 폴더 리뷰 작성';
COMMENT ON FUNCTION public.v1_get_folder_reviews IS '비공개 폴더 리뷰 조회';
