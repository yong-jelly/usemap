-- =====================================================
-- 067_create_review_images.sql
-- 리뷰 이미지 테이블 생성 및 Storage 버킷 설정
-- =====================================================

-- 1. 리뷰 이미지 테이블 생성
CREATE TABLE IF NOT EXISTS public.tbl_review_images (
    id uuid DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    review_id uuid NOT NULL REFERENCES public.tbl_place_user_review(id) ON DELETE CASCADE,
    place_id character varying NOT NULL,
    image_path character varying NOT NULL,
    user_id uuid NOT NULL REFERENCES auth.users(id),
    is_deleted boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_review_images_review_id ON public.tbl_review_images (review_id);
CREATE INDEX IF NOT EXISTS idx_review_images_place_id ON public.tbl_review_images (place_id);
CREATE INDEX IF NOT EXISTS idx_review_images_user_id ON public.tbl_review_images (user_id);

-- 2. 기존 리뷰 테이블에 이미지 여부 플래그 추가
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='tbl_place_user_review' AND COLUMN_NAME='has_images') THEN
        ALTER TABLE public.tbl_place_user_review ADD COLUMN has_images boolean DEFAULT false;
    END IF;
END $$;

-- 3. Storage 버킷 생성 (public-review-images)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'public-review-images', 
    'public-review-images', 
    true, 
    10485760, -- 10MB
    '{image/jpeg,image/png,image/webp,image/gif}'
)
ON CONFLICT (id) DO NOTHING;

-- 4. Storage RLS 정책 설정

-- [SELECT] 누구나 리뷰 이미지를 조회할 수 있음
DROP POLICY IF EXISTS "Public can read review images" ON storage.objects;
CREATE POLICY "Public can read review images" ON storage.objects
    FOR SELECT TO public 
    USING (bucket_id = 'public-review-images');

-- [INSERT] 인증된 사용자는 자신의 폴더에만 업로드할 수 있음
-- 폴더 구조: {auth_id}/{review_id}/{filename}
DROP POLICY IF EXISTS "Users can upload review images to own folder" ON storage.objects;
CREATE POLICY "Users can upload review images to own folder" ON storage.objects
    FOR INSERT TO authenticated 
    WITH CHECK (
        bucket_id = 'public-review-images' AND 
        (storage.foldername(name))[1] = auth.uid()::text
    );

-- [DELETE] 인증된 사용자는 자신의 이미지를 삭제할 수 있음
DROP POLICY IF EXISTS "Users can delete own review images" ON storage.objects;
CREATE POLICY "Users can delete own review images" ON storage.objects
    FOR DELETE TO authenticated 
    USING (
        bucket_id = 'public-review-images' AND 
        (storage.foldername(name))[1] = auth.uid()::text
    );

-- 권한 부여
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tbl_review_images TO authenticated;
GRANT SELECT ON public.tbl_review_images TO anon;

-- 코멘트 추가
COMMENT ON TABLE public.tbl_review_images IS '리뷰에 첨부된 이미지 정보를 저장하는 테이블';
