생성일: 2026-03-03

# Feed·Source 도메인 테이블

피드·출처(네이버 폴더, 유튜브, 인스타, 커뮤니티) 관련 테이블.

## tbl_naver_folder

네이버 지도 폴더. 외부 소스.

| 컬럼 | 타입 | NULL | 기본값 | 설명 |
|------|------|------|--------|------|
| folder_id | bigint | NO | - | PK. 네이버 폴더 ID |
| share_id | varchar(255) | NO | - | 공유 ID |
| name | varchar(255) | NO | - | 폴더명 |
| memo | text | YES | - | 메모 |
| url | varchar(2048) | YES | - | URL |
| last_use_time | timestamptz | YES | - | 마지막 사용 |
| creation_time | timestamptz | NO | - | 생성 시각 |
| follow_count | int | YES | 0 | 팔로워 수 |
| view_count | int | YES | 0 | 조회 수 |
| managed | boolean | YES | false | 관리 여부 |
| created_at | timestamptz | NO | now() | |
| updated_at | timestamptz | NO | now() | |

---

## tbl_naver_folder_place

네이버 폴더-장소 매핑.

| 컬럼 | 타입 | NULL | 설명 |
|------|------|------|------|
| folder_id | bigint | NO | PK. tbl_naver_folder.folder_id |
| place_id | varchar(255) | NO | PK. tbl_place.id |

**PK**: (folder_id, place_id)  
**FK**: folder_id → tbl_naver_folder, place_id → tbl_place

---

## tbl_instagram_user

인스타그램 사용자(채널). 출처 소스.

| 컬럼 | 타입 | NULL | 기본값 | 설명 |
|------|------|------|--------|------|
| id | text | NO | - | PK. 인스타 user id |
| user_name | text | NO | - | @username |
| full_name | text | YES | - | 전체 이름 |
| bio | text | YES | - | 소개 |
| followers | int | YES | 0 | 팔로워 수 |
| created_at | timestamptz | YES | now() | |
| updated_at | timestamptz | YES | now() | |

---

## tbl_instagram_content

인스타그램 콘텐츠(게시물).

| 컬럼 | 타입 | NULL | 기본값 | 설명 |
|------|------|------|--------|------|
| id | text | NO | - | PK. 인스타 media id |
| user_id | text | NO | - | tbl_instagram_user.id |
| code | text | NO | - | shortcode |
| taken_at | timestamptz | NO | - | 촬영 시각 |
| caption | text | YES | - | 캡션 |
| is_place | boolean | YES | - | 장소 태그 여부 |
| is_hidden | boolean | YES | false | 숨김 |
| created_at | timestamptz | YES | now() | |
| updated_at | timestamptz | YES | now() | |

**FK**: user_id → tbl_instagram_user

---

## tbl_instagram_place

인스타 콘텐츠-장소 매핑.

| 컬럼 | 타입 | NULL | 기본값 | 설명 |
|------|------|------|--------|------|
| id | int | NO | serial | PK |
| content_id | text | NO | - | tbl_instagram_content.id |
| place_id | text | NO | - | tbl_place.id |
| created_at | timestamptz | YES | now() | |
| updated_at | timestamptz | YES | now() | |

**FK**: content_id → tbl_instagram_content, place_id → tbl_place

---

## tbl_collect_place

커뮤니티(다모앙, 클리앙 등) 수집 글. 원본 링크·메타 저장.

| 컬럼 | 타입 | NULL | 기본값 | 설명 |
|------|------|------|--------|------|
| source | varchar | NO | 'damoang' | PK. damoang, clien 등 |
| link | varchar | NO | - | PK. 원본 글 URL |
| place_url | varchar | YES | - | 네이버 장소 URL |
| place_id | varchar | YES | - | tbl_place.id |
| title | varchar | YES | - | 제목 |
| author | varchar | YES | - | 작성자 |
| views | int | YES | 0 | 조회 수 |
| comments | int | YES | 0 | 댓글 수 |
| likes | int | YES | 0 | 좋아요 수 |
| unixTimestamp | bigint | YES | - | 타임스탬프 |
| date | varchar | YES | - | 날짜 문자열 |
| content | varchar | YES | - | 본문 |
| created_at | timestamptz | YES | now() | |
| updated_at | timestamptz | YES | now() | |

**PK**: (source, link)

---

## tbl_place_bucket

커뮤니티 링크→장소 매핑 원본. 수집 파이프라인용.

| 컬럼 | 타입 | NULL | 기본값 | 설명 |
|------|------|------|--------|------|
| source | varchar | NO | - | 소스(도메인) |
| source_url | varchar | NO | - | 원본 URL |
| source_title | varchar | YES | - | 제목 |
| place_url | varchar | YES | - | 장소 URL |
| created_at | timestamptz | YES | now() | |
| updated_at | timestamptz | YES | now() | |

---

## mv_public_feed (MATERIALIZED VIEW)

피드 소스 통합. tbl_folder_place, tbl_naver_folder_place, tbl_place_features 기반.

| 컬럼 | 타입 | 설명 |
|------|------|------|
| source_type | varchar | folder, naver_folder, youtube_channel, community_region 등 |
| source_id | varchar | 폴더ID, 채널ID 등 |
| source_title | varchar | 소스 제목 |
| source_image | varchar | 소스 이미지 |
| place_id | varchar | tbl_place.id |
| place_data | jsonb | 장소 스냅샷 |
| added_at | timestamptz | 추가 시각 |

인덱스: added_at DESC, source_type, UNIQUE(source_type, source_id, place_id)

---

## v_tbl_place_features (VIEW)

tbl_place_features ∪ tbl_naver_folder_place. 출처 통합 뷰.

- platform_type: youtube, community, instagram, **folder**
- content_url, title, metadata, published_at, is_verified, status

---

## 관련 문서

- [[00-table-summary]]
- [[06-io-mapping]]
- [[../설계/06-source-ecosystem|소스 생태계]]
