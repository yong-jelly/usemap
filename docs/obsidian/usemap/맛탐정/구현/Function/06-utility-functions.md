생성일: 2026-03-03

# Utility 함수

공통 응답, 집계, 관리자, 이벤트, 가계부.

## 공통 응답

| 함수 | 인자 | 반환 | 설명 |
|------|------|------|------|
| generate_response | p_data, p_function, p_code, p_message, p_params, p_execution_time | json | 표준 API 응답. meta+data |
| get_current_time | - | timestamptz | 현재 시각 |

## 가격·메뉴

| 함수 | 인자 | 반환 | 설명 |
|------|------|------|------|
| calculate_menu_avg_price | menu_data jsonb | integer | 메뉴 배열에서 평균 가격. IMMUTABLE |

## 집계(Aggregation)

| 함수 | 인자 | 반환 | 설명 |
|------|------|------|------|
| v1_aggr_combine_place_features | recreation boolean | TABLE | tbl_place_features → tbl_bucket 집계 |
| v1_aggr_combine_user_places | p_user_id, recreation | TABLE | 사용자 장소 버킷 집계 |
| v1_aggr_place_features_all_stats | - | TABLE | total_place_count, category_aggregation, region_aggregation, domain_aggregation |
| v1_aggr_place_features_by_group_stats | - | TABLE | 플랫폼별·group_domain별 통계 |
| v1_aggr_review_user_places | p_user_id | jsonb | 리뷰 기반 사용자 장소 |
| v2_aggr_review_user_places | p_user_id | jsonb | v2 |
| v1_aggr_user_places_categorized_stats | p_user_id | TABLE | 카테고리별 |
| v1_aggr_user_places_region_stats | p_user_id | TABLE | 지역별 |

## 관리자

| 함수 | 인자 | 반환 | 설명 |
|------|------|------|------|
| v1_get_admin_configs | - | TABLE | config_key, config_value, config_description |
| v1_update_admin_config | p_key, p_value | json | 설정 업데이트 |
| v1_get_bot_statuses | - | TABLE | bot_id, status, last_completed_at, nickname 등 |

## 리뷰 유틸(네이버 리뷰 분석)

| 함수 | 인자 | 반환 | 설명 |
|------|------|------|------|
| v1_get_hidden_gem_reviews | p_limit, p_offset | json | 히든젬 |
| v1_get_latest_reviews | p_limit, p_offset | json | 최신 |
| v1_get_popularity_reviews | p_limit, p_offset | json | 인기 |
| v1_get_regular_customer_reviews | p_limit, p_offset | json | 단골 |
| v1_get_seasonal_reviews | p_limit, p_offset | json | 시즌 |
| v1_get_recent_reviews_with_place | p_limit, p_offset | json | 최근+장소 |

## 이벤트

| 함수 | 인자 | 반환 | 설명 |
|------|------|------|------|
| v1_get_event_with_sources | p_event_id uuid | jsonb | 이벤트+소스 |
| v1_get_recent_events | - | jsonb | 최근 이벤트 |
| v1_get_recent_places | p_limit, p_offset | jsonb | 최근 장소 |

## 캐시

| 함수 | 인자 | 반환 | 설명 |
|------|------|------|------|
| v2_refresh_popular_place_cache | - | TABLE | inserted_count, deleted_count |

## 가계부

| 함수 | 인자 | 반환 | 설명 |
|------|------|------|------|
| v1_upsert_ledger_data | - | json | ledger_data upsert |

## 트리거 함수 (문서 참고용)

| 함수 | 용도 |
|------|------|
| update_updated_at_column | updated_at 자동 갱신 |
| handle_new_user | auth.users INSERT 시 tbl_user_profile 생성 |
| v1_tag_master_log_changes | tbl_tag_master_for_place 변경 로그 |

## SQL 정의 위치

| 함수 | 파일 |
|------|------|
| generate_response, calculate_menu_avg_price | 017_v1_utility_functions.sql |
| update_updated_at_column, handle_new_user | 002_create_common_functions.sql |

## 관련 문서

- [[00-function-summary]]
- [[../모델링/05-auxiliary|보조 테이블]]
