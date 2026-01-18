생성일: 2026-01-17
수정일: 2026-01-17

# 네이버 지도 적용 가이드

본 프로젝트에서 네이버 지도를 사용하여 장소 목록을 지도에 시각화하고 상호작용하는 방법을 설명함.

## 1. 사전 준비

### 라이브러리 설치
네이버 지도 API v3는 CDN을 통해 로드하며, TypeScript 타입을 설치함.
```bash
bun add -D @types/navermaps
```

### API 설정 (index.html)
`index.html`의 `<head>` 섹션에 API 스크립트를 추가함. **`callback` 파라미터를 사용하여 비동기 로딩 완료를 감지함.**

```html
<script>
  // 네이버 지도 API 인증 실패 감지
  window.navermap_authFailure = function() {
    console.error('[NAVER MAPS] 인증 실패! Client ID 또는 웹 서비스 URL 설정을 확인하세요.');
  };
  // 네이버 지도 API 로드 완료 콜백
  window.naverMapInit = function() {
    console.log('[NAVER MAPS] API 로드 완료');
    window.naverMapReady = true;
    window.dispatchEvent(new Event('naverMapReady'));
  };
</script>
<script type="text/javascript" src="https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=33uzipyo5o&callback=naverMapInit"></script>
```

### 주요 파라미터
- `ncpClientId`: 네이버 클라우드 플랫폼에서 발급받은 Client ID
- `callback`: API 로드 완료 후 호출될 전역 함수명

### 네이버 클라우드 플랫폼 설정
1. **Web Dynamic Map** 서비스 활성화 필수
2. **웹 서비스 URL 등록**: 포트 번호와 경로 없이 도메인만 등록
   - ✅ 올바른 예: `http://localhost`, `https://usemap2.vercel.app`
   - ❌ 잘못된 예: `http://localhost:5188`, `https://usemap2.vercel.app/folder/123`

## 2. 기본 구현 패턴 (React)

### 지도 초기화
`useRef`를 사용하여 지도가 렌더링될 DOM 엘리먼트를 지정하고, `useEffect`에서 지도를 초기화함. **API 로드 완료 이벤트를 대기해야 함.**

```tsx
const mapContainer = useRef<HTMLDivElement>(null);
const map = useRef<naver.maps.Map | null>(null);

useEffect(() => {
  if (!mapContainer.current || map.current || viewMode !== "map") return;

  const initMap = () => {
    if (!mapContainer.current || map.current) return;
    if (!window.naver?.maps) {
      console.error('[Map] naver.maps가 로드되지 않았습니다.');
      return;
    }
    
    map.current = new naver.maps.Map(mapContainer.current, {
      center: new naver.maps.LatLng(37.4979, 127.0276), // 초기 중심점 (강남역)
      zoom: 13,
    });
  };

  // 네이버 지도 API가 이미 로드되었는지 확인
  if ((window as any).naverMapReady) {
    initMap();
  } else {
    // API 로드 완료 이벤트 대기
    const handleReady = () => initMap();
    window.addEventListener('naverMapReady', handleReady);
    return () => {
      window.removeEventListener('naverMapReady', handleReady);
    };
  }

  return () => {
    map.current = null;
  };
}, [viewMode]);
```

### 지도 컨테이너 JSX
**반드시 width/height가 명시적으로 지정되어야 함.**

```tsx
<div 
  ref={mapContainer} 
  className="absolute inset-0"
  style={{ width: '100%', height: '100%' }}
/>
```

### 커스텀 마커 및 클릭 이벤트
`naver.maps.Marker`의 `icon.content` 속성을 사용하여 HTML 마커를 생성함.

```tsx
const marker = new naver.maps.Marker({
  position: new naver.maps.LatLng(lat, lng),
  map: map.current!,
  title: place.name,
  icon: {
    content: `
      <div class="point-label-marker">
        <div class="px-2 py-1 bg-white rounded-lg shadow-md border font-bold text-xs">
          ${place.name}
        </div>
      </div>
    `,
    anchor: new naver.maps.Point(0, 0),
  }
});

// 마커 클릭 이벤트
naver.maps.Event.addListener(marker, 'click', () => {
  showPlaceModal(place.id);
});
```

### 영역 자동 조정 (Fit Bounds)
모든 마커를 포함하는 영역으로 지도를 이동시킴.

```tsx
let bounds: naver.maps.LatLngBounds | null = null;
places.forEach(place => {
  const position = new naver.maps.LatLng(place.y, place.x);
  if (!bounds) {
    bounds = new naver.maps.LatLngBounds(position, position);
  } else {
    bounds.extend(position);
  }
});

if (bounds) {
  // 컨테이너 렌더링 후 fitBounds 실행
  setTimeout(() => {
    map.current.fitBounds(bounds);
  }, 100);
}
```

## 3. UI 최적화

### 지도 초기화 버튼 (Reset)
사용자가 지도를 이동하거나 줌을 변경했을 때 초기 위치로 돌아가는 기능을 제공함.

```tsx
map.current.morph(initialCenter, initialZoom);
```

### 스타일 커스터마이징
마커 클릭을 위해 커서 포인터 등을 설정함.

```css
.point-label-marker {
  cursor: pointer;
}
```

## 4. 트러블슈팅

### 흰 화면만 나오는 경우
1. **브라우저 콘솔에서 인증 오류 확인**: `window.navermap_authFailure` 콜백이 호출되는지 확인
2. **네이버 클라우드 플랫폼 설정 확인**:
   - Web Dynamic Map 서비스 활성화 여부
   - 웹 서비스 URL 등록 (포트/경로 제외)
3. **DOM 요소 크기 확인**: 지도 컨테이너의 width/height가 0이 아닌지 확인
4. **API 로드 타이밍 확인**: `naverMapReady` 이벤트 대기 로직이 있는지 확인

### 콘솔 오류: Authentication Failed
- Client ID가 올바른지 확인
- 웹 서비스 URL이 현재 접속 URL의 도메인과 일치하는지 확인 (포트/경로 제외)

## 5. 참고 사항
- **좌표 체계**: 네이버 지도는 WGS84(EPSG:4326) 좌표계를 기본으로 사용함.
- **모바일 최적화**: `h-dvh` 단위를 사용하여 모바일 브라우저 환경에 대응함.
- **API 키 종류**:
  <!-- - `ncpClientId`: 일반 NCP 키 (현재 사용 중) -->
  - `ncpKeyId`: NCP 키 (최신 문서 일부에서 언급)
  - `govClientId`: 공공기관용
  - `finClientId`: 금융기관용