# usemap

맛집 큐레이션 및 공유 플랫폼입니다. 사용자가 자신만의 맛집 리스트를 폴더 형태로 관리하고, 다른 사용자의 큐레이션을 구독하여 피드 형식으로 소식을 받아볼 수 있습니다.

## 프로젝트 개요

usemap은 다음과 같은 주요 기능을 제공합니다:

- **맛탐정(폴더) 시스템**: 사용자가 장소를 큐레이션하고 관리하는 폴더 기능
- **구독 피드**: 다양한 소스(네이버 지도, 유튜브, 인스타그램 등)의 콘텐츠를 구독하여 피드로 확인
- **장소 탐색**: 지역별, 테마별, 카테고리별 장소 검색 및 탐색
- **리뷰 및 방문 기록**: 장소에 대한 리뷰 작성 및 방문 기록 관리
- **지도 기반 탐색**: Mapbox GL을 활용한 지도 기반 장소 탐색

## 폴더 구조

```
usemap/
├── src/                          # 프론트엔드 소스 코드
│   ├── app/                      # 애플리케이션 진입점 및 라우팅
│   │   ├── App.tsx               # 메인 앱 컴포넌트
│   │   ├── providers/            # React Query, Zustand 등 프로바이더
│   │   └── router/               # React Router 설정
│   ├── features/                 # 기능별 UI 컴포넌트 (FDS 패턴)
│   │   ├── auth/                 # 인증 관련 UI
│   │   ├── explorer/             # 탐색 기능 UI
│   │   ├── folder/               # 폴더 관련 UI
│   │   ├── home/                 # 홈 화면 UI
│   │   ├── location/             # 위치 설정 UI
│   │   ├── place/                # 장소 관련 UI
│   │   └── profile/               # 프로필 관련 UI
│   ├── entities/                 # 비즈니스 엔티티 (FDS 패턴)
│   │   ├── folder/               # 폴더 엔티티 (api, queries, types)
│   │   ├── home/                 # 홈 엔티티
│   │   ├── location/             # 위치 엔티티
│   │   ├── place/                # 장소 엔티티
│   │   └── user/                 # 사용자 엔티티
│   ├── shared/                   # 공유 컴포넌트 및 유틸리티
│   │   ├── api/                  # API 클라이언트 및 Edge Function 호출
│   │   ├── config/               # 설정 파일 (Mapbox, 필터 상수 등)
│   │   ├── lib/                  # 유틸리티 함수 (날짜, 위치, Supabase 등)
│   │   ├── model/                # 전역 상태 관리 (Zustand 스토어)
│   │   └── ui/                   # 공유 UI 컴포넌트
│   ├── widgets/                  # 복합 위젯 컴포넌트
│   │   ├── BottomNav.tsx         # 하단 네비게이션
│   │   ├── DetailHeader/         # 상세 헤더 위젯
│   │   ├── DiscoverGrid.tsx      # Discover 그리드
│   │   ├── ExploreFilterSheet/   # 탐색 필터 시트
│   │   ├── Header.tsx            # 메인 헤더
│   │   ├── PlaceCard.tsx         # 장소 카드
│   │   └── ...
│   ├── pages/                    # 페이지 컴포넌트
│   │   ├── HomePage.tsx
│   │   ├── FeedPage.tsx
│   │   ├── ExplorerPage.tsx
│   │   ├── MapPage.tsx
│   │   ├── auth/                 # 인증 관련 페이지
│   │   ├── folder/               # 폴더 관련 페이지
│   │   ├── profile/              # 프로필 관련 페이지
│   │   └── ...
│   ├── stories/                  # Storybook 스토리
│   └── main.tsx                  # 애플리케이션 진입점
├── tools/                        # CLI 도구 및 유틸리티
│   ├── cli/                      # CLI 스크립트
│   │   ├── folder.ts             # 네이버 폴더 동기화
│   │   ├── folder-user.ts        # 사용자 폴더 임포트
│   │   ├── place.ts              # 장소 크롤링
│   │   └── review.ts             # 리뷰 관리
│   ├── map/                      # 네이버 지도 크롤러 모듈
│   │   ├── src/
│   │   │   ├── pipeline/         # 크롤링 파이프라인
│   │   │   ├── box/              # 지리적 영역 관리
│   │   │   ├── graphql/          # 네이버 API 통신
│   │   │   └── db/               # SQLite 스키마
│   │   └── upsert_to_supabase.ts # Supabase 동기화
│   ├── shared/                   # 공유 유틸리티
│   └── sql-sync.ts               # SQL 동기화 스크립트
├── supabase/                     # Supabase 설정 및 함수
│   ├── functions/                # Edge Functions
│   │   ├── fn_v1_crw_for_place_queue/  # 장소 큐 크롤링
│   │   ├── fn_v1_import_place_to_folder/ # 폴더 임포트
│   │   ├── fn_v1_parse_social_url/      # 소셜 URL 파싱
│   │   ├── get-home-discover/           # 홈 Discover 데이터
│   │   └── graph-search-place/           # 그래프 검색
│   └── migrations/               # 데이터베이스 마이그레이션
├── docs/                         # 프로젝트 문서
│   ├── md/                       # 마크다운 문서
│   └── sql/                      # SQL 스크립트
├── .storybook/                   # Storybook 설정
├── public/                       # 정적 파일
├── index.html                    # HTML 진입점
├── vite.config.ts                # Vite 설정
├── tsconfig.json                 # TypeScript 설정
├── tailwind.config.ts            # Tailwind CSS 설정
└── package.json                  # 의존성 관리
```

## 프로젝트 아키텍처

### Feature-Driven Structure (FDS) 패턴

이 프로젝트는 **Feature-Driven Structure (FDS)** 패턴을 따릅니다:

- **`features/`**: 기능별 UI 컴포넌트 및 로직
  - 각 기능은 독립적인 폴더로 구성
  - 예: `auth`, `folder`, `place`, `profile` 등

- **`entities/`**: 비즈니스 엔티티 레이어
  - 각 엔티티는 `api.ts`, `queries.ts`, `types.ts`로 구성
  - React Query를 활용한 데이터 페칭 및 캐싱
  - 예: `folder`, `place`, `user` 등

- **`shared/`**: 공유 컴포넌트 및 유틸리티
  - 재사용 가능한 UI 컴포넌트 (`ui/`)
  - 공통 유틸리티 함수 (`lib/`)
  - API 클라이언트 및 설정 (`api/`, `config/`)

- **`widgets/`**: 복합 위젯 컴포넌트
  - 여러 기능을 조합한 복합 컴포넌트
  - 예: `BottomNav`, `DetailHeader`, `PlaceCard` 등

- **`pages/`**: 페이지 컴포넌트
  - 라우트와 직접 매핑되는 페이지 컴포넌트
  - 기능별 컴포넌트를 조합하여 구성

### 상태 관리

- **Zustand**: 전역 상태 관리 (UI 상태, 인증 모달 등)
- **React Query (@tanstack/react-query)**: 서버 상태 관리 및 캐싱
- **React Router**: 클라이언트 사이드 라우팅

### 백엔드 아키텍처

- **Supabase**: 백엔드 서비스
  - PostgreSQL 데이터베이스
  - Edge Functions (Deno 런타임)
  - 인증 및 스토리지
- **PostGIS**: 지리적 데이터 처리
- **Materialized Views**: 성능 최적화를 위한 캐싱

## 주요 라이브러리

### 프론트엔드 핵심
- **React 19**: UI 라이브러리
- **TypeScript**: 타입 안정성
- **Vite**: 빌드 도구 및 개발 서버
- **React Router 7**: 클라이언트 사이드 라우팅

### 상태 관리 및 데이터 페칭
- **@tanstack/react-query**: 서버 상태 관리 및 캐싱
- **zustand**: 전역 상태 관리

### UI 라이브러리
- **Tailwind CSS**: 유틸리티 기반 CSS 프레임워크
- **framer-motion**: 애니메이션 라이브러리
- **lucide-react**: 아이콘 라이브러리
- **@radix-ui/react-dialog**: 접근성 있는 다이얼로그 컴포넌트
- **sonner**: 토스트 알림 라이브러리
- **vaul**: Drawer 컴포넌트

### 지도 및 위치
- **mapbox-gl**: 지도 렌더링
- **@types/mapbox-gl**: Mapbox 타입 정의

### 날짜 및 유틸리티
- **date-fns**: 날짜 처리 라이브러리
- **clsx**: 조건부 클래스명 유틸리티
- **tailwind-merge**: Tailwind 클래스 병합

### 백엔드 및 데이터베이스
- **@supabase/supabase-js**: Supabase 클라이언트
- **postgres**: PostgreSQL 클라이언트 (CLI 도구용)

### 개발 도구
- **Storybook**: 컴포넌트 개발 및 문서화
- **Vitest**: 테스트 프레임워크
- **Playwright**: 브라우저 테스트
- **TypeScript**: 타입 체킹

### CLI 도구
- **Bun**: 고성능 JavaScript 런타임 (CLI 스크립트 실행)

## 설정 방법

### 1. 의존성 설치

```bash
bun install
```

### 2. 환경 변수 설정

프로젝트 루트에 `.env` 파일을 생성하고 다음 환경 변수를 설정하세요:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. 개발 서버 실행

```bash
bun run dev
```

개발 서버는 `http://localhost:5188`에서 실행됩니다.

### 4. 빌드

```bash
bun run build
```

### 5. Storybook 실행

```bash
bun run storybook
```

Storybook은 `http://localhost:6006`에서 실행됩니다.

### 6. SQL 동기화 (CLI)

```bash
bun run sql-sync
```

## 추가 정보

- **데이터베이스**: PostgreSQL (Supabase)
- **시간대 설정**: 모든 시간 데이터는 한국 표준시(KST, UTC+9) 기준으로 처리
- **모바일 최적화**: 모바일 우선 설계, 최대 너비 512px 컨테이너
- **성능 최적화**: 모바일 성능 최적화 가이드 준수 (backdrop-blur 금지 등)

## 프로젝트 생성 정보

이 프로젝트는 `bun init`을 사용하여 생성되었으며, [Bun](https://bun.com)을 빠른 올인원 JavaScript 런타임으로 사용합니다.
