생성일: 2026-03-03

# 폴더 관련 UI 기능

맛탐정 폴더(콜렉션) 생성·수정·관리·구독.

## 폴더 만들기

| 항목 | 내용 |
|------|------|
| **위치** | FolderCreatePage (/folder/create), FolderCreateModal, FolderCardList "+ 첫 폴더 만들기" |
| **트리거** | 제목·설명·권한(public/private/hidden/invite) 입력 후 "만들기" |
| **결과** | tbl_folder 생성. InviteCodeSuccessModal로 초대 코드 표시 |
| **전제** | 로그인 |
| **API** | v1_create_folder |
| **UX** | 권한별 아이콘(Globe, Lock, Ghost, Link). 초대 코드 24시간 만료 안내 |

## 폴더 수정하기

| 항목 | 내용 |
|------|------|
| **위치** | FolderSettingsSheet (DetailHeader "폴더 설정" → 열림) |
| **트리거** | 제목·설명 입력 후 "저장" |
| **결과** | tbl_folder 업데이트 |
| **전제** | 폴더 소유자 |
| **API** | v1_update_folder |

## 폴더 삭제하기

| 항목 | 내용 |
|------|------|
| **위치** | FeatureDetailPage (type=folder, 관리자). DetailHeader "삭제하기" |
| **트리거** | 삭제 버튼 → 확인 다이얼로그 "폴더 삭제" |
| **결과** | tbl_folder 삭제. 네이버 폴더는 v1_delete_naver_folder |
| **전제** | 관리자 권한 |
| **API** | v1_delete_place (place 폴더 아님), v1_delete_naver_folder |

## 폴더에서 장소 제거하기

| 항목 | 내용 |
|------|------|
| **위치** | FolderDetailPage, PlaceCommentForm "폴더 관리" → "폴더에서 제거" |
| **트리거** | 제거 확인 다이얼로그 "폴더에서 제거" |
| **결과** | tbl_folder_place에서 deleted_at 설정(소프트 삭제) |
| **전제** | 폴더 편집 권한 |
| **API** | v1_remove_place_from_folder |
| **UX** | "작성하신 메모는 다음에 다시 추가할 때를 위해 보관됩니다" 안내 |

## 메모 작성·수정 (폴더 내 장소)

| 항목 | 내용 |
|------|------|
| **위치** | PlaceCommentForm (폴더 상세 내 장소 카드) |
| **트리거** | 메모 입력 후 "저장" 또는 "메모 수정" |
| **결과** | tbl_folder_place.comment 업데이트 |
| **전제** | 폴더 편집 권한 |
| **API** | v1_add_place_to_folder (comment 포함) |

## 폴더 초대하기 (초대 코드 복사)

| 항목 | 내용 |
|------|------|
| **위치** | FolderCreateModal 완료 후 InviteCodeSuccessModal, FolderSettingsSheet |
| **트리거** | 복사 버튼 클릭 |
| **결과** | navigator.clipboard.writeText(invite_code) |
| **UX** | "24시간 후 만료됩니다" 안내. "폴더로 이동" |

## 리스트 수정하기

| 항목 | 내용 |
|------|------|
| **위치** | FolderListOptionsSheet (폴더 상세 옵션 메뉴) |
| **트리거** | "리스트 수정하기" 선택 |
| **결과** | FolderSettingsSheet 열림 |

## 공유하기

| 항목 | 내용 |
|------|------|
| **위치** | FolderListOptionsSheet, DetailHeader "공유하기" |
| **트리거** | 클릭 |
| **결과** | URL 클립보드 복사. Web Share API 시도 후 폴백 |

## 구독하기 (폴더)

| 항목 | 내용 |
|------|------|
| **위치** | DetailHeader, FolderCard, FeatureSubscribeButton |
| **트리거** | "구독" / "구독중" 버튼 클릭 |
| **결과** | tbl_folder_subscribed 토글 |
| **전제** | 로그인 |
| **API** | v1_toggle_folder_subscription |
| **UX** | 낙관적 업데이트. "구독중" 시 채워진 스타일 |

## 관련 문서

- [[00-feature-summary]]
- [[../구현/Function/02-folder-functions]]
