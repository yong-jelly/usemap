import { useRef, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useMyFeed, usePublicFeed } from "@/entities/folder/queries";
import { usePlacePopup } from "@/shared/lib/place-popup";
import { PlaceCard } from "@/widgets";
import { 
  Loader2, 
  Bell, 
  ChevronRight, 
  LogIn, 
  MapPin, 
  Info,
  LayoutGrid
} from "lucide-react";
import { useUserStore } from "@/entities/user";
import { useAuthModalStore } from "@/features/auth/model/useAuthModalStore";
import { cn, formatRelativeTime } from "@/shared/lib/utils";
import { PlaceThumbnail } from "@/shared/ui/place/PlaceThumbnail";
import { trackEvent } from "@/shared/lib/gtm";
import naverIcon from "@/assets/images/naver-map-logo.png";
import type { ReactNode } from "react";
import { LocationSettingSheet } from "@/features/location/ui/LocationSettingSheet";
import { useUserLocations } from "@/entities/location";

export function FeedPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useUserStore();
  const { openLogin } = useAuthModalStore();
  const { show: showPlaceModal } = usePlacePopup();
  
  const [layout, setLayout] = useState<'feed' | 'grid'>('feed');

  // 위치 및 정렬 상태
  const [sortBy, setSortBy] = useState<'recent' | 'distance'>('recent');
  const [isLocationSheetOpen, setIsLocationSheetOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number; id: string } | null>(null);

  const { data: userLocations } = useUserLocations({ limit: 1 }, { enabled: isAuthenticated });
  
  // 최근 위치 정보가 있으면 초기값으로 설정
  useEffect(() => {
    if (userLocations && userLocations.length > 0 && !selectedLocation) {
      setSelectedLocation({
        lat: userLocations[0].latitude,
        lng: userLocations[0].longitude,
        id: userLocations[0].id
      });
    }
  }, [userLocations, selectedLocation]);

  const handleSortByDistance = () => {
    trackEvent("feed_sort_click", { type: "distance" });
    setSortBy('distance');
    if (!selectedLocation) {
      setIsLocationSheetOpen(true);
    }
  };

  const handleLayoutToggle = () => {
    const newLayout = layout === 'feed' ? 'grid' : 'feed';
    trackEvent("feed_layout_change", { layout: newLayout });
    setLayout(newLayout);
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  const { 
    data, 
    fetchNextPage, 
    hasNextPage, 
    isFetchingNextPage, 
    isLoading,
    refetch
  } = useMyFeed({
    sortBy,
    userLat: sortBy === 'distance' ? selectedLocation?.lat : null,
    userLng: sortBy === 'distance' ? selectedLocation?.lng : null,
  }, { enabled: isAuthenticated });

  // sortBy나 selectedLocation 변경 시 데이터 다시 불러오기
  useEffect(() => {
    if (isAuthenticated) {
      refetch();
    }
  }, [sortBy, selectedLocation, isAuthenticated, refetch]);

  // 공개 피드 데이터 (비로그인용)
  const { data: communityFeed, isLoading: isLoadingCommunity } = usePublicFeed(
    { sourceType: 'community_region', limit: 10 },
    { enabled: !isAuthenticated }
  );
  const { data: detectiveFeed, isLoading: isLoadingDetective } = usePublicFeed(
    { sourceType: 'folder', limit: 10 },
    { enabled: !isAuthenticated }
  );
  const { data: naverFeed, isLoading: isLoadingNaver } = usePublicFeed(
    { sourceType: 'naver_folder', limit: 10 },
    { enabled: !isAuthenticated }
  );
  const { data: youtubeFeed, isLoading: isLoadingYoutube } = usePublicFeed(
    { sourceType: 'youtube_channel', limit: 10 },
    { enabled: !isAuthenticated }
  );

  const observerTarget = useRef<HTMLDivElement>(null);

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

    // 그리드 레이아웃: PlaceThumbnail 컴포넌트 사용
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
          onClick={showPlaceModal}
        />
      );
    }

    // 피드 레이아웃: PlaceCard 컴포넌트 사용
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

  // 페이지 마운트 시 window 스크롤 초기화
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, []);

  useEffect(() => {
    const currentTarget = observerTarget.current;
    if (!isAuthenticated || !hasNextPage || !currentTarget) return;

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
      observer.unobserve(currentTarget);
    };
  }, [isAuthenticated, hasNextPage, isFetchingNextPage, fetchNextPage, layout]);

  const feedItems = data?.pages.flatMap(page => page) || [];

  return (
    <div 
      className="flex flex-col min-h-dvh bg-white dark:bg-surface-950"
    >
      {/* 상단 헤더 - 타이포 중심 */}
      <header className="fixed top-0 inset-x-0 z-50 bg-white dark:bg-surface-950 border-b border-surface-100 dark:border-surface-800">
        <div className="max-w-lg mx-auto px-5 pt-8 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <h1 className="text-xl font-medium text-surface-900 dark:text-white relative">
                피드
                <div className="absolute -bottom-2 left-0 right-0 h-1 bg-surface-900 dark:bg-white rounded-full" />
              </h1>
            </div>
            
            {isAuthenticated && (
              <div className="flex items-center gap-2">
                {/* 정렬 전환 버튼 */}
                <div className="flex bg-surface-100 dark:bg-surface-800 p-1 rounded-xl">
                  <button 
                    onClick={() => setSortBy('recent')}
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

                {/* 위치 설정 버튼 */}
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

                {/* 레이아웃 토글 버튼 (우측 끝) */}
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
            )}
          </div>

          {/* 위치 가이드 메시지 (거리순 정렬인데 위치 정보가 없을 때) */}
          {isAuthenticated && sortBy === 'distance' && !selectedLocation && (
            <div className="mt-4 px-4 py-2 bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-800/50 rounded-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
              <Info className="size-4 text-orange-500 shrink-0" />
              <p className="text-[12px] text-orange-700 dark:text-orange-400 font-medium">
                위치 정보가 없어 기본 정렬로 보여드려요. 위치를 설정해보세요!
              </p>
            </div>
          )}
        </div>
      </header>

      <main className={cn(
        "flex-1 flex flex-col pt-[80px]",
        (isAuthenticated && sortBy === 'distance' && !selectedLocation) ? "pt-[110px]" : "pt-[80px]"
      )}>
        {!isAuthenticated && (
          <div className="flex flex-col gap-8 pb-20">
            {/* 로그인 가이드 - 심플 버전 */}
            <div className="px-5 pt-6">
              <button 
                onClick={openLogin}
                className="w-full flex items-center justify-between p-4 rounded-xl bg-surface-50 dark:bg-surface-900 border border-surface-100 dark:border-surface-800 active:scale-[0.98] transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-full bg-primary-500 flex items-center justify-center">
                    <LogIn className="size-5 text-white" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-sm font-medium text-surface-900 dark:text-white">나만의 미식 피드를 완성하세요</h3>
                    <p className="text-xs text-surface-500">커뮤니티, 유튜브, 네이버의 맛집 소식을 한곳에서</p>
                  </div>
                </div>
                <ChevronRight className="size-4 text-surface-300" />
              </button>
            </div>

            {/* 카테고리별 피드 */}
            <div className="flex flex-col gap-10">
              <CategorySection 
                title="실시간 커뮤니티 픽" 
                description="다양한 커뮤니티에서 유저들이 직접 추천한 맛집"
                items={communityFeed} 
                isLoading={isLoadingCommunity} 
                renderItem={renderFeedItem} 
              />
              <CategorySection 
                title="미식가의 엄선 폴더" 
                description="맛탐정 사용자들이 정성껏 큐레이션한 맛집 컬렉션"
                items={detectiveFeed} 
                isLoading={isLoadingDetective} 
                renderItem={renderFeedItem} 
              />
              <CategorySection 
                title="네이버 플레이스 핫트렌드" 
                description="지금 네이버 지도에서 가장 주목받는 인기 장소"
                items={naverFeed} 
                isLoading={isLoadingNaver} 
                renderItem={renderFeedItem} 
              />
              <CategorySection 
                title="크리에이터 미식 가이드" 
                description="영상 속 화제의 장소, 유튜버들의 생생한 맛집 추천"
                items={youtubeFeed} 
                isLoading={isLoadingYoutube} 
                renderItem={renderFeedItem} 
              />
            </div>

            {/* 하단 탐색 가이드 */}
            <div className="px-5 mt-4">
              <button 
                onClick={() => navigate("/feature")}
                className="w-full py-8 px-6 rounded-3xl bg-surface-50 dark:bg-surface-900 border border-surface-100 dark:border-surface-800 text-center group active:scale-[0.98] transition-all"
              >
                <h4 className="text-xl font-medium text-surface-900 dark:text-white">더 많은 맛집을 찾고 계신가요?</h4>
                <p className="text-surface-500 mt-2 mb-6">다양한 테마와 지역별 맛집을 탐색 탭에서 확인해보세요.</p>
                <div className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-surface-900 dark:bg-white text-white dark:text-black font-medium text-sm group-hover:gap-3 transition-all">
                  탐색하러 가기
                  <ChevronRight className="size-4" />
                </div>
              </button>
            </div>
          </div>
        )}

        {isAuthenticated && (
          isLoading ? (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 className="size-8 animate-spin text-surface-300" />
            </div>
          ) : feedItems.length > 0 ? (
            <div className={cn(
              "flex-1 pb-20 bg-white dark:bg-surface-950",
              layout === 'feed' ? "flex flex-col" : "grid grid-cols-3 gap-0.5"
            )}>
              {feedItems.map((item: any, idx: number) => renderFeedItem(item, idx))}
              
              {hasNextPage && (
                <div ref={observerTarget} className={cn(
                  "py-12 flex justify-center",
                  layout === 'grid' && "col-span-3"
                )}>
                  <Loader2 className="size-6 text-surface-300 animate-spin" />
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-10 text-center gap-4">
              <div className="p-6 rounded-full bg-surface-50 dark:bg-surface-900">
                <Bell className="size-10 text-surface-200" />
              </div>
              <div>
                <p className="text-lg font-medium text-surface-900 dark:text-white">아직 새로운 소식이 없습니다</p>
                <p className="text-sm text-surface-500 mt-1">맛탐정 탭에서 관심 있는 폴더를 구독해보세요!</p>
              </div>
              <button 
                onClick={() => navigate("/feature/detective")}
                className="mt-2 px-6 py-3 rounded-xl bg-surface-900 text-white dark:bg-white dark:text-black font-medium text-sm"
              >
                맛탐정 보러가기
              </button>
            </div>
          )
        )}
      </main>
      
      {/* 위치 설정 바텀 시트 */}
      <LocationSettingSheet 
        isOpen={isLocationSheetOpen}
        onClose={() => setIsLocationSheetOpen(false)}
        onSelect={(lat, lng, id) => {
          setSelectedLocation({ lat, lng, id });
          setIsLocationSheetOpen(false);
          setSortBy('distance');
        }}
        selectedId={selectedLocation?.id}
      />
    </div>
  );
}

function CategorySection({ 
  title, 
  description,
  items, 
  isLoading, 
  renderItem 
}: { 
  title: string; 
  description?: string;
  items?: any[]; 
  isLoading: boolean;
  renderItem: (item: any, idx: number) => ReactNode;
}) {
  if (!isLoading && (!items || items.length === 0)) return null;

  return (
    <div className="flex flex-col gap-4">
      <div className="px-5 flex flex-col">
        <h2 className="text-xl font-medium text-surface-900 dark:text-white leading-tight">{title}</h2>
        {description && (
          <p className="text-[13px] text-surface-500 font-medium mt-0.5">{description}</p>
        )}
      </div>
      <div className="flex flex-col bg-white dark:bg-surface-950 py-0">
        {isLoading ? (
          <div className="py-10 flex justify-center">
            <Loader2 className="size-6 text-surface-300 animate-spin" />
          </div>
        ) : (
          items?.map((item, idx) => renderItem(item, idx))
        )}
      </div>
    </div>
  );
}
