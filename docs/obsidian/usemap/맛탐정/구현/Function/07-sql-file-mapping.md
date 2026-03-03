생성일: 2026-03-03

# 함수 ↔ SQL 파일 매핑

docs/sql 내 함수 정의 위치. psql로 검증 시 참고.

## SQL 파일별 함수

| 파일 | 함수 |
|------|------|
| 002_create_common_functions.sql | update_updated_at_column, handle_new_user |
| 010_v1_user_profile_functions.sql | get_user_profile, create_user_profile, update_user_profile 등 |
| 011_v1_place_functions.sql | v1_get_place_details, v1_get_place_by_id, v1_list_places_by_tab |
| 012_v1_comment_functions.sql | v1_create_comment_for_place, v1_get_comments_for_place 등 |
| 013_v1_interaction_functions.sql | v1_toggle_like, v1_toggle_save |
| 014_v1_review_functions.sql | v1_upsert_place_user_review, v1_get_place_user_review, v1_list_place_user_review |
| 015_v1_tag_functions.sql | v1_add_tag, v1_remove_tag, v1_get_tags, v1_get_user_tags |
| 016_v1_aggregation_functions.sql | v1_aggr_combine_place_features, v1_aggr_combine_user_places |
| 017_v1_utility_functions.sql | generate_response, calculate_menu_avg_price |
| 018_v1_more_aggregation_functions.sql | v1_aggr_place_features_by_group_stats, v1_aggr_user_places_categorized_stats |
| 019_v1_search_and_list_functions.sql | v1_list_places_search_for_name, v1_get_my_bookmarked_places, v1_get_my_liked_places 등 |
| 020_create_utility_tables.sql | (테이블) |
| 021_v1_list_places_by_filters.sql | v1_list_places_by_filters |
| 022_v2_list_places_by_filters.sql | v2_list_places_by_filters |
| 025_v2_feature_list_functions.sql | v2_get_naver_folders, v2_get_youtube_channels, v2_get_community_contents |
| 026_v2_user_profile_functions.sql | v2_upsert_user_profile |
| 028_v2_community_functions.sql | v2_get_community_region_info 등 |
| 029_v2_feature_detail_functions.sql | v2_get_places_by_naver_folder, v2_get_places_by_youtube_channel, v2_get_places_by_community_region, v2_get_naver_folder_info, v2_get_youtube_channel_info, v2_get_community_region_info |
| 030_folder_system.sql | v1_list_public_folders, v1_list_my_folders, v1_get_folder_info, v1_create_folder, v1_regenerate_invite_code, v1_verify_invite_code, v1_check_folder_access, v1_get_invite_history, v1_hide_folder, v1_update_folder, v1_add_place_to_folder, v1_remove_place_from_folder, v1_upsert_folder_review, v1_get_folder_reviews, v1_get_folder_places, v1_toggle_folder_subscription, v1_toggle_feature_subscription, v1_list_my_subscriptions, v1_get_my_feed, v1_ensure_default_folder |
| 031_folder_map_places.sql | v1_get_folder_places_for_map, v2_get_places_by_naver_folder_for_map, v2_get_places_by_youtube_channel_for_map, v2_get_places_by_community_region_for_map |
| 037_update_list_my_folders.sql | v1_list_my_folders (업데이트) |
| 038_update_v1_get_my_feed.sql | v1_get_my_feed (업데이트) |
| 042_update_v1_get_my_feed_add_source_image.sql | v1_get_my_feed (업데이트) |
| 043_add_comment_to_folder_place.sql | v1_add_place_to_folder, v1_get_my_feed (업데이트) |
| 044_update_v1_get_folder_places_add_comment.sql | v1_get_folder_places (업데이트) |
| 045_update_v1_get_my_feed_ensure_comment.sql | v1_get_my_feed (업데이트) |
| 046_update_v1_common_place_interaction_add_is_reviewed.sql | v1_common_place_interaction, v1_get_place_details, v1_get_folder_places, v1_get_my_feed (업데이트) |
| 051_visited_history_system.sql | v1_has_visited_place, v1_save_or_update_visited_place, v1_list_visited_history, v1_delete_visited_place, v1_get_place_visit_stats |
| 058_add_v1_list_my_subscribers.sql | v1_list_my_subscribers |
| 059_add_v1_list_user_shared_folders.sql | v1_list_user_shared_folders |
| 069_list_my_reviews.sql | v1_list_my_reviews, v1_get_my_reviews_counts |
| 070_add_v1_get_public_feed.sql | v1_get_public_feed |
| 070_subscription_feed.sql | v1_get_subscription_feed |
| 071_add_v2_get_region_contents.sql | v2_get_region_contents |
| 073_create_mv_region_contents.sql | v2_get_region_contents (업데이트) |
| 074_add_admin_role_and_place_delete.sql | v1_delete_place |
| 074_optimize_public_feed_with_mv.sql | v1_get_public_feed (업데이트) |
| 075_add_naver_folder_delete.sql | v1_delete_naver_folder |
| 077_add_v1_common_place_features.sql | v1_common_place_features |
| 078_create_v2_get_my_feed.sql | v2_get_my_feed |
| 079_create_v3_get_community_contents.sql | v3_get_community_contents |
| 080_location_functions.sql | v1_save_user_location, v1_get_user_locations, v1_delete_user_location, v3_get_my_feed |
| 081_optimize_v4_get_my_feed.sql | v4_get_my_feed |
| 082_optimize_v5_get_my_feed.sql | v5_get_my_feed |
| 082_optimize_v2_get_my_bookmarked_places.sql | v2_get_my_bookmarked_places |
| 083_optimize_v3_get_places_by_community_region.sql | v3_get_places_by_community_region |
| 084_optimize_v3_get_places_by_region.sql | v3_get_places_by_region |
| 085_optimize_v3_get_places_by_naver_folder_and_youtube.sql | (최적화) |
| 086_create_v2_get_place_detail.sql | v2_get_place_detail |
| 087_add_drinking_info_to_reviews.sql | v1_upsert_place_user_review (업데이트) |
| 088_update_v2_get_youtube_channels_sort.sql | v2_get_youtube_channels (업데이트) |
| 089_create_cache_popular_place.sql | (캐시 테이블) |
| 090_create_v2_refresh_popular_place_cache.sql | v2_refresh_popular_place_cache |
| 090_create_v3_get_social_contents.sql | v3_get_social_contents |
| 090_count_visited_in_feature.sql | v1_count_visited_in_feature |
| 091_create_v3_get_places_by_social_region.sql | v3_get_places_by_social_region |
| 091_optimize_v6_get_my_feed_distance.sql | v6_get_my_feed |
| 092_create_v1_list_my_and_public_folders.sql | v1_list_my_and_public_folders |
| 092_create_v2_get_social_region_info.sql | v2_get_social_region_info |
| 093_v2_aggr_review_user_places.sql | v2_aggr_review_user_places |
| 095_update_v1_get_place_features_to_match_v2.sql | v1_get_place_features (업데이트) |
| 097_create_v2_comment_functions.sql | v2_list_place_comments |
| 098_update_comment_levels.sql | v2_list_place_comments (업데이트) |
| 099_update_v1_list_my_folders_add_thumbnail.sql | v1_list_my_folders (업데이트) |
| insta-gram/002_create_functions.sql | v1_set_insta_user, v1_set_insta_content, v1_set_insta_contents, v1_get_insta_user_list, v1_get_insta_content_list, v1_list_places_simple_by_ids, v1_add_instagram_places, v1_remove_instagram_place, v1_set_insta_content_is_place, v1_set_insta_content_hidden |

## 검증 명령

```bash
# 함수 존재 여부 확인
psql "postgresql://..." -c "SELECT proname FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.prokind = 'f' ORDER BY proname;"

# 특정 함수 시그니처 확인
psql "postgresql://..." -c "\df public.v2_get_place_detail"
```

## 관련 문서

- [[00-function-summary]]
- docs/sql/README_EXECUTION_ORDER.md
