-- =====================================================
-- 053_migrate_timezone_defaults.sql
-- 기존 테이블의 시간대 기본값 설정 마이그레이션 및 시간대 확정
-- 
-- 실행 방법:
--   psql "postgresql://postgres.xyqpggpilgcdsawuvpzn:ZNDqDunnaydr0aFQ@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres" -f docs/sql/053_migrate_timezone_defaults.sql
-- =====================================================

-- 1. 데이터베이스 전체 시간대 설정 (KST)
ALTER DATABASE postgres SET timezone TO 'Asia/Seoul';

-- 2. 각 테이블별 DEFAULT 값 마이그레이션 (UTC 하드코딩 제거)

-- 사용자 프로필
ALTER TABLE public.tbl_user_profile ALTER COLUMN created_at SET DEFAULT now();
ALTER TABLE public.tbl_user_profile ALTER COLUMN updated_at SET DEFAULT now();

-- 태그 관련
ALTER TABLE public.tbl_tag_master_for_place ALTER COLUMN created_at SET DEFAULT now();
ALTER TABLE public.tbl_tag_master_for_place ALTER COLUMN updated_at SET DEFAULT now();
ALTER TABLE public.tbl_place_tag ALTER COLUMN created_at SET DEFAULT now();
ALTER TABLE public.tbl_place_tag ALTER COLUMN updated_at SET DEFAULT now();

-- 폴더 관련
ALTER TABLE public.tbl_folder ALTER COLUMN created_at SET DEFAULT now();
ALTER TABLE public.tbl_folder ALTER COLUMN updated_at SET DEFAULT now();

-- 상호작용 (좋아요, 저장, 방문)
ALTER TABLE public.tbl_like ALTER COLUMN created_at SET DEFAULT now();
ALTER TABLE public.tbl_like ALTER COLUMN updated_at SET DEFAULT now();
ALTER TABLE public.tbl_save ALTER COLUMN created_at SET DEFAULT now();
ALTER TABLE public.tbl_save ALTER COLUMN updated_at SET DEFAULT now();
ALTER TABLE public.tbl_visited ALTER COLUMN created_at SET DEFAULT now();
ALTER TABLE public.tbl_visited ALTER COLUMN updated_at SET DEFAULT now();

-- 댓글 관련
ALTER TABLE public.tbl_comment_for_place ALTER COLUMN created_at SET DEFAULT now();
ALTER TABLE public.tbl_comment_for_place ALTER COLUMN updated_at SET DEFAULT now();
ALTER TABLE public.tbl_comment_likes_for_place ALTER COLUMN created_at SET DEFAULT now();

-- 장소 및 최근 본 장소
ALTER TABLE public.tbl_place ALTER COLUMN created_at SET DEFAULT now();
ALTER TABLE public.tbl_place ALTER COLUMN updated_at SET DEFAULT now();
ALTER TABLE public.tbl_place_recent_view ALTER COLUMN last_viewed_at SET DEFAULT now();
ALTER TABLE public.tbl_place_recent_view ALTER COLUMN created_at SET DEFAULT now();
ALTER TABLE public.tbl_place_recent_view ALTER COLUMN updated_at SET DEFAULT now();

-- 유틸리티
ALTER TABLE public.tbl_search_history ALTER COLUMN created_at SET DEFAULT now();

-- 3. (주의) 만약 기존 데이터가 TIMESTAMPTZ가 아닌 TIMESTAMP(시간대 없음)로 저장되어 있다면
-- 아래와 같은 쿼리로 강제 변환이 필요할 수 있으나, 현재 프로젝트는 TIMESTAMPTZ를 사용하므로
-- DB 설정 변경만으로 충분합니다. 

-- 확인용 쿼리
SELECT 
    table_name, 
    column_name, 
    column_default 
FROM 
    information_schema.columns 
WHERE 
    table_schema = 'public' 
    AND column_default LIKE '%timezone%';
