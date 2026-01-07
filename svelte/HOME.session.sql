

DO $$
DECLARE
    func_record RECORD;
BEGIN
    FOR func_record IN 
        SELECT pg_get_function_identity_arguments(p.oid) as args
        FROM pg_proc p
        LEFT JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' AND p.proname = 'v1_list_places_by_ids'
    LOOP
        EXECUTE 'DROP FUNCTION IF EXISTS public.v1_list_places_by_ids(' || func_record.args || ');';
    END LOOP;
END $$;
CREATE OR REPLACE FUNCTION public.v1_upsert_place_feature(
    p_business_id text,
    p_platform_type text,
    p_content_url text,
    p_title text DEFAULT NULL,
    p_metadata jsonb DEFAULT NULL,
    p_feature_id uuid DEFAULT NULL  -- 수정 시 기존 ID 전달
)
RETURNS TABLE (
    id uuid,
    user_id uuid,
    place_id varchar,
    platform_type varchar,
    content_url text,
    title varchar,
    metadata jsonb,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    published_at timestamp with time zone,
    is_verified boolean,
    status varchar
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    caller_user_id uuid := auth.uid();
    extracted_published_at timestamp with time zone;
    result_id uuid;
BEGIN
    -- 인증 확인
    IF caller_user_id IS NULL THEN
        RAISE EXCEPTION 'User must be authenticated to create or update place feature.';
    END IF;

    -- metadata에서 publishedAt 추출
    IF p_metadata IS NOT NULL AND p_metadata ? 'publishedAt' THEN
        extracted_published_at := (p_metadata ->> 'publishedAt')::timestamp with time zone;
    ELSE
        extracted_published_at := CURRENT_TIMESTAMP;
    END IF;

    -- 수정 모드 (기존 ID가 제공된 경우)
    IF p_feature_id IS NOT NULL THEN
        -- 기존 레코드가 존재하고 본인 소유인지 확인
        IF NOT EXISTS (
            SELECT 1 FROM tbl_place_features 
            WHERE id = p_feature_id 
            AND user_id = caller_user_id 
            AND status != 'deleted'
        ) THEN
            RAISE EXCEPTION 'Feature not found or you do not have permission to update this feature.';
        END IF;

        -- 업데이트 수행
        UPDATE tbl_place_features 
        SET 
            place_id = p_business_id,
            platform_type = p_platform_type,
            content_url = p_content_url,
            title = p_title,
            metadata = p_metadata,
            published_at = extracted_published_at,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = p_feature_id
        AND user_id = caller_user_id;
        
        result_id := p_feature_id;
    ELSE
        -- 신규 생성
        INSERT INTO tbl_place_features (
            user_id,
            place_id,
            platform_type,
            content_url,
            title,
            metadata,
            published_at
        ) VALUES (
            caller_user_id,
            p_business_id,
            p_platform_type,
            p_content_url,
            p_title,
            p_metadata,
            extracted_published_at
        ) RETURNING tbl_place_features.id INTO result_id;
    END IF;

    -- 결과 반환
    RETURN QUERY
    SELECT 
        pf.id,
        pf.user_id,
        pf.place_id,
        pf.platform_type,
        pf.content_url,
        pf.title,
        pf.metadata,
        pf.created_at,
        pf.updated_at,
        pf.published_at,
        pf.is_verified,
        pf.status
    FROM tbl_place_features pf
    WHERE pf.id = result_id;

END;
$$;

COMMENT ON FUNCTION public.v1_upsert_place_feature(text, text, text, text, jsonb, uuid)
IS '사용자가 장소 피처를 등록하거나 수정합니다. metadata의 publishedAt을 published_at 컬럼에 자동 적용합니다.';

-- drop table tbl_place_features;
-- CREATE TABLE tbl_place_features (
--     id uuid PRIMARY KEY NOT NULL DEFAULT (uuid_generate_v4()),
--     user_id UUID NOT NULL,
--     place_id VARCHAR NOT NULL,
--     platform_type VARCHAR(50) NOT NULL,
--     content_url TEXT NOT NULL,
--     title VARCHAR(500),
--     metadata JSONB,
--     created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
--     updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
--     published_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP, 
--     is_verified BOOLEAN DEFAULT FALSE,
--     status VARCHAR(20) DEFAULT 'active'
-- );

-- -- 테이블 코멘트
-- COMMENT ON TABLE tbl_place_features IS '음식점 미디어 콘텐츠 피처 테이블';
-- COMMENT ON COLUMN tbl_place_features.id IS '고유 ID';
-- COMMENT ON COLUMN tbl_place_features.user_id IS '등록한 사용자 ID';
-- COMMENT ON COLUMN tbl_place_features.place_id IS '음식점 ID';
-- COMMENT ON COLUMN tbl_place_features.platform_type IS 'youtube, instagram, blog, tiktok 등';
-- COMMENT ON COLUMN tbl_place_features.content_url IS '콘텐츠 URL';
-- COMMENT ON COLUMN tbl_place_features.title IS '제목';
-- COMMENT ON COLUMN tbl_place_features.metadata IS '메타데이터 (JSON 형태)';
-- COMMENT ON COLUMN tbl_place_features.created_at IS '생성일시';
-- COMMENT ON COLUMN tbl_place_features.updated_at IS '수정일시';
-- COMMENT ON COLUMN tbl_place_features.published_at IS '대상 콘텐츠의 생성일시';
-- COMMENT ON COLUMN tbl_place_features.is_verified IS '검증 여부';
-- COMMENT ON COLUMN tbl_place_features.status IS 'active, inactive, pending, deleted';


-- CREATE INDEX idx_place_features_platform_type ON tbl_place_features(platform_type);

select * from tbl_place where id ='1935965680';

DO $$
DECLARE
    func_record RECORD;
BEGIN
    FOR func_record IN 
        SELECT pg_get_function_identity_arguments(p.oid) as args
        FROM pg_proc p
        LEFT JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' AND p.proname = 'v1_list_places_search_for_name'
    LOOP
        EXECUTE 'DROP FUNCTION IF EXISTS public.v1_list_places_search_for_name(' || func_record.args || ');';
    END LOOP;
END $$;

select * from tbl_place_review limit 10;

select id,name,menus from tbl_place where id ='1015375771';

UPDATE public.tbl_place
SET is_franchise = TRUE
WHERE name ILIKE '%휴계소%';

SELECT * FROM public.v1_list_places_by_filters(p_limit := 5);
-- 내가 북마크(저장)한 음식점 목록을 조회하는 함수
-- 저장 상태가 true인 음식점들만 반환하며, 페이지네이션을 지원합니다.
CREATE OR REPLACE FUNCTION public.v1_get_my_bookmarked_places(
    p_limit integer DEFAULT 20,   -- 한 페이지당 조회할 음식점 수 (기본값: 20개)
    p_offset integer DEFAULT 0    -- 건너뛸 레코드 수 (페이지네이션용, 기본값: 0)
)
RETURNS jsonb -- 음식점 목록을 JSON 배열 형태로 반환
LANGUAGE plpgsql
SECURITY DEFINER -- 함수 소유자의 권한으로 실행
AS $$
DECLARE
    v_user_id uuid := auth.uid(); -- 현재 인증된 사용자의 UUID
    result jsonb;                 -- 최종 반환할 JSON 결과
BEGIN
    -- 사용자 인증 상태 확인
    -- 로그인하지 않은 사용자는 개인 북마크 목록에 접근할 수 없음
    IF v_user_id IS NULL THEN
        RETURN jsonb_build_object('error', '로그인이 필요합니다.');
    END IF;

    -- 입력값 유효성 검사
    -- 너무 많은 데이터 요청 방지 및 음수값 검증
    IF p_limit <= 0 OR p_limit > 100 THEN
        RETURN jsonb_build_object('error', 'limit은 1~100 사이의 값이어야 합니다.');
    END IF;

    IF p_offset < 0 THEN
        RETURN jsonb_build_object('error', 'offset은 0 이상이어야 합니다.');
    END IF;

    -- 북마크한 음식점 목록 조회 및 JSON 결과 생성
    -- updated_at 기준으로 정렬하여 가장 최근에 저장하거나 갱신된 순서로 반환
    WITH bookmarked_places AS (
        SELECT 
            -- 음식점 정보 (전체 컬럼)
            b.id,
            b.name,
            b.category,
            b.category_code_list,
            b.road_address,
            b.address,
            b.phone,
            b.x,
            b.y,
            b.updated_at as place_updated_at,  -- 음식점 정보 갱신 시간
            b.created_at as place_created_at,  -- 음식점 등록 시간
            b.road,
            b.category_code,
            b.payment_info,
            b.conveniences,
            b.visitor_reviews_total,
            b.visitor_reviews_score,
            b.homepage,
            b.keyword_list,
            b.images,
            b.static_map_url,
            b.themes,
            b.visitor_review_medias_total,
            b.visitor_review_stats,
            b.menus,
            b.street_panorama,
            b.place_images,
            b.group1,
            b.group2,
            b.group3,
            b.is_franchise,
            -- 북마크 기록 정보 추가
            a.saved_id,                        -- 저장된 항목 ID
            a.saved_type,                      -- 저장 타입
            a.saved,                           -- 저장 상태 (항상 true)
            a.created_at as bookmarked_at,     -- 최초 북마크 시간
            a.updated_at as bookmark_updated_at, -- 최근 북마크 갱신 시간
            a.ref_saved_id                     -- 참조 ID
        FROM public.tbl_save a
        INNER JOIN public.tbl_place b ON a.saved_id = b.id
        WHERE a.user_id = v_user_id
          AND a.saved_type = 'place'     -- 음식점 타입만 조회
          AND a.saved = true             -- 저장 상태가 true인 것만 (북마크된 상태)
        ORDER BY a.updated_at DESC       -- 최근 저장/갱신된 순서로 정렬
        LIMIT p_limit
        OFFSET p_offset
    )
    SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
            -- 음식점 기본 정보
            'id', id,
            'name', name,
            'category', category,
            'category_code_list', category_code_list,
            'road_address', road_address,
            'address', address,
            'phone', phone,
            'x', x,
            'y', y,
            'updated_at', place_updated_at,
            'created_at', place_created_at,
            'road', road,
            'category_code', category_code,
            'payment_info', payment_info,
            'conveniences', conveniences,
            'visitor_reviews_total', visitor_reviews_total,
            'visitor_reviews_score', visitor_reviews_score,
            'homepage', homepage,
            'keyword_list', keyword_list,
            'images', images,
            'static_map_url', static_map_url,
            'themes', themes,
            'visitor_review_medias_total', visitor_review_medias_total,
            'visitor_review_stats', visitor_review_stats,
            'menus', menus,
            'street_panorama', street_panorama,
            'place_images', place_images,
            'group1', group1,
            'group2', group2,
            'group3', group3,
            'is_franchise', is_franchise,
            -- 북마크 메타데이터
            'bookmark_metadata', jsonb_build_object(
                'saved_id', saved_id,                      -- 저장된 항목 ID
                'saved_type', saved_type,                  -- 저장 타입
                'saved', saved,                            -- 저장 상태
                'bookmarked_at', bookmarked_at,            -- 최초 북마크 시간
                'bookmark_updated_at', bookmark_updated_at, -- 최근 북마크 갱신 시간
                'ref_saved_id', ref_saved_id               -- 참조 ID
            )
        )
    ), '[]'::jsonb)
    INTO result
    FROM bookmarked_places;

    RETURN result;

EXCEPTION
    -- 함수 실행 중 발생할 수 있는 모든 예외를 처리
    -- 예: 테이블 접근 권한 오류, 데이터 타입 오류, 네트워크 오류 등
    WHEN others THEN
        RETURN jsonb_build_object('error', '북마크 음식점 목록 조회 중 오류: ' || SQLERRM);
END;
$$;

-- 함수 실행 권한 부여 (인증된 사용자들에게만)
-- 개인 북마크 목록이므로 로그인한 사용자만 접근 가능
GRANT EXECUTE ON FUNCTION public.v1_get_my_bookmarked_places(integer, integer) TO authenticated;

-- 내가 최근 조회한 음식점 목록을 조회하는 함수
-- 사용자가 최근에 조회한 음식점들을 updated_at 기준으로 정렬하여 반환합니다.
CREATE OR REPLACE FUNCTION public.v1_get_my_recent_view_places(
    p_limit integer DEFAULT 20,   -- 한 페이지당 조회할 음식점 수 (기본값: 20개)
    p_offset integer DEFAULT 0    -- 건너뛸 레코드 수 (페이지네이션용, 기본값: 0)
)
RETURNS jsonb -- 음식점 목록을 JSON 배열 형태로 반환
LANGUAGE plpgsql
SECURITY DEFINER -- 함수 소유자의 권한으로 실행
AS $$
DECLARE
    v_user_id uuid := auth.uid(); -- 현재 인증된 사용자의 UUID
    result jsonb;                 -- 최종 반환할 JSON 결과
BEGIN
    -- 사용자 인증 상태 확인
    -- 로그인하지 않은 사용자는 개인 조회 기록에 접근할 수 없음
    IF v_user_id IS NULL THEN
        RETURN jsonb_build_object('error', '로그인이 필요합니다.');
    END IF;

    -- 입력값 유효성 검사
    -- 너무 많은 데이터 요청 방지 및 음수값 검증
    IF p_limit <= 0 OR p_limit > 100 THEN
        RETURN jsonb_build_object('error', 'limit은 1~100 사이의 값이어야 합니다.');
    END IF;

    IF p_offset < 0 THEN
        RETURN jsonb_build_object('error', 'offset은 0 이상이어야 합니다.');
    END IF;

    -- 최근 조회한 음식점 목록 조회 및 JSON 결과 생성
    -- updated_at 기준으로 정렬하여 가장 최근에 조회하거나 갱신된 순서로 반환
    WITH recent_view_places AS (
        SELECT 
            -- 음식점 정보 (전체 컬럼)
            b.id,
            b.name,
            b.category,
            b.category_code_list,
            b.road_address,
            b.address,
            b.phone,
            b.x,
            b.y,
            b.updated_at as place_updated_at,  -- 음식점 정보 갱신 시간
            b.created_at as place_created_at,  -- 음식점 등록 시간
            b.road,
            b.category_code,
            b.payment_info,
            b.conveniences,
            b.visitor_reviews_total,
            b.visitor_reviews_score,
            b.homepage,
            b.keyword_list,
            b.images,
            b.static_map_url,
            b.themes,
            b.visitor_review_medias_total,
            b.visitor_review_stats,
            b.menus,
            b.street_panorama,
            b.place_images,
            b.group1,
            b.group2,
            b.group3,
            b.is_franchise,
            -- 조회 기록 정보 추가
            a.count as view_count,             -- 해당 음식점 조회 횟수
            a.created_at as first_viewed_at,   -- 최초 조회 시간
            a.updated_at as last_viewed_at,    -- 최근 조회 시간 (정렬 기준)
            a.ref_liked_id                     -- 참조 ID
        FROM public.tbl_recent_view a
        INNER JOIN public.tbl_place b ON a.content_id = b.id
        WHERE a.user_id = v_user_id
          AND a.content_type = 'place' -- 음식점 타입만 조회
        ORDER BY a.updated_at DESC     -- 최근 조회/갱신된 순서로 정렬
        LIMIT p_limit
        OFFSET p_offset
    )
    SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
            -- 음식점 기본 정보
            'id', id,
            'name', name,
            'category', category,
            'category_code_list', category_code_list,
            'road_address', road_address,
            'address', address,
            'phone', phone,
            'x', x,
            'y', y,
            'updated_at', place_updated_at,
            'created_at', place_created_at,
            'road', road,
            'category_code', category_code,
            'payment_info', payment_info,
            'conveniences', conveniences,
            'visitor_reviews_total', visitor_reviews_total,
            'visitor_reviews_score', visitor_reviews_score,
            'homepage', homepage,
            'keyword_list', keyword_list,
            'images', images,
            'static_map_url', static_map_url,
            'themes', themes,
            'visitor_review_medias_total', visitor_review_medias_total,
            'visitor_review_stats', visitor_review_stats,
            'menus', menus,
            'street_panorama', street_panorama,
            'place_images', place_images,
            'group1', group1,
            'group2', group2,
            'group3', group3,
            'is_franchise', is_franchise,
            -- 조회 기록 메타데이터
            'view_metadata', jsonb_build_object(
                'view_count', view_count,          -- 조회 횟수
                'first_viewed_at', first_viewed_at, -- 최초 조회 시간
                'last_viewed_at', last_viewed_at,   -- 최근 조회 시간
                'ref_liked_id', ref_liked_id       -- 참조 ID
            )
        )
    ), '[]'::jsonb)
    INTO result
    FROM recent_view_places;

    RETURN result;

EXCEPTION
    -- 함수 실행 중 발생할 수 있는 모든 예외를 처리
    -- 예: 테이블 접근 권한 오류, 데이터 타입 오류, 네트워크 오류 등
    WHEN others THEN
        RETURN jsonb_build_object('error', '최근 조회 음식점 목록 조회 중 오류: ' || SQLERRM);
END;
$$;

-- 함수 실행 권한 부여 (인증된 사용자들에게만)
-- 개인 조회 기록이므로 로그인한 사용자만 접근 가능
GRANT EXECUTE ON FUNCTION public.v1_get_my_recent_view_places(integer, integer) TO authenticated;

CREATE OR REPLACE FUNCTION public.v1_get_place_by_id_with_set_recent_view(
    p_business_id TEXT -- 조회할 장소 ID
)

RETURNS jsonb -- 단일 JSONB 객체 반환
LANGUAGE plpgsql
SECURITY DEFINER -- INVOKER에서 DEFINER로 변경 (통계 갱신을 위해)
AS $$
DECLARE
    v_user_id uuid := auth.uid(); -- 현재 인증된 사용자 ID
    place_result jsonb;           -- 음식점 조회 결과
    max_recent_count integer := 200; -- 개인 최근 기록 최대 개수
BEGIN
    -- ID로 장소 조회
    SELECT jsonb_build_object(
        'id', p.id,
        'name', p.name,
        'group1', p.group1,
        'group2', p.group2,
        'group3', p.group3,
        'road', p.road,
        'category', p.category,
        'category_code', p.category_code,
        'category_code_list', p.category_code_list,
        'road_address', p.road_address,
        'payment_info', p.payment_info,
        'conveniences', p.conveniences,
        'address', p.address,
        'phone', p.phone,
        'visitor_reviews_total', p.visitor_reviews_total,
        'visitor_reviews_score', p.visitor_reviews_score,
        'x', p.x,
        'y', p.y,
        'homepage', p.homepage,
        'keyword_list', p.keyword_list,
        'images', p.images,
        'static_map_url', p.static_map_url,
        'themes', p.themes,
        'visitor_review_medias_total', p.visitor_review_medias_total,
        'visitor_review_stats', p.visitor_review_stats,
        'menus', p.menus,
        'street_panorama', p.street_panorama,
        'place_images', p.place_images,
        'updated_at', p.updated_at,
        'created_at', p.created_at,
        'interaction', public.v1_common_place_interaction(p.id)
    )
    INTO place_result
    FROM public.tbl_place p
    WHERE p.id = p_business_id;

    -- 음식점이 존재하지 않으면 null 반환
    IF place_result IS NULL THEN
        RETURN NULL;
    END IF;

    -- === 전체 사용자 대상 조회 통계 갱신 (로그인 여부와 무관) ===
    BEGIN
        -- v1_set_recent_places 함수 호출하여 전체 통계 갱신
        PERFORM public.v1_set_recent_places(p_business_id);
    EXCEPTION
        -- 통계 갱신 실패해도 음식점 정보는 반환
        WHEN others THEN
            -- 선택적 로깅
            -- RAISE LOG 'v1_get_place_by_id 전체 통계 갱신 오류: %', SQLERRM;
            NULL; -- 오류 무시
    END;

    -- === 로그인된 사용자 개인 최근 조회 기록 저장 ===
    IF v_user_id IS NOT NULL THEN
        BEGIN
            -- 개인 최근 조회 기록 저장/갱신
            INSERT INTO public.tbl_recent_view (user_id, content_id, content_type, count)
            VALUES (v_user_id, p_business_id, 'place', 1)
            ON CONFLICT (user_id, content_id, content_type)
            DO UPDATE SET 
                count = tbl_recent_view.count + 1,                -- 조회 횟수 증가
                updated_at = timezone('utc'::text, now());        -- 최근 조회 시간 갱신

            -- 개인 최근 조회 기록이 200개를 초과하면 오래된 것부터 삭제
            WITH old_records AS (
                SELECT id
                FROM public.tbl_recent_view
                WHERE user_id = v_user_id
                  AND content_type = 'place'
                ORDER BY updated_at DESC
                OFFSET max_recent_count
            )
            DELETE FROM public.tbl_recent_view
            WHERE id IN (SELECT id FROM old_records);
        EXCEPTION
            -- 개인 기록 저장 실패해도 음식점 정보는 반환
            WHEN others THEN
                -- 선택적 로깅
                -- RAISE LOG 'v1_get_place_by_id 개인 기록 저장 오류: %', SQLERRM;
                NULL; -- 오류 무시
        END;
    END IF;

    -- 음식점 정보 반환
    RETURN place_result;

EXCEPTION
    -- 메인 쿼리 실패 시에만 오류 반환
    WHEN others THEN
        RETURN jsonb_build_object('error', '음식점 조회 중 오류: ' || SQLERRM);
END;
$$;
-- 함수 실행 권한 부여
GRANT EXECUTE ON FUNCTION public.v1_set_recent_places(text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.v1_get_recent_places(text, text, text, jsonb, integer, integer) TO anon, authenticated;
-- 음식점 조회 통계를 갱신하는 함수 (로그인 여부와 무관)
-- 1시간 단위로 구분하여 조회수를 집계하고, 새로운 시간대가 되면 새 레코드를 생성합니다.
CREATE OR REPLACE FUNCTION public.v1_set_recent_places(
    p_place_id text,              -- 조회된 음식점 ID
    p_session_id text DEFAULT NULL -- 세션 ID (중복 조회 방지용, 선택사항)
)
RETURNS jsonb -- 처리 결과: {"success": true, "view_count": N, "hour_bucket": "..."} 또는 {"error": "..."}
LANGUAGE plpgsql
SECURITY DEFINER -- 함수 소유자의 권한으로 실행
AS $$
DECLARE
    current_hour_bucket timestamptz;  -- 현재 시간의 시간 버킷 (분/초 제거)
    updated_view_count integer;       -- 갱신된 조회수
BEGIN
    -- 입력값 유효성 검사
    IF p_place_id IS NULL OR p_place_id = '' THEN
        RETURN jsonb_build_object('error', 'place_id는 필수값입니다.');
    END IF;

    -- 현재 시간을 1시간 단위로 버킷화 (분, 초, 밀리초 제거)
    -- 예: 2025-05-24 09:35:42 -> 2025-05-24 09:00:00
    current_hour_bucket := date_trunc('hour', timezone('utc'::text, now()));

    -- UPSERT를 사용한 조회 통계 갱신
    -- 같은 시간 버킷 내에서는 기존 레코드를 갱신하고, 새로운 시간대면 새 레코드 생성
    INSERT INTO public.tbl_place_view_stats (place_id, hour_bucket, view_count, unique_sessions)
    VALUES (p_place_id, current_hour_bucket, 1, 1)
    ON CONFLICT (place_id, hour_bucket)
    DO UPDATE SET 
        view_count = tbl_place_view_stats.view_count + 1,           -- 조회수 1 증가
        unique_sessions = CASE 
            -- 세션 ID가 제공된 경우 중복 세션 체크 로직 (추후 구현 가능)
            WHEN p_session_id IS NOT NULL THEN tbl_place_view_stats.unique_sessions 
            ELSE tbl_place_view_stats.unique_sessions + 1           -- 임시: 모든 조회를 고유 세션으로 카운트
        END,
        last_viewed_at = timezone('utc'::text, now()),              -- 마지막 조회 시간 갱신
        updated_at = timezone('utc'::text, now())                   -- 레코드 갱신 시간
    RETURNING view_count INTO updated_view_count;

    -- 성공 응답 반환
    RETURN jsonb_build_object(
        'success', true,
        'view_count', updated_view_count,
        'hour_bucket', current_hour_bucket,
        'message', '조회 통계가 갱신되었습니다.'
    );

EXCEPTION
    -- 함수 실행 중 발생할 수 있는 모든 예외를 처리
    WHEN others THEN
        RETURN jsonb_build_object('error', '조회 통계 갱신 중 오류: ' || SQLERRM);
END;
$$;

-- 인기 음식점 목록을 조회하는 함수 (다양한 알고리즘 지원)
-- 시간대별 조회 통계를 기반으로 트렌딩, 인기도, 추천 알고리즘을 적용하여 음식점을 반환합니다.
CREATE OR REPLACE FUNCTION public.v1_get_recent_places(
    p_algorithm text DEFAULT 'trending',     -- 정렬 알고리즘 ('trending', 'popular', 'hot', 'recent')
    p_time_window text DEFAULT '24h',        -- 시간 윈도우 ('1h', '6h', '24h', '7d', '30d')
    p_category text DEFAULT NULL,            -- 음식점 카테고리 필터 (선택사항)
    p_location_bounds jsonb DEFAULT NULL,    -- 지역 경계 필터 (선택사항) {"north": 37.123, "south": 37.100, "east": 127.123, "west": 127.100}
    p_limit integer DEFAULT 20,              -- 반환할 음식점 수
    p_offset integer DEFAULT 0               -- 페이지네이션 오프셋
)
RETURNS jsonb -- 인기 음식점 목록을 JSON 배열로 반환
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
BEGIN
    /*
    === 지원 예정인 알고리즘들 ===
    
    1. 'trending' (트렌딩): 
       - 최근 시간대 대비 조회수 증가율 기반 정렬
       - 급상승하는 음식점을 우선 표시
       - 계산: (최근 6시간 조회수 / 이전 6시간 조회수) * 가중치
       - 새로운 핫플레이스 발견에 효과적
    
    2. 'popular' (인기): 
       - 지정된 시간 윈도우 내 총 조회수 기준 정렬
       - 꾸준히 인기 있는 음식점을 우선 표시
       - 계산: SUM(view_count) WHERE hour_bucket >= (now() - time_window)
       - 안정적인 인기 음식점 추천에 효과적
    
    3. 'hot' (실시간 핫): 
       - 최근 1-3시간 내 조회수 집중도 기반 정렬
       - 지금 당장 뜨고 있는 음식점을 우선 표시
       - 계산: 최근 3시간 조회수 + 시간 가중치 (최근일수록 높은 가중치)
       - SNS 바이럴, 방송 출연 등 실시간 이슈 반영
    
    4. 'recent' (최근 조회): 
       - 최근 조회된 순서대로 정렬
       - 계산: ORDER BY last_viewed_at DESC
       - 단순 최신순 정렬
    
    5. 'weighted_score' (가중 점수): 
       - 다양한 요소를 종합한 점수 기반 정렬
       - 조회수 + 리뷰 점수 + 시간 가중치 + 지역 인기도
       - 계산: (view_count * 0.4) + (review_score * 0.3) + (time_weight * 0.2) + (location_weight * 0.1)
       - 가장 균형잡힌 추천 결과 제공
    
    6. 'discovery' (발굴): 
       - 조회수는 적지만 증가 추세인 숨은 맛집 발굴
       - 계산: 낮은 총 조회수 + 높은 증가율 + 좋은 리뷰 점수
       - 새로운 맛집 발견에 특화
    
    === 시간 윈도우 옵션 ===
    - '1h': 최근 1시간
    - '6h': 최근 6시간  
    - '24h': 최근 24시간 (기본값)
    - '7d': 최근 7일
    - '30d': 최근 30일
    
    === 필터링 옵션 ===
    - p_category: 음식점 카테고리별 필터링 ('한식', '중식', '일식', '양식' 등)
    - p_location_bounds: 지정된 지역 범위 내 음식점만 필터링
    - 향후 추가 가능: 가격대, 평점, 거리 등
    
    === 성능 최적화 고려사항 ===
    - 시간 윈도우가 클수록 더 많은 데이터 스캔 필요
    - 지역 필터링 시 공간 인덱스 활용
    - 캐싱 전략: 인기 알고리즘 결과는 5-15분 캐싱 고려
    - 배치 작업: 복잡한 점수 계산은 주기적 배치로 미리 계산
    
    === 개인화 확장 가능성 ===
    - 사용자 선호도 기반 가중치 조정
    - 과거 조회 이력 기반 유사 음식점 추천
    - 시간대별 개인 패턴 분석 (점심/저녁 선호도)
    - 동반자 수 기반 음식점 추천 (혼밥/단체)
    */
    
    -- 현재는 빈 배열 반환 (추후 각 알고리즘별 구현 예정)
    RETURN '[]'::jsonb;
    
EXCEPTION
    WHEN others THEN
        RETURN jsonb_build_object('error', '인기 음식점 조회 중 오류: ' || SQLERRM);
END;
$$;

-- 기존 v1_get_place_by_id 함수에 조회 통계 갱신 기능 추가
CREATE OR REPLACE FUNCTION public.v1_get_place_by_id(
    p_business_id TEXT -- 조회할 장소 ID
)
RETURNS jsonb -- 단일 JSONB 객체 반환
LANGUAGE plpgsql
SECURITY DEFINER -- INVOKER에서 DEFINER로 변경 (통계 갱신을 위해)
AS $$
DECLARE
    v_user_id uuid := auth.uid(); -- 현재 인증된 사용자 ID
    place_result jsonb;           -- 음식점 조회 결과
    max_recent_count integer := 200; -- 개인 최근 기록 최대 개수
BEGIN
    -- ID로 장소 조회
    SELECT jsonb_build_object(
        'id', p.id,
        'name', p.name,
        'group1', p.group1,
        'group2', p.group2,
        'group3', p.group3,
        'road', p.road,
        'category', p.category,
        'category_code', p.category_code,
        'category_code_list', p.category_code_list,
        'road_address', p.road_address,
        'payment_info', p.payment_info,
        'conveniences', p.conveniences,
        'address', p.address,
        'phone', p.phone,
        'visitor_reviews_total', p.visitor_reviews_total,
        'visitor_reviews_score', p.visitor_reviews_score,
        'x', p.x,
        'y', p.y,
        'homepage', p.homepage,
        'keyword_list', p.keyword_list,
        'images', p.images,
        'static_map_url', p.static_map_url,
        'themes', p.themes,
        'visitor_review_medias_total', p.visitor_review_medias_total,
        'visitor_review_stats', p.visitor_review_stats,
        'menus', p.menus,
        'street_panorama', p.street_panorama,
        'place_images', p.place_images,
        'updated_at', p.updated_at,
        'created_at', p.created_at,
        'interaction', public.v1_common_place_interaction(p.id)
    )
    INTO place_result
    FROM public.tbl_place p
    WHERE p.id = p_business_id;

    -- 음식점이 존재하지 않으면 null 반환
    IF place_result IS NULL THEN
        RETURN NULL;
    END IF;

    -- === 전체 사용자 대상 조회 통계 갱신 (로그인 여부와 무관) ===
    BEGIN
        -- v1_set_recent_places 함수 호출하여 전체 통계 갱신
        PERFORM public.v1_set_recent_places(p_business_id);
    EXCEPTION
        -- 통계 갱신 실패해도 음식점 정보는 반환
        WHEN others THEN
            -- 선택적 로깅
            -- RAISE LOG 'v1_get_place_by_id 전체 통계 갱신 오류: %', SQLERRM;
            NULL; -- 오류 무시
    END;

    -- === 로그인된 사용자 개인 최근 조회 기록 저장 ===
    IF v_user_id IS NOT NULL THEN
        BEGIN
            -- 개인 최근 조회 기록 저장/갱신
            INSERT INTO public.tbl_recent_view (user_id, content_id, content_type, count)
            VALUES (v_user_id, p_business_id, 'place', 1)
            ON CONFLICT (user_id, content_id, content_type)
            DO UPDATE SET 
                count = tbl_recent_view.count + 1,                -- 조회 횟수 증가
                updated_at = timezone('utc'::text, now());        -- 최근 조회 시간 갱신

            -- 개인 최근 조회 기록이 200개를 초과하면 오래된 것부터 삭제
            WITH old_records AS (
                SELECT id
                FROM public.tbl_recent_view
                WHERE user_id = v_user_id
                  AND content_type = 'place'
                ORDER BY updated_at DESC
                OFFSET max_recent_count
            )
            DELETE FROM public.tbl_recent_view
            WHERE id IN (SELECT id FROM old_records);
        EXCEPTION
            -- 개인 기록 저장 실패해도 음식점 정보는 반환
            WHEN others THEN
                -- 선택적 로깅
                -- RAISE LOG 'v1_get_place_by_id 개인 기록 저장 오류: %', SQLERRM;
                NULL; -- 오류 무시
        END;
    END IF;

    -- 음식점 정보 반환
    RETURN place_result;

EXCEPTION
    -- 메인 쿼리 실패 시에만 오류 반환
    WHEN others THEN
        RETURN jsonb_build_object('error', '음식점 조회 중 오류: ' || SQLERRM);
END;
$$;
-- 성능 최적화를 위한 인덱스들
-- 음식점별, 시간대별 빠른 조회를 위한 복합 인덱스
CREATE UNIQUE INDEX IF NOT EXISTS uk_tbl_place_view_stats_place_hour 
ON public.tbl_place_view_stats (place_id, hour_bucket);

-- 시간대별 전체 통계 조회를 위한 인덱스
CREATE INDEX IF NOT EXISTS idx_tbl_place_view_stats_hour_bucket 
ON public.tbl_place_view_stats (hour_bucket DESC);

-- 음식점별 전체 통계 조회를 위한 인덱스
CREATE INDEX IF NOT EXISTS idx_tbl_place_view_stats_place_updated 
ON public.tbl_place_view_stats (place_id, updated_at DESC);

-- 인기 음식점 조회를 위한 조회수 기준 인덱스
CREATE INDEX IF NOT EXISTS idx_tbl_place_view_stats_view_count 
ON public.tbl_place_view_stats (view_count DESC, updated_at DESC);
-- 음식점별 조회 통계를 시간대별로 저장하는 테이블
-- 로그인 여부와 관계없이 모든 사용자의 조회 패턴을 추적하여 인기도를 측정합니다.
CREATE TABLE IF NOT EXISTS public.tbl_place_view_stats (
    id uuid PRIMARY KEY NOT NULL DEFAULT (uuid_generate_v4()),
    place_id text NOT NULL,                                   -- 조회된 음식점 ID
    hour_bucket timestamptz NOT NULL,                         -- 시간 버킷 (1시간 단위, 예: 2025-05-24 09:00:00)
    view_count integer NOT NULL DEFAULT 1,                    -- 해당 시간대 조회 횟수
    unique_sessions integer NOT NULL DEFAULT 1,               -- 고유 세션 수 (중복 제거용)
    last_viewed_at timestamptz NOT NULL DEFAULT (timezone('utc'::text, now())), -- 마지막 조회 시간
    created_at timestamptz NOT NULL DEFAULT (timezone('utc'::text, now())),     -- 레코드 생성 시간
    updated_at timestamptz NOT NULL DEFAULT (timezone('utc'::text, now()))      -- 레코드 갱신 시간
);
-- 성능 최적화를 위한 인덱스 생성
-- 사용자별, 컨텐츠 타입별, 최근 조회 순서로 빠른 검색을 위한 복합 인덱스
CREATE INDEX IF NOT EXISTS idx_tbl_recent_view_user_content_updated 
ON public.tbl_recent_view (user_id, content_type, updated_at DESC);

-- UPSERT 작업을 위한 유니크 제약조건 (중복 방지 및 갱신 기준)
CREATE UNIQUE INDEX IF NOT EXISTS uk_tbl_recent_view_user_content 
ON public.tbl_recent_view (user_id, content_id, content_type);

-- 빠른 정렬을 위한 updated_at 인덱스
CREATE INDEX IF NOT EXISTS idx_tbl_recent_view_updated_at 
ON public.tbl_recent_view (updated_at DESC);
GRANT EXECUTE ON FUNCTION public.v1_get_my_liked_places(integer,integer) TO authenticated
-- 내가 저장한 음식점 목록

-- 내가 좋아요 누른 음식점 목록

-- 내가 좋아요 누른 리뷰 목록

select * from tbl_place_review limit 100;


create or replace function v1_toggle_like(
    p_liked_id text,       -- 좋아요 대상 아이템의 ID (예: 리뷰 ID)
    p_liked_type text      -- 좋아요 대상 아이템의 타입 (예: 'place_review')
)
returns jsonb -- 결과를 JSONB 형태로 반환 ('liked': true/false 또는 'error': '메시지')
language plpgsql
security definer -- 함수 정의자의 권한으로 실행 (테이블 접근 등에 필요)
as $$
declare
    v_user_id uuid;        -- 인증된 사용자의 ID를 저장할 변수
    current_liked_status boolean; -- 현재 좋아요 상태를 저장할 변수
    new_liked_status boolean;     -- 새로 설정될 좋아요 상태
    result jsonb;        -- 반환할 JSONB 결과 객체
begin
    -- 인증 컨텍스트에서 현재 로그인된 사용자의 ID 가져오기
    v_user_id := auth.uid();

    -- 사용자가 인증(로그인)되었는지 확인
    if v_user_id is null then
        return jsonb_build_object('error', '로그인이 필요합니다.');
    end if;

    -- public.tbl_like 테이블에서 해당 사용자, 아이템, 타입에 대한 행을 찾고
    -- 현재 'liked' 상태를 가져옵니다. 행이 없으면 null이 반환됩니다.
    select liked
    into current_liked_status -- 조회 결과를 current_liked_status 변수에 저장
    from public.tbl_like
    where user_id = v_user_id
    and liked_id = p_liked_id
    and liked_type = p_liked_type;

    if current_liked_status is null then
        -- 해당 좋아요 기록이 없는 경우: 새로운 행 삽입 (좋아요 상태: true)
        new_liked_status := true; -- 처음 좋아요를 누르는 것이므로 true

        -- [TODO] 좋아요가 존재하지 않는 경우, 새로운 좋아요 추가
        -- 선택적으로: 좋아요 대상 항목(리뷰)이 실제로 존재하는지 확인 후 삽입 가능
        -- if not exists(select 1 from public.tbl_place_review where id = p_liked_id) then
        --    -- 리뷰가 존재하지 않으면 오류 반환
        --    return jsonb_build_object('error', '좋아요 대상 리뷰를 찾을 수 없습니다.');
        -- end if;

        insert into public.tbl_like (user_id, liked_id, liked_type, liked)
        values (v_user_id, p_liked_id, p_liked_type, new_liked_status);

        result := jsonb_build_object('liked', new_liked_status);

    else
        -- 이미 좋아요 기록이 있는 경우: 'liked' 상태를 반전시킵니다.
        new_liked_status := not current_liked_status; -- 현재 상태의 반대 값으로 설정

        update public.tbl_like
        set liked = new_liked_status -- 'liked' 컬럼 값을 새로운 상태로 업데이트
        where user_id = v_user_id
        and liked_id = p_liked_id
        and liked_type = p_liked_type;

        result := jsonb_build_object('liked', new_liked_status);
    end if;

    -- 최종 결과 (변경된 좋아요 상태) 반환
    return result;

exception
    -- 함수 실행 중 예기치 않은 오류가 발생했을 때 처리하는 블록
    when others then
        -- 개발/디버깅 목적으로 실제 오류(SQLERRM)를 Supabase 로그 등에 기록하는 것이 좋습니다.
        -- 예: raise log 'toggle_like 함수 오류: %', SQLERRM;
        -- 클라이언트에는 민감한 정보 노출을 피하기 위해 일반적인 오류 메시지를 반환합니다.
        return jsonb_build_object('error', '좋아요 처리 중 예상치 못한 오류가 발생했습니다: ' || SQLERRM);
end;
$$;