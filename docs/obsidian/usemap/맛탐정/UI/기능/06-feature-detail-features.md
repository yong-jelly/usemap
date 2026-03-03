생성일: 2026-03-03

# 소스 상세 관련 UI 기능

유튜브 채널, 네이버 폴더, 커뮤니티, 맛탐정 폴더 상세 페이지.

## 구독하기 (소스)

| 항목 | 내용 |
|------|------|
| **위치** | FeatureDetailPage. DetailHeader, FeatureSubscribeButton |
| **트리거** | "구독" / "구독중" 버튼 클릭 |
| **결과** | tbl_feature_subscription 토글. feature_type, feature_id |
| **전제** | 로그인 |
| **API** | v1_toggle_feature_subscription |
| **UX** | 낙관적 업데이트. "구독중" 시 채워진 스타일 |

## 공유하기

| 항목 | 내용 |
|------|------|
| **위치** | DetailHeader "공유하기" |
| **트리거** | 클릭 |
| **결과** | navigator.share 또는 clipboard.writeText. 현재 URL 공유 |
| **UX** | 공유 실패 시 클립보드 복사 폴백 |

## 지도 보기

| 항목 | 내용 |
|------|------|
| **위치** | FeatureDetailPage "네이버 지도에서 보기" |
| **트리거** | 클릭 |
| **결과** | 네이버 지도 URL 또는 /map (준비 중) |
| **UX** | "네이버 지도에서 보기" 라벨 |

## 삭제하기 (관리자)

| 항목 | 내용 |
|------|------|
| **위치** | DetailHeader (type=folder, isAdmin) |
| **트리거** | "삭제하기" → 확인 다이얼로그 "폴더 삭제" |
| **결과** | v1_delete_naver_folder 또는 폴더 삭제 |
| **전제** | 관리자 |

## 폴더 설정

| 항목 | 내용 |
|------|------|
| **위치** | DetailHeader (type=folder, isOwner) |
| **트리거** | "폴더 설정" 버튼 |
| **결과** | FolderSettingsSheet 열림 |

## 방문 필터 (visited_only)

| 항목 | 내용 |
|------|------|
| **위치** | FeatureDetailPage. VisitedFilterTab |
| **트리거** | "전체" / "방문한 곳만" 탭 |
| **결과** | p_visited_only=true로 장소 목록 재조회 |
| **API** | v3_get_places_by_* (visited_only 파라미터) |

## 장소 카드 클릭 (소스 상세 내)

| 항목 | 내용 |
|------|------|
| **위치** | FeatureDetailPage 장소 목록 |
| **트리거** | PlaceCard 클릭 |
| **결과** | usePlacePopup으로 PlaceDetailModal 열림 |

## 인스타 파서: 콘텐츠 저장

| 항목 | 내용 |
|------|------|
| **위치** | InstagramParserPage |
| **트리거** | 파싱된 콘텐츠 "저장" 버튼 |
| **결과** | v1_set_insta_contents 벌크 저장 |
| **API** | v1_set_insta_contents |

## 인스타 파서: 장소 매핑

| 항목 | 내용 |
|------|------|
| **위치** | InstagramParserPage |
| **트리거** | 콘텐츠에 장소 연결/해제 |
| **결과** | v1_add_instagram_places, v1_remove_instagram_place |
| **API** | v1_add_instagram_places, v1_remove_instagram_place |

## 인스타 파서: 숨김 설정

| 항목 | 내용 |
|------|------|
| **위치** | InstagramParserPage |
| **트리거** | is_hidden 토글 |
| **결과** | v1_set_insta_content_hidden |

## 관련 문서

- [[00-feature-summary]]
- [[../구현/Function/04-feed-functions]]
- [[../구현/Function/05-instagram-functions]]
