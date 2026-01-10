-- =====================================================
-- 001_create_extensions.sql
-- 데이터베이스 확장을 활성화합니다.
-- 
-- 실행 방법:
--   psql "postgresql://postgres.xyqpggpilgcdsawuvpzn:ZNDqDunnaydr0aFQ@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres" -f docs/sql/001_create_extensions.sql
-- =====================================================

-- uuid-ossp 확장: UUID 생성을 위한 함수(uuid_generate_v4 등) 제공
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" SCHEMA extensions;

-- pgcrypto 확장: 암호화 기능을 위한 함수 제공
CREATE EXTENSION IF NOT EXISTS "pgcrypto" SCHEMA extensions;

-- pg_stat_statements 확장: SQL 실행 통계 추적
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" SCHEMA extensions;

-- postgis 확장: 공간 데이터 타입 및 함수 제공
CREATE EXTENSION IF NOT EXISTS "postgis" SCHEMA extensions;
