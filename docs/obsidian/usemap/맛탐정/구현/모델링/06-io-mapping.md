생성일: 2026-03-03

# I/O 매핑 (RPC·API → 테이블)

클라이언트·Edge Function에서 호출하는 RPC와 관련 테이블의 읽기(R)/쓰기(W) 매핑.

## Place 도메인

| RPC | 방향 | 테이블 |
|-----|------|--------|
| v2_get_place_detail | R | tbl_place, tbl_recent_view(W) |
| v1_get_place_details | R | tbl_place, tbl_like, tbl_save, tbl_recent_view(W) |
| v1_get_place_features | R | v_tbl_place_features (= tbl_place_features + tbl_naver_folder_place) |
| v1_list_place_user_review | R | tbl_place_user_review, tbl_place_user_review_tag_map |
| v1_upsert_place_user_review | W | tbl_place_user_review, tbl_place_user_review_tag_map, tbl_review_images |
| v1_delete_place_user_review | W | tbl_place_user_review |
| v1_upsert_place_feature | W | tbl_place_features |
| v1_delete_place_feature | W | tbl_place_features |
| v1_toggle_like | W | tbl_like |
| v1_toggle_save | W | tbl_save |
| v1_save_or_update_visited_place | W | tbl_visited |
| v1_delete_visited_place | W | tbl_visited |
| v1_list_visited_history | R | tbl_visited, tbl_place |
| v1_get_place_visit_stats | R | tbl_visited |
| v1_list_places_by_tab | R | tbl_place_feed_group, tbl_place |
| v2_list_places_by_filters | R | tbl_place, tbl_place_features, tbl_folder_place 등 |
| v1_get_place_analysis | R | tbl_place_analysis |
| v1_get_place_reviews | R | tbl_place_review, tbl_place_review_image |
| v1_list_place_comments (v2) | R | tbl_comment_for_place, tbl_comment_likes_for_place |
| v1_create_comment_for_place | W | tbl_comment_for_place |
| v1_delete_place_comment | W | tbl_comment_for_place |
| v1_toggle_comment_like_for_place | W | tbl_comment_likes_for_place |
| v1_list_places_by_ids | R | tbl_place |

---

## Folder 도메인

| RPC | 방향 | 테이블 |
|-----|------|--------|
| v1_list_my_and_public_folders | R | tbl_folder, tbl_folder_subscribed |
| v1_list_public_folders | R | tbl_folder |
| v1_list_my_folders | R | tbl_folder, tbl_folder_place |
| v1_list_user_shared_folders | R | tbl_folder |
| v1_create_folder | W | tbl_folder |
| v1_get_folder_info | R | tbl_folder |
| v1_check_folder_access | R | tbl_folder |
| v1_add_place_to_folder | W | tbl_folder_place, tbl_folder |
| v1_remove_place_from_folder | W | tbl_folder_place |
| v1_get_folder_places | R | tbl_folder_place, tbl_place |
| v1_toggle_folder_subscription | W | tbl_folder_subscribed, tbl_folder |
| v1_list_my_subscriptions | R | tbl_folder_subscribed, tbl_folder |
| v1_ensure_default_folder | W | tbl_folder |
| v1_generate_folder_invite | W | tbl_folder_invite_history |
| v1_accept_folder_invite | W | tbl_folder_invite_history, tbl_folder_subscribed |
| v1_get_invite_history | R | tbl_folder_invite_history |
| v1_hide_folder | W | tbl_folder |
| v1_update_folder | W | tbl_folder |
| v1_get_folder_reviews | R | tbl_folder_review |

---

## Feed·소스 도메인

| RPC | 방향 | 테이블 |
|-----|------|--------|
| v6_get_my_feed | R | mv_public_feed, tbl_feature_subscription |
| v1_get_public_feed | R | mv_public_feed |
| v1_get_subscription_feed | R | mv_public_feed, tbl_folder_subscribed |
| v2_get_naver_folders | R | tbl_naver_folder, tbl_naver_folder_place |
| v2_get_naver_folder_info | R | tbl_naver_folder |
| v2_get_youtube_channels | R | tbl_place_features (platform_type=youtube) |
| v2_get_youtube_channel_info | R | tbl_place_features |
| v3_get_social_contents | R | tbl_place_features (instagram), tbl_place |
| v3_get_community_contents | R | tbl_place_features (community), tbl_place |
| v2_get_region_contents | R | mv_region_contents |
| v3_get_places_by_naver_folder | R | tbl_naver_folder_place, tbl_place |
| v3_get_places_by_youtube_channel | R | tbl_place_features, tbl_place |
| v3_get_places_by_social_region | R | tbl_place_features, tbl_place |
| v3_get_places_by_community_region | R | tbl_place_features, tbl_place |
| v3_get_places_by_region | R | tbl_place_features, tbl_naver_folder_place, tbl_place |
| v1_count_visited_in_feature | R | tbl_visited, tbl_place_features 등 |

---

## User 도메인

| RPC | 방향 | 테이블 |
|-----|------|--------|
| v1_get_user_profile | R | tbl_user_profile |
| v2_upsert_user_profile | W | tbl_user_profile |
| v1_update_user_profile | W | tbl_user_profile |
| v1_list_my_subscribers | R | tbl_user_profile |
| v1_save_user_location | W | tbl_location |
| v1_get_user_locations | R | tbl_location |
| v1_delete_user_location | W | tbl_location |
| v1_get_my_bookmarked_places | R | tbl_save, tbl_place |
| v1_get_my_recent_view_places | R | tbl_recent_view, tbl_place |
| v1_get_my_liked_places | R | tbl_like, tbl_place |
| v1_list_visited_place | R | tbl_visited, tbl_place |
| v1_list_my_reviews | R | tbl_place_user_review, tbl_place |
| v1_get_my_reviews_counts | R | tbl_place_user_review |

---

## Direct Table Access (Supabase Client)

| 사용처 | 테이블 | 용도 |
|--------|--------|------|
| RankingPage | tbl_theme_top_places, tbl_place | 랭킹 조회 |
| userApi | tbl_user_profile (via RPC) | 프로필 |
| InstagramParserPage | tbl_instagram_* | 인스타 파서 도구 |

---

## Edge Function

| 함수 | 용도 | 테이블 |
|------|------|--------|
| fn_v1_import_place_to_folder | 네이버 URL → 장소 임포트 | tbl_place, tbl_folder_place, tbl_naver_folder 등 |

---

## 관련 문서

- [[01-place-domain]] | [[02-folder-domain]] | [[03-user-domain]] | [[04-feed-source-domain]]
