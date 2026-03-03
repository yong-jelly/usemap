생성일: 2026-03-03

# 보조·공통·로그 테이블

공통코드, 로그, 키-값 저장소 등.

## tbl_common_gender

성별 공통코드.

| 컬럼 | 타입 | NULL | 설명 |
|------|------|------|------|
| gender_code | varchar(10) | NO | PK |
| gender_label | varchar(20) | NO | 라벨 |

---

## tbl_common_age_group

연령대 공통코드.

| 컬럼 | 타입 | NULL | 설명 |
|------|------|------|------|
| age_group_code | varchar(10) | NO | PK |
| age_group_label | varchar(20) | NO | 라벨 |
| sort_order | smallint | YES | 정렬 순서 |

---

## tbl_tag_master_for_place

장소 리뷰 태그 마스터.

| 컬럼 | 타입 | NULL | 기본값 | 설명 |
|------|------|------|--------|------|
| id | uuid | NO | uuid_generate_v4() | PK |
| tag_group | varchar(30) | NO | - | 태그 그룹 |
| tag_group_ko | varchar(100) | NO | - | 그룹 한글명 |
| tag_name | varchar(100) | NO | - | 태그명 |
| tag_name_slug | varchar(100) | NO | - | 슬러그 (UNIQUE) |
| tag_order | int | NO | 0 | 정렬 |
| tag_desc | varchar(200) | YES | - | 설명 |
| category | varchar(20) | NO | - | 카테고리 |
| topic | varchar(50) | YES | - | 토픽 |
| level | int | NO | 1 | 레벨 |
| is_active | boolean | NO | true | 활성 |
| created_at | timestamptz | NO | now() | |
| updated_at | timestamptz | NO | now() | |

---

## tbl_place_review_tag_master

네이버 리뷰 태그 마스터(긍정/부정).

| 컬럼 | 타입 | NULL | 설명 |
|------|------|------|------|
| tag_code | varchar(50) | NO | PK |
| tag_label | varchar(100) | NO | |
| is_positive | boolean | NO | 긍정/부정 |
| tag_group | varchar(50) | YES | |

---

## tbl_action_history

액션 로그. 감사·디버깅용.

| 컬럼 | 타입 | NULL | 기본값 | 설명 |
|------|------|------|--------|------|
| id | uuid | NO | uuid_generate_v4() | PK |
| created_at | timestamptz | NO | now() | |
| action_user_id | uuid | YES | - | auth.users.id |
| action | text | NO | - | 액션 타입 |
| source_name | text | NO | - | 소스명 |
| source_id | text | NO | - | 소스 ID |
| metadata | jsonb | YES | - | 추가 데이터 |

---

## tbl_search_history

검색 이력.

| 컬럼 | 타입 | NULL | 기본값 | 설명 |
|------|------|------|--------|------|
| id | int | NO | serial | PK |
| keyword | text | NO | - | 검색어 |
| result | int | NO | 0 | 결과 수 |
| user_id | uuid | YES | - | auth.users.id |
| created_at | timestamptz | NO | now() | |

---

## tbl_bucket

키-값 저장소. 설정·캐시용.

| 컬럼 | 타입 | NULL | 기본값 | 설명 |
|------|------|------|--------|------|
| key | varchar(255) | NO | - | PK |
| name | varchar(255) | NO | - | PK |
| value | varchar(1000) | YES | - | |
| data | varchar(5000) | YES | - | |
| data_jsonb | jsonb | YES | - | |
| created_at | timestamptz | YES | now() | |
| updated_at | timestamptz | YES | now() | |

**PK**: (key, name)

---

## tbl_crw_log

크롤러 로그. 수집 파이프라인 모니터링.

| 컬럼 | 타입 | NULL | 기본값 | 설명 |
|------|------|------|--------|------|
| id | bigint | NO | serial | PK |
| place_id | text | NO | - | tbl_place.id |
| status | text | NO | - | success, fail 등 |
| error_message | text | YES | - | |
| start_time | timestamptz | YES | now() | |
| end_time | timestamptz | YES | - | |
| duration_ms | int | YES | - | 소요 시간(ms) |
| created_at | timestamptz | YES | now() | |
| updated_at | timestamptz | YES | now() | |

---

## tbl_tag_history

태그 변경 이력.

| 컬럼 | 타입 | NULL | 기본값 | 설명 |
|------|------|------|--------|------|
| id | uuid | NO | uuid_generate_v4() | PK |
| tag_id | uuid | NO | - | tbl_place_tag.id |
| user_id | uuid | YES | - | auth.users.id |
| action_type | varchar(20) | NO | - | add, remove 등 |
| change_details | jsonb | YES | - | |
| created_at | timestamptz | NO | now() | |

---

## categories, events, sources, location_candidates

이벤트 관련 테이블. (별도 프로젝트 연동 가능)

| 테이블 | 설명 |
|--------|------|
| categories | 이벤트 카테고리 (id, name_ko, name_en, icon_url) |
| events | 이벤트 (id, category_id, title_ko, title_en, status, occurrence_at, lat/lng 등) |
| sources | 이벤트 소스 (id, event_id, publisher_name, original_url, title, published_at) |
| location_candidates | 이벤트 위치 후보 (id, event_id, lat, lng, address_name, confidence_score) |

---

## existing_data, ledger_data

마이그레이션·가계부. (별도 프로젝트)

| 테이블 | 설명 |
|--------|------|
| existing_data | key-value 마이그레이션 (key, name, value, data, data_jsonb) |
| ledger_data | 가계부 (user_id, owner_name, date, type, amount, currency 등) |

---

## 관련 문서

- [[00-table-summary]]
