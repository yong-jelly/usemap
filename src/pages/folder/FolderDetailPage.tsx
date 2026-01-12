import { useState, useRef, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { 
  useFolderPlaces, 
  useAddPlaceToFolder, 
  useFolderInfo, 
  useFolderAccess, 
  useRegenerateInviteCode,
  useInviteHistory,
  useHideFolder,
  useFolderPlacesForMap,
  useVerifyInviteCode,
  useToggleFolderSubscription,
  useMySubscriptions,
  useRemovePlaceFromFolder
} from "@/entities/folder/queries";

const MAP_TOKEN = 'pk.eyJ1IjoibmV3c2plbGx5IiwiYSI6ImNsa3JwejZkajFkaGkzZ2xrNWc3NDc4cnoifQ.FgzDXrGJwwZ4Ab7SZKoaWw';
mapboxgl.accessToken = MAP_TOKEN;
import { Button, Input } from "@/shared/ui";
import { 
  Plus, 
  Loader2, 
  Map as MapIcon, 
  Users, 
  User, 
  Info, 
  Key, 
  Copy, 
  RefreshCw, 
  Clock, 
  History, 
  EyeOff, 
  X, 
  CheckCircle, 
  AlertCircle, 
  List, 
  RotateCcw 
} from "lucide-react";
import { PlaceSearchModal } from "@/features/folder/ui/PlaceSearch.modal";
import { PlaceCommentForm } from "@/features/folder/ui/PlaceCommentForm";
import { FolderReviewSection } from "@/features/folder/ui/FolderReviewSection";
import { PlaceCard } from "@/widgets/PlaceCard";
import { usePlacePopup } from "@/shared/lib/place-popup";
import { cn, formatKoreanDate } from "@/shared/lib/utils";
import { ago } from "@/shared/lib/date";
import { useUserStore } from "@/entities/user";
import { useAuthModalStore } from "@/features/auth/model/useAuthModalStore";
import type { InviteHistory as InviteHistoryType } from "@/entities/folder/types";
import { DetailHeader } from "@/widgets/DetailHeader/DetailHeader";
import { FolderSettingsSheet } from "@/features/folder/ui/FolderSettingsSheet";

// ... (FolderInviteAdminSection, InviteCodeInput, InviteHistoryModal code remains same)

// 초대 코드 입력 UI
function InviteCodeInput({ 
  folderId, 
  onSuccess 
}: { 
  folderId: string; 
  onSuccess: () => void;
}) {
  const [code, setCode] = useState("");
  const { mutate: verifyCode, isPending } = useVerifyInviteCode();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 5) return;

    verifyCode({ folderId, inviteCode: code }, {
      onSuccess: (result) => {
        if (result.success) {
          onSuccess();
        } else {
          const errorMessages: Record<string, string> = {
            'LOGIN_REQUIRED': '로그인이 필요합니다.',
            'FOLDER_NOT_FOUND': '폴더를 찾을 수 없습니다.',
            'INVALID_CODE': '초대 코드가 올바르지 않습니다.',
            'CODE_EXPIRED': '초대 코드가 만료되었습니다.',
          };
          setErrorMsg(errorMessages[result.error || ''] || '알 수 없는 오류가 발생했습니다.');
        }
      },
      onError: () => {
        setErrorMsg('오류가 발생했습니다. 다시 시도해주세요.');
      }
    });
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center">
      <div className="p-6 rounded-full bg-primary-100 dark:bg-primary-900/20 mb-6">
        <Key className="size-12 text-primary-500" />
      </div>
      <h2 className="text-2xl font-bold mb-2">초대 코드 입력</h2>
      <p className="text-surface-500 mb-8">이 폴더에 접근하려면 초대 코드가 필요합니다.</p>
      
      <form onSubmit={handleSubmit} className="w-full max-w-xs flex flex-col gap-4">
        <Input
          value={code}
          onChange={(e) => {
            setCode(e.target.value.toUpperCase().slice(0, 5));
            setErrorMsg(null);
          }}
          placeholder="5자리 코드 입력"
          maxLength={5}
          className="text-center text-2xl font-mono tracking-[0.5em] uppercase"
        />
        {errorMsg && (
          <p className="text-red-500 text-sm font-medium">{errorMsg}</p>
        )}
        <Button type="submit" disabled={code.length !== 5 || isPending} className="font-bold">
          {isPending ? <Loader2 className="animate-spin" /> : "입장하기"}
        </Button>
      </form>
    </div>
  );
}

// 초대 히스토리 모달
function InviteHistoryModal({ 
  folderId, 
  onClose 
}: { 
  folderId: string; 
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const { data: history, isLoading } = useInviteHistory(folderId);
  const { mutate: regenerate, isPending } = useRegenerateInviteCode();
  const { data: folderInfo } = useFolderInfo(folderId);

  const handleRegenerate = () => {
    if (window.confirm('새로운 초대 코드를 생성하시겠습니까? 기존 코드는 즉시 만료됩니다.')) {
      regenerate(folderId);
    }
  };

  const copyCode = () => {
    if (folderInfo?.invite_code) {
      navigator.clipboard.writeText(folderInfo.invite_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const isExpired = folderInfo?.invite_code_expires_at 
    ? new Date(folderInfo.invite_code_expires_at) < new Date() 
    : true;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div 
        className="bg-white dark:bg-surface-900 w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-surface-100 dark:border-surface-800 flex items-center justify-between">
          <h3 className="text-lg font-bold">초대 코드 관리</h3>
          <button onClick={onClose} className="p-2 -mr-2">
            <X className="size-5" />
          </button>
        </div>

        <div className="p-4 flex-1 overflow-y-auto flex flex-col gap-6">
          {/* 현재 코드 */}
          <div className="flex flex-col gap-3">
            <h4 className="text-sm font-bold text-surface-500">현재 초대 코드</h4>
            {folderInfo?.invite_code && !isExpired ? (
              <div className="flex items-center gap-2">
                <div className="flex-1 p-4 bg-surface-50 dark:bg-surface-800 rounded-xl font-mono text-2xl tracking-widest text-center">
                  {folderInfo.invite_code}
                </div>
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={copyCode}
                  className={cn(copied && "text-green-500 border-green-200 bg-green-50")}
                >
                  {copied ? <CheckCircle className="size-4" /> : <Copy className="size-4" />}
                </Button>
              </div>
            ) : (
              <div className="p-4 bg-surface-50 dark:bg-surface-800 rounded-xl text-center text-surface-400">
                {isExpired ? '코드가 만료되었습니다' : '코드가 없습니다'}
              </div>
            )}
            {folderInfo?.invite_code_expires_at && (
              <div className="flex items-center gap-1.5 text-xs text-surface-400">
                <Clock className="size-3.5" />
                만료: {formatKoreanDate(folderInfo.invite_code_expires_at)}
              </div>
            )}
            <Button 
              variant="outline" 
              onClick={handleRegenerate} 
              disabled={isPending}
              className="gap-2"
            >
              <RefreshCw className={cn("size-4", isPending && "animate-spin")} />
              새 코드 생성 (24시간 유효)
            </Button>
          </div>

          {/* 히스토리 */}
          <div className="flex flex-col gap-3">
            <h4 className="text-sm font-bold text-surface-500 flex items-center gap-1.5">
              <History className="size-4" />
              초대 히스토리
            </h4>
            {isLoading ? (
              <div className="flex justify-center py-4">
                <Loader2 className="size-5 animate-spin text-surface-300" />
              </div>
            ) : history && history.length > 0 ? (
              <div className="flex flex-col gap-2">
                {history.map((item: InviteHistoryType) => (
                  <div key={item.id} className="p-3 bg-surface-50 dark:bg-surface-800 rounded-xl flex items-center justify-between">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-mono text-sm">{item.invite_code}</span>
                      <span className="text-xs text-surface-400">
                        {item.invited_user_nickname 
                          ? `${item.invited_user_nickname} 수락` 
                          : item.status === 'expired' 
                            ? '만료됨' 
                            : '대기 중'}
                      </span>
                    </div>
                    <span className={cn(
                      "text-xs px-2 py-0.5 rounded-full font-medium",
                      item.status === 'accepted' 
                        ? "bg-green-100 text-green-600" 
                        : item.status === 'expired' 
                          ? "bg-surface-200 text-surface-500" 
                          : "bg-amber-100 text-amber-600"
                    )}>
                      {item.status === 'accepted' ? '수락' : item.status === 'expired' ? '만료' : '대기'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-surface-400 text-center py-4">히스토리가 없습니다.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function FolderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { show: showPlaceModal } = usePlacePopup();
  const { isAuthenticated } = useUserStore();
  const { openLogin } = useAuthModalStore();
  
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [showInviteHistory, setShowInviteHistory] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isLinkCopied, setIsLinkCopied] = useState(false);
  const [mapDataRequested, setMapDataRequested] = useState(false);
  const [showResetButton, setShowResetButton] = useState(false);
  const [editingPlace, setEditingPlace] = useState<{ 
    placeId: string; 
    place: any; 
    comment?: string;
    addedAt?: string;
    updatedAt?: string;
  } | null>(null);
  const initialZoom = useRef<number | null>(null);
  const initialCenter = useRef<[number, number] | null>(null);

  // 접근 권한 체크
  const { data: access, isLoading: isAccessLoading, refetch: refetchAccess } = useFolderAccess(id!);

  const { 
    data: placesData, 
    fetchNextPage, 
    hasNextPage, 
    isFetchingNextPage, 
    isLoading: isPlacesLoading 
  } = useFolderPlaces(id!);

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

  const { data: folderInfo, isLoading: isInfoLoading } = useFolderInfo(id!);
  const { mutate: addPlace } = useAddPlaceToFolder();
  const { mutate: hideFolder } = useHideFolder();
  const { mutate: removePlace } = useRemovePlaceFromFolder();
  const { 
    mutate: toggleSubscription, 
    isPending: isTogglePending, 
    variables: toggledFolderId 
  } = useToggleFolderSubscription();
  const { data: subscriptions } = useMySubscriptions();

  const isOwner = access?.is_owner;
  const canEdit = access?.can_edit;

  const isSubscribed = useMemo(() => {
    if (isOwner) return true;
    if (!subscriptions || !id) return false;
    return subscriptions.some(sub => 
      sub.subscription_type === 'folder' && sub.feature_id === id && sub.is_subscribed
    );
  }, [subscriptions, id, isOwner]);

  // 낙관적 업데이트를 위한 UI 상태 계산
  const isCurrentlyToggling = isTogglePending && toggledFolderId === id;
  const displaySubscribed = isCurrentlyToggling ? !isSubscribed : isSubscribed;

  const handleToggleSubscription = () => {
    if (isOwner) return;
    if (!id) return;
    toggleSubscription(id);
  };

  // 지도용 데이터 조회
  const { data: folderMapPlaces, isLoading: isMapLoading } = useFolderPlacesForMap(id!, mapDataRequested);

  const places = useMemo(() => {
    return placesData?.pages.flatMap(page => page) || [];
  }, [placesData]);

  const mapPlaces = useMemo(() => {
    if (folderMapPlaces && folderMapPlaces.length > 0) {
      return folderMapPlaces;
    }
    return places.map(p => ({
      place_id: p.place_id,
      name: p.place_data.name,
      x: p.place_data.x,
      y: p.place_data.y
    }));
  }, [folderMapPlaces, places]);

  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const clusterLabelMarkers = useRef<mapboxgl.Marker[]>([]);
  const pointLabelMarkers = useRef<mapboxgl.Marker[]>([]);
  const sourceId = 'places-source';
  const clusterLayerId = 'places-clusters';
  const unclusteredPointLayerId = 'places-unclustered-point';

  const handleAddPlace = async (place: any, comment?: string) => {
    return new Promise<void>((resolve, reject) => {
      addPlace({ folderId: id!, placeId: place.id, comment }, {
        onSuccess: () => {
          setIsSearchOpen(false);
          setEditingPlace(null);
          resolve();
        },
        onError: (error: any) => {
          const errorMessage = error?.message || error?.meta?.message || '장소 추가에 실패했습니다.';
          alert(errorMessage);
          reject(error); // 에러 발생 시 Promise reject하여 화면 전환 방지
        }
      });
    });
  };

  const handleEditComment = (placeId: string, place: any, comment?: string, addedAt?: string, updatedAt?: string) => {
    setEditingPlace({ placeId, place, comment, addedAt, updatedAt });
  };

  const handleSaveComment = async (comment: string) => {
    if (!editingPlace) return;
    
    return new Promise<void>((resolve, reject) => {
      addPlace({ folderId: id!, placeId: editingPlace.placeId, comment }, {
        onSuccess: () => {
          setEditingPlace(null);
          resolve();
        },
        onError: (error: any) => {
          const errorMessage = error?.message || error?.meta?.message || '메모 저장에 실패했습니다.';
          alert(errorMessage);
          reject(error); // 에러 발생 시 Promise reject하여 화면 전환 방지
        }
      });
    });
  };

  const handleDeletePlace = async () => {
    if (!editingPlace) return;

    return new Promise<void>((resolve, reject) => {
      removePlace({ folderId: id!, placeId: editingPlace.placeId }, {
        onSuccess: () => {
          setEditingPlace(null);
          resolve();
        },
        onError: (error: any) => {
          const errorMessage = error?.message || error?.meta?.message || '장소 제거에 실패했습니다.';
          alert(errorMessage);
          reject(error);
        }
      });
    });
  };

  // Initialize Map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [127.0276, 37.4979],
      zoom: 13,
    });

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // Update Map with Clustering
  useEffect(() => {
    if (!map.current || viewMode !== "map" || mapPlaces.length === 0) return;

    const features: GeoJSON.Feature<GeoJSON.Point>[] = mapPlaces
      .filter(place => {
        if (place.x === undefined || place.y === undefined || place.x === null || place.y === null) return false;
        const lng = typeof place.x === 'string' ? parseFloat(place.x) : place.x;
        const lat = typeof place.y === 'string' ? parseFloat(place.y) : place.y;
        return !isNaN(lng) && !isNaN(lat);
      })
      .map(place => {
        const lng = typeof place.x === 'string' ? parseFloat(place.x) : place.x as number;
        const lat = typeof place.y === 'string' ? parseFloat(place.y) : place.y as number;
        
        return {
          type: 'Feature' as const,
          properties: {
            id: place.place_id,
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
      paint: { 'circle-opacity': 0, 'circle-radius': 0 },
    });

    map.current.addLayer({
      id: unclusteredPointLayerId,
      type: 'circle',
      source: sourceId,
      filter: ['!', ['has', 'point_count']],
      paint: { 'circle-opacity': 0, 'circle-radius': 0 },
    });

    const updateLabels = () => {
      if (!map.current || !map.current.getSource(sourceId)) return;
      
      clusterLabelMarkers.current.forEach(m => m.remove());
      clusterLabelMarkers.current = [];
      pointLabelMarkers.current.forEach(m => m.remove());
      pointLabelMarkers.current = [];
      
      const clusterFeatures = map.current.queryRenderedFeatures({ layers: [clusterLayerId] });

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
                <div class="px-2 py-1 bg-white dark:bg-surface-900 text-surface-900 dark:text-white rounded-lg shadow-md border border-surface-200 dark:border-surface-800 font-bold text-xs whitespace-nowrap flex items-center gap-1 cursor-pointer">
                  <span>${placeName}</span>
                  <span class="text-primary-500">+${pointCount - 1}</span>
                </div>
              `;
              el.addEventListener('click', (e) => {
                e.stopPropagation();
                map.current!.easeTo({ center: coordinates, zoom: map.current!.getZoom() + 2 });
              });
              const marker = new mapboxgl.Marker(el).setLngLat(coordinates).addTo(map.current!);
              clusterLabelMarkers.current.push(marker);
            } else {
              leaves.forEach((leaf) => {
                const leafCoords = (leaf.geometry as GeoJSON.Point).coordinates as [number, number];
                const placeName = leaf.properties?.name || '장소';
                const placeId = leaf.properties?.id;
                const el = document.createElement('div');
                el.className = 'point-label-marker';
                el.innerHTML = `
                  <div class="px-2 py-1 bg-white dark:bg-surface-900 text-surface-900 dark:text-white rounded-lg shadow-md border border-surface-200 dark:border-surface-800 font-bold text-xs whitespace-nowrap cursor-pointer">
                    ${placeName}
                  </div>
                `;
                el.addEventListener('click', (e) => {
                  e.stopPropagation();
                  if (placeId) showPlaceModal(placeId);
                });
                const marker = new mapboxgl.Marker(el).setLngLat(leafCoords).addTo(map.current!);
                pointLabelMarkers.current.push(marker);
              });
            }
          }
        );
      });

      const pointFeatures = map.current.queryRenderedFeatures({ layers: [unclusteredPointLayerId] });
      pointFeatures.forEach((feature) => {
        const coordinates = (feature.geometry as GeoJSON.Point).coordinates as [number, number];
        const placeName = feature.properties?.name || '장소';
        const placeId = feature.properties?.id;
        const el = document.createElement('div');
        el.className = 'point-label-marker';
        el.innerHTML = `<div class="px-2 py-1 bg-white dark:bg-surface-900 text-surface-900 dark:text-white rounded-lg shadow-md border border-surface-200 dark:border-surface-800 font-bold text-xs whitespace-nowrap cursor-pointer">${placeName}</div>`;
        el.addEventListener('click', (e) => {
          e.stopPropagation();
          if (placeId) showPlaceModal(placeId);
        });
        const marker = new mapboxgl.Marker(el).setLngLat(coordinates).addTo(map.current!);
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

  return (
    <div className={cn(
      "flex flex-col relative",
      viewMode === "map" ? "h-dvh overflow-hidden bg-white dark:bg-surface-950" : "min-h-screen bg-surface-300 dark:bg-surface-900"
    )}>
      {/* 헤더 */}
      <div className="fixed top-0 inset-x-0 z-40 bg-white dark:bg-surface-950">
        <div className="max-w-lg mx-auto">
          <DetailHeader
            type="folder"
            title={folderInfo?.title || "맛탐정 폴더"}
            subtitle={folderInfo?.description || (folderInfo?.owner_nickname ? `@${folderInfo.owner_nickname}` : "익명")}
            thumbnailUrl={folderInfo?.owner_avatar_url}
            isOwner={isOwner}
            isSubscribed={displaySubscribed}
            isSubscribing={isCurrentlyToggling}
            onSubscribe={handleToggleSubscription}
            onSettings={() => setShowMenu(true)}
          />
        </div>
      </div>

      {/* 폴더 설정 시트 */}
      <FolderSettingsSheet 
        isOpen={showMenu}
        onClose={() => setShowMenu(false)}
        folderId={id!}
        folderInfo={folderInfo}
        onOpenHistory={() => {
          setShowMenu(false);
          setShowInviteHistory(true);
        }}
      />

      {/* 메인 컨텐츠 */}
      <div className={cn(
        "relative flex-1",
        viewMode === "map" ? "overflow-hidden" : "w-full",
        "pt-16"
      )}>
        {/* 지도 뷰 */}
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

        {/* 리스트 뷰 / 로딩 / 에러 상태 */}
        <div 
          className={cn(
            "transition-opacity duration-300",
            viewMode === "list" ? "opacity-100 relative z-10" : "opacity-0 absolute inset-0 -z-10 pointer-events-none hidden"
          )}
        >
          {isAccessLoading || isPlacesLoading || isInfoLoading ? (
            <div className="flex items-center justify-center py-40">
              <Loader2 className="size-8 animate-spin text-surface-300" />
            </div>
          ) : access?.access === 'NOT_FOUND' || !folderInfo ? (
            <div className="flex flex-col items-center justify-center py-40 p-6 text-center">
              <h2 className="text-2xl font-bold mb-2">폴더를 찾을 수 없습니다</h2>
              <p className="text-surface-500 mb-8">존재하지 않거나 비공개된 폴더입니다.</p>
              <Button onClick={() => navigate("/feature?tab=detective")} className="font-bold">
                맛탐정 목록으로 이동
              </Button>
            </div>
          ) : access?.access === 'INVITE_CODE_REQUIRED' ? (
            !isAuthenticated ? (
              <div className="flex flex-col items-center justify-center py-40 p-6 text-center">
                <div className="p-6 rounded-full bg-primary-100 dark:bg-primary-900/20 mb-6">
                  <Key className="size-12 text-primary-500" />
                </div>
                <h2 className="text-2xl font-bold mb-2">로그인이 필요합니다</h2>
                <p className="text-surface-500 mb-8">이 폴더에 접근하려면 로그인 후 초대 코드를 입력해주세요.</p>
                <Button onClick={() => openLogin()} className="font-bold">
                  로그인하기
                </Button>
              </div>
            ) : (
              <InviteCodeInput 
                folderId={id!} 
                onSuccess={() => refetchAccess()} 
              />
            )
          ) : (
            <>
              {/* 폴더 정보 요약 */}
              <div className="px-5 py-6 flex flex-col gap-4 bg-white dark:bg-surface-950 border-b border-surface-100 dark:border-surface-800">
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-6">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs text-surface-400 font-bold uppercase tracking-wider">매장</span>
                      <span className="text-lg font-black text-surface-900 dark:text-white">{folderInfo?.place_count || 0}</span>
                    </div>
                    {folderInfo?.permission !== 'default' && (
                      <>
                        <div className="w-px h-8 bg-surface-100 dark:bg-surface-800" />
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex flex-col gap-0.5">
                              <span className="text-xs text-surface-400 font-bold uppercase tracking-wider">구독</span>
                              <span className="text-lg font-black text-surface-900 dark:text-white">{folderInfo?.subscriber_count || 0}</span>
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  {canEdit && (
                    <Button 
                      size="sm" 
                      onClick={() => setIsSearchOpen(true)}
                      className="gap-1.5 font-bold h-9 px-4 rounded-full"
                    >
                      <Plus className="size-4" />
                      맛집추가
                    </Button>
                  )}
                </div>
              </div>

              {/* 장소 목록 */}
              <div className="flex flex-col gap-3 pb-20">
                {places.length > 0 ? (
                  <>
                    {places.map((item: any) => (
                      <div key={item.place_id} className="flex flex-col bg-white dark:bg-surface-950 overflow-hidden">
                        <PlaceCard 
                          place={item.place_data} 
                          showPrice={true}
                          addedAt={formatKoreanDate(item.added_at)}
                          hideShadow={true}
                        />
                        {/* 메모 표시 및 편집 UI */}
                        <div className="px-5 pb-5">
                          {item.comment ? (
                            <div className="flex flex-col gap-2">
                              <div className="p-3 bg-surface-50 dark:bg-surface-800 rounded-xl">
                                <p className="text-sm text-surface-700 dark:text-surface-300 leading-relaxed whitespace-pre-wrap">
                                  {item.comment}
                                </p>
                              </div>
                              {canEdit && (
                                <button
                                  onClick={() => handleEditComment(item.place_id, item.place_data, item.comment, item.added_at, item.updated_at)}
                                  className="text-xs text-primary-600 dark:text-primary-400 font-bold self-end hover:underline"
                                >
                                  메모 수정
                                </button>
                              )}
                            </div>
                          ) : (
                            canEdit && (
                              <button
                                onClick={() => handleEditComment(item.place_id, item.place_data, undefined, item.added_at, item.updated_at)}
                                className="text-xs text-surface-400 dark:text-surface-500 font-bold hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                              >
                                + 메모 추가
                              </button>
                            )
                          )}
                        </div>
                        {folderInfo?.permission === 'invite' && (
                          <div className="px-5 pb-5">
                            <FolderReviewSection 
                              folderId={id!}
                              placeId={item.place_id}
                              placeName={item.place_data.name}
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 text-center gap-4 bg-white dark:bg-surface-950">
                    <div className="p-6 rounded-full bg-surface-50 dark:bg-surface-900">
                      <Info className="size-10 text-surface-200" />
                    </div>
                    <div>
                      <p className="text-lg font-bold text-surface-900 dark:text-white">아직 등록된 장소가 없습니다</p>
                      <p className="text-sm text-surface-500 mt-1">
                        {isOwner ? "맛집을 검색해서 나만의 폴더를 채워보세요!" : "사용자가 아직 장소를 추가하지 않았습니다."}
                      </p>
                    </div>
                  </div>
                )}

                {hasNextPage && (
                  <div ref={observerTarget} className="p-8 pb-24 flex justify-center">
                    <Loader2 className="size-6 text-surface-300 animate-spin" />
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* 하단 토글 버튼 */}
      {!isPlacesLoading && places.length > 0 && (
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

      <PlaceSearchModal 
        isOpen={isSearchOpen} 
        onClose={() => setIsSearchOpen(false)}
        onSelect={handleAddPlace}
      />

      {editingPlace && (
        <PlaceCommentForm
          place={editingPlace.place}
          initialComment={editingPlace.comment}
          addedAt={editingPlace.addedAt}
          updatedAt={editingPlace.updatedAt}
          onBack={() => setEditingPlace(null)}
          onSave={handleSaveComment}
          onDelete={canEdit ? handleDeletePlace : undefined}
          onClose={() => setEditingPlace(null)}
        />
      )}

      {showInviteHistory && (
        <InviteHistoryModal 
          folderId={id!} 
          onClose={() => setShowInviteHistory(false)} 
        />
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
