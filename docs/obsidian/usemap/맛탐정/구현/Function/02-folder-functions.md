생성일: 2026-03-03

# Folder 도메인 함수

맛탐정 폴더(콜렉션) CRUD, 구독, 초대, 리뷰.

## 폴더 CRUD

| 함수 | 인자 | 반환 | 설명 |
|------|------|------|------|
| v1_create_folder | p_title, p_description, p_permission, p_permission_write_type | TABLE | 생성. id, invite_code 반환 |
| v1_get_folder_info | p_folder_id varchar | TABLE | 상세. owner_nickname, subscriber_count 등 |
| v1_update_folder | p_folder_id, p_title, p_description, p_permission | boolean | 수정 |
| v1_hide_folder | p_folder_id varchar | boolean | 숨김 |
| v1_check_folder_access | p_folder_id varchar | TABLE | access, can_view, can_edit, is_owner, is_subscribed, is_hidden, is_default |

## 폴더 목록

| 함수 | 인자 | 반환 | 설명 |
|------|------|------|------|
| v1_list_my_folders | p_place_id varchar | TABLE | 내 폴더. place_id 있으면 is_place_in_folder 포함 |
| v2_list_my_folders | p_place_id varchar | TABLE | v2. preview_places, thumbnail |
| v1_list_public_folders | p_limit, p_offset | TABLE | 공개 폴더 |
| v1_list_my_and_public_folders | p_limit, p_offset | TABLE | 내+공개 통합 |
| v1_list_user_shared_folders | p_user_id, p_limit, p_offset | TABLE | 특정 사용자 공유 폴더 |

## 폴더-장소

| 함수 | 인자 | 반환 | 설명 |
|------|------|------|------|
| v1_add_place_to_folder | p_folder_id, p_place_id, p_comment | boolean | 추가. comment 지원 |
| v1_remove_place_from_folder | p_folder_id, p_place_id | boolean | 제거 |
| v1_get_folder_places | p_folder_id, p_limit, p_offset, p_visited_only | TABLE | place_id, place_data, added_at, comment |
| v1_get_folder_places_for_map | p_folder_id varchar | TABLE | place_id, name, x, y (지도용) |

## 구독

| 함수 | 인자 | 반환 | 설명 |
|------|------|------|------|
| v1_toggle_folder_subscription | p_folder_id varchar | boolean | 구독 토글 |
| v1_list_my_subscriptions | - | TABLE | 내 구독 폴더 |
| v1_list_my_subscribers | - | TABLE | 나를 구독한 사용자 |

## 초대

| 함수 | 인자 | 반환 | 설명 |
|------|------|------|------|
| v1_regenerate_invite_code | p_folder_id varchar | TABLE | 초대 코드 재발급 |
| v1_verify_invite_code | p_folder_id, p_invite_code | TABLE | 검증 |
| v1_get_invite_history | p_folder_id varchar | TABLE | 초대 이력 |

## 폴더 리뷰

| 함수 | 인자 | 반환 | 설명 |
|------|------|------|------|
| v1_upsert_folder_review | p_folder_id, p_place_id, p_review_content, p_score | TABLE | 저장 |
| v1_get_folder_reviews | p_folder_id, p_place_id | TABLE | 목록. is_my_review 포함 |

## 기타

| 함수 | 인자 | 반환 | 설명 |
|------|------|------|------|
| v1_ensure_default_folder | - | boolean | 기본 폴더 없으면 생성 |

## 관련 문서

- [[00-function-summary]]
- [[../모델링/02-folder-domain|Folder 도메인 테이블]]
