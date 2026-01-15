-- =====================================================
-- 074_optimize_public_feed_with_mv.sql
-- v1_get_public_feed 함수의 타임아웃 해결을 위한 Materialized View 도입
-- 
-- 주요 변경 사항:
--   1. mv_public_feed 머터리얼라이즈드 뷰 생성 (모든 소스별 피드 미리 집계)
--   2. v1_get_public_feed 함수가 MV를 조회하도록 수정 (성능 개선)
--   3. 1시간마다 MV 자동 갱신을 위한 pg_cron 스케줄 등록
-- 
-- 실행 방법:
--   psql "postgresql://postgres.xyqpggpilgcdsawuvpzn:ZNDqDunnaydr0aFQ@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres" -f docs/sql/074_optimize_public_feed_with_mv.sql
-- =====================================================

-- 1. 머터리얼라이즈드 뷰 생성
DROP MATERIALIZED VIEW IF EXISTS public.mv_public_feed;

CREATE MATERIALIZED VIEW public.mv_public_feed AS
WITH source_folder AS (
    SELECT DISTINCT ON (type, sid, pid)
        'folder'::VARCHAR as type, 
        fp.folder_id::VARCHAR as sid,
        fp.place_id as pid,
        fp.created_at::TIMESTAMPTZ as added_time,
        NULL::text as meta
    FROM public.tbl_folder_place fp
    JOIN public.tbl_folder f ON fp.folder_id = f.id
    WHERE f.permission = 'public' AND f.is_hidden = FALSE AND fp.deleted_at IS NULL
    ORDER BY type, sid, pid, added_time DESC
),
source_naver AS (
    SELECT DISTINCT ON (type, sid, pid)
        'naver_folder'::VARCHAR as type, 
        nfp.folder_id::VARCHAR as sid,
        nfp.place_id as pid,
        nf.created_at::TIMESTAMPTZ as added_time,
        NULL::text as meta
    FROM public.tbl_naver_folder_place nfp
    JOIN public.tbl_naver_folder nf ON nfp.folder_id = nf.folder_id
    ORDER BY type, sid, pid, added_time DESC
),
source_features AS (
    SELECT DISTINCT ON (type, sid, pid)
        CASE 
            WHEN pf.platform_type = 'youtube' THEN 'youtube_channel'::VARCHAR
            WHEN pf.platform_type = 'community' THEN 'community_region'::VARCHAR
            ELSE pf.platform_type::VARCHAR
        END as type, 
        CASE 
            WHEN pf.platform_type = 'youtube' THEN pf.metadata->>'channelId' 
            ELSE (SELECT p_inner.group1 FROM public.tbl_place p_inner WHERE p_inner.id = pf.place_id) 
        END::VARCHAR as sid,
        pf.place_id as pid, 
        pf.published_at::TIMESTAMPTZ as added_time,
        pf.metadata->>'domain' as meta
    FROM public.tbl_place_features pf
    WHERE pf.status = 'active'
    ORDER BY type, sid, pid, added_time DESC
),
latest_data AS (
    SELECT * FROM source_folder
    UNION ALL
    SELECT * FROM source_naver
    UNION ALL
    SELECT * FROM source_features
)
SELECT 
    d.type::VARCHAR as source_type,
    d.sid::VARCHAR as source_id,
    (CASE 
        WHEN d.type = 'folder' THEN (SELECT f_inner.title FROM public.tbl_folder f_inner WHERE f_inner.id = d.sid)
        WHEN d.type = 'naver_folder' THEN (SELECT nf_inner.name::text FROM public.tbl_naver_folder nf_inner WHERE nf_inner.folder_id::varchar = d.sid)
        WHEN d.type = 'youtube_channel' THEN (SELECT pf_inner.metadata->>'channelTitle' FROM public.tbl_place_features pf_inner WHERE pf_inner.metadata->>'channelId' = d.sid LIMIT 1)
        WHEN d.type = 'community_region' THEN COALESCE(d.meta, 'unknown') || '|' || d.sid
        ELSE 'Unknown'
    END)::VARCHAR as source_title,
    (CASE 
        WHEN d.type = 'folder' THEN (
            SELECT up_inner.profile_image_url 
            FROM public.tbl_folder f_inner 
            JOIN public.tbl_user_profile up_inner ON f_inner.owner_id::uuid = up_inner.auth_user_id 
            WHERE f_inner.id = d.sid
        )
        WHEN d.type = 'youtube_channel' THEN (
            SELECT pf_inner.metadata->'thumbnails'->'default'->>'url' 
            FROM public.tbl_place_features pf_inner 
            WHERE pf_inner.metadata->>'channelId' = d.sid 
            LIMIT 1
        )
        ELSE NULL
    END)::VARCHAR as source_image,
    p.id::VARCHAR as place_id,
    (to_jsonb(p) - '{themes, street_panorama, category_code_list, visitor_review_stats, algo_avg_len, algo_stdev_len, algo_revisit_rate, algo_media_ratio, algo_avg_views, algo_recency_score, algo_engagement_score, algo_length_variation_index, algo_loyalty_index, algo_growth_rate_1m, algo_growth_rate_2m, algo_growth_rate_3m}'::text[] || jsonb_build_object('image_urls', p.images, 'avg_price', calculate_menu_avg_price(p.menus))) as place_data,
    d.added_time as added_at
FROM latest_data d
JOIN public.tbl_place p ON d.pid = p.id
WITH DATA;

-- 2. 동시 갱신 및 조회 성능을 위한 인덱스 생성
CREATE INDEX idx_mv_public_feed_source_type ON public.mv_public_feed (source_type);
CREATE INDEX idx_mv_public_feed_added_at ON public.mv_public_feed (added_at DESC);
CREATE UNIQUE INDEX idx_mv_public_feed_unique ON public.mv_public_feed (source_type, source_id, place_id);

-- 3. v1_get_public_feed 함수 수정 (MV 조회)
CREATE OR REPLACE FUNCTION public.v1_get_public_feed(
    p_source_type VARCHAR DEFAULT NULL, -- 'folder', 'naver_folder', 'youtube_channel', 'community_region'
    p_limit INT DEFAULT 10,
    p_offset INT DEFAULT 0
)
RETURNS TABLE (
    source_type VARCHAR,
    source_id VARCHAR,
    source_title VARCHAR,
    source_image VARCHAR,
    place_id VARCHAR,
    place_data JSONB,
    added_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        mv.source_type,
        mv.source_id,
        mv.source_title,
        mv.source_image,
        mv.place_id,
        mv.place_data,
        mv.added_at
    FROM public.mv_public_feed mv
    WHERE (p_source_type IS NULL OR mv.source_type = p_source_type)
    ORDER BY mv.added_at DESC
    LIMIT p_limit OFFSET p_offset;
END;
$$;

-- 4. Supabase Cron 설정 (1시간마다 갱신)
DO $$
BEGIN
    PERFORM cron.unschedule('refresh-public-feed');
EXCEPTION WHEN OTHERS THEN
END $$;

SELECT cron.schedule(
    'refresh-public-feed', 
    '0 * * * *', 
    'REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_public_feed'
);

COMMENT ON MATERIALIZED VIEW public.mv_public_feed IS '공개 피드 통합 데이터 (1시간 주기 갱신)';
COMMENT ON FUNCTION public.v1_get_public_feed IS '공개 피드를 조회합니다 (MV 기반 최적화)';

GRANT EXECUTE ON FUNCTION public.v1_get_public_feed TO authenticated, anon;
