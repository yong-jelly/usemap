-- =====================================================
-- 007_create_tag_tables.sql
-- 장소 태그 마스터 및 사용자 태그 연결 테이블 정의
-- 
-- 실행 방법:
--   psql "postgresql://postgres.xyqpggpilgcdsawuvpzn:ZNDqDunnaydr0aFQ@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres" -f docs/sql/007_create_tag_tables.sql
-- =====================================================

-- 1. 장소 태그 마스터 테이블 (tbl_tag_master_for_place)
CREATE TABLE IF NOT EXISTS public.tbl_tag_master_for_place (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    tag_group character varying(30) NOT NULL,
    tag_group_ko character varying(100) NOT NULL,
    tag_name character varying(100) NOT NULL,
    tag_name_slug character varying(100) NOT NULL,
    tag_order integer DEFAULT 0 NOT NULL,
    tag_desc character varying(200),
    category character varying(20) NOT NULL,
    topic character varying(50) NOT NULL,
    level integer DEFAULT 1 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    CONSTRAINT tbl_tag_master_for_place_pkey PRIMARY KEY (id),
    CONSTRAINT tbl_tag_master_for_place_tag_name_key UNIQUE (tag_name),
    CONSTRAINT tbl_tag_master_for_place_tag_name_slug_key UNIQUE (tag_name_slug),
    CONSTRAINT tbl_tag_master_for_place_category_check CHECK (((category)::text = ANY ((ARRAY['positive'::character varying, 'neutral'::character varying, 'negative'::character varying, 'hateful'::character varying])::text[]))),
    CONSTRAINT tbl_tag_master_for_place_level_check CHECK ((level = ANY (ARRAY[0, 1, 2]))),
    CONSTRAINT tbl_tag_master_for_place_tag_group_check CHECK (((tag_group)::text = ANY ((ARRAY['taste_menu'::character varying, 'price_value'::character varying, 'atmosphere_facility'::character varying, 'service'::character varying, 'situation_purpose'::character varying, 'info_etc'::character varying])::text[])))
);

CREATE INDEX IF NOT EXISTS idx_tag_master_tag_group ON public.tbl_tag_master_for_place USING btree (tag_group);
CREATE INDEX IF NOT EXISTS idx_tag_master_category ON public.tbl_tag_master_for_place USING btree (category);
CREATE INDEX IF NOT EXISTS idx_tag_master_is_active ON public.tbl_tag_master_for_place USING btree (is_active);

-- 2. 장소 태그 연결 테이블 (tbl_place_tag)
CREATE TABLE IF NOT EXISTS public.tbl_place_tag (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    business_id text NOT NULL,
    tag_id uuid NOT NULL,
    additional_data jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT tbl_place_tag_pkey PRIMARY KEY (id),
    CONSTRAINT unique_user_business_tag UNIQUE (user_id, business_id, tag_id)
);

CREATE INDEX IF NOT EXISTS idx_place_tag_business_id ON public.tbl_place_tag USING btree (business_id);
CREATE INDEX IF NOT EXISTS idx_place_tag_user_id ON public.tbl_place_tag USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_place_tag_tag_id ON public.tbl_place_tag USING btree (tag_id);

CREATE TRIGGER set_place_tag_timestamp 
BEFORE UPDATE ON public.tbl_place_tag 
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE ONLY public.tbl_place_tag
    ADD CONSTRAINT tbl_place_tag_tag_id_fkey FOREIGN KEY (tag_id) REFERENCES public.tbl_tag_master_for_place(id);

ALTER TABLE ONLY public.tbl_place_tag
    ADD CONSTRAINT tbl_place_tag_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);

-- 3. 태그 변경 이력 테이블 (tbl_tag_history)
CREATE TABLE IF NOT EXISTS public.tbl_tag_history (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    tag_id uuid NOT NULL,
    user_id uuid,
    action_type character varying(20) NOT NULL,
    change_details jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT tbl_tag_history_pkey PRIMARY KEY (id),
    CONSTRAINT tbl_tag_history_action_type_check CHECK (((action_type)::text = ANY ((ARRAY['CREATE'::character varying, 'UPDATE'::character varying, 'DELETE'::character varying])::text[])))
);

CREATE INDEX IF NOT EXISTS idx_tag_history_tag_id ON public.tbl_tag_history USING btree (tag_id);
CREATE INDEX IF NOT EXISTS idx_tag_history_user_id ON public.tbl_tag_history USING btree (user_id);

-- 권한 부여
GRANT SELECT ON public.tbl_tag_master_for_place TO anon, authenticated;
GRANT SELECT, INSERT, DELETE ON public.tbl_place_tag TO authenticated;

-- 코멘트 추가
COMMENT ON TABLE public.tbl_place_tag IS '사용자가 특정 장소(음식점)에 태그를 연결하고 추가 정보를 관리하는 테이블';
COMMENT ON CONSTRAINT unique_user_business_tag ON public.tbl_place_tag IS '사용자별, 장소별 태그 중복 추가 방지';
