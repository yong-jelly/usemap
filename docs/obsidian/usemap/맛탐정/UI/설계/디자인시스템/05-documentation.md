생성일: 2026-03-03

# 5. DOCUMENTATION

## 5.1 Design Principles (3 core)

### 1. Traceable (추적 가능)

> 모든 정보는 "어디서 왔는지" 추적 가능해야 함.

- 출처 배지(Source Badge)를 항상 노출
- 유튜브/커뮤니티/맛탐정 폴더 구분
- 저장된 폴더명으로 맥락 전달

**예시**: PlaceCard에 "유튜브 2개, 폴더 3개" 등 출처 요약 표시

---

### 2. Actionable (실행 가능)

> 모든 정보는 "나중에 방문할 때" 도움이 되어야 함.

- 네이버 지도 연결 버튼 명확
- 메모·방문 기록으로 개인화
- 지역·카테고리 필터로 탐색 용이

**예시**: 장소 상세 하단에 항상 네이버 지도 버튼

---

### 3. Personal (개인화)

> 나의 메모와 나의 맥락이 우선.

- 폴더별 메모 강조
- 좋아요 → 콜렉션 저장 흐름
- 내 리뷰, 내 방문 기록 우선 노출

**예시**: 폴더 내 장소에 메모 작성 영역 확보

---

## 5.2 Do's and Don'ts (10 examples)

| # | Do | Don't |
|---|-----|-------|
| 1 | 출처 표시를 항상 포함 | 출처 없이 장소만 노출 |
| 2 | CTA는 Primary, 보조는 Secondary/Ghost | 모든 버튼을 동일한 강조 |
| 3 | 모바일 터치 영역 44px 이상 | 작은 터치 영역 |
| 4 | Skeleton으로 로딩 상태 표현 | 빈 화면 또는 스피너만 |
| 5 | Empty state에 명확한 CTA | "결과 없음"만 표시 |
| 6 | 리뷰/별점 없음 유지 | 별점·리뷰 UI 추가 |
| 7 | 네이버 지도로 외부 확인 유도 | 맛탐정 내부에 별점 표시 |
| 8 | 8px 베이스 스페이싱 | 임의의 간격 |
| 9 | `backdrop-blur` 사용 금지 (모바일 성능) | 블러 효과 남용 |
| 10 | focus-visible로 키보드 접근성 | 포커스 링 없음 |

---

## 5.3 Implementation Guide for Developers

### 1. 폰트 설치

```bash
# Pretendard Variable (가변 폰트)
npm install pretendard
```

또는 CDN:

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css" />
```

---

### 2. Tailwind 설정

- `tailwind.config.ts`에 `04-tokens` JSON 반영
- `--radius` 등 CSS 변수와 연동
- `backdrop-blur` 사용 금지 (모바일 성능)

---

### 3. 컴포넌트 구조

```
src/
├── shared/ui/          # 공통 컴포넌트 (Button, Input, etc.)
├── widgets/            # 도메인 위젯 (PlaceCard, PlaceActionRow)
└── features/           # 기능별 UI (place, folder, profile)
```

---

### 4. 접근성 체크리스트

- [ ] 모든 인터랙티브 요소에 focus-visible
- [ ] 버튼/링크에 aria-label (아이콘만 있을 때)
- [ ] 이미지에 alt
- [ ] 색상 대비 4.5:1 이상

---

### 5. 모바일 성능

- [ ] `backdrop-blur` 미사용
- [ ] 숨김 탭은 DOM에서 언마운트 (lazy)
- [ ] transition 최소화

---

## 5.4 관련 문서

- [[01-foundations|FOUNDATIONS]]
- [[02-components|COMPONENTS]]
- [[03-patterns|PATTERNS]]
- [[04-tokens|TOKENS]]
- [[../기능/README|UI 기능]]
