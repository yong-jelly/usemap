-- select * from public.v1_list_places_basic_sorted('visitor_review_score', 'DESC', 10, 0);
-- select * from v1_common_view_place_with_images order by visitor_review_score DESC nulls last, visitor_review_count DESC NULLS LAST limit 10;
-- select * from tbl_place_review_voted_summary where business_id='1471070608'
-- select * from tbl_place_review_voted where business_id='1471070608'
/*
select * from v1_common_view_place_with_images p
ORDER BY  "p"."visitor_review_score" DESC nulls last,
          "p"."visitor_review_count" DESC nulls last limit 10 offset 0;
*/
-- SELECT * FROM public.v1_list_places_basic_sorted() limit 10;;
-- SELECT * FROM public.v1_common_view_place_with_images() limit 10;;

GRANT SELECT ON public.v1_common_view_place_with_images TO authenticated, anon;


-- GRANT SELECT ON public.v1_common_view_place_with_images TO authenticated, anon;

drop view if exists public.v1_common_view_place_with_images;
-- CREATE OR REPLACE FUNCTION public.v1_list_places_basic_sorted(
CREATE OR REPLACE FUNCTION public.v1_common_view_place_with_images AS
SELECT
  p.*,
  split_part(p.address,' ',1) AS group1,
  split_part(p.address,' ',2) AS group2,
  split_part(p.address,' ',3) AS group3

FROM tbl_place AS p

-- CREATE INDEX idx_place_visitor_reviews_score ON public.tbl_place (visitor_reviews_score DESC NULLS LAST);
-- CREATE INDEX idx_place_visitor_reviews_total ON public.tbl_place (visitor_reviews_total DESC NULLS LAST);
-- DROP INDEX IF EXISTS idx_place_visitor_reviews_score;
-- DROP INDEX IF EXISTS idx_place_visitor_reviews_total;
--------------------------------------------------------------------------
-- RPC 함수 1: 기본 컬럼 기준 정렬 (v1_common_view_place_with_images 기반으로 수정됨)
--------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.v1_list_places_basic_sorted(
    p_order_by TEXT DEFAULT 'visitor_reviews_score', -- 기본 정렬 컬럼 변경
    p_order_dir TEXT DEFAULT 'DESC',
    p_limit INT DEFAULT 10,
    p_offset INT DEFAULT 0
)
RETURNS TABLE (place_data jsonb)
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
AS $$
DECLARE
    -- 정렬 가능한 컬럼 목록을 새 뷰에 맞게 수정
    v_valid_order_by TEXT[] := ARRAY[
        'name', 'category', 'visitor_reviews_total',
        'visitor_reviews_score', 'updated_at' -- blog_cafe_review_count 제거
    ];
    v_safe_order_by TEXT;
    v_safe_order_dir TEXT;
BEGIN
    -- SQL 인젝션 방지: 허용된 컬럼명인지 확인
    IF NOT p_order_by = ANY(v_valid_order_by) THEN
        v_safe_order_by := 'visitor_reviews_score'; -- 기본값으로 대체
    ELSE
        v_safe_order_by := p_order_by;
    END IF;

    -- SQL 인젝션 방지: 정렬 방향 확인
    IF UPPER(p_order_dir) = 'ASC' THEN
        v_safe_order_dir := 'ASC';
    ELSE
        v_safe_order_dir := 'DESC'; -- 기본값 DESC
    END IF;

    -- 동적 쿼리 실행
    BEGIN
        RETURN QUERY EXECUTE format(
            'SELECT
                -- 반환 필드를 v1_common_view_place_with_images 컬럼에 맞게 수정
                jsonb_build_object(
                    ''id'', p.id,
                    ''name'', p.name, -- normalized_name -> name
                    ''group1'', p.group1,
                    ''group2'', p.group2,
                    ''group3'', p.group3,
                    ''road'', p.road,
                    ''category'', p.category,
                    ''category_code'', p.category_code,
                    ''category_code_list'', p.category_code_list,
                    ''road_address'', p.road_address,
                    ''payment_info'', p.payment_info,
                    ''conveniences'', p.conveniences, -- convenience -> conveniences
                    ''address'', p.address, -- common_address -> address
                    ''phone'', p.phone,
                    ''visitor_reviews_total'', p.visitor_reviews_total, -- visitor_review_count -> visitor_reviews_total
                    ''visitor_reviews_score'', p.visitor_reviews_score,
                    ''x'', p.x,
                    ''y'', p.y,
                    ''homepage'', p.homepage, -- website -> homepage
                    ''keyword_list'', p.keyword_list,
                    ''images'', p.images, -- media -> images
                    ''static_map_url'', p.static_map_url,
                    ''themes'', p.themes,
                    ''visitor_review_medias_total'', p.visitor_review_medias_total,
                    ''visitor_review_stats'', p.visitor_review_stats,
                    ''menus'', p.menus,
                    ''street_panorama'', p.street_panorama,
                    ''place_images'', p.place_images, -- voted_summary 등 제거, place_images 추가
                    ''updated_at'', p.updated_at,
                    ''created_at'', p.created_at,
                    ''interaction'',public.v1_common_place_interaction(p.id)
                )
            FROM
                public.v1_common_view_place_with_images p -- 변경: v_place_with_images -> v1_common_view_place_with_images
            ORDER BY
                %I %s NULLS LAST, -- 안전하게 포맷팅된 정렬 기준 적용
                p.visitor_reviews_total DESC NULLS LAST -- 2차 정렬 기준 변경
                -- 3차 정렬 기준 제거
            LIMIT $1
            OFFSET $2;',
            v_safe_order_by,   -- %I: Identifier (컬럼명 등)
            v_safe_order_dir -- %s: Simple string (ASC/DESC)
        )
        USING p_limit, p_offset; -- USING 절로 파라미터 전달
    EXCEPTION
        WHEN undefined_column THEN
            RAISE LOG '열 정의 오류: v1_common_view_place_with_images 뷰에 %라는 열이 없습니다', v_safe_order_by;
            RETURN QUERY SELECT jsonb_build_object(
                'error', '정렬 열 정의 오류',
                'message', format('요청한 정렬 열 "%s"이(가) 존재하지 않습니다', v_safe_order_by),
                'hint', '유효한 정렬 열: ' || array_to_string(v_valid_order_by, ', ')
            );
        WHEN others THEN
            RAISE LOG '쿼리 실행 오류: %', SQLERRM;
            RETURN QUERY SELECT jsonb_build_object(
                'error', '쿼리 실행 오류',
                'message', SQLERRM,
                'hint', '시스템 관리자에게 문의하세요'
            );
    END;
END;
$$;

--------------------------------------------------------------------------
-- RPC 함수 2: 상호작용 카운트 기준 정렬
--------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.v1_list_places_by_interaction(
    p_sort_type TEXT, -- 정렬 기준 카운트 타입 ('likes', 'saves', 'comments', 'tags')
    p_order_dir TEXT DEFAULT 'DESC',
    p_limit INT DEFAULT 10,
    p_offset INT DEFAULT 0
)
RETURNS TABLE (place_data jsonb)
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
AS $$
DECLARE
    v_safe_order_dir TEXT;
    v_interaction_query TEXT;
BEGIN
    -- 정렬 방향 안전하게 처리
    IF UPPER(p_order_dir) = 'ASC' THEN
        v_safe_order_dir := 'ASC';
    ELSE
        v_safe_order_dir := 'DESC';
    END IF;

    -- p_sort_type에 따라 JOIN 및 집계 로직 분기
    CASE p_sort_type
        WHEN 'likes' THEN
            v_interaction_query := format(
                'SELECT
                    p.id,
                    COUNT(l.id) AS interaction_count
                FROM public.v1_common_view_place_with_images p
                LEFT JOIN public.tbl_like l ON p.id = l.liked_id AND l.liked_type = ''place'' AND l.liked = true
                GROUP BY p.id'
            );
        WHEN 'saves' THEN
            v_interaction_query := format(
                'SELECT
                    p.id,
                    COUNT(s.id) AS interaction_count
                FROM public.v1_common_view_place_with_images p
                LEFT JOIN public.tbl_save s ON p.id = s.saved_id AND s.saved_type = ''place'' AND s.saved = true
                GROUP BY p.id'
            );
        WHEN 'comments' THEN
            v_interaction_query := format(
                'SELECT
                    p.id,
                    COUNT(c.id) AS interaction_count
                FROM public.v1_common_view_place_with_images p
                LEFT JOIN public.tbl_comment_for_place c ON p.id = c.business_id AND c.is_active = true
                GROUP BY p.id'
            );
        WHEN 'tags' THEN
             v_interaction_query := format(
                'SELECT
                    p.id,
                    COUNT(pt.id) AS interaction_count
                FROM public.v1_common_view_place_with_images p
                LEFT JOIN public.tbl_place_tag pt ON p.id = pt.business_id
                GROUP BY p.id'
            );
        ELSE
            -- 유효하지 않은 타입이면 기본 정렬 (예: 리뷰 점수) 또는 에러 처리
             v_interaction_query := format(
                'SELECT id, visitor_review_score::integer AS interaction_count FROM public.v1_common_view_place_with_images'
             ); -- 예시: 점수 기준으로 대체
    END CASE;

    -- 최종 쿼리 실행 (JOIN과 상세 정보 조회를 결합)
    RETURN QUERY EXECUTE format(
        'WITH InteractionCounts AS (
            %s -- 위에서 생성된 카운트 계산 쿼리
        )
        SELECT
            jsonb_build_object(
                ''id'', p.id,
                ''normalized_name'', p.normalized_name,
                ''category'', p.category,
                ''road_address'', p.road_address,
                ''common_address'', p.common_address,
                ''group1'', p.group1,
                ''group2'', p.group2,
                ''visitor_review_count'', p.visitor_review_count,
                ''visitor_review_score'', p.visitor_review_score,
                ''blog_cafe_review_count'', p.blog_cafe_review_count,
                ''updated_at'', p.updated_at,
                ''convenience'', p.convenience,
                ''direction'', p.direction,
                ''website'', p.website,
                ''description'', p.description,
                ''url'', p.url,
                ''original_url'', p.original_url,
                ''media'', p.media,
                ''voted_summary_text'', p.voted_summary_text,
                ''voted_summary_code'', p.voted_summary_code,
                ''details'', public.v1_get_place_details(p.id), -- 상세 정보 추가
                ''analysis'', public.v1_get_place_analysis(p.id) -- 분석 정보 추가
        FROM
            public.v1_common_view_place_with_images p
        JOIN InteractionCounts ic ON p.id = ic.id
        ORDER BY
            ic.interaction_count %s NULLS LAST, -- 계산된 카운트로 정렬
            p.visitor_review_score DESC NULLS LAST -- 카운트 같을 시 2차 정렬
        LIMIT $1
        OFFSET $2;',
        v_interaction_query,
        v_safe_order_dir
    )
    USING p_limit, p_offset;

END;
$$;


--------------------------------------------------------------------------
-- RPC 함수 3: 특정 태그 카운트 기준 정렬
--------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.v1_list_places_by_tag_count(
    p_tag_slug TEXT, -- 기준으로 삼을 태그의 슬러그
    p_order_dir TEXT DEFAULT 'DESC',
    p_limit INT DEFAULT 10,
    p_offset INT DEFAULT 0
)
RETURNS TABLE (place_data jsonb)
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
AS $$
DECLARE
    v_safe_order_dir TEXT;
BEGIN
    -- 정렬 방향 안전하게 처리
    IF UPPER(p_order_dir) = 'ASC' THEN
        v_safe_order_dir := 'ASC';
    ELSE
        v_safe_order_dir := 'DESC';
    END IF;

    -- 쿼리 실행
    RETURN QUERY EXECUTE format(
        'WITH TagCounts AS (
            SELECT
                pt.business_id AS place_id,
                COUNT(pt.id) AS tag_count
            FROM public.tbl_place_tag pt
            JOIN public.tbl_tag_master_for_place tm ON pt.tag_id = tm.id
            WHERE tm.tag_name_slug = $1 -- 파라미터로 받은 태그 슬러그 사용
            GROUP BY pt.business_id
        )
        SELECT
            jsonb_build_object(
                ''id'', p.id,
                ''normalized_name'', p.normalized_name,
                ''category'', p.category,
                ''road_address'', p.road_address,
                ''common_address'', p.common_address,
                ''group1'', p.group1,
                ''group2'', p.group2,
                ''visitor_review_count'', p.visitor_review_count,
                ''visitor_review_score'', p.visitor_review_score,
                ''blog_cafe_review_count'', p.blog_cafe_review_count,
                ''updated_at'', p.updated_at,
                ''convenience'', p.convenience,
                ''direction'', p.direction,
                ''website'', p.website,
                ''description'', p.description,
                ''url'', p.url,
                ''original_url'', p.original_url,
                ''media'', p.media,
                ''voted_summary_text'', p.voted_summary_text,
                ''voted_summary_code'', p.voted_summary_code,
                ''details'', public.v1_get_place_details(p.id), -- 상세 정보 추가
                ''analysis'', public.v1_get_place_analysis(p.id) -- 분석 정보 추가
            )
        FROM
            public.v1_common_view_place_with_images p
        LEFT JOIN TagCounts tc ON p.id = tc.place_id -- LEFT JOIN으로 태그 없는 장소도 포함
        ORDER BY
            COALESCE(tc.tag_count, 0) %s NULLS LAST, -- 해당 태그 카운트로 정렬 (NULL은 0으로 취급)
            p.visitor_review_score DESC NULLS LAST -- 카운트 같을 시 2차 정렬
        LIMIT $2
        OFFSET $3;',
        v_safe_order_dir
    )
    USING p_tag_slug, p_limit, p_offset; -- USING 절로 파라미터 전달

END;
$$;

--------------------------------------------------------------------------
-- RPC 함수 4: 특정 ID로 장소 조회
--------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.v1_get_place_by_id(
    p_business_id TEXT -- 조회할 장소 ID
)
RETURNS jsonb -- 단일 JSONB 객체 반환
LANGUAGE plpgsql
STABLE
SECURITY INVOKER -- 호출자의 권한으로 실행
AS $$
BEGIN
    -- ID로 장소 조회
    RETURN (
        SELECT jsonb_build_object(
            'id', p.id,
            'name', p.name,
            'road', p.road,
            'category', p.category,
            'category_code', p.category_code,
            'category_code_list', p.category_code_list,
            'road_address', p.road_address,
            'payment_info', p.payment_info,
            'conveniences', p.conveniences,
            'address', p.address,
            'group1', p.group1,
            'group2', p.group2,
            'group3', p.group3,
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
        FROM public.tbl_place p
        WHERE p.id = p_business_id -- ID로 단일ge 행 조회
    );
END;
$$;

-- select * from v1_get_popularity_reviews();
--------------------------------------------------------------------------
-- 함수 실행 권한 부여
--------------------------------------------------------------------------
GRANT EXECUTE ON FUNCTION public.v1_list_places_basic_sorted(TEXT, TEXT, INT, INT) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.v1_list_places_by_interaction(TEXT, TEXT, INT, INT) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.v1_list_places_by_tag_count(TEXT, TEXT, INT, INT) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.v1_get_place_by_id(TEXT) TO authenticated, anon;
