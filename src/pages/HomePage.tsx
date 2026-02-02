import { useState, useMemo, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { useMySubscriptions, usePublicFolders, useMyFeed } from "@/entities/folder/queries";
import { useHomeDiscover } from "@/entities/home/queries";
import { cn, formatRelativeTime } from "@/shared/lib/utils";
import { useUserStore } from "@/entities/user";
import { useAuthModalStore } from "@/features/auth/model/useAuthModalStore";
import { usePlacePopup } from "@/shared/lib/place-popup";

import { StoriesSection, StoryBox } from "@/widgets/StoriesSection";
import { HeroSection } from "@/widgets/HeroSection";
import { PopularPlacesSection } from "@/widgets/PopularPlacesSection";
import { DiscoverGrid, GridSkeleton, CollectionCard } from "@/widgets/DiscoverGrid";
import { PlaceCard } from "@/widgets";

import { PageHeader } from "@/shared/ui/PageHeader";
import { LocationSettingSheet } from "@/features/location/ui/LocationSettingSheet";
import { useUserLocations } from "@/entities/location";
import { PlaceThumbnail } from "@/shared/ui/place/PlaceThumbnail";
import { trackEvent } from "@/shared/lib/gtm";
import naverIcon from "@/assets/images/naver-map-logo.png";
import { Loader2, Bell, MapPin, Info, LayoutGrid } from "lucide-react";

import { SourceContent } from "@/features/home/ui/SourceContent";

export function HomePage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isAuthenticated } = useUserStore();
  const { openLogin } = useAuthModalStore();
  const { show: showPlaceModal } = usePlacePopup();

  // URL State Management
  const viewParam = searchParams.get('view');
  const sortParam = searchParams.get('sort');
  
  // Determine active tab
  const activeTab = useMemo(() => {
    if (viewParam === 'source') return 'source';
    if (viewParam === 'feed') return 'following';
    return 'foryou';
  }, [viewParam]);

  // Default URL params
  useEffect(() => {
    if (!viewParam) {
      setSearchParams(prev => {
        const newParams = new URLSearchParams(prev);
        if (!newParams.has('view')) newParams.set('view', 'recommend');
        if (!newParams.has('sort')) newParams.set('sort', 'recent');
        return newParams;
      }, { replace: true });
    }
  }, [viewParam, setSearchParams]);

  const [isLocationSheetOpen, setIsLocationSheetOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number; id: string } | null>(null);

  // Data Fetching
  // const { data: subscriptions, isLoading: isSubscriptionsLoading } = useMySubscriptions(); // Moved to FollowingContent or removed if not needed
  const { data: discoverData, isLoading: isDiscoverLoading } = useHomeDiscover();
  const { data: publicFoldersData, isLoading: isPublicFoldersLoading } = usePublicFolders();
  const { data: userLocations } = useUserLocations({ limit: 1 }, { enabled: isAuthenticated });

  const publicFolders = publicFoldersData?.pages?.flatMap(page => page) || [];

  // 최근 위치 정보 초기화
  useEffect(() => {
    if (userLocations && userLocations.length > 0 && !selectedLocation) {
      setSelectedLocation({
        lat: userLocations[0].latitude,
        lng: userLocations[0].longitude,
        id: userLocations[0].id
      });
    }
  }, [userLocations, selectedLocation]);

  const tabs = [
    { id: "foryou", label: "추천" },
    { id: "source", label: "소스" },
    { id: "following", label: "구독" },
  ];

  const handleTabChange = (id: string) => {
    let view = 'recommend';
    if (id === 'source') view = 'source';
    if (id === 'following') view = 'feed';
    
    setSearchParams(prev => {
      const newParams = new URLSearchParams(prev);
      newParams.set('view', view);
      if (!newParams.has('sort')) newParams.set('sort', 'recent');
      return newParams;
    });
  };

  return (
    <div className="min-h-screen bg-white dark:bg-surface-950">
      {/* Header */}
      <PageHeader 
        tabs={tabs} 
        activeTab={activeTab} 
        onTabChange={handleTabChange} 
      />

      <main className="pt-24">
        {activeTab !== 'source' && (
          <>
            {/* 대시보드 상단: 위치 및 상태 브리핑 */}
            <section className="px-4 mb-8">
              <div 
                onClick={() => setIsLocationSheetOpen(true)}
                className="flex items-center justify-between p-5 rounded-2xl bg-surface-50 dark:bg-surface-900 border border-surface-100 dark:border-surface-800 cursor-pointer transition-all"
              >
                <div className="flex flex-col gap-1">
                  <h3 className="text-base font-medium text-surface-900 dark:text-white">
                    {selectedLocation ? `${userLocations?.[0]?.nearest_place_name || '현재 위치'} 주변` : '위치 설정'}
                  </h3>
                  <p className="text-[11px] text-surface-500">
                    {selectedLocation ? '주변 맛집의 기록을 확인해보세요' : '거리순 정렬과 주변 탐색이 가능해집니다'}
                  </p>
                </div>
                <span className="text-xs text-surface-400 font-medium">변경</span>
              </div>
            </section>

            {/* Stories: 맛탐정(유저) 및 소스 브리핑 */}
            <div className="px-4 mb-2 flex items-center justify-between">
              <h2 className="text-xs text-surface-500 font-medium uppercase tracking-wider">
                Active Detectives
              </h2>
            </div>
            <StoriesSection isLoading={isDiscoverLoading}>
              {discoverData?.users?.map((user: any, i: number) => (
                <StoryBox
                  key={`user-${user.id || i}`}
                  image={user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id || i + 100}`}
                  label={user.nickname || '사용자'}
                  onClick={() => navigate(`/profile/${user.id}`)}
                />
              ))}
            </StoriesSection>
          </>
        )}

        {/* Main Content */}
        {activeTab === "foryou" ? (
          <ForYouContent
            discoverData={discoverData}
            publicFolders={publicFolders}
            isLoading={isDiscoverLoading || isPublicFoldersLoading}
            onPlaceClick={showPlaceModal}
            selectedLocation={selectedLocation}
          />
        ) : activeTab === "source" ? (
          <SourceContent />
        ) : (
          <FollowingContent
            onPlaceClick={showPlaceModal}
          />
        )}
      </main>

      {/* 위치 설정 바텀 시트 */}
      <LocationSettingSheet 
        isOpen={isLocationSheetOpen}
        onClose={() => setIsLocationSheetOpen(false)}
        onSelect={(lat, lng, id) => {
          setSelectedLocation({ lat, lng, id });
          setIsLocationSheetOpen(false);
        }}
        selectedId={selectedLocation?.id}
      />
    </div>
  );
}

/**
 * For You 탭 콘텐츠
 */
function ForYouContent({
  discoverData,
  publicFolders,
  isLoading,
  onPlaceClick,
  selectedLocation,
}: {
  discoverData: any;
  publicFolders: any[];
  isLoading: boolean;
  onPlaceClick: (id: string) => void;
  selectedLocation: any;
}) {
  const mixedContent = useMemo(() => {
    if (isLoading || !publicFolders) return [];
    const items: any[] = [];
    publicFolders?.forEach((folder, i) => {
      items.push({ type: 'folder', data: folder, size: i % 5 === 0 ? 'large' : 'normal' });
    });
    discoverData?.popularPlaces?.forEach((place: any, i: number) => {
      items.push({ type: 'place', data: place, size: i % 4 === 0 ? 'large' : 'normal' });
    });
    discoverData?.youtubeChannels?.forEach((channel: any, i: number) => {
      items.push({ type: 'youtube', data: channel, size: i % 3 === 0 ? 'large' : 'normal' });
    });
    discoverData?.naverFolders?.forEach((folder: any, i: number) => {
      items.push({ type: 'naver', data: folder, size: i % 4 === 0 ? 'large' : 'normal' });
    });
    return items.sort((a, b) => {
      const aKey = `${a.type}-${a.data.id || a.data.folder_id || a.data.channel_id}`;
      const bKey = `${b.type}-${b.data.id || b.data.folder_id || b.data.channel_id}`;
      return aKey.localeCompare(bKey);
    });
  }, [publicFolders, discoverData, isLoading]);

  if (isLoading) {
    return <div className="px-4 pb-32"><GridSkeleton /></div>;
  }

  return (
    <div className="pb-32">
      {/* 아카이브 큐레이션 섹션 */}
      <div className="px-4 mt-10 mb-4 flex items-center justify-between">
        <h2 className="text-base font-medium text-surface-900 dark:text-white">추천 아카이브</h2>
        {selectedLocation && (
          <span className="text-[10px] text-primary-600 font-medium uppercase tracking-tight">
            Nearby First
          </span>
        )}
      </div>
      
      <HeroSection publicFolders={publicFolders} />
      
      {/* 인기 음식점 섹션: 맥락 강조 */}
      <div className="px-4 mt-12 mb-4">
        <h2 className="text-base font-medium text-surface-900 dark:text-white">
          많이 저장된 장소
        </h2>
      </div>
      <PopularPlacesSection
        places={discoverData?.popularPlaces}
        onPlaceClick={onPlaceClick}
      />
      
      {/* 발견하기 섹션: 다양한 소스 탐색 */}
      <div className="px-4 mt-12 mb-4">
        <h2 className="text-base font-medium text-surface-900 dark:text-white">
          새로운 기록 발견
        </h2>
      </div>
      <DiscoverGrid items={mixedContent.slice(1)} onPlaceClick={onPlaceClick} />
    </div>
  );
}

/**
 * Following 탭 콘텐츠
 */
function FollowingContent({
  onPlaceClick,
}: {
  onPlaceClick: (id: string) => void;
}) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isAuthenticated } = useUserStore();
  const [layout, setLayout] = useState<'feed' | 'grid'>('feed');
  
  // URL params
  const sortParam = searchParams.get('sort');
  const sortBy: 'recent' | 'distance' = (sortParam === 'distance' ? 'distance' : 'recent');

  const [isLocationSheetOpen, setIsLocationSheetOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number; id: string } | null>(null);

  // User Locations for distance sort
  const { data: userLocations } = useUserLocations({ limit: 1 }, { enabled: isAuthenticated });

  useEffect(() => {
    if (userLocations && userLocations.length > 0 && !selectedLocation) {
      setSelectedLocation({
        lat: userLocations[0].latitude,
        lng: userLocations[0].longitude,
        id: userLocations[0].id
      });
    }
  }, [userLocations, selectedLocation]);

  const MAX_DISTANCE_KM = 5;

  const { 
    data, 
    fetchNextPage, 
    hasNextPage, 
    isFetchingNextPage, 
    isLoading 
  } = useMyFeed({
    sortBy,
    userLat: sortBy === 'distance' ? selectedLocation?.lat : null,
    userLng: sortBy === 'distance' ? selectedLocation?.lng : null,
    maxDistanceKm: sortBy === 'distance' ? MAX_DISTANCE_KM : null,
  }, { enabled: isAuthenticated });

  const observerTarget = useRef<HTMLDivElement>(null);
  const feedItems = data?.pages.flatMap(page => page) || [];

  // Infinite Scroll
  useEffect(() => {
    if (!isAuthenticated || !hasNextPage || isFetchingNextPage) return;

    const currentTarget = observerTarget.current;
    if (!currentTarget) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1, rootMargin: '400px' }
    );

    observer.observe(currentTarget);

    return () => {
      observer.disconnect();
    };
  }, [isAuthenticated, hasNextPage, isFetchingNextPage, fetchNextPage, sortBy, feedItems.length]);

  const handleSortByDistance = () => {
    trackEvent("feed_sort_click", { type: "distance" });
    if (!selectedLocation) {
      setIsLocationSheetOpen(true);
      return;
    }
    setSearchParams(prev => {
      const newParams = new URLSearchParams(prev);
      newParams.set('sort', 'distance');
      return newParams;
    });
  };

  const handleSortByRecent = () => {
    trackEvent("feed_sort_click", { type: "recent" });
    setSearchParams(prev => {
      const newParams = new URLSearchParams(prev);
      newParams.set('sort', 'recent');
      return newParams;
    });
  };

  const handleLayoutToggle = () => {
    const newLayout = layout === 'feed' ? 'grid' : 'feed';
    trackEvent("feed_layout_change", { layout: newLayout });
    setLayout(newLayout);
  };

  const communityMap: Record<string, string> = {
    'clien.net': '클리앙',
    'm': '클리앙',
    'damoang.net': '다모앙',
    'bobaedream.co.kr': '보배드림',
    'co.kr': '보배드림',
    'bluer': '블루리본',
  };

  const renderFeedItem = (item: any, idx: number) => {
    const getSourcePath = () => {
      switch (item.source_type) {
        case 'folder': return `/folder/${item.source_id}`;
        case 'naver_folder': return `/feature/detail/folder/${item.source_id}`;
        case 'youtube_channel': return `/feature/detail/youtube/${item.source_id}`;
        case 'community_region': return `/feature/detail/community/${item.source_id}`;
        default: return null;
      }
    };

    const sourcePath = getSourcePath();
    let sourceLabel = item.source_type === 'folder' ? '맛탐정 폴더' : 
                       item.source_type === 'naver_folder' ? '플레이스 폴더' :
                       item.source_type === 'youtube_channel' ? '유튜브' : '커뮤니티';
    let sourceTitle = item.source_title;
    let sourceImage = item.source_type === 'naver_folder' ? naverIcon : item.source_image;

    if (item.source_type === 'community_region' && sourceTitle?.includes('|')) {
      const [domain, region] = sourceTitle.split('|');
      const communityName = communityMap[domain] || domain;
      sourceLabel = `커뮤니티 > ${communityName}`;
      sourceTitle = region;
      sourceImage = undefined;
    } else if (item.source_type === 'community_region') {
      sourceImage = undefined;
    }

    if (layout === 'grid') {
      const place = item.place_data;
      const images = place.images || place.image_urls || place.place_images || [];
      
      return (
        <PlaceThumbnail
          key={`${item.source_id}-${item.place_id}-${idx}`}
          placeId={place.id}
          name={place.name}
          thumbnail={images[0]}
          group2={place.group2}
          group3={place.group3}
          category={place.category}
          features={place.features}
          interaction={place.interaction}
          onClick={onPlaceClick}
        />
      );
    }

    return (
      <PlaceCard 
        key={`${item.source_id}-${item.place_id}-${idx}`}
        place={item.place_data}
        sourceLabel={sourceLabel}
        sourceTitle={sourceTitle}
        sourceImage={sourceImage}
        sourcePath={sourcePath || undefined}
        addedAt={formatRelativeTime(item.added_at)}
        showPrice={true}
        comment={item.comment}
        distance={item.distance_meters}
      />
    );
  };

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center py-24 px-8 text-center">
        <div className="w-24 h-24 rounded-full bg-surface-50 dark:bg-surface-900 flex items-center justify-center mb-6">
          <span className="text-2xl font-medium text-primary-500">!</span>
        </div>
        <h3 className="text-xl font-medium text-surface-900 dark:text-white mb-2">로그인이 필요합니다</h3>
        <p className="text-sm text-surface-500 mb-8 leading-relaxed">구독한 맛집 소식을 보려면<br/>로그인이 필요해요</p>
        <button
          onClick={() => navigate("/auth/login")}
          className="px-8 py-3.5 bg-surface-900 dark:bg-white text-white dark:text-surface-900 rounded-full font-medium text-sm"
        >
          로그인하기
        </button>
      </div>
    );
  }

  if (isLoading) {
    return <div className="px-4 pb-32"><GridSkeleton /></div>;
  }

  if (feedItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 px-8 text-center">
        <div className="w-24 h-24 rounded-full bg-surface-50 dark:bg-surface-900 flex items-center justify-center mb-6">
          <Bell className="size-10 text-surface-200" />
        </div>
        <h3 className="text-xl font-medium text-surface-900 dark:text-white mb-2">아직 새로운 소식이 없습니다</h3>
        <p className="text-sm text-surface-500 mb-8 leading-relaxed">맛탐정 탭에서 관심 있는 폴더를 구독하고<br/>새로운 맛집 소식을 받아보세요</p>
        <button
          onClick={() => navigate("/feature")}
          className="px-8 py-3.5 bg-surface-900 dark:bg-white text-white dark:text-surface-900 rounded-full font-medium text-sm"
        >
          탐색하기
        </button>
      </div>
    );
  }

  return (
    <div className="pb-32">
      {/* Controls */}
      <div className="px-4 mb-4 flex items-center justify-between">
         <div className="flex bg-surface-100 dark:bg-surface-800 p-1 rounded-xl">
            <button 
              onClick={handleSortByRecent}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
                sortBy === 'recent' 
                  ? "bg-white dark:bg-surface-700 text-surface-900 dark:text-white shadow-sm" 
                  : "text-surface-500 hover:text-surface-700 dark:text-surface-400"
              )}
            >
              최신순
            </button>
            <button 
              onClick={handleSortByDistance}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
                sortBy === 'distance' 
                  ? "bg-white dark:bg-surface-700 text-surface-900 dark:text-white shadow-sm" 
                  : "text-surface-500 hover:text-surface-700 dark:text-surface-400"
              )}
            >
              거리순
            </button>
          </div>

          <div className="flex items-center gap-2">
             <button 
                onClick={() => setIsLocationSheetOpen(true)}
                className={cn(
                  "p-2 rounded-xl transition-colors",
                  selectedLocation 
                    ? "bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400" 
                    : "bg-surface-100 text-surface-400 dark:bg-surface-800 hover:text-surface-600"
                )}
              >
                <MapPin className="size-5" />
              </button>
              <button 
                onClick={handleLayoutToggle}
                className={cn(
                  "p-2 rounded-xl transition-colors",
                  layout === 'grid' 
                    ? "bg-surface-900 text-white dark:bg-white dark:text-surface-900" 
                    : "text-surface-300 dark:text-surface-600 hover:text-surface-500"
                )}
              >
                <LayoutGrid className="size-4" />
              </button>
          </div>
      </div>

      {/* Content */}
      <div className={cn(
        "bg-white dark:bg-surface-950",
        layout === 'feed' ? "flex flex-col" : "grid grid-cols-3 gap-0.5"
      )}>
         {/* 위치 가이드 메시지 (거리순 정렬인데 위치 정보가 없을 때) */}
          {sortBy === 'distance' && !selectedLocation && (
            <div className={cn(
              "mx-5 mt-4 mb-2 px-4 py-2 bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-800/50 rounded-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2",
              layout === 'grid' && "col-span-3"
            )}>
              <Info className="size-4 text-orange-500 shrink-0" />
              <p className="text-[12px] text-orange-700 dark:text-orange-400 font-medium">
                위치 정보가 없어 기본 정렬로 보여드려요. 위치를 설정해보세요!
              </p>
            </div>
          )}
          
          {/* 거리 제한 안내 메시지 (거리순 정렬 + 위치 설정됨) */}
          {sortBy === 'distance' && selectedLocation && (
            <div className={cn(
              "mx-5 mt-4 mb-2 px-4 py-2 bg-primary-50 dark:bg-primary-900/20 border border-primary-100 dark:border-primary-800/50 rounded-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2",
              layout === 'grid' && "col-span-3"
            )}>
              <MapPin className="size-4 text-primary-500 shrink-0" />
              <p className="text-[12px] text-primary-700 dark:text-primary-400 font-medium">
                현재 위치에서 {MAX_DISTANCE_KM}km 이내 장소를 표시합니다
              </p>
            </div>
          )}

        {feedItems.map((item: any, idx: number) => renderFeedItem(item, idx))}
        
        <div 
          ref={observerTarget} 
          className={cn(
            "py-12 flex justify-center",
            layout === 'grid' && "col-span-3",
            !hasNextPage && "hidden"
          )}
        >
          {isFetchingNextPage && (
            <Loader2 className="size-6 text-surface-300 animate-spin" />
          )}
        </div>
      </div>

      <LocationSettingSheet 
        isOpen={isLocationSheetOpen}
        onClose={() => setIsLocationSheetOpen(false)}
        onSelect={(lat, lng, id) => {
          setSelectedLocation({ lat, lng, id });
          setIsLocationSheetOpen(false);
          if (sortBy !== 'distance') {
             setSearchParams(prev => {
                const newParams = new URLSearchParams(prev);
                newParams.set('sort', 'distance');
                return newParams;
              });
          }
        }}
        selectedId={selectedLocation?.id}
      />
    </div>
  );
}
