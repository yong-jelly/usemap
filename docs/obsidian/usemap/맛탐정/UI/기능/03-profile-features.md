생성일: 2026-03-03

# 프로필·마이페이지 관련 UI 기능

프로필 조회·편집·개인화 목록 이동.

## 프로필 수정하기

| 항목 | 내용 |
|------|------|
| **위치** | ProfileEditPage (/profile/edit) |
| **트리거** | 닉네임·소개·프로필 이미지 입력 후 "저장" |
| **결과** | tbl_user_profile 업데이트 |
| **전제** | 로그인 |
| **API** | v2_upsert_user_profile |
| **UX** | 닉네임 중복·길이 검증. 이미지 업로드 |

## 프로필 메뉴 이동

| 항목 | 내용 |
|------|------|
| **위치** | ProfileMenuSection |
| **트리거** | 메뉴 항목 클릭 |
| **결과** | 해당 경로로 이동 |
| **메뉴** | 최근(/profile/recent), 좋아요(/profile/liked), 콜렉션(/profile/folder), 저장(/profile/saved), 방문(/profile/visited), 내 리뷰(/profile/reviews), 구독(/profile/subscription), 구독자(/profile/subscribers), 분석(/profile/analysis) |

## 최근 보기

| 항목 | 내용 |
|------|------|
| **위치** | ProfilePage, RecentPlacesTab |
| **정의** | tbl_recent_view 기반 최근 본 장소 목록 |

## 좋아요 보기

| 항목 | 내용 |
|------|------|
| **위치** | LikedPlacesTab |
| **정의** | tbl_like (liked_type=place) 기반 장소 목록 |

## 콜렉션 보기

| 항목 | 내용 |
|------|------|
| **위치** | FolderCardList |
| **정의** | 내 폴더 목록. "+ 첫 폴더 만들기" |
| **UX** | 폴더 없을 때 empty 메시지 |

## 저장 보기

| 항목 | 내용 |
|------|------|
| **위치** | SavedPlacesTab |
| **정의** | tbl_save (saved_type=place) 기반 장소 목록 |

## 방문 보기

| 항목 | 내용 |
|------|------|
| **위치** | VisitedPlacesTab |
| **정의** | tbl_visited 기반 방문한 장소 목록 |

## 내 리뷰 보기

| 항목 | 내용 |
|------|------|
| **위치** | MyReviewsTab |
| **정의** | tbl_place_user_review 기반. 필터(전체/공개/비공개). 정렬(최신/별점) |
| **UX** | "방문한 장소에 대한 첫 리뷰를 남겨보세요!" empty |

## 구독 보기

| 항목 | 내용 |
|------|------|
| **위치** | SubscriptionList |
| **정의** | tbl_folder_subscribed 기반 구독 폴더 목록 |

## 구독자 보기

| 항목 | 내용 |
|------|------|
| **위치** | SubscriberList |
| **정의** | 나를 구독한 사용자 목록 |

## 분석 보기

| 항목 | 내용 |
|------|------|
| **위치** | AnalysisTab |
| **정의** | MyReviewsAnalysisCard, MyVisitRatioCard, RevisitAnalysisCard, MyPreferencesChart 등 리뷰·방문 통계 |

## 관련 문서

- [[00-feature-summary]]
- [[../구현/Function/03-user-functions]]
