SELECT 'ANALYZE ' || relname || ';' as analyze_commands
FROM pg_class c
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'public' AND c.relkind = 'r';
SELECT 
    t.relname AS table_name,
    COALESCE(s.n_live_tup, 0) AS estimated_rows,
    pg_size_pretty(pg_total_relation_size(t.oid)) AS total_size,
    pg_size_pretty(pg_relation_size(t.oid)) AS data_size,
    pg_size_pretty(pg_total_relation_size(t.oid) - pg_relation_size(t.oid)) AS index_size
FROM 
    pg_class t
    JOIN pg_namespace n ON t.relnamespace = n.oid
    LEFT JOIN pg_stat_user_tables s ON s.relid = t.oid
WHERE 
    n.nspname = 'public'
    AND t.relkind = 'r'
ORDER BY 
    pg_total_relation_size(t.oid) DESC;

-- 946204

select count(*) from tbl_place_review;


select group1,count(*) from tbl_place 
group by group1
having count(*) > 400 and group1 is not null
ORDER BY group1 asc;

select address,group1,group2,group3 from tbl_place 
where group1 is not null limit 1;

select * from v1_list_places_basic_sorted() limit 10;

GRANT SELECT ON public.tbl_place TO anon;
select * from public.v1_list_places_basic_sorted() limit 10;
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
                -- 반환 필드를 tbl_place 컬럼에 맞게 수정
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
                public.tbl_place p -- 변경: v_place_with_images -> tbl_place
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
            RAISE LOG '열 정의 오류: tbl_place 뷰에 %라는 열이 없습니다', v_safe_order_by;
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

-- DROP FUNCTION IF EXISTS public.v1_list_places_basic_sorted(integer, integer);
-- DROP FUNCTION IF EXISTS public.v1_list_places_basic_sorted(text, text, integer, integer);


-- drop function if exists public.v1_list_places_basic_sorted;
CREATE OR REPLACE FUNCTION public.v1_list_places_basic_sorted(
    p_limit INT DEFAULT 10,
    p_offset INT DEFAULT 0
)
RETURNS TABLE (place_data jsonb)
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
AS $$
DECLARE
    v_franchise_filter TEXT := 'p.name !~ ''(롯데백화점 김포공항점|현대아울렛 가산점|투썸플레이스|공차|메가엠지씨|KFC|던킨 |폴 바셋|배스킨라빈스|뚜레쥬르|교촌치킨|맥도날드|MGC|맘스터치|이디야|푸라닭|카페블루하우스|하은이네|더벤티|엔제리너스|DT점|빽다방|컴포즈|스타벅스|에이바우트|도시락|롯데리아|버거킹|BBQ|파리바게뜨|네네치킨)''';
    v_where_clause TEXT := '';
BEGIN
    -- 프랜차이즈 필터만 적용
    v_where_clause := format('WHERE %s', v_franchise_filter);

    -- 동적 쿼리 실행
    BEGIN
        RETURN QUERY EXECUTE format(
            'SELECT
                jsonb_build_object(
                    ''id'', p.id,
                    ''name'', p.name,
                    ''group1'', p.group1,
                    ''group2'', p.group2,
                    ''group3'', p.group3,
                    ''road'', p.road,
                    ''category'', p.category,
                    ''category_code'', p.category_code,
                    ''category_code_list'', p.category_code_list,
                    ''road_address'', p.road_address,
                    ''payment_info'', p.payment_info,
                    ''conveniences'', p.conveniences,
                    ''address'', p.address,
                    ''phone'', p.phone,
                    ''visitor_reviews_total'', p.visitor_reviews_total,
                    ''visitor_reviews_score'', p.visitor_reviews_score,
                    ''x'', p.x,
                    ''y'', p.y,
                    ''homepage'', p.homepage,
                    ''keyword_list'', p.keyword_list,
                    ''images'', p.images,
                    ''static_map_url'', p.static_map_url,
                    ''themes'', p.themes,
                    ''visitor_review_medias_total'', p.visitor_review_medias_total,
                    ''visitor_review_stats'', p.visitor_review_stats,
                    ''menus'', p.menus,
                    ''street_panorama'', p.street_panorama,
                    ''place_images'', p.place_images,
                    ''updated_at'', p.updated_at,
                    ''created_at'', p.created_at,
                    ''interaction'',public.v1_common_place_interaction(p.id)
                )
            FROM
                public.tbl_place p
            %s
            ORDER BY
                p.updated_at DESC,
                p.visitor_reviews_total DESC,
                p.name DESC
            LIMIT $1
            OFFSET $2;',
            v_where_clause
        )
        USING p_limit, p_offset;
    EXCEPTION
        WHEN others THEN
            RAISE LOG '쿼리 실행 오류: %', SQLERRM;
            RETURN QUERY SELECT jsonb_build_object(
                'error', '쿼리 실행 오류',
                'message', SQLERRM,
                'hint', '시스템 관리자에게 문의하세요'
            );
    END;
END;
$$


select * from tbl_place
where name like '%제로%' and group1='경기' and group2='양주시'

select * from tbl_place
where name ='방이옥 군자역점';



-- 특정 비즈니스 ID에 대한 리뷰 조회 최적화 쿼리
SELECT 
  a.visited, 
  a.business_id,
  a.business_name, 
  b.name, 
  a.body 
FROM 
  tbl_place_review a
  left join tbl_place b on a.business_id = b.id
WHERE 
  a.business_id = '11871325'
ORDER BY 
  a.id DESC
LIMIT 100; -- 필요한 결과만 제한하여 성능 향상

select * from tbl_place where id='1805394944'


CREATE INDEX idx_place_review_business_id ON public.tbl_place_review (business_id);