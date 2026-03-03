생성일: 2026-03-03

# User 도메인 테이블

사용자·인터랙션(좋아요, 저장, 방문, 댓글) 관련 테이블.

## tbl_user_profile

사용자 프로필. auth.users와 1:1.

| 컬럼 | 타입 | NULL | 기본값 | 설명 |
|------|------|------|--------|------|
| auth_user_id | uuid | NO | - | PK. auth.users.id |
| public_profile_id | uuid | NO | uuid_generate_v4() | 공개용 ID |
| nickname | text | NO | - | 닉네임 |
| bio | text | YES | - | 소개 |
| profile_image_url | text | YES | - | 프로필 이미지 |
| username | text | YES | - | 유저네임 (UNIQUE) |
| email | text | YES | - | 이메일 |
| gender_code | varchar | YES | - | 성별 |
| age_group_code | varchar | YES | - | 연령대 |
| role | text | YES | 'user' | 역할 |
| created_at | timestamptz | NO | now() | |
| updated_at | timestamptz | NO | now() | |

**FK**: auth_user_id → auth.users

---

## tbl_user (레거시)

OAuth 사용자. tbl_user_profile로 이전됨.

| 컬럼 | 타입 | NULL | 설명 |
|------|------|------|------|
| id | varchar | NO | PK. OAuth provider id |
| provider | varchar | NO | PK. OAuth provider |
| nickname | varchar | YES | |
| avatar | varchar | YES | |
| email | varchar | YES | |
| created_at | timestamptz | YES | |
| updated_at | timestamptz | YES | |

**PK**: (id, provider)

---

## tbl_location

사용자 위치 기록. 거리 기반 추천용.

| 컬럼 | 타입 | NULL | 기본값 | 설명 |
|------|------|------|--------|------|
| id | uuid | NO | gen_random_uuid() | PK |
| user_id | uuid | YES | - | auth.users.id |
| latitude | float8 | NO | - | 위도 |
| longitude | float8 | NO | - | 경도 |
| nearest_place_id | varchar | YES | - | 가장 가까운 장소 |
| nearest_place_name | varchar | YES | - | |
| nearest_place_address | varchar | YES | - | |
| distance_meters | float8 | YES | - | 거리(m) |
| created_at | timestamptz | YES | now() | |
| updated_at | timestamptz | YES | now() | |

---

## tbl_like

좋아요. liked_id+liked_type으로 다형 참조.

| 컬럼 | 타입 | NULL | 기본값 | 설명 |
|------|------|------|--------|------|
| id | uuid | NO | uuid_generate_v4() | PK |
| user_id | uuid | NO | - | auth.users.id |
| liked_id | text | NO | - | 대상 ID (place_id 등) |
| liked_type | text | NO | - | place, folder 등 |
| ref_liked_id | varchar | YES | - | 참조 ID |
| liked | boolean | NO | true | 좋아요 여부 |
| created_at | timestamptz | NO | now() | |
| updated_at | timestamptz | NO | now() | |

**FK**: user_id → auth.users

---

## tbl_save

저장(콜렉션). saved_id+saved_type으로 다형 참조.

| 컬럼 | 타입 | NULL | 기본값 | 설명 |
|------|------|------|--------|------|
| id | uuid | NO | uuid_generate_v4() | PK |
| user_id | uuid | NO | - | auth.users.id |
| saved_id | text | NO | - | 대상 ID |
| saved_type | text | NO | - | place, folder 등 |
| ref_saved_id | text | YES | - | 참조 ID |
| saved | boolean | NO | true | 저장 여부 |
| created_at | timestamptz | NO | now() | |
| updated_at | timestamptz | NO | now() | |

**FK**: user_id → auth.users  
**UNIQUE**: (user_id, saved_id, saved_type)

---

## tbl_visited

방문 기록.

| 컬럼 | 타입 | NULL | 기본값 | 설명 |
|------|------|------|--------|------|
| id | uuid | NO | uuid_generate_v4() | PK |
| user_id | uuid | NO | - | auth.users.id |
| place_id | varchar | NO | - | tbl_place.id |
| visited_at | timestamptz | YES | - | 방문일시 |
| companion | text | YES | - | 동행자 |
| note | text | YES | - | 메모 |
| created_at | timestamptz | NO | now() | |
| updated_at | timestamptz | NO | now() | |

**FK**: user_id → auth.users

---

## tbl_recent_view

최근 본 장소. content_id+content_type으로 다형 참조.

| 컬럼 | 타입 | NULL | 기본값 | 설명 |
|------|------|------|--------|------|
| id | uuid | NO | uuid_generate_v4() | PK |
| user_id | uuid | NO | - | auth.users.id |
| content_id | text | NO | - | place_id 등 |
| content_type | text | NO | - | place 등 |
| ref_liked_id | varchar | YES | - | 참조 ID |
| count | int | NO | 1 | 조회 횟수 |
| created_at | timestamptz | NO | now() | |
| updated_at | timestamptz | NO | now() | |

**FK**: user_id → auth.users

---

## tbl_comment_for_place

장소 댓글. 대댓글(parent_comment_id) 지원.

| 컬럼 | 타입 | NULL | 기본값 | 설명 |
|------|------|------|--------|------|
| id | uuid | NO | uuid_generate_v4() | PK |
| user_id | uuid | YES | - | auth.users.id |
| title | text | YES | - | 제목 |
| content | text | NO | - | 내용 |
| business_id | text | NO | - | tbl_place.id |
| image_paths | text[] | YES | - | 이미지 |
| parent_comment_id | uuid | YES | - | 부모 댓글 |
| comment_level | int | NO | 0 | 댓글 레벨 |
| is_active | boolean | NO | true | 활성 |
| created_at | timestamptz | NO | now() | |
| updated_at | timestamptz | NO | now() | |

**FK**: user_id → auth.users, parent_comment_id → self

---

## tbl_comment_likes_for_place

댓글 좋아요.

| 컬럼 | 타입 | NULL | 기본값 | 설명 |
|------|------|------|--------|------|
| comment_id | uuid | NO | - | PK. tbl_comment_for_place.id |
| user_id | uuid | NO | - | PK. auth.users.id |
| created_at | timestamptz | NO | now() | |

**PK**: (comment_id, user_id)  
**FK**: comment_id → tbl_comment_for_place, user_id → auth.users

---

## tbl_feature_subscription

소스(유튜브 채널, 네이버 폴더 등) 구독. 소프트 삭제 지원.

| 컬럼 | 타입 | NULL | 기본값 | 설명 |
|------|------|------|--------|------|
| id | uuid | NO | gen_random_uuid() | PK |
| user_id | uuid | NO | - | auth.users.id |
| feature_type | varchar | NO | - | youtube, folder 등 |
| feature_id | varchar | NO | - | 채널ID, 폴더ID 등 |
| created_at | timestamptz | YES | now() | |
| updated_at | timestamptz | YES | now() | |
| deleted_at | timestamptz | YES | - | 소프트 삭제 |

**FK**: user_id → auth.users  
**UNIQUE**: (user_id, feature_type, feature_id)

---

## 관련 문서

- [[00-table-summary]]
- [[06-io-mapping]]
