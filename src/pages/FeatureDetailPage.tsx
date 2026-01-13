import { useEffect, useRef, useState, useMemo } from "react";
import { useParams, useSearchParams, useNavigate, useLocation } from "react-router";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { useFeaturePlaces, useFeatureInfo, useFeaturePlacesForMap } from "@/entities/place/queries";
import { useMySubscriptions, useToggleFeatureSubscription } from "@/entities/folder/queries";
import { usePlacePopup } from "@/shared/lib/place-popup";
import { PlaceCard } from "@/widgets/PlaceCard";
import { List, Map as MapIcon, Loader2, RotateCcw, ExternalLink } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { DetailHeader } from "@/widgets/DetailHeader/DetailHeader";
import naverIcon from "@/assets/images/naver-map-logo.png";

const MAP_TOKEN = 'pk.eyJ1IjoibmV3c2plbGx5IiwiYSI6ImNsa3JwejZkajFkaGkzZ2xrNWc3NDc4cnoifQ.FgzDXrGJwwZ4Ab7SZKoaWw';
mapboxgl.accessToken = MAP_TOKEN;

export function FeatureDetailPage() {
  const { type, id } = useParams<{ type: string; id: string }>();
  const [searchParams] = useSearchParams();
  const domain = searchParams.get("domain");
  const navigate = useNavigate();
  const location = useLocation();
  const { show: showPlaceModal } = usePlacePopup();

  const handleBack = () => {
    if (location.key === "default") {
      navigate("/feed", { replace: true });
    } else {
      navigate(-1);
    }
  };

  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [mapDataRequested, setMapDataRequested] = useState(false);
  const [showResetButton, setShowResetButton] = useState(false);
  const initialZoom = useRef<number | null>(null);
  const initialCenter = useRef<[number, number] | null>(null);
  
  const { 
    data, 
    fetchNextPage, 
    hasNextPage, 
    isFetchingNextPage, 
    isLoading 
  } = useFeaturePlaces({ 
    type: type as any, 
    id: id || "", 
    domain 
  });

  const observerTarget = useRef<HTMLDivElement>(null);

  // 페이지 마운트 시 window 스크롤 초기화
  useEffect(() => {
    if (viewMode === 'list') {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    }
  }, []);

  // 뷰 모드 변경 시 스크롤 초기화
  useEffect(() => {
    if (viewMode === 'list') {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    }
  }, [viewMode]);

  useEffect(() => {
    if (!hasNextPage || isFetchingNextPage || viewMode !== 'list') return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          fetchNextPage();
        }
      },
      { 
        threshold: 0,
        rootMargin: '200px' 
      }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, viewMode]);

  const { data: info } = useFeatureInfo({ type: type as any, id: id || "" });
  
  // URL type을 subscription_type으로 변환
  const subscriptionType = useMemo(() => {
    if (type === 'folder') return 'naver_folder';
    if (type === 'youtube') return 'youtube_channel';
    if (type === 'community') return 'community_region';
    return type;
  }, [type]);
  
  // 구독 정보 조회
  const { data: subscriptions } = useMySubscriptions();
  const { 
    mutate: toggleSubscription, 
    isPending: isTogglePending, 
    variables: toggledFeature 
  } = useToggleFeatureSubscription();

  const isSubscribed = useMemo(() => {
    if (!subscriptions || !subscriptionType || !id) return false;
    return subscriptions.some(sub => 
      sub.subscription_type === subscriptionType && sub.feature_id === id && sub.is_subscribed !== false
    );
  }, [subscriptions, subscriptionType, id]);

  // 낙관적 업데이트를 위한 UI 상태 계산
  const isCurrentlyToggling = isTogglePending && toggledFeature?.type === subscriptionType && toggledFeature?.id === id;
  const displaySubscribed = isCurrentlyToggling ? !isSubscribed : isSubscribed;

  const handleToggleSubscription = () => {
    if (!subscriptionType || !id) return;
    toggleSubscription({ type: subscriptionType, id });
  };
  
  // 지도용 전체 데이터 조회 (지도 버튼 클릭 시에만 활성화)
  const { data: featureMapPlaces, isLoading: isMapLoading } = useFeaturePlacesForMap({
    type: type as any, 
    id: id || "",
    domain,
    enabled: mapDataRequested
  });

  const typedInfo = info as any;

  const places = useMemo(() => {
    return data?.pages.flatMap(page => page) || [];
  }, [data]);
  
  // 지도에 표시할 장소: 지도 데이터가 있으면 사용, 아니면 기존 places 사용
  const mapPlaces = useMemo(() => {
    if (featureMapPlaces && featureMapPlaces.length > 0) {
      return featureMapPlaces.map(p => ({
        id: p.place_id,
        name: p.name,
        x: p.x,
        y: p.y
      }));
    }
    return places;
  }, [featureMapPlaces, places]);

  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const clusterLabelMarkers = useRef<mapboxgl.Marker[]>([]);
  const pointLabelMarkers = useRef<mapboxgl.Marker[]>([]);
  const sourceId = 'places-source';
  const clusterLayerId = 'places-clusters';
  const unclusteredPointLayerId = 'places-unclustered-point';

  // Initialize Map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [127.0276, 37.4979], // Gangnam, Korea
      zoom: 13,
    });
    
    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // Update Map with Clustering when mapPlaces change
  useEffect(() => {
    if (!map.current || viewMode !== "map" || mapPlaces.length === 0) return;

    const features: GeoJSON.Feature<GeoJSON.Point>[] = mapPlaces
      .filter(place => {
        if (!place.x || !place.y) return false;
        const lng = parseFloat(place.x);
        const lat = parseFloat(place.y);
        return !isNaN(lng) && !isNaN(lat);
      })
      .map(place => {
        const lng = parseFloat(place.x!);
        const lat = parseFloat(place.y!);
        
        return {
          type: 'Feature' as const,
          properties: {
            id: place.id,
            name: place.name,
          },
          geometry: {
            type: 'Point' as const,
            coordinates: [lng, lat] as [number, number],
          },
        } as GeoJSON.Feature<GeoJSON.Point>;
      });
    
    const geojson: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features,
    };

    if (map.current.getSource(sourceId)) {
      map.current.removeLayer(clusterLayerId);
      map.current.removeLayer(unclusteredPointLayerId);
      map.current.removeSource(sourceId);
    }

    map.current.addSource(sourceId, {
      type: 'geojson',
      data: geojson,
      cluster: true,
      clusterMaxZoom: 20,
      clusterRadius: 50,
    });

    map.current.addLayer({
      id: clusterLayerId,
      type: 'circle',
      source: sourceId,
      filter: ['has', 'point_count'],
      paint: {
        'circle-opacity': 0,
        'circle-radius': 0,
      },
    });

    map.current.addLayer({
      id: unclusteredPointLayerId,
      type: 'circle',
      source: sourceId,
      filter: ['!', ['has', 'point_count']],
      paint: {
        'circle-opacity': 0,
        'circle-radius': 0,
      },
    });

    const updateLabels = () => {
      if (!map.current || !map.current.getSource(sourceId)) return;
      
      clusterLabelMarkers.current.forEach(m => m.remove());
      clusterLabelMarkers.current = [];
      pointLabelMarkers.current.forEach(m => m.remove());
      pointLabelMarkers.current = [];
      
      const clusterFeatures = map.current.queryRenderedFeatures({
        layers: [clusterLayerId],
      });

      clusterFeatures.forEach((feature) => {
        if (!feature.properties?.cluster_id) return;
        
        const coordinates = (feature.geometry as GeoJSON.Point).coordinates as [number, number];
        const pointCount = feature.properties.point_count as number;
        const clusterId = feature.properties.cluster_id;
        
        (map.current!.getSource(sourceId) as mapboxgl.GeoJSONSource).getClusterLeaves(
          clusterId,
          pointCount,
          0,
          (err, leaves) => {
            if (err || !leaves || leaves.length === 0) return;
            
            if (pointCount >= 3) {
              const placeName = leaves[0].properties?.name || '장소';
              
              const el = document.createElement('div');
              el.className = 'cluster-label-marker';
              el.innerHTML = `
                <div class="px-2 py-1 bg-white dark:bg-surface-900 text-surface-900 dark:text-white rounded-lg shadow-md border border-surface-200 dark:border-surface-800 font-bold text-xs whitespace-nowrap flex items-center gap-1 cursor-pointer hover:shadow-lg transition-shadow">
                  <span>${placeName}</span>
                  <span class="text-primary-500">+${pointCount - 1}</span>
                </div>
              `;
              
              el.addEventListener('click', (e) => {
                e.stopPropagation();
                map.current!.easeTo({
                  center: coordinates,
                  zoom: map.current!.getZoom() + 2,
                });
              });
              
              const marker = new mapboxgl.Marker(el)
                .setLngLat(coordinates)
                .setOffset([0, 0])
                .addTo(map.current!);
              
              clusterLabelMarkers.current.push(marker);
            } else {
              leaves.forEach((leaf) => {
                const leafCoords = (leaf.geometry as GeoJSON.Point).coordinates as [number, number];
                const placeName = leaf.properties?.name || '장소';
                const placeId = leaf.properties?.id;
                
                const el = document.createElement('div');
                el.className = 'point-label-marker';
                el.innerHTML = `
                  <div class="px-2 py-1 bg-white dark:bg-surface-900 text-surface-900 dark:text-white rounded-lg shadow-md border border-surface-200 dark:border-surface-800 font-bold text-xs whitespace-nowrap cursor-pointer hover:shadow-lg transition-shadow">
                    ${placeName}
                  </div>
                `;
                
                el.addEventListener('click', (e) => {
                  e.stopPropagation();
                  if (placeId) showPlaceModal(placeId);
                });
                
                const marker = new mapboxgl.Marker(el)
                  .setLngLat(leafCoords)
                  .setOffset([0, 0])
                  .addTo(map.current!);
                
                pointLabelMarkers.current.push(marker);
              });
            }
          }
        );
      });

      const pointFeatures = map.current.queryRenderedFeatures({
        layers: [unclusteredPointLayerId],
      });

      pointFeatures.forEach((feature) => {
        const coordinates = (feature.geometry as GeoJSON.Point).coordinates as [number, number];
        const placeName = feature.properties?.name || '장소';
        const placeId = feature.properties?.id;
        
        const el = document.createElement('div');
        el.className = 'point-label-marker';
        el.innerHTML = `
          <div class="px-2 py-1 bg-white dark:bg-surface-900 text-surface-900 dark:text-white rounded-lg shadow-md border border-surface-200 dark:border-surface-800 font-bold text-xs whitespace-nowrap cursor-pointer hover:shadow-lg transition-shadow">
            ${placeName}
          </div>
        `;
        
        el.addEventListener('click', (e) => {
          e.stopPropagation();
          if (placeId) showPlaceModal(placeId);
        });
        
        const marker = new mapboxgl.Marker(el)
          .setLngLat(coordinates)
          .setOffset([0, 0])
          .addTo(map.current!);
        
        pointLabelMarkers.current.push(marker);
      });
    };

    map.current.on('moveend', updateLabels);
    map.current.on('zoomend', updateLabels);
    
    const handleZoomChange = () => {
      if (!map.current || initialZoom.current === null) return;
      const currentZoom = map.current.getZoom();
      const isZoomChanged = Math.abs(currentZoom - initialZoom.current) > 0.1;
      setShowResetButton(isZoomChanged);
    };
    
    map.current.on('zoomend', handleZoomChange);
    map.current.on('moveend', handleZoomChange);
    
    setTimeout(updateLabels, 100);

    const mapBounds = new mapboxgl.LngLatBounds();
    geojson.features.forEach(feature => {
      if (feature.geometry.type === 'Point') {
        mapBounds.extend(feature.geometry.coordinates as [number, number]);
      }
    });

    if (!mapBounds.isEmpty()) {
      map.current.fitBounds(mapBounds, { padding: 50, maxZoom: 15 });
      map.current.once('idle', () => {
        if (map.current && initialZoom.current === null) {
          initialZoom.current = map.current.getZoom();
          const center = map.current.getCenter();
          initialCenter.current = [center.lng, center.lat];
        }
      });
    }

    return () => {
      if (map.current) {
        map.current.off('moveend', updateLabels);
        map.current.off('zoomend', updateLabels);
        map.current.off('zoomend', handleZoomChange);
        map.current.off('moveend', handleZoomChange);
      }
      clusterLabelMarkers.current.forEach(m => m.remove());
      pointLabelMarkers.current.forEach(m => m.remove());
      if (map.current?.getSource(sourceId)) {
        map.current.removeLayer(clusterLayerId);
        map.current.removeLayer(unclusteredPointLayerId);
        map.current.removeSource(sourceId);
      }
    };
  }, [mapPlaces, viewMode, showPlaceModal]);

  useEffect(() => {
    if (viewMode === "map" && map.current) {
      map.current.resize();
      if (mapDataRequested) {
        initialZoom.current = null;
        initialCenter.current = null;
        setShowResetButton(false);
      }
    }
  }, [viewMode, mapDataRequested]);

  const headerTitle = useMemo(() => {
    if (!typedInfo) return id || "";
    if (type === 'folder') return typedInfo.name;
    if (type === 'youtube') return typedInfo.channel_title;
    if (type === 'community') return `${id}지역`;
    return id || "";
  }, [typedInfo, type, id]);

  const headerSubtitle = useMemo(() => {
    if (type === 'youtube' || type === 'folder') return `${typedInfo?.place_count || places.length}개의 매장`;
    if (type === 'community') return "커뮤니티";
    return "";
  }, [type, typedInfo, places.length]);

  const thumbnailUrl = useMemo(() => {
    if (type === 'youtube' && typedInfo?.channel_thumbnail) return typedInfo.channel_thumbnail;
    if (type === 'naver') return naverIcon;
    return undefined;
  }, [type, typedInfo]);

  return (
    <div className={cn(
      "flex flex-col bg-white dark:bg-surface-950 relative",
      viewMode === "map" ? "h-dvh overflow-hidden" : "min-h-dvh"
    )}>
      {/* Header */}
      <div className="fixed top-0 inset-x-0 z-40 bg-white dark:bg-surface-950">
        <div className="max-w-lg mx-auto">
          <DetailHeader
            type="feature"
            subType={type as any}
            title={headerTitle}
            subtitle={headerSubtitle}
            thumbnailUrl={thumbnailUrl}
            isSubscribed={displaySubscribed}
            isSubscribing={isCurrentlyToggling}
            onSubscribe={handleToggleSubscription}
            onBack={handleBack}
          />
        </div>
      </div>

      {/* Main Content */}
      <div className={cn(
        "relative flex-1",
        viewMode === "map" ? "overflow-hidden" : "w-full",
        "pt-16"
      )}>
        {/* Map View */}
        <div 
          ref={mapContainer} 
          className={cn(
            "absolute inset-0 transition-opacity duration-300",
            viewMode === "map" ? "opacity-100 z-10" : "opacity-0 -z-10 pointer-events-none"
          )}
        />
        
        {viewMode === "map" && isMapLoading && (
          <div className="absolute inset-0 z-20 bg-white/80 dark:bg-surface-900/80 flex items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="size-8 text-primary-500 animate-spin" />
              <span className="text-sm text-surface-500 font-medium">전체 장소 불러오는 중...</span>
            </div>
          </div>
        )}

        {/* List View */}
        <div 
          className={cn(
            "bg-white dark:bg-surface-950 transition-opacity duration-300",
            viewMode === "list" ? "opacity-100 relative z-10" : "opacity-0 absolute inset-0 -z-10 pointer-events-none hidden"
          )}
        >
          {isLoading ? (
            <div className="flex items-center justify-center py-40">
              <Loader2 className="size-8 text-surface-300 animate-spin" />
            </div>
          ) : (
            <>
              {/* Feature Info Summary */}
              <div className="px-5 py-6 flex flex-col gap-4 bg-white dark:bg-surface-950">
                <div className="flex items-center justify-between gap-4 py-2">
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs text-surface-400 font-bold uppercase tracking-wider">매장</span>
                      <span className="text-lg font-black text-surface-900 dark:text-white">
                        {typedInfo?.place_count || places.length}
                      </span>
                    </div>
                    <div className="w-px h-8 bg-surface-100 dark:border-surface-800" />
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs text-surface-400 font-bold uppercase tracking-wider">구독</span>
                      <span className="text-lg font-black text-surface-900 dark:text-white">
                        {typedInfo?.subscriber_count || 0}
                      </span>
                    </div>
                  </div>
                  {type === 'folder' && typedInfo?.share_id && (
                    <button
                      onClick={() => {
                        const naverMapUrl = `https://map.naver.com/p/favorite/myPlace/folder/${typedInfo.share_id}?c=6.00,0,0,0,dh`;
                        window.open(naverMapUrl, '_blank', 'noopener,noreferrer');
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-50 dark:bg-surface-800 text-surface-700 dark:text-surface-300 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors"
                      title="네이버 지도에서 보기"
                    >
                      <ExternalLink className="size-4" />
                      <span className="text-xs font-bold">네이버 지도</span>
                    </button>
                  )}
                  {type === 'youtube' && id && (
                    <button
                      onClick={() => {
                        const youtubeUrl = `https://www.youtube.com/channel/${id}`;
                        window.open(youtubeUrl, '_blank', 'noopener,noreferrer');
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-50 dark:bg-surface-800 text-surface-700 dark:text-surface-300 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors"
                      title="YouTube 채널에서 보기"
                    >
                      <ExternalLink className="size-4" />
                      <span className="text-xs font-bold">채널 바로가기</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="flex flex-col">
                {places.map((item: any) => (
                  <PlaceCard 
                    key={item.place_id} 
                    place={item.place_data} 
                    showPrice={true}
                    addedAt={item.published_at ? item.published_at : undefined}
                  />
                ))}
              </div>
              
              {hasNextPage && (
                <div ref={observerTarget} className="p-8 pb-24 flex justify-center">
                  <Loader2 className="size-6 text-surface-300 animate-spin" />
                </div>
              )}

              {places.length === 0 && !isLoading && (
                <div className="flex flex-col items-center justify-center py-40 text-surface-400 gap-2">
                  <p>장소가 없습니다.</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* View Toggle Button & Reset Button */}
      {!isLoading && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-2 z-30">
          <button
            onClick={() => {
              if (viewMode === "list") {
                setMapDataRequested(true);
                setViewMode("map");
              } else {
                setViewMode("list");
              }
            }}
            className="bg-surface-900 text-white dark:bg-white dark:text-black px-6 py-3 rounded-full font-black shadow-2xl flex items-center gap-2 transition-all active:scale-95 hover:scale-105 whitespace-nowrap min-w-[100px]"
          >
            {viewMode === "list" ? (
              <><MapIcon className="size-5" /> 지도</>
            ) : (
              <><List className="size-5" /> 목록</>
            )}
          </button>
          
          {viewMode === "map" && showResetButton && initialZoom.current !== null && initialCenter.current !== null && (
            <button
              onClick={() => {
                if (map.current && initialZoom.current !== null && initialCenter.current !== null) {
                  map.current.easeTo({
                    center: initialCenter.current,
                    zoom: initialZoom.current,
                  });
                  setShowResetButton(false);
                }
              }}
              className="bg-primary-500 text-white px-4 py-3 rounded-full font-black shadow-2xl flex items-center gap-2 transition-all active:scale-95 hover:scale-105 whitespace-nowrap min-w-[100px]"
            >
              <RotateCcw className="size-4" />
              <span>초기화</span>
            </button>
          )}
        </div>
      )}

      <style>{`
        .cluster-label-marker,
        .point-label-marker {
          cursor: pointer;
        }
        .mapboxgl-ctrl-bottom-right, .mapboxgl-ctrl-bottom-left {
          display: none;
        }
        .mapboxgl-marker {
          z-index: 1;
        }
      `}</style>
    </div>
  );
}
