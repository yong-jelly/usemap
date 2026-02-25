# CLI 도구 가이드 (tools/cli)

이 프로젝트에서 사용하는 주요 CLI 도구들의 명령어와 사용법입니다. 모든 명령어는 프로젝트 루트에서 `bun run`을 통해 실행합니다.

## 1. 장소 (Place) 관련

### 장소 상세 정보 크롤링
특정 네이버 장소 ID의 상세 정보를 크롤링하여 `tbl_place` 테이블에 저장합니다.
```bash
bun run tools/cli/place.ts <placeId1> <placeId2> ...
```
- 예시: `bun run tools/cli/place.ts 1279756975`

### 크롤링 대기열 처리
`tbl_place_queue` 테이블에 쌓인 대기열을 순차적으로 처리합니다.
```bash
bun run tools/cli/queue.ts [--batch=N] [--poll]
```
- `--batch=N`: 한 번에 처리할 개수 (기본값: 10)
- `--poll`: 처리할 데이터가 없어도 종료하지 않고 3초마다 확인
- 예시: `bun run tools/cli/queue.ts --batch=20 --poll`

---

## 2. 폴더 (Folder) 관련

### 네이버 공유 폴더 동기화
네이버 지도의 '저장' 폴더(공유 URL)를 분석하여 장소 목록을 DB와 동기화합니다.
```bash
bun run tools/cli/folder.ts <shareId_또는_URL> [--managed=true] [--filter-food=true]
bun run tools/cli/folder.ts --all
```
- `--managed=true`: 서비스 관리용 폴더로 표시
- `--filter-food=true`: 음식점 카테고리만 필터링하여 저장 (기본값: true)
- `--all`: DB에 등록된 모든 폴더를 일괄 최신화
- 예시: `bun run tools/cli/folder.ts https://naver.me/5R4ugqWr --managed=true`

### 사용자 폴더로 장소 임포트
네이버 공유 폴더의 장소들을 특정 사용자의 서비스 내 폴더(`tbl_folder`)로 가져옵니다.
```bash
bun run tools/cli/folder-user.ts <shareId_또는_URL> --user_id=<auth_user_id> --folder_id=<target_folder_id>
```
- 예시: `bun run tools/cli/folder-user.ts https://naver.me/xxx --user_id=user_123 --folder_id=folder_456`

---

## 3. 리뷰 (Review) 관련

### 사용자 리뷰 장소 목록 추출
특정 네이버 사용자의 MY플레이스 리뷰 목록에서 방문한 장소 ID들을 추출합니다.
```bash
bun run tools/cli/review.ts <userId>
```
- 예시: `bun run tools/cli/review.ts 5P8u9`
