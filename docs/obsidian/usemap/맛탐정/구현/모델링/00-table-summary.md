생성일: 2026-03-03

# 테이블 요약

public 스키마 테이블·뷰·물리뷰 목록 및 한 줄 정의.

## 테이블 목록 (표)

| 테이블명 | 정의 | 도메인 |
|----------|------|--------|
| tbl_place | 네이버 플레이스 기반 장소 마스터. id=네이버 business_id | Place |
| tbl_place_info | 장소 상세 정보(주소, 편의시설, 결제 등) | Place |
| tbl_place_menu | 메뉴 정보 | Place |
| tbl_place_analysis | 네이버 리뷰 분석·테마·투표 집계 | Place |
| tbl_place_features | 출처(유튜브 등)와 장소 연결. 사용자 직접 등록 포함 | Place |
| tbl_place_feed_group | 홈 피드용 장소 그룹·스코어링 | Place |
| tbl_place_queue | 장소 등록 대기열(크롤링 큐) | Place |
| tbl_place_bucket | 커뮤니티 링크→장소 매핑 원본 | Place |
| tbl_place_user_review | 맛탐정 사용자 리뷰 | Place |
| tbl_place_user_review_tag_map | 리뷰-태그 매핑 | Place |
| tbl_place_tag | 태그 마스터-장소 매핑 | Place |
| tbl_place_view_stats | 장소 조회 통계(시간별) | Place |
| tbl_place_review | (레거시) 네이버 리뷰 원본 | Place |
| tbl_place_review_image | 네이버 리뷰 이미지 | Place |
| tbl_place_review_voted | 네이버 리뷰 투표 | Place |
| tbl_place_review_voted_summary | 네이버 리뷰 투표 요약 | Place |
| tbl_place_review_tag_master | 리뷰 태그 마스터 | Place |
| tbl_folder | 맛탐정 폴더(콜렉션) | Folder |
| tbl_folder_place | 폴더-장소 매핑 | Folder |
| tbl_folder_subscribed | 폴더 구독 | Folder |
| tbl_folder_invite_history | 폴더 초대 이력 | Folder |
| tbl_folder_review | 폴더 내 장소 리뷰 | Folder |
| tbl_naver_folder | 네이버 지도 폴더 | Source |
| tbl_naver_folder_place | 네이버 폴더-장소 매핑 | Source |
| tbl_instagram_user | 인스타그램 사용자 | Source |
| tbl_instagram_content | 인스타그램 콘텐츠 | Source |
| tbl_instagram_place | 인스타 콘텐츠-장소 매핑 | Source |
| tbl_collect_place | 커뮤니티(다모앙 등) 수집 글 | Source |
| tbl_user | (레거시) OAuth 사용자 | User |
| tbl_user_profile | 사용자 프로필(auth 연동) | User |
| tbl_location | 사용자 위치 기록 | User |
| tbl_like | 좋아요 | User |
| tbl_save | 저장(콜렉션) | User |
| tbl_visited | 방문 기록 | User |
| tbl_recent_view | 최근 본 장소 | User |
| tbl_comment_for_place | 장소 댓글 | User |
| tbl_comment_likes_for_place | 댓글 좋아요 | User |
| tbl_feature_subscription | 소스(유튜브 등) 구독 | User |
| tbl_action_history | 액션 로그 | Aux |
| tbl_search_history | 검색 이력 | Aux |
| tbl_bucket | 키-값 저장소 | Aux |
| tbl_crw_log | 크롤러 로그 | Aux |
| tbl_tag_master_for_place | 장소 태그 마스터 | Aux |
| tbl_tag_history | 태그 변경 이력 | Aux |
| tbl_review_images | 리뷰 이미지(사용자 리뷰) | Place |
| tbl_theme_top_places | 테마별 상위 장소 랭킹 | Place |
| tbl_common_gender | 성별 공통코드 | Aux |
| tbl_common_age_group | 연령대 공통코드 | Aux |
| categories | 이벤트 카테고리 | Aux |
| events | 이벤트 | Aux |
| sources | 이벤트 소스 | Aux |
| location_candidates | 이벤트 위치 후보 | Aux |
| existing_data | 기존 데이터 마이그레이션 | Aux |
| ledger_data | 가계부 | Aux |

## 뷰·물리뷰

| 이름 | 타입 | 정의 |
|------|------|------|
| v_tbl_place_features | VIEW | tbl_place_features ∪ tbl_naver_folder_place (출처 통합) |
| mv_place_theme_scores | MATERIALIZED | tbl_place.visitor_review_stats에서 테마별 count 추출 |
| mv_public_feed | MATERIALIZED | 피드 소스 통합(폴더, 네이버, 유튜브, 커뮤니티) |
| mv_region_contents | MATERIALIZED | 지역별 콘텐츠 |

## 관련 문서

- [[01-place-domain]] - [[02-folder-domain]] - [[03-user-domain]] - [[04-feed-source-domain]] - [[05-auxiliary]] - [[06-io-mapping]]
