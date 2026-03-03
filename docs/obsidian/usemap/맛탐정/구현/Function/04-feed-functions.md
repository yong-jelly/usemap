생성일: 2026-03-03

# Feed 도메인 함수

피드, 소스별 장소 목록, 네이버/유튜브/커뮤니티/소셜.

## 피드

| 함수 | 인자 | 반환 | 설명 |
|------|------|------|------|
| v1_get_my_feed | p_limit, p_offset [, p_price_min, p_price_max] | TABLE | 내 피드. 오버로드 2개 |
| v2_get_my_feed | p_limit, p_offset, p_price_min, p_price_max, p_cursor_timestamp | TABLE | 커서 페이지네이션 |
| v3_get_my_feed | + p_sort_by, p_user_lat, p_user_lng | TABLE | 거리순 정렬 |
| v4_get_my_feed | v3와 동일 | TABLE | v4 |
| v4_get_my_feed_test | p_user_id 추가 | TABLE | 테스트용 |
| v5_get_my_feed | v4와 동일 | TABLE | v5 |
| v6_get_my_feed | + p_max_distance_km (기본 5.0) | TABLE | 거리 제한 |
| v1_get_public_feed | p_source_type | TABLE | 공개 피드. folder, naver_folder, youtube_channel, community_region |
| v1_get_subscription_feed | p_limit, p_offset | TABLE | 구독 피드 |
| v1_refresh_place_feed | - | void | 피드 갱신 |

## 네이버 폴더

| 함수 | 인자 | 반환 | 설명 |
|------|------|------|------|
| v2_get_naver_folders | p_limit, p_offset | TABLE | 폴더 목록. preview_places, place_count |
| v2_get_naver_folder_info | p_folder_id bigint | TABLE | 상세. is_subscribed |
| v2_get_places_by_naver_folder | p_folder_id, p_limit, p_offset | TABLE | 폴더 내 장소 |
| v3_get_places_by_naver_folder | + p_visited_only | TABLE | 방문 필터 |
| v1_get_naver_folder_places_for_map | p_folder_id bigint | TABLE | 지도용 |
| v2_get_places_by_naver_folder_for_map | p_folder_id bigint | TABLE | 지도용 |
| v1_get_nfolder_channels | - | TABLE | 네이버 폴더 채널 |
| v1_delete_naver_folder | p_folder_id bigint | json | 삭제(관리자) |

## 유튜브

| 함수 | 인자 | 반환 | 설명 |
|------|------|------|------|
| v1_get_youtube_channels | - | TABLE | 채널 목록 |
| v2_get_youtube_channels | p_limit, p_offset | TABLE | v2. preview_places |
| v2_get_youtube_channel_info | p_channel_id text | TABLE | 채널 상세. is_subscribed |
| v2_get_places_by_youtube_channel | p_channel_id, p_limit, p_offset | TABLE | 채널 장소 |
| v3_get_places_by_youtube_channel | + p_visited_only | TABLE | 방문 필터 |
| v2_get_places_by_youtube_channel_for_map | p_channel_id | TABLE | 지도용 |

## 커뮤니티

| 함수 | 인자 | 반환 | 설명 |
|------|------|------|------|
| v2_get_community_contents | p_domain, p_limit, p_offset | TABLE | 소스 목록. region_name, place_count, preview_contents |
| v3_get_community_contents | p_domain, p_limit, p_offset | TABLE | v3 |
| v2_get_community_region_info | p_region_name text | TABLE | 지역 정보 |
| v2_get_places_by_community_region | p_region_name, p_domain, p_limit, p_offset | TABLE | 지역 장소 |
| v3_get_places_by_community_region | + p_visited_only | TABLE | 방문 필터 |
| v2_get_places_by_community_region_for_map | p_region_name, p_domain | TABLE | 지도용 |

## 소셜(인스타)

| 함수 | 인자 | 반환 | 설명 |
|------|------|------|------|
| v3_get_social_contents | p_service, p_limit, p_offset | TABLE | 소셜 소스 목록 |
| v2_get_social_region_info | p_region_name text | TABLE | 지역 정보 |
| v3_get_places_by_social_region | p_region_name, p_service, p_limit, p_offset, p_visited_only | TABLE | 지역 장소 |

## 지역 통합

| 함수 | 인자 | 반환 | 설명 |
|------|------|------|------|
| v2_get_region_contents | p_source, p_limit, p_offset | TABLE | 지역 소스. mv_region_contents |
| v2_get_region_info | p_region_name, p_source | TABLE | 지역 정보. is_subscribed, subscriber_count |
| v2_get_places_by_region | p_region_name, p_source, p_limit, p_offset | TABLE | 지역 장소. src 포함 |
| v3_get_places_by_region | + p_visited_only | TABLE | 방문 필터 |
| v2_get_places_by_region_for_map | p_region_name, p_source | TABLE | 지도용 |

## 소스 내 방문 수

| 함수 | 인자 | 반환 | 설명 |
|------|------|------|------|
| v1_count_visited_in_feature | p_feature_type, p_feature_id, p_domain, p_source | TABLE | total_count, visited_count |

## 관련 문서

- [[00-function-summary]]
- [[../모델링/04-feed-source-domain|Feed·Source 도메인 테이블]]
