생성일: 2026-03-03

# 장소 관련 UI 기능

장소 카드·상세에서 수행 가능한 모든 사용자 행동.

## 좋아요하기

| 항목 | 내용 |
|------|------|
| **위치** | PlaceCard, PlaceDetailModal 하단 액션 버튼 |
| **트리거** | 하트 아이콘 클릭 |
| **결과** | tbl_like 토글. is_liked 상태 변경. 빨간색 채움 |
| **전제** | 로그인 필요(비로그인 시 로그인 모달) |
| **API** | v1_toggle_like |
| **UX** | 낙관적 업데이트. 즉시 시각적 피드백 |

## 저장하기

| 항목 | 내용 |
|------|------|
| **위치** | PlaceCard, PlaceDetailModal 하단 액션 버튼 |
| **트리거** | 북마크 아이콘 클릭 |
| **결과** | tbl_save 토글. 저장 시 SaveToCollectionSheet(폴더 선택) 열림. toast "저장됨" + "컬렉션에 저장" 액션 |
| **전제** | 로그인 필요 |
| **API** | v1_toggle_save |
| **UX** | 저장 시 폴더 선택 시트로 연결 유도. PlaceCard에서 openSheetAfter 옵션 |

## 폴더에 저장하기 (내 폴더 저장)

| 항목 | 내용 |
|------|------|
| **위치** | FolderSelectionModal |

| **트리거** | 저장 버튼 클릭 시 시트 열림. 폴더 체크박스 토글 후 "저장" |
| **결과** | tbl_folder_place 추가/제거. 폴더별 장소 매핑 변경 |
| **전제** | 로그인, 내 폴더 존재 |
| **API** | v1_add_place_to_folder, v1_remove_place_from_folder |
| **UX** | "+ 폴더 만들기" 버튼으로 신규 폴더 생성 유도 |

## 리뷰 쓰기

| 항목 | 내용 |
|------|------|
| **위치** | PlaceDetailModal, PlaceActionSheet("리뷰 쓰기") |
| **트리거** | "리뷰 쓰기" 액션 또는 PlaceActionRow "리뷰 N" 클릭 |
| **결과** | ReviewForm 모달. 별점·내용·태그·이미지 입력. tbl_place_user_review 저장 |
| **전제** | 로그인 |
| **API** | v1_upsert_place_user_review |
| **UX** | 맛탐정 콘셉에선 소극적 기능. 출처 기반 발견 우선 |

## 다녀왔어요 (방문 기록)

| 항목 | 내용 |
|------|------|
| **위치** | PlaceDetailModal, PlaceActionSheet("다녀왔어요"), PlaceActionRow "다녀왔어요 N" |
| **트리거** | 버튼 클릭 → VisitHistoryModal |
| **결과** | 방문 기록 추가·수정·삭제. visited_at, companion, note |
| **전제** | 로그인 |
| **API** | v1_save_or_update_visited_place, v1_delete_visited_place |
| **UX** | "첫 방문 기록하기" CTA. 삭제 시 확인 다이얼로그 |

## 관련 콘텐츠 추가하기

| 항목 | 내용 |
|------|------|
| **위치** | PlaceActionSheet("관련 콘텐츠 추가"), ContentForm |
| **트리거** | 액션 시트에서 선택 → ContentForm에 URL 입력 → "저장" |
| **결과** | tbl_place_features에 유튜브/커뮤니티/인스타 링크 등록 |
| **전제** | 로그인 |
| **API** | v1_upsert_place_feature |
| **UX** | "콘텐츠 링크를 붙여넣으세요" placeholder. URL 파싱 후 자동 저장 |

## 댓글하기

| 항목 | 내용 |
|------|------|
| **위치** | PlaceDetailModal "댓글" 버튼 → PlaceCommentSheet |
| **트리거** | 댓글 작성·수정·삭제·좋아요 |
| **결과** | tbl_comment_for_place, tbl_comment_likes_for_place |
| **전제** | 로그인(작성·수정·삭제·좋아요) |
| **API** | v1_create_comment_for_place, v1_update_comment_for_place, v1_delete_place_comment, v1_toggle_comment_like_for_place |
| **UX** | 대댓글 지원. 댓글 수 PlaceActionRow에 표시 |

## 네이버 지도 보기

| 항목 | 내용 |
|------|------|
| **위치** | PlaceActionRow, PlaceDetailModal 하단 "네이버" 버튼 |
| **트리거** | 클릭 |
| **결과** | `https://map.naver.com/p/entry/place/{placeId}` 새 탭 |

## 출처 보기

| 항목 | 내용 |
|------|------|
| **위치** | PlaceSourceHighlight (장소 상세 내) |
| **트리거** | 출처 태그(유튜브, 폴더, 커뮤니티) 클릭 |
| **결과** | folder 타입 → /feature/detail/folder/{id} 이동. 그 외 → content_url 새 탭 |
| **UX** | 관심 계기 순서상 출처가 핵심. 출처 개수 PlaceActionRow에 표시 |

## 장소 상세 보기

| 항목 | 내용 |
|------|------|
| **위치** | PlaceCard, 피드 목록 등 |
| **트리거** | 카드 클릭 |
| **결과** | usePlacePopup으로 PlaceDetailModal 열림. URL 변경 없이 모달 |
| **UX** | 스크롤 위치 유지. 모달 내 탭: 메뉴, 리뷰, 출처 |

## 관련 문서

- [[00-feature-summary]]
- [[../구현/Function/01-place-functions]]
- [[../설계/07-engagement-flow]]
