-- =====================================================
-- 009_create_review_tables.sql
-- 사용자 리뷰, 방문자 평가 및 태그 매핑 테이블 정의
-- =====================================================

-- 1. 장소 리뷰 테이블 (tbl_place_review)
CREATE TABLE IF NOT EXISTS public.tbl_place_review (
    id character varying NOT NULL,
    rating real,
    author_id character varying,
    author_nickname character varying,
    author_from character varying,
    author_object_id character varying,
    author_url character varying,
    body text,
    media jsonb,
    visit_count integer,
    view_count integer,
    visited character varying,
    created character varying,
    business_name character varying,
    business_id character varying,
    updated_at timestamp without time zone DEFAULT now(),
    created_at timestamp without time zone DEFAULT now(),
    CONSTRAINT tbl_place_review_pkey PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_place_review_business_id ON public.tbl_place_review USING btree (business_id);

-- 2. 사용자 작성 리뷰 테이블 (tbl_place_user_review)
CREATE TABLE IF NOT EXISTS public.tbl_place_user_review (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    place_id character varying NOT NULL,
    review_content text,
    score numeric(2,1),
    is_private boolean DEFAULT false,
    is_active boolean DEFAULT true,
    media_urls jsonb,
    gender_code character varying,
    age_group_code character varying,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT tbl_place_user_review_pkey PRIMARY KEY (id),
    CONSTRAINT tbl_place_user_review_score_check CHECK (((score >= (0)::numeric) AND (score <= (5)::numeric)))
);

-- 3. 리뷰 태그 마스터 (tbl_place_review_tag_master)
CREATE TABLE IF NOT EXISTS public.tbl_place_review_tag_master (
    tag_code character varying(50) NOT NULL,
    tag_label character varying(100) NOT NULL,
    is_positive boolean NOT NULL,
    tag_group character varying(50),
    CONSTRAINT tbl_place_review_tag_master_pkey PRIMARY KEY (tag_code)
);

-- 4. 사용자 리뷰-태그 매핑 (tbl_place_user_review_tag_map)
CREATE TABLE IF NOT EXISTS public.tbl_place_user_review_tag_map (
    review_id uuid NOT NULL,
    tag_code character varying(50) NOT NULL,
    CONSTRAINT tbl_place_user_review_tag_map_pkey PRIMARY KEY (review_id, tag_code)
);

ALTER TABLE ONLY public.tbl_place_user_review_tag_map
    ADD CONSTRAINT tbl_place_user_review_tag_map_review_id_fkey FOREIGN KEY (review_id) REFERENCES public.tbl_place_user_review(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.tbl_place_user_review_tag_map
    ADD CONSTRAINT tbl_place_user_review_tag_map_tag_code_fkey FOREIGN KEY (tag_code) REFERENCES public.tbl_place_review_tag_master(tag_code) ON DELETE CASCADE;

-- 5. 방문자 투표 평가 (tbl_place_review_voted)
CREATE TABLE IF NOT EXISTS public.tbl_place_review_voted (
    id character varying NOT NULL,
    author_id character varying,
    author_nickname character varying,
    author_from character varying,
    author_object_id character varying,
    author_url character varying,
    business_id character varying,
    business_name character varying,
    code character varying,
    icon_code character varying,
    display_name character varying,
    visited character varying,
    created character varying,
    updated_at timestamp without time zone DEFAULT now(),
    created_at timestamp without time zone DEFAULT now(),
    CONSTRAINT tbl_place_review_voted_pkey PRIMARY KEY (id)
);

-- 6. 방문자 투표 요약 (tbl_place_review_voted_summary)
CREATE TABLE IF NOT EXISTS public.tbl_place_review_voted_summary (
    business_id character varying NOT NULL,
    business_name character varying,
    url character varying,
    image character varying,
    text character varying,
    count integer,
    icon_code character varying NOT NULL,
    updated_at timestamp without time zone DEFAULT now(),
    created_at timestamp without time zone DEFAULT now(),
    CONSTRAINT tbl_place_review_voted_summary_pkey PRIMARY KEY (business_id, icon_code)
);

-- 권한 부여
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tbl_place_user_review TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.tbl_place_user_review_tag_map TO authenticated;

-- 코멘트 추가
COMMENT ON TABLE public.tbl_place_review IS '네이버 등 외부 수집 리뷰 데이터';
COMMENT ON TABLE public.tbl_place_user_review IS '우리 서비스 내 사용자 작성 리뷰';
COMMENT ON TABLE public.tbl_place_review_tag_master IS '리뷰에 사용될 태그 종류 정의';
