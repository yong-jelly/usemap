# 네이버 지도 폴더 임포트 CLI 설계서

이 문서는 네이버 지도 공유 폴더 데이터를 크롤링하여 시스템의 데이터베이스(`tbl_place`, `tbl_naver_folder`, `tbl_folder`)로 가져오는 CLI 도구의 설계 및 구성에 대해 설명합니다.

## 1. 시스템 구성도

```text
+-----------------------+      (1) Extract share_id      +-------------------------+
|   Naver Map URL/ID    | -----------------------------> |   CLI (folder-user.ts)  |
+-----------------------+                                +------------+------------+
                                                                      |
                                                                      | (2) API Request
                                                                      v
+-----------------------+      (3) JSON Data             +-------------------------+
|   Naver API Server    | -----------------------------> |   Shared Logic (API)    |
+-----------------------+                                +------------+------------+
                                                                      |
                                                                      | (4) Classify & Crawl
                                                                      v
+-----------------------+      (5) Sync Data             +-------------------------+
|   Supabase (PostgreSQL)| <---------------------------- |   Place Crawler         |
|   - tbl_place         |                                |   (place.ts)            |
|   - tbl_folder        |                                +-------------------------+
|   - tbl_folder_place  |
+-----------------------+
```

## 2. 모듈 구성

### 2.1 CLI 레이어
- **`tools/cli/folder.ts`**: 네이버 공유 폴더의 메타데이터와 장소 목록을 `tbl_naver_folder` 및 `tbl_naver_folder_place`에 동기화합니다. (시스템 관리용)
- **`tools/cli/folder-user.ts`**: 특정 사용자의 서비스 내 폴더(`tbl_folder`)에 네이버 공유 폴더의 장소들을 연결합니다. (사용자 데이터 임포트용)

### 2.2 비즈니스 로직 레이어 (Shared)
- **`tools/cli/folder-shared.ts`**:
    - `fetchFolderData`: 네이버 API를 호출하여 폴더 및 장소 목록 수집.
    - `classifyPlaces`: DB 존재 여부에 따라 신규 크롤링 대상 분류.
    - `syncFolderToDb`: 네이버 폴더 기본 정보 저장.

### 2.3 데이터 수집 레이어
- **`tools/cli/place.ts`**:
    - `crawlAndSyncPlaces`: 장소 ID 목록을 받아 상세 정보(좌표, 주소, 카테고리 등)를 크롤링하고 `tbl_place`에 저장.

## 3. 크롤링 구조 및 URL 패턴

### 3.1 URL 패턴 추출
시스템은 다음과 같은 형태의 입력에서 `shareId`를 추출합니다. (`tools/shared/utils.ts` 의 `extractShareId` 참고)
- **URL**: `https://map.naver.com/p/favorite/folder/shares/abc123xyz` -> `abc123xyz`
- **단축 URL**: `https://naver.me/p/favorite/folder/abc123xyz` -> `abc123xyz`
- **단순 ID**: `abc123xyz` -> `abc123xyz`

### 3.2 네이버 API 쿼리
폴더 데이터를 가져오기 위해 다음 엔드포인트를 사용합니다.
```text
https://pages.map.naver.com/save-pages/api/maps-bookmark/v3/shares/{shareId}/bookmarks?start=0&limit=5000&sort=lastUseTime&createIdNo=false
```

## 4. 데이터 플로우

1.  **인자 검증**: `share_id`, `user_id`, `folder_id` 필수 여부 확인.
2.  **사용자/폴더 확인**: `tbl_user_profile` 및 `tbl_folder`에 해당 ID가 존재하는지 `psql`로 선검증.
3.  **네이버 데이터 조회**: 공유 폴더의 공개 여부 및 장소 목록(SID) 획득.
4.  **장소 분류**:
    - `tbl_place`에 이미 있는 장소는 바로 연결 대상으로 분류.
    - 없는 장소는 `place.ts`를 통해 상세 크롤링 진행 후 `tbl_place`에 삽입.
5.  **관계 연결**:
    - `tbl_folder_place` 테이블에 `(folder_id, user_id, place_id)` 쌍을 `INSERT`.
    - 이미 존재하는 관계는 스킵 (`ON CONFLICT DO NOTHING`).

## 5. 사용법

### 5.1 시스템 관리용 (네이버 폴더 정보 동기화)
```bash
bun run tools/cli/folder.ts <shareId_또는_URL>
```

### 5.2 사용자 폴더 임포트
```bash
bun run tools/cli/folder-user.ts <shareId_또는_URL> --user_id=<auth_user_id> --folder_id=<target_folder_id>
```

## 6. 주요 데이터베이스 쿼리

### 6.1 장소 존재 확인
```sql
SELECT id FROM public.tbl_place WHERE id = ANY(ARRAY['sid1', 'sid2', ...]);
```

### 6.2 사용자 및 폴더 검증
```sql
-- 사용자 존재 확인
SELECT 1 FROM public.tbl_user_profile WHERE auth_user_id = 'uuid';

-- 폴더 존재 및 소유자 확인
SELECT 1 FROM public.tbl_folder WHERE id = 'folder_id' AND owner_id = 'uuid';
```

### 6.3 장소 연결 (Insert Only)
```sql
INSERT INTO public.tbl_folder_place (folder_id, user_id, place_id)
VALUES ('f1', 'u1', 'p1')
ON CONFLICT (folder_id, user_id, place_id) DO NOTHING;
```
