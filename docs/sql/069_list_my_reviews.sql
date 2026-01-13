-- =====================================================
-- 069_list_my_reviews.sql
-- 내가 작성한 리뷰 목록 조회 (장소 정보 및 프로필 포함, 필터 및 정렬 지원)
-- 
-- 실행 방법:
--   psql "postgresql://postgres.xyqpggpilgcdsawuvpzn:ZNDqDunnaydr0aFQ@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres" -f docs/sql/069_list_my_reviews.sql
-- =====================================================

CREATE OR REPLACE FUNCTION public.v1_list_my_reviews(
    p_limit integer DEFAULT 20, 
    p_offset integer DEFAULT 0,
    p_filter_type character varying DEFAULT 'public', -- 'public', 'private', 'image'
    p_sort_by character varying DEFAULT 'latest' -- 'latest', 'score'
)
RETURNS TABLE (
    id uuid,
    user_id uuid,
    place_id character varying,
    review_content text,
    score numeric,
    media_urls jsonb,
    is_private boolean,
    is_active boolean,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    tags jsonb,
    images jsonb,
    place_data jsonb,
    user_profile jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, public
AS $$
#variable_conflict use_column
BEGIN
    RETURN QUERY
    SELECT 
        r.id, 
        r.user_id, 
        r.place_id, 
        r.review_content, 
        r.score, 
        r.media_urls, 
        r.is_private, 
        r.is_active, 
        r.created_at, 
        r.updated_at,
        (
            SELECT COALESCE(jsonb_agg(jsonb_build_object(
                'code', m.tag_code, 
                'label', t.tag_label, 
                'is_positive', t.is_positive, 
                'group', t.tag_group
            )), '[]'::jsonb) 
            FROM public.tbl_place_user_review_tag_map m 
            LEFT JOIN public.tbl_place_review_tag_master t ON m.tag_code = t.tag_code 
            WHERE m.review_id = r.id
        ) as tags,
        (
            SELECT COALESCE(jsonb_agg(jsonb_build_object(
                'id', ri.id, 
                'image_path', ri.image_path
            )), '[]'::jsonb) 
            FROM public.tbl_review_images ri 
            WHERE ri.review_id = r.id AND ri.is_deleted = false
        ) as images,
        jsonb_build_object(
            'id', p.id,
            'name', p.name,
            'category', p.category,
            'image_urls', p.images,
            'group1', p.group1,
            'group2', p.group2,
            'group3', p.group3
        ) as place_data,
        jsonb_build_object(
            'nickname', COALESCE(u.nickname, ''), 
            'profile_image_url', u.profile_image_url, 
            'gender_code', u.gender_code, 
            'age_group_code', u.age_group_code
        ) as user_profile
    FROM public.tbl_place_user_review r
    JOIN public.tbl_place p ON r.place_id = p.id
    LEFT JOIN public.tbl_user_profile u ON r.user_id = u.auth_user_id
    WHERE r.user_id = auth.uid() 
      AND r.is_active = true
      AND (
          CASE 
              WHEN p_filter_type = 'public' THEN r.is_private = false
              WHEN p_filter_type = 'private' THEN r.is_private = true
              WHEN p_filter_type = 'image' THEN r.has_images = true
              ELSE true
          END
      )
    ORDER BY 
        CASE WHEN p_sort_by = 'score' THEN r.score END DESC,
        r.created_at DESC
    LIMIT p_limit OFFSET p_offset;
END;
$$;

-- 내가 작성한 리뷰 필터별 개수 조회 함수
CREATE OR REPLACE FUNCTION public.v1_get_my_reviews_counts()
RETURNS TABLE (
    all_count bigint,
    public_count bigint,
    private_count bigint,
    image_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        count(*),
        count(*) FILTER (WHERE is_private = false),
        count(*) FILTER (WHERE is_private = true),
        count(*) FILTER (WHERE has_images = true)
    FROM public.tbl_place_user_review
    WHERE user_id = auth.uid() AND is_active = true;
END;
$$;

-- 권한 부여
GRANT EXECUTE ON FUNCTION public.v1_list_my_reviews(integer, integer, varchar, varchar) TO authenticated;
GRANT EXECUTE ON FUNCTION public.v1_get_my_reviews_counts() TO authenticated;
