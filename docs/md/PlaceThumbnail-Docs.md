# PlaceThumbnail 컴포넌트

`PlaceThumbnail`은 서비스 전반에서 사용되는 장소 썸네일 표시 공통 컴포넌트입니다. 이미지 표시뿐만 아니라 폴더 포함 갯수, 좋아요/리뷰 카운트 등 다양한 메타 정보를 시각적으로 제공합니다.

## 주요 기능

- **이미지 렌더링**: 장소 이미지를 표시하며, 이미지가 없는 경우 기본 아이콘을 표시합니다.
- **폴더 배지**: 우측 상단에 해당 장소가 포함된 사용자의 폴더 갯수를 숫자로 표시합니다.
- **타이틀 언더바**: 폴더 포함 갯수에 따라 타이틀 하단에 녹색 선의 두께와 색상을 다르게 표시하여 인기도를 직관적으로 보여줍니다.
- **상호작용 카운트**: 좋아요 수와 리뷰 수를 아이콘과 함께 하단에 표시합니다.
- **반응형 및 커스텀**: 다양한 비율(`aspect-ratio`)과 모서리 곡률(`rounded`)을 지원합니다.

## Props

| Prop | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `placeId` | `string` | **Required** | 장소의 고유 ID |
| `name` | `string` | **Required** | 장소명 |
| `thumbnail` | `string` | `undefined` | 썸네일 이미지 URL |
| `group2` | `string` | `undefined` | 지역 정보 (구 단위 등) |
| `group3` | `string` | `undefined` | 상세 지역 정보 |
| `category` | `string` | `undefined` | 카테고리 정보 |
| `features` | `any[]` | `[]` | 장소의 특징 데이터 (폴더 정보 포함) |
| `interaction` | `object` | `undefined` | 좋아요 및 리뷰 카운트 데이터 |
| `onClick` | `function` | `undefined` | 클릭 이벤트 핸들러 |
| `aspectRatio` | `string` | `"aspect-[3/4]"` | 썸네일 가로세로 비율 CSS 클래스 |
| `rounded` | `boolean` | `false` | 모서리를 둥글게 처리할지 여부 |
| `showBadge` | `boolean` | `true` | 우측 상단 폴더 배지 표시 여부 |
| `showUnderline` | `boolean` | `true` | 타이틀 하단 녹색 언더바 표시 여부 |
| `showCounts` | `boolean` | `true` | 좋아요/리뷰 카운트 표시 여부 |

## 디자인 가이드

### 폴더 갯수에 따른 언더바 스타일
폴더 포함 갯수가 많을수록 더 짙고 두꺼운 녹색 선이 표시됩니다.
- 15개 이상: `#1E8449` (두께 2px)
- 12개 이상: `#229954` (두께 1.8px)
- 9개 이상: `#27AE60` (두께 1.5px)
- 6개 이상: `#2ECC71` (두께 1.2px)
- 3개 이상: `#52BE80` (두께 1px)
- 1개 이상: `#ABEBC6` (두께 0.8px)

## 사용 예시

```tsx
import { PlaceThumbnail } from "@/shared/ui/place/PlaceThumbnail";

// 리스트에서 사용 시
<PlaceThumbnail
  placeId={place.id}
  name={place.name}
  thumbnail={place.images[0]}
  features={place.features}
  interaction={place.interaction}
  onClick={(id) => handleShowDetail(id)}
/>

// 슬라이더 카드에서 사용 시 (둥근 모서리)
<PlaceThumbnail
  placeId={place.id}
  name={place.name}
  thumbnail={place.thumbnail}
  rounded
  showCounts={false} // 슬라이더에서는 별도의 영역에 카운트를 표시할 수도 있음
/>
```
