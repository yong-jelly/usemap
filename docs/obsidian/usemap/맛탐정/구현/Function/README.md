생성일: 2026-03-03

# 맛탐정 Supabase 함수 문서

public 스키마 RPC 함수 목록 및 기능 정리.
모델링 문서처럼 드라이하게 나열함. docs/sql 및 psql로 검증함.

## 문서 목차

| 문서 | 설명 |
|------|------|
| [[00-function-summary]] | 전체 함수 목록 및 한 줄 정의 |
| [[01-place-functions]] | Place 도메인 (장소 조회, 출처, 리뷰, 방문 등) |
| [[02-folder-functions]] | Folder 도메인 (폴더 CRUD, 구독, 초대) |
| [[03-user-functions]] | User 도메인 (프로필, 위치, 인터랙션) |
| [[04-feed-functions]] | Feed 도메인 (피드, 소스별 장소 목록) |
| [[05-instagram-functions]] | Instagram 도메인 (인스타 파서) |
| [[06-utility-functions]] | Utility (응답, 집계, 태그, 관리자) |
| [[07-sql-file-mapping]] | 함수 ↔ SQL 파일 매핑 |

## 버전 규칙

- v1: 초기 API
- v2: 응답 형식·파라미터 개선
- v3: visited_only, 거리순 등 추가
- v4~v6: get_my_feed 성능·기능 개선

## 관련 문서

- [[../모델링/README|데이터 모델링]]
- [[../../설계/README|설계 문서]]
