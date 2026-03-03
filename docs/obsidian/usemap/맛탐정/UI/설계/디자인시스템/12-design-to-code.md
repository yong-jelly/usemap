생성일: 2026-03-03

# 12. Design-to-Code Translation

맛탐정 디자인 시스템을 프로덕션 코드로 변환하는 가이드.
디자인 토큰 → Tailwind 설정 → 컴포넌트 코드 매핑을 포함.

---

## 기술 스택 현황

| 영역 | 기술 | 버전 |
|------|------|------|
| Framework | React | 19.x |
| Build | Vite | 6.x |
| Language | TypeScript | 5.7 |
| Styling | Tailwind CSS | 3.4 |
| State (global) | Zustand | 5.x |
| State (server) | TanStack React Query | 5.x |
| Animation | Framer Motion | 12.x |
| Gesture | @use-gesture/react | 10.x |
| Drawer | vaul | 1.x |
| Toast | sonner | 2.x |
| Icons | lucide-react | 0.562 |
| Router | react-router | 7.x |
| Utility | clsx + tailwind-merge (cn) | — |
| Testing | Vitest + Storybook | 4.x / 10.x |

---

## 1. COMPONENT ARCHITECTURE

### 1.1 Component Hierarchy Tree

프로젝트는 FSD(Feature-Sliced Design) 아키텍처를 따름.

```text
app/
├── providers/          → QueryClient, Auth listener, Theme init
└── router/             → createBrowserRouter, 라우트 정의

pages/                  → 라우트 단위 페이지 컴포넌트
├── HomePage
├── FeedPage
├── SearchPage
├── ExplorePage
├── ProfilePage
├── FolderDetailPage
└── PlaceDetailPage

widgets/                → 페이지에 조합되는 독립적 UI 블록
├── PlaceCard           → 장소 카드 (이미지 슬라이더 + 인터랙션 + 메타)
├── SaveToCollectionSheet → 컬렉션 저장 Drawer
├── PlaceCommentSheet   → 댓글 Drawer
├── PlaceActionSheet    → 장소 액션 시트
├── MainHeader          → 메인 헤더 (위치 + 검색)
├── DetailHeader        → 상세 페이지 헤더
├── BottomNav           → 하단 탭 바
├── Sidebar             → 태블릿/데스크톱 사이드바
├── ExploreFilterSheet  → 탐색 필터
├── DiscoverGrid        → 탐색 그리드
├── HeroSection         → 랜딩 히어로
└── PopularPlacesSection → 인기 장소

features/               → 도메인별 비즈니스 로직이 담긴 UI
├── auth/               → AuthModal
├── place/              → PlaceDetail.modal, FolderSelection.modal, ReviewForm
├── folder/             → FolderCard, FolderList, FolderCreate.modal
├── home/               → SourceContent
├── profile/            → ProfileHeader, ProfileMenuSection, 각 Tab 컴포넌트
├── explorer/           → DistrictChips, RegionSelectSheet
└── location/           → LocationSettingSheet

entities/               → 도메인 데이터 모델 (API, types, queries)
├── place/              → Place, Feature, PlaceComment, PlaceUserReview types
├── folder/             → Folder, FolderMember types
├── user/               → User, Profile types
├── home/               → Home feed types
└── location/           → Location types

shared/                 → 프로젝트 전역 공유 레이어
├── ui/                 → 디자인 시스템 기초 컴포넌트
│   ├── Button
│   ├── Input
│   ├── Card
│   ├── Skeleton
│   ├── BottomSheet
│   ├── Drawer
│   ├── Dialog / ConfirmDialog
│   ├── Tabs
│   ├── HorizontalScroll
│   ├── PageHeader
│   ├── place/          → PlaceActionRow, PlaceFeatureTags, PlaceSourceHighlight 등
│   ├── review/         → ReviewCard
│   └── menu/           → MenuCard
├── lib/                → cn, supabase, location, date, number, gtm, storage
├── config/             → useUIStore, filter-constants, mapbox
├── model/              → UI 상태 (Zustand)
└── api/                → Supabase Edge Function client
```

### 1.2 Props Interface 설계 원칙

**현재 코드에서 발견된 GAP과 개선 방향**:

```typescript
// ❌ 현재: PlaceCard에 `place: any` 사용
interface PlaceCardProps {
  place: any;
  // ...
}

// ✅ 개선: 엄격한 타입 + JSDoc
interface PlaceCardProps {
  /** 장소 데이터 (entities/place/types의 Place 타입) */
  place: Place;
  /** 이미지 aspect ratio 클래스 (Tailwind) @default "aspect-[4/3]" */
  imageAspectRatio?: string;
  /** 최대 표시 이미지 수 @default 5 */
  maxImages?: number;
  /** 가격 표시 여부 @default true */
  showPrice?: boolean;
  /** 썸네일 표시 여부 @default true */
  showThumbnail?: boolean;
  /** 출처 라벨 (예: "유튜브") */
  sourceLabel?: string;
  /** 출처 제목 (예: "채널명") */
  sourceTitle?: string;
  /** 출처 이미지 URL */
  sourceImage?: string;
  /** 출처 상세 경로 */
  sourcePath?: string;
  /** 등록일 (포맷된 문자열) */
  addedAt?: string;
  /** 코멘트 내용 */
  comment?: string;
  /** 현재 위치와의 거리 (미터) */
  distance?: number;
  /** 추가 CSS 클래스 */
  className?: string;
  /** 그림자 숨김 여부 @default false */
  hideShadow?: boolean;
}
```

**Props 설계 규칙**:

| 규칙 | 설명 |
|------|------|
| 타입 엄격성 | `any` 대신 entities 타입 사용 |
| 기본값 명시 | JSDoc `@default` 태그로 기본값 문서화 |
| 콜백 네이밍 | `on` + 동사 (예: `onClose`, `onClick`, `onToggle`) |
| 불린 네이밍 | `is` / `has` / `show` 접두사 (예: `isOpen`, `hasError`, `showPrice`) |
| 선택적 Props | 모든 꾸밈 관련 Props는 optional |
| className 허용 | 모든 컴포넌트에 `className?: string` 제공 |

### 1.3 State Management Strategy

```text
┌──────────────────────────────────────────────────┐
│                    State 계층                      │
├────────────┬──────────────────┬──────────────────┤
│  Server    │  Global Client   │  Local UI        │
│  State     │  State           │  State           │
├────────────┼──────────────────┼──────────────────┤
│ TanStack   │  Zustand         │  useState        │
│ React Query│                  │  useReducer      │
├────────────┼──────────────────┼──────────────────┤
│ API 응답    │  UI 상태:        │  모달 open/close │
│ 캐시/갱신   │  · 사이드바 토글  │  폼 입력 값      │
│ 낙관적 업뎃 │  · 테마          │  토글 상태       │
│ 무한 스크롤 │  · 장소 팝업     │  로컬 필터       │
│            │  · 필터 저장소    │  이미지 인덱스   │
└────────────┴──────────────────┴──────────────────┘
```

**현재 구현된 패턴**:

| 패턴 | 위치 | 사용 기술 |
|------|------|-----------|
| 장소 좋아요/저장 토글 | `PlaceCard` | React Query mutation + 낙관적 UI (useState) |
| 장소 상세 팝업 | `usePlacePopup` | Zustand |
| 피드 필터 | `useFeaturePageStore` | Zustand |
| UI 토글 (사이드바) | `useUIStore` | Zustand |
| 폴더 목록 | `SaveToCollectionSheet` | React Query + useState (optimistic) |
| 인증 모달 | `useAuthModalStore` | Zustand |

### 1.4 Data Flow Diagram

```text
User Interaction
      │
      ▼
┌──────────────┐    mutation    ┌──────────────┐
│  Widget /    │ ──────────►  │  React Query │
│  Feature UI  │               │  Mutation    │
│              │  ◄──────────  │              │
│  (Optimistic │    onSuccess  │  → Supabase  │
│   setState)  │    onError    │    Edge Fn   │
└──────────────┘               └──────────────┘
      │                               │
      ▼                               ▼
┌──────────────┐               ┌──────────────┐
│  Local State │               │  Query Cache │
│  (useState)  │               │  Invalidate  │
└──────────────┘               └──────────────┘
      │
      ▼
┌──────────────┐
│  Toast       │  ← sonner
│  Feedback    │
└──────────────┘
```

---

## 2. PRODUCTION CODE

### 2.1 디자인 토큰 ↔ 코드 GAP 분석

현재 코드와 디자인 시스템(04-tokens) 사이에 불일치가 있음.

| 항목 | 현재 코드 | 디자인 시스템 | 상태 | 우선순위 |
|------|----------|-------------|------|---------|
| Primary 색상 | Indigo (#6366f1, #4f46e5) | Violet (#8B5CF6, #7C3AED) | ❌ 불일치 | Critical |
| 폰트 | IBM Plex Sans KR | Pretendard Variable | ❌ 불일치 | Critical |
| Button 높이 SM | h-8 (32px) | 최소 터치 44px | ❌ 접근성 미달 | Critical |
| Button 높이 MD | h-9 (36px) | 최소 터치 44px | ❌ 접근성 미달 | Critical |
| Focus ring | primary-500/40 (반투명) | 불투명 #7C3AED | ⚠️ 개선 필요 | High |
| Error 색상 | accent-rose (#f43f5e) | #DC2626 (WCAG AA) | ❌ 대비 미달 | Critical |
| CSS Variables | shadcn 기반 | 디자인 토큰 기반 | ⚠️ 통합 필요 | High |
| Dark Mode | 비활성화 | 토큰 준비됨 | 🔜 향후 | Low |

### 2.2 Tailwind Config 마이그레이션

> **Designer's Intent**: Primary 색상이 Indigo(차갑고 기업적)에서 Violet(따뜻하고 신뢰감)으로 변경된 이유는, "맛탐정"의 브랜드 속성(TRUST + CALM)을 색상으로 표현하기 위함. Violet은 직관과 신뢰를 연상시키며, 음식 콘텐츠의 따뜻함과 조화.

```typescript
// tailwind.config.ts — 마이그레이션 대상
import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: [
          'Pretendard Variable',
          '-apple-system',
          'BlinkMacSystemFont',
          'system-ui',
          'Apple SD Gothic Neo',
          'Noto Sans KR',
          'sans-serif'
        ]
      },
      fontSize: {
        'display': ['2rem', { lineHeight: '1.2', letterSpacing: '-0.02em', fontWeight: '700' }],
        'headline': ['1.5rem', { lineHeight: '1.25', letterSpacing: '-0.01em', fontWeight: '700' }],
        'title1': ['1.25rem', { lineHeight: '1.3', fontWeight: '600' }],
        'title2': ['1.125rem', { lineHeight: '1.35', fontWeight: '600' }],
        'title3': ['1.0625rem', { lineHeight: '1.35', fontWeight: '500' }],
        'body': ['1rem', { lineHeight: '1.5', fontWeight: '400' }],
        'callout': ['0.9375rem', { lineHeight: '1.4', fontWeight: '400' }],
        'subheadline': ['0.875rem', { lineHeight: '1.4', fontWeight: '500' }],
        'footnote': ['0.8125rem', { lineHeight: '1.35', fontWeight: '400' }],
        'caption': ['0.75rem', { lineHeight: '1.3', letterSpacing: '0.01em', fontWeight: '400' }],
      },
      colors: {
        primary: {
          '50': '#F5F3FF',
          '100': '#EDE9FE',
          '200': '#DDD6FE',
          '300': '#C4B5FD',
          '400': '#A78BFA',
          '500': '#8B5CF6',
          '600': '#7C3AED',
          '700': '#6D28D9',
          '800': '#5B21B6',
          '900': '#4C1D95',
          '950': '#2E1065',
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))'
        },
        surface: {
          '50': '#FAFAFA',
          '100': '#F5F5F5',
          '200': '#E5E5E5',
          '300': '#D4D4D4',
          '400': '#A3A3A3',
          '500': '#737373',
          '600': '#525252',
          '700': '#404040',
          '800': '#262626',
          '900': '#171717',
          '950': '#0A0A0A'
        },
        accent: {
          blue: '#0EA5E9',
          emerald: '#10B981',
          amber: '#F59E0B',
          rose: '#DC2626',    // ← #f43f5e → #DC2626 (WCAG AA 5.6:1)
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))'
        },
        // shadcn CSS variable 기반 색상 유지 (호환성)
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))'
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))'
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))'
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))'
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))'
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
      },
      boxShadow: {
        'soft-xs': '0 1px 2px 0 rgb(0 0 0 / 0.03)',
        'soft-sm': '0 1px 3px 0 rgb(0 0 0 / 0.04), 0 1px 2px -1px rgb(0 0 0 / 0.04)',
        'soft-md': '0 4px 6px -1px rgb(0 0 0 / 0.04), 0 2px 4px -2px rgb(0 0 0 / 0.04)',
        'soft-lg': '0 10px 15px -3px rgb(0 0 0 / 0.04), 0 4px 6px -4px rgb(0 0 0 / 0.04)'
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)'
      },
      spacing: {
        'safe-top': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'safe-left': 'env(safe-area-inset-left)',
        'safe-right': 'env(safe-area-inset-right)',
        'header': '44px',
        'tabbar': '56px',
      },
      animation: {
        'fade-in': 'fade-in 0.15s ease-out',
        'slide-up': 'slide-up 0.2s ease-out',
        'slide-down': 'slide-down 0.2s ease-out',
        'scale-in': 'scale-in 0.15s ease-out',
        'skeleton': 'skeleton 1.5s ease-in-out infinite',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' }
        },
        'slide-up': {
          from: { transform: 'translateY(8px)', opacity: '0' },
          to: { transform: 'translateY(0)', opacity: '1' }
        },
        'slide-down': {
          from: { transform: 'translateY(-8px)', opacity: '0' },
          to: { transform: 'translateY(0)', opacity: '1' }
        },
        'scale-in': {
          from: { transform: 'scale(0.97)', opacity: '0' },
          to: { transform: 'scale(1)', opacity: '1' }
        },
        'skeleton': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' }
        }
      },
      maxWidth: {
        'app': '512px',
      }
    }
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
```

### 2.3 CSS Variables 마이그레이션 (index.css)

```css
@layer base {
  :root {
    /* 디자인 토큰 기반 */
    --primary: 263 84% 58%;          /* #7C3AED */
    --primary-foreground: 0 0% 100%; /* white */
    --background: 0 0% 100%;         /* #FFFFFF */
    --foreground: 0 0% 9%;           /* #171717 */
    --card: 0 0% 100%;
    --card-foreground: 0 0% 9%;
    --popover: 0 0% 100%;
    --popover-foreground: 0 0% 9%;
    --secondary: 0 0% 96%;           /* #F5F5F5 */
    --secondary-foreground: 0 0% 9%;
    --muted: 0 0% 96%;
    --muted-foreground: 0 0% 45%;    /* #737373 */
    --accent: 0 0% 96%;
    --accent-foreground: 0 0% 9%;
    --destructive: 0 72% 51%;        /* #DC2626 */
    --destructive-foreground: 0 0% 98%;
    --border: 0 0% 90%;              /* #E5E5E5 */
    --input: 0 0% 90%;
    --ring: 263 84% 58%;             /* primary와 동일 */
    --radius: 0.75rem;               /* 12px */
  }

  .dark {
    --primary: 264 70% 76%;          /* #A78BFA (dark mode primary) */
    --primary-foreground: 0 0% 9%;
    --background: 0 0% 6%;           /* #0F0F0F */
    --foreground: 0 0% 98%;          /* #FAFAFA */
    --card: 0 0% 10%;                /* #1A1A1A */
    --card-foreground: 0 0% 98%;
    --popover: 0 0% 10%;
    --popover-foreground: 0 0% 98%;
    --secondary: 0 0% 15%;
    --secondary-foreground: 0 0% 98%;
    --muted: 0 0% 15%;
    --muted-foreground: 0 0% 64%;    /* #A3A3A3 */
    --accent: 0 0% 15%;
    --accent-foreground: 0 0% 98%;
    --destructive: 0 63% 31%;
    --destructive-foreground: 0 0% 98%;
    --border: 0 0% 15%;              /* #262626 */
    --input: 0 0% 15%;
    --ring: 264 70% 76%;
  }
}
```

### 2.4 Button 컴포넌트 (개선)

> **Designer's Intent**: Button SM/MD의 시각적 크기는 유지하되 터치 영역을 44px로 확장. 이는 Apple HIG의 최소 터치 타겟 기준이며, 접근성 감사(11-accessibility-audit)에서 Critical로 지적된 항목. 시각적 크기와 터치 영역을 분리하여 디자인 의도를 해치지 않으면서 접근성을 보장.

```tsx
import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "@/shared/lib/utils";

const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium",
    "rounded-lg transition-colors duration-150",
    "disabled:pointer-events-none disabled:opacity-50",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2",
    "min-h-[44px]", // 터치 타겟 44px 보장
  ].join(" "),
  {
    variants: {
      variant: {
        primary:
          "bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-800 shadow-soft-sm hover:shadow-soft-md",
        secondary:
          "bg-surface-100 text-surface-700 hover:bg-surface-200 active:bg-surface-300",
        outline:
          "border border-surface-200 bg-white text-surface-700 hover:bg-surface-50 hover:border-surface-300",
        ghost:
          "bg-transparent text-surface-600 hover:bg-surface-100 hover:text-surface-900",
        destructive:
          "bg-accent-rose text-white hover:bg-red-700 active:bg-red-800",
        link:
          "bg-transparent text-primary-600 hover:text-primary-700 underline-offset-4 hover:underline min-h-0",
      },
      size: {
        sm: "h-8 px-3 text-xs",
        md: "h-9 px-4 text-sm",
        lg: "h-11 px-5 text-base",
        icon: "h-9 w-9 p-0",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

/** 버튼 컴포넌트 Props */
export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /** 로딩 상태. true이면 스피너 표시 및 disabled 처리 */
  isLoading?: boolean;
}

/**
 * 프로젝트 표준 버튼 컴포넌트.
 * CVA 기반 variant 시스템으로 일관된 스타일 보장.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, isLoading, disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      >
        {isLoading ? (
          <>
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            <span className="sr-only">로딩 중</span>
            {children}
          </>
        ) : (
          children
        )}
      </button>
    );
  }
);

Button.displayName = "Button";
export { buttonVariants };
```

### 2.5 Input 컴포넌트 (개선)

> **Designer's Intent**: 에러 상태에 아이콘을 추가하여 색상에만 의존하지 않도록 함 (접근성 감사 P3-2). min-height 44px로 터치 타겟 보장.

```tsx
import { forwardRef, type InputHTMLAttributes } from "react";
import { AlertCircle } from "lucide-react";
import { cn } from "@/shared/lib/utils";

/** Input 컴포넌트 Props */
export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** 에러 메시지. 존재하면 에러 스타일 적용 */
  error?: string;
  /** 라벨 텍스트 (접근성 필수) */
  label?: string;
}

/**
 * 프로젝트 표준 입력 필드.
 * 에러 상태 시 아이콘 + 텍스트로 이중 전달 (색상 단독 의존 방지).
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, label, id, ...props }, ref) => {
    const inputId = id || `input-${label?.replace(/\s/g, '-')}`;

    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="text-subheadline font-medium text-surface-700"
          >
            {label}
          </label>
        )}
        <input
          id={inputId}
          type={type}
          ref={ref}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : undefined}
          className={cn(
            "flex min-h-[44px] w-full rounded-lg border border-surface-200 bg-white px-3 py-2",
            "text-body transition-colors",
            "placeholder:text-surface-400",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-0 focus-visible:border-primary-600",
            "disabled:cursor-not-allowed disabled:opacity-50",
            error && "border-accent-rose focus-visible:ring-accent-rose/40 focus-visible:border-accent-rose",
            className
          )}
          {...props}
        />
        {error && (
          <span
            id={`${inputId}-error`}
            role="alert"
            className="flex items-center gap-1.5 text-caption text-accent-rose animate-fade-in"
          >
            <AlertCircle className="size-3.5 flex-shrink-0" aria-hidden="true" />
            {error}
          </span>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
```

### 2.6 BottomSheet 컴포넌트 (접근성 개선)

> **Designer's Intent**: vaul의 Drawer를 래핑하여 포커스 트랩, aria-modal, 스크린 리더 알림을 기본 제공. BottomSheet는 커스텀 구현 대신 vaul 기반으로 통일하여 제스처(스와이프 닫기)와 접근성을 동시에 해결.

```tsx
import { type ReactNode } from "react";
import { Drawer, DrawerContent } from "@/shared/ui/Drawer";
import { cn } from "@/shared/lib/utils";

/** BottomSheet 컴포넌트 Props */
interface BottomSheetProps {
  /** 열림 상태 */
  isOpen: boolean;
  /** 닫기 콜백 */
  onClose: () => void;
  /** 시트 내부 콘텐츠 */
  children: ReactNode;
  /** 시트 제목 (접근성: aria-labelledby에 사용) */
  title?: string;
  /** 시트 높이 @default "h-[70vh]" */
  height?: string;
  /** 추가 CSS 클래스 */
  className?: string;
}

/**
 * vaul 기반 BottomSheet.
 * 스와이프 제스처 + 포커스 트랩 + aria-modal 기본 내장.
 */
export function BottomSheet({
  isOpen,
  onClose,
  children,
  title,
  height = "h-[70vh]",
  className,
}: BottomSheetProps) {
  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent
        className={cn(
          height,
          "flex flex-col bg-white border-surface-200 outline-none rounded-t-[28px] shadow-2xl max-w-lg mx-auto",
          className
        )}
        aria-label={title}
      >
        {title && (
          <header className="flex items-center justify-center px-4 pt-4 pb-2 shrink-0">
            <h2 className="text-title3 font-semibold text-surface-900">
              {title}
            </h2>
          </header>
        )}
        <div
          className="flex-1 overflow-y-auto min-h-0 overscroll-contain px-4 pb-safe-bottom"
          style={{
            willChange: "scroll-position",
            WebkitOverflowScrolling: "touch",
            transform: "translateZ(0)",
          }}
        >
          {children}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
```

### 2.7 Tabs 컴포넌트 (접근성 개선)

> **Designer's Intent**: `role="tablist"` / `role="tab"` / `aria-selected` 추가로 스크린 리더에서 탭 구조를 인식 가능하게 함. 좌우 화살표 키보드 네비게이션 지원.

```tsx
import { useRef, useCallback, type KeyboardEvent } from "react";
import { cn } from "@/shared/lib/utils";

interface Tab {
  id: string;
  label: string;
}

/** Tabs 컴포넌트 Props */
interface TabsProps {
  /** 탭 목록 */
  tabs: Tab[];
  /** 현재 활성 탭 ID */
  activeTab: string;
  /** 탭 변경 콜백 */
  onChange: (id: string) => void;
  /** 탭 리스트 접근성 라벨 */
  ariaLabel?: string;
  /** 추가 CSS 클래스 */
  className?: string;
}

/**
 * YouTube Pill 스타일 탭 컴포넌트.
 * WAI-ARIA Tabs 패턴: Arrow key 네비게이션 지원.
 */
export function Tabs({ tabs, activeTab, onChange, ariaLabel, className }: TabsProps) {
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent, index: number) => {
      let nextIndex: number | null = null;

      if (e.key === "ArrowRight") {
        nextIndex = (index + 1) % tabs.length;
      } else if (e.key === "ArrowLeft") {
        nextIndex = (index - 1 + tabs.length) % tabs.length;
      } else if (e.key === "Home") {
        nextIndex = 0;
      } else if (e.key === "End") {
        nextIndex = tabs.length - 1;
      }

      if (nextIndex !== null) {
        e.preventDefault();
        tabRefs.current[nextIndex]?.focus();
        onChange(tabs[nextIndex].id);
      }
    },
    [tabs, onChange]
  );

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn("flex gap-2 overflow-x-auto scrollbar-hide py-1", className)}
    >
      {tabs.map((tab, index) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            ref={(el) => { tabRefs.current[index] = el; }}
            role="tab"
            aria-selected={isActive}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onChange(tab.id)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            className={cn(
              "px-3 py-1.5 text-sm font-medium transition-colors relative whitespace-nowrap rounded-lg flex-shrink-0 min-h-[44px] flex items-center",
              isActive
                ? "bg-surface-900 text-white"
                : "bg-surface-100 text-surface-600 hover:bg-surface-200"
            )}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
```

### 2.8 SourceBadge 컴포넌트 (신규)

> **Designer's Intent**: 출처 유형을 색상 + 아이콘 + 텍스트 라벨의 3중 전달로 구분. 색맹 사용자도 아이콘 형태로 유형 구분 가능. 02-components와 08-figma-specs의 스펙을 정확히 구현.

```tsx
import { cn } from "@/shared/lib/utils";

const BADGE_CONFIG = {
  youtube: {
    bg: "bg-red-50",
    text: "text-red-700",
    label: "YouTube",
  },
  community: {
    bg: "bg-blue-50",
    text: "text-blue-800",
    label: "커뮤니티",
  },
  folder: {
    bg: "bg-primary-50",
    text: "text-primary-700",
    label: "폴더",
  },
  instagram: {
    bg: "bg-pink-50",
    text: "text-pink-700",
    label: "Instagram",
  },
} as const;

type SourceType = keyof typeof BADGE_CONFIG;

/** SourceBadge 컴포넌트 Props */
interface SourceBadgeProps {
  /** 출처 유형 */
  type: SourceType;
  /** 출처 개수 */
  count?: number;
  /** 클릭 핸들러 (있으면 탭 가능) */
  onClick?: () => void;
  /** 추가 CSS 클래스 */
  className?: string;
}

/**
 * 출처 유형 배지.
 * 색상 + 텍스트 라벨로 이중 전달 (색상 단독 의존 방지).
 */
export function SourceBadge({ type, count, onClick, className }: SourceBadgeProps) {
  const config = BADGE_CONFIG[type];
  const Tag = onClick ? "button" : "span";

  return (
    <Tag
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1 px-2 py-1 rounded-md text-footnote font-medium",
        config.bg, config.text,
        onClick && "min-h-[44px] min-w-[44px] justify-center active:opacity-70 focus-visible:ring-2 focus-visible:ring-primary-600",
        className
      )}
      {...(onClick && { type: "button" })}
    >
      <span>{config.label}</span>
      {count !== undefined && count > 0 && (
        <span className="opacity-70">{count}</span>
      )}
    </Tag>
  );
}
```

### 2.9 Skeleton 컴포넌트 (PlaceCard용)

```tsx
import { cn } from "@/shared/lib/utils";

interface PlaceCardSkeletonProps {
  /** 이미지 표시 여부 @default true */
  showImage?: boolean;
  /** 추가 CSS 클래스 */
  className?: string;
}

/**
 * PlaceCard 로딩 스켈레톤.
 * 실제 카드 구조와 동일한 레이아웃으로 CLS 방지.
 */
export function PlaceCardSkeleton({ showImage = true, className }: PlaceCardSkeletonProps) {
  return (
    <article
      className={cn("bg-white border-b-[12px] border-surface-200/60", className)}
      aria-busy="true"
      aria-label="장소 카드 로딩 중"
    >
      {showImage && (
        <div className="aspect-[4/3] bg-surface-100 animate-skeleton" />
      )}
      <div className="px-2 pt-1 pb-5">
        <div className="flex items-center justify-between py-2">
          <div className="flex items-center gap-4">
            <div className="size-[26px] rounded-full bg-surface-200 animate-skeleton" />
            <div className="size-[26px] rounded-full bg-surface-200 animate-skeleton" />
            <div className="size-[26px] rounded-full bg-surface-200 animate-skeleton" />
          </div>
          <div className="flex items-center gap-4">
            <div className="size-[26px] rounded-full bg-surface-200 animate-skeleton" />
            <div className="size-[26px] rounded-full bg-surface-200 animate-skeleton" />
          </div>
        </div>
        <div className="space-y-2">
          <div className="h-5 w-40 bg-surface-200 rounded animate-skeleton" />
          <div className="h-3.5 w-60 bg-surface-100 rounded animate-skeleton" />
        </div>
      </div>
    </article>
  );
}
```

### 2.10 Toast (aria-live) 전역 설정

> **Designer's Intent**: sonner는 기본적으로 aria-live를 지원하지만, 전역 설정에서 위치·스타일·접근성을 통일. 접근성 감사에서 Critical로 지적된 Toast aria-live 부재 해결.

```tsx
// src/app/providers/index.tsx 내부
import { Toaster } from "sonner";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster
        position="bottom-center"
        toastOptions={{
          className: "!bg-surface-900 !text-white !text-footnote !font-medium !rounded-xl !shadow-soft-lg",
          duration: 3000,
        }}
        offset={72} // tabbar(56) + 16px margin
      />
    </QueryClientProvider>
  );
}
```

---

## 3. STYLING SPECIFICATIONS

### 3.1 디자인 토큰 → Tailwind 클래스 매핑

| 디자인 토큰 | Tailwind 클래스 | 값 |
|------------|----------------|-----|
| color.primary.600 | `text-primary-600`, `bg-primary-600` | #7C3AED |
| color.semantic.success | `text-accent-emerald` | #10B981 |
| color.semantic.error | `text-accent-rose` | #DC2626 |
| color.semantic.warning | `text-accent-amber` | #F59E0B |
| color.semantic.info | `text-accent-blue` | #0EA5E9 |
| color.surface.50 | `bg-surface-50` | #FAFAFA |
| color.surface.900 | `text-surface-900` | #171717 |
| typography.display | `text-display` | 32px/1.2/-0.02em/700 |
| typography.headline | `text-headline` | 24px/1.25/-0.01em/700 |
| typography.title1 | `text-title1` | 20px/1.3/600 |
| typography.title2 | `text-title2` | 18px/1.35/600 |
| typography.title3 | `text-title3` | 17px/1.35/500 |
| typography.body | `text-body` | 16px/1.5/400 |
| typography.callout | `text-callout` | 15px/1.4/400 |
| typography.subheadline | `text-subheadline` | 14px/1.4/500 |
| typography.footnote | `text-footnote` | 13px/1.35/400 |
| typography.caption | `text-caption` | 12px/1.3/0.01em/400 |
| spacing.4 | `p-4`, `gap-4` | 16px |
| spacing.6 | `p-6`, `gap-6` | 24px |
| radius.md | `rounded-lg` | 12px (var(--radius)) |
| radius.xl | `rounded-2xl` | 16px |
| shadow.soft-sm | `shadow-soft-sm` | 0 1px 3px... |
| layout.headerHeight | `h-header` | 44px |
| layout.tabBarHeight | `h-tabbar` | 56px |
| layout.containerMax | `max-w-app` | 512px |

### 3.2 Hover / Focus / Active States

```css
/* 모든 인터랙티브 요소의 상태 레이어 */

/* Focus (접근성 필수 — 불투명 ring) */
.interactive:focus-visible {
  @apply outline-none ring-2 ring-primary-600 ring-offset-2;
}

/* Hover (데스크톱 전용) */
@media (hover: hover) {
  .interactive:hover {
    @apply bg-surface-100;
  }
}

/* Active (모바일 터치 피드백) */
.interactive:active {
  @apply opacity-60;
}

/* Disabled */
.interactive:disabled {
  @apply pointer-events-none opacity-50;
}
```

실제 적용 패턴:

```tsx
// 터치 피드백은 opacity 기반 (transition 없이)
<button className="active:opacity-60">

// Hover는 @media (hover: hover) 안에서만
<button className="hover:bg-surface-100">

// Focus는 항상 불투명 ring
<button className="focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2">
```

### 3.3 Responsive Breakpoints

```text
Mobile First:
  375px → 기본 스타일 (모든 클래스)
  
sm: 428px  → 대형 폰 미세 조정
md: 768px  → 태블릿 (2열 그리드, 사이드바)
lg: 1440px → 데스크톱 (max-w-app 컨테이너)
```

앱 컨테이너 패턴:

```tsx
<div className="mx-auto max-w-app min-h-dvh">
  {/* 512px 이하에서 모바일 앱 경험 */}
</div>
```

---

## 4. DESIGN TOKEN INTEGRATION

### 4.1 Color Tokens → CSS Variables

```text
04-tokens.md JSON        →   index.css :root         →   tailwind.config.ts
─────────────────────────────────────────────────────────────────────────
color.primary.600        →   --primary: 263 84% 58%   →   primary.600: '#7C3AED'
color.semantic.error     →   --destructive: 0 72% 51% →   accent.rose: '#DC2626'
color.surface.50         →   --background: 0 0% 98%   →   surface.50: '#FAFAFA'
```

### 4.2 Typography Tokens → Tailwind fontSize

```text
04-tokens.md             →   tailwind.config.ts fontSize
──────────────────────────────────────────────────────────
fontSize.display: 32px   →   'display': ['2rem', { lineHeight: '1.2', ... }]
fontSize.body: 16px      →   'body': ['1rem', { lineHeight: '1.5', ... }]
fontSize.caption: 12px   →   'caption': ['0.75rem', { lineHeight: '1.3', ... }]
```

### 4.3 Spacing Tokens

spacing은 Tailwind 기본 4px 스케일과 디자인 토큰이 일치하므로 별도 확장 불필요:

| 토큰 | Tailwind | 사용 |
|------|----------|------|
| space-1 (4px) | `p-1`, `gap-1` | 아이콘 간격 |
| space-2 (8px) | `p-2`, `gap-2` | 인라인 간격 |
| space-3 (12px) | `p-3`, `gap-3` | 소그룹 |
| space-4 (16px) | `p-4`, `gap-4` | 기본 패딩 |
| space-6 (24px) | `p-6`, `gap-6` | 섹션 간격 |

### 4.4 Shadow / Border Radius Tokens

이미 Tailwind config에 매핑 완료:

```text
shadow.soft-sm  →  shadow-soft-sm
shadow.soft-md  →  shadow-soft-md
radius.md       →  rounded-lg (var(--radius) = 12px)
radius.xl       →  rounded-2xl (16px)
```

---

## 5. ASSET OPTIMIZATION

### 5.1 이미지 컴포넌트

> **Designer's Intent**: 네이버 지도 이미지 URL을 리사이징 URL로 변환하여 대역폭 절약. 첫 번째 이미지만 eager 로딩, 나머지는 lazy.

```tsx
import { useState, type ImgHTMLAttributes } from "react";
import { convertToNaverResizeImageUrl } from "@/shared/lib";
import { cn } from "@/shared/lib/utils";

interface OptimizedImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, "src"> {
  /** 원본 이미지 URL */
  src: string;
  /** 네이버 리사이징 적용 여부 @default true */
  useResize?: boolean;
  /** 로딩 실패 시 대체 이미지 */
  fallbackSrc?: string;
}

const DEFAULT_FALLBACK = "https://placehold.co/600x400?text=이미지+준비중";

/**
 * 네이버 이미지 리사이징 + lazy loading + 에러 핸들링 통합 이미지 컴포넌트.
 */
export function OptimizedImage({
  src,
  useResize = true,
  fallbackSrc = DEFAULT_FALLBACK,
  className,
  alt,
  loading = "lazy",
  ...props
}: OptimizedImageProps) {
  const [hasError, setHasError] = useState(false);
  const resolvedSrc = hasError
    ? fallbackSrc
    : useResize
      ? convertToNaverResizeImageUrl(src)
      : src;

  return (
    <img
      src={resolvedSrc}
      alt={alt || ""}
      loading={loading}
      decoding="async"
      onError={() => !hasError && setHasError(true)}
      className={cn("object-cover", className)}
      {...props}
    />
  );
}
```

### 5.2 아이콘 시스템

lucide-react 사용 (Tree-shaking 지원):

```tsx
// ✅ 개별 import (tree-shaking)
import { Heart, Bookmark, MapPin } from "lucide-react";

// ❌ 전체 import 금지
import * as Icons from "lucide-react";
```

커스텀 SVG(유튜브, 인스타그램 등)는 `src/shared/ui/icons/` 디렉토리에 컴포넌트로 관리.

### 5.3 폰트 로딩 전략

```html
<!-- index.html <head> -->
<link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin />
<link
  rel="preload"
  as="font"
  type="font/woff2"
  href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
  crossorigin
/>
<link
  rel="stylesheet"
  href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
/>
```

`font-display: swap`은 Pretendard CDN에 기본 포함. FOUT를 최소화하기 위해 `<link rel="preload">`를 사용.

---

## 6. PERFORMANCE CONSIDERATIONS

### 6.1 Code Splitting

```tsx
// 페이지 단위 lazy import
import { lazy, Suspense } from "react";

const HomePage = lazy(() => import("@/pages/HomePage"));
const SearchPage = lazy(() => import("@/pages/SearchPage"));
const ProfilePage = lazy(() => import("@/pages/ProfilePage"));

// 라우터에서 Suspense fallback
<Suspense fallback={<PageSkeleton />}>
  <Outlet />
</Suspense>
```

### 6.2 Bundle Size 최적화

| 라이브러리 | 크기 | 최적화 방안 |
|-----------|------|------------|
| framer-motion | ~50KB | LazyMotion + domAnimation 사용 |
| lucide-react | Tree-shaking | 개별 import만 사용 |
| date-fns | Tree-shaking | 개별 함수 import |
| mapbox-gl | ~200KB | 동적 import (MapPage에서만) |

Framer Motion 최적화:

```tsx
import { LazyMotion, domAnimation, m } from "framer-motion";

function App() {
  return (
    <LazyMotion features={domAnimation} strict>
      {/* m.div 사용 (motion.div 대신) */}
      <m.div animate={{ opacity: 1 }}>...</m.div>
    </LazyMotion>
  );
}
```

### 6.3 렌더링 최적화

```tsx
// 무한 스크롤 리스트의 각 아이템 메모이제이션
import { memo } from "react";

const MemoizedPlaceCard = memo(PlaceCard, (prev, next) => {
  return (
    prev.place.id === next.place.id &&
    prev.place.interaction?.is_liked === next.place.interaction?.is_liked &&
    prev.place.interaction?.is_saved === next.place.interaction?.is_saved
  );
});
```

### 6.4 이미지 최적화

이미 구현된 패턴 유지:

```tsx
<img
  src={convertToNaverResizeImageUrl(img)}
  loading={index === 0 ? "eager" : "lazy"}
  decoding="async"
  className="w-full h-full object-cover"
/>
```

스크롤 컨테이너 GPU 가속:

```tsx
<div
  className="overflow-x-auto"
  style={{
    willChange: "scroll-position",
    WebkitOverflowScrolling: "touch",
    transform: "translateZ(0)",
  }}
>
```

### 6.5 금지 목록 (mobile-performance-optimization.mdc)

| 금지 | 이유 | 대안 |
|------|------|------|
| `backdrop-blur` | GPU 집약적, 스크롤마다 재계산 | `bg-black/70` 단색 |
| 리스트 아이템 `transition` | 수십 개 합성 레이어 | 버튼에만 `transition-colors` |
| `display: none` + 마운트 유지 | 숨은 컴포넌트도 메모리 점유 | 조건부 렌더링 `{active && <C />}` |

---

## 7. TESTING STRATEGY

### 7.1 Unit Tests (Vitest + React Testing Library)

```tsx
// Button.test.tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button } from "@/shared/ui/Button";

describe("Button", () => {
  it("renders with default props", () => {
    render(<Button>저장하기</Button>);
    expect(screen.getByRole("button", { name: "저장하기" })).toBeInTheDocument();
  });

  it("shows loading spinner and disables when isLoading", () => {
    render(<Button isLoading>저장하기</Button>);
    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
    expect(screen.getByText("로딩 중")).toBeInTheDocument();
  });

  it("applies variant classes correctly", () => {
    const { container } = render(<Button variant="destructive">삭제</Button>);
    expect(container.firstChild).toHaveClass("bg-accent-rose");
  });

  it("meets minimum touch target size", () => {
    const { container } = render(<Button size="sm">작은 버튼</Button>);
    expect(container.firstChild).toHaveClass("min-h-[44px]");
  });
});
```

```tsx
// Input.test.tsx
import { render, screen } from "@testing-library/react";
import { Input } from "@/shared/ui/Input";

describe("Input", () => {
  it("renders error state with icon and message", () => {
    render(<Input error="닉네임은 2~20자여야 합니다" />);
    expect(screen.getByRole("alert")).toHaveTextContent("닉네임은 2~20자여야 합니다");
  });

  it("sets aria-invalid when error exists", () => {
    render(<Input error="에러" />);
    expect(screen.getByRole("textbox")).toHaveAttribute("aria-invalid", "true");
  });

  it("links error message via aria-describedby", () => {
    render(<Input id="nickname" error="에러" />);
    const input = screen.getByRole("textbox");
    expect(input).toHaveAttribute("aria-describedby", "nickname-error");
  });
});
```

### 7.2 Visual Regression (Storybook + Chromatic)

```tsx
// Button.stories.tsx
import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "@/shared/ui/Button";

const meta: Meta<typeof Button> = {
  component: Button,
  argTypes: {
    variant: {
      control: "select",
      options: ["primary", "secondary", "outline", "ghost", "destructive", "link"],
    },
    size: { control: "select", options: ["sm", "md", "lg", "icon"] },
    isLoading: { control: "boolean" },
    disabled: { control: "boolean" },
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Primary: Story = {
  args: { children: "저장하기", variant: "primary" },
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-4 p-4">
      {(["primary", "secondary", "outline", "ghost", "destructive", "link"] as const).map(
        (variant) => (
          <div key={variant} className="flex items-center gap-3">
            <Button variant={variant} size="sm">SM</Button>
            <Button variant={variant} size="md">MD</Button>
            <Button variant={variant} size="lg">LG</Button>
            <Button variant={variant} size="icon">♡</Button>
            <Button variant={variant} isLoading>Loading</Button>
            <Button variant={variant} disabled>Disabled</Button>
          </div>
        )
      )}
    </div>
  ),
};

export const Loading: Story = {
  args: { children: "저장 중...", isLoading: true },
};

export const Disabled: Story = {
  args: { children: "비활성화", disabled: true },
};
```

### 7.3 Accessibility Tests (Storybook a11y addon)

프로젝트에 이미 `@storybook/addon-a11y` 설치됨.

```tsx
// .storybook/preview.ts
import { withA11y } from "@storybook/addon-a11y";

export default {
  decorators: [withA11y],
  parameters: {
    a11y: {
      config: {
        rules: [
          { id: "color-contrast", enabled: true },
          { id: "button-name", enabled: true },
          { id: "image-alt", enabled: true },
          { id: "label", enabled: true },
        ],
      },
    },
  },
};
```

### 7.4 Responsive Test Cases

| 시나리오 | Viewport | 검증 항목 |
|----------|----------|----------|
| Mobile (iPhone SE) | 375×667 | 기본 레이아웃 정상 |
| Mobile (iPhone 15 Pro Max) | 430×932 | PlaceCard 이미지 비율 유지 |
| Tablet (iPad) | 768×1024 | 2열 그리드, 사이드바 |
| Desktop (Laptop) | 1440×900 | max-w-app 컨테이너 중앙 |
| 200% 텍스트 확대 | 375 + zoom | 콘텐츠 잘림 없음 |
| Landscape | 667×375 | 가로 모드 레이아웃 |

---

## 8. DOCUMENTATION

### 8.1 컴포넌트 JSDoc 표준

모든 공개 컴포넌트에 적용할 JSDoc 표준:

```tsx
/**
 * 프로젝트 표준 버튼 컴포넌트.
 * CVA 기반 variant 시스템으로 일관된 스타일 보장.
 *
 * @example
 * <Button variant="primary" size="lg">저장하기</Button>
 *
 * @example 로딩 상태
 * <Button isLoading>처리 중...</Button>
 *
 * @example 아이콘 버튼
 * <Button variant="ghost" size="icon" aria-label="좋아요">
 *   <Heart />
 * </Button>
 */
```

### 8.2 Usage Examples

#### Button — 3가지 변형

```tsx
// 1. CTA 버튼 (화면당 하나)
<Button variant="primary" size="lg" className="w-full">
  맛탐정 시작하기
</Button>

// 2. 보조 액션 (취소, 닫기)
<div className="flex gap-3">
  <Button variant="outline" className="flex-1">취소</Button>
  <Button variant="primary" className="flex-1">확인</Button>
</div>

// 3. 툴바 아이콘 버튼
<div className="flex items-center gap-2">
  <Button variant="ghost" size="icon" aria-label="좋아요">
    <Heart className="size-5" />
  </Button>
  <Button variant="ghost" size="icon" aria-label="저장">
    <Bookmark className="size-5" />
  </Button>
</div>
```

#### Input — 3가지 변형

```tsx
// 1. 기본 입력
<Input label="닉네임" placeholder="2~20자로 입력해 주세요" />

// 2. 에러 상태
<Input
  label="닉네임"
  value="a"
  error="닉네임은 2~20자여야 합니다"
/>

// 3. 검색 (라벨 숨김)
<Input
  type="search"
  placeholder="장소·음식·지역 검색"
  aria-label="검색"
  className="pl-10"
/>
```

#### SourceBadge — 3가지 변형

```tsx
// 1. 정보 표시 (비클릭)
<SourceBadge type="youtube" count={3} />

// 2. 클릭 가능 (출처 상세 이동)
<SourceBadge type="community" count={5} onClick={() => navigate("/source/community")} />

// 3. 그룹으로 나열
<div className="flex gap-2 flex-wrap">
  <SourceBadge type="youtube" count={2} />
  <SourceBadge type="community" count={1} />
  <SourceBadge type="folder" count={3} />
</div>
```

### 8.3 Do's and Don'ts

| # | Do ✅ | Don't ❌ |
|---|------|---------|
| 1 | `cn()` 유틸리티로 클래스 병합 | 문자열 연결로 클래스 조합 |
| 2 | CVA로 variant 정의 | 조건부 객체로 variant 하드코딩 |
| 3 | `forwardRef`로 ref 전달 | ref를 커스텀 prop으로 전달 |
| 4 | `aria-label`로 아이콘 버튼에 이름 부여 | 아이콘만 있는 버튼에 레이블 생략 |
| 5 | `loading="lazy"` + `decoding="async"` | 이미지에 로딩 속성 생략 |
| 6 | 조건부 렌더링 `{active && <C />}` | `hidden` 클래스로 숨김 |
| 7 | 터치 피드백 `active:opacity-60` | 리스트 아이템 `transition-all` |
| 8 | entities 타입으로 Props 정의 | `place: any` 사용 |
| 9 | `text-display` 등 시맨틱 fontSize | `text-[32px]` 매직 넘버 |
| 10 | 불투명 `ring-primary-600` | 반투명 `ring-primary-500/40` |

### 8.4 Changelog Template

```markdown
## [Unreleased]

### Added
- `SourceBadge` 컴포넌트 신규 추가

### Changed
- `Button`: CVA 기반으로 리팩터링, min-h-[44px] 터치 타겟 보장
- `Input`: 에러 상태에 아이콘 추가, label prop 추가
- Primary 색상: Indigo → Violet 마이그레이션
- Error 색상: #f43f5e → #DC2626 (WCAG AA 충족)
- 폰트: IBM Plex Sans KR → Pretendard Variable

### Fixed
- Button SM/MD/Icon 터치 영역 44px 미달 (접근성)
- Focus ring 반투명 → 불투명 (대비 보장)
- Error text 대비 4.0:1 → 5.6:1 (WCAG AA)

### Removed
- 커스텀 BottomSheet (vaul Drawer로 대체)
```

---

## 마이그레이션 우선순위

| 순서 | 항목 | 영향 범위 | 난이도 |
|------|------|----------|--------|
| 1 | Error 색상 변경 (#DC2626) | `accent-rose` 전역 | ⭐ |
| 2 | Focus ring 불투명 변경 | `index.css` 전역 | ⭐ |
| 3 | Button 터치 타겟 44px | `Button.tsx` | ⭐⭐ |
| 4 | Input 에러 아이콘 + label | `Input.tsx` | ⭐⭐ |
| 5 | 폰트 교체 (Pretendard) | `index.html` + `tailwind.config.ts` + `index.css` | ⭐⭐ |
| 6 | Primary 색상 Violet 전환 | `tailwind.config.ts` (전체 UI 영향) | ⭐⭐⭐ |
| 7 | Typography 시맨틱 클래스 적용 | 전체 컴포넌트 | ⭐⭐⭐⭐ |
| 8 | CSS Variables 통합 | `index.css` | ⭐⭐ |
| 9 | SourceBadge 신규 컴포넌트 | `shared/ui/` | ⭐⭐ |
| 10 | Dark Mode 활성화 | `tailwind.config.ts` + CSS vars | ⭐⭐⭐⭐ |

---

## 관련 문서

- [[01-foundations|FOUNDATIONS (Color, Typography, Layout)]]
- [[02-components|COMPONENTS (30+ 컴포넌트 스펙)]]
- [[04-tokens|Design Tokens JSON]]
- [[05-documentation|구현 가이드 & Do's and Don'ts]]
- [[08-figma-specs|Figma 스펙 (Auto-layout, Variant)]]
- [[09-design-critique|디자인 크리틱 (개선 포인트)]]
- [[11-accessibility-audit|접근성 감사 (WCAG 2.2 AA)]]
