생성일: 2026-03-03

# Place 도메인 함수

장소 조회, 출처(feature), 리뷰, 방문, 댓글, 태그 관련 함수.

## 장소 조회

| 함수 | 인자 | 반환 | 설명 |
|------|------|------|------|
| v1_get_place_by_id | p_business_id text | jsonb | 장소 단건. place_data |
| v1_get_place_by_id_with_set_recent_view | p_business_id text | jsonb | 장소+최근본 기록(tbl_recent_view) |
| v1_get_place_details | p_place_id text | jsonb | 상세+인터랙션(좋아요,저장,댓글수,방문수,리뷰수) |
| v2_get_place_detail | p_business_id text | jsonb | v2. 테마(themes) 포함 |
| v1_get_place_analysis | p_place_id text | jsonb | tbl_place_analysis. 테마, 메뉴, voted |
| v1_get_place_experience | p_place_id text | jsonb | 경험 객체 |
| v1_get_place_reviews | p_place_id text, p_limit int | jsonb | 네이버 리뷰 |
| v1_list_places_by_tab | p_tab_name, p_group1, p_offset, p_limit, p_order_by | TABLE | tbl_place_feed_group 기반 |
| v1_list_places_by_ids | p_place_ids | TABLE | ID 배열로 장소 목록 |
| v1_list_places_simple_by_ids | p_place_ids text[] | TABLE | 간단 버전 |
| v1_list_places_search_for_id | p_id text | TABLE | ID 검색 |
| v1_list_places_search_for_name | p_name, p_group1, p_limit | TABLE | 이름 검색 |
| v1_list_places_by_filters | p_group1, p_group2, p_category 등 | TABLE | 필터 기반 |
| v2_list_places_by_filters | p_group1, p_group2, p_category, p_theme_codes, p_exclude_franchises, p_image_limit, p_price_min, p_price_max | TABLE | v2. 테마, 가격 필터 |
| v1_list_places_basic_sorted | p_tab, p_group1, p_offset, p_limit, p_order | TABLE | 기본 정렬 |
| v1_list_places_by_interaction | p_type, p_limit, p_offset | TABLE | 인터랙션 타입별 |
| v1_list_places_by_tag_count | p_tag_id, p_limit | TABLE | 태그별 |
| v2_get_popular_places | p_limit, p_offset | TABLE | 인기 장소 캐시 |
| v1_delete_place | p_place_id text | json | 관리자. 장소 삭제 |

## 출처(Feature)

| 함수 | 인자 | 반환 | 설명 |
|------|------|------|------|
| v1_get_place_features | p_business_id, p_limit, p_offset | TABLE | v_tbl_place_features. 출처 목록 |
| v1_list_place_features | p_place_id | TABLE | 동일 |
| v1_common_place_features | p_place_id text | jsonb | 출처 요약 |
| v1_upsert_place_feature | p_feature_id, p_business_id, p_platform_type, p_content_url, p_title, p_metadata | TABLE | 등록/수정 |
| v1_delete_place_feature | p_feature_id uuid | TABLE | 삭제 |

## 사용자 리뷰

| 함수 | 인자 | 반환 | 설명 |
|------|------|------|------|
| v1_get_place_user_review | p_review_id uuid | TABLE | 단건 |
| v1_list_place_user_review | p_place_id, p_limit, p_offset | TABLE | 목록 |
| v1_upsert_place_user_review | p_place_id, p_review_content, p_score, p_is_private, p_is_active, p_review_id, p_media_urls, p_gender_code, p_age_group_code, p_tag_codes, p_profile_gender_and_age_by_pass, p_image_paths, p_deleted_image_ids, p_created_at, p_is_drinking, p_drinking_bottles | TABLE | 저장. 오버로드 3개 |
| v1_delete_place_user_review | p_review_id uuid | boolean | 삭제 |

## 방문 기록

| 함수 | 인자 | 반환 | 설명 |
|------|------|------|------|
| v1_save_or_update_visited_place | p_place_id, p_visited_at, p_companion, p_note, p_visit_id | jsonb | 저장/수정 |
| v1_list_visited_history | p_place_id text | jsonb | 장소별 방문 이력 |
| v1_list_visited_place | p_limit, p_offset | TABLE | 내 방문 장소 |
| v1_get_visited_place | p_place_id text | jsonb | 단건 |
| v1_get_place_visit_stats | p_place_id text | jsonb | 방문 통계 |
| v1_has_visited_place | p_place_id text | boolean | 방문 여부 |
| v1_delete_visited_place | p_visit_id uuid | jsonb | 삭제 |

## 댓글

| 함수 | 인자 | 반환 | 설명 |
|------|------|------|------|
| v1_get_comment_count_for_place | p_business_id text | bigint | 댓글 수 |
| v1_get_comments_for_place | p_business_id, p_limit, p_offset | TABLE | 댓글 목록 |
| v1_create_comment_for_place | p_business_id, p_content, p_title, p_image_paths, p_parent_comment_id, p_comment_level | TABLE | 작성 |
| v1_update_comment_for_place | p_comment_id, p_content | boolean | 수정 |
| v1_delete_place_comment | p_comment_id uuid | boolean | 삭제 |
| v1_deactivate_comment_for_place | p_comment_id uuid | boolean | 비활성화 |
| v1_toggle_comment_like_for_place | p_comment_id uuid | boolean | 댓글 좋아요 |
| v2_list_place_comments | p_place_id text | jsonb | v2. comment_level 포함 |

## 태그

| 함수 | 인자 | 반환 | 설명 |
|------|------|------|------|
| v1_add_tag | p_business_id text, p_tag_id uuid | tbl_place_tag | 추가 |
| v1_remove_tag | p_tag_id uuid | boolean | 제거 |
| v1_get_tags | - | SETOF tbl_tag_master_for_place | 마스터 |
| v1_get_user_tags | p_business_id text | SETOF tbl_place_tag | 장소 태그 |

## 관련 문서

- [[00-function-summary]]
- [[../모델링/01-place-domain|Place 도메인 테이블]]
