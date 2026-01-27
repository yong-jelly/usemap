-- =====================================================
-- 092_create_v1_list_my_and_public_folders.sql
-- 내 폴더(비공개 포함)와 다른 사람의 공개 폴더를 통합 조회하는 함수
-- 
-- 인자:
--   @p_limit: 반환할 최대 행 수 (기본값 20)
--   @p_offset: 건너뛸 행 수 (기본값 0)
-- 
-- 실행 방법:
--   psql "postgresql://postgres.xyqpggpilgcdsawuvpzn:ZNDqDunnaydr0aFQ@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres" -f docs/sql/092_create_v1_list_my_and_public_folders.sql
-- =====================================================

CREATE OR REPLACE FUNCTION public.v1_list_my_and_public_folders(
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
    updated_at TIMESTAMPTZ,
    preview_places JSONB,
    is_mine BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, public
AS $$
DECLARE
    v_user_id UUID;
BEGIN
    v_user_id := auth.uid();

    RETURN QUERY
    WITH my_folders AS (
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
            f.created_at,
            f.updated_at,
            (
                SELECT jsonb_agg(sub.place_info)
                FROM (
                    SELECT jsonb_build_object(
                        'id', pl.id,
                        'name', pl.name,
                        'category', pl.category,
                        'image_urls', pl.images,
                        'place_liked_count', (SELECT count(*) FROM public.tbl_like l WHERE l.liked_id = pl.id AND l.liked_type = 'place' AND l.liked = true),
                        'place_reviews_count', (SELECT count(*) FROM public.tbl_place_user_review r WHERE r.place_id = pl.id AND r.is_active = true),
                        'features', public.v1_common_place_features(pl.id)
                    ) AS place_info
                    FROM public.tbl_folder_place fp
                    JOIN public.tbl_place pl ON fp.place_id = pl.id
                    WHERE fp.folder_id = f.id AND fp.deleted_at IS NULL
                    ORDER BY fp.created_at DESC
                    LIMIT 5
                ) sub
            ) AS preview_places,
            TRUE as is_mine,
            1 as sort_order, -- 내 폴더 우선
            f.updated_at as sort_time
        FROM public.tbl_folder f
        LEFT JOIN public.tbl_user_profile p ON f.owner_id = p.auth_user_id
        WHERE f.owner_id = v_user_id
          AND f.deleted_at IS NULL
    ),
    public_folders AS (
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
            f.created_at,
            f.updated_at,
            (
                SELECT jsonb_agg(sub.place_info)
                FROM (
                    SELECT jsonb_build_object(
                        'id', pl.id,
                        'name', pl.name,
                        'category', pl.category,
                        'image_urls', pl.images,
                        'place_liked_count', (SELECT count(*) FROM public.tbl_like l WHERE l.liked_id = pl.id AND l.liked_type = 'place' AND l.liked = true),
                        'place_reviews_count', (SELECT count(*) FROM public.tbl_place_user_review r WHERE r.place_id = pl.id AND r.is_active = true),
                        'features', public.v1_common_place_features(pl.id)
                    ) AS place_info
                    FROM public.tbl_folder_place fp
                    JOIN public.tbl_place pl ON fp.place_id = pl.id
                    WHERE fp.folder_id = f.id AND fp.deleted_at IS NULL
                    ORDER BY fp.created_at DESC
                    LIMIT 5
                ) sub
            ) AS preview_places,
            FALSE as is_mine,
            2 as sort_order, -- 다른 사람 폴더 후순위
            COALESCE(lp.last_added_at, f.created_at) as sort_time
        FROM public.tbl_folder f
        LEFT JOIN public.tbl_user_profile p ON f.owner_id = p.auth_user_id
        LEFT JOIN LATERAL (
            SELECT MAX(created_at) as last_added_at
            FROM public.tbl_folder_place
            WHERE folder_id = f.id AND deleted_at IS NULL
        ) lp ON TRUE
        WHERE f.permission = 'public'
          AND f.is_hidden = FALSE
          AND (v_user_id IS NULL OR f.owner_id != v_user_id) -- 내 폴더 제외
          AND f.deleted_at IS NULL
    )
    SELECT
        id,
        owner_id,
        owner_nickname,
        owner_avatar_url,
        title,
        description,
        permission,
        subscriber_count,
        place_count,
        created_at::TIMESTAMPTZ,
        updated_at::TIMESTAMPTZ,
        preview_places,
        is_mine
    FROM (
        SELECT * FROM my_folders
        UNION ALL
        SELECT * FROM public_folders
    ) combined
    ORDER BY sort_order ASC, sort_time DESC
    LIMIT p_limit OFFSET p_offset;
END;
$$;

COMMENT ON FUNCTION public.v1_list_my_and_public_folders IS '내 폴더(비공개 포함)와 다른 사람의 공개 폴더를 통합 조회합니다.';
GRANT EXECUTE ON FUNCTION public.v1_list_my_and_public_folders TO authenticated;
GRANT EXECUTE ON FUNCTION public.v1_list_my_and_public_folders TO anon;
