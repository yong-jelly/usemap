-- =====================================================
-- 000_setup_timezone.sql
-- 데이터베이스 기본 시간대를 한국 시간(KST, Asia/Seoul)으로 설정
-- 
-- 실행 방법:
--   psql "postgresql://postgres.xyqpggpilgcdsawuvpzn:ZNDqDunnaydr0aFQ@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres" -f docs/sql/000_setup_timezone.sql
-- =====================================================

-- 데이터베이스 기본 시간대 설정
ALTER DATABASE postgres SET timezone TO 'Asia/Seoul';

-- 현재 세션 시간대 즉시 적용 확인을 위한 출력
SHOW timezone;
SELECT now();
