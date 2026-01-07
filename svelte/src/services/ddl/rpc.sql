CREATE OR REPLACE FUNCTION public.generate_response(
    p_data ANYELEMENT DEFAULT NULL,
    p_function TEXT DEFAULT NULL, -- 기본값 추가
    p_code INT DEFAULT 200,
    p_message TEXT DEFAULT 'Success',
    p_params JSON DEFAULT '{}'::json,
    p_execution_time NUMERIC DEFAULT 0
)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
    data_json JSON;
BEGIN
    -- p_function이 NULL이면 오류 발생
    IF p_function IS NULL THEN
        RAISE EXCEPTION 'p_function 파라미터는 필수입니다';
    END IF;

    -- NULL 처리
    IF p_data IS NULL THEN
        data_json := '[]'::JSON;
    ELSE
        -- 데이터 변환 로직
        IF pg_typeof(p_data) IN ('json'::regtype, 'jsonb'::regtype) THEN
            -- JSON/JSONB 타입인 경우
            data_json := CASE 
                WHEN json_typeof(p_data::json) = 'array' THEN p_data::json 
                ELSE json_build_array(p_data::json) 
            END;
        ELSE
            -- 단일 값 또는 복합 타입
            BEGIN
                -- 배열 변환 시도 (배열/테이블인 경우)
                data_json := (SELECT json_agg(p_data));
            EXCEPTION WHEN OTHERS THEN
                -- 단일 값 변환
                data_json := json_build_array(p_data);
            END;
        END IF;
    END IF;

    -- 최종 응답 생성
    RETURN json_build_object(
        'meta', json_build_object(
            'code', p_code,
            'message', p_message,
            'timestamp', CURRENT_TIMESTAMP,
            'function', p_function,
            'params', p_params,
            'execution_time', ROUND(p_execution_time, 3) -- 소수점 3자리
        ),
        'data', COALESCE(data_json, '[]'::json)
    );
END;
$$;
