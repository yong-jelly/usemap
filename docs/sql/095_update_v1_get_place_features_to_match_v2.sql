-- =====================================================
-- 095_update_v1_get_place_features_to_match_v2.sql
-- v1_get_place_features 함수를 v2_get_place_detail의 features(v1_common_place_features)와 일치하도록 수정
-- 
-- 인자:
--   @p_business_id: 장소 ID (business_id)
--   @p_limit: 조회 제한 수 (기본값 20)
--   @p_offset: 조회 시작 위치 (기본값 0)
-- 
-- 실행 방법:
--   psql "postgresql://postgres.xyqpggpilgcdsawuvpzn:ZNDqDunnaydr0aFQ@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres" -f docs/sql/095_update_v1_get_place_features_to_match_v2.sql
-- =====================================================

DROP FUNCTION IF EXISTS public.v1_get_place_features(text, integer, integer);

CREATE OR REPLACE FUNCTION public.v1_get_place_features(
    p_business_id text, 
    p_limit integer DEFAULT 20, 
    p_offset integer DEFAULT 0
)
RETURNS TABLE(
    id text, 
    user_id text, 
    place_id text, 
    platform_type text, 
    content_url text, 
    title text, 
    created_at timestamptz, 
    updated_at timestamptz, 
    published_at timestamptz, 
    is_verified boolean, 
    status text, 
    user_profile jsonb, 
    metadata jsonb, 
    is_features boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
    RETURN QUERY
    WITH all_features AS (
        -- 1. 시스템 피쳐 (유튜브, 커뮤니티 등)
        SELECT 
            pf.id::text as id,
            pf.user_id::text,
            pf.place_id::text,
            pf.platform_type::text,
            pf.content_url,
            pf.title::text,
            pf.created_at,
            pf.updated_at,
            pf.published_at,
            pf.is_verified,
            pf.status::text,
            jsonb_build_object(
                'nickname', COALESCE(up.nickname, ''),
                'profile_image_url', up.profile_image_url
            ) as user_profile,
            pf.metadata,
            (pf.user_id = auth.uid()) as is_features
        FROM public.tbl_place_features pf
        LEFT JOIN public.tbl_user_profile up ON pf.user_id = up.auth_user_id
        WHERE pf.place_id = p_business_id AND pf.status = 'active'

        UNION ALL

        -- 2. 네이버 폴더
        SELECT 
            nf.folder_id::text as id,
            NULL::text as user_id,
            nfp.place_id::text as place_id,
            'folder'::text as platform_type,
            NULL::text as content_url,
            nf.name::text as title,
            nf.created_at,
            nf.updated_at,
            nf.created_at as published_at,
            false as is_verified,
            'active'::text as status,
            NULL::jsonb as user_profile,
            jsonb_build_object(
                'url', NULL,
                'title', nf.name,
                'domain', 'naver',
                'description', nf.memo
            ) as metadata,
            false as is_features
        FROM public.tbl_naver_folder_place nfp
        JOIN public.tbl_naver_folder nf ON nfp.folder_id = nf.folder_id
        WHERE nfp.place_id = p_business_id

        UNION ALL

        -- 3. 맛탐정 공개 폴더 (public_user)
        SELECT 
            f.id::text as id,
            f.owner_id::text as user_id,
            fp.place_id::text as place_id,
            'public_user'::text as platform_type,
            '/folder/' || f.id as content_url,
            f.title::text as title,
            f.created_at,
            f.updated_at,
            f.created_at as published_at,
            false as is_verified,
            'active'::text as status,
            NULL::jsonb as user_profile,
            jsonb_build_object(
                'url', '/folder/' || f.id,
                'title', f.title,
                'domain', 'feature',
                'description', f.description
            ) as metadata,
            (f.owner_id = auth.uid()) as is_features
        FROM public.tbl_folder_place fp
        JOIN public.tbl_folder f ON fp.folder_id = f.id
        WHERE fp.place_id = p_business_id 
          AND fp.deleted_at IS NULL
          AND f.permission = 'public' 
          AND f.is_hidden = FALSE
    )
    SELECT * FROM all_features
    ORDER BY published_at DESC, created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$function$;

COMMENT ON FUNCTION public.v1_get_place_features IS '장소별 통합 피쳐 정보를 조회합니다. v2_get_place_detail의 features와 동일한 데이터를 반환하도록 수정되었습니다.';
GRANT EXECUTE ON FUNCTION public.v1_get_place_features TO authenticated, anon;
