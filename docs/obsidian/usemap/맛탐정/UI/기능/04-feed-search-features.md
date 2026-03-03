생성일: 2026-03-03

# 피드·검색·탐색 관련 UI 기능

홈, 피드, 검색, 탐색 페이지의 사용자 행동.

## 탭 전환하기 (홈)

| 항목 | 내용 |
|------|------|
| **위치** | HomePage MainHeader |
| **트리거** | "추천" / "소스" / "구독" 탭 클릭 |
| **결과** | view 파라미터 변경. recommend, source, feed |
| **UX** | 구독 탭 비로그인 시 "로그인이 필요해요" + 로그인하기 |

## 정렬하기 (피드·홈)

| 항목 | 내용 |
|------|------|
| **위치** | HomePage, FeedPage |
| **트리거** | sort 파라미터. recent(최신순), distance(거리순) |
| **결과** | v6_get_my_feed 등 p_sort_by 적용. 거리순 시 p_user_lat, p_user_lng 필요 |
| **UX** | 거리순은 위치 설정 필요. LocationGuideBox "위치 설정하기" |

## 위치 설정하기

| 항목 | 내용 |
|------|------|
| **위치** | LocationSettingSheet (홈 위치 브리핑 클릭 시) |
| **트리거** | "현재 위치 저장" 또는 저장된 위치 선택 |
| **결과** | tbl_location 저장. getCurrentLocation 또는 선택한 위치 |
| **전제** | 로그인 |
| **API** | v1_save_user_location, v1_delete_user_location |
| **UX** | "거리순 정렬을 위해 위치 정보를 설정해주세요" |

## 검색하기

| 항목 | 내용 |
|------|------|
| **위치** | SearchPage, ExplorePage |
| **트리거** | 검색어 입력 후 검색 버튼 또는 엔터 |
| **결과** | v2_list_places_by_filters (검색어 포함) 또는 Edge Function graph-search-place |
| **UX** | placeholder "지역과 음식점 검색" / "장소, 메뉴, 지역 검색" |

## 필터 적용하기

| 항목 | 내용 |
|------|------|
| **위치** | FilterBottomSheet (검색, 탐색) |
| **트리거** | 지역(group1, group2, group3), 카테고리, 테마, 가격 등 선택 |
| **결과** | p_group1, p_group2, p_category, p_theme_codes 등으로 API 호출 |
| **UX** | 활성 필터 개수 표시. "조건 초기화" |

## 지역 선택하기

| 항목 | 내용 |
|------|------|
| **위치** | DistrictChips (탐색), RegionSelector (랭킹) |
| **트리거** | 지역 칩 클릭 |
| **결과** | group1(시도), group2(구/군) 필터 적용 |

## 최근 검색어 삭제하기

| 항목 | 내용 |
|------|------|
| **위치** | SearchPage, ExplorePage 검색 모드 |
| **트리거** | "전체 삭제" 클릭 |
| **결과** | tbl_search_history 또는 로컬 저장 검색 이력 삭제 |

## 검색 종료하기

| 항목 | 내용 |
|------|------|
| **위치** | ExplorePage |
| **트리거** | "검색 종료" 버튼 |
| **결과** | 검색 모드 해제. 필터 결과 또는 기본 뷰로 복귀 |

## 조건 초기화

| 항목 | 내용 |
|------|------|
| **위치** | ExplorePage, SearchPage (검색 결과 없음 시) |
| **트리거** | "조건 초기화" / "지역 선택하기" |
| **결과** | 필터 상태 DEFAULT로 리셋 |

## 발견하기 (소스 탐색)

| 항목 | 내용 |
|------|------|
| **위치** | DiscoverGrid (홈), FeaturePage |
| **트리거** | 네이버 폴더·유튜브 채널·커뮤니티·맛탐정 폴더 카드 클릭 |
| **결과** | /feature/detail/{type}/{id} 이동 |

## 탐색하기 (홈 → 맛탐정)

| 항목 | 내용 |
|------|------|
| **위치** | HomePage (구독 empty 시) |
| **트리거** | "탐색하기" 버튼 |
| **결과** | /feature 이동 |

## 테마·지역 선택 (랭킹)

| 항목 | 내용 |
|------|------|
| **위치** | RankingPage. ThemeSelector, RegionSelector |
| **트리거** | 테마(food_good 등), 지역(전국/시도) 선택 |
| **결과** | tbl_theme_top_places, tbl_place 조회 |

## 관련 문서

- [[00-feature-summary]]
- [[../구현/Function/04-feed-functions]]
