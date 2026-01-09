import { useRef, useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router";
import { useMyFeed } from "@/entities/folder/queries";
import { usePlacePopup } from "@/shared/lib/place-popup";
import { PlaceCard, ExploreFilterSheet } from "@/widgets";
import { Loader2, Bell, Settings, Filter, X, RotateCcw } from "lucide-react";
import { useUserStore } from "@/entities/user";
import { useAuthModalStore } from "@/features/auth/model/useAuthModalStore";
import { cn, formatRelativeTime } from "@/shared/lib/utils";
import { Button } from "@/shared/ui";

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

  const observerTarget = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!hasNextPage || isFetchingNextPage) return;

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
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100dvh-56px)] p-6 text-center gap-6 bg-white dark:bg-surface-950">
        <div className="p-6 rounded-full bg-surface-50 dark:bg-surface-900">
          <Bell className="size-12 text-surface-200" />
        </div>
        <div>
          <h2 className="text-2xl font-black text-surface-900 dark:text-white">나만의 소식을 확인하세요</h2>
          <p className="text-surface-500 mt-2">구독한 폴더와 채널의 새로운 맛집 소식을<br />피드에서 받아볼 수 있습니다.</p>
        </div>
        <button 
          onClick={openLogin}
          className="w-full max-w-xs h-14 rounded-2xl bg-primary-500 text-white font-black text-lg shadow-soft-lg active:scale-95 transition-all"
        >
          로그인하고 시작하기
        </button>
      </div>
    );
  }

  const feedItems = data?.pages.flatMap(page => page) || [];

  const activeExtraFilterCount = useMemo(() => {
    let count = 0;
    if (filters.price_min !== null || filters.price_max !== null) count++;
    return count;
  }, [filters]);

  const communityMap: Record<string, string> = {
    'clien.net': '클리앙',
    'm': '클리앙',
    'damoang.net': '다모앙',
    'bobaedream.co.kr': '보배드림',
    'co.kr': '보배드림',
    'bluer': '블루리본',
  };

  return (
    <div 
      className="flex flex-col min-h-screen bg-white dark:bg-surface-950"
    >
      {/* 상단 헤더 - 타이포 중심 */}
      <header className="sticky top-0 z-50 bg-white dark:bg-surface-950 border-b border-surface-100 dark:border-surface-800">
        <div className="px-5 pt-8 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <h1 className="text-xl font-black text-surface-900 dark:text-white relative">
                피드
                <div className="absolute -bottom-2 left-0 right-0 h-1 bg-surface-900 dark:bg-white rounded-full" />
              </h1>
            </div>
            <div className="flex items-center gap-1">
              <div className="relative">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="size-10 rounded-full hover:bg-surface-50 dark:hover:bg-surface-900 active:scale-90 transition-transform"
                  onClick={() => setIsFilterOpen(true)}
                >
                  <Filter className="size-5.5 text-surface-900 dark:text-surface-100" />
                </Button>
                {activeExtraFilterCount > 0 && (
                  <span className="absolute top-1 right-1 size-4 bg-[#6366F1] rounded-full ring-2 ring-white dark:ring-surface-950 flex items-center justify-center text-[10px] text-white font-bold animate-in zoom-in">
                    {activeExtraFilterCount}
                  </span>
                )}
              </div>
              <button className="p-2 text-surface-400">
                <Settings className="size-5" />
              </button>
            </div>
          </div>

          {/* 활성 필터 태그 */}
          {(filters.price_min !== null || filters.price_max !== null) && (
            <div className="flex items-center gap-2 mt-4 overflow-x-auto overflow-y-hidden scrollbar-hide">
              <button 
                onClick={() => setFilters({ price_min: null, price_max: null })}
                className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface-100 dark:bg-surface-800 text-surface-500 dark:text-surface-400 text-[11px] font-bold shrink-0 hover:bg-surface-200 dark:hover:bg-surface-700 transition-colors"
              >
                <RotateCcw className="size-3" />
                초기화
              </button>
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 text-[11px] font-bold border border-orange-100 dark:border-orange-800/50 shrink-0">
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

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="size-8 animate-spin text-surface-300" />
        </div>
      ) : feedItems.length > 0 ? (
        <div className="flex-1 flex flex-col pb-20">
          {feedItems.map((item: any, idx: number) => {
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

            if (item.source_type === 'community_region' && sourceTitle?.includes('|')) {
              const [domain, region] = sourceTitle.split('|');
              const communityName = communityMap[domain] || domain;
              sourceLabel = `커뮤니티 > ${communityName}`;
              sourceTitle = region;
            }

            return (
              <PlaceCard 
                key={`${item.source_id}-${item.place_id}-${idx}`}
                place={item.place_data}
                sourceLabel={sourceLabel}
                sourceTitle={sourceTitle}
                sourcePath={sourcePath || undefined}
                addedAt={formatRelativeTime(item.added_at)}
                showPrice={true}
              />
            );
          })}
          
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
            <p className="text-lg font-bold text-surface-900 dark:text-white">아직 새로운 소식이 없습니다</p>
            <p className="text-sm text-surface-500 mt-1">맛탐정 탭에서 관심 있는 폴더를 구독해보세요!</p>
          </div>
          <button 
            onClick={() => navigate("/feature/detective")}
            className="mt-2 px-6 py-3 rounded-xl bg-surface-900 text-white dark:bg-white dark:text-black font-bold text-sm"
          >
            맛탐정 보러가기
          </button>
        </div>
      )}
      
      {/* 바텀 내비게이션 여백 */}
      <div className="h-14" />

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
