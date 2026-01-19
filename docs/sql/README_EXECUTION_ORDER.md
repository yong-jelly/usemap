# SQL 실행 순서 안내

본 디렉토리의 SQL 파일들은 아래 순서대로 실행되어야 합니다.

## 1. 초기 설정 및 테이블 생성
1.  `001_create_extensions.sql`: 확장 모듈(UUID, PostGIS 등) 활성화
2.  `002_create_common_functions.sql`: 공통 트리거 함수 (`updated_at` 등)
3.  `003_create_tbl_user_profile.sql`: 사용자 프로필 테이블
4.  `004_create_interaction_tables.sql`: 좋아요, 저장, 방문 기록
5.  `005_create_place_tables.sql`: 장소 메인 및 분석 테이블
6.  `006_create_comment_tables.sql`: 댓글 관련 테이블
7.  `007_create_tag_tables.sql`: 태그 마스터 및 연결 테이블
8.  `008_create_folder_tables.sql`: 폴더 관련 테이블
9.  `009_create_review_tables.sql`: 리뷰 및 투표 관련 테이블
10. `020_create_utility_tables.sql`: 기타 유틸리티 테이블 (버킷, 검색이력 등)

## 2. RPC 함수 정의 (v1 API)
11. `010_v1_user_profile_functions.sql`: 프로필 관리
12. `011_v1_place_functions.sql`: 장소 조회
13. `012_v1_comment_functions.sql`: 댓글 관리
14. `013_v1_interaction_functions.sql`: 좋아요/저장 토글
15. `014_v1_review_functions.sql`: 사용자 리뷰 관리
16. `015_v1_tag_functions.sql`: 태그 관리
17. `016_v1_aggregation_functions.sql`: 통계 집계
18. `017_v1_utility_functions.sql`: 공통 응답 처리
19. `018_v1_more_aggregation_functions.sql`: 추가 집계 함수
20. `019_v1_search_and_list_functions.sql`: 검색 및 개인화 목록
21. `021_v1_list_places_by_filters.sql`: 필터 기반 장소 목록 조회
    22. `080_location_functions.sql`: 사용자 위치 관리 및 거리순 정렬
    23. `081_optimize_v4_get_my_feed.sql`: 내 피드 조회 v4 성능 최적화 (v3 대체)
    
