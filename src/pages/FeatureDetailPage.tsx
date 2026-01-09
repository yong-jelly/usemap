import { useEffect, useRef, useState, useMemo } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { useFeaturePlaces, useFeatureInfo } from "@/entities/place/queries";
import { usePlacePopup } from "@/shared/lib/place-popup";
import { PlaceCard } from "@/widgets/PlaceCard";
import { Button } from "@/shared/ui";
import { ChevronLeft, List, Map as MapIcon, Loader2 } from "lucide-react";
import { cn } from "@/shared/lib/utils";

const MAP_TOKEN = 'pk.eyJ1IjoibmV3c2plbGx5IiwiYSI6ImNsa3JwejZkajFkaGkzZ2xrNWc3NDc4cnoifQ.FgzDXrGJwwZ4Ab7SZKoaWw';
mapboxgl.accessToken = MAP_TOKEN;

export function FeatureDetailPage() {
  const { type, id } = useParams<{ type: string; id: string }>();
  const [searchParams] = useSearchParams();
  const domain = searchParams.get("domain");
  const navigate = useNavigate();
  const { show: showPlaceModal } = usePlacePopup();

  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  
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

  const { data: info } = useFeatureInfo({ type: type as any, id: id || "" });

  const typedInfo = info as any;

  const places = useMemo(() => {
    return data?.pages.flatMap(page => page) || [];
  }, [data]);

  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<Map<string, mapboxgl.Marker>>(new Map());

  // Initialize Map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [127.0276, 37.4979], // Gangnam
      zoom: 13,
    });

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // Update Markers when places change
  useEffect(() => {
    if (!map.current || places.length === 0) return;

    // Add new markers
    const currentPlaceIds = new Set(places.map(p => p.id));
    
    // Remove markers for places no longer in the list
    markers.current.forEach((marker, placeId) => {
      if (!currentPlaceIds.has(placeId)) {
        marker.remove();
        markers.current.delete(placeId);
      }
    });

    const bounds = new mapboxgl.LngLatBounds();

    places.forEach(place => {
      if (!place.x || !place.y) return;
      const lng = parseFloat(place.x);
      const lat = parseFloat(place.y);
      
      if (isNaN(lng) || isNaN(lat)) return;

      if (!markers.current.has(place.id)) {
        const el = document.createElement('div');
        el.className = 'custom-marker';
        el.innerHTML = `
          <div class="px-2 py-1 bg-white dark:bg-surface-900 text-surface-900 dark:text-white rounded-lg shadow-md border border-surface-200 dark:border-surface-800 font-bold text-xs whitespace-nowrap">
            ${place.name}
          </div>
        `;

        el.addEventListener('click', () => {
          showPlaceModal(place.id);
        });

        const marker = new mapboxgl.Marker(el)
          .setLngLat([lng, lat])
          .addTo(map.current!);
        
        markers.current.set(place.id, marker);
      }
      bounds.extend([lng, lat]);
    });

    if (!bounds.isEmpty() && markers.current.size > 0) {
      map.current.fitBounds(bounds, { padding: 50, maxZoom: 15 });
    }
  }, [places]);

  // Handle Resize for Mapbox
  useEffect(() => {
    if (viewMode === "map" && map.current) {
      map.current.resize();
    }
  }, [viewMode]);

  const headerTitle = useMemo(() => {
    if (!typedInfo) return id;
    if (type === 'folder') return typedInfo.name;
    if (type === 'youtube') return typedInfo.channel_title;
    if (type === 'community') return `${id}지역`;
    return id;
  }, [typedInfo, type, id]);

  return (
    <div className="flex flex-col h-dvh bg-white dark:bg-surface-950 overflow-hidden relative">
      {/* Header */}
      <div className="flex items-center gap-4 px-4 py-3 border-b border-surface-100 dark:border-surface-800 bg-white dark:bg-surface-950 z-20">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="shrink-0">
          <ChevronLeft className="size-6" />
        </Button>
        <div className="flex flex-col min-w-0">
          <h1 className="text-lg font-black truncate leading-tight">
            {headerTitle}
          </h1>
          {typedInfo && (
            <p className="text-xs text-surface-400 font-medium">
              {typedInfo.place_count || places.length}개의 장소
            </p>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 relative overflow-hidden">
        {/* Map View */}
        <div 
          ref={mapContainer} 
          className={cn(
            "absolute inset-0 transition-opacity duration-300",
            viewMode === "map" ? "opacity-100 z-10" : "opacity-0 -z-10"
          )}
        />

        {/* List View */}
        <div 
          className={cn(
            "absolute inset-0 bg-white dark:bg-surface-950 overflow-y-auto scrollbar-hide transition-opacity duration-300",
            viewMode === "list" ? "opacity-100 z-10" : "opacity-0 -z-10"
          )}
        >
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="size-8 text-surface-300 animate-spin" />
            </div>
          ) : (
            <>
              <div className="flex flex-col">
                {places.map((place) => (
                  <PlaceCard 
                    key={place.id} 
                    place={place} 
                    showPrice={true}
                  />
                ))}
              </div>
              
              {hasNextPage && (
                <div className="p-8 pb-24 flex justify-center">
                  <Button 
                    variant="outline" 
                    onClick={() => fetchNextPage()} 
                    disabled={isFetchingNextPage}
                    className="rounded-full px-8"
                  >
                    {isFetchingNextPage ? (
                      <Loader2 className="size-4 animate-spin mr-2" />
                    ) : null}
                    {isFetchingNextPage ? "로딩 중..." : "더 보기"}
                  </Button>
                </div>
              )}

              {places.length === 0 && !isLoading && (
                <div className="flex flex-col items-center justify-center h-full text-surface-400 gap-2">
                  <p>장소가 없습니다.</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* View Toggle Button */}
      {!isLoading && (
        <button
          onClick={() => setViewMode(viewMode === "list" ? "map" : "list")}
          className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-surface-900 text-white dark:bg-white dark:text-black px-6 py-3 rounded-full font-black shadow-2xl flex items-center gap-2 z-30 transition-all active:scale-95 hover:scale-105"
        >
          {viewMode === "list" ? (
            <><MapIcon className="size-5" /> 지도</>
          ) : (
            <><List className="size-5" /> 목록</>
          )}
        </button>
      )}

      <style>{`
        .custom-marker {
          cursor: pointer;
        }
        .mapboxgl-ctrl-bottom-right, .mapboxgl-ctrl-bottom-left {
          display: none;
        }
      `}</style>
    </div>
  );
}
