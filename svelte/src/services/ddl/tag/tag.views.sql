-- 태그 사용 통계를 위한 뷰 생성
CREATE OR REPLACE VIEW public.v_tag_usage_stats AS
SELECT
    tm.id AS tag_id,
    tm.tag_name,
    tm.tag_group,
    tm.tag_group_ko,
    tm.category,
    tm.level,
    COUNT(pt.id) AS usage_count
FROM
    public.tbl_tag_master_for_place tm
LEFT JOIN
    public.tbl_place_tag pt ON tm.id = pt.tag_id
WHERE
    tm.is_active = true
GROUP BY
    tm.id, tm.tag_name, tm.tag_group, tm.tag_group_ko, tm.category, tm.level
ORDER BY
    usage_count DESC, tm.tag_group, tm.tag_order;

-- 장소별 태그 통계 조회 뷰
CREATE OR REPLACE VIEW public.v_place_tag_stats AS
SELECT
    pt.business_id,
    tm.tag_group,
    tm.category,
    COUNT(pt.id) AS tag_count
FROM
    public.tbl_place_tag pt
JOIN
    public.tbl_tag_master_for_place tm ON pt.tag_id = tm.id
GROUP BY
    pt.business_id, tm.tag_group, tm.category;

-- 장소별 인기 태그 조회 함수
CREATE OR REPLACE FUNCTION public.v1_get_popular_tags_for_place(
    p_business_id text,
    p_limit integer DEFAULT 10
)
RETURNS TABLE (
    tag_id uuid,
    tag_name text,
    tag_group text,
    tag_group_ko text,
    category text,
    tag_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        tm.id AS tag_id,
        tm.tag_name,
        tm.tag_group,
        tm.tag_group_ko,
        tm.category,
        COUNT(pt.id) AS tag_count
    FROM
        public.tbl_place_tag pt
    JOIN
        public.tbl_tag_master_for_place tm ON pt.tag_id = tm.id
    WHERE
        pt.business_id = p_business_id
    GROUP BY
        tm.id, tm.tag_name, tm.tag_group, tm.tag_group_ko, tm.category
    ORDER BY
        tag_count DESC, tm.tag_name
    LIMIT p_limit;
END;
$$;

-- 카테고리별 인기 태그 조회 함수
CREATE OR REPLACE FUNCTION public.v1_get_popular_tags_by_category(
    p_category text,
    p_limit integer DEFAULT 20
)
RETURNS TABLE (
    tag_id uuid,
    tag_name text,
    tag_group text,
    tag_group_ko text,
    usage_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        tm.id AS tag_id,
        tm.tag_name,
        tm.tag_group,
        tm.tag_group_ko,
        COUNT(pt.id) AS usage_count
    FROM
        public.tbl_tag_master_for_place tm
    LEFT JOIN
        public.tbl_place_tag pt ON tm.id = pt.tag_id
    WHERE
        tm.is_active = true AND
        tm.category = p_category
    GROUP BY
        tm.id, tm.tag_name, tm.tag_group, tm.tag_group_ko
    ORDER BY
        usage_count DESC, tm.tag_name
    LIMIT p_limit;
END;
$$; 