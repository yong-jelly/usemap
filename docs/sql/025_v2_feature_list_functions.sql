-- =====================================================
-- 025_v2_feature_list_functions.sql
-- 피쳐 페이지용 네이버 폴더 및 유튜브 채널 목록 조회 RPC 함수 정의 (v2)
-- 
-- 실행 방법:
--   psql "postgresql://postgres.xyqpggpilgcdsawuvpzn:ZNDqDunnaydr0aFQ@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres" -f docs/sql/025_v2_feature_list_functions.sql
-- =====================================================

-- 1. 네이버 폴더 목록 조회 함수 (v2)
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
SET search_path = public, public
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
                    p.group2
                FROM tbl_naver_folder_place fp 
                JOIN tbl_place p ON fp.place_id = p.id
                WHERE fp.folder_id = f.folder_id
                LIMIT 10 -- 10개로 변경
            ) p_sub
        ) as preview_places
    FROM tbl_naver_folder f
    ORDER BY f.last_use_time DESC NULLS LAST, f.creation_time DESC
    LIMIT p_limit OFFSET p_offset;
END;
$$;

COMMENT ON FUNCTION public.v2_get_naver_folders IS '네이버 폴더 목록 및 미리보기 장소 정보를 조회합니다 (v2)';
GRANT EXECUTE ON FUNCTION public.v2_get_naver_folders TO authenticated, anon;


-- 2. 유튜브 채널 목록 조회 함수 (v2)
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
SET search_path = public, public
AS $$
BEGIN
    RETURN QUERY
    WITH channel_info AS (
        -- 채널별 고유 정보 및 매장 수 집계
        SELECT 
            metadata->>'channelId' as c_id,
            MAX(metadata->>'channelTitle') as c_title,
            MAX(metadata->'thumbnails'->'medium'->>'url') as c_thumb, -- medium 사이즈로 조금 더 크게
            MAX(metadata->'localized'->>'description') as c_desc,
            count(DISTINCT place_id) as p_count
        FROM tbl_place_features
        WHERE platform_type = 'youtube'
          AND status = 'active'
        GROUP BY 1
    ),
    unique_place_features AS (
        -- 한 채널에서 동일한 장소를 여러 번 언급했을 경우 최신 한 번만 선택
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
            WHERE pp.c_id = ca.c_id AND pp.rn <= 10 -- 10개까지
        ) as preview_places
    FROM channel_info ca
    ORDER BY ca.p_count DESC
    LIMIT p_limit OFFSET p_offset;
END;
$$;

COMMENT ON FUNCTION public.v2_get_youtube_channels IS '유튜브 채널별 맛집 목록 및 미리보기 장소 정보를 조회합니다 (v2)';
GRANT EXECUTE ON FUNCTION public.v2_get_youtube_channels TO authenticated, anon;
