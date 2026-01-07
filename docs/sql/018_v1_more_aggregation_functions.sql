-- =====================================================
-- 018_v1_more_aggregation_functions.sql
-- 추가적인 집계 관련 RPC 함수 정의 (그룹별, 사용자별 통계 등)
-- =====================================================

-- 1. 플랫폼/그룹별 장소 피처 통계 집계
CREATE OR REPLACE FUNCTION public.v1_aggr_place_features_by_group_stats()
 RETURNS TABLE(p_platform_type text, group_domain text, total_place_count bigint, total_row_count bigint, total_user_count bigint, category_aggregation jsonb, region_aggregation jsonb)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    RETURN QUERY
    WITH base_data AS (
        SELECT a.platform_type,
            CASE WHEN a.platform_type = 'youtube' THEN 'youtube' ELSE a.metadata->>'domain' END as domain,
            a.place_id, a.user_id, b.category, b.group1
        FROM tbl_place_features a LEFT JOIN tbl_place b ON a.place_id = b.id
        WHERE a.status = 'active'
    )
    SELECT domain as p_platform_type, domain as group_domain, COUNT(DISTINCT place_id), COUNT(*), COUNT(DISTINCT user_id),
        (SELECT jsonb_agg(jsonb_build_object('category', cat, 'count', cnt)) FROM (SELECT category as cat, COUNT(*) as cnt FROM base_data bd2 WHERE bd2.domain = bd.domain GROUP BY category) s),
        (SELECT jsonb_agg(jsonb_build_object('region', reg, 'count', cnt)) FROM (SELECT group1 as reg, COUNT(*) as cnt FROM base_data bd2 WHERE bd2.domain = bd.domain GROUP BY group1) s)
    FROM base_data bd GROUP BY domain;
END;
$function$;

-- 2. 사용자별 카테고리 장소 통계 집계
CREATE OR REPLACE FUNCTION public.v1_aggr_user_places_categorized_stats(p_user_id uuid DEFAULT NULL::uuid)
 RETURNS TABLE(agg_name text, aggregation jsonb)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    RETURN QUERY
    SELECT 'categorized_stats'::text, jsonb_agg(jsonb_build_object('category', category, 'count', cnt))
    FROM (SELECT category, COUNT(*) as cnt FROM tbl_place p JOIN tbl_visited v ON p.id = v.place_id WHERE v.user_id = COALESCE(p_user_id, auth.uid()) GROUP BY category) s;
END;
$function$;
