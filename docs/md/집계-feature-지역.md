# 지역별 통합 컨텐츠 집계 최적화 가이드

## 1. 개요
피쳐 페이지의 지역 탭에서 보여주는 '지역별 통합 컨텐츠'는 커뮤니티, 유튜브, 네이버 폴더, 맛탐정 폴더 등 다양한 소스로부터 데이터를 수집하고 집계해야 합니다. 데이터 양이 증가함에 따라 실시간 JOIN 및 집계 연산의 오버헤드가 커져 응답 속도가 저하되는 문제가 발생했습니다.

이를 해결하기 위해 **Materialized View (머터리얼라이즈드 뷰)**를 도입하여 복잡한 집계 결과를 미리 계산해두고 고속으로 조회할 수 있도록 최적화했습니다.

## 2. 아키텍처 및 구현 방식

### 2.1 Materialized View (`public.mv_region_contents`)
- **역할**: 모든 소스별, 지역별 매장 수(`place_count`)와 최신 컨텐츠 10개(`preview_contents`)를 미리 집계하여 저장합니다.
- **데이터 구조**:
  - `source`: 소스 구분 (`all`, `community`, `youtube`, `folder`, `detective`)
  - `region_name`: 지역 명칭 (group1 기반)
  - `place_count`: 해당 지역의 중복을 제거한 총 매장 수
  - `preview_contents`: 최신순으로 정렬된 10개의 컨텐츠 정보를 담은 JSONB 배열

### 2.2 자동 갱신 (Supabase Cron)
- **주기**: 3시간마다 한 번씩 (`0 */3 * * *`)
- **방식**: `REFRESH MATERIALIZED VIEW CONCURRENTLY`
  - 동시성 갱신을 통해 뷰를 갱신하는 중에도 기존 데이터를 끊김 없이 조회할 수 있습니다.
  - 이를 위해 `(source, region_name)` 컬럼에 유니크 인덱스가 생성되어 있습니다.

### 2.3 RPC 함수 (`v2_get_region_contents`)
- 기존의 복잡한 CTE 기반 쿼리 대신 `mv_region_contents` 테이블을 단순 필터링하여 결과를 반환합니다.
- `p_source` 인자가 `NULL`인 경우 기본값으로 `'all'` 소스를 조회합니다.

## 3. 관리 가이드

### 3.1 수동 갱신 방법
데이터 변경 사항을 즉시 반영해야 하는 경우 아래 SQL 명령어를 통해 수동으로 갱신할 수 있습니다.
```sql
-- 동시성 갱신 (추천: 서비스 중단 없음)
REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_region_contents;

-- 일반 갱신 (인덱스 문제가 있거나 데이터가 아예 없을 때)
-- REFRESH MATERIALIZED VIEW public.mv_region_contents;
```

### 3.2 배치 작업(Cron) 상태 확인
자동 갱신 작업의 성공 여부와 실행 이력을 확인하려면 아래 쿼리를 사용합니다.

```sql
-- 스케줄 확인
SELECT * FROM cron.job WHERE jobname = 'refresh-region-contents';

-- 최근 실행 이력 확인
SELECT 
    runid, 
    jobid, 
    status, 
    return_message, 
    start_time, 
    end_time 
FROM cron.job_run_details 
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'refresh-region-contents')
ORDER BY start_time DESC 
LIMIT 10;
```

### 3.3 성능 모니터링
- 조회 속도가 다시 느려지는 경우 `region_name` 또는 `place_count`에 대한 추가 인덱스 검토가 필요할 수 있습니다.
- 현재는 `place_count DESC` 정렬을 사용하므로, 데이터가 매우 많아지면 해당 컬럼에 대한 인덱스가 유리할 수 있습니다.

### 3.3 관련 파일
- **SQL 정의**: `docs/sql/073_create_mv_region_contents.sql`
- **기존 로직(참고)**: `docs/sql/071_add_v2_get_region_contents.sql`
