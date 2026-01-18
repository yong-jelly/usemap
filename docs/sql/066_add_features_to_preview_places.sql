-- =====================================================
-- 066_add_features_to_preview_places.sql
-- 프리뷰 장소 목록(preview_places, preview_contents)에 features(폴더 정보 등) 추가
-- 
-- 실행 방법:
--   psql "postgresql://postgres.xyqpggpilgcdsawuvpzn:ZNDqDunnaydr0aFQ@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres" -f docs/sql/066_add_features_to_preview_places.sql
-- =====================================================

-- 1. 네이버 폴더 목록 조회 함수 수정 (v2)
CREATE OR REPLACE FUNCTION public.v2_get_naver_folders(
    p_limit integer DEFAULT 20,
    p_offset integer DEFAULT 0
)
RETURNS TABLE (
    folder_id bigint,
    name text,
    memo text,
    place_count bigint,
    preview_places jsonb
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        f.folder_id,
        f.name::text,
        f.memo,
        (SELECT count(*) FROM tbl_naver_folder_place fp WHERE fp.folder_id = f.folder_id) as place_count,
        (
            SELECT jsonb_agg(p_sub)
            FROM (
                SELECT 
                    p.id,
                    p.name,
                    p.category,
                    p.address,
                    p.road_address,
                    p.images[1] as thumbnail,
                    p.visitor_reviews_score as score,
                    p.visitor_reviews_total as review_count,
                    p.group1,
                    p.group2,
                    (SELECT count(*) FROM public.tbl_like l WHERE l.liked_id = p.id AND l.liked_type = 'place' AND l.liked = true) as place_liked_count,
                    (SELECT count(*) FROM public.tbl_place_user_review r WHERE r.place_id = p.id AND r.is_active = true) as place_reviews_count,
                    public.v1_common_place_features(p.id) as features
                FROM tbl_naver_folder_place fp 
                JOIN tbl_place p ON fp.place_id = p.id
                WHERE fp.folder_id = f.folder_id
                LIMIT 10
            ) p_sub
        ) as preview_places
    FROM tbl_naver_folder f
    ORDER BY f.last_use_time DESC NULLS LAST
    LIMIT p_limit OFFSET p_offset;
END;
$$;

-- 2. 유튜브 채널 목록 조회 함수 수정 (v2)
CREATE OR REPLACE FUNCTION public.v2_get_youtube_channels(
    p_limit integer DEFAULT 20,
    p_offset integer DEFAULT 0
)
RETURNS TABLE (
    channel_id text,
    channel_title text,
    channel_thumbnail text,
    description text,
    place_count bigint,
    preview_places jsonb
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, public
AS $$
BEGIN
    RETURN QUERY
    WITH channel_info AS (
        SELECT 
            metadata->>'channelId' as c_id,
            MAX(metadata->>'channelTitle') as c_title,
            MAX(metadata->'thumbnails'->'medium'->>'url') as c_thumb,
            MAX(metadata->'localized'->>'description') as c_desc,
            count(DISTINCT place_id) as p_count
        FROM tbl_place_features
        WHERE platform_type = 'youtube'
          AND status = 'active'
        GROUP BY 1
    ),
    unique_place_features AS (
        SELECT DISTINCT ON (metadata->>'channelId', place_id)
            metadata->>'channelId' as c_id,
            place_id,
            published_at
        FROM tbl_place_features
        WHERE platform_type = 'youtube'
          AND status = 'active'
        ORDER BY metadata->>'channelId', place_id, published_at DESC
    ),
    place_previews AS (
        SELECT 
            upf.c_id,
            p.id,
            p.name,
            p.category,
            p.address,
            p.road_address,
            p.images[1] as thumbnail,
            p.visitor_reviews_score as score,
            p.visitor_reviews_total as review_count,
            p.group1,
            p.group2,
            (SELECT count(*) FROM public.tbl_like l WHERE l.liked_id = p.id AND l.liked_type = 'place' AND l.liked = true) as place_liked_count,
            (SELECT count(*) FROM public.tbl_place_user_review r WHERE r.place_id = p.id AND r.is_active = true) as place_reviews_count,
            public.v1_common_place_features(p.id) as features,
            row_number() OVER (PARTITION BY upf.c_id ORDER BY upf.published_at DESC) as rn
        FROM unique_place_features upf
        JOIN tbl_place p ON upf.place_id = p.id
    )
    SELECT 
        ca.c_id,
        ca.c_title,
        ca.c_thumb,
        ca.c_desc,
        ca.p_count,
        (
            SELECT jsonb_agg(to_jsonb(pp.*) - 'c_id' - 'rn')
            FROM place_previews pp
            WHERE pp.c_id = ca.c_id AND pp.rn <= 10
        ) as preview_places
    FROM channel_info ca
    ORDER BY ca.p_count DESC
    LIMIT p_limit OFFSET p_offset;
END;
$$;

-- 3. 커뮤니티 맛집 지역별 목록 조회 함수 수정 (v2)
CREATE OR REPLACE FUNCTION public.v2_get_community_contents(
    p_domain text DEFAULT NULL,
    p_limit integer DEFAULT 20,
    p_offset integer DEFAULT 0
)
RETURNS TABLE (
    region_name text,
    place_count bigint,
    preview_contents jsonb
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, public
AS $$
BEGIN
    RETURN QUERY
    WITH region_stats AS (
        SELECT 
            p.group1 as r_name,
            count(DISTINCT p.id) as p_count
        FROM tbl_place_features pf
        JOIN tbl_place p ON pf.place_id = p.id
        WHERE pf.platform_type = 'community'
          AND pf.status = 'active'
          AND (p_domain IS NULL OR pf.metadata->>'domain' = p_domain)
          AND p.group1 IS NOT NULL
        GROUP BY p.group1
    ),
    place_latest_features AS (
        SELECT 
            p.group1 as r_name,
            p.id as place_id,
            p.name as place_name,
            p.category,
            p.images[1] as thumbnail,
            p.visitor_reviews_score as score,
            p.visitor_reviews_total as review_count,
            p.group1,
            p.group2,
            pf.title,
            pf.content_url,
            pf.metadata->>'domain' as domain,
            pf.published_at,
            (SELECT count(*) FROM public.tbl_like l WHERE l.liked_id = p.id AND l.liked_type = 'place' AND l.liked = true) as place_liked_count,
            (SELECT count(*) FROM public.tbl_place_user_review r WHERE r.place_id = p.id AND r.is_active = true) as place_reviews_count,
            public.v1_common_place_features(p.id) as features,
            row_number() OVER (PARTITION BY p.group1, p.id ORDER BY pf.published_at DESC) as place_rn
        FROM tbl_place_features pf
        JOIN tbl_place p ON pf.place_id = p.id
        WHERE pf.platform_type = 'community'
          AND pf.status = 'active'
          AND (p_domain IS NULL OR pf.metadata->>'domain' = p_domain)
          AND p.group1 IS NOT NULL
    ),
    content_previews AS (
        SELECT 
            plf.*,
            row_number() OVER (PARTITION BY plf.r_name ORDER BY plf.published_at DESC) as rn
        FROM place_latest_features plf
        WHERE plf.place_rn = 1
    )
    SELECT 
        rs.r_name::text,
        rs.p_count,
        (
            SELECT jsonb_agg(to_jsonb(cp.*) - 'r_name' - 'place_rn' - 'rn')
            FROM content_previews cp
            WHERE cp.r_name = rs.r_name AND cp.rn <= 10
        ) as preview_contents
    FROM region_stats rs
    ORDER BY rs.p_count DESC
    LIMIT p_limit OFFSET p_offset;
END;
$$;

-- 4. 공개 폴더 목록 조회 함수 수정
DROP FUNCTION IF EXISTS public.v1_list_public_folders(integer, integer);
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
    updated_at TIMESTAMPTZ,
    preview_places JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, public
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
        ) AS preview_places
    FROM public.tbl_folder f
    LEFT JOIN public.tbl_user_profile p ON f.owner_id = p.auth_user_id
    LEFT JOIN LATERAL (
        SELECT MAX(created_at) as last_added_at
        FROM public.tbl_folder_place
        WHERE folder_id = f.id AND deleted_at IS NULL
    ) lp ON TRUE
    WHERE f.permission = 'public'
      AND f.is_hidden = FALSE
    ORDER BY COALESCE(lp.last_added_at, f.created_at) DESC
    LIMIT p_limit OFFSET p_offset;
END;
$$;

-- 권한 부여
GRANT EXECUTE ON FUNCTION public.v2_get_naver_folders(integer, integer) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.v2_get_youtube_channels(integer, integer) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.v2_get_community_contents(text, integer, integer) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.v1_list_public_folders(integer, integer) TO authenticated, anon;
