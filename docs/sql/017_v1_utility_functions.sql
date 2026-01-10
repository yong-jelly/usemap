-- =====================================================
-- 017_v1_utility_functions.sql
-- 공통 응답 처리 및 가격 계산 등 유틸리티 RPC 함수 정의
-- 
-- 실행 방법:
--   psql "postgresql://postgres.xyqpggpilgcdsawuvpzn:ZNDqDunnaydr0aFQ@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres" -f docs/sql/017_v1_utility_functions.sql
-- =====================================================

-- 1. 표준 API 응답 생성 함수
CREATE OR REPLACE FUNCTION public.generate_response(p_data anyelement DEFAULT NULL::unknown, p_function text DEFAULT NULL::text, p_code integer DEFAULT 200, p_message text DEFAULT 'Success'::text, p_params json DEFAULT '{}'::json, p_execution_time numeric DEFAULT 0)
 RETURNS json
 LANGUAGE plpgsql
AS $function$
DECLARE
    data_json JSON;
BEGIN
    IF p_function IS NULL THEN RAISE EXCEPTION 'p_function 파라미터는 필수입니다'; END IF;

    IF p_data IS NULL THEN data_json := '[]'::JSON;
    ELSE
        IF pg_typeof(p_data) IN ('json'::regtype, 'jsonb'::regtype) THEN
            data_json := CASE WHEN json_typeof(p_data::json) = 'array' THEN p_data::json ELSE json_build_array(p_data::json) END;
        ELSE
            BEGIN data_json := (SELECT json_agg(p_data)); EXCEPTION WHEN OTHERS THEN data_json := json_build_array(p_data); END;
        END IF;
    END IF;

    RETURN json_build_object(
        'meta', json_build_object('code', p_code, 'message', p_message, 'timestamp', CURRENT_TIMESTAMP, 'function', p_function, 'params', p_params, 'execution_time', ROUND(p_execution_time, 3)),
        'data', COALESCE(data_json, '[]'::json)
    );
END;
$function$;

-- 2. 메뉴 평균 가격 계산 함수
CREATE OR REPLACE FUNCTION public.calculate_menu_avg_price(menu_data jsonb)
 RETURNS integer
 LANGUAGE plpgsql
 IMMUTABLE
AS $function$
DECLARE
    menu_item JSONB;
    total_price NUMERIC := 0;
    count_items INTEGER := 0;
    price_value TEXT;
BEGIN
    IF menu_data IS NULL OR jsonb_typeof(menu_data) != 'array' THEN RETURN 0; END IF;
    
    FOR menu_item IN SELECT * FROM jsonb_array_elements(menu_data)
    LOOP
        IF menu_item ? 'price' AND menu_item->>'price' IS NOT NULL THEN
            price_value := menu_item->>'price';
            BEGIN
                total_price := total_price + price_value::NUMERIC;
                count_items := count_items + 1;
            EXCEPTION WHEN OTHERS THEN CONTINUE; END;
        END IF;
    END LOOP;
    
    RETURN CASE WHEN count_items = 0 THEN 0 ELSE ROUND(total_price / count_items)::INTEGER END;
END;
$function$;
