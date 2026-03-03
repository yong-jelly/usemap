생성일: 2026-03-03

# 10. Design Trend Synthesis

산업: 음식점 발견·큐레이션 플랫폼 (Food Discovery & Curation)
시점: 2026년 3월 기준
대상: 맛탐정 모바일 앱 재설계

---

## 1. MACRO TREND ANALYSIS (5 trends)

### Trend 1: Liquid Glass — 투명과 깊이의 새 표준

**정의**: Apple이 WWDC 2025에서 발표한 Liquid Glass는 iOS 7 이후 13년 만의 가장 큰 디자인 언어 변경. 디지털 메타-머티리얼로서 빛을 동적으로 굴절(Lensing)시켜, 물리적 재질을 모방하는 대신 빛 자체를 소재로 활용하는 접근.

**시각적 특성**:
- 반투명 요소 — 배경 콘텐츠가 UI 뒤로 비침
- 동적 하이라이트 — 기기 움직임에 반응하는 빛 반사
- 둥근 floating forms — 기기의 둥근 곡선과 손가락 형태에 맞춤
- Edge-to-edge 콘텐츠 — 떠있는 탭 바, 투명 네비게이션

**기원**: Apple, WWDC 2025. iOS 26, iPadOS 26, macOS Tahoe 26에 동시 적용.

**채택 단계**: Growing (iOS 26 출시 직후, 서드파티 앱 적용 진행 중)

**사례**:
- **Apple Camera/Photos**: 투명 컨트롤이 사진 위에 떠있는 구조
- **Apple Safari**: Edge-to-edge 웹페이지, floating 탭 바
- **Apple Music**: 앨범 아트 색상이 Liquid Glass 요소에 반영

**맛탐정 전략적 함의**:

| 기회 | 리스크 |
|------|--------|
| 출처 배지가 음식 이미지 위에 반투명으로 떠있으면 시각적 차별화 | 현재 "backdrop-blur 금지" 규칙과 충돌. 모바일 GPU 부하 |
| 장소 상세 헤더를 이미지 위 반투명으로 처리하면 몰입감 향상 | 텍스트 가독성 저하 위험. 대비 비율 확보 어려움 |
| iOS 26 네이티브 감성과 일치 | 웹앱(Vite/React)에서 구현 난이도 높음 |

> **판단**: 선택적 채택. Header와 Tab Bar에만 제한적으로 적용 검토. 카드·배지 등 핵심 정보 영역에는 적용하지 않음. 맛탐정의 기존 "backdrop-blur 금지" 규칙은 전면 적용이 아닌 부분 해제로 조정.

---

### Trend 2: AI-Native Interface — 생성형 UI와 적응형 경험

**정의**: 2026년 모바일 앱은 AI를 부가 기능이 아닌 핵심 인터랙션 패턴으로 통합. 디자이너가 고정 화면을 만드는 대신, AI가 사용자 맥락·의도·행동에 따라 UI를 동적으로 구성하는 Intent-Driven Design이 부상.

**시각적 특성**:
- 적응형 카드 레이아웃 — 사용자 행동에 따라 카드 순서·크기 변동
- 예측형 CTA — "지금 여기 근처에서 자주 저장한 유형"을 먼저 노출
- 대화형 검색 — 자연어 검색, AI 추천 이유 설명
- Self-healing UI — 사용자 이탈 감지 시 CTA 위치 조정

**기원**: ChatGPT/Gemini의 대화형 UI 확산(2023~), Vercel의 Generative UI SDK(2024), Google Material 3 Expressive의 AI-Driven Personalization(2025)

**채택 단계**: Growing (73% 디자이너가 AI 협업을 2026년 최고 임팩트로 평가)

**사례**:
- **Spotify**: AI DJ가 음악 추천 이유를 음성으로 설명
- **Instagram**: Explore 피드가 사용자별 완전히 다른 레이아웃
- **Uber Eats**: 시간대·날씨·과거 주문 기반 메뉴 재배치

**맛탐정 전략적 함의**:

| 기회 | 리스크 |
|------|--------|
| "왜 이 맛집을 추천하는가" AI 설명 → 출처 기반 신뢰와 시너지 | AI 블랙박스가 "출처 투명성" 철학과 충돌 가능 |
| 사용자 위치·시간·저장 패턴 기반 맞춤 추천 | 데이터 부족 시(신규 유저) Cold start 문제 |
| 자연어 검색 "강남에서 유튜버가 추천한 일식" | 구현 복잡도·비용 |

> **판단**: 점진적 채택. 1차로 위치·시간 기반 정렬 개선. 2차로 "이 장소를 추천하는 이유" 출처 기반 설명 카드. AI가 추천하더라도 "왜"를 출처로 보여주는 것이 맛탐정 방식.

---

### Trend 3: Muted Minimalism + Selective Dopamine — 절제 속의 전략적 강조

**정의**: 2026년 컬러 트렌드는 두 가지가 공존. 전체적으로는 Muted Minimalism(저채도, 뉴트럴)이 지배하지만, 핵심 인터랙션 포인트에만 Dopamine Color(고채도, 비비드)를 집중하는 Selective Dopamine 접근이 부상.

**시각적 특성**:
- 배경: 화이트/오프화이트/소프트 그레이 (저자극)
- 텍스트: 진한 뉴트럴 (고대비)
- 강조: 1~2개 포인트 색상만 고채도 — CTA, 활성 상태, 알림
- 이미지: 음식 사진이 유일한 컬러 소스 (UI 자체는 절제)

**기원**: Muji의 무채색 철학(2000s) + Gen Z의 Dopamine Dressing(2022~) + Apple의 다이내믹 컬러(2024~)

**채택 단계**: Mature (대부분의 프리미엄 앱이 채택)

**사례**:
- **Arc Browser**: 거의 무채색 UI, 탭에만 비비드 컬러
- **Linear**: 다크 뉴트럴 + 보라/파랑 포인트
- **Things 3**: 화이트 + 최소한의 블루 강조

**맛탐정 전략적 함의**:

| 기회 | 리스크 |
|------|--------|
| 음식 이미지가 카드의 유일한 컬러 소스 → 음식이 더 맛있어 보임 | UI가 너무 밋밋해지면 "출처 배지"의 컬러 코딩이 약해짐 |
| Primary(보라)를 CTA에만 집중하면 전환율 향상 | 출처 배지 4색(빨/파/보/핑)이 Dopamine 포인트와 시각적으로 경쟁 |
| 현재 디자인 시스템의 surface 팔레트가 이미 이 트렌드에 부합 | — |

> **판단**: 강하게 채택. 맛탐정의 기존 방향(미니멀 배경 + 출처 배지 컬러)이 이 트렌드와 정확히 일치. 음식 이미지와 출처 배지만 컬러를 가지고, 나머지 UI는 뉴트럴로 유지. 이미 올바른 방향.

---

### Trend 4: Variable Fonts as Design Token — 타이포그래피의 체계적 진화

**정의**: 가변 폰트(Variable Fonts)가 단순한 성능 최적화를 넘어, 디자인 시스템의 핵심 토큰으로 자리잡음. Weight, Width, Optical Size 축을 토큰화하여 반응형 타이포그래피를 체계적으로 관리하는 접근.

**시각적 특성**:
- 유동적 타이포그래피 — 화면 크기에 따라 weight/size가 연속적으로 변화
- 고정 단계가 아닌 연속 스펙트럼 — "Regular vs Bold" 대신 "400~700 범위"
- 광학적 보정(Optical Size) — 작은 글자에서 자동으로 획 굵기 조정
- 킨네틱 타이포그래피 — 텍스트 자체가 애니메이션의 주체

**기원**: OpenType Variable Fonts spec(2016), Apple SF Pro Variable(2020), Google Material 3 Expressive typography(2025)

**채택 단계**: Mature (모든 주요 OS/브라우저 지원)

**사례**:
- **Apple SF Pro**: iOS 26에서 Dynamic Type과 가변 폰트 결합
- **Inter**: 오픈소스 가변 폰트의 표준, 수많은 디자인 시스템에서 채택
- **Google Material 3**: 가변 축을 디자인 토큰으로 공식 편입

**맛탐정 전략적 함의**:

| 기회 | 리스크 |
|------|--------|
| Pretendard Variable이 이미 가변 폰트. 토큰 체계와 자연스럽게 연결 | 가변 축 활용이 아직 기본 weight만 (width, optical size 미활용) |
| 동적 타입 스케일링으로 접근성(Dynamic Type) 개선 | Pretendard의 가변 축이 weight만 지원 (width 미지원) |
| 카드 제목의 truncation 대신 width 축으로 글자 폭 조절 가능 | 한글 가변 폰트의 width 축 지원이 제한적 |

> **판단**: 현상 유지 + 점진적 확장. Pretendard Variable의 weight 축 활용을 극대화. 토큰에서 weight 값을 더 세밀하게 정의(400, 450, 500...). Width/Optical Size는 한글 생태계가 성숙한 후 검토.

---

### Trend 5: Contextual Microinteractions — 맥락 인식 마이크로인터랙션

**정의**: 2026년의 마이크로인터랙션은 "예쁜 애니메이션"을 넘어, 사용자 맥락(위치, 시간, 행동 패턴)을 인식하여 피드백을 차별화하는 방향으로 진화.

**시각적 특성**:
- 맥락에 따른 차등 피드백 — 첫 저장 vs 반복 저장의 애니메이션이 다름
- 물리 기반 모션 — spring, bounce, dampening 등 자연스러운 물리 법칙
- 햅틱 연동 — 시각 피드백과 촉각 피드백이 동기화
- 비파괴적 알림 — 콘텐츠를 가리지 않는 in-context 피드백

**기원**: Material 3 Expressive의 spring animation(2025), Apple Liquid Glass의 동적 반응(2025), Lottie 애니메이션 라이브러리 성숙(2023~)

**채택 단계**: Growing

**사례**:
- **Apple Photos**: 사진 선택 시 spring 물리 기반 줌
- **Duolingo**: 맥락별 차등 축하 애니메이션 (연속 학습일 수에 따라 반응 증가)
- **Notion**: 작업 완료 시 체크마크가 콘텐츠 위에서 비파괴적으로 표시

**맛탐정 전략적 함의**:

| 기회 | 리스크 |
|------|--------|
| 좋아요·저장 시 "첫 저장"과 "재방문 저장"의 피드백 차별화 | 과도한 애니메이션은 기존 "transition 최소화" 규칙과 충돌 |
| 출처 개수가 증가할 때(교차 검증 완성) 축하 피드백 | 구현 복잡도 증가 |
| spring 물리 기반 시트·모달 제스처 | 웹앱에서 native-like spring 구현 제한 |

> **판단**: 선택적 채택. 핵심 전환 포인트(첫 저장, 첫 폴더, 구독)에만 차등 마이크로인터랙션 적용. 일반적인 탭·스크롤은 현재의 최소 transition 유지. 성능 규칙과 공존하는 "예산 내 마이크로인터랙션" 접근.

---

## 2. COMPETITIVE LANDSCAPE MAPPING

### 2×2 Matrix

```text
        Innovative
            ↑
            |
   맛탐정 ●  |  ● 캐치테이블
            |
   ● Arc   |  ● 인스타 Explore
            |
Minimal ←-----|-----→ Rich
            |
   ● Things |  ● 다이닝코드
            |
   ● 네이버  |  ● 망고플레이트
     지도    |
            |
   ● 카카오  |  ● 배달의민족
     맵     |
            ↓
        Conservative
```

| 앱 | 위치 | 포지셔닝 |
|----|------|----------|
| 맛탐정 | Innovative × Minimal | 출처 기반 발견, 별점 없음 |
| 네이버 지도 | Conservative × Minimal | 범용 지도, 별점/리뷰 |
| 카카오맵 | Conservative × Minimal | 범용 지도 + 주변 검색 |
| 다이닝코드 | Conservative × Rich | 알고리즘 별점, 정보 밀도 높음 |
| 망고플레이트 | Conservative × Rich | 리뷰 기반, 이미지 중심 |
| 캐치테이블 | Innovative × Rich | 예약 중심, 프리미엄 경험 |
| 배달의민족 | Conservative × Rich | 배달 + 리뷰, 마케팅 무거움 |
| 인스타 Explore | Innovative × Rich | 이미지/릴스 기반 발견 |
| Arc Browser | Innovative × Minimal | 미니멀 브라우징, 포인트 컬러 |
| Things 3 | Conservative × Minimal | 할 일 관리, 극단적 미니멀 |

### White Space (기회 영역)

```text
        Innovative
            ↑
            |
            |    ★ 기회 영역
            |    "Innovative + 적절한 Rich"
            |    출처 시각화가 풍부하되
            |    UI 프레임은 미니멀
Minimal ←-----|-----→ Rich
            |
            |
            |
            ↓
        Conservative
```

**기회**: "Innovative × Minimal~Medium Rich" 영역. 맛탐정은 현재 Innovative × Minimal에 있지만, 출처 시각화(교차 검증 다이어그램, 소스 타임라인 등)를 풍부하게 하면서 UI 프레임은 미니멀을 유지하는 방향으로 이동 가능.

### 과도하게 사용되어 피해야 할 패턴

| 패턴 | 사용처 | 이유 |
|------|--------|------|
| 별점/5점 스코어 | 네이버, 다이닝코드, 망고플레이트 | 맛탐정의 핵심 차별점과 정면 충돌 |
| 광고 배너 삽입 | 배달의민족, 네이버 | 신뢰감 훼손 |
| 무한 이미지 그리드 | 인스타, 망고플레이트 | 맥락 없는 이미지 나열은 맛탐정 철학 위반 |
| 복잡한 필터 패널 | 다이닝코드 | 인지 부하 과다 |
| 자동 재생 영상 | 인스타 Explore, TikTok | 모바일 데이터/성능 부담 |

---

## 3. USER EXPECTATION SHIFTS

### 3.1 Post-AI 사용자 기대 변화

| 이전 (2024) | 현재 (2026) | 맛탐정 대응 |
|-------------|-------------|-----------|
| "검색어를 정확히 입력" | "자연어로 질문" | "강남 유튜버 추천 일식" 자연어 검색 |
| "추천 알고리즘 신뢰" | "왜 추천하는지 설명 요구" | 출처 기반 추천 이유 표시 (이미 강점) |
| "앱이 다 해줄 것" | "AI + 내 판단 함께" | 출처 제공 → 사용자가 판단 (맛탐정 철학과 일치) |
| "개인화 = 무조건 좋음" | "개인화의 투명성 요구" | 추천 근거(출처)를 명시적으로 보여줌 |

### 3.2 새로운 Mental Model

**"큐레이터 경제" 인식 확산**:
- 유튜브 Shorts, TikTok, 인스타 릴스로 "누구나 콘텐츠 크리에이터"가 보편화됨.
- "누구나 큐레이터" 개념도 자연스러워짐. 맛탐정의 "공개 폴더 = 큐레이션" 모델이 시대적 흐름과 맞음.
- 단, 사용자는 "큐레이터"라는 무거운 단어보다 "내 리스트를 공유한다"는 가벼운 프레이밍을 선호.

**"신뢰의 출처" 변화**:
- Gen Z는 네이버 블로그 리뷰보다 유튜브 영상, 인스타 릴스, 커뮤니티 글을 더 신뢰.
- "검증된 인플루언서 + 익명 커뮤니티의 합의"가 새로운 신뢰 모델.
- 맛탐정의 교차 검증이 이 Mental Model에 정확히 부합.

### 3.3 사용자가 더 이상 참지 않는 것 (Zero-Tolerance Friction)

| Friction | 2024 허용도 | 2026 허용도 | 맛탐정 현황 |
|----------|-----------|-----------|-----------|
| 3초 이상 로딩 | 낮은 불만 | 이탈 | 스켈레톤으로 대응 (양호) |
| 비밀번호 로그인 | 일부 수용 | 거부 | OAuth (양호), Passkey 미지원 |
| 검색 자동완성 없음 | 수용 | 거부 | 현재 "선택"으로 표기 → 필수로 변경해야 함 |
| 다크 모드 미지원 | 이해 | 불만 | 1차 미지원 → 빠르게 지원해야 함 |
| 수동 데이터 입력 | 수용 | 거부 | 폴더명 등 최소 입력 (양호) |
| 앱 내 도움말 없음 | 수용 | 불만 | 현재 없음 → 인앱 가이드 필요 |

---

## 4. PLATFORM-SPECIFIC EVOLUTION

### 4.1 iOS 26 / Liquid Glass

| 변경 | 영향 | 맛탐정 대응 |
|------|------|-----------|
| 네비게이션 바 투명화 | 기존 불투명 헤더가 구식으로 보일 수 있음 | 헤더를 반투명 또는 스크롤 시 투명 전환으로 업데이트 |
| Floating Tab Bar | 하단 탭 바가 떠있는 형태로 변경 | 하단 탭 바에 둥근 모서리, floating 스타일 적용 검토 |
| 앱 아이콘 레이어링 | 아이콘에 glass 깊이감 | 맛탐정 앱 아이콘 리디자인 필요 |
| Dynamic Island 확장 | 활동 상태 표시 | 저장/구독 완료 시 Dynamic Island 활용 (네이티브 앱 시) |
| 둥근 곡선 강조 | 모든 요소의 radius 증가 추세 | 현재 radius 8~12px → 12~16px로 상향 검토 |

### 4.2 Material 3 Expressive (Android)

| 변경 | 영향 | 맛탐정 대응 |
|------|------|-----------|
| Emotion-driven motion | Spring physics 기반 자연스러운 모션 | 시트·모달에 spring 물리 적용 |
| 14개 신규/업데이트 컴포넌트 | 디자인 시스템 호환 | Toolbar, ButtonGroup 등 활용 검토 |
| Dynamic Color | 사용자 배경화면 기반 테마 | 음식 이미지 기반 동적 컬러 추출 (accent) |
| 대형 화면 / 폴더블 최적화 | 2열 레이아웃 필수 | 이미 태블릿 레이아웃 정의됨 (양호) |

### 4.3 Web Design Pattern Shifts

| 변경 | 영향 | 맛탐정 대응 |
|------|------|-----------|
| View Transitions API 성숙 | 페이지 전환이 앱 수준으로 매끄러워짐 | 카드→상세 전환에 shared element transition |
| Container Queries 보편화 | 컴포넌트 단위 반응형 | PlaceCard가 컨테이너 크기에 따라 Standard↔Compact 자동 전환 |
| Scroll-driven Animations | 스크롤 기반 애니메이션 네이티브 지원 | 헤더 축소, 패럴렉스 이미지 등 성능 부담 없이 가능 |
| Passkeys 표준화 | 비밀번호 없는 로그인 | OAuth + Passkey 지원 검토 |
| OKLCH 색상 공간 | CSS에서 더 넓은 색역 | 출처 배지 컬러를 P3 색역에서 더 선명하게 |

---

## 5. STRATEGIC RECOMMENDATIONS

### 5.1 채택할 트렌드 (+ 맛탐정화 방법)

| 트렌드 | 채택 수준 | 맛탐정 적용 방법 |
|--------|---------|----------------|
| Muted Minimalism + Selective Dopamine | 완전 채택 | 이미 부합. 유지. 음식 이미지와 출처 배지만 컬러 소스 |
| Variable Font as Token | 유지 + 확장 | Pretendard Variable weight 세분화, 토큰 연동 강화 |
| Contextual Microinteractions | 선택적 채택 | 첫 저장, 교차 검증 달성 시에만 차등 피드백 |
| Liquid Glass (부분) | 제한적 채택 | Header/Tab Bar에만 반투명. 핵심 콘텐츠 영역은 불투명 유지 |
| AI 추천 설명 | 점진적 채택 | "이 장소를 추천하는 이유" = 출처 요약. AI가 아닌 데이터 기반 |

### 5.2 무시할 트렌드 (+ 이유)

| 트렌드 | 이유 |
|--------|------|
| Neomorphism | 음식 앱에서 소프트 3D 요소는 음식 이미지와 시각적으로 경쟁. 가독성 저하 |
| Kinetic Typography | 맛탐정은 정보 도구. 텍스트 애니메이션은 정보 소화를 방해 |
| Brutalism | 맛탐정의 TRUST 감성과 정면 충돌. 거칠고 실험적인 미학은 부적합 |
| Generative UI (전면) | "화면이 매번 다르면" 출처의 일관된 위치(Traceable)가 깨짐. 고정된 정보 계층 유지 |
| 자동 재생 영상 | 성능 부하, 데이터 소비. 유튜브 출처는 썸네일+링크로 충분 |
| Spatial Computing / AR | 음식점 발견 맥락에서 AR은 과잉. 실내에서 앱을 볼 때 불필요 |

### 5.3 6개월 트렌드 로드맵

| 시기 | 적용 | 난이도 | 임팩트 |
|------|------|--------|--------|
| **Month 1~2** | 다크 모드 토큰 기반 구현 | Medium | High (사용자 기대) |
| **Month 1~2** | 검색 자동완성 필수화 | Medium | High (Zero-tolerance) |
| **Month 2~3** | Header/TabBar 반투명 (Liquid Glass lite) | Low | Medium (iOS 26 감성) |
| **Month 2~3** | Passkey 로그인 지원 | Medium | Medium (보안+편의) |
| **Month 3~4** | 출처 기반 추천 이유 카드 | Medium | High (AI 시대 신뢰) |
| **Month 3~4** | View Transitions API 카드→상세 | Low | Medium (체감 품질) |
| **Month 4~5** | Spring physics 기반 시트/모달 | Low | Medium (터치 감성) |
| **Month 4~5** | 첫 저장/교차 검증 달성 마이크로인터랙션 | Low | Medium (참여 유도) |
| **Month 5~6** | Container Queries 기반 카드 반응형 | Medium | Medium (코드 품질) |
| **Month 5~6** | 자연어 검색 프로토타입 | High | High (차세대 경험) |

---

## 6. MOOD BOARD SPECIFICATIONS

### 6.1 Visual References (20개)

#### Reference 1~5: 미니멀 음식 앱 UI

| # | 설명 | 분위기 |
|---|------|--------|
| 1 | **화이트 배경 위 음식 사진 카드**: 둥근 모서리(16px), 그림자 없이 1px 보더. 카드 하단에 Title + 한 줄 메타만. 여백이 넓어 음식이 돋보임 | Clean, Trustworthy, Appetizing |
| 2 | **반투명 헤더 아래 음식 이미지**: iOS 26 스타일. 상단 바가 반투명, 아래 음식 사진의 색감이 비침. 헤더 텍스트는 세미볼드 화이트 | Immersive, Modern, Premium |
| 3 | **단색 배지가 있는 미니멀 카드**: 회색 배경 위 화이트 카드. 좌하단에 작은 컬러 배지(빨강, 파랑) 2~3개. 텍스트는 검정, 메타는 surface-500 | Organized, Systematic, Calm |
| 4 | **가로형 Compact 카드 리스트**: 좌측 80×80 정방 이미지 + 우측 Title/Meta 2줄. 줄 간격이 넉넉하고 디바이더는 surface-100으로 은은함 | Efficient, Scannable, Dense-but-clean |
| 5 | **Empty state with illustration**: 중앙에 얇은 선화 일러스트(돋보기+음식), 아래 "아직 저장한 장소가 없어요", 그 아래 Primary CTA | Friendly, Guiding, Not empty |

#### Reference 6~10: 출처·신뢰 시각화

| # | 설명 | 분위기 |
|---|------|--------|
| 6 | **교차 검증 다이어그램**: 중앙에 장소 카드, 사방에서 선이 연결되며 각 소스(유튜브 빨강, 커뮤니티 파랑, 폴더 보라)가 노드로 표시. 배경 화이트, 연결선은 얇은 surface-300 | Trust-building, Data-driven, Clear |
| 7 | **출처 히스토리 타임라인**: 세로 타임라인. 각 노드에 소스 아이콘 + 날짜. "2024.03 유튜브에서 발견", "2024.05 커뮤니티에서 추천". 좌측 정렬, 미니멀 라인 | Traceable, Chronological, Archival |
| 8 | **소스 배지 클로즈업**: 3개 배지가 나란히. 유튜브(빨강 배경 #FEE2E2 + 빨강 텍스트), 커뮤니티(파랑), 폴더(보라). 각 12px 캡션, 둥근 6px 모서리 | Color-coded, Compact, Informative |
| 9 | **구독자 수가 보이는 프로필 카드**: 좌측 64px 아바타, 우측 닉네임 + "회식 맛집 모음 · 구독자 412명". 우측에 "구독" 버튼(Primary outline). 깔끔 | Social, Credible, Community |
| 10 | **네이버 지도 연결 버튼**: 장소 상세 액션 바에서 "N 네이버" 버튼. 외부 링크 아이콘(↗)이 붙어있고, surface-600 색상. 다른 액션과 동일 높이 | External, Navigation, Utility |

#### Reference 11~15: 인터랙션·모션

| # | 설명 | 분위기 |
|---|------|--------|
| 11 | **좋아요 마이크로인터랙션**: 하트가 탭 시 scale 1→1.3→1 + 빨강 채움. 작은 파티클이 0.2초간 퍼짐. 배경은 변하지 않음 | Delightful, Quick, Non-intrusive |
| 12 | **Bottom Sheet 스프링 모션**: 시트가 올라올 때 약간 오버슈트(bounce) 후 안착. 드래그 시 탄성 있는 움직임. 화이트 시트 + 상단 회색 핸들 | Responsive, Physical, Tactile |
| 13 | **스켈레톤 로딩**: 카드 형태의 회색 블록이 pulse 애니메이션. 이미지 영역(16:9 비율)과 텍스트 2줄이 동일한 surface-200 색상 | Anticipatory, Structured, Patient |
| 14 | **Toast 알림**: 화면 하단에서 slide-up. 진한 배경(#171717) + 화이트 텍스트 "폴더에 저장했어요" + 우측에 "보기" 링크(primary). 3초 후 fade out | Informative, Minimal, Actionable |
| 15 | **Pull-to-refresh**: 상단에서 당기면 회전 스피너가 나타남. Primary 색상 스피너. 당기는 정도에 비례하여 크기 증가. 놓으면 회전 시작 | Intuitive, Physical, Standard |

#### Reference 16~20: 전체 화면 구성

| # | 설명 | 분위기 |
|---|------|--------|
| 16 | **온보딩 1페이지**: 상단 60% 일러스트(음식 이미지 콜라주, 위에 출처 배지가 떠있음), 하단 40% 텍스트("출처가 명확한 맛집 발견") + 페이지 인디케이터 + CTA. Primary 그라디언트 사용 절제 | Welcoming, Clear, Value-first |
| 17 | **홈 추천 탭**: 상단 위치 칩 + 검색 아이콘. 탭 바(추천 active). 섹션 제목 "교차 검증 TOP". PlaceCard 2열 그리드. 음식 이미지가 가장 큰 요소. 배경 #FAFAFA | Discovery, Organized, Appetizing |
| 18 | **장소 상세 모달**: 상단 이미지 갤러리(전체 너비). 아래 제목+지역. 출처 하이라이트 영역(패딩 넉넉, 배지 3~4개). 액션 바. 탭. 콘텐츠. 모달 상단 핸들 바 | Detailed, Trustworthy, Complete |
| 19 | **검색 결과 + 필터 칩**: 상단 검색 바 + 필터 칩(서울, 한식, 활성 칩은 Primary fill). 아래 Compact 카드 리스트. 칩에 "2" 활성 필터 배지 | Focused, Efficient, Filtered |
| 20 | **다크 모드 PlaceCard**: 배경 #0F0F0F, 카드 #1A1A1A. 이미지는 동일. 텍스트 #FAFAFA. 출처 배지는 다크 배경에서 더 선명하게 보임. 구분선 #262626 | Sophisticated, Night-friendly, High-contrast |

### 6.2 Color Palette Extraction

Mood board에서 추출한 핵심 팔레트:

```text
━━━ Light Mode ━━━
Background:    #FAFAFA (오프화이트, 눈이 편한 저자극)
Surface:       #FFFFFF (카드, 시트, 모달)
Border:        #E5E5E5 (거의 안 보이는 구분)
Text Primary:  #171717 (거의 블랙, 고대비)
Text Muted:    #525252 (메타 정보, 보조)
Primary:       #7C3AED (CTA, 활성 상태에만 집중)

━━━ Dark Mode ━━━
Background:    #0F0F0F (순수 블랙에 가까운)
Surface:       #1A1A1A (카드, 시트)
Border:        #262626 (은은한 구분)
Text Primary:  #FAFAFA
Text Muted:    #A3A3A3
Primary:       #A78BFA (밝은 보라, 다크에서 가시성)

━━━ Accent (음식 이미지 외 유일한 컬러) ━━━
YouTube:       #DC2626 on #FEE2E2
Community:     #2563EB on #DBEAFE
Folder:        #7C3AED on #EDE9FE
Instagram:     #DB2777 on #FCE7F3
```

### 6.3 Typography Recommendations (트렌드 기반)

| 결정 | 근거 |
|------|------|
| **Pretendard Variable 유지** | 한국어 최적, 가변 폰트 트렌드 부합, 오픈소스 |
| Weight 세분화: 400, 450, 500, 600, 700 | 가변 축 활용 극대화. 450은 Body-emphasized에 사용 |
| Optical Size 축은 미사용 | 한글 가변 폰트 생태계 미성숙 |
| Body 16px 유지 | 모바일 가독성 표준. 트렌드와 무관하게 변하지 않는 값 |
| Display 32→36px 상향 검토 | Liquid Glass 시대의 대형 타이틀 트렌드. 온보딩/랜딩에서만 |

---

## 관련 문서

- [[01-foundations|FOUNDATIONS]]
- [[06-design-considerations|디자인 고민]]
- [[09-design-critique|디자인 크리틱]]
- [[../../설계/04-target-differentiation|타겟 및 차별점]]
