-- =====================================================
-- 090_create_v2_refresh_popular_place_cache.sql
-- 인기 콘텐츠 캐시 갱신 함수
-- 
-- 실행 방법:
--   psql "postgresql://postgres.xyqpggpilgcdsawuvpzn:ZNDqDunnaydr0aFQ@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres" -f docs/sql/090_create_v2_refresh_popular_place_cache.sql
-- =====================================================

DROP FUNCTION IF EXISTS public.v2_refresh_popular_place_cache();

-- 캐시 갱신 함수 (단순화 버전)
CREATE OR REPLACE FUNCTION public.v2_refresh_popular_place_cache()
RETURNS TABLE(inserted_count INTEGER, deleted_count INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_batch_id TEXT;
    v_inserted INTEGER := 0;
    v_deleted INTEGER := 0;
    v_row_count INTEGER;
BEGIN
    v_batch_id := 'batch_' || to_char(now(), 'YYYYMMDDHH24MISS');
    
    -- 기존 데이터 삭제
    DELETE FROM tbl_cache_popular_place;
    GET DIAGNOSTICS v_deleted = ROW_COUNT;
    
    -- 1. 인기 음식점 추가 (최대 600개)
    WITH place_popularity AS (
        SELECT place_id, count(*) as score
        FROM (
            SELECT place_id FROM tbl_naver_folder_place
            UNION ALL
            SELECT place_id FROM tbl_place_features
            UNION ALL
            SELECT place_id FROM tbl_folder_place
        ) combined
        GROUP BY place_id
        ORDER BY score DESC
        LIMIT 600
    )
    INSERT INTO tbl_cache_popular_place (
        content_type, content_id, title, subtitle, thumbnail,
        category, group1, group2, review_count, review_count_range,
        popularity_score, batch_id
    )
    SELECT 
        'place', p.id, p.name, p.category, p.images[1],
        p.category, p.group1, p.group2,
        COALESCE(p.visitor_reviews_total, 0),
        CASE 
            WHEN COALESCE(p.visitor_reviews_total, 0) < 10 THEN 'under_10'
            WHEN COALESCE(p.visitor_reviews_total, 0) < 50 THEN '10_50'
            WHEN COALESCE(p.visitor_reviews_total, 0) < 100 THEN '50_100'
            ELSE '100_plus'
        END,
        pp.score::INTEGER, v_batch_id
    FROM place_popularity pp
    JOIN tbl_place p ON pp.place_id = p.id
    WHERE p.images[1] IS NOT NULL;
    
    GET DIAGNOSTICS v_row_count = ROW_COUNT;
    v_inserted := v_inserted + v_row_count;
    
    -- 2. 네이버 폴더 추가 (최대 100개)
    INSERT INTO tbl_cache_popular_place (
        content_type, content_id, title, subtitle, thumbnail, place_count, batch_id
    )
    SELECT 'naver_folder', nf.folder_id::TEXT, nf.name, nf.memo,
        (SELECT p.images[1] FROM tbl_naver_folder_place nfp JOIN tbl_place p ON nfp.place_id = p.id WHERE nfp.folder_id = nf.folder_id AND p.images[1] IS NOT NULL LIMIT 1),
        (SELECT count(*) FROM tbl_naver_folder_place WHERE folder_id = nf.folder_id)::INTEGER,
        v_batch_id
    FROM tbl_naver_folder nf
    LIMIT 100;
    
    GET DIAGNOSTICS v_row_count = ROW_COUNT;
    v_inserted := v_inserted + v_row_count;
    
    -- 3. 유튜브 채널 추가 (최대 100개)
    INSERT INTO tbl_cache_popular_place (
        content_type, content_id, title, thumbnail, place_count, batch_id
    )
    SELECT DISTINCT ON (metadata->>'channelId')
        'youtube_channel', metadata->>'channelId', metadata->>'channelTitle',
        metadata->'thumbnails'->'medium'->>'url',
        (SELECT count(DISTINCT place_id) FROM tbl_place_features pf2 WHERE pf2.metadata->>'channelId' = pf.metadata->>'channelId')::INTEGER,
        v_batch_id
    FROM tbl_place_features pf
    WHERE platform_type = 'youtube' AND status = 'active'
    ORDER BY metadata->>'channelId'
    LIMIT 100;
    
    GET DIAGNOSTICS v_row_count = ROW_COUNT;
    v_inserted := v_inserted + v_row_count;
    
    -- 4. 맛탐정 폴더 추가 (공개 폴더, 최대 100개)
    INSERT INTO tbl_cache_popular_place (
        content_type, content_id, title, subtitle, thumbnail, place_count, batch_id
    )
    SELECT 'folder', f.id, f.title, f.description,
        (SELECT p.images[1] FROM tbl_folder_place fp JOIN tbl_place p ON fp.place_id = p.id WHERE fp.folder_id = f.id AND p.images[1] IS NOT NULL LIMIT 1),
        f.place_count, v_batch_id
    FROM tbl_folder f
    WHERE f.permission = 'public' AND f.is_hidden = false AND f.place_count > 0
    LIMIT 100;
    
    GET DIAGNOSTICS v_row_count = ROW_COUNT;
    v_inserted := v_inserted + v_row_count;
    
    -- 5. 인기 카테고리 추가 (상위 50개)
    INSERT INTO tbl_cache_popular_place (
        content_type, content_id, title, subtitle, thumbnail, category, place_count, batch_id
    )
    SELECT 'category', category, category, count(*)::TEXT || '개 맛집',
        (SELECT p2.images[1] FROM tbl_place p2 WHERE p2.category = p.category AND p2.images[1] IS NOT NULL ORDER BY p2.visitor_reviews_total DESC NULLS LAST LIMIT 1),
        category, count(*)::INTEGER, v_batch_id
    FROM tbl_place p
    WHERE category IS NOT NULL AND category != ''
    GROUP BY category
    HAVING count(*) >= 10
    ORDER BY count(*) DESC
    LIMIT 50;
    
    GET DIAGNOSTICS v_row_count = ROW_COUNT;
    v_inserted := v_inserted + v_row_count;
    
    -- 6. 인기 지역 추가 (상위 50개)
    INSERT INTO tbl_cache_popular_place (
        content_type, content_id, title, subtitle, thumbnail, group1, group2, place_count, batch_id
    )
    SELECT 'region', group1 || '_' || COALESCE(group2, ''), COALESCE(group2, group1),
        group1 || ' ' || count(*)::TEXT || '개 맛집',
        (SELECT p2.images[1] FROM tbl_place p2 WHERE p2.group1 = p.group1 AND (p2.group2 = p.group2 OR (p2.group2 IS NULL AND p.group2 IS NULL)) AND p2.images[1] IS NOT NULL ORDER BY p2.visitor_reviews_total DESC NULLS LAST LIMIT 1),
        group1, group2, count(*)::INTEGER, v_batch_id
    FROM tbl_place p
    WHERE group1 IS NOT NULL
    GROUP BY group1, group2
    HAVING count(*) >= 20
    ORDER BY count(*) DESC
    LIMIT 50;
    
    GET DIAGNOSTICS v_row_count = ROW_COUNT;
    v_inserted := v_inserted + v_row_count;
    
    RETURN QUERY SELECT v_inserted, v_deleted;
END;
$$;

COMMENT ON FUNCTION public.v2_refresh_popular_place_cache IS '인기 콘텐츠 캐시 테이블 갱신';
GRANT EXECUTE ON FUNCTION public.v2_refresh_popular_place_cache TO authenticated, service_role;

SELECT 'v2_refresh_popular_place_cache 함수 생성 완료' as result;
