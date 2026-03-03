생성일: 2026-03-03

# Instagram 도메인 함수

인스타그램 파서 도구용. tbl_instagram_user, tbl_instagram_content, tbl_instagram_place.

## 유저

| 함수 | 인자 | 반환 | 설명 |
|------|------|------|------|
| v1_set_insta_user | p_id, p_user_name, p_full_name, p_bio, p_followers | void | 유저 upsert |
| v1_get_insta_user_list | p_page, p_page_size | TABLE | 유저 목록. content_count, place_filled_count, last_content_at |

## 콘텐츠

| 함수 | 인자 | 반환 | 설명 |
|------|------|------|------|
| v1_set_insta_content | p_id, p_code, p_taken_at, p_caption | void | 단건 upsert |
| v1_set_insta_contents | p_contents jsonb | json | 벌크 upsert. success_count, error_count, errors |
| v1_get_insta_content_list | p_user_id, p_is_place, p_page, p_page_size, p_show_hidden | TABLE | 콘텐츠 목록. mapped_places, total_count |
| v1_set_insta_content_is_place | p_content_id, p_is_place | void | 장소 여부 업데이트 |
| v1_set_insta_content_hidden | p_content_id, p_is_hidden | void | 숨김 설정 |

## 장소 매핑

| 함수 | 인자 | 반환 | 설명 |
|------|------|------|------|
| v1_add_instagram_places | p_content_id text, p_place_ids text[] | void | 콘텐츠-장소 매핑 추가 |
| v1_remove_instagram_place | p_content_id, p_place_id | void | 매핑 제거 |

## 유틸

| 함수 | 인자 | 반환 | 설명 |
|------|------|------|------|
| v1_list_places_simple_by_ids | p_place_ids text[] | TABLE | ID로 장소 간단 조회. 파서에서 사용 |

## SQL 정의 위치

- docs/sql/insta-gram/002_create_functions.sql

## 관련 문서

- [[00-function-summary]]
- [[../모델링/04-feed-source-domain|Feed·Source 도메인]]
