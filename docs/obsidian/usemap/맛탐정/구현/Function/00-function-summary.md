생성일: 2026-03-03

# 함수 요약

public 스키마 RPC 함수 전체 목록. 트리거 함수(update_updated_at_column, handle_new_user) 제외.

## 함수 목록 (표)

| 함수명 | 인자 요약 | 반환 | 기능 |
|--------|-----------|------|------|
| calculate_menu_avg_price | menu_data jsonb | int | 메뉴 평균 가격 계산 |
| check_user_profile_exists | - | SETOF tbl_user_profile | 프로필 존재 여부 |
| create_user_profile | p_nickname, p_bio, p_profile_image_url | json | 프로필 생성 |
| generate_response | p_data, p_function, p_code, p_message, p_params, p_execution_time | json | 표준 API 응답 생성 |
| get_current_time | - | timestamptz | 현재 시각 |
| get_user_group1_aggregation | p_user_id | TABLE | 사용자 지역 집계 |
| get_user_profile | - | SETOF tbl_user_profile | 내 프로필 |
| get_user_profile_by_id | p_public_profile_id | SETOF tbl_user_profile | 공개ID로 프로필 |
| search_profiles_by_nickname | p_nickname, p_limit | SETOF tbl_user_profile | 닉네임 검색 |
| update_user_profile | p_nickname, p_bio, p_profile_image_url | json | 프로필 수정 |
| v1_add_instagram_places | p_content_id, p_place_ids | void | 인스타 콘텐츠에 장소 매핑 |
| v1_add_place_to_folder | p_folder_id, p_place_id, p_comment | boolean | 폴더에 장소 추가 |
| v1_add_tag | p_business_id, p_tag_id | tbl_place_tag | 장소에 태그 추가 |
| v1_aggr_combine_place_features | recreation | TABLE | place_features 버킷 집계 |
| v1_aggr_combine_user_places | p_user_id, recreation | TABLE | 사용자 장소 버킷 집계 |
| v1_aggr_place_features_all_stats | - | TABLE | place_features 전체 통계 |
| v1_aggr_place_features_by_group_stats | - | TABLE | 플랫폼별·지역별 통계 |
| v1_aggr_review_user_places | p_user_id | jsonb | 리뷰 기반 사용자 장소 집계 |
| v1_aggr_user_places_categorized_stats | p_user_id | TABLE | 카테고리별 집계 |
| v1_aggr_user_places_region_stats | p_user_id | TABLE | 지역별 집계 |
| v1_check_folder_access | p_folder_id | TABLE | 폴더 접근 권한 |
| v1_common_place_features | p_place_id | jsonb | 장소 출처 요약 |
| v1_common_place_interaction | p_place_id | jsonb | 좋아요/저장/댓글/방문 등 |
| v1_count_visited_in_feature | p_feature_type, p_feature_id, p_domain, p_source | TABLE | 소스 내 방문 수 |
| v1_create_comment_for_place | p_business_id, p_content, p_title, p_image_paths, p_parent_comment_id, p_comment_level | TABLE | 댓글 작성 |
| v1_create_folder | p_title, p_description, p_permission, p_permission_write_type | TABLE | 폴더 생성 |
| v1_deactivate_comment_for_place | p_comment_id | boolean | 댓글 비활성화 |
| v1_delete_naver_folder | p_folder_id | json | 네이버 폴더 삭제 |
| v1_delete_place | p_place_id | json | 장소 삭제(관리자) |
| v1_delete_place_comment | p_comment_id | boolean | 댓글 삭제 |
| v1_delete_place_feature | p_feature_id | TABLE | 출처 삭제 |
| v1_delete_place_user_review | p_review_id | boolean | 사용자 리뷰 삭제 |
| v1_delete_user_location | p_location_id | boolean | 위치 삭제 |
| v1_delete_visited_place | p_visit_id | jsonb | 방문 기록 삭제 |
| v1_ensure_default_folder | - | boolean | 기본 폴더 생성 |
| v1_get_admin_configs | - | TABLE | 관리자 설정 |
| v1_get_bot_statuses | - | TABLE | 봇 상태 |
| v1_get_comment_count_for_place | p_business_id | bigint | 댓글 수 |
| v1_get_comments_for_place | p_business_id, p_limit, p_offset | TABLE | 댓글 목록 |
| v1_get_event_with_sources | p_event_id | jsonb | 이벤트+소스 |
| v1_get_folder_info | p_folder_id | TABLE | 폴더 상세 |
| v1_get_folder_places | p_folder_id, p_limit, p_offset, p_visited_only | TABLE | 폴더 내 장소 |
| v1_get_folder_places_for_map | p_folder_id | TABLE | 지도용 장소(좌표) |
| v1_get_folder_reviews | p_folder_id, p_place_id | TABLE | 폴더 리뷰 |
| v1_get_hidden_gem_reviews | p_limit, p_offset | json | 히든젬 리뷰 |
| v1_get_insta_content_list | p_user_id, p_is_place, p_page, p_page_size, p_show_hidden | TABLE | 인스타 콘텐츠 목록 |
| v1_get_insta_user_list | p_page, p_page_size | TABLE | 인스타 유저 목록 |
| v1_get_interaction_info | p_id, p_type | jsonb | 인터랙션 정보 |
| v1_get_invite_history | p_folder_id | TABLE | 초대 이력 |
| v1_get_latest_reviews | p_limit, p_offset | json | 최신 리뷰 |
| v1_get_my_bookmarked_places | p_limit, p_offset | TABLE | 저장한 장소 |
| v1_get_my_feed | p_limit, p_offset [, p_price_min, p_price_max] | TABLE | 내 피드 |
| v1_get_my_liked_places | p_limit, p_offset | TABLE | 좋아요한 장소 |
| v1_get_my_liked_reviews | p_limit, p_offset | json | 좋아요한 리뷰 |
| v1_get_my_recent_places | p_limit, p_offset | jsonb | 최근 장소 |
| v1_get_my_recent_view_places | p_limit, p_offset | TABLE | 최근 본 장소 |
| v1_get_my_reviews_counts | - | TABLE | 내 리뷰 통계 |
| v1_get_naver_folder_places_for_map | p_folder_id | TABLE | 네이버 폴더 지도용 |
| v1_get_nfolder_channels | - | TABLE | 네이버 폴더 채널 |
| v1_get_place_analysis | p_place_id | jsonb | 장소 분석(테마 등) |
| v1_get_place_by_id | p_business_id | jsonb | 장소 단건 |
| v1_get_place_by_id_with_set_recent_view | p_business_id | jsonb | 장소+최근본 기록 |
| v1_get_place_details | p_place_id | jsonb | 장소 상세(인터랙션 포함) |
| v1_get_place_experience | p_place_id | jsonb | 장소 경험 객체 |
| v1_get_place_features | p_business_id, p_limit, p_offset | TABLE | 장소 출처 목록 |
| v1_get_place_reviews | p_place_id, p_limit | jsonb | 네이버 리뷰 |
| v1_get_place_user_review | p_review_id | TABLE | 사용자 리뷰 단건 |
| v1_get_place_visit_stats | p_place_id | jsonb | 방문 통계 |
| v1_get_popularity_reviews | p_limit, p_offset | json | 인기 리뷰 |
| v1_get_public_feed | p_source_type | TABLE | 공개 피드 |
| v1_get_recent_events | - | jsonb | 최근 이벤트 |
| v1_get_recent_places | p_limit, p_offset | jsonb | 최근 장소 |
| v1_get_recent_reviews_with_place | p_limit, p_offset | json | 최근 리뷰+장소 |
| v1_get_regular_customer_reviews | p_limit, p_offset | json | 단골 리뷰 |
| v1_get_seasonal_reviews | p_limit, p_offset | json | 시즌 리뷰 |
| v1_get_subscription_feed | p_limit, p_offset | TABLE | 구독 피드 |
| v1_get_tags | - | SETOF | 태그 마스터 |
| v1_get_user_locations | p_limit | TABLE | 내 위치 목록 |
| v1_get_user_profile | - | SETOF | 내 프로필 |
| v1_get_user_tags | p_business_id | SETOF | 장소 태그 |
| v1_get_visited_place | p_place_id | jsonb | 방문 기록 |
| v1_get_youtube_channels | - | TABLE | 유튜브 채널 |
| v1_has_visited_place | p_place_id | boolean | 방문 여부 |
| v1_hide_folder | p_folder_id | boolean | 폴더 숨김 |
| v1_list_my_and_public_folders | p_limit, p_offset | TABLE | 내+공개 폴더 |
| v1_list_my_folders | p_place_id | TABLE | 내 폴더 |
| v1_list_my_reviews | p_limit, p_offset, p_place_id | TABLE | 내 리뷰 |
| v1_list_my_subscribers | - | TABLE | 나를 구독한 사용자 |
| v1_list_my_subscriptions | - | TABLE | 내 구독 목록 |
| v1_list_place_features | p_place_id | TABLE | 장소 출처 |
| v1_list_place_user_review | p_place_id, p_limit, p_offset | TABLE | 장소 사용자 리뷰 |
| v1_list_places_basic_sorted | p_tab, p_group1, p_offset, p_limit, p_order | TABLE | 탭별 장소 |
| v1_list_places_by_filters | p_group1, p_group2, p_category 등 | TABLE | 필터 장소 |
| v1_list_places_by_ids | p_place_ids | TABLE | ID로 장소 목록 |
| v1_list_places_by_interaction | p_type, p_limit, p_offset | TABLE | 인터랙션별 장소 |
| v1_list_places_by_tab | p_tab_name, p_group1, p_offset, p_limit, p_order_by | TABLE | 탭별 장소 |
| v1_list_places_by_tag_count | p_tag_id, p_limit | TABLE | 태그별 장소 |
| v1_list_places_search_for_id | p_id | TABLE | ID 검색 |
| v1_list_places_search_for_name | p_name, p_group1, p_limit | TABLE | 이름 검색 |
| v1_list_places_simple_by_ids | p_place_ids | TABLE | ID로 장소(간단) |
| v1_list_public_folders | p_limit, p_offset | TABLE | 공개 폴더 |
| v1_list_user_shared_folders | p_user_id, p_limit, p_offset | TABLE | 사용자 공유 폴더 |
| v1_list_visited_history | p_place_id | jsonb | 방문 이력 |
| v1_list_visited_place | p_limit, p_offset | TABLE | 방문한 장소 |
| v1_refresh_place_feed | - | void | 피드 갱신 |
| v1_regenerate_invite_code | p_folder_id | TABLE | 초대 코드 재발급 |
| v1_remove_instagram_place | p_content_id, p_place_id | void | 인스타 장소 매핑 제거 |
| v1_remove_place_from_folder | p_folder_id, p_place_id | boolean | 폴더에서 장소 제거 |
| v1_remove_tag | p_tag_id | boolean | 태그 제거 |
| v1_save_or_update_visited_place | p_place_id, p_visited_at, p_companion, p_note, p_visit_id | jsonb | 방문 기록 저장 |
| v1_save_user_location | p_lat, p_lng, p_nearest_place_id 등 | json | 위치 저장 |
| v1_set_insta_content | p_id, p_code, p_taken_at, p_caption | void | 인스타 콘텐츠 단건 |
| v1_set_insta_content_hidden | p_content_id, p_is_hidden | void | 인스타 숨김 |
| v1_set_insta_content_is_place | p_content_id, p_is_place | void | 인스타 장소 여부 |
| v1_set_insta_contents | p_contents | json | 인스타 콘텐츠 벌크 |
| v1_set_insta_user | p_id, p_user_name, p_full_name, p_bio, p_followers | void | 인스타 유저 |
| v1_set_my_recent_places | p_place_ids | void | 최근 장소 설정 |
| v1_set_recent_places | p_user_id, p_place_id | void | 최근 본 기록 |
| v1_tag_master_log_changes | - | trigger | 태그 변경 로그 |
| v1_toggle_comment_like_for_place | p_comment_id | boolean | 댓글 좋아요 토글 |
| v1_toggle_feature_subscription | p_feature_type, p_feature_id | boolean | 소스 구독 토글 |
| v1_toggle_folder_subscription | p_folder_id | boolean | 폴더 구독 토글 |
| v1_toggle_like | p_liked_id, p_liked_type, p_ref_liked_id | boolean | 좋아요 토글 |
| v1_toggle_save | p_saved_id, p_saved_type, p_ref_saved_id | boolean | 저장 토글 |
| v1_update_admin_config | p_key, p_value | json | 관리자 설정 |
| v1_update_comment_for_place | p_comment_id, p_content | boolean | 댓글 수정 |
| v1_update_folder | p_folder_id, p_title, p_description, p_permission | boolean | 폴더 수정 |
| v1_update_user_profile | p_nickname, p_bio, p_profile_image_url | json | 프로필 수정 |
| v1_upsert_folder_review | p_folder_id, p_place_id, p_review_content, p_score | TABLE | 폴더 리뷰 저장 |
| v1_upsert_ledger_data | - | json | 가계부 |
| v1_upsert_place_feature | p_feature_id, p_business_id, p_platform_type, p_content_url, p_title, p_metadata | TABLE | 출처 등록/수정 |
| v1_upsert_place_user_review | p_place_id, p_review_content, p_score, p_is_private 등 | TABLE | 사용자 리뷰 저장 |
| v1_verify_invite_code | p_folder_id, p_invite_code | TABLE | 초대 코드 검증 |
| v2_aggr_review_user_places | p_user_id | jsonb | 리뷰 기반 사용자 장소 집계(v2) |
| v2_get_community_contents | p_domain, p_limit, p_offset | TABLE | 커뮤니티 소스 목록 |
| v2_get_community_region_info | p_region_name | TABLE | 커뮤니티 지역 정보 |
| v2_get_my_bookmarked_places | p_limit, p_offset | TABLE | 저장 장소(v2) |
| v2_get_my_feed | p_limit, p_offset, p_price_min, p_price_max, p_cursor_timestamp | TABLE | 내 피드(v2, 커서) |
| v2_get_naver_folder_info | p_folder_id | TABLE | 네이버 폴더 정보 |
| v2_get_naver_folders | p_limit, p_offset | TABLE | 네이버 폴더 목록 |
| v2_get_place_detail | p_business_id | jsonb | 장소 상세(v2, 테마 포함) |
| v2_get_places_by_community_region | p_region_name, p_domain, p_limit, p_offset | TABLE | 커뮤니티 지역 장소 |
| v2_get_places_by_community_region_for_map | p_region_name, p_domain | TABLE | 지도용 |
| v2_get_places_by_naver_folder | p_folder_id, p_limit, p_offset | TABLE | 네이버 폴더 장소 |
| v2_get_places_by_naver_folder_for_map | p_folder_id | TABLE | 지도용 |
| v2_get_places_by_region | p_region_name, p_source, p_limit, p_offset | TABLE | 지역별 장소 |
| v2_get_places_by_region_for_map | p_region_name, p_source | TABLE | 지도용 |
| v2_get_places_by_youtube_channel | p_channel_id, p_limit, p_offset | TABLE | 유튜브 채널 장소 |
| v2_get_places_by_youtube_channel_for_map | p_channel_id | TABLE | 지도용 |
| v2_get_popular_places | p_limit, p_offset | TABLE | 인기 장소 |
| v2_get_region_contents | p_source, p_limit, p_offset | TABLE | 지역 소스 목록 |
| v2_get_region_info | p_region_name, p_source | TABLE | 지역 정보 |
| v2_get_social_region_info | p_region_name | TABLE | 소셜 지역 정보 |
| v2_get_youtube_channel_info | p_channel_id | TABLE | 유튜브 채널 정보 |
| v2_get_youtube_channels | p_limit, p_offset | TABLE | 유튜브 채널 목록 |
| v2_list_my_folders | p_place_id | TABLE | 내 폴더(v2, 썸네일) |
| v2_list_place_comments | p_place_id | jsonb | 댓글(v2, 레벨) |
| v2_list_places_by_filters | p_group1, p_group2, p_category, p_theme_codes 등 | TABLE | 필터 장소(v2) |
| v2_upsert_user_profile | p_nickname, p_bio, p_profile_image_url, p_email | json | 프로필 upsert(v2) |
| v2_refresh_popular_place_cache | - | TABLE | 인기 장소 캐시 갱신 |
| v3_get_community_contents | p_domain, p_limit, p_offset | TABLE | 커뮤니티 소스(v3) |
| v3_get_my_feed | p_limit, p_offset, p_price, p_cursor, p_sort_by, p_user_lat, p_user_lng | TABLE | 내 피드(v3, 거리순) |
| v3_get_places_by_community_region | p_region_name, p_domain, p_limit, p_offset, p_visited_only | TABLE | visited_only 지원 |
| v3_get_places_by_naver_folder | p_folder_id, p_limit, p_offset, p_visited_only | TABLE | visited_only 지원 |
| v3_get_places_by_region | p_region_name, p_source, p_limit, p_offset, p_visited_only | TABLE | visited_only 지원 |
| v3_get_places_by_social_region | p_region_name, p_service, p_limit, p_offset, p_visited_only | TABLE | 소셜 지역 장소 |
| v3_get_places_by_youtube_channel | p_channel_id, p_limit, p_offset, p_visited_only | TABLE | visited_only 지원 |
| v3_get_social_contents | p_service, p_limit, p_offset | TABLE | 소셜 소스 목록 |
| v4_get_my_feed | v3와 동일 + p_sort_by, p_user_lat, p_user_lng | TABLE | 피드(v4) |
| v4_get_my_feed_test | p_user_id 추가 | TABLE | 테스트용 |
| v5_get_my_feed | v4와 동일 | TABLE | 피드(v5) |
| v6_get_my_feed | v5 + p_max_distance_km | TABLE | 피드(v6, 거리 제한) |

## 오버로드

동일 함수명, 다른 시그니처:
- v1_get_my_feed: (limit, offset) / (limit, offset, price_min, price_max)
- v1_has_visited_place: 2개
- v1_list_my_reviews: 3개
- v1_save_or_update_visited_place: 2개
- v1_upsert_place_user_review: 3개

## 관련 문서

- [[01-place-functions]] - [[02-folder-functions]] - [[03-user-functions]] - [[04-feed-functions]] - [[05-instagram-functions]] - [[06-utility-functions]]
