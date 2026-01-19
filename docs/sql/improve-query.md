# Query Optimization Records

이 문서는 프로젝트의 주요 SQL 쿼리 및 함수들에 대한 최적화 기록을 보관합니다. 향후 유사한 패턴의 쿼리를 작성할 때 참조합니다.

## [2026-01-20] v4_get_my_feed 최적화 (v3 대비)

### 1. 개요
내 피드 조회 함수(`v3_get_my_feed`)의 성능 이슈를 해결하기 위해 `v4_get_my_feed`로 개선.

### 2. 주요 개선 사항
- **중복 함수 호출 제거**: `calculate_menu_avg_price` 함수를 CTE 단계에서 1회만 호출하도록 변경 (기본 3회 → 1회).
- **N+1 쿼리 해결**: `place_interactions` 조회 시 각 행마다 수행되던 스칼라 서브쿼리들을 `LEFT JOIN LATERAL` 및 배치 처리 방식으로 변경.
- **중복 제거 최적화**: `DISTINCT ON`을 두 번 수행하던 비효율을 제거하고, `place_id` 기준으로 한 번만 수행하도록 통합.
- **함수 인라인화**: `v1_common_place_features` 함수 호출을 `LATERAL JOIN` 내부 쿼리로 인라인화하여 오버헤드 감소.

### 3. 성능 비교 결과
테스트 환경: Supabase / PostgreSQL 15

| 테스트 케이스 | v3 (이전) | v4 (개선) | 개선율 |
|-------------|-----------|-----------|-------|
| 기본 조회 (recent, 20개) | 162.9ms | 87.3ms | **1.87배** |
| 가격 필터 (10,000~30,000원) | 92.1ms | 84.8ms | **1.09배** |
| 빈 피드 사용자 | 66.7ms | 18.4ms | **3.62배** |

### 4. 핵심 최적화 패턴
- **Scalar Subquery → Lateral Join**: 결과셋이 작을 때(`LIMIT` 적용 후) 관련 데이터를 붙일 때 유용.
- **Function Call Caching via CTE**: 계산 비용이 높은 함수는 CTE에서 미리 계산하여 필터링과 결과 선택 시 재사용.
- **Minimal DISTINCT ON**: 정렬 조건과 `DISTINCT ON` 컬럼을 일치시켜 단일 패스로 처리.

---
마이그레이션 파일: `docs/sql/081_optimize_v4_get_my_feed.sql`
