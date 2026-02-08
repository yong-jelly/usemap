-- Feature 페이지별 방문 카운트를 조회하는 함수
-- p_feature_type: 'naver_folder', 'youtube', 'community', 'social', 'region', 'folder'
-- 로그인 유저만 해당
-- 실행 방법:
--   psql "postgresql://postgres.xyqpggpilgcdsawuvpzn:ZNDqDunnaydr0aFQ@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres" -f docs/sql/090_count_visited_in_feature.sql
-- =====================================================
CREATE OR REPLACE FUNCTION public.v1_count_visited_in_feature(
  p_feature_type TEXT,
  p_feature_id TEXT,
  p_domain TEXT DEFAULT NULL,
  p_source TEXT DEFAULT NULL
)
RETURNS TABLE (
  total_count BIGINT,
  visited_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID := auth.uid();
BEGIN
  -- 1. 네이버 폴더 (naver_folder)
  IF p_feature_type = 'naver_folder' THEN
    RETURN QUERY
    SELECT 
      COUNT(*)::BIGINT as total_count,
      COUNT(*) FILTER (WHERE EXISTS (
        SELECT 1 FROM tbl_visited v 
        WHERE v.user_id = v_user_id 
        AND v.place_id = nfp.place_id
      ))::BIGINT as visited_count
    FROM tbl_naver_folder_place nfp
    WHERE nfp.folder_id = p_feature_id::BIGINT;

  -- 2. 유튜브 채널 (youtube)
  ELSIF p_feature_type = 'youtube' OR p_feature_type = 'youtube_channel' THEN
    RETURN QUERY
    SELECT 
      COUNT(DISTINCT pf.place_id)::BIGINT as total_count,
      COUNT(DISTINCT pf.place_id) FILTER (WHERE EXISTS (
        SELECT 1 FROM tbl_visited v 
        WHERE v.user_id = v_user_id 
        AND v.place_id = pf.place_id
      ))::BIGINT as visited_count
    FROM tbl_place_features pf
    WHERE pf.platform_type = 'youtube' 
      AND pf.metadata->>'channelId' = p_feature_id
      AND pf.status = 'active';

  -- 3. 커뮤니티 지역 (community)
  ELSIF p_feature_type = 'community' OR p_feature_type = 'community_region' THEN
    RETURN QUERY
    SELECT 
      COUNT(DISTINCT pf.place_id)::BIGINT as total_count,
      COUNT(DISTINCT pf.place_id) FILTER (WHERE EXISTS (
        SELECT 1 FROM tbl_visited v 
        WHERE v.user_id = v_user_id 
        AND v.place_id = pf.place_id
      ))::BIGINT as visited_count
    FROM tbl_place_features pf
    JOIN tbl_place p ON pf.place_id = p.id
    WHERE pf.platform_type = 'community'
      AND (p_domain IS NULL OR pf.content_url ILIKE '%' || p_domain || '%')
      AND (p.address ILIKE '%' || p_feature_id || '%' OR p.road_address ILIKE '%' || p_feature_id || '%')
      AND pf.status = 'active';

  -- 4. 소셜 지역 (social)
  ELSIF p_feature_type = 'social' OR p_feature_type = 'social_region' THEN
    RETURN QUERY
    SELECT 
      COUNT(DISTINCT pf.place_id)::BIGINT as total_count,
      COUNT(DISTINCT pf.place_id) FILTER (WHERE EXISTS (
        SELECT 1 FROM tbl_visited v 
        WHERE v.user_id = v_user_id 
        AND v.place_id = pf.place_id
      ))::BIGINT as visited_count
    FROM tbl_place_features pf
    JOIN tbl_place p ON pf.place_id = p.id
    WHERE pf.platform_type IN ('instagram', 'threads')
      AND (p_domain IS NULL OR pf.platform_type = p_domain)
      AND (p.address ILIKE '%' || p_feature_id || '%' OR p.road_address ILIKE '%' || p_feature_id || '%')
      AND pf.status = 'active';

  -- 5. 지역 추천 (region)
  ELSIF p_feature_type = 'region' OR p_feature_type = 'region_recommend' THEN
    -- 지역 추천은 여러 소스를 통합하므로 로직이 복잡할 수 있음. 
    -- 여기서는 v3_get_places_by_region과 유사하게 처리하되, 단순화를 위해 tbl_place_features 기반으로 조회
    RETURN QUERY
    SELECT 
      COUNT(DISTINCT pf.place_id)::BIGINT as total_count,
      COUNT(DISTINCT pf.place_id) FILTER (WHERE EXISTS (
        SELECT 1 FROM tbl_visited v 
        WHERE v.user_id = v_user_id 
        AND v.place_id = pf.place_id
      ))::BIGINT as visited_count
    FROM tbl_place_features pf
    JOIN tbl_place p ON pf.place_id = p.id
    WHERE (p.address ILIKE '%' || p_feature_id || '%' OR p.road_address ILIKE '%' || p_feature_id || '%')
      AND (p_source IS NULL OR pf.platform_type = p_source OR (p_source = 'folder' AND pf.platform_type = 'naver_folder'))
      AND pf.status = 'active';

  -- 6. 맛탐정 폴더 (folder)
  ELSIF p_feature_type = 'folder' THEN
    RETURN QUERY
    SELECT 
      COUNT(*)::BIGINT as total_count,
      COUNT(*) FILTER (WHERE EXISTS (
        SELECT 1 FROM tbl_visited v 
        WHERE v.user_id = v_user_id 
        AND v.place_id = fp.place_id
      ))::BIGINT as visited_count
    FROM tbl_folder_place fp
    WHERE fp.folder_id = p_feature_id::UUID;

  ELSE
    -- 지원하지 않는 타입
    RETURN QUERY SELECT 0::BIGINT, 0::BIGINT;
  END IF;
END;
$$;
