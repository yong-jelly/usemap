생성일: 2026-03-03

# 2. COMPONENTS

## 2.1 Navigation

### Header

| Part | Spec |
|------|------|
| Height | 44px (모바일), 56px (태블릿) |
| Padding | 16px horizontal |
| Background | surface |
| Border | 0 1px 0 border (bottom) |

**States**: default, scroll-collapsed (선택적)

**Usage**: 페이지 제목, 뒤로가기, 액션 버튼(공유, 설정)

---

### Tab Bar (Bottom)

| Part | Spec |
|------|------|
| Height | 56px + safe-area-inset-bottom |
| Item | 4~5개 |
| Icon | 24px |
| Label | Caption (12px) |

**States**: default, active (primary 색상)

**Usage**: 홈, 피드, 맛탐정, 프로필

---

### Sidebar (Tablet/Desktop)

| Part | Spec |
|------|------|
| Width | 240px |
| Padding | 24px |

**Usage**: 웹 전용, 모바일에서는 드로어로 대체

---

### Breadcrumbs

| Part | Spec |
|------|------|
| Font | Subheadline |
| Separator | / 또는 chevron |

**Usage**: 폴더 > 소스 > 장소 (깊은 계층 탐색)

---

## 2.2 Input

### Buttons (6 variants)

| Variant | Background | Text | Border | 용도 |
|---------|------------|------|--------|------|
| Primary | primary-600 | white | — | CTA (저장, 구독) |
| Secondary | surface-100 | surface-700 | — | 보조 액션 |
| Outline | transparent | surface-700 | surface-200 | 취소, 대안 |
| Ghost | transparent | surface-600 | — | 툴바, 시트 내 |
| Destructive | accent-rose | white | — | 삭제 |
| Link | transparent | primary-600 | — | 텍스트 링크 |

**Sizes**: sm (h-8), md (h-9), lg (h-11), icon (h-9 w-9)

**States**: default, hover, active, disabled, loading

**Accessibility**: focus-visible ring 2px primary-500/40, ring-offset 2px

---

### Text Fields

| Part | Spec |
|------|------|
| Height | 44px (모바일) |
| Padding | 12px 16px |
| Border | 1px surface-200, radius 8px |
| Font | Body |

**States**: default, focus (ring), error (border error), disabled

**Usage**: 검색, 폴더명, 메모

---

### Dropdowns

| Part | Spec |
|------|------|
| Trigger | Text field와 동일 |
| Menu | shadow-soft-lg, radius 12px, max-h 320px |

**Usage**: 정렬, 필터, 폴더 선택

---

### Toggles

| Part | Spec |
|------|------|
| Track | 44×24px, radius 12px |
| Thumb | 20×20px, radius 10px |

**States**: off (surface-200), on (primary-600)

**Usage**: 구독, 좋아요 토글, 설정

---

### Checkboxes

| Part | Spec |
|------|------|
| Size | 20×20px |
| Border | 2px |
| Radius | 4px |

**States**: unchecked, checked, indeterminate, disabled

---

### Radio Buttons

| Part | Spec |
|------|------|
| Size | 20×20px |
| Border | 2px |

**Usage**: 단일 선택 (정렬, 지역)

---

### Sliders

| Part | Spec |
|------|------|
| Track | 4px height |
| Thumb | 20×20px |

**Usage**: 거리 범위, 가격 범위 (필터)

---

## 2.3 Feedback

### Alerts

| Variant | Background | Border | Icon |
|---------|------------|--------|------|
| Success | success/10 | success/30 | check |
| Warning | warning/10 | warning/30 | alert |
| Error | error/10 | error/30 | x |
| Info | info/10 | info/30 | info |

**Spec**: padding 16px, radius 8px

---

### Toasts

| Part | Spec |
|------|------|
| Position | bottom, 16px from safe-area |
| Max width | 343px |
| Padding | 12px 16px |
| Duration | 2~3s |

**Usage**: 저장 완료, 복사 완료

---

### Modals

| Part | Spec |
|------|------|
| Overlay | bg-black/50 |
| Content | radius 16px top, max-h 90vh |
| Padding | 24px |

**Usage**: 장소 상세, 폴더 선택, 확인 다이얼로그

---

### Progress Indicators

| Type | Spec |
|------|------|
| Spinner | 24px, primary |
| Linear | 4px height, primary |

**Usage**: 로딩, 업로드

---

### Skeleton Screens

| Part | Spec |
|------|------|
| Color | surface-200 |
| Animation | pulse |
| Radius | 4px |

**Usage**: 카드 리스트, 프로필

---

## 2.4 Data Display

### Cards

#### PlaceCard (장소 카드)

| Part | Spec |
|------|------|
| Image | 16:9, radius 12px top |
| Content | padding 12px 16px |
| Title | Title 2 |
| Meta | Subheadline, muted |

**Anatomy**: Image, Title, Meta(지역·카테고리), 출처 배지, 액션(좋아요, 저장)

---

#### FolderCard (폴더 카드)

| Part | Spec |
|------|------|
| Thumbnail | 4장 그리드 또는 단일 |
| Title | Title 2 |
| Subtitle | Subheadline |

---

#### SourceCard (소스 카드)

| Part | Spec |
|------|------|
| Avatar | 40×40px |
| Title | Title 3 |
| Meta | 구독자, 장소 수 |

---

### Tables

| Part | Spec |
|------|------|
| Header | Subheadline, surface-50 |
| Cell | Body, padding 12px 16px |
| Border | 0 1px 0 surface-200 |

**Usage**: 웹 전용, 관리자

---

### Lists

| Part | Spec |
|------|------|
| Item height | 56px (기본), 72px (2줄) |
| Divider | 1px surface-100 |
| Chevron | 20×20px, muted |

**Usage**: 설정, 프로필 메뉴, 폴더 목록

---

### Stats

| Part | Spec |
|------|------|
| Value | Title 1 |
| Label | Caption |

**Usage**: 구독자 수, 저장 수, 출처 개수

---

### Charts

| Part | Spec |
|------|------|
| Colors | chart-1~5 |
| Legend | Caption |

**Usage**: 프로필 분석 (선택)

---

## 2.5 Media

### Image Containers

| Part | Spec |
|------|------|
| Aspect | 16:9 (카드), 1:1 (썸네일) |
| Radius | 8px, 12px |
| Object-fit | cover |

---

### Video Players

| Part | Spec |
|------|------|
| Thumbnail | 16:9 |
| Play icon | 48×48px, center |

**Usage**: 유튜브 출처 링크

---

### Avatars

| Size | Spec |
|------|------|
| sm | 24×24px |
| md | 40×40px |
| lg | 64×64px |

**States**: default, loading (skeleton)

---

## 2.6 맛탐정 전용 컴포넌트

### Source Badge (출처 배지)

| Part | Spec |
|------|------|
| Padding | 4px 8px |
| Font | Caption |
| Radius | 6px |
| Variants | youtube (red), community (blue), folder (primary) |

**Usage**: Traceable 원칙, 출처 표시

---

### Collection Save Sheet (저장 시트)

| Part | Spec |
|------|------|
| Height | 60~80vh |
| Header | 제목, 닫기 |
| List | 폴더 목록, 체크박스 |
| Footer | 저장 버튼 |

**Usage**: 폴더에 저장하기

---

### Place Action Row

| Part | Spec |
|------|------|
| Actions | 좋아요, 저장, 네이버, 더보기 |
| Icon size | 24px |
| Spacing | 16px |

**Usage**: 장소 상세 하단
