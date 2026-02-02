-- =====================================================
-- 092_create_v2_get_social_region_info.sql
-- 소셜 지역 정보 조회
-- 
-- 인자:
--   @p_region_name: 지역명
-- 
-- 실행 방법:
--   psql "postgresql://postgres.xyqpggpilgcdsawuvpzn:ZNDqDunnaydr0aFQ@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres" -f docs/sql/092_create_v2_get_social_region_info.sql
-- =====================================================

CREATE OR REPLACE FUNCTION public.v2_get_social_region_info(p_region_name text)
RETURNS TABLE (
    region_name text,
    place_count bigint,
    is_subscribed boolean
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p_region_name as region_name,
        count(DISTINCT pf.place_id) as place_count,
        COALESCE((
            SELECT EXISTS(
                SELECT 1 FROM tbl_feature_subscription fs
                WHERE fs.feature_type = 'social_region'
                  AND fs.feature_id = p_region_name
                  AND fs.user_id = auth.uid()
                  AND fs.deleted_at IS NULL
            )
        ), false) as is_subscribed
    FROM tbl_place_features pf
    JOIN tbl_place p ON pf.place_id = p.id
    WHERE pf.platform_type = 'social'
      AND pf.status = 'active'
      AND p.group1 = p_region_name;
END;
$$;

COMMENT ON FUNCTION public.v2_get_social_region_info IS '소셜 지역 정보를 조회합니다.';
GRANT EXECUTE ON FUNCTION public.v2_get_social_region_info TO authenticated, anon;
