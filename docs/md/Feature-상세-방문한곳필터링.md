# Feature 상세 페이지 방문한 곳 필터링 구현 가이드

이 문서는 Feature(네이버 폴더, 유튜브 채널, 커뮤니티 지역 등) 상세 페이지에서 로그인 사용자의 방문 기록을 기반으로 한 카운트 표시 및 필터링 기능의 설계와 구현 내용을 설명합니다.

## 1. 개요

사용자가 구독하거나 탐색 중인 특정 그룹(Feature) 내에서 본인이 이미 방문한 장소가 어디인지 쉽게 파악하고, 방문한 곳만 따로 모아볼 수 있는 기능을 제공합니다.

### 주요 기능
- **방문 카운트**: 해당 그룹 내 전체 장소 수 대비 사용자의 방문 장소 수 표시.
- **서버 사이드 필터링**: '방문' 탭 선택 시 서버에서 필터링된 결과를 반환하여 무한 스크롤 페이징 시 아이템 개수가 일정하게 유지되도록 구현.
- **모바일 최적화**: 탭 형태의 필터 UI와 하단 플로팅 상태 표시 제공.

---

## 2. 시스템 아키텍처

### 데이터 흐름 (Data Flow)

```text
[ Client Side ]                               [ Server Side (Supabase/PostgreSQL) ]
+-----------------------+                     +--------------------------------------+
|  FeatureDetailPage    |                     |                                      |
|  (React Component)    |                     |  RPC: v1_count_visited_in_feature    |
+-----------+-----------+                     |  (Fast count using EXISTS)           |
            |                                 +------------------+-------------------+
            | (1) Get Counts (Parallel)                          ^
            +----------------------------------------------------+
            |
            | (2) Get Places (Initial / Filtered)
            +----------------------------------------------------+
            |                                                    v
+-----------v-----------+                     +--------------------------------------+
|  useFeaturePlaces     |                     |  RPC: v3_get_places_by_*             |
|  (Infinite Query)     |-------------------->|  (WHERE p_visited_only = TRUE)       |
+-----------------------+                     +--------------------------------------+
```

---

## 3. 상세 구현 내용

### 3.1 Database (SQL)

#### A. 카운트 전용 RPC (`v1_count_visited_in_feature`)
성능 최적화를 위해 장소 상세 정보 없이 `COUNT`와 `EXISTS`만 사용하여 전체/방문 수를 계산합니다.

```sql
-- 설계 구조
SELECT 
  COUNT(*) as total_count,
  COUNT(*) FILTER (WHERE EXISTS (
    SELECT 1 FROM tbl_visited v 
    WHERE v.user_id = auth.uid() AND v.place_id = target.place_id
  )) as visited_count
FROM target_table target;
```

#### B. 목록 필터링 파라미터 추가
기존 v3 API들에 `p_visited_only` 파라미터를 추가하여 쿼리 단계에서 필터링을 수행합니다.

```sql
-- 필터링 로직 (WHERE 절)
WHERE (
  NOT p_visited_only 
  OR EXISTS (
    SELECT 1 FROM tbl_visited v 
    WHERE v.user_id = auth.uid() AND v.place_id = base.place_id
  )
)
```

### 3.2 Frontend (React/TypeScript)

#### A. API 레이어 (`placeApi`)
각 요청 메서드에 `visitedOnly` 옵션을 추가하여 RPC 호출 시 전달합니다.

#### B. Query Hooks
- `useFeatureVisitedCount`: 페이지 상단 카운트 표시를 위한 별도 쿼리.
- `useFeaturePlaces`: `visitedOnly` 상태를 `queryKey`에 포함하여 상태 변경 시 새로운 페이징 데이터를 가져오도록 구현.

#### C. UI Components
- `VisitedFilterTab`: 전체/방문 탭 전환 및 카운트 표시.
- `FloatingViewToggleButton`: 리스트/지도 모드 전환.
- `Empty State`: 방문한 장소가 없을 때의 전용 안내 UI.

---

## 4. 성능 최적화 전략

1.  **Index 활용**: `tbl_visited(user_id, place_id)` 복합 인덱스를 사용하여 `EXISTS` 체크 속도를 극대화합니다.
2.  **Short-circuit Evaluation**: `p_visited_only`가 `FALSE`인 경우 `OR` 조건에 의해 `EXISTS` 서브쿼리 실행을 건너뜁니다.
3.  **병렬 데이터 페칭**: 카운트 API와 목록 API를 병렬로 호출하여 페이지 로딩 속도를 최적화합니다.
4.  **지도 데이터 필터링**: 지도 뷰(`mapPlaces`)에서도 현재 서버에서 필터링된 목록을 기준으로 마커를 표시하여 리스트와 지도의 일관성을 유지합니다.

---

## 5. 관련 파일 목록

- **SQL**:
    - `docs/sql/090_count_visited_in_feature.sql`
    - `docs/sql/091_add_visited_filter_to_v3_apis.sql`
- **Frontend**:
    - `src/entities/place/api.ts` & `queries.ts`
    - `src/entities/folder/api.ts` & `queries.ts`
    - `src/pages/FeatureDetailPage.tsx`
    - `src/pages/folder/FolderDetailPage.tsx`
    - `src/shared/ui/VisitedFilterTab.tsx`
