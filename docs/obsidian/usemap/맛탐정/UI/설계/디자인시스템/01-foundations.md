생성일: 2026-03-03

# 1. FOUNDATIONS

## 1.1 Color System

### Primary Palette (6 colors)

| 이름 | Hex | RGB | HSL | WCAG AA (4.5:1) | 용도 |
|------|-----|-----|-----|-----------------|------|
| Primary 50 | #F5F3FF | 245,243,255 | 252,100%,98% | — | 배경 톤 |
| Primary 100 | #EDE9FE | 237,233,254 | 252,91%,95% | — | Hover 배경 |
| Primary 200 | #DDD6FE | 221,214,254 | 252,91%,92% | — | Disabled |
| Primary 300 | #C4B5FD | 196,181,253 | 252,91%,85% | — | Border |
| Primary 500 | #8B5CF6 | 139,92,246 | 263,91%,66% | — | Primary CTA |
| Primary 600 | #7C3AED | 124,58,237 | 263,84%,58% | ✅ | Primary Active |

- **Primary 500/600**: CTA, 탭 활성, 링크, 좋아요/저장 강조
- **Primary 50~300**: 배경·보조 요소

### Semantic Colors

| 역할 | Hex | 용도 |
|------|-----|------|
| Success | #10B981 | 저장 완료, 구독 완료 |
| Warning | #F59E0B | 필수 입력 누락, 권한 요청 |
| Error | #EF4444 | 삭제, 오류 메시지 |
| Info | #0EA5E9 | 출처 배지, 링크 |

### Dark Mode Equivalents

| 역할 | Light | Dark | Contrast (배경 대비) |
|------|-------|------|---------------------|
| Background | #FAFAFA | #0F0F0F | — |
| Surface | #FFFFFF | #1A1A1A | 4.5:1 이상 |
| Text Primary | #171717 | #FAFAFA | 7:1 이상 |
| Text Secondary | #525252 | #A3A3A3 | 4.5:1 이상 |
| Primary | #7C3AED | #A78BFA | 4.5:1 이상 |

### Color Usage Rules

- **Primary**: CTA, 활성 탭, 좋아요/저장 아이콘, 출처 배지
- **Success**: 완료 피드백, 구독 상태
- **Warning**: 필수 입력, 권한 요청
- **Error**: 삭제, 폼 오류, 네트워크 오류
- **Info**: 유튜브/커뮤니티 출처 표시

---

## 1.2 Typography

### Primary Font Family

- **한글**: Pretendard Variable (가변 폰트)
- **Fallback**: -apple-system, BlinkMacSystemFont, system-ui, Apple SD Gothic Neo, Noto Sans KR, sans-serif

### Type Scale (9 weights)

| 스타일 | 모바일 | 태블릿 | 데스크톱 | Line Height | Letter Spacing | 용도 |
|--------|--------|--------|----------|-------------|----------------|------|
| Display | 32px | 40px | 48px | 1.2 | -0.02em | 랜딩 히어로 |
| Headline | 24px | 28px | 32px | 1.25 | -0.01em | 페이지 제목 |
| Title 1 | 20px | 22px | 24px | 1.3 | 0 | 섹션 제목 |
| Title 2 | 18px | 20px | 22px | 1.35 | 0 | 카드 제목 |
| Title 3 | 17px | 18px | 20px | 1.35 | 0 | 리스트 제목 |
| Body | 16px | 16px | 16px | 1.5 | 0 | 본문 |
| Callout | 15px | 15px | 16px | 1.4 | 0 | 부가 설명 |
| Subheadline | 14px | 14px | 14px | 1.4 | 0 | 라벨, 메타 |
| Footnote | 13px | 13px | 13px | 1.35 | 0 | 캡션 |
| Caption | 12px | 12px | 12px | 1.3 | 0.01em | 보조 정보 |

### Font Weight

| Weight | 값 | 용도 |
|--------|-----|------|
| Regular | 400 | 본문 |
| Medium | 500 | 라벨, 버튼 |
| Semibold | 600 | 제목, 강조 |
| Bold | 700 | Display, Headline |

### Accessibility

- 본문 최소 16px (모바일)
- Caption 최소 12px
- 대비 4.5:1 이상 (본문), 3:1 이상 (큰 텍스트)

---

## 1.3 Layout Grid

### Responsive Breakpoints

| Breakpoint | Width | 용도 |
|------------|-------|------|
| Mobile | 375px (기준) | 기본 타겟 |
| Mobile Large | 428px | 대형 폰 |
| Tablet | 768px | 태블릿 |
| Desktop | 1440px | 웹 (최대 512px 컨테이너) |

### Grid

- **Mobile**: 4열, gutter 16px, margin 16px
- **Tablet**: 8열, gutter 24px, margin 24px
- **Desktop**: 12열, gutter 24px, margin 48px, 컨테이너 max 512px

### Safe Areas

- 상단: env(safe-area-inset-top) + 44px (헤더)
- 하단: env(safe-area-inset-bottom) + 56px (탭바)
- 좌우: env(safe-area-inset-left/right)

---

## 1.4 Spacing System

8px base unit scale.

| Token | px | 용도 |
|-------|-----|------|
| space-1 | 4 | 아이콘 간격, 체크박스 패딩 |
| space-2 | 8 | 인라인 요소 간격 |
| space-3 | 12 | 작은 그룹 간격 |
| space-4 | 16 | 기본 패딩, 카드 내부 |
| space-6 | 24 | 섹션 간격 |
| space-8 | 32 | 큰 섹션 간격 |
| space-12 | 48 | 페이지 섹션 |
| space-16 | 64 | 히어로 여백 |
| space-24 | 96 | 랜딩 섹션 |
| space-32 | 128 | 풀 페이지 여백 |

### Usage Guidelines

- **space-1~2**: 인라인, 타이트한 그룹
- **space-1~4**: 카드 내부, 버튼 그룹
- **space-4~6**: 리스트 아이템, 섹션 내부
- **space-6~8**: 섹션 간격
- **space-1~4**: 모바일 최대 활용 (화면 공간 제한)
