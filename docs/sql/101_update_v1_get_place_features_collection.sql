-- =====================================================
-- 101_update_v1_get_place_features_collection.sql
-- v1_get_place_features API 재설계: collection 컬럼으로 통합
--
-- 기존 컬럼(recent_thumbnails, group_place_count, group_subscriber_count, group_key)을
-- collection jsonb 하나로 통합.
--
-- collection 구조:
--   {
--     "key": "그룹 식별자 (프론트 중복 제거용)",
--     "name": "콜렉션(채널) 표시명",
--     "places": [{ "url": "썸네일 URL", "place_name": "장소명" }, ...]
--   }
--   - places: 최근 추가된 음식점 목록 최대 3개 (최신순), 각 항목에 썸네일 포함
--
-- 인자:
--   @p_business_id: 장소 ID (business_id)
--   @p_limit: 조회 제한 수 (기본값 20)
--   @p_offset: 조회 시작 위치 (기본값 0)
--
-- 실행 방법:
--   psql "postgresql://postgres.xyqpggpilgcdsawuvpzn:ZNDqDunnaydr0aFQ@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres" -f docs/sql/101_update_v1_get_place_features_collection.sql
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
    is_features boolean,
    collection jsonb  -- { key, name, places: [{url, place_name}] }
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
    RETURN QUERY
    WITH all_features AS (
        -- =============================================
        -- 1. 유튜브: collection.key=channelId, collection.name=channelTitle
        --    collection.places=같은 채널의 최신 장소 3개 (장소이미지+장소명)
        -- =============================================
        SELECT
            pf.id::text AS id,
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
            ) AS user_profile,
            pf.metadata,
            (pf.user_id = auth.uid()) AS is_features,
            jsonb_build_object(
                'key', pf.metadata->>'channelId',
                'name', COALESCE(pf.metadata->>'channelTitle', pf.title, 'YouTube'),
                'places', COALESCE(
                    (SELECT jsonb_agg(sub.place ORDER BY sub.rn)
                     FROM (
                         SELECT
                             jsonb_build_object(
                                 'url', p2.images[1],
                                 'place_name', p2.name
                             ) AS place,
                             ROW_NUMBER() OVER (ORDER BY pf2.published_at DESC NULLS LAST) AS rn
                         FROM tbl_place_features pf2
                         JOIN tbl_place p2 ON p2.id = pf2.place_id
                             AND p2.images IS NOT NULL
                             AND array_length(p2.images, 1) > 0
                         WHERE pf2.status = 'active'
                           AND pf2.platform_type = 'youtube'
                           AND pf2.metadata->>'channelId' = pf.metadata->>'channelId'
                         ORDER BY pf2.published_at DESC NULLS LAST
                         LIMIT 3
                     ) sub),
                    '[]'::jsonb
                )
            ) AS collection
        FROM public.tbl_place_features pf
        LEFT JOIN public.tbl_user_profile up ON pf.user_id = up.auth_user_id
        WHERE pf.place_id = p_business_id
          AND pf.status = 'active'
          AND pf.platform_type = 'youtube'

        UNION ALL

        -- =============================================
        -- 2. 커뮤니티: collection.key=domain, collection.name=도메인 한글명
        --    collection.places=같은 도메인의 최신 장소 3개 (이미지+장소명)
        -- =============================================
        SELECT
            pf.id::text AS id,
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
            ) AS user_profile,
            pf.metadata,
            (pf.user_id = auth.uid()) AS is_features,
            jsonb_build_object(
                'key', pf.metadata->>'domain',
                'name', pf.metadata->>'domain',
                'places', COALESCE(
                    (SELECT jsonb_agg(sub.place ORDER BY sub.rn)
                     FROM (
                         SELECT
                             jsonb_build_object(
                                 'url', p2.images[1],
                                 'place_name', p2.name
                             ) AS place,
                             ROW_NUMBER() OVER (ORDER BY pf2.published_at DESC NULLS LAST) AS rn
                         FROM tbl_place_features pf2
                         JOIN tbl_place p2 ON p2.id = pf2.place_id
                             AND p2.images IS NOT NULL
                             AND array_length(p2.images, 1) > 0
                         WHERE pf2.status = 'active'
                           AND pf2.platform_type = 'community'
                           AND pf2.metadata->>'domain' = pf.metadata->>'domain'
                         ORDER BY pf2.published_at DESC NULLS LAST
                         LIMIT 3
                     ) sub),
                    '[]'::jsonb
                )
            ) AS collection
        FROM public.tbl_place_features pf
        LEFT JOIN public.tbl_user_profile up ON pf.user_id = up.auth_user_id
        WHERE pf.place_id = p_business_id
          AND pf.status = 'active'
          AND pf.platform_type = 'community'

        UNION ALL

        -- =============================================
        -- 3. 소셜: collection.key=service, collection.name=서비스명
        --    collection.places=같은 서비스의 최신 장소 3개
        -- =============================================
        SELECT
            pf.id::text AS id,
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
            ) AS user_profile,
            pf.metadata,
            (pf.user_id = auth.uid()) AS is_features,
            jsonb_build_object(
                'key', COALESCE(pf.metadata->>'service', 'social'),
                'name', COALESCE(pf.metadata->>'service', '소셜'),
                'places', COALESCE(
                    (SELECT jsonb_agg(sub.place ORDER BY sub.rn)
                     FROM (
                         SELECT
                             jsonb_build_object(
                                 'url', p2.images[1],
                                 'place_name', p2.name
                             ) AS place,
                             ROW_NUMBER() OVER (ORDER BY pf2.published_at DESC NULLS LAST) AS rn
                         FROM tbl_place_features pf2
                         JOIN tbl_place p2 ON p2.id = pf2.place_id
                             AND p2.images IS NOT NULL
                             AND array_length(p2.images, 1) > 0
                         WHERE pf2.status = 'active'
                           AND pf2.platform_type = 'social'
                           AND COALESCE(pf2.metadata->>'service', '') = COALESCE(pf.metadata->>'service', '')
                         ORDER BY pf2.published_at DESC NULLS LAST
                         LIMIT 3
                     ) sub),
                    '[]'::jsonb
                )
            ) AS collection
        FROM public.tbl_place_features pf
        LEFT JOIN public.tbl_user_profile up ON pf.user_id = up.auth_user_id
        WHERE pf.place_id = p_business_id
          AND pf.status = 'active'
          AND pf.platform_type = 'social'

        UNION ALL

        -- =============================================
        -- 4. 네이버 폴더: collection.key=folder_id, collection.name=폴더명
        --    collection.places=폴더 내 최신 장소 3개 (이미지+장소명)
        -- =============================================
        SELECT
            nf.folder_id::text AS id,
            NULL::text AS user_id,
            nfp.place_id::text AS place_id,
            'folder'::text AS platform_type,
            NULL::text AS content_url,
            nf.name::text AS title,
            nf.created_at,
            nf.updated_at,
            nf.created_at AS published_at,
            false AS is_verified,
            'active'::text AS status,
            NULL::jsonb AS user_profile,
            jsonb_build_object(
                'url', NULL,
                'title', nf.name,
                'domain', 'naver',
                'description', nf.memo
            ) AS metadata,
            false AS is_features,
            jsonb_build_object(
                'key', nf.folder_id::text,
                'name', nf.name,
                'places', COALESCE(
                    (SELECT jsonb_agg(sub.place ORDER BY sub.rn)
                     FROM (
                         SELECT
                             jsonb_build_object(
                                 'url', p2.images[1],
                                 'place_name', p2.name
                             ) AS place,
                             ROW_NUMBER() OVER (ORDER BY p2.updated_at DESC NULLS LAST) AS rn
                         FROM tbl_naver_folder_place nfp2
                         JOIN tbl_place p2 ON p2.id = nfp2.place_id
                             AND p2.images IS NOT NULL
                             AND array_length(p2.images, 1) > 0
                         WHERE nfp2.folder_id = nf.folder_id
                         ORDER BY p2.updated_at DESC NULLS LAST
                         LIMIT 3
                     ) sub),
                    '[]'::jsonb
                )
            ) AS collection
        FROM public.tbl_naver_folder_place nfp
        JOIN public.tbl_naver_folder nf ON nfp.folder_id = nf.folder_id
        WHERE nfp.place_id = p_business_id

        UNION ALL

        -- =============================================
        -- 5. 맛탐정 공개 폴더: collection.key=folder.id, collection.name=폴더명
        --    collection.places=폴더 내 최신 장소 3개 (이미지+장소명)
        -- =============================================
        SELECT
            f.id::text AS id,
            f.owner_id::text AS user_id,
            fp.place_id::text AS place_id,
            'public_user'::text AS platform_type,
            '/folder/' || f.id AS content_url,
            f.title::text AS title,
            f.created_at,
            f.updated_at,
            f.created_at AS published_at,
            false AS is_verified,
            'active'::text AS status,
            (
                SELECT jsonb_build_object(
                    'nickname', COALESCE(up.nickname, ''),
                    'profile_image_url', up.profile_image_url
                )
                FROM tbl_user_profile up
                WHERE up.auth_user_id = f.owner_id
            ) AS user_profile,
            jsonb_build_object(
                'url', '/folder/' || f.id,
                'title', f.title,
                'domain', 'feature',
                'description', f.description
            ) AS metadata,
            (f.owner_id = auth.uid()) AS is_features,
            jsonb_build_object(
                'key', f.id::text,
                'name', f.title,
                'places', COALESCE(
                    (SELECT jsonb_agg(sub.place ORDER BY sub.rn)
                     FROM (
                         SELECT
                             jsonb_build_object(
                                 'url', p2.images[1],
                                 'place_name', p2.name
                             ) AS place,
                             ROW_NUMBER() OVER (ORDER BY fp2.created_at DESC NULLS LAST) AS rn
                         FROM tbl_folder_place fp2
                         JOIN tbl_place p2 ON p2.id = fp2.place_id
                             AND p2.images IS NOT NULL
                             AND array_length(p2.images, 1) > 0
                         WHERE fp2.folder_id = f.id
                           AND fp2.deleted_at IS NULL
                         ORDER BY fp2.created_at DESC NULLS LAST
                         LIMIT 3
                     ) sub),
                    '[]'::jsonb
                )
            ) AS collection
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

COMMENT ON FUNCTION public.v1_get_place_features IS '장소별 통합 피쳐 정보를 조회합니다. collection 컬럼에 {key, name, places} 구조로 그룹별 요약 정보를 포함합니다.';
GRANT EXECUTE ON FUNCTION public.v1_get_place_features TO authenticated, anon;
