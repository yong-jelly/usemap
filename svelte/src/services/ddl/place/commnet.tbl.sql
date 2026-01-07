CREATE TABLE public.tbl_comment_likes_for_place (
    comment_id uuid NOT NULL REFERENCES public.tbl_comment_for_place(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (comment_id, user_id) -- 복합 기본 키
);
ALTER TABLE public.tbl_comment_likes_for_place ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow users to manage their own likes" ON public.tbl_comment_likes_for_place
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);