생성일: 2026-03-03

# Folder 도메인 테이블

맛탐정 폴더(콜렉션)·구독·초대 관련 테이블.

## tbl_folder

맛탐정 폴더(콜렉션). 사용자 생성 큐레이션.

| 컬럼 | 타입 | NULL | 기본값 | 설명 |
|------|------|------|--------|------|
| id | varchar | NO | gen_random_uuid() | PK |
| owner_id | uuid | NO | - | 소유자 (auth.users) |
| title | varchar(20) | NO | - | 제목 |
| description | varchar(50) | YES | - | 설명 |
| permission | varchar | YES | 'public' | public, private |
| permission_write_type | int | YES | 0 | 쓰기 권한 타입 |
| invite_code | varchar(5) | YES | - | 초대 코드 |
| invite_code_expires_at | timestamptz | YES | - | 초대 만료 |
| subscriber_count | int | YES | 0 | 구독자 수 |
| place_count | int | YES | 0 | 장소 수 |
| is_hidden | boolean | YES | false | 숨김 |
| created_at | timestamptz | YES | now() | |
| updated_at | timestamptz | YES | now() | |

**FK**: owner_id → auth.users

---

## tbl_folder_place

폴더-장소 매핑. 소프트 삭제(deleted_at) 지원.

| 컬럼 | 타입 | NULL | 기본값 | 설명 |
|------|------|------|--------|------|
| folder_id | varchar | NO | - | PK. tbl_folder.id |
| user_id | uuid | NO | - | PK. 추가한 사용자 |
| place_id | varchar | NO | - | PK. tbl_place.id |
| comment | text | YES | - | 메모 |
| created_at | timestamptz | YES | now() | |
| deleted_at | timestamptz | YES | - | 소프트 삭제 |
| updated_at | timestamptz | YES | now() | |

**PK**: (folder_id, user_id, place_id)

---

## tbl_folder_subscribed

폴더 구독. 소프트 삭제 지원.

| 컬럼 | 타입 | NULL | 기본값 | 설명 |
|------|------|------|--------|------|
| folder_id | varchar | NO | - | PK. tbl_folder.id |
| user_id | uuid | NO | - | PK. 구독자 |
| activation | boolean | YES | true | 활성 |
| created_at | timestamptz | YES | now() | |
| updated_at | timestamptz | YES | now() | |
| deleted_at | timestamptz | YES | - | 소프트 삭제 |

**PK**: (folder_id, user_id)

---

## tbl_folder_invite_history

폴더 초대 이력.

| 컬럼 | 타입 | NULL | 기본값 | 설명 |
|------|------|------|--------|------|
| id | uuid | NO | gen_random_uuid() | PK |
| folder_id | varchar | NO | - | tbl_folder.id |
| invite_code | varchar(5) | NO | - | 초대 코드 |
| invited_user_id | uuid | YES | - | 초대받은 사용자 |
| status | varchar | YES | 'pending' | pending, accepted |
| created_at | timestamptz | YES | now() | |
| accepted_at | timestamptz | YES | - | |
| expires_at | timestamptz | NO | - | 만료 |

---

## tbl_folder_review

폴더 내 장소 리뷰. 소프트 삭제 지원.

| 컬럼 | 타입 | NULL | 기본값 | 설명 |
|------|------|------|--------|------|
| id | uuid | NO | gen_random_uuid() | PK |
| folder_id | varchar | NO | - | tbl_folder.id |
| user_id | uuid | NO | - | 작성자 |
| place_id | varchar | NO | - | tbl_place.id |
| review_content | text | YES | - | 리뷰 내용 |
| score | numeric(2) | YES | - | 별점 |
| created_at | timestamptz | YES | now() | |
| updated_at | timestamptz | YES | now() | |
| deleted_at | timestamptz | YES | - | 소프트 삭제 |

---

## 관련 문서

- [[00-table-summary]]
- [[06-io-mapping]]
