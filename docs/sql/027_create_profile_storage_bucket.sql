-- =====================================================
-- 027_create_profile_storage_bucket.sql
-- 프로필 이미지 저장을 위한 Supabase Storage 설정
-- 
-- 실행 방법:
--   psql "postgresql://postgres.xyqpggpilgcdsawuvpzn:ZNDqDunnaydr0aFQ@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres" -f docs/sql/027_create_profile_storage_bucket.sql
-- =====================================================

-- 1. 버킷 생성 (public-profile-avatars)
-- public: true (누구나 조회 가능)
-- file_size_limit: 5MB (5242880 bytes)
-- allowed_mime_types: jpeg, png, webp, gif
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'public-profile-avatars', 
    'public-profile-avatars', 
    true, 
    5242880, 
    '{image/jpeg,image/png,image/webp,image/gif}'
)
ON CONFLICT (id) DO NOTHING;

-- 2. RLS 정책 설정 (storage.objects 테이블에 직접 적용)

-- [SELECT] 누구나 프로필 이미지를 조회할 수 있음
DROP POLICY IF EXISTS "Public can read profile images" ON storage.objects;
CREATE POLICY "Public can read profile images" ON storage.objects
    FOR SELECT TO public 
    USING (bucket_id = 'public-profile-avatars');

-- [INSERT] 인증된 사용자는 자신의 폴더에만 업로드할 수 있음
-- 폴더 구조: {auth_id}/...
DROP POLICY IF EXISTS "Users can upload to own folder" ON storage.objects;
CREATE POLICY "Users can upload to own folder" ON storage.objects
    FOR INSERT TO authenticated 
    WITH CHECK (
        bucket_id = 'public-profile-avatars' AND 
        (storage.foldername(name))[1] = auth.uid()::text
    );

-- [SELECT] 인증된 사용자는 자신의 폴더 내용을 조회할 수 있음 (관리용)
DROP POLICY IF EXISTS "Users can read own folder" ON storage.objects;
CREATE POLICY "Users can read own folder" ON storage.objects
    FOR SELECT TO authenticated 
    USING (
        bucket_id = 'public-profile-avatars' AND 
        (storage.foldername(name))[1] = auth.uid()::text
    );

-- [DELETE] 인증된 사용자는 자신의 이미지를 삭제할 수 있음
DROP POLICY IF EXISTS "Users can delete own folder" ON storage.objects;
CREATE POLICY "Users can delete own folder" ON storage.objects
    FOR DELETE TO authenticated 
    USING (
        bucket_id = 'public-profile-avatars' AND 
        (storage.foldername(name))[1] = auth.uid()::text
    );

-- [UPDATE] 인증된 사용자는 자신의 이미지를 업데이트할 수 있음
DROP POLICY IF EXISTS "Users can update own folder" ON storage.objects;
CREATE POLICY "Users can update own folder" ON storage.objects
    FOR UPDATE TO authenticated 
    USING (
        bucket_id = 'public-profile-avatars' AND 
        (storage.foldername(name))[1] = auth.uid()::text
    );
