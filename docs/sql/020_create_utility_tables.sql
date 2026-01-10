-- =====================================================
-- 020_create_utility_tables.sql
-- 캐싱, 검색 이력 및 공통 코드 테이블 정의
-- 
-- 실행 방법:
--   psql "postgresql://postgres.xyqpggpilgcdsawuvpzn:ZNDqDunnaydr0aFQ@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres" -f docs/sql/020_create_utility_tables.sql
-- =====================================================

-- 1. 버킷 데이터 저장 테이블 (tbl_bucket)
CREATE TABLE IF NOT EXISTS public.tbl_bucket (
    key character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    value character varying(1000),
    data character varying(5000),
    data_jsonb jsonb,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    CONSTRAINT pk_tbl_bucket PRIMARY KEY (key, name)
);

CREATE INDEX IF NOT EXISTS idx_tbl_bucket_key_name ON public.tbl_bucket USING btree (key, name);
CREATE INDEX IF NOT EXISTS idx_tbl_bucket_data_jsonb ON public.tbl_bucket USING gin (data_jsonb);

ALTER TABLE public.tbl_bucket ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow anonymous access" ON public.tbl_bucket FOR SELECT USING (true);

-- 2. 검색 이력 테이블 (tbl_search_history)
CREATE TABLE IF NOT EXISTS public.tbl_search_history (
    id integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    keyword text NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    result integer DEFAULT 0 NOT NULL,
    user_id uuid
);

-- 3. 공통 코드 테이블 (성별, 연령대)
CREATE TABLE IF NOT EXISTS public.tbl_common_gender (
    gender_code character varying(10) PRIMARY KEY,
    gender_label character varying(20) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.tbl_common_age_group (
    age_group_code character varying(10) PRIMARY KEY,
    age_group_label character varying(20) NOT NULL,
    sort_order smallint
);

-- 4. 커뮤니티 수집 데이터 (tbl_collect_place)
CREATE TABLE IF NOT EXISTS public.tbl_collect_place (
    source character varying DEFAULT 'damoang'::character varying NOT NULL,
    link character varying NOT NULL,
    place_url character varying,
    place_id character varying,
    title character varying,
    author character varying,
    views integer DEFAULT 0,
    comments integer DEFAULT 0,
    likes integer DEFAULT 0,
    "unixTimestamp" bigint,
    date character varying,
    content character varying,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    CONSTRAINT tbl_collect_place_pkey PRIMARY KEY (source, link)
);

-- 권한 부여
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon, authenticated;

-- 코멘트 추가
COMMENT ON TABLE public.tbl_bucket IS '통계 데이터 등 캐싱을 위한 버킷 테이블';
COMMENT ON TABLE public.tbl_search_history IS '사용자 검색 키워드 이력';
