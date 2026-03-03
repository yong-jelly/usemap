생성일: 2026-03-03

# User 도메인 함수

프로필, 위치, 좋아요, 저장, 개인화 목록.

## 프로필

| 함수 | 인자 | 반환 | 설명 |
|------|------|------|------|
| get_user_profile | - | SETOF tbl_user_profile | 내 프로필 (auth.uid()) |
| get_user_profile_by_id | p_public_profile_id uuid | SETOF tbl_user_profile | 공개ID로 조회 |
| v1_get_user_profile | - | SETOF tbl_user_profile | 동일 |
| create_user_profile | p_nickname, p_bio, p_profile_image_url | json | 생성 |
| update_user_profile | p_nickname, p_bio, p_profile_image_url | json | 수정 |
| v1_update_user_profile | p_nickname, p_bio, p_profile_image_url | json | 동일 |
| v2_upsert_user_profile | p_nickname, p_bio, p_profile_image_url, p_email | json | upsert. 이메일 포함 |
| check_user_profile_exists | - | SETOF tbl_user_profile | 존재 여부 |
| search_profiles_by_nickname | p_nickname, p_limit | SETOF tbl_user_profile | 닉네임 검색 |
| get_user_group1_aggregation | p_user_id uuid | TABLE | 지역 집계 |

## 위치

| 함수 | 인자 | 반환 | 설명 |
|------|------|------|------|
| v1_save_user_location | p_latitude, p_longitude, p_nearest_place_id, p_nearest_place_name, p_nearest_place_address, p_distance_meters | json | 저장 |
| v1_get_user_locations | p_limit | TABLE | 내 위치 목록 |
| v1_delete_user_location | p_location_id uuid | boolean | 삭제 |

## 인터랙션 (좋아요, 저장)

| 함수 | 인자 | 반환 | 설명 |
|------|------|------|------|
| v1_toggle_like | p_liked_id, p_liked_type, p_ref_liked_id | boolean | 좋아요 토글 |
| v1_toggle_save | p_saved_id, p_saved_type, p_ref_saved_id | boolean | 저장 토글 |
| v1_get_interaction_info | p_id text, p_type text | jsonb | 인터랙션 정보 |

## 개인화 목록

| 함수 | 인자 | 반환 | 설명 |
|------|------|------|------|
| v1_get_my_bookmarked_places | p_limit, p_offset | TABLE | 저장한 장소 |
| v2_get_my_bookmarked_places | p_limit, p_offset | TABLE | v2 |
| v1_get_my_liked_places | p_limit, p_offset | TABLE | 좋아요한 장소 |
| v1_get_my_recent_view_places | p_limit, p_offset | TABLE | 최근 본 장소 |
| v1_get_my_recent_places | p_limit, p_offset | jsonb | 최근 장소 |
| v1_set_my_recent_places | p_place_ids | void | 최근 장소 설정 |
| v1_set_recent_places | p_user_id, p_place_id | void | 최근 본 기록 |

## 리뷰 관련

| 함수 | 인자 | 반환 | 설명 |
|------|------|------|------|
| v1_list_my_reviews | p_limit, p_offset, p_place_id | TABLE | 내 리뷰 목록 |
| v1_get_my_reviews_counts | - | TABLE | all_count, public_count, private_count, image_count |
| v1_get_my_liked_reviews | p_limit, p_offset | json | 좋아요한 리뷰 |

## 소스 구독

| 함수 | 인자 | 반환 | 설명 |
|------|------|------|------|
| v1_toggle_feature_subscription | p_feature_type, p_feature_id | boolean | 유튜브/네이버 등 구독 토글 |

## 관련 문서

- [[00-function-summary]]
- [[../모델링/03-user-domain|User 도메인 테이블]]
