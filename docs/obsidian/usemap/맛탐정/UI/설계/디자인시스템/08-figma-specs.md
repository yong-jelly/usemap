생성일: 2026-03-03

# 8. Figma Implementation Specs

맛탐정 디자인 시스템의 Figma 구현 가이드.
주니어 디자이너가 따라서 빌드할 수 있도록 구체적 수치와 절차를 명시함.

---

## 1. FRAME STRUCTURE

### 1.1 Page Organization

Figma 파일 내 Page 구성:

```text
맛탐정 Design System
├── 📄 Cover                    # 파일 표지, 버전, 최종 수정일
├── 📄 Foundations              # 컬러, 타이포, 스페이싱, 그리드
├── 📄 Icons                    # 아이콘 세트 (Lucide 기반)
├── 📄 Components               # 모든 컴포넌트 마스터
├── 📄 Patterns                 # 조합 패턴 (카드 그룹, 시트 등)
├── 📄 Screens — Mobile         # 375px 기준 전체 화면
├── 📄 Screens — Tablet         # 768px 화면 (선택)
├── 📄 Prototypes               # 인터랙션 연결된 프로토타입
└── 📄 Handoff                  # 개발자 전달용 주석 화면
```

### 1.2 Naming Conventions

| 계층 | 형식 | 예시 |
|------|------|------|
| Page | PascalCase | `Screens — Mobile` |
| Frame (화면) | PascalCase/슬래시 | `Home/Recommend` |
| Component | PascalCase/슬래시 | `Button/Primary/Medium` |
| Layer | camelCase | `iconLeft`, `labelText`, `actionRow` |
| Instance | 원본 이름 유지 | `Button/Primary/Medium` |
| Auto-layout frame | 용도 기술 | `_contentStack`, `_headerRow` |

접두사 규칙:
- `_` : 내부 구조용 프레임 (배포 대상 아님)
- `.` : 숨김 레이어 (Figma에서 퍼블리시 제외)

### 1.3 Grid System Setup

#### Mobile (375 × 812)

| 속성 | 값 |
|------|-----|
| Type | Column |
| Count | 4 |
| Gutter | 16px |
| Margin | 16px |
| Color | #7C3AED, 10% opacity |

#### Tablet (768 × 1024)

| 속성 | 값 |
|------|-----|
| Count | 8 |
| Gutter | 24px |
| Margin | 24px |

#### Desktop (1440 × 900)

| 속성 | 값 |
|------|-----|
| Count | 12 |
| Gutter | 24px |
| Margin | 48px |
| Max width | 512px (center) |

### 1.4 Responsive Constraints

| 요소 | Horizontal | Vertical |
|------|------------|----------|
| Header | Left and Right (stretch) | Top, Fixed height |
| Content area | Left and Right (stretch) | Top and Bottom (stretch) |
| Tab Bar | Left and Right (stretch) | Bottom, Fixed height |
| Card | Left and Right (stretch) | Top, Hug contents |
| 모달 overlay | Left and Right, Top and Bottom | Scale |
| 시트 content | Left and Right (stretch) | Bottom, Hug → max-h |

---

## 2. AUTO-LAYOUT SPECIFICATIONS

모든 수치는 **모바일(375px)** 기준.

### 2.1 Navigation

#### Header

```text
[← Back]   [Title]   [Action1] [Action2]
```

| 속성 | 값 |
|------|-----|
| Direction | Horizontal → |
| Padding | 0, 16, 0, 16 (top, right, bottom, left) |
| Spacing | 8 |
| Distribution | Space-between |
| Align | Center |
| Width | Fill container |
| Height | Fixed 44 |
| Fill | surface (#FFFFFF) |
| Stroke | bottom 1px, border (#E5E5E5) |

내부 구조:

| 요소 | Resizing |
|------|----------|
| Back button | Hug contents |
| Title text | Fill container |
| Action buttons | Hug contents |

#### Tab Bar (Bottom)

```text
[홈]  [피드]  [맛탐정]  [프로필]
```

| 속성 | 값 |
|------|-----|
| Direction | Horizontal → |
| Padding | 8, 0, 0, 0 (safe-area 별도) |
| Spacing | 0 |
| Distribution | Space-between |
| Align | Top |
| Width | Fill container |
| Height | Fixed 56 |
| Fill | surface (#FFFFFF) |
| Stroke | top 1px, border (#E5E5E5) |

각 Tab Item:

| 속성 | 값 |
|------|-----|
| Direction | Vertical ↓ |
| Padding | 4, 0, 4, 0 |
| Spacing | 2 |
| Align | Center |
| Width | Fill container |
| Height | Hug contents |

---

### 2.2 Input Components

#### Button

| 속성 | SM (h-32) | MD (h-36) | LG (h-44) | Icon (h-36) |
|------|-----------|-----------|-----------|-------------|
| Direction | Horizontal → | Horizontal → | Horizontal → | — |
| Padding T/B | 0 | 0 | 0 | 0 |
| Padding L/R | 12 | 16 | 20 | 0 |
| Spacing | 8 | 8 | 8 | 0 |
| Align | Center | Center | Center | Center |
| Width | Hug contents | Hug contents | Fill container | Fixed 36 |
| Height | Fixed 32 | Fixed 36 | Fixed 44 | Fixed 36 |
| Radius | 8 | 8 | 8 | 8 |

#### Text Field

| 속성 | 값 |
|------|-----|
| Direction | Horizontal → |
| Padding | 12, 16, 12, 16 |
| Spacing | 8 |
| Align | Center |
| Width | Fill container |
| Height | Fixed 44 |
| Radius | 8 |
| Stroke | 1px, surface-200 (#E5E5E5) |

내부:

| 요소 | Resizing |
|------|----------|
| Icon (optional) | Fixed 20×20 |
| Input text | Fill container |
| Clear button (optional) | Fixed 20×20 |

#### Text Field + Label + Error (Form Group)

| 속성 | 값 |
|------|-----|
| Direction | Vertical ↓ |
| Padding | 0 |
| Spacing | 4 |
| Align | Left (stretch) |
| Width | Fill container |
| Height | Hug contents |

내부:

| 요소 | Style | Resizing |
|------|-------|----------|
| Label | Subheadline/Medium, surface-700 | Fill container |
| Text Field | (위 참조) | Fill container |
| Error text | Caption/Regular, error (#EF4444) | Fill container |

#### Toggle

| 속성 | 값 |
|------|-----|
| Track | Fixed 44×24, radius 12, fill surface-200(off) / primary-600(on) |
| Thumb | Fixed 20×20, radius 10, fill white, offset 2px from edge |

#### Checkbox Row

| 속성 | 값 |
|------|-----|
| Direction | Horizontal → |
| Padding | 0 |
| Spacing | 12 |
| Align | Center |
| Width | Fill container |
| Height | Hug contents |

내부:

| 요소 | Resizing |
|------|----------|
| Checkbox (20×20) | Fixed |
| Label text | Fill container |

---

### 2.3 Feedback Components

#### Toast

| 속성 | 값 |
|------|-----|
| Direction | Horizontal → |
| Padding | 12, 16, 12, 16 |
| Spacing | 8 |
| Align | Center |
| Width | Hug contents (max 343) |
| Height | Hug contents |
| Radius | 8 |
| Fill | surface-900 (#171717) |
| Shadow | soft-lg |

내부:

| 요소 | Resizing |
|------|----------|
| Icon (optional) | Fixed 20×20 |
| Message text (Body, white) | Hug contents |
| Action text (optional) | Hug contents |

#### Alert

| 속성 | 값 |
|------|-----|
| Direction | Horizontal → |
| Padding | 16, 16, 16, 16 |
| Spacing | 12 |
| Align | Top |
| Width | Fill container |
| Height | Hug contents |
| Radius | 8 |
| Stroke | 1px, variant에 따라 |

#### Skeleton (PlaceCard)

| 속성 | 값 |
|------|-----|
| Direction | Vertical ↓ |
| Width | Fill container |
| Image placeholder | Fill container, Fixed height (W×9/16), radius 12 top, fill surface-200 |
| Text block 1 | 60% width, h-16, radius 4, fill surface-200 |
| Text block 2 | 40% width, h-12, radius 4, fill surface-200 |

---

### 2.4 Data Display Components

#### PlaceCard (Standard)

```text
+---------------------------+
|        [Image 16:9]       |
+---------------------------+
| Title                     |
| Region · Category         |
| [Badge] [Badge]    ♡  ⊞  |
+---------------------------+
```

| 속성 | 값 |
|------|-----|
| Direction | Vertical ↓ |
| Padding | 0 |
| Spacing | 0 |
| Width | Fill container |
| Height | Hug contents |
| Radius | 12 |
| Stroke | 1px, surface-200 (선택) |
| Clip content | true |

Image Container:

| 속성 | 값 |
|------|-----|
| Width | Fill container |
| Height | Width × 9/16 (aspect ratio) |
| Fill | 이미지 또는 surface-100 (placeholder) |
| Radius | 12, 12, 0, 0 (top only) |

Content Area:

| 속성 | 값 |
|------|-----|
| Direction | Vertical ↓ |
| Padding | 12, 16, 12, 16 |
| Spacing | 4 |
| Width | Fill container |

Bottom Row (배지 + 액션):

| 속성 | 값 |
|------|-----|
| Direction | Horizontal → |
| Spacing | 8 |
| Distribution | Space-between |
| Align | Center |

| 요소 | Resizing |
|------|----------|
| Badge group (Horizontal, spacing 4) | Hug contents |
| Action group (Horizontal, spacing 12) | Hug contents |

#### PlaceCard (Compact)

```text
+------+----------------------------+
| [Img] | Title                     |
| 1:1   | Region · Category         |
|       | [Badge] [Badge]    ♡  ⊞   |
+------+----------------------------+
```

| 속성 | 값 |
|------|-----|
| Direction | Horizontal → |
| Padding | 12, 16, 12, 16 |
| Spacing | 12 |
| Width | Fill container |
| Height | Hug contents |
| Align | Top |

| 요소 | Resizing |
|------|----------|
| Image (Fixed 80×80, radius 8) | Fixed |
| Content stack (Vertical, spacing 4) | Fill container |

#### FolderCard

| 속성 | 값 |
|------|-----|
| Direction | Vertical ↓ |
| Padding | 0 |
| Spacing | 0 |
| Width | Fill container |
| Height | Hug contents |
| Radius | 12 |
| Clip content | true |

Thumbnail Grid:

| 속성 | 값 |
|------|-----|
| Layout | 2×2 grid |
| Item size | (card_width/2)×(card_width/2) |
| Gap | 2 |

Content Area:

| 속성 | 값 |
|------|-----|
| Direction | Vertical ↓ |
| Padding | 12, 16, 12, 16 |
| Spacing | 2 |

#### Source Badge

| 속성 | 값 |
|------|-----|
| Direction | Horizontal → |
| Padding | 4, 8, 4, 8 |
| Spacing | 4 |
| Align | Center |
| Width | Hug contents |
| Height | Hug contents |
| Radius | 6 |

Variant별 Fill:

| Variant | Fill | Text color |
|---------|------|-----------|
| youtube | #FEE2E2 | #DC2626 |
| community | #DBEAFE | #2563EB |
| folder | #EDE9FE | #7C3AED |
| instagram | #FCE7F3 | #DB2777 |

내부:

| 요소 | 값 |
|------|-----|
| Icon | Fixed 12×12, variant별 색상 |
| Label | Caption/Medium, variant별 색상 |
| Count (optional) | Caption/Regular |

#### SourceCard

| 속성 | 값 |
|------|-----|
| Direction | Horizontal → |
| Padding | 12, 16, 12, 16 |
| Spacing | 12 |
| Align | Center |
| Width | Fill container |
| Height | Hug contents |

| 요소 | Resizing |
|------|----------|
| Avatar (Fixed 40×40, radius 20) | Fixed |
| Info stack (Vertical, spacing 2) | Fill container |
| Subscribe button | Hug contents |

#### List Item

| 속성 | 값 |
|------|-----|
| Direction | Horizontal → |
| Padding | 0, 16, 0, 16 |
| Spacing | 12 |
| Align | Center |
| Width | Fill container |
| Height | Fixed 56 (1줄) / 72 (2줄) |
| Stroke | bottom 1px, surface-100 |

| 요소 | Resizing |
|------|----------|
| Leading icon/avatar (optional) | Fixed |
| Content (Vertical, spacing 2) | Fill container |
| Trailing (chevron/value) | Hug contents |

#### Stats Row

| 속성 | 값 |
|------|-----|
| Direction | Horizontal → |
| Spacing | 0 |
| Distribution | Space-between |
| Align | Center |
| Width | Fill container |

각 Stat Item:

| 속성 | 값 |
|------|-----|
| Direction | Vertical ↓ |
| Spacing | 2 |
| Align | Center |
| Width | Fill container |

---

### 2.5 Page-Level Layouts

#### Screen Frame (Mobile)

| 속성 | 값 |
|------|-----|
| Width | Fixed 375 |
| Height | Fixed 812 |
| Fill | background (#FAFAFA) |
| Clip content | true |

내부 구조:

| 속성 | 값 |
|------|-----|
| Direction | Vertical ↓ |
| Padding | 0 |
| Spacing | 0 |

| 요소 | Resizing |
|------|----------|
| Status Bar (Fixed 44) | Fill container, Fixed height |
| Header (Fixed 44) | Fill container, Fixed height |
| Content (scroll area) | Fill container, Fill height |
| Tab Bar (Fixed 56+safe) | Fill container, Fixed height |

#### Bottom Sheet

| 속성 | 값 |
|------|-----|
| Direction | Vertical ↓ |
| Padding | 0 |
| Spacing | 0 |
| Width | Fill container |
| Height | Hug contents (max 80vh) |
| Radius | 16, 16, 0, 0 |
| Fill | surface (#FFFFFF) |
| Shadow | soft-lg |

내부:

| 요소 | 값 |
|------|-----|
| Handle bar | Fixed 36×4, radius 2, center, fill surface-300 |
| Header row | Horizontal, padding 16, spacing 8 |
| Content area | Vertical, padding 0 16, fill container |
| Footer (CTA) | Horizontal, padding 16, fill container |

#### Collection Save Sheet

| 속성 | 값 |
|------|-----|
| Direction | Vertical ↓ |
| Padding | 0 |
| Spacing | 0 |

| 요소 | Auto-layout 값 |
|------|---------------|
| Handle | Center, pad 8 |
| Header ("컬렉션에 저장", ✕) | Horizontal, space-between, pad 16 |
| Search field | Horizontal, pad 0 16 |
| Folder list (scroll) | Vertical, spacing 0, fill |
| "+ 새 폴더 만들기" | Horizontal, pad 12 16, spacing 8 |
| Footer ("저장하기" CTA) | Horizontal, pad 16, fill container |

#### Place Action Row

| 속성 | 값 |
|------|-----|
| Direction | Horizontal → |
| Padding | 12, 16, 12, 16 |
| Spacing | 0 |
| Distribution | Space-between |
| Align | Center |
| Width | Fill container |
| Height | Hug contents |
| Stroke | top 1px, surface-200 |

각 Action Item:

| 속성 | 값 |
|------|-----|
| Direction | Vertical ↓ |
| Spacing | 2 |
| Align | Center |
| Width | Hug contents |

| 요소 | 값 |
|------|-----|
| Icon | 24×24, surface-600 (기본) / primary (활성) / accent-rose (좋아요 활성) |
| Label | Caption/Regular, surface-500 |

---

## 3. COMPONENT ARCHITECTURE

### 3.1 Master Component Structure

```text
Components/
├── Navigation/
│   ├── Header
│   ├── TabBar
│   ├── TabBarItem
│   └── Breadcrumb
├── Input/
│   ├── Button
│   ├── TextField
│   ├── Toggle
│   ├── Checkbox
│   ├── RadioButton
│   ├── Slider
│   └── FormGroup
├── Feedback/
│   ├── Alert
│   ├── Toast
│   ├── Modal
│   ├── Spinner
│   └── Skeleton
├── DataDisplay/
│   ├── PlaceCard
│   ├── FolderCard
│   ├── SourceCard
│   ├── ListItem
│   ├── StatsRow
│   └── StatItem
├── Media/
│   ├── ImageContainer
│   ├── Avatar
│   └── VideoThumbnail
├── Domain/
│   ├── SourceBadge
│   ├── PlaceActionRow
│   ├── PlaceActionItem
│   ├── CollectionSaveSheet
│   ├── FilterChip
│   └── EmptyState
└── Layout/
    ├── BottomSheet
    ├── ScreenFrame
    ├── SectionHeader
    └── Divider
```

### 3.2 Variant Properties & Combinations Matrix

#### Button

```text
Component: Button
Variants:
  Style   = Primary | Secondary | Outline | Ghost | Destructive | Link
  Size    = SM | MD | LG | Icon
  State   = Default | Hover | Active | Disabled | Loading

Properties:
  Label      (text)             — "버튼"
  IconLeft   (boolean)          — false
  IconRight  (boolean)          — false
  IconLeftSwap  (instance swap) — Lucide/Heart
  IconRightSwap (instance swap) — Lucide/ChevronRight

Total variants: 6 Style × 4 Size × 5 State = 120
```

#### PlaceCard

```text
Component: PlaceCard
Variants:
  Layout  = Standard | Compact | Minimal
  State   = Default | Loading (skeleton)

Properties:
  Title     (text)             — "을지로 골뱅이집"
  Meta      (text)             — "한식 · 을지로3가"
  ImageURL  (text)             — placeholder
  IsLiked   (boolean)          — false
  IsSaved   (boolean)          — false
  Badges    (instance swap)    — SourceBadgeGroup

Total variants: 3 Layout × 2 State = 6
```

#### SourceBadge

```text
Component: SourceBadge
Variants:
  Type = Youtube | Community | Folder | Instagram

Properties:
  Count (text)   — "2"
  Label (text)   — "유튜브" (자동, Type에 연동)

Total variants: 4
```

#### TextField

```text
Component: TextField
Variants:
  State = Default | Focus | Error | Disabled

Properties:
  Placeholder   (text)       — "검색어 입력"
  Value         (text)       — ""
  IconLeft      (boolean)    — false
  IconRight     (boolean)    — false
  IconLeftSwap  (instance swap) — Lucide/Search
  IconRightSwap (instance swap) — Lucide/X

Total variants: 4
```

#### TabBarItem

```text
Component: TabBarItem
Variants:
  State = Default | Active

Properties:
  Label     (text)           — "홈"
  IconSwap  (instance swap)  — Lucide/Home

Total variants: 2
```

#### Alert

```text
Component: Alert
Variants:
  Type = Success | Warning | Error | Info

Properties:
  Title    (text)    — "성공"
  Message  (text)    — "저장되었습니다"
  HasClose (boolean) — true

Total variants: 4
```

#### Toast

```text
Component: Toast
Variants:
  Type = Default | Success | Error

Properties:
  Message    (text)    — "폴더에 저장했어요"
  HasAction  (boolean) — false
  ActionText (text)    — "보기"

Total variants: 3
```

#### ListItem

```text
Component: ListItem
Variants:
  Size = Single | Double
  HasLeading = true | false

Properties:
  Title       (text)           — "설정"
  Subtitle    (text)           — "" (Double일 때)
  LeadingSwap (instance swap)  — Lucide/Settings
  HasTrailing (boolean)        — true
  TrailingSwap (instance swap) — Lucide/ChevronRight

Total variants: 4
```

#### EmptyState

```text
Component: EmptyState
Variants:
  (none — properties로 커스텀)

Properties:
  IconSwap  (instance swap)  — Lucide/Compass
  Title     (text)           — "아직 구독한 소스가 없어요"
  Message   (text)           — "맛탐정을 탐색해 보세요"
  HasCTA    (boolean)        — true
  CTALabel  (text)           — "탐색하기"

Total variants: 1
```

#### Avatar

```text
Component: Avatar
Variants:
  Size = SM (24) | MD (40) | LG (64)
  State = Default | Loading

Total variants: 6
```

#### FilterChip

```text
Component: FilterChip
Variants:
  State = Default | Active

Properties:
  Label (text) — "서울"

Total variants: 2
```

---

## 4. DESIGN TOKEN INTEGRATION

### 4.1 Color Styles

Figma Local Styles로 등록:

```text
Color/Primary/50        #F5F3FF
Color/Primary/100       #EDE9FE
Color/Primary/200       #DDD6FE
Color/Primary/300       #C4B5FD
Color/Primary/400       #A78BFA
Color/Primary/500       #8B5CF6
Color/Primary/600       #7C3AED
Color/Primary/700       #6D28D9
Color/Primary/800       #5B21B6
Color/Primary/900       #4C1D95

Color/Surface/50        #FAFAFA
Color/Surface/100       #F5F5F5
Color/Surface/200       #E5E5E5
Color/Surface/300       #D4D4D4
Color/Surface/400       #A3A3A3
Color/Surface/500       #737373
Color/Surface/600       #525252
Color/Surface/700       #404040
Color/Surface/800       #262626
Color/Surface/900       #171717

Color/Semantic/Success     #10B981
Color/Semantic/Warning     #F59E0B
Color/Semantic/Error       #EF4444
Color/Semantic/Info        #0EA5E9

Color/Badge/Youtube/BG     #FEE2E2
Color/Badge/Youtube/Text   #DC2626
Color/Badge/Community/BG   #DBEAFE
Color/Badge/Community/Text #2563EB
Color/Badge/Folder/BG      #EDE9FE
Color/Badge/Folder/Text    #7C3AED
Color/Badge/Instagram/BG   #FCE7F3
Color/Badge/Instagram/Text #DB2777

Color/Background           #FAFAFA
Color/Surface              #FFFFFF
Color/Border               #E5E5E5
Color/Overlay              #000000, 50% opacity
```

### 4.2 Text Styles

Figma Text Styles 등록 (모바일 기준):

```text
Text/Display           Pretendard 32/38.4 Bold (-0.02em)
Text/Headline          Pretendard 24/30 Bold (-0.01em)
Text/Title1            Pretendard 20/26 Semibold
Text/Title2            Pretendard 18/24.3 Semibold
Text/Title3            Pretendard 17/23 Semibold
Text/Body              Pretendard 16/24 Regular
Text/Body-Medium       Pretendard 16/24 Medium
Text/Callout           Pretendard 15/21 Regular
Text/Subheadline       Pretendard 14/19.6 Regular
Text/Subheadline-Med   Pretendard 14/19.6 Medium
Text/Footnote          Pretendard 13/17.6 Regular
Text/Caption           Pretendard 12/15.6 Regular (0.01em)
Text/Caption-Medium    Pretendard 12/15.6 Medium (0.01em)
```

### 4.3 Effect Styles

```text
Effect/Shadow/Soft-XS    0, 1, 2, 0 — #000000 3%
Effect/Shadow/Soft-SM    0, 1, 3, 0 — #000000 4%  +  0, 1, 2, -1 — #000000 4%
Effect/Shadow/Soft-MD    0, 4, 6, -1 — #000000 4%  +  0, 2, 4, -2 — #000000 4%
Effect/Shadow/Soft-LG    0, 10, 15, -3 — #000000 4%  +  0, 4, 6, -4 — #000000 4%
```

### 4.4 Grid Styles

```text
Grid/Mobile-4col       4 columns, 16px gutter, 16px margin
Grid/Tablet-8col       8 columns, 24px gutter, 24px margin
Grid/Desktop-12col     12 columns, 24px gutter, 48px margin
```

---

## 5. PROTOTYPE CONNECTIONS

### 5.1 Interaction Map

```text
Onboarding → [시작하기] → AuthModal
                          ├── 로그인 → Home
                          └── 회원가입 → Home

Home
├── [PlaceCard] → PlaceDetailModal
├── [위치 칩] → LocationSettingSheet
├── [검색 아이콘] → SearchPage
├── [탭 전환] → Home/Recommend | Home/Source | Home/Feed
└── [Tab Bar] → Home | Feed | Feature | Profile

PlaceDetailModal
├── [좋아요] → (toggle state)
├── [저장] → CollectionSaveSheet
├── [네이버] → (external link)
├── [더보기] → PlaceActionSheet
├── [출처 배지] → SourceDetailPage / external
├── [drag down] → dismiss
└── [탭 전환] → Menu | Review | Source

CollectionSaveSheet
├── [체크박스] → (toggle)
├── [+ 새 폴더] → FolderCreateModal
├── [저장하기] → dismiss + Toast
└── [✕] → dismiss

SearchPage
├── [입력 + 엔터] → SearchResultPage
├── [최근 검색어 칩] → SearchResultPage
├── [필터 칩] → FilterBottomSheet
└── [< 뒤로] → 이전 화면

Profile
├── [메뉴 칩] → Recent | Liked | Folder | Saved | Visited | Reviews | Subscription | Subscribers | Analysis
├── [편집] → ProfileEditPage
└── [FolderCard] → FeatureDetailPage
```

### 5.2 Trigger & Animation Specs

| 인터랙션 | Trigger | Animation | Duration | Easing |
|----------|---------|-----------|----------|--------|
| 카드 → 상세 모달 | On Click | Smart Animate (slide up) | 250ms | Ease Out |
| 모달 닫기 | On Drag (down) | Smart Animate (slide down) | 200ms | Ease In |
| 시트 열기 | On Click | Smart Animate (slide up) | 300ms | Ease Out |
| 시트 닫기 | On Click (배경) | Smart Animate (slide down) | 200ms | Ease In |
| 탭 전환 | On Click | Smart Animate (dissolve) | 150ms | Ease Out |
| Toast 진입 | After delay 0ms | Smart Animate (slide up + fade) | 200ms | Ease Out |
| Toast 퇴장 | After delay 2500ms | Smart Animate (fade out) | 150ms | Ease In |
| 좋아요 토글 | On Click | Smart Animate (scale) | 150ms | Ease Out |
| 오버레이 진입 | On Click | Dissolve | 200ms | Ease In Out |

### 5.3 Prototype Flow 구성

1. **Happy Path**: Onboarding → Home → PlaceCard → PlaceDetail → 저장 → CollectionSaveSheet → Toast
2. **Search Path**: Home → Search → Filter → Results → PlaceDetail
3. **Profile Path**: Profile → Folder → FolderDetail → PlaceCard → PlaceDetail
4. **Source Path**: Home/Source → SourceDetail → PlaceCard → PlaceDetail → 구독

---

## 6. DEVELOPER HANDOFF PREPARATION

### 6.1 Inspect Panel Organization

| 항목 | 규칙 |
|------|------|
| Color | Local Style 이름 참조 (예: "Color/Primary/600") |
| Text | Text Style 이름 참조 (예: "Text/Title2") |
| Spacing | Token 이름 기재 (예: "space-4 = 16px") |
| Radius | Token 이름 기재 (예: "radius-lg = 12px") |

### 6.2 CSS Properties (주요 요소)

#### PlaceCard

```css
.place-card {
  display: flex;
  flex-direction: column;
  border-radius: 12px;          /* radius-lg */
  overflow: hidden;
  border: 1px solid #E5E5E5;    /* Color/Border */
}

.place-card__image {
  width: 100%;
  aspect-ratio: 16/9;
  object-fit: cover;
}

.place-card__content {
  display: flex;
  flex-direction: column;
  padding: 12px 16px;           /* space-3, space-4 */
  gap: 4px;                     /* space-1 */
}
```

#### Button (Primary/MD)

```css
.btn-primary-md {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;                     /* space-2 */
  height: 36px;
  padding: 0 16px;              /* space-4 */
  border-radius: 8px;           /* radius-md */
  background: #7C3AED;          /* Color/Primary/600 */
  color: #FFFFFF;
  font: 500 14px/19.6px Pretendard; /* Text/Subheadline-Med */
}
```

#### Source Badge

```css
.source-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;                     /* space-1 */
  padding: 4px 8px;             /* space-1, space-2 */
  border-radius: 6px;
  font: 500 12px/15.6px Pretendard; /* Text/Caption-Medium */
}

.source-badge--youtube {
  background: #FEE2E2;
  color: #DC2626;
}
```

### 6.3 Export Settings

| 에셋 유형 | Format | Scale |
|-----------|--------|-------|
| Icon | SVG | 1x |
| App icon | PNG | 1x, 2x, 3x |
| Illustration | SVG + PNG | 1x, 2x |
| Thumbnail placeholder | PNG | 1x, 2x |
| Social preview | PNG | 1x (1200×630) |

### 6.4 Asset Naming Conventions

```text
icon/{name}.svg              — icon/heart.svg, icon/bookmark.svg
img/placeholder-{type}.png   — img/placeholder-food.png
img/empty-{context}.svg      — img/empty-search.svg, img/empty-folder.svg
img/onboarding-{step}.png    — img/onboarding-01.png
```

---

## 7. ACCESSIBILITY ANNOTATIONS

### 7.1 Focus Order Indicators

각 화면에 빨간 원형 번호로 포커스 순서를 표기.

#### Home 화면

```text
① Header (위치 칩 → 검색 아이콘)
② 상단 탭 (추천 → 소스 → 구독)
③ 콘텐츠 (PlaceCard 순서대로)
④ Tab Bar (홈 → 피드 → 맛탐정 → 프로필)
```

#### PlaceDetailModal

```text
① 닫기 (drag handle 또는 X)
② 이미지 갤러리
③ 장소명 + 메타
④ 출처 하이라이트 (각 배지)
⑤ PlaceActionRow (좋아요 → 저장 → 네이버 → 더보기)
⑥ 탭 바 (메뉴 → 리뷰 → 출처)
⑦ 탭 콘텐츠
```

### 7.2 ARIA Labels

Figma 주석(annotation)으로 각 인터랙티브 요소에 기재:

| 요소 | aria-label | aria-hint |
|------|-----------|-----------|
| 좋아요 버튼 (비활성) | "좋아요" | "이중 탭하여 좋아요 추가" |
| 좋아요 버튼 (활성) | "좋아요 됨" | "이중 탭하여 좋아요 해제" |
| 저장 버튼 | "저장" | "이중 탭하여 폴더에 저장" |
| 네이버 지도 버튼 | "네이버 지도에서 보기" | "외부 앱으로 이동" |
| 구독 버튼 (비활성) | "구독" | "이중 탭하여 구독" |
| 구독 버튼 (활성) | "구독 중" | "이중 탭하여 구독 해제" |
| PlaceCard | "{장소명}, {지역}, {카테고리}" | "이중 탭하여 상세 보기" |
| Source Badge | "{소스타입} 출처 {N}개" | "이중 탭하여 출처 보기" |
| Tab Bar Item | "{탭명}, 탭 {N}/{Total}" | — |
| 검색 입력 | "지역과 음식점 검색" | — |
| 필터 칩 (비활성) | "{필터명}" | "이중 탭하여 필터 적용" |
| 필터 칩 (활성) | "{필터명}, 선택됨" | "이중 탭하여 필터 해제" |

### 7.3 Color Contrast Notes

각 색상 조합에 대해 Figma 주석으로 대비 비율을 기재:

| 조합 | Ratio | WCAG AA |
|------|-------|---------|
| Text/Body (#171717) on Background (#FAFAFA) | 17.4:1 | Pass |
| Text/Subheadline (#525252) on Surface (#FFFFFF) | 7.4:1 | Pass |
| Button/Primary text (#FFFFFF) on Primary-600 (#7C3AED) | 5.3:1 | Pass |
| Caption (#737373) on Surface (#FFFFFF) | 4.6:1 | Pass |
| Badge/Youtube text (#DC2626) on Badge/Youtube BG (#FEE2E2) | 4.8:1 | Pass |
| Badge/Community text (#2563EB) on Badge/Community BG (#DBEAFE) | 4.5:1 | Pass |
| Badge/Folder text (#7C3AED) on Badge/Folder BG (#EDE9FE) | 4.5:1 | Pass |

Contrast 3:1 미만인 조합은 사용 금지.
모든 인터랙티브 요소는 focus-visible 상태에서 2px ring(Primary-500/40) 표시.

---

## 관련 문서

- [[01-foundations|FOUNDATIONS]]
- [[02-components|COMPONENTS]]
- [[04-tokens|TOKENS]]
- [[07-ui-ux-patterns|UI/UX 패턴]]
- [[05-documentation|구현 가이드]]
