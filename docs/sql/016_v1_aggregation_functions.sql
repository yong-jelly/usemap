-- =====================================================
-- 016_v1_aggregation_functions.sql
-- 장소 피처, 사용자 장소 통계 등 집계 관련 RPC 함수 정의
-- =====================================================

-- 1. 장소 피처 통계 결합 및 캐싱 함수
CREATE OR REPLACE FUNCTION public.v1_aggr_combine_place_features(recreation boolean DEFAULT false)
 RETURNS TABLE(bucket_key text, bucket_name text, bucket_data_jsonb jsonb, bucket_created_at timestamp without time zone, elapsed_seconds integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$ 
DECLARE 
    all_stats_data JSONB; 
    group_stats_data JSONB; 
    combined_result JSONB; 
    existing_data RECORD; 
    should_recreate BOOLEAN := recreation; 
BEGIN 
    SELECT * INTO existing_data FROM public.tbl_bucket WHERE key = 'features_stats' AND name = 'combine_stat_card'; 
    IF existing_data.key IS NOT NULL THEN 
        IF existing_data.created_at < (NOW() - INTERVAL '5 minutes') THEN should_recreate := TRUE; 
        ELSIF NOT should_recreate THEN 
            RETURN QUERY SELECT existing_data.key::TEXT, existing_data.name::TEXT, existing_data.data_jsonb, existing_data.created_at, EXTRACT(EPOCH FROM (NOW() - existing_data.created_at))::INTEGER; 
            RETURN; 
        END IF; 
    END IF; 

    IF should_recreate OR existing_data IS NULL THEN 
        DELETE FROM public.tbl_bucket WHERE key = 'features_stats' AND name = 'combine_stat_card'; 
        SELECT jsonb_build_object('total_place_count', total_place_count, 'total_row_count', total_row_count, 'total_user_count', total_user_count, 'category_aggregation', category_aggregation, 'region_aggregation', region_aggregation, 'domain_aggregation', domain_aggregation) INTO all_stats_data FROM v1_aggr_place_features_all_stats() LIMIT 1; 
        SELECT jsonb_agg(jsonb_build_object('platform_type', p_platform_type, 'domain', group_domain, 'total_place_count', total_place_count, 'total_row_count', total_row_count, 'total_user_count', total_user_count, 'category_aggregation', category_aggregation, 'region_aggregation', region_aggregation)) INTO group_stats_data FROM v1_aggr_place_features_by_group_stats(); 
        combined_result := jsonb_build_object('all_stats', all_stats_data, 'group_stats', COALESCE(group_stats_data, '[]'::jsonb)); 
        INSERT INTO public.tbl_bucket (key, name, data_jsonb, created_at) VALUES ('features_stats', 'combine_stat_card', combined_result, NOW()); 
    END IF; 

    RETURN QUERY SELECT b.key::TEXT, b.name::TEXT, b.data_jsonb, b.created_at, EXTRACT(EPOCH FROM (NOW() - b.created_at))::INTEGER FROM public.tbl_bucket b WHERE b.key = 'features_stats' AND b.name = 'combine_stat_card'; 
END; 
$function$;

-- 2. 사용자별 장소 통계 결합 및 캐싱 함수
CREATE OR REPLACE FUNCTION public.v1_aggr_combine_user_places(p_user_id uuid DEFAULT NULL::uuid, recreation boolean DEFAULT false)
 RETURNS TABLE(bucket_key text, bucket_name text, bucket_data_jsonb jsonb, bucket_created_at timestamp without time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    target_user_id UUID := COALESCE(p_user_id, auth.uid());
    category_stats_data JSONB;
    region_stats_data JSONB;
    combined_result JSONB;
    existing_data RECORD;
    should_recreate BOOLEAN := recreation;
    bucket_key_name TEXT := 'user_places_stats';
    bucket_name_value TEXT := target_user_id::TEXT;
    total_features_count INTEGER;
    cnt_visited_liked INTEGER; cnt_visited_saved INTEGER; cnt_liked_visited INTEGER; cnt_saved_visited INTEGER; cnt_featured_place_visited INTEGER;
BEGIN
    SELECT * INTO existing_data FROM public.tbl_bucket WHERE key = bucket_key_name AND name = bucket_name_value;
    IF existing_data.key IS NOT NULL THEN
        IF existing_data.created_at < (NOW() - INTERVAL '5 minutes') THEN should_recreate := TRUE;
        ELSIF NOT should_recreate THEN
            RETURN QUERY SELECT existing_data.key::TEXT, existing_data.name::TEXT, existing_data.data_jsonb, existing_data.created_at;
            RETURN;
        END IF;
    END IF;

    IF should_recreate OR existing_data IS NULL THEN
        DELETE FROM public.tbl_bucket WHERE key = bucket_key_name AND name = bucket_name_value;
        SELECT aggregation INTO category_stats_data FROM v1_aggr_user_places_categorized_stats(target_user_id) LIMIT 1;
        SELECT aggregation INTO region_stats_data FROM v1_aggr_user_places_region_stats(target_user_id) LIMIT 1;
        SELECT COUNT(DISTINCT(place_id)) INTO total_features_count FROM tbl_place_features;
        SELECT COUNT(DISTINCT v.place_id) INTO cnt_visited_liked FROM tbl_visited v JOIN tbl_like l ON v.user_id = l.user_id AND v.place_id = l.ref_liked_id WHERE v.user_id = target_user_id AND l.liked_type = 'place' AND l.liked = true;
        SELECT COUNT(DISTINCT v.place_id) INTO cnt_visited_saved FROM tbl_visited v JOIN tbl_save s ON v.user_id = s.user_id AND v.place_id = s.ref_saved_id WHERE v.user_id = target_user_id AND s.saved_type = 'place' AND s.saved = true;
        SELECT COUNT(DISTINCT l.ref_liked_id) INTO cnt_liked_visited FROM tbl_like l JOIN tbl_visited v ON l.user_id = v.user_id AND l.ref_liked_id = v.place_id WHERE l.user_id = target_user_id AND l.liked_type = 'place' AND l.liked = true;
        SELECT COUNT(DISTINCT s.ref_saved_id) INTO cnt_saved_visited FROM tbl_save s JOIN tbl_visited v ON s.user_id = v.user_id AND s.ref_saved_id = v.place_id WHERE s.user_id = target_user_id AND s.saved_type = 'place' AND s.saved = true;
        SELECT COUNT(*) INTO cnt_featured_place_visited FROM tbl_visited v JOIN tbl_place_features pf ON v.place_id = pf.place_id WHERE v.user_id = target_user_id;
        
        combined_result := jsonb_build_object('v1_aggr_user_places_categorized_stats', COALESCE(category_stats_data, '[]'::jsonb), 'v1_aggr_user_places_region_stats', COALESCE(region_stats_data, '[]'::jsonb), 'total_features_count', total_features_count, 'total_visited_places_liked', COALESCE(cnt_visited_liked, 0), 'total_visited_places_saved', COALESCE(cnt_visited_saved, 0), 'total_liked_places_visited', COALESCE(cnt_liked_visited, 0), 'total_saved_places_visited', COALESCE(cnt_saved_visited, 0), 'total_featured_place_visited', COALESCE(cnt_featured_place_visited, 0));
        INSERT INTO public.tbl_bucket (key, name, data_jsonb, created_at) VALUES (bucket_key_name, bucket_name_value, combined_result, NOW());
    END IF;

    RETURN QUERY SELECT b.key::TEXT, b.name::TEXT, b.data_jsonb, b.created_at FROM public.tbl_bucket b WHERE b.key = bucket_key_name AND b.name = bucket_name_value;
END;
$function$;
