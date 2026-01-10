-- =====================================================
-- 004_create_interaction_tables.sql
-- 좋아요, 저장, 방문 기록 테이블 생성 및 정책 설정
-- 
-- 실행 방법:
--   psql "postgresql://postgres.xyqpggpilgcdsawuvpzn:ZNDqDunnaydr0aFQ@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres" -f docs/sql/004_create_interaction_tables.sql
-- =====================================================

-- 1. 좋아요 테이블 (tbl_like)
CREATE TABLE IF NOT EXISTS public.tbl_like (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    liked_id text NOT NULL,
    liked_type text NOT NULL,
    liked boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    ref_liked_id character varying,
    CONSTRAINT tbl_like_pkey PRIMARY KEY (id),
    CONSTRAINT tbl_like_user_liked_item_unique UNIQUE (user_id, liked_id, liked_type),
    CONSTRAINT uk_tbl_like_user_item UNIQUE (user_id, liked_id, liked_type, ref_liked_id)
);

CREATE INDEX IF NOT EXISTS idx_tbl_like_user_id ON public.tbl_like USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_tbl_like_user_liked_item ON public.tbl_like USING btree (user_id, liked_id, liked_type);

CREATE TRIGGER update_tbl_like_updated_at 
BEFORE UPDATE ON public.tbl_like 
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE ONLY public.tbl_like
    ADD CONSTRAINT tbl_like_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);

ALTER TABLE public.tbl_like ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow user to view their own likes" ON public.tbl_like FOR SELECT USING ((auth.uid() = user_id));
CREATE POLICY "Allow user to insert their own likes" ON public.tbl_like FOR INSERT WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Allow user to update their own like status" ON public.tbl_like FOR UPDATE USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "anon_like_policy" ON public.tbl_like FOR SELECT USING (true);

-- 2. 저장 테이블 (tbl_save)
CREATE TABLE IF NOT EXISTS public.tbl_save (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    saved_id text NOT NULL,
    saved_type text NOT NULL,
    saved boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    ref_saved_id text,
    CONSTRAINT tbl_save_pkey PRIMARY KEY (id),
    CONSTRAINT tbl_save_user_saved_item_unique UNIQUE (user_id, saved_id, saved_type),
    CONSTRAINT uk_tbl_save_user_item UNIQUE (user_id, saved_id, saved_type, ref_saved_id)
);

CREATE INDEX IF NOT EXISTS idx_tbl_save_user_id_saved ON public.tbl_save USING btree (user_id, saved);
CREATE INDEX IF NOT EXISTS idx_tbl_save_user_saved_item ON public.tbl_save USING btree (user_id, saved_id, saved_type);

CREATE TRIGGER update_tbl_save_updated_at 
BEFORE UPDATE ON public.tbl_save 
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE ONLY public.tbl_save
    ADD CONSTRAINT tbl_save_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);

ALTER TABLE public.tbl_save ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow user to view their own saves" ON public.tbl_save FOR SELECT USING ((auth.uid() = user_id));
CREATE POLICY "Allow user to insert their own saves" ON public.tbl_save FOR INSERT WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Allow user to update their own save status" ON public.tbl_save FOR UPDATE USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));

-- 3. 방문 테이블 (tbl_visited)
CREATE TABLE IF NOT EXISTS public.tbl_visited (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    place_id character varying NOT NULL,
    visited_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT tbl_visited_pkey PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_tbl_visited_user_id ON public.tbl_visited USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_tbl_visited_user_restaurant ON public.tbl_visited USING btree (user_id, place_id);

CREATE TRIGGER update_tbl_visited_updated_at 
BEFORE UPDATE ON public.tbl_visited 
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE ONLY public.tbl_visited
    ADD CONSTRAINT tbl_visited_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);

ALTER TABLE public.tbl_visited ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow user to view their own visits" ON public.tbl_visited FOR SELECT USING ((auth.uid() = user_id));
CREATE POLICY "Allow user to insert their own visits" ON public.tbl_visited FOR INSERT WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Allow user to update their own visits" ON public.tbl_visited FOR UPDATE USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));

-- 권한 부여
GRANT SELECT,INSERT,UPDATE ON TABLE public.tbl_like TO anon, authenticated;
GRANT SELECT,INSERT,UPDATE ON TABLE public.tbl_save TO anon, authenticated;
GRANT SELECT,INSERT,UPDATE ON TABLE public.tbl_visited TO anon, authenticated;

-- 코멘트 추가
COMMENT ON TABLE public.tbl_like IS '사용자 좋아요/취소 정보를 저장하는 테이블';
COMMENT ON TABLE public.tbl_save IS '사용자 콘텐츠 저장(북마크) 정보를 저장하는 테이블';
COMMENT ON TABLE public.tbl_visited IS '사용자가 방문한 장소 정보를 저장하는 테이블';
