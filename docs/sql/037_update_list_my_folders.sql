-- =====================================================
-- 037_update_list_my_folders.sql
-- 내 폴더 목록 조회 시 특정 장소 포함 여부 및 공동 편집 권한 확인 기능 추가
-- 
-- 실행 방법:
--   psql "postgresql://postgres.xyqpggpilgcdsawuvpzn:ZNDqDunnaydr0aFQ@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres" -f docs/sql/037_update_list_my_folders.sql
-- =====================================================

DROP FUNCTION IF EXISTS public.v1_list_my_folders();
DROP FUNCTION IF EXISTS public.v1_list_my_folders(VARCHAR);

CREATE OR REPLACE FUNCTION public.v1_list_my_folders(
    p_place_id VARCHAR DEFAULT NULL
)
RETURNS TABLE (
    id VARCHAR,
    title VARCHAR,
    description VARCHAR,
    permission VARCHAR,
    permission_write_type INT,
    place_count INT,
    subscriber_count INT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    is_place_in_folder BOOLEAN
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
        f.permission_write_type,
        f.place_count,
        f.subscriber_count,
        f.created_at::TIMESTAMPTZ,
        f.updated_at::TIMESTAMPTZ,
        CASE 
            WHEN p_place_id IS NOT NULL THEN
                EXISTS (
                    SELECT 1 FROM public.tbl_folder_place fp 
                    WHERE fp.folder_id = f.id AND fp.place_id = p_place_id AND fp.deleted_at IS NULL
                )
            ELSE FALSE
        END AS is_place_in_folder
    FROM public.tbl_folder f
    WHERE f.owner_id = auth.uid()
      AND f.is_hidden = FALSE
    ORDER BY (f.permission = 'default') DESC, COALESCE(f.updated_at, f.created_at) DESC;
END;
$$;

COMMENT ON FUNCTION public.v1_list_my_folders(VARCHAR) IS '내 맛탐정 폴더 목록 조회 (특정 장소 포함 여부 및 공동 편집 권한 추가)';
