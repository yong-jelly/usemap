# Mapbox 지도 적용 가이드

본 프로젝트에서 Mapbox를 사용하여 장소 목록을 지도에 시각화하고 상호작용하는 방법을 설명합니다.

## 1. 사전 준비

### 라이브러리 설치
Mapbox GL JS와 TypeScript를 위한 타입 정의를 설치해야 합니다.
```bash
bun add mapbox-gl @types/mapbox-gl
```

### Access Token 설정
Mapbox를 사용하기 위해서는 발급받은 Access Token이 필요합니다.
```typescript
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

mapboxgl.accessToken = 'pk.eyJ1IjoibmV3c2plbGx5IiwiYSI6ImNsa3JwejZkajFkaGkzZ2xrNWc3NDc4cnoifQ.FgzDXrGJwwZ4Ab7SZKoaWw';
```

## 2. 기본 구현 패턴 (React)

### 지도 초기화
`useRef`를 사용하여 지도가 렌더링될 DOM 엘리먼트를 지정하고, `useEffect`에서 지도를 초기화합니다.

```tsx
const mapContainer = useRef<HTMLDivElement>(null);
const map = useRef<mapboxgl.Map | null>(null);

useEffect(() => {
  if (!mapContainer.current || map.current) return;

  map.current = new mapboxgl.Map({
    container: mapContainer.current,
    style: "mapbox://styles/mapbox/streets-v12", // 컬러 스타일
    center: [127.0276, 37.4979], // 초기 중심점 (강남역)
    zoom: 13,
  });

  return () => {
    map.current?.remove();
    map.current = null;
  };
}, []);
```

### 커스텀 마커 및 클릭 이벤트
HTML 엘리먼트를 직접 생성하여 Mapbox 마커로 사용할 수 있습니다.

```tsx
places.forEach(place => {
  const el = document.createElement('div');
  el.className = 'custom-marker';
  el.innerHTML = `
    <div class="px-2 py-1 bg-white dark:bg-surface-900 text-surface-900 dark:text-white rounded-lg shadow-md border border-surface-200 dark:border-surface-800 font-bold text-xs whitespace-nowrap">
      ${place.name}
    </div>
  `;

  // 마커 클릭 시 상세 모달 열기
  el.addEventListener('click', () => {
    showPlaceModal(place.id);
  });

  new mapboxgl.Marker(el)
    .setLngLat([parseFloat(place.x), parseFloat(place.y)])
    .addTo(map.current!);
});
```

### 모든 마커가 보이도록 줌 조절 (Fit Bounds)
데이터가 로드되었을 때 모든 마커를 포함하는 영역으로 지도를 이동시킵니다.

```tsx
const bounds = new mapboxgl.LngLatBounds();
places.forEach(place => {
  bounds.extend([parseFloat(place.x), parseFloat(place.y)]);
});

if (!bounds.isEmpty()) {
  map.current.fitBounds(bounds, { padding: 50, maxZoom: 15 });
}
```

## 3. 고급 활용

### 리스트/지도 뷰 전환 시 처리
전환 애니메이션 등으로 인해 지도의 크기가 변할 경우 `resize()`를 호출해야 깨짐 현상이 없습니다.

```tsx
useEffect(() => {
  if (viewMode === "map" && map.current) {
    map.current.resize();
  }
}, [viewMode]);
```

### UI 커스터마이징 (CSS)
기본적인 Mapbox 컨트롤러(로고, 어트리뷰션 등)를 숨기거나 위치를 조정할 때 사용합니다.

```css
/* 마우스 커서 포인터 설정 */
.custom-marker {
  cursor: pointer;
}

/* 하단 Mapbox 기본 컨트롤 숨기기 (필요 시) */
.mapboxgl-ctrl-bottom-right, 
.mapboxgl-ctrl-bottom-left {
  display: none;
}
```

## 4. 모바일 최적화 팁
- **전체 화면 사용**: 모바일에서는 `h-dvh` (Dynamic Viewport Height)를 사용하여 주소창 변화에 대응하는 것이 좋습니다.
- **하단 메뉴바 처리**: 지도 탐색의 몰입감을 위해 상세 페이지 진입 시에는 하단 네비게이션을 숨기는 패턴을 권장합니다.
