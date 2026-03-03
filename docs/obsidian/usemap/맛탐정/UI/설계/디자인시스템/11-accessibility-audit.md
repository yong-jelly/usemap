생성일: 2026-03-03

# 11. Accessibility Audit

WCAG 2.2 Level AA 기준 맛탐정 디자인 시스템 종합 접근성 감사.

---

## 1. PERCEIVABLE (인식 가능)

### 1.1 Text Alternatives for Images

| 기준 | 상태 | 세부 |
|------|------|------|
| 음식 이미지 alt 전략 | ⚠️ Partial | Alt 전략이 정의되지 않음 |
| 아이콘 alt | ⚠️ Partial | aria-label은 08-figma-specs에서 일부 정의 |
| 장식적 이미지 구분 | ❌ Fail | 장식 이미지와 정보 이미지 구분 규칙 없음 |

**위반 사항**:

| ID | 위치 | 심각도 | 설명 |
|----|------|--------|------|
| P1-1 | PlaceCard 이미지 | High | 음식 이미지에 alt text 전략 미정의. 장소명만으로는 시각장애인이 "어떤 음식인지" 판단 불가 |
| P1-2 | Avatar | Medium | 사용자 아바타에 alt 전략 미정의 |
| P1-3 | Empty state 아이콘 | Low | 장식적 아이콘(Compass, Heart 등)에 role="presentation" 지정 필요 |

**권장 수정**:

```html
<!-- PlaceCard 이미지: 장소명 + 카테고리 조합 -->
<img alt="을지로 골뱅이집 - 한식" src="..." />

<!-- 음식 이미지가 없는 경우 placeholder -->
<img alt="음식 이미지 없음" src="placeholder.png" />

<!-- Avatar: 닉네임 포함 -->
<img alt="민지님의 프로필 사진" src="..." />

<!-- Empty state 장식 아이콘 -->
<svg role="presentation" aria-hidden="true">...</svg>
```

### 1.2 Captions/Transcripts for Multimedia

| 기준 | 상태 | 세부 |
|------|------|------|
| 유튜브 출처 링크 | ✅ Pass | 외부 링크로 이동. 유튜브 자체 자막 활용 |
| 앱 내 영상 재생 | N/A | 앱 내 자동 재생 없음 (설계 원칙) |

### 1.3 Color Not Sole Means

| 기준 | 상태 | 세부 |
|------|------|------|
| 출처 배지 구분 | ✅ Pass | 색상 + 아이콘 + 텍스트 라벨 병행 |
| 좋아요 상태 | ⚠️ Partial | 빨강 채움으로만 구분. 채움/비채움 형태 차이는 있으나 색맹 사용자에게 불충분할 수 있음 |
| 에러 상태 | ⚠️ Partial | border 색상 변경 + 텍스트 메시지가 있지만, 아이콘이 없음 |
| 활성 탭 구분 | ✅ Pass | Primary 색상 + 밑줄/볼드 등 복합 표시 |

**위반 사항**:

| ID | 위치 | 심각도 | 설명 |
|----|------|--------|------|
| P3-1 | 좋아요 버튼 | Medium | 색맹 사용자가 빨간 하트와 회색 하트의 차이를 구분하기 어려울 수 있음 |
| P3-2 | 에러 필드 | Medium | border 색상 변경만으로는 부족. 에러 아이콘 추가 필요 |

**권장 수정**:

```html
<!-- 좋아요: 채움(filled) vs 윤곽(outline)으로 형태 차이 -->
<button aria-label="좋아요" aria-pressed="false">
  <HeartOutline /> <!-- 비활성: 윤곽선 하트 -->
</button>
<button aria-label="좋아요 됨" aria-pressed="true">
  <HeartFilled />  <!-- 활성: 채워진 하트 -->
</button>

<!-- 에러 필드: 아이콘 + 색상 + 텍스트 -->
<div class="field-error">
  <AlertCircle aria-hidden="true" />
  <span>닉네임은 2~20자여야 합니다</span>
</div>
```

### 1.4 Color Contrast Ratios

| 조합 | Ratio | 기준 | 상태 |
|------|-------|------|------|
| Text Primary (#171717) on Background (#FAFAFA) | 17.4:1 | 4.5:1 | ✅ Pass |
| Text Secondary (#525252) on Surface (#FFFFFF) | 7.4:1 | 4.5:1 | ✅ Pass |
| Primary (#7C3AED) on White (#FFFFFF) | 5.3:1 | 4.5:1 | ✅ Pass |
| Caption (#737373) on White (#FFFFFF) | 4.6:1 | 4.5:1 | ✅ Pass (marginal) |
| Error text (#EF4444) on White (#FFFFFF) | 4.0:1 | 4.5:1 | ❌ **Fail** |
| Button Primary text (#FFFFFF) on Primary (#7C3AED) | 5.3:1 | 4.5:1 | ✅ Pass |
| Ghost button (#525252) on Surface (#FFFFFF) | 7.4:1 | 3:1 (UI) | ✅ Pass |
| Disabled text (#A3A3A3) on White (#FFFFFF) | 2.6:1 | — | N/A (disabled exempt) |
| Badge Youtube text (#DC2626) on BG (#FEE2E2) | 4.8:1 | 4.5:1 | ✅ Pass |
| Badge Community text (#2563EB) on BG (#DBEAFE) | 4.5:1 | 4.5:1 | ✅ Pass (exact) |
| Badge Folder text (#7C3AED) on BG (#EDE9FE) | 4.5:1 | 4.5:1 | ✅ Pass (exact) |
| Badge Instagram text (#DB2777) on BG (#FCE7F3) | 4.7:1 | 4.5:1 | ✅ Pass |
| Placeholder (#A3A3A3) on White (#FFFFFF) | 2.6:1 | 4.5:1 | ❌ **Fail** |
| Toast text (#FFFFFF) on Toast BG (#171717) | 17.4:1 | 4.5:1 | ✅ Pass |

**위반 사항**:

| ID | 위치 | 심각도 | 설명 |
|----|------|--------|------|
| P4-1 | Error text (#EF4444) | **Critical** | 4.0:1 — AA 미달. 에러 메시지가 안 보일 수 있음 |
| P4-2 | Placeholder text (#A3A3A3) | Medium | 2.6:1 — placeholder는 WCAG에서 예외이나, 사용성 관점에서 개선 권장 |
| P4-3 | Badge Community/Folder text | Low | 정확히 4.5:1. 여유 없음. 약간 어둡게 하면 안전 |

**권장 수정**:

| 항목 | 현재 | 권장 | 새 Ratio |
|------|------|------|----------|
| Error text | #EF4444 | #DC2626 | 5.6:1 ✅ |
| Placeholder | #A3A3A3 | #8A8A8A | 3.5:1 (개선) |
| Badge Community | #2563EB | #1D4ED8 | 5.8:1 ✅ |
| Badge Folder | #7C3AED | #6D28D9 | 5.7:1 ✅ |

### 1.5 Text Resize (200%)

| 기준 | 상태 | 세부 |
|------|------|------|
| rem/em 단위 사용 | ⚠️ Partial | Tailwind의 px 기반 수치. rem 변환 필요 |
| 텍스트 200% 확대 시 콘텐츠 손실 없음 | ⚠️ Partial | PlaceCard 제목 truncation 규칙이 있어 확대 시 잘릴 수 있음 |
| 가로 스크롤 발생 방지 | ✅ Pass | max-width 512px 컨테이너, 줄바꿈 허용 |

### 1.6 Images of Text

| 기준 | 상태 | 세부 |
|------|------|------|
| 이미지 내 텍스트 사용 | ✅ Pass | 로고 외 이미지 텍스트 없음 |

---

## 2. OPERABLE (운용 가능)

### 2.1 Keyboard Accessibility

| 기준 | 상태 | 세부 |
|------|------|------|
| 모든 기능 키보드 접근 | ⚠️ Partial | Tab/Enter/Space/Escape 패턴 정의되지 않음 |
| 키보드 트랩 없음 | ⚠️ Partial | 모달/시트 내 포커스 트랩 정의 필요 |
| Skip links | ❌ Fail | Skip navigation 링크 미정의 |

**위반 사항**:

| ID | 위치 | 심각도 | 설명 |
|----|------|--------|------|
| O1-1 | 전체 | High | 키보드 네비게이션 패턴(Tab order, Enter/Space, Escape) 미정의 |
| O1-2 | 모달/시트 | High | 포커스 트랩: 모달 열림 시 내부로만 포커스, 닫히면 트리거로 복귀 — 미정의 |
| O1-3 | 전체 | Medium | Skip to content 링크 없음 |

**권장 수정**:

```html
<!-- Skip link (body 첫 요소) -->
<a href="#main-content" class="sr-only focus:not-sr-only
  focus:absolute focus:top-2 focus:left-2 focus:z-50
  focus:px-4 focus:py-2 focus:bg-primary-600 focus:text-white
  focus:rounded-lg">
  본문으로 건너뛰기
</a>

<!-- 모달 포커스 트랩 -->
<div role="dialog" aria-modal="true" aria-labelledby="modal-title">
  <!-- tabindex trap: 첫 요소와 마지막 요소에서 순환 -->
</div>
```

**키보드 패턴 정의**:

| 컴포넌트 | Tab | Enter/Space | Escape | Arrow |
|----------|-----|------------|--------|-------|
| Button | 포커스 이동 | 클릭 실행 | — | — |
| PlaceCard | 카드 포커스 | 상세 모달 열기 | — | — |
| Tab Bar | 탭 간 이동 | 탭 활성화 | — | 좌우 탭 전환 |
| 모달 | 내부 요소 순환 | 요소별 동작 | 모달 닫기 | — |
| Bottom Sheet | 내부 요소 순환 | 요소별 동작 | 시트 닫기 | — |
| Checkbox | 포커스 이동 | 토글 | — | — |
| Dropdown | 트리거 포커스 | 메뉴 열기 | 메뉴 닫기 | 상하 항목 이동 |
| 검색 입력 | 포커스 이동 | 검색 실행 | 검색 모드 종료 | — |
| Filter Chip | 칩 간 이동 | 필터 토글 | — | 좌우 칩 이동 |

### 2.2 Focus Visible

| 기준 | 상태 | 세부 |
|------|------|------|
| Focus indicator 정의 | ✅ Pass | focus-visible: ring 2px primary-500/40, ring-offset 2px |
| Focus indicator contrast (3:1) | ⚠️ Partial | primary-500/40 = 반투명. 배경에 따라 3:1 미달 가능 |
| 모든 인터랙티브 요소에 적용 | ⚠️ Partial | 버튼에는 정의됨. 카드, 배지, 탭에는 미명시 |

**위반 사항**:

| ID | 위치 | 심각도 | 설명 |
|----|------|--------|------|
| O2-1 | Focus ring | Medium | `primary-500/40`은 반투명이라 밝은 배경에서 대비 부족 가능 |
| O2-2 | PlaceCard | Medium | 카드 자체에 focus-visible 스타일 미정의 |
| O2-3 | Source Badge | Low | 탭 가능 배지에 focus indicator 없음 |

**권장 수정**:

```css
/* Focus ring을 불투명으로 변경하여 대비 보장 */
:focus-visible {
  outline: 2px solid #7C3AED; /* 불투명 primary */
  outline-offset: 2px;
}

/* PlaceCard 포커스 */
.place-card:focus-visible {
  outline: 2px solid #7C3AED;
  outline-offset: 2px;
  border-radius: 12px;
}
```

### 2.3 Touch Targets (44×44px)

| 요소 | 실제 크기 | 상태 | 비고 |
|------|----------|------|------|
| Button SM | 32px height | ❌ **Fail** | 터치 영역 44px 미달 |
| Button MD | 36px height | ❌ **Fail** | 터치 영역 44px 미달 |
| Button LG | 44px height | ✅ Pass | |
| Button Icon | 36×36px | ❌ **Fail** | |
| Text Field | 44px height | ✅ Pass | |
| Tab Bar Item | ~56px 영역 | ✅ Pass | |
| Checkbox | 20×20px | ❌ **Fail** | 패딩 확장 필요 |
| Toggle Track | 44×24px | ⚠️ Partial | 가로는 44 이상, 세로 24px |
| Source Badge | ~20×28px | ❌ **Fail** | 개별 탭 대상이면 미달 |
| PlaceActionRow Item | 아이콘 24px | ⚠️ Partial | 패딩 포함 터치 영역 확인 필요 |

**위반 사항**:

| ID | 위치 | 심각도 | 설명 |
|----|------|--------|------|
| O3-1 | Button SM/MD/Icon | **Critical** | 32~36px 높이. WCAG 2.2의 44px 미달 |
| O3-2 | Checkbox | High | 20×20px. 패딩 확장 필수 |
| O3-3 | Source Badge | Medium | 개별 탭이면 미달. 그룹 탭으로 전환 권장 |

**권장 수정**:

```css
/* Button SM: 시각적 크기 유지, 터치 영역 확장 */
.btn-sm {
  height: 32px;            /* 시각적 높이 */
  min-height: 44px;        /* 터치 영역 */
  padding: 6px 12px;       /* 상하 패딩으로 영역 확보 */
}

/* Checkbox: 터치 영역 확장 */
.checkbox-wrapper {
  display: flex;
  align-items: center;
  min-height: 44px;
  min-width: 44px;
  padding: 12px;
}
```

### 2.4 Pointer Gestures & Single-Pointer Alternatives

| 제스처 | 대체 수단 | 상태 |
|--------|----------|------|
| Swipe down (모달 닫기) | X 버튼 / 배경 탭 | ✅ Pass |
| Pull-to-refresh | — | ❌ **Fail** |
| Long press (컨텍스트 메뉴) | 더보기(…) 버튼 | ✅ Pass |
| Swipe right (뒤로가기) | < 뒤로 버튼 | ✅ Pass |
| Image gallery swipe | < > 버튼 | ⚠️ Partial (정의 필요) |

**위반 사항**:

| ID | 위치 | 심각도 | 설명 |
|----|------|--------|------|
| O4-1 | Pull-to-refresh | Medium | 단일 포인터 대안 없음. "새로고침" 버튼 추가 필요 |
| O4-2 | Image gallery | Medium | 좌우 스와이프만. 탭으로 전환 가능한 화살표 미정의 |

### 2.5 Motion (prefers-reduced-motion)

| 기준 | 상태 | 세부 |
|------|------|------|
| Reduce Motion 대안 정의 | ✅ Pass | 07-ui-ux-patterns에서 정의 (즉시 표시, opacity만) |
| 구현 가이드 | ⚠️ Partial | CSS 미디어 쿼리 코드 예시 미제공 |

**권장 수정**:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 3. UNDERSTANDABLE (이해 가능)

### 3.1 Language

| 기준 | 상태 | 세부 |
|------|------|------|
| 페이지 언어 (`lang="ko"`) | ⚠️ Partial | HTML lang 속성 명시 미정의 |
| 부분 언어 변경 | ⚠️ Partial | 영문 브랜드명(YouTube 등)에 lang="en" 미정의 |

**권장 수정**:

```html
<html lang="ko">
  <!-- 영문 브랜드명 -->
  <span lang="en">YouTube</span> 출처 2개
</html>
```

### 3.2 Consistent Identification

| 기준 | 상태 | 세부 |
|------|------|------|
| 동일 기능 동일 명칭 | ❌ **Fail** | "콜렉션" vs "폴더" 혼용 |
| 네비게이션 일관성 | ⚠️ Partial | 홈 탭 "소스"와 하단 탭 "맛탐정" 역할 중복 |

**위반 사항**:

| ID | 위치 | 심각도 | 설명 |
|----|------|--------|------|
| U2-1 | 전체 | **Critical** | "콜렉션"과 "폴더"가 같은 기능을 가리킴. 스크린 리더 사용자에게 두 개의 다른 기능으로 인식됨 |
| U2-2 | 저장 시트 | High | "컬렉션에 저장" 시트 제목 vs "폴더 선택" 내부 라벨 불일치 |

### 3.3 Error Handling

| 기준 | 상태 | 세부 |
|------|------|------|
| 에러 식별 (위치·원인) | ⚠️ Partial | 폼 에러는 필드 아래 표시. API 에러는 Toast/Alert이나 기준 불명확 |
| 에러 제안 (수정 방법) | ⚠️ Partial | "닉네임은 2~20자" 구체적이나, 네트워크 에러는 일반적 |
| 에러 방지 (확인/되돌리기) | ⚠️ Partial | 삭제 확인 있음. 좋아요/저장에 Undo 없음 |

**위반 사항**:

| ID | 위치 | 심각도 | 설명 |
|----|------|--------|------|
| U3-1 | API 에러 | High | 저장/좋아요 낙관적 업데이트 실패 시 롤백 피드백 미정의. 사용자가 "저장됐다"고 생각하지만 실패 |
| U3-2 | 초대 코드 입력 | Medium | 만료된 코드 입력 시 에러 메시지·복구 경로 미정의 |
| U3-3 | 폴더 생성 | Medium | 필수/선택 필드 구분, 권한 옵션 설명 부족 |

### 3.4 Contextual Help

| 기준 | 상태 | 세부 |
|------|------|------|
| 인앱 도움말 | ❌ Fail | 없음 |
| 툴팁/코치 마크 | ❌ Fail | 출처 배지, 교차 검증 등 핵심 개념 설명 없음 |
| 온보딩 | ✅ Pass | 3단계 슬라이드 |

---

## 4. ROBUST (견고함)

### 4.1 Valid Markup

| 기준 | 상태 | 세부 |
|------|------|------|
| 시맨틱 HTML | ⚠️ Partial | 컴포넌트별 HTML 태그 명세 미정의 |
| ARIA 올바른 사용 | ⚠️ Partial | 일부 aria-label 정의(08-figma-specs). role 정의 불완전 |

**권장 시맨틱 구조**:

```html
<!-- PlaceCard -->
<article role="article" aria-label="을지로 골뱅이집, 한식, 을지로3가">
  <img alt="을지로 골뱅이집 - 한식" />
  <div>
    <h3>을지로 골뱅이집</h3>
    <p>한식 · 을지로3가</p>
    <div role="group" aria-label="출처 정보">
      <span>유튜브 2</span>
      <span>커뮤니티 1</span>
    </div>
  </div>
  <div role="group" aria-label="액션">
    <button aria-label="좋아요" aria-pressed="false">♡</button>
    <button aria-label="저장">⊞</button>
  </div>
</article>

<!-- Tab Bar -->
<nav aria-label="메인 네비게이션">
  <ul role="tablist">
    <li role="tab" aria-selected="true" aria-label="홈, 탭 1/4">홈</li>
    <li role="tab" aria-selected="false" aria-label="피드, 탭 2/4">피드</li>
    ...
  </ul>
</nav>

<!-- Bottom Sheet -->
<div role="dialog" aria-modal="true" aria-labelledby="sheet-title">
  <h2 id="sheet-title">컬렉션에 저장</h2>
  ...
</div>
```

### 4.2 Status Messages (ARIA Live Regions)

| 상황 | ARIA 처리 | 상태 |
|------|----------|------|
| Toast 알림 | `role="status"` `aria-live="polite"` | ❌ Fail (미정의) |
| 저장 완료 | `aria-live="polite"` | ❌ Fail |
| 에러 Alert | `role="alert"` `aria-live="assertive"` | ❌ Fail (미정의) |
| 로딩 상태 | `aria-busy="true"` | ❌ Fail |
| 검색 결과 갱신 | `aria-live="polite"` | ❌ Fail |

**위반 사항**:

| ID | 위치 | 심각도 | 설명 |
|----|------|--------|------|
| R2-1 | Toast | **Critical** | 스크린 리더가 Toast 내용을 읽지 못함. 시각장애인은 저장·에러 피드백을 전혀 인지 불가 |
| R2-2 | 검색 결과 | High | 결과 개수 변경을 스크린 리더가 알리지 않음 |

**권장 수정**:

```html
<!-- Toast (전역 live region) -->
<div
  role="status"
  aria-live="polite"
  aria-atomic="true"
  class="sr-only"
  id="toast-announcer">
  <!-- JS로 toast 메시지를 여기에 삽입 -->
</div>

<!-- Error alert -->
<div role="alert" aria-live="assertive">
  네트워크에 연결할 수 없어요
</div>

<!-- 검색 결과 갱신 -->
<div aria-live="polite">
  검색 결과 23개
</div>

<!-- 로딩 -->
<div aria-busy="true" aria-label="장소 목록 로딩 중">
  <Skeleton />
</div>
```

---

## 5. MOBILE-SPECIFIC

### 5.1 Orientation

| 기준 | 상태 | 세부 |
|------|------|------|
| 가로 모드 지원 | ⚠️ Partial | Landscape 레이아웃 정의(2열 그리드) 있으나, 잠금 여부 미정의 |
| 방향 잠금 금지 | ⚠️ Partial | 강제 Portrait 잠금 여부 미명시 |

**권장**: `<meta name="viewport">` 에서 orientation 잠금 금지. CSS로 landscape 대응.

### 5.2 Input Modalities

| 입력 방식 | 지원 | 상태 |
|-----------|------|------|
| Touch | 기본 | ✅ Pass |
| Keyboard | 외장 키보드 | ⚠️ Partial (패턴 미정의) |
| Voice | VoiceOver/TalkBack | ⚠️ Partial (ARIA 불완전) |
| Switch Control | 스위치 접근 | ❌ Fail (미고려) |

### 5.3 Thumb Zone

| 요소 | 위치 | 상태 |
|------|------|------|
| Tab Bar | 하단 | ✅ Pass (엄지 도달 용이) |
| 좋아요/저장 버튼 (PlaceCard) | 카드 우하단 | ✅ Pass |
| 검색 아이콘 | 상단 우측 | ⚠️ Partial (한 손 조작 시 멀 수 있음) |
| PlaceActionRow | 모달 중간 | ⚠️ Partial (스크롤 위치에 따라) |
| 필터 칩 | 상단 | ⚠️ Partial (한 손 조작 시 멀 수 있음) |

---

## 6. COGNITIVE ACCESSIBILITY

### 6.1 Reading Level

| 기준 | 상태 | 세부 |
|------|------|------|
| 한국어 쉬운 표현 사용 | ✅ Pass | "저장했어요", "탐색해 보세요" 등 친근한 어투 |
| 전문 용어 회피 | ⚠️ Partial | "교차 검증", "큐레이션" 등 설명 없이 사용 |
| 에러 메시지 평이한 언어 | ✅ Pass | "네트워크에 연결할 수 없어요" |

### 6.2 Consistent Navigation

| 기준 | 상태 | 세부 |
|------|------|------|
| 네비게이션 위치 일관성 | ✅ Pass | Tab Bar 항상 하단, Header 항상 상단 |
| 스크롤 시 네비 숨김 | ⚠️ Partial | Tab Bar가 스크롤 시 숨겨짐. 인지 장애 사용자에게 혼란 가능 |

**권장**: `prefers-reduced-motion`을 `prefers-reduced-data`와 함께, 숨김 동작을 비활성화하는 옵션 제공.

### 6.3 Time Limits

| 기준 | 상태 | 세부 |
|------|------|------|
| Toast 자동 닫힘 (2~3초) | ⚠️ Partial | 짧을 수 있음. 인지 장애 사용자에게 |
| 초대 코드 24시간 만료 | ✅ Pass | 충분한 시간 |
| 세션 타임아웃 | N/A | 미정의 |

**권장**: Toast 지속 시간을 5초로 연장하거나, "x 닫기" 버튼 추가. `prefers-reduced-motion` 시 자동 닫힘 비활성화.

### 6.4 Flashing Content

| 기준 | 상태 | 세부 |
|------|------|------|
| 3Hz 이상 깜빡임 없음 | ✅ Pass | skeleton pulse는 1Hz 미만 |

---

## Screen Reader Navigation Flow

### Home 화면 (VoiceOver 시나리오)

```text
1. "맛탐정, 홈" (Page title)
2. "본문으로 건너뛰기" (Skip link, 포커스 시에만)
3. "메인 네비게이션, 헤더"
   → "강남, 위치 설정 버튼"
   → "검색, 버튼"
4. "추천, 탭, 선택됨, 1/3" → "소스, 탭, 2/3" → "구독, 탭, 3/3"
5. "지금 뜨는 맛집, 제목"
6. "을지로 골뱅이집, 한식, 을지로3가, 유튜브 2개 커뮤니티 1개, 이미지"
   → "좋아요, 버튼" → "저장, 버튼"
7. (다음 카드 반복)
8. "메인 네비게이션, 탭 바"
   → "홈, 탭, 선택됨, 1/4" → "피드, 탭, 2/4" → ...
```

### PlaceDetailModal (VoiceOver 시나리오)

```text
1. "을지로 골뱅이집, 장소 상세, 대화상자"
2. "닫기, 버튼" (drag handle 대신)
3. "을지로 골뱅이집, 한식, 이미지 1/3"
   → "다음 이미지, 버튼" → "이전 이미지, 버튼"
4. "을지로 골뱅이집, 제목"
5. "한식, 을지로3가, 영업 중"
6. "서울 중구 을지로 ○○길, 주소"
7. "출처 정보"
   → "유튜브 출처 2개" → "커뮤니티 출처 1개" → "폴더 3개" → "저장 12명"
8. "좋아요, 버튼" → "저장, 버튼" → "네이버 지도에서 보기, 외부 링크" → "더보기, 버튼"
9. "메뉴, 탭, 선택됨, 1/3" → "리뷰, 탭, 2/3" → "출처, 탭, 3/3"
10. (탭별 콘텐츠)
```

### CollectionSaveSheet (VoiceOver 시나리오)

```text
1. "컬렉션에 저장, 대화상자"
2. "닫기, 버튼"
3. "폴더 검색, 텍스트 필드"
4. "최근 사용"
5. "회식 맛집 모음, 5개, 체크박스, 선택 안 됨" → (이중 탭으로 토글)
6. "데이트 코스, 12개, 체크박스, 선택됨"
7. (나머지 폴더...)
8. "새 폴더 만들기, 버튼"
9. "저장하기, 버튼"
```

---

## 위반 사항 종합 (Severity별)

### Critical (즉시 수정)

| ID | 기준 | 위치 | 내용 |
|----|------|------|------|
| P4-1 | 1.4 Contrast | Error text | #EF4444 → #DC2626 (4.0:1 → 5.6:1) |
| O3-1 | 2.5 Touch Target | Button SM/MD/Icon | min-height 44px 확보 |
| R2-1 | 4.2 Status Messages | Toast | aria-live="polite" 추가 |
| U2-1 | 3.2 Consistency | 전체 | "콜렉션"/"폴더" 용어 통일 |

### High

| ID | 기준 | 위치 | 내용 |
|----|------|------|------|
| O1-1 | 2.1 Keyboard | 전체 | 키보드 네비게이션 패턴 정의 |
| O1-2 | 2.1 Keyboard | 모달/시트 | 포커스 트랩 구현 |
| O3-2 | 2.5 Touch Target | Checkbox | 터치 영역 44px 확보 |
| R2-2 | 4.2 Status | 검색 결과 | 결과 갱신 시 aria-live |
| U3-1 | 3.3 Error | API 에러 | 낙관적 업데이트 실패 피드백 |
| P1-1 | 1.1 Alt Text | PlaceCard | 이미지 alt text 전략 수립 |

### Medium

| ID | 기준 | 위치 | 내용 |
|----|------|------|------|
| P3-1 | 1.3 Color Only | 좋아요 | filled/outline 형태 차이 강화 |
| P3-2 | 1.3 Color Only | Error field | 에러 아이콘 추가 |
| O1-3 | 2.1 Keyboard | 전체 | Skip to content 링크 |
| O2-1 | 2.2 Focus | Focus ring | 불투명 outline으로 변경 |
| O4-1 | 2.4 Gestures | Pull-to-refresh | 새로고침 버튼 대안 |
| U3-2 | 3.3 Error | 초대 코드 | 만료 에러 메시지 |

### Low

| ID | 기준 | 위치 | 내용 |
|----|------|------|------|
| P1-3 | 1.1 Alt Text | Empty state | 장식 아이콘 aria-hidden |
| P4-3 | 1.4 Contrast | Badge | Community/Folder 색상 약간 어둡게 |
| O2-3 | 2.2 Focus | Source Badge | 탭 가능 시 focus 스타일 추가 |

---

## Accessibility Statement Template

```text
맛탐정 접근성 선언

맛탐정은 모든 사용자가 서비스를 이용할 수 있도록 노력합니다.

준수 기준: WCAG 2.2 Level AA

접근성 기능:
• 스크린 리더(VoiceOver, TalkBack) 호환
• 키보드 네비게이션 지원
• 출처 배지: 색상 + 아이콘 + 텍스트로 구분 (색상 단독 의존 없음)
• 동작 축소 모드(prefers-reduced-motion) 지원
• 최소 터치 영역 44×44px 확보
• 텍스트 대비 4.5:1 이상

알려진 제한 사항:
• 다크 모드: 준비 중
• 일부 마이크로인터랙션의 동작 축소 대안: 개선 중

접근성 피드백:
접근성 관련 불편 사항은 [contact@usemap.com]으로
알려주세요. 5영업일 이내에 응답드리겠습니다.

최종 감사일: 2026-03-03
```

---

## QA Testing Checklist

### 스크린 리더 테스트

- [ ] VoiceOver (iOS) / TalkBack (Android)로 전체 플로우 완주
- [ ] 모든 인터랙티브 요소에 의미 있는 레이블 읽힘
- [ ] 이미지에 적절한 alt text 읽힘
- [ ] 모달/시트 열림 시 포커스 이동 확인
- [ ] 모달/시트 닫힘 시 트리거 요소로 포커스 복귀
- [ ] Toast 메시지가 스크린 리더에서 읽힘
- [ ] 검색 결과 갱신 시 결과 개수 알림
- [ ] 탭 전환 시 현재 탭 상태 읽힘

### 키보드 테스트

- [ ] Tab 키로 모든 인터랙티브 요소 순차 접근
- [ ] Enter/Space로 모든 버튼·링크 활성화
- [ ] Escape로 모달/시트 닫기
- [ ] Arrow 키로 탭·드롭다운 내 이동
- [ ] 포커스 트랩: 모달 내에서만 순환
- [ ] Skip link: Tab 첫 포커스 시 "본문으로 건너뛰기" 노출

### 시각 테스트

- [ ] 텍스트 200% 확대 시 콘텐츠 손실 없음
- [ ] 모든 텍스트 대비 4.5:1 이상 (Color Contrast Analyzer)
- [ ] Focus indicator 모든 인터랙티브 요소에 표시
- [ ] 색상만으로 정보 전달하는 곳 없음
- [ ] 3Hz 이상 깜빡임 없음

### 모바일 테스트

- [ ] 모든 터치 대상 44×44px 이상
- [ ] 제스처에 단일 포인터 대안 존재
- [ ] 가로 모드에서 콘텐츠 접근 가능
- [ ] prefers-reduced-motion 시 애니메이션 제거 확인

### 인지 테스트

- [ ] 에러 메시지 평이한 한국어
- [ ] 전문 용어에 설명 존재
- [ ] 시간 제한 연장 또는 제거 가능
- [ ] 용어 일관성 (콜렉션/폴더 통일)

---

## 관련 문서

- [[01-foundations|FOUNDATIONS (Color, Typography)]]
- [[02-components|COMPONENTS]]
- [[05-documentation|구현 가이드 (접근성 체크리스트)]]
- [[07-ui-ux-patterns|UI/UX 패턴 (VoiceOver, Reduce Motion)]]
- [[08-figma-specs|Figma 스펙 (ARIA, Focus Order)]]
- [[09-design-critique|디자인 크리틱]]
