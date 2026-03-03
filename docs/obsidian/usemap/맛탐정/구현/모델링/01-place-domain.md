생성일: 2026-03-03

# Place 도메인 테이블

장소(음식점) 관련 테이블의 컬럼·타입·제약 정의.

## tbl_place

네이버 플레이스 기반 장소 마스터. `id` = 네이버 business_id.

| 컬럼 | 타입 | NULL | 기본값 | 설명 |
|------|------|------|--------|------|
| id | varchar | NO | - | PK. 네이버 business_id |
| name | varchar | YES | - | 상호명 |
| road | varchar | YES | - | 도로명주소 |
| road_address | varchar | YES | - | 도로명주소(전체) |
| address | varchar | YES | - | 지번주소 |
| category | varchar | YES | - | 업종(한글) |
| category_code | varchar | YES | - | 업종 코드 |
| category_code_list | text[] | YES | - | 업종 코드 배열 |
| group1 | varchar | YES | - | 지역1 (시도) |
| group2 | varchar | YES | - | 지역2 |
| group3 | varchar | YES | - | 지역3 |
| phone | varchar | YES | - | 전화번호 |
| x, y | varchar | YES | - | 좌표 |
| images | text[] | YES | - | 이미지 URL 배열 |
| place_images | text[] | YES | - | 장소 이미지 |
| visitor_reviews_total | int | YES | - | 네이버 리뷰 수 |
| visitor_reviews_score | numeric(3) | YES | - | 네이버 별점 |
| visitor_review_stats | jsonb | YES | - | 리뷰 통계(테마, 키워드 등) |
| visitor_review_medias_total | int | YES | - | 리뷰 미디어 수 |
| menus | jsonb | YES | - | 메뉴 정보 |
| payment_info | text[] | YES | - | 결제 수단 |
| conveniences | text[] | YES | - | 편의시설 |
| homepage | text[] | YES | - | 홈페이지 |
| keyword_list | text[] | YES | - | 키워드 |
| themes | text[] | YES | - | 테마 |
| static_map_url | varchar | YES | - | 정적 지도 URL |
| street_panorama | jsonb | YES | - | 거리뷰 |
| is_franchise | boolean | YES | false | 프랜차이즈 여부 |
| algo_* | numeric | YES | - | 알고리즘 스코어(engagement 등) |
| created_at | timestamptz | YES | now() | |
| updated_at | timestamptz | YES | now() | |

**PK**: id

---

## tbl_place_info

장소 상세 정보. tbl_place와 1:1, business_id로 연결.

| 컬럼 | 타입 | NULL | 설명 |
|------|------|------|------|
| business_id | varchar | NO | PK. tbl_place.id |
| business_name | varchar | YES | 상호명 |
| address | varchar | YES | 주소 |
| convenience | text[] | YES | 편의시설 |
| direction | varchar | YES | 찾아오는 길 |
| payment_methods | text[] | YES | 결제 수단 |
| website | text[] | YES | 웹사이트 |
| description | varchar | YES | 설명 |
| url | varchar | YES | URL |
| created_at | timestamptz | YES | |
| updated_at | timestamptz | YES | |

---

## tbl_place_features

출처(유튜브, 커뮤니티 등)와 장소 연결. 사용자 직접 등록 포함.

| 컬럼 | 타입 | NULL | 기본값 | 설명 |
|------|------|------|--------|------|
| id | uuid | NO | uuid_generate_v4() | PK |
| user_id | uuid | NO | - | 등록 사용자 (auth.users) |
| place_id | varchar | NO | - | tbl_place.id |
| platform_type | varchar(50) | NO | - | youtube, community, instagram 등 |
| content_url | text | NO | - | 원본 URL |
| title | varchar(500) | YES | - | 제목 |
| metadata | jsonb | YES | - | 채널ID, 도메인 등 |
| published_at | timestamptz | YES | - | 게시일 |
| is_verified | boolean | YES | false | 검증 여부 |
| status | varchar(20) | YES | 'active' | active, inactive |
| created_at | timestamptz | YES | now() | |
| updated_at | timestamptz | YES | now() | |

**FK**: user_id → auth.users, place_id → tbl_place

---

## tbl_place_user_review

맛탐정 사용자 리뷰. (출처 기반 발견 콘셉에선 소극적 기능)

| 컬럼 | 타입 | NULL | 기본값 | 설명 |
|------|------|------|--------|------|
| id | uuid | NO | uuid_generate_v4() | PK |
| user_id | uuid | NO | - | 작성자 |
| place_id | varchar | NO | - | 장소 |
| review_content | text | YES | - | 리뷰 내용 |
| score | numeric(2) | YES | - | 별점 (CHECK: 0~5) |
| is_private | boolean | YES | false | 비공개 |
| is_active | boolean | YES | true | 활성 |
| media_urls | jsonb | YES | - | 이미지 URL |
| gender_code | varchar | YES | - | 성별 |
| age_group_code | varchar | YES | - | 연령대 |
| has_images | boolean | YES | false | |
| is_drinking | boolean | YES | false | |
| drinking_bottles | numeric | YES | 0 | |
| created_at | timestamptz | YES | now() | |
| updated_at | timestamptz | YES | now() | |

**FK**: user_id → auth.users, place_id → tbl_place

---

## tbl_place_feed_group

홈 피드용 장소 그룹·스코어링. 다양한 스코어 컬럼 보유.

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | bigint | PK (serial) |
| tab_name | varchar(50) | 탭명 |
| place_id | varchar(255) | tbl_place.id |
| name | varchar(500) | 장소명 |
| category | varchar(100) | 업종 |
| road_address | text | 주소 |
| group1, group2, group3 | varchar | 지역 |
| visitor_reviews_total | int | 네이버 리뷰 수 |
| visitor_reviews_score | numeric(3) | 네이버 별점 |
| total_score | numeric(10) | 종합 스코어 |
| rank_in_region | int | 지역 내 순위 |
| engagement_score | numeric(10) | |
| tag_score | numeric(10) | |
| platform_score | numeric(10) | |
| review_score | numeric(10) | |
| user_review_score | numeric(10) | |
| naver_review_score | numeric(10) | |
| freshness_score | numeric(10) | |
| quality_potential_score | numeric(10) | |
| hidden_gem_score | numeric(10) | |
| debug_* | int, numeric | 디버그용 카운트 |
| created_at | timestamptz | |
| updated_at | timestamptz | |

---

## tbl_place_queue

장소 등록 대기열. 크롤링·수집 파이프라인용.

| 컬럼 | 타입 | NULL | 기본값 | 설명 |
|------|------|------|--------|------|
| id | text | NO | - | PK |
| name | text | NO | - | 상호명 |
| category | text | YES | - | 업종 |
| business_category | text | YES | - | |
| common_address | text | YES | - | |
| address | text | YES | - | |
| status | text | NO | 'PENDING' | PENDING, PROCESSING, DONE, FAILED |
| retry_count | int | YES | 0 | |
| retry_limit | int | YES | 5 | |
| error_message | text | YES | - | |
| created_at | timestamptz | YES | now() | |
| updated_at | timestamptz | YES | now() | |

---

## tbl_place_analysis

네이버 리뷰 분석·테마·투표 집계.

| 컬럼 | 타입 | NULL | 설명 |
|------|------|------|------|
| business_id | varchar | NO | PK. tbl_place.id |
| review_avg_rating | numeric(3) | YES | 평균 별점 |
| total_reviews | int | YES | 리뷰 수 |
| themes | jsonb | NO | 테마별 데이터 |
| menus | jsonb | NO | 메뉴 |
| voted | jsonb | NO | 투표 데이터 |
| voted_sum_count | int | NO | |
| voted_user_count | int | NO | |
| created_at | timestamptz | YES | |
| updated_at | timestamptz | YES | |

---

## tbl_place_view_stats

장소 조회 통계. 시간 버킷별 집계.

| 컬럼 | 타입 | NULL | 기본값 | 설명 |
|------|------|------|--------|------|
| id | uuid | NO | uuid_generate_v4() | PK |
| place_id | varchar | NO | - | |
| hour_bucket | timestamptz | NO | - | 시간 버킷 |
| view_count | int | NO | 1 | 조회 수 |
| unique_sessions | int | NO | 1 | 고유 세션 |
| last_viewed_at | timestamptz | NO | now() | |
| created_at | timestamptz | NO | now() | |
| updated_at | timestamptz | NO | now() | |

---

## tbl_theme_top_places

테마별 상위 장소 랭킹. 랭킹 페이지용.

| 컬럼 | 타입 | NULL | 설명 |
|------|------|------|------|
| theme_code | text | NO | PK. 테마 코드 |
| place_id | text | NO | PK. tbl_place.id |
| count | int | YES | 집계 수 |
| group1 | text | YES | 지역 |
| visitor_reviews_total | int | YES | |
| visitor_reviews_score | numeric | YES | |

**PK**: (theme_code, place_id)

---

## v_tbl_place_features (VIEW)

tbl_place_features와 tbl_naver_folder_place를 UNION하여 출처 통합 뷰.

- platform_type: youtube, community, instagram, **folder**(네이버)
- content_url, title, metadata, published_at, is_verified, status

---

## mv_place_theme_scores (MATERIALIZED VIEW)

tbl_place.visitor_review_stats → analysis.votedKeyword.details에서 테마별 count 추출.

| 컬럼 | 타입 | 설명 |
|------|------|------|
| place_id | varchar | |
| theme_code | text | |
| count | int | |

인덱스: theme_code, place_id, (theme_code, place_id)

---

## 관련 문서

- [[00-table-summary]]
- [[06-io-mapping]]
