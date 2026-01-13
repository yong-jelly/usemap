-- =====================================================
-- 059_add_v1_list_user_shared_folders.sql
-- 특정 사용자가 공유 중인(공개) 폴더 목록을 조회하는 함수 추가
-- 
-- 실행 방법:
--   psql "postgresql://postgres.xyqpggpilgcdsawuvpzn:ZNDqDunnaydr0aFQ@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres" -f docs/sql/059_add_v1_list_user_shared_folders.sql
-- =====================================================

DROP FUNCTION IF EXISTS public.v1_list_user_shared_folders(UUID, INT, INT);

CREATE OR REPLACE FUNCTION public.v1_list_user_shared_folders(
    p_user_id UUID,
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
        f.updated_at::TIMESTAMPTZ,
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
    JOIN public.tbl_user_profile p ON f.owner_id = p.auth_user_id
    WHERE f.owner_id = p_user_id 
      AND f.permission = 'public' 
      AND f.is_hidden = FALSE
      AND f.place_count > 0
    ORDER BY COALESCE(f.updated_at, f.created_at) DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$;

GRANT EXECUTE ON FUNCTION public.v1_list_user_shared_folders(UUID, INT, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.v1_list_user_shared_folders(UUID, INT, INT) TO service_role;

COMMENT ON FUNCTION public.v1_list_user_shared_folders IS '특정 사용자의 공개 맛탐정 폴더 목록 조회';
