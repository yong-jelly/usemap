<script lang="ts">
  import { Button as ButtonPrimitive } from '$lib/components/ui/button';
  import { Input as InputPrimitive } from '$lib/components/ui/input';
  import type { HotelInfo } from './components/types';
  import {
    createInfoMarker,
    createPriceMarker,
    createSelectedInfoMarker,
  } from './components/marker';

  const Button = ButtonPrimitive as any;
  const Input = InputPrimitive as any;

  let mapElement: HTMLElement;
  let mapInstance: naver.maps.Map | null = $state(null);
  let searchQuery = $state('');

  let hotels = $state<HotelInfo[]>([]);
  let markers: naver.maps.Marker[] = [];
  let selectedHotelId = $state<string | null>(null);
  let currentZoom = $state(15);

  function generateRandomData(count: number): HotelInfo[] {
    const data: HotelInfo[] = [];
    const seoulCenter = { lat: 37.5665, lng: 126.978 };
    const types: Array<'Hotel' | 'Apartment'> = ['Hotel', 'Apartment'];
    const imageSamples = [
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=640&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1582719508461-905c673771fd?q=80&w=640&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?q=80&w=640&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1571896349842-33c89424de2d?q=80&w=640&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1611892440504-42a792e24d32?q=80&w=640&auto=format&fit=crop',
    ];

    for (let i = 0; i < count; i++) {
      const type = types[Math.floor(Math.random() * types.length)];
      data.push({
        id: `hotel-${i}`,
        type: type,
        name: `${type} #${i + 1}`,
        price: Math.floor(Math.random() * 200) + 50,
        rating: (Math.random() * 1.5 + 8.5).toFixed(1),
        position: {
          lat: seoulCenter.lat + (Math.random() - 0.5) * 0.1,
          lng: seoulCenter.lng + (Math.random() - 0.5) * 0.15,
        },
        imageUrl:
          i % 2 === 0 ? imageSamples[Math.floor(Math.random() * imageSamples.length)] : undefined,
        guests: Math.floor(Math.random() * 2) + 1,
        nights: Math.floor(Math.random() * 3) + 1,
      });
    }
    return data;
  }

  $effect(() => {
    const loadNaverMapsAPI = () => {
      return new Promise<void>((resolve, reject) => {
        if ((window as any).naver?.maps) {
          return resolve();
        }

        const script = document.createElement('script');
        script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=33uzipyo5o&submodules=geocoder`;
        script.async = true;
        script.onload = () => resolve();
        script.onerror = (error) => reject(error);
        document.head.appendChild(script);
      });
    };

    loadNaverMapsAPI()
      .then(() => {
        if (mapElement) {
          const naver = (window as any).naver;
          const mapOptions = {
            center: new naver.maps.LatLng(37.5665, 126.978),
            zoom: 15,
            mapDataControl: false,
            logoControl: false,
            scaleControl: false,
          };
          const newMap = new naver.maps.Map(mapElement, mapOptions);
          mapInstance = newMap;
          currentZoom = newMap.getZoom();
          hotels = generateRandomData(50);
        }
      })
      .catch((e) => {
        console.error('Failed to load Naver Maps API', e);
      });

    return () => {
      const script = document.querySelector(
        'script[src^="https://oapi.map.naver.com/openapi/v3/maps.js"]',
      );
      if (script) {
        script.remove();
      }
      mapInstance?.destroy();
      mapInstance = null;
    };
  });

  $effect(() => {
    if (!mapInstance) return;

    const naver = (window as any).naver;

    const zoomListener = naver.maps.Event.addListener(mapInstance, 'zoom_changed', () => {
      if (mapInstance) {
        currentZoom = mapInstance.getZoom();
      }
    });

    const mapClickListener = naver.maps.Event.addListener(mapInstance, 'click', () => {
      selectedHotelId = null;
    });

    return () => {
      naver.maps.Event.removeListener(zoomListener);
      naver.maps.Event.removeListener(mapClickListener);
    };
  });

  $effect(() => {
    if (!mapInstance) return;

    const naver = (window as any).naver;

    // Cleanup previous markers
    for (const marker of markers) {
      marker.setMap(null);
    }

    const newMarkers = [];

    if (currentZoom >= 12) {
      for (const hotel of hotels) {
        let content: string;
        let zIndex = 1;
        let anchor;

        if (selectedHotelId === hotel.id) {
          content = createSelectedInfoMarker(hotel);
          zIndex = 100;
          anchor = new naver.maps.Point(120, 170);
        } else if (currentZoom >= 15) {
          content = createInfoMarker(hotel);
          anchor = new naver.maps.Point(80, 70);
        } else {
          content = createPriceMarker(hotel);
          anchor = new naver.maps.Point(30, 15);
        }

        const marker = new naver.maps.Marker({
          position: new naver.maps.LatLng(hotel.position.lat, hotel.position.lng),
          map: mapInstance,
          icon: {
            content: content,
            anchor: anchor,
          },
          zIndex: zIndex,
        });

        naver.maps.Event.addListener(marker, 'click', (e: MouseEvent) => {
          e.stopPropagation(); // prevent map click event
          selectedHotelId = hotel.id;
          mapInstance?.panTo(marker.getPosition(), { duration: 300 });
        });

        newMarkers.push(marker);
      }
    }

    markers = newMarkers;
  });

  function moveToSeoul() {
    console.log('moveToSeoul clicked. mapInstance:', mapInstance);
    if (!mapInstance) return;
    const naver = (window as any).naver;
    mapInstance.setCenter(new naver.maps.LatLng(37.5665, 126.978));
    mapInstance.setZoom(15);
  }

  function addMarkerAtCenter() {
    if (!mapInstance) return;
    const naver = (window as any).naver;
    new naver.maps.Marker({
      position: mapInstance.getCenter(),
      map: mapInstance,
    });
  }

  function searchAddress() {
    if (!searchQuery || !mapInstance) return;
    const naver = (window as any).naver;
    naver.maps.Service.geocode({ query: searchQuery }, (status: any, response: any) => {
      if (status !== naver.maps.Service.Status.OK) {
        return alert('주소 검색에 실패했습니다.');
      }

      const result = response.v2;
      const items = result.addresses;

      if (items.length === 0) {
        return alert('검색 결과가 없습니다.');
      }

      const item = items[0];
      const point = new naver.maps.Point(item.x, item.y);

      mapInstance?.setCenter(point);
      new naver.maps.Marker({
        position: point,
        map: mapInstance,
      });
    });
  }
</script>

<div class="relative mt-24 h-screen w-full">
  <div bind:this={mapElement} class="h-full w-full" />
  {#if selectedHotelId}
    <div
      class="absolute top-4 left-4 z-10 flex flex-col gap-4 rounded-md bg-white/80 p-4 shadow-lg backdrop-blur-sm"
    >
      <h2 class="text-lg font-semibold">숙소 선택됨</h2>
      <Button onclick={() => (selectedHotelId = null)}>선택 해제</Button>
    </div>
  {/if}
</div>
