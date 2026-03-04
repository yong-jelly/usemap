생성일: 2026-03-04

# tools/cli 상세 문서

usemap 프로젝트의 CLI 도구 모음임. 네이버 장소·폴더·리뷰 크롤링 및 DB 동기화를 수행함.

## 1. 개요

```text
tools/
├── cli/
│   ├── search.ts       # 네이버 검색 → 폴더 저장
│   ├── place.ts        # 장소 상세 크롤링
│   ├── folder.ts       # 네이버 공유 폴더 동기화 (tbl_naver_folder)
│   ├── folder-shared.ts # 폴더 공통 로직
│   ├── folder-user.ts  # 네이버 폴더 → 서비스 사용자 폴더 임포트
│   ├── queue.ts        # 장소 크롤링 대기열 처리
│   └── review.ts       # MY플레이스 리뷰 목록 추출
└── shared/
    ├── db.ts           # PostgreSQL 연결
    ├── api.ts          # Axios + 재시도
    ├── utils.ts        # 유틸리티
    └── types.ts        # 타입 정의
```

실행 환경: `bun` (Bun 런타임 사용)

## 2. CLI 도구별 상세

### 2.1 search.ts — 네이버 검색 → 폴더 저장

네이버 장소 검색 API로 결과를 조회하고, 지정 폴더에 장소를 추가함.

| 항목 | 내용 |
|------|------|
| 사용법 | `bun run tools/cli/search.ts <folder_id> <검색어> [--test]` |
| 옵션 | `--test` : 시뮬레이션 모드 (DB 변경 없음) |
| 의존 | `place.ts` (crawlAndSyncPlaces), `shared/db`, `shared/api` |

**처리 흐름**

```text
[1] 폴더 검증 → [2] 사용자 정보 조회 → [3] 네이버 검색 (페이징)
    → [4] 기존 DB 확인 → [5] 신규 장소 크롤링 → [6] 폴더-장소 관계 INSERT
    → [7] place_count 갱신
```

**예시**

```bash
# 시뮬레이션 (DB 변경 없음)
bun run tools/cli/search.ts 0e4e7d8e-0e51-4cdc-9dfb-06b6a9b58f3e 천하제빵 --test

# 실제 실행
bun run tools/cli/search.ts 0e4e7d8e-0e51-4cdc-9dfb-06b6a9b58f3e 천하제빵
```

**관련 테이블**: `tbl_folder`, `tbl_folder_place`, `tbl_place`, `tbl_user_profile`

---

### 2.2 place.ts — 장소 상세 크롤링

네이버 GraphQL API로 장소 상세 정보를 크롤링하여 `tbl_place`에 저장함.

| 항목 | 내용 |
|------|------|
| 사용법 | `bun run tools/cli/place.ts <placeId1> [placeId2 ...]` |
| 익스포트 | `crawlForPlace`, `crawlAndSyncPlaces` (다른 CLI에서 호출) |

**저장 필드**: id, name, road, category, address, phone, x, y, homepage, menus, images 등

**제외 카테고리**: `227616`, `227755`, `227813`, `227815` (비음식점)

---

### 2.3 folder.ts — 네이버 공유 폴더 동기화

네이버 지도 '저장' 폴더(공유 URL)를 분석하여 `tbl_naver_folder`, `tbl_naver_folder_place`와 동기화함.

| 항목 | 내용 |
|------|------|
| 사용법 1 | `bun run tools/cli/folder.ts <shareId_또는_URL> [--managed=true] [--filter-food=true]` |
| 사용법 2 | `bun run tools/cli/folder.ts --all` |
| 옵션 | `--managed=true/false` : 관리 폴더 여부 (기본: false) |
| 옵션 | `--filter-food=true/false` : 비음식점 제외 (기본: true) |

**예시**

```bash
bun run tools/cli/folder.ts 5cbc15faec91402eaf098041df3b1d38
bun run tools/cli/folder.ts --all --filter-food=true
```

**관련 테이블**: `tbl_naver_folder`, `tbl_naver_folder_place`, `tbl_place`

---

### 2.4 folder-user.ts — 네이버 폴더 → 서비스 폴더 임포트

네이버 공유 폴더의 장소를 특정 사용자의 서비스 내 폴더(`tbl_folder`)로 임포트함.

| 항목 | 내용 |
|------|------|
| 사용법 | `bun run tools/cli/folder-user.ts <shareId_또는_URL> --user_id=<auth_user_id> --folder_id=<target_folder_id>` |

**처리 흐름**

```text
[1] 네이버 폴더 유효성 검사 → [2] 사용자 ID 검사 → [3] 폴더 ID/소유 검사
    → [4] 장소 크롤링 → [5] 폴더-장소 관계 Insert Only → [6] place_count 갱신
```

**관련 테이블**: `tbl_folder`, `tbl_folder_place`, `tbl_place`, `tbl_user_profile`

---

### 2.5 queue.ts — 장소 크롤링 대기열

`tbl_place_queue`의 PENDING 항목을 배치 단위로 크롤링 처리함.

| 항목 | 내용 |
|------|------|
| 사용법 | `bun run tools/cli/queue.ts [--batch=N] [--poll]` |
| 옵션 | `--batch=N` : N개씩 bulk 처리 (기본: 10) |
| 옵션 | `--poll` : 데이터 없을 때 3초마다 폴링 대기 |

**상태 흐름**: PENDING → PROCESSING → SUCCESS / FAILED / STOPPED

**관련 테이블**: `tbl_place_queue`, `tbl_crw_log`, `tbl_place`

---

### 2.6 review.ts — MY플레이스 리뷰 목록 추출

네이버 MY플레이스 사용자의 공개 리뷰 목록에서 장소 ID·이름을 추출함.

| 항목 | 내용 |
|------|------|
| 사용법 | `bun run tools/cli/review.ts <userId>` |

**출력**: 장소 ID, 이름 목록 (DB 저장 없음, 로그만 출력)

---

## 3. 공통 의존성

| 모듈 | 역할 |
|------|------|
| `shared/db` | PostgreSQL 연결 (`postgres` 패키지), `sql`, `toSqlArray`, `toDate` |
| `shared/api` | `apiClient`, `requestWithRetry` (지수 백오프) |
| `shared/utils` | `chunkArray`, `sleep`, `resolveShareId` |
| `shared/types` | `PlaceDetail`, `Bookmark`, `FolderInfo` |

## 4. 사전 조건

- Bun 설치 (`bun` 명령어 사용 가능)
- `DATABASE_URL` 환경 변수 또는 `shared/db.ts` 기본 연결 문자열
- 네이버 API 접근 가능 (pcmap-api.place.naver.com, pages.map.naver.com 등)

## 5. 관련 문서

- [[맛탐정/구현/모델링/README|데이터 모델링]]
- [[맛탐정/구현/Function/README|Supabase 함수]]
