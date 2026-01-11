/**
 * 데이터베이스 연결 공통 모듈 (PostgreSQL)
 */
// @ts-ignore
import postgres from 'postgres';

const DEFAULT_DB_URL = 'postgresql://postgres.xyqpggpilgcdsawuvpzn:ZNDqDunnaydr0aFQ@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres';

/**
 * 환경 변수 또는 기본 연결 문자열을 사용하여 SQL 클라이언트를 생성합니다.
 */
export const sql = postgres(process.env.DATABASE_URL || DEFAULT_DB_URL);

/**
 * Postgres 배열 리터럴 생성을 위한 헬퍼
 */
export const pgArray = (vals: any[]) => {
    if (!vals || vals.length === 0) return '{}';
    return `{${vals.join(',')}}`;
};

/**
 * 유연한 배열 헬퍼 (Postgres Array 객체 반환)
 */
export const toSqlArray = (value: any[] | string | null | undefined) => {
    if (!value) return null;
    if (Array.isArray(value)) return sql.array(value);
    return sql.array([value]);
};

/**
 * epoch(ms)를 Date 객체로 변환하거나 null 반환
 */
export const toDate = (ms?: number | string | null) => {
    if (!ms) return null;
    return new Date(Number(ms));
};
