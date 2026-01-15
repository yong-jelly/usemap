-- =====================================================
-- 077_add_v1_common_place_features.sql
-- 장소별 통합 피쳐 정보(유튜브, 커뮤니티, 네이버 폴더, 맛탐정 공개 폴더)를 조회하는 공통 함수 정의
-- 
-- 실행 방법:
--   psql "postgresql://postgres.xyqpggpilgcdsawuvpzn:ZNDqDunnaydr0aFQ@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres" -f docs/sql/077_add_v1_common_place_features.sql
-- =====================================================

CREATE OR REPLACE FUNCTION public.v1_common_place_features(p_place_id text)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
AS $function$
DECLARE
    v_features jsonb;
BEGIN
    WITH all_features AS (
        -- 1. 시스템 피쳐 (유튜브, 커뮤니티 등)
        SELECT 
            pf.id::text as id,
            pf.title,
            pf.status,
            pf.user_id::text,
            pf.metadata,
            pf.created_at,
            pf.updated_at,
            pf.content_url,
            pf.is_verified,
            pf.published_at,
            pf.platform_type
        FROM public.tbl_place_features pf
        WHERE pf.place_id = p_place_id AND pf.status = 'active'

        UNION ALL

        -- 2. 네이버 폴더
        SELECT 
            nf.folder_id::text as id,
            nf.name as title,
            'active' as status,
            NULL::text as user_id,
            jsonb_build_object(
                'url', NULL,
                'title', nf.name,
                'domain', 'naver',
                'description', nf.memo
            ) as metadata,
            nf.created_at,
            nf.updated_at,
            NULL as content_url,
            false as is_verified,
            nf.created_at as published_at,
            'folder' as platform_type
        FROM public.tbl_naver_folder_place nfp
        JOIN public.tbl_naver_folder nf ON nfp.folder_id = nf.folder_id
        WHERE nfp.place_id = p_place_id

        UNION ALL

        -- 3. 맛탐정 공개 폴더 (public_user)
        -- 이 항목은 공개된 맛탐정 폴더 타입을 의미합니다.
        SELECT 
            f.id as id,
            f.title,
            'active' as status,
            f.owner_id::text as user_id,
            jsonb_build_object(
                'url', '/folder/' || f.id,
                'title', f.title,
                'domain', 'feature',
                'description', f.description
            ) as metadata,
            f.created_at,
            f.updated_at,
            '/folder/' || f.id as content_url,
            false as is_verified,
            f.created_at as published_at,
            'public_user' as platform_type
        FROM public.tbl_folder_place fp
        JOIN public.tbl_folder f ON fp.folder_id = f.id
        WHERE fp.place_id = p_place_id 
          AND fp.deleted_at IS NULL
          AND f.permission = 'public' 
          AND f.is_hidden = FALSE
    )
    SELECT jsonb_agg(to_jsonb(af.*)) INTO v_features
    FROM all_features af;

    RETURN COALESCE(v_features, '[]'::jsonb);
END;
$function$;

COMMENT ON FUNCTION public.v1_common_place_features IS '장소별 통합 피쳐 정보(유튜브, 커뮤니티, 네이버 폴더, 맛탐정 공개 폴더 등)를 조회합니다. platform_type: public_user는 공개된 맛탐정 폴더를 의미합니다.';
GRANT EXECUTE ON FUNCTION public.v1_common_place_features TO authenticated, anon;
