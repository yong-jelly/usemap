-- =====================================================
-- 005_create_place_tables.sql
-- 장소(음식점 등) 관련 메타데이터 및 분석 정보를 저장하는 테이블 정의
-- 
-- 실행 방법:
--   psql "postgresql://postgres.xyqpggpilgcdsawuvpzn:ZNDqDunnaydr0aFQ@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres" -f docs/sql/005_create_place_tables.sql
-- =====================================================

-- 1. 기본 장소 테이블 (tbl_place)
CREATE TABLE IF NOT EXISTS public.tbl_place (
    id character varying NOT NULL,
    name character varying,
    road character varying,
    category character varying,
    category_code character varying,
    category_code_list character varying[],
    road_address character varying,
    payment_info character varying[],
    conveniences character varying[],
    address character varying,
    phone character varying,
    visitor_reviews_total integer,
    visitor_reviews_score numeric(3,2),
    x character varying,
    y character varying,
    homepage character varying[],
    keyword_list character varying[],
    images character varying[],
    static_map_url character varying,
    themes character varying[],
    visitor_review_medias_total integer,
    visitor_review_stats jsonb,
    menus jsonb,
    street_panorama jsonb,
    place_images character varying[],
    updated_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now(),
    group1 character varying,
    group2 character varying,
    group3 character varying,
    is_franchise boolean DEFAULT false,
    algo_avg_len numeric(10,2),
    algo_stdev_len numeric(10,2),
    algo_revisit_rate numeric(8,4),
    algo_media_ratio numeric(8,4),
    algo_avg_views numeric(12,2),
    algo_recency_score numeric(6,4),
    algo_engagement_score numeric(15,2),
    algo_length_variation_index numeric(8,4),
    algo_loyalty_index numeric(8,4),
    algo_growth_rate_1m numeric(8,4),
    algo_growth_rate_2m numeric(8,4),
    algo_growth_rate_3m numeric(8,4),
    CONSTRAINT tbl_place_pkey PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_tbl_place_name ON public.tbl_place USING btree (name);
CREATE INDEX IF NOT EXISTS idx_place_group1 ON public.tbl_place USING btree (group1);
CREATE INDEX IF NOT EXISTS idx_place_location_hierarchy ON public.tbl_place USING btree (group1, group2, group3);
CREATE INDEX IF NOT EXISTS idx_place_engagement_score ON public.tbl_place USING btree (algo_engagement_score DESC);
CREATE INDEX IF NOT EXISTS idx_tbl_place_created_at_desc ON public.tbl_place USING btree (created_at DESC);

-- 2. 장소 분석 테이블 (tbl_place_analysis)
CREATE TABLE IF NOT EXISTS public.tbl_place_analysis (
    business_id character varying NOT NULL,
    review_avg_rating numeric(3,2),
    total_reviews integer,
    themes jsonb NOT NULL,
    menus jsonb NOT NULL,
    voted jsonb NOT NULL,
    voted_sum_count integer NOT NULL,
    voted_user_count integer NOT NULL,
    updated_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now(),
    CONSTRAINT tbl_place_analysis_pkey PRIMARY KEY (business_id),
    CONSTRAINT tbl_place_analysis_review_avg_rating_check CHECK (((review_avg_rating >= (0)::numeric) AND (review_avg_rating <= (5)::numeric))),
    CONSTRAINT tbl_place_analysis_total_reviews_check CHECK ((total_reviews >= 0))
);

CREATE INDEX IF NOT EXISTS idx_menus ON public.tbl_place_analysis USING gin (menus);
CREATE INDEX IF NOT EXISTS idx_themes ON public.tbl_place_analysis USING gin (themes);

-- 3. 장소 피처 테이블 (tbl_place_features)
CREATE TABLE IF NOT EXISTS public.tbl_place_features (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    place_id character varying NOT NULL,
    platform_type character varying(50) NOT NULL,
    content_url text NOT NULL,
    title character varying(500),
    metadata jsonb,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    published_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    is_verified boolean DEFAULT false,
    status character varying(20) DEFAULT 'active'::character varying,
    CONSTRAINT tbl_place_features_pkey PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_pf_place_id ON public.tbl_place_features USING btree (place_id);
CREATE INDEX IF NOT EXISTS idx_pf_status_platform_created ON public.tbl_place_features USING btree (status, platform_type, created_at DESC, published_at DESC);

-- 4. 장소 피드 그룹 테이블 (tbl_place_feed_group)
CREATE TABLE IF NOT EXISTS public.tbl_place_feed_group (
    id BIGSERIAL PRIMARY KEY,
    tab_name character varying(50) NOT NULL,
    place_id character varying(255) NOT NULL,
    name character varying(500),
    category character varying(100),
    road_address text,
    group1 character varying(50),
    group2 character varying(100),
    group3 character varying(100),
    visitor_reviews_total integer,
    visitor_reviews_score numeric(3,2),
    total_score numeric(10,3),
    rank_in_region integer,
    engagement_score numeric(10,3),
    tag_score numeric(10,3),
    platform_score numeric(10,3),
    review_score numeric(10,3),
    user_review_score numeric(10,3),
    naver_review_score numeric(10,3),
    freshness_score numeric(10,3),
    quality_potential_score numeric(10,3),
    hidden_gem_score numeric(10,3),
    debug_like_count integer DEFAULT 0,
    debug_save_count integer DEFAULT 0,
    debug_visit_count integer DEFAULT 0,
    debug_review_count integer DEFAULT 0,
    debug_avg_score numeric(3,2),
    debug_community_mentions integer DEFAULT 0,
    debug_youtube_mentions integer DEFAULT 0,
    debug_local_tags integer DEFAULT 0,
    debug_good_taste_tags integer DEFAULT 0,
    debug_atmosphere_tags integer DEFAULT 0,
    debug_recent_features integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_place_feed_group_tab_score ON public.tbl_place_feed_group USING btree (tab_name, group1, total_score DESC);

-- 5. 장소 상세 정보 (tbl_place_info)
CREATE TABLE IF NOT EXISTS public.tbl_place_info (
    business_id character varying NOT NULL,
    business_name character varying,
    address character varying,
    convenience character varying[],
    direction character varying,
    payment_methods character varying[],
    website character varying[],
    description character varying,
    url character varying,
    updated_at timestamp without time zone DEFAULT now(),
    created_at timestamp without time zone DEFAULT now(),
    CONSTRAINT tbl_place_info_pkey PRIMARY KEY (business_id)
);

-- 6. 장소 메뉴 정보 (tbl_place_menu)
CREATE TABLE IF NOT EXISTS public.tbl_place_menu (
    id character varying NOT NULL,
    business_id character varying,
    business_name character varying,
    image character varying,
    category character varying,
    text character varying,
    price integer,
    updated_at timestamp without time zone DEFAULT now(),
    created_at timestamp without time zone DEFAULT now(),
    CONSTRAINT tbl_place_menu_pkey PRIMARY KEY (id)
);

-- 7. 장소 조회수 통계 (tbl_place_view_stats)
CREATE TABLE IF NOT EXISTS public.tbl_place_view_stats (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    place_id text NOT NULL,
    hour_bucket timestamp with time zone NOT NULL,
    view_count integer DEFAULT 1 NOT NULL,
    unique_sessions integer DEFAULT 1 NOT NULL,
    last_viewed_at timestamp with time zone DEFAULT now() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT tbl_place_view_stats_pkey PRIMARY KEY (id),
    CONSTRAINT uk_tbl_place_view_stats_place_hour UNIQUE (place_id, hour_bucket)
);

CREATE INDEX IF NOT EXISTS idx_tbl_place_view_stats_hour_bucket ON public.tbl_place_view_stats USING btree (hour_bucket DESC);

-- RLS 및 권한 설정
ALTER TABLE public.tbl_place ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow anonymous access" ON public.tbl_place FOR SELECT USING (true);

GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon, authenticated;

-- 코멘트 추가
COMMENT ON TABLE public.tbl_place IS '기본 장소 정보 테이블';
COMMENT ON TABLE public.tbl_place_analysis IS '장소별 리뷰 및 투표 분석 데이터';
COMMENT ON TABLE public.tbl_place_features IS '장소 관련 외부 미디어 콘텐츠 피처';
COMMENT ON TABLE public.tbl_place_feed_group IS '피드 노출용 장소 랭킹 및 점수 정보';
COMMENT ON TABLE public.tbl_place_info IS '업체 부가 상세 정보';
COMMENT ON TABLE public.tbl_place_menu IS '업체별 메뉴 정보';
COMMENT ON TABLE public.tbl_place_view_stats IS '시간대별 장소 조회수 통계';
