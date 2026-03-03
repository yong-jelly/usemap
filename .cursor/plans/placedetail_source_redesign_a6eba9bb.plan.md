---
name: PlaceDetail source redesign
overview: PlaceDetail 상세 화면의 출처 지표 영역을 재설계하고, 관련 콘텐츠/컬렉션을 카드 형태로 재구성합니다. 탭 제거/하단 바 제거 등 나머지 변경은 다음 단계로 진행합니다.
todos:
  - id: source-highlight
    content: "PlaceSourceHighlight 재설계: 모든 아이콘 항상 표시 + 세로 배치 + naverVoteCount prop 추가"
    status: completed
  - id: header-info
    content: "헤더 정보 영역: 별점/리뷰 제거, 지역 강조, naverVoteCount 전달"
    status: completed
  - id: debug-toggle
    content: 테스트 버튼을 음식점 이름 탭 토글로 숨김 (DEV only)
    status: completed
  - id: remove-appeal
    content: 매력 포인트 칩 나열 섹션 제거
    status: completed
  - id: content-section
    content: 관련 콘텐츠 섹션을 탭 밖 독립 섹션으로 이동 (있을 때만 노출, 빈 상태 UI 제거)
    status: completed
  - id: collection-cards
    content: 컬렉션(폴더) + 유튜브 채널을 가로 스크롤 썸네일 카드로 표시
    status: completed
isProject: false
---

# PlaceDetail 출처 지표 + 콘텐츠/컬렉션 재설계 (Phase 1)

## 변경 범위

이번 단계에서는 **출처 지표 영역**과 **관련 콘텐츠/컬렉션 섹션**만 집중 변경합니다. 탭 제거, 하단 바 제거, 기여 바텀시트, 리뷰 축소, 메뉴 접기 등은 Phase 2로 진행합니다.

---

## 1. PlaceSourceHighlight 재설계

파일: [src/shared/ui/place/PlaceSourceHighlight.tsx](src/shared/ui/place/PlaceSourceHighlight.tsx)

### 변경사항

- **모든 출처 아이콘 항상 표시**: 0건이라도 아이콘 + "0" 표시 (현재는 `> 0`일 때만 렌더링)
- 조건 분기 `if (!hasAnySocialSource && !hasUsers) return null` 제거 -> 항상 렌더링
- 각 아이콘 버튼의 조건부 렌더링(`{youtubeFeatures.length > 0 && ...}`) 제거 -> 무조건 렌더링
- **네이버 투표 카운트 추가**: 새로운 prop `naverVoteCount?: number` 추가, 기존 naver icon + count로 출처 행의 첫 번째 요소로 배치
- 기존 네이버 아이콘 (folder features)은 그대로 유지 (폴더 아이콘으로 변경하여 구분)

### 첨부 이미지 기준 레이아웃 (세로 아이콘 + 숫자 배치)

첨부 이미지 1번처럼 아이콘 아래에 숫자가 오는 세로 배치로 변경:

```
  [N]     (O)     (카메라)   (폴더)   (말풍선)  (사람)
 1,234     3        1        12        2      5명
```

- 각 아이콘은 세로로 아이콘 + 숫자 배치 (현재 가로 배치에서 변경)
- `flex-col items-center` 스타일로 각 아이템 구성
- 전체 행은 `flex items-center justify-center gap-6` 정도로 균등 배치

### Props 변경

```typescript
interface PlaceSourceHighlightProps {
  features: Feature[];
  naverVoteCount?: number;  // NEW: voted_keyword.userCount
  onFeatureClick?: (feature: Feature) => void;
  onNaverVoteClick?: () => void;  // NEW: 네이버 투표 클릭 시 동작
  className?: string;
}
```

## 2. 헤더 정보 영역 변경

파일: [src/features/place/ui/PlaceDetail.modal.tsx](src/features/place/ui/PlaceDetail.modal.tsx)

### 2-1. 별점/리뷰 수 제거

라인 821-828의 별점 + "리뷰 N" 텍스트 제거:

```tsx
// 제거할 부분
<div className="flex items-center gap-1.5 text-sm ...">
  <div className="flex items-center gap-0.5 font-medium text-amber-500">
    <Star className="size-4 fill-current" />
    {details?.visitor_reviews_score?.toFixed(1) || "0.0"}
  </div>
  <span>리뷰 {details?.interaction?.place_reviews_count || 0}</span>
</div>
```

### 2-2. 지역 강조

카테고리 + 지역 + 가격대를 이름 아래에 서브텍스트로 배치:

```tsx
<p className="text-sm text-surface-500">
  {details?.category || details?.group1} · {details?.common_address || `${details?.group1} ${details?.group2}`}
  {details?.avg_price > 0 && ` · ${formatWithCommas(details.avg_price)}원대`}
</p>
```

### 2-3. PlaceSourceHighlight에 naverVoteCount 전달

```tsx
<PlaceSourceHighlight 
  features={allFeatures}
  naverVoteCount={details?.voted_keyword?.userCount}
  onNaverVoteClick={() => {
    window.open(`https://map.naver.com/p/entry/place/${placeId}`, '_blank');
  }}
  className="mb-3"
  onFeatureClick={...}
/>
```

### 2-4. 매력 포인트 칩 나열 제거

라인 860-907의 전체 매력 포인트 섹션 제거 (voted_keyword가 출처 행의 [N count]로 대체됨)

### 2-5. 테스트 버튼 숨김

라인 851-858의 테스트 버튼을 음식점 이름 탭 토글로 변경:

- `showDebugTools` state 추가
- `h1` 태그에 `onClick={() => import.meta.env.DEV && setShowDebugTools(v => !v)}` 추가
- 테스트 버튼 블록을 `{import.meta.env.DEV && showDebugTools && (...)}`로 감싸기

## 3. 관련 콘텐츠 섹션 (탭 내부 -> 싱글 스크롤 섹션)

현재 탭 바 아래의 `activeDetailTab === 'content'` 내용을 탭 바 위로 이동하여 독립 섹션으로 배치합니다. (탭 자체 제거는 Phase 2)

### 3-1. 관련 콘텐츠 카드 (유튜브/커뮤니티/소셜)

출처 지표 바로 아래에, 콘텐츠가 있을 때만 노출:

```tsx
{displayFeatures.length > 0 && (
  <section className="px-4 py-3">
    <h3 className="text-[13px] font-medium text-surface-500 mb-2">관련 콘텐츠</h3>
    <div className="flex flex-col gap-2">
      {displayFeatures.map(feature => (
        <FeatureCard key={feature.id} feature={feature} ... />
      ))}
    </div>
  </section>
)}
```

- 콘텐츠 없으면 섹션 자체가 안 보임 (빈 상태 UI 제거)
- 기존 `FeatureCard` 컴포넌트 그대로 재사용

### 3-2. 컬렉션(폴더) 카드 - 가로 스크롤 썸네일

첨부 이미지 2번 스타일. `folderFeatures`를 가로 스크롤 카드로 표시:

```tsx
{folderFeatures.length > 0 && (
  <section className="py-3">
    <h3 className="text-[13px] font-medium text-surface-500 px-4 mb-2">포함된 컬렉션</h3>
    <HorizontalScroll containerClassName="flex gap-3 px-4 pb-2">
      {folderFeatures.map(folder => (
        <button key={folder.id} onClick={() => navigate(...)}>
          <div className="w-24 aspect-square rounded-xl overflow-hidden relative">
            <img src={allImages[0]} ... />
            <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded-full">
              {folder.metadata?.placeCount || 0}
            </div>
          </div>
          <p className="text-[11px] mt-1 truncate w-24">{folder.title}</p>
        </button>
      ))}
    </HorizontalScroll>
  </section>
)}
```

- 이미지: 현재 음식점의 첫 번째 이미지 (`allImages[0]`)를 모든 컬렉션 카드에 동일 사용
- 숫자 배지: `metadata.placeCount`를 이미지 좌상단에 표시
- 폴더명: 이미지 아래 텍스트

### 3-3. 유튜브 채널 컬렉션 카드

유튜브 features 중 채널 정보(`metadata.channelTitle`)가 있는 것들을 채널별로 그룹핑하여, 컬렉션과 동일한 스타일의 카드로 표시:

```tsx
// 유튜브를 채널별로 그룹핑
const youtubeChannelGroups = useMemo(() => {
  const groups: Record<string, { channel: string; features: Feature[] }> = {};
  youtubeFeatures.forEach(f => {
    const ch = f.metadata?.channelTitle || 'Unknown';
    if (!groups[ch]) groups[ch] = { channel: ch, features: [] };
    groups[ch].features.push(f);
  });
  return Object.values(groups);
}, [youtubeFeatures]);
```

컬렉션 카드 영역에 유튜브 채널 카드도 함께 가로 스크롤로 배치 (폴더 카드 옆에 이어서):

```
[폴더1] [폴더2] [YT채널1] [YT채널2]
```

- 유튜브 채널 카드: 첫 번째 이미지 + 채널명 + 영상 수 배지

## 4. 정리: 제거되는 것들

- 이름 아래 별점 + 리뷰 카운트 텍스트
- 매력 포인트 칩 나열 섹션 전체
- 테스트 버튼의 항상 표시 (DEV + 이름 탭 뒤로 숨김)
- PlaceSourceHighlight의 조건부 숨김 로직
- 관련 콘텐츠 빈 상태 UI ("관련 콘텐츠가 없어요" + CTA)

## 5. 사용되는 기존 컴포넌트

- `HorizontalScroll` ([src/shared/ui/HorizontalScroll.tsx](src/shared/ui/HorizontalScroll.tsx)) - 컬렉션 카드 가로 스크롤
- `FeatureCard` ([src/shared/ui/feature/FeatureCard.tsx](src/shared/ui/feature/FeatureCard.tsx)) - 유튜브/커뮤니티/소셜 카드
- `convertToNaverResizeImageUrl` - 이미지 최적화
- `naverIcon` asset - 네이버 투표 아이콘

