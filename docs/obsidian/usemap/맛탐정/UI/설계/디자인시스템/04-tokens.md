생성일: 2026-03-03

# 4. TOKENS

개발자 핸드오프용 디자인 토큰 JSON 구조.

```json
{
  "color": {
    "primary": {
      "50": "#F5F3FF",
      "100": "#EDE9FE",
      "200": "#DDD6FE",
      "300": "#C4B5FD",
      "400": "#A78BFA",
      "500": "#8B5CF6",
      "600": "#7C3AED",
      "700": "#6D28D9",
      "800": "#5B21B6",
      "900": "#4C1D95"
    },
    "semantic": {
      "success": "#10B981",
      "warning": "#F59E0B",
      "error": "#EF4444",
      "info": "#0EA5E9"
    },
    "surface": {
      "50": "#FAFAFA",
      "100": "#F5F5F5",
      "200": "#E5E5E5",
      "300": "#D4D4D4",
      "400": "#A3A3A3",
      "500": "#737373",
      "600": "#525252",
      "700": "#404040",
      "800": "#262626",
      "900": "#171717"
    }
  },
  "typography": {
    "fontFamily": {
      "sans": "Pretendard Variable, -apple-system, BlinkMacSystemFont, system-ui, Apple SD Gothic Neo, Noto Sans KR, sans-serif"
    },
    "fontSize": {
      "display": "32px",
      "headline": "24px",
      "title1": "20px",
      "title2": "18px",
      "title3": "17px",
      "body": "16px",
      "callout": "15px",
      "subheadline": "14px",
      "footnote": "13px",
      "caption": "12px"
    },
    "fontWeight": {
      "regular": 400,
      "medium": 500,
      "semibold": 600,
      "bold": 700
    },
    "lineHeight": {
      "tight": 1.2,
      "snug": 1.25,
      "normal": 1.5,
      "relaxed": 1.6
    }
  },
  "spacing": {
    "1": "4px",
    "2": "8px",
    "3": "12px",
    "4": "16px",
    "6": "24px",
    "8": "32px",
    "12": "48px",
    "16": "64px",
    "24": "96px",
    "32": "128px"
  },
  "radius": {
    "sm": "4px",
    "md": "8px",
    "lg": "12px",
    "xl": "16px",
    "2xl": "2rem"
  },
  "shadow": {
    "soft-xs": "0 1px 2px 0 rgb(0 0 0 / 0.03)",
    "soft-sm": "0 1px 3px 0 rgb(0 0 0 / 0.04), 0 1px 2px -1px rgb(0 0 0 / 0.04)",
    "soft-md": "0 4px 6px -1px rgb(0 0 0 / 0.04), 0 2px 4px -2px rgb(0 0 0 / 0.04)",
    "soft-lg": "0 10px 15px -3px rgb(0 0 0 / 0.04), 0 4px 6px -4px rgb(0 0 0 / 0.04)"
  },
  "breakpoint": {
    "mobile": "375px",
    "mobileLarge": "428px",
    "tablet": "768px",
    "desktop": "1440px"
  },
  "layout": {
    "headerHeight": "44px",
    "tabBarHeight": "56px",
    "containerMax": "512px",
    "safeArea": "env(safe-area-inset-*)"
  }
}
```

## CSS Variables (예시)

```css
:root {
  --primary: 263 84% 58%;
  --primary-foreground: 0 0% 100%;
  --background: 0 0% 98%;
  --foreground: 0 0% 9%;
  --surface: 0 0% 100%;
  --muted: 0 0% 96%;
  --muted-foreground: 0 0% 32%;
  --border: 0 0% 90%;
  --radius: 0.75rem;
}
```
