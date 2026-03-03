-- =====================================================
-- 100_update_v1_get_place_features_add_recent.sql
-- v1_get_place_features 함수 개선: 그룹별 요약 정보 추가
--   - recent_thumbnails: 해당 그룹의 최신 썸네일 최대 3개 (jsonb 배열)
--   - group_place_count: 해당 그룹(채널/폴더/도메인)의 전체 장소 수
--   - group_subscriber_count: 구독자/팔로워 수
--   - group_key: 그룹 식별자 (프론트에서 중복 제거용)
--
-- 인자:
--   @p_business_id: 장소 ID (business_id)
--   @p_limit: 조회 제한 수 (기본값 20)
--   @p_offset: 조회 시작 위치 (기본값 0)
--
-- 실행 방법:
--   psql "postgresql://postgres.xyqpggpilgcdsawuvpzn:ZNDqDunnaydr0aFQ@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres" -f docs/sql/100_update_v1_get_place_features_add_recent.sql
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
    -- ===== 신규 컬럼 =====
    recent_thumbnails jsonb,       -- 최신 썸네일 최대 3개: [{url, place_name}]
    group_place_count bigint,      -- 그룹 내 전체 장소 수
    group_subscriber_count integer,-- 구독자/팔로워 수
    group_key text                 -- 그룹 식별자 (프론트 중복 제거용)
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
    RETURN QUERY
    WITH all_features AS (
        -- =============================================
        -- 1. 유튜브 (tbl_place_features, platform_type='youtube')
        --    group_key: channelId
        --    recent_thumbnails: 같은 채널의 최신 영상 썸네일 3개
        --    group_place_count: 같은 채널이 언급한 장소 수(distinct)
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
            -- 같은 채널의 최신 영상 썸네일 3개
            (
                SELECT jsonb_agg(sub.thumb ORDER BY sub.rn)
                FROM (
                    SELECT
                        jsonb_build_object(
                            'url', pf2.metadata->'thumbnails'->'medium'->>'url',
                            'place_name', p2.name
                        ) AS thumb,
                        ROW_NUMBER() OVER (ORDER BY pf2.published_at DESC NULLS LAST) AS rn
                    FROM tbl_place_features pf2
                    JOIN tbl_place p2 ON p2.id = pf2.place_id
                    WHERE pf2.status = 'active'
                      AND pf2.platform_type = 'youtube'
                      AND pf2.metadata->>'channelId' = pf.metadata->>'channelId'
                    ORDER BY pf2.published_at DESC NULLS LAST
                    LIMIT 3
                ) sub
            ) AS recent_thumbnails,
            -- 같은 채널이 언급한 고유 장소 수
            (
                SELECT count(DISTINCT pf3.place_id)
                FROM tbl_place_features pf3
                WHERE pf3.status = 'active'
                  AND pf3.platform_type = 'youtube'
                  AND pf3.metadata->>'channelId' = pf.metadata->>'channelId'
            ) AS group_place_count,
            NULL::integer AS group_subscriber_count,
            (pf.metadata->>'channelId')::text AS group_key
        FROM public.tbl_place_features pf
        LEFT JOIN public.tbl_user_profile up ON pf.user_id = up.auth_user_id
        WHERE pf.place_id = p_business_id
          AND pf.status = 'active'
          AND pf.platform_type = 'youtube'

        UNION ALL

        -- =============================================
        -- 2. 커뮤니티 (tbl_place_features, platform_type='community')
        --    group_key: domain (clien.net, damoang.net 등)
        --    recent_thumbnails: 장소 이미지 1개 (해당 장소의 images[1])
        --    group_place_count: 같은 도메인에서 언급한 고유 장소 수
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
            -- 같은 도메인의 최신 장소 이미지 3개
            (
                SELECT jsonb_agg(sub.thumb ORDER BY sub.rn)
                FROM (
                    SELECT
                        jsonb_build_object(
                            'url', p2.images[1],
                            'place_name', p2.name
                        ) AS thumb,
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
                ) sub
            ) AS recent_thumbnails,
            -- 같은 도메인이 언급한 고유 장소 수
            (
                SELECT count(DISTINCT pf3.place_id)
                FROM tbl_place_features pf3
                WHERE pf3.status = 'active'
                  AND pf3.platform_type = 'community'
                  AND pf3.metadata->>'domain' = pf.metadata->>'domain'
            ) AS group_place_count,
            NULL::integer AS group_subscriber_count,
            (pf.metadata->>'domain')::text AS group_key
        FROM public.tbl_place_features pf
        LEFT JOIN public.tbl_user_profile up ON pf.user_id = up.auth_user_id
        WHERE pf.place_id = p_business_id
          AND pf.status = 'active'
          AND pf.platform_type = 'community'

        UNION ALL

        -- =============================================
        -- 3. 소셜 (tbl_place_features, platform_type='social')
        --    group_key: service (instagram, threads 등)
        --    recent_thumbnails: 장소 이미지
        --    group_place_count: 같은 서비스에서 언급한 고유 장소 수
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
            -- 같은 서비스의 최신 장소 이미지 3개
            (
                SELECT jsonb_agg(sub.thumb ORDER BY sub.rn)
                FROM (
                    SELECT
                        jsonb_build_object(
                            'url', p2.images[1],
                            'place_name', p2.name
                        ) AS thumb,
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
                ) sub
            ) AS recent_thumbnails,
            (
                SELECT count(DISTINCT pf3.place_id)
                FROM tbl_place_features pf3
                WHERE pf3.status = 'active'
                  AND pf3.platform_type = 'social'
                  AND COALESCE(pf3.metadata->>'service', '') = COALESCE(pf.metadata->>'service', '')
            ) AS group_place_count,
            NULL::integer AS group_subscriber_count,
            COALESCE(pf.metadata->>'service', 'social')::text AS group_key
        FROM public.tbl_place_features pf
        LEFT JOIN public.tbl_user_profile up ON pf.user_id = up.auth_user_id
        WHERE pf.place_id = p_business_id
          AND pf.status = 'active'
          AND pf.platform_type = 'social'

        UNION ALL

        -- =============================================
        -- 4. 네이버 폴더 (tbl_naver_folder + tbl_naver_folder_place)
        --    group_key: folder_id
        --    recent_thumbnails: 폴더 내 장소의 images[1] 최신 3개
        --    group_place_count: 폴더 내 장소 수
        --    group_subscriber_count: 폴더 팔로워 수 (follow_count)
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
            -- 폴더 내 최신 장소 이미지 3개
            (
                SELECT jsonb_agg(sub.thumb ORDER BY sub.rn)
                FROM (
                    SELECT
                        jsonb_build_object(
                            'url', p2.images[1],
                            'place_name', p2.name
                        ) AS thumb,
                        ROW_NUMBER() OVER (ORDER BY p2.updated_at DESC NULLS LAST) AS rn
                    FROM tbl_naver_folder_place nfp2
                    JOIN tbl_place p2 ON p2.id = nfp2.place_id
                        AND p2.images IS NOT NULL
                        AND array_length(p2.images, 1) > 0
                    WHERE nfp2.folder_id = nf.folder_id
                    ORDER BY p2.updated_at DESC NULLS LAST
                    LIMIT 3
                ) sub
            ) AS recent_thumbnails,
            -- 폴더 내 장소 수
            (
                SELECT count(*)
                FROM tbl_naver_folder_place nfp3
                WHERE nfp3.folder_id = nf.folder_id
            ) AS group_place_count,
            nf.follow_count AS group_subscriber_count,
            nf.folder_id::text AS group_key
        FROM public.tbl_naver_folder_place nfp
        JOIN public.tbl_naver_folder nf ON nfp.folder_id = nf.folder_id
        WHERE nfp.place_id = p_business_id

        UNION ALL

        -- =============================================
        -- 5. 맛탐정 공개 폴더 (tbl_folder + tbl_folder_place)
        --    group_key: folder.id
        --    recent_thumbnails: 폴더 내 장소의 images[1] 최신 3개
        --    group_place_count: 폴더의 place_count
        --    group_subscriber_count: 폴더의 subscriber_count
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
            -- 폴더 내 최신 장소 이미지 3개
            (
                SELECT jsonb_agg(sub.thumb ORDER BY sub.rn)
                FROM (
                    SELECT
                        jsonb_build_object(
                            'url', p2.images[1],
                            'place_name', p2.name
                        ) AS thumb,
                        ROW_NUMBER() OVER (ORDER BY fp2.created_at DESC NULLS LAST) AS rn
                    FROM tbl_folder_place fp2
                    JOIN tbl_place p2 ON p2.id = fp2.place_id
                        AND p2.images IS NOT NULL
                        AND array_length(p2.images, 1) > 0
                    WHERE fp2.folder_id = f.id
                      AND fp2.deleted_at IS NULL
                    ORDER BY fp2.created_at DESC NULLS LAST
                    LIMIT 3
                ) sub
            ) AS recent_thumbnails,
            f.place_count::bigint AS group_place_count,
            f.subscriber_count AS group_subscriber_count,
            f.id::text AS group_key
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

COMMENT ON FUNCTION public.v1_get_place_features IS '장소별 통합 피쳐 정보를 조회합니다. 각 row에 그룹별 요약 정보(recent_thumbnails, group_place_count, group_subscriber_count, group_key)를 포함합니다.';
GRANT EXECUTE ON FUNCTION public.v1_get_place_features TO authenticated, anon;
