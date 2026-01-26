-- =====================================================
-- 088_update_v2_get_youtube_channels_sort.sql
-- 유튜브 채널 목록 조회 시 최근 등록된 항목이 있는 채널을 상위에 노출하도록 정렬 순서 변경
--
-- 실행 방법:
--   psql "postgresql://postgres.xyqpggpilgcdsawuvpzn:ZNDqDunnaydr0aFQ@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres" -f docs/sql/088_update_v2_get_youtube_channels_sort.sql
-- =====================================================

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
        -- 채널별 고유 정보, 매장 수 집계 및 최신 등록일 확인
        SELECT 
            metadata->>'channelId' as c_id,
            MAX(metadata->>'channelTitle') as c_title,
            MAX(metadata->'thumbnails'->'medium'->>'url') as c_thumb,
            MAX(metadata->'localized'->>'description') as c_desc,
            count(DISTINCT place_id) as p_count,
            MAX(created_at) as last_created_at
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
            WHERE pp.c_id = ca.c_id AND pp.rn <= 10
        ) as preview_places
    FROM channel_info ca
    ORDER BY ca.last_created_at DESC, ca.p_count DESC
    LIMIT p_limit OFFSET p_offset;
END;
$$;

COMMENT ON FUNCTION public.v2_get_youtube_channels IS '유튜브 채널별 맛집 목록 및 미리보기 장소 정보를 조회합니다 (v2) - 최근 등록 순 정렬';
