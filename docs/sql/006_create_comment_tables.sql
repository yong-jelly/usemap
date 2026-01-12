-- =====================================================
-- 006_create_comment_tables.sql
-- 장소에 대한 사용자 댓글 및 좋아요 테이블 정의
-- 
-- 실행 방법:
--   psql "postgresql://postgres.xyqpggpilgcdsawuvpzn:ZNDqDunnaydr0aFQ@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres" -f docs/sql/006_create_comment_tables.sql
-- =====================================================

-- 1. 장소 댓글 테이블 (tbl_comment_for_place)
CREATE TABLE IF NOT EXISTS public.tbl_comment_for_place (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    user_id uuid,
    title text,
    content text NOT NULL,
    business_id text NOT NULL,
    image_paths text[],
    parent_comment_id uuid,
    comment_level integer DEFAULT 0 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT tbl_comment_for_place_pkey PRIMARY KEY (id),
    CONSTRAINT check_comment_hierarchy CHECK ((((comment_level = 0) AND (parent_comment_id IS NULL)) OR ((comment_level = 1) AND (parent_comment_id IS NOT NULL)))),
    CONSTRAINT tbl_comment_for_place_comment_level_check CHECK ((comment_level = ANY (ARRAY[0, 1]))),
    CONSTRAINT tbl_comment_for_place_content_check CHECK ((length(content) > 0))
);

CREATE INDEX IF NOT EXISTS idx_tbl_comment_place_business_active_created ON public.tbl_comment_for_place USING btree (business_id, created_at DESC) WHERE (is_active = true);
CREATE INDEX IF NOT EXISTS idx_tbl_comment_place_user_active ON public.tbl_comment_for_place USING btree (user_id) WHERE (is_active = true);

CREATE TRIGGER update_tbl_comment_place_updated_at 
BEFORE UPDATE ON public.tbl_comment_for_place 
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE ONLY public.tbl_comment_for_place
    ADD CONSTRAINT tbl_comment_for_place_parent_comment_id_fkey FOREIGN KEY (parent_comment_id) REFERENCES public.tbl_comment_for_place(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.tbl_comment_for_place
    ADD CONSTRAINT tbl_comment_for_place_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.tbl_comment_for_place ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to active comments" ON public.tbl_comment_for_place FOR SELECT USING ((is_active = true));
CREATE POLICY "Allow authenticated users to insert their own comments" ON public.tbl_comment_for_place FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Allow users to update their own active comments" ON public.tbl_comment_for_place FOR UPDATE USING (((auth.uid() = user_id) AND (is_active = true))) WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Allow users to deactivate their own comments" ON public.tbl_comment_for_place FOR UPDATE USING ((auth.uid() = user_id)) WITH CHECK (((auth.uid() = user_id) AND (is_active = false)));

-- 2. 댓글 좋아요 테이블 (tbl_comment_likes_for_place)
CREATE TABLE IF NOT EXISTS public.tbl_comment_likes_for_place (
    comment_id uuid NOT NULL,
    user_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT tbl_comment_likes_for_place_pkey PRIMARY KEY (comment_id, user_id)
);

ALTER TABLE ONLY public.tbl_comment_likes_for_place
    ADD CONSTRAINT tbl_comment_likes_for_place_comment_id_fkey FOREIGN KEY (comment_id) REFERENCES public.tbl_comment_for_place(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.tbl_comment_likes_for_place
    ADD CONSTRAINT tbl_comment_likes_for_place_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.tbl_comment_likes_for_place ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow users to manage their own likes" ON public.tbl_comment_likes_for_place USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));

-- 권한 부여
GRANT SELECT,INSERT,UPDATE ON TABLE public.tbl_comment_for_place TO anon, authenticated;
GRANT SELECT,INSERT,DELETE ON TABLE public.tbl_comment_likes_for_place TO authenticated;

-- 코멘트 추가
COMMENT ON TABLE public.tbl_comment_for_place IS '음식점(장소)에 대한 사용자 댓글 정보 (소프트 삭제 방식)';
COMMENT ON COLUMN public.tbl_comment_for_place.comment_level IS '댓글 계층 레벨 (0: 원본, 1: 대댓글)';
