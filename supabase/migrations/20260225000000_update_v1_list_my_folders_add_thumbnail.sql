-- v1_list_my_folders에 최근 저장된 place 썸네일 URL 추가
-- PlaceCard 이미지 우선순위: images[1] → place_images[1]

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
    is_place_in_folder BOOLEAN,
    thumbnail_url VARCHAR
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
        COALESCE(place_counts.cnt, 0)::int AS place_count,
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
        END AS is_place_in_folder,
        thumb.url AS thumbnail_url
    FROM public.tbl_folder f
    LEFT JOIN LATERAL (
        SELECT count(*) AS cnt
        FROM public.tbl_folder_place fp_cnt
        WHERE fp_cnt.folder_id = f.id
          AND fp_cnt.deleted_at IS NULL
    ) place_counts ON TRUE
    LEFT JOIN LATERAL (
        SELECT COALESCE(
            (recent.images)[1],
            (recent.place_images)[1]
        ) AS url
        FROM (
            SELECT p.images, p.place_images
            FROM public.tbl_folder_place fp
            JOIN public.tbl_place p ON fp.place_id = p.id
            WHERE fp.folder_id = f.id AND fp.deleted_at IS NULL
            ORDER BY fp.created_at DESC
            LIMIT 1
        ) recent
    ) thumb ON TRUE
    WHERE f.owner_id = auth.uid()
      AND f.is_hidden = FALSE
    ORDER BY (f.permission = 'default') DESC, COALESCE(f.updated_at, f.created_at) DESC;
END;
$$;

COMMENT ON FUNCTION public.v1_list_my_folders(VARCHAR) IS '내 맛탐정 폴더 목록 조회 (특정 장소 포함 여부, 썸네일 URL 추가)';
