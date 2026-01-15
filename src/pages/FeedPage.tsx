import { useRef, useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router";
import { useMyFeed, usePublicFeed } from "@/entities/folder/queries";
import { usePlacePopup } from "@/shared/lib/place-popup";
import { PlaceCard, ExploreFilterSheet } from "@/widgets";
import { Loader2, Bell, Settings, Filter, X, RotateCcw, ChevronRight, LogIn } from "lucide-react";
import { useUserStore } from "@/entities/user";
import { useAuthModalStore } from "@/features/auth/model/useAuthModalStore";
import { cn, formatRelativeTime } from "@/shared/lib/utils";
import { Button } from "@/shared/ui";
import { trackEvent } from "@/shared/lib/gtm";
import naverIcon from "@/assets/images/naver-map-logo.png";
import type { ReactNode } from "react";

export function FeedPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useUserStore();
  const { openLogin } = useAuthModalStore();
  const { show: showPlaceModal } = usePlacePopup();
  
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filters, setFilters] = useState<{ price_min: number | null; price_max: number | null }>({
    price_min: null,
    price_max: null,
  });

  const { 
    data, 
    fetchNextPage, 
    hasNextPage, 
    isFetchingNextPage, 
    isLoading 
  } = useMyFeed(filters);

  // 공개 피드 데이터 (비로그인용)
  const { data: communityFeed, isLoading: isLoadingCommunity } = usePublicFeed({ sourceType: 'community_region', limit: 10 });
  const { data: detectiveFeed, isLoading: isLoadingDetective } = usePublicFeed({ sourceType: 'folder', limit: 10 });
  const { data: naverFeed, isLoading: isLoadingNaver } = usePublicFeed({ sourceType: 'naver_folder', limit: 10 });
  const { data: youtubeFeed, isLoading: isLoadingYoutube } = usePublicFeed({ sourceType: 'youtube_channel', limit: 10 });

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
      />
    );
  };

  // 페이지 마운트 시 window 스크롤 초기화
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !hasNextPage || isFetchingNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          fetchNextPage();
        }
      },
      { threshold: 0, rootMargin: '200px' }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) observer.observe(currentTarget);

    return () => {
      if (currentTarget) observer.unobserve(currentTarget);
    };
  }, [isAuthenticated, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const feedItems = data?.pages.flatMap(page => page) || [];

  const activeExtraFilterCount = useMemo(() => {
    let count = 0;
    if (filters.price_min !== null || filters.price_max !== null) count++;
    return count;
  }, [filters]);

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
            <div className="flex items-center gap-1">
              {isAuthenticated && (
                <div className="relative">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="size-10 rounded-full hover:bg-surface-50 dark:hover:bg-surface-900 active:scale-90 transition-transform"
                    onClick={() => {
                      trackEvent("feed_filter_click", { location: "header" });
                      setIsFilterOpen(true);
                    }}
                  >
                    <Filter className="size-5.5 text-surface-900 dark:text-surface-100" />
                  </Button>
                  {activeExtraFilterCount > 0 && (
                    <span className="absolute top-1 right-1 size-4 bg-[#6366F1] rounded-full ring-2 ring-white dark:ring-white dark:ring-surface-950 flex items-center justify-center text-[10px] text-white font-medium animate-in zoom-in">
                      {activeExtraFilterCount}
                    </span>
                  )}
                </div>
              )}
              <button 
                className="p-2 text-surface-400 hover:text-surface-600 transition-colors"
                onClick={() => {
                  trackEvent("feed_settings_click", { location: "header" });
                  navigate("/feature");
                }}
              >
                <Settings className="size-5" />
              </button>
            </div>
          </div>

          {/* 활성 필터 태그 (로그인 시에만) */}
          {isAuthenticated && (filters.price_min !== null || filters.price_max !== null) && (
            <div className="flex items-center gap-2 mt-4 overflow-x-auto overflow-y-hidden scrollbar-hide">
              <button 
                onClick={() => setFilters({ price_min: null, price_max: null })}
                className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface-100 dark:bg-surface-800 text-surface-500 dark:text-surface-400 text-[11px] font-medium shrink-0 hover:bg-surface-200 dark:hover:bg-surface-700 transition-colors"
              >
                <RotateCcw className="size-3" />
                초기화
              </button>
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 text-[11px] font-medium border border-orange-100 dark:border-orange-800/50 shrink-0">
                <span>
                  💰 {filters.price_min === null ? `${filters.price_max! / 10000}만원 이하` : 
                      filters.price_max === null ? `${filters.price_min! / 10000}만원 이상` :
                      `${filters.price_min! / 10000}~${filters.price_max! / 10000}만원`}
                </span>
                <X className="size-3 cursor-pointer opacity-40 hover:opacity-100" onClick={() => {
                  setFilters({ price_min: null, price_max: null });
                }} />
              </div>
            </div>
          )}
        </div>
      </header>

      <main className={cn(
        "flex-1 flex flex-col pt-[80px]",
        isAuthenticated && (filters.price_min !== null || filters.price_max !== null) && "pt-[110px]"
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
            <div className="flex-1 flex flex-col pb-20 bg-white dark:bg-surface-950">
              {feedItems.map((item: any, idx: number) => renderFeedItem(item, idx))}
              
              {hasNextPage && (
                <div ref={observerTarget} className="py-12 flex justify-center">
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
      
      {/* 필터 바텀 시트 */}
      <ExploreFilterSheet
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        filters={filters}
        onApply={(newFilters) => {
          setFilters(prev => ({ ...prev, ...newFilters }));
          setIsFilterOpen(false);
        }}
        onReset={() => setFilters({ price_min: null, price_max: null })}
        totalCount={feedItems.length}
        visibleTabs={["price"]}
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
