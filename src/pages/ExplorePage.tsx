import React, { useState, useEffect, useMemo, useRef } from "react";
import { usePlacePopup } from "@/shared/lib/place-popup";
import { 
  Search, 
  Filter, 
  ChevronDown, 
  X, 
  LayoutGrid,
  List as ListIcon,
  SquareX,
  RotateCcw,
  Loader2
} from "lucide-react";
import { usePlacesByFilters } from "@/entities/place/queries";
import { PlaceCard, ExploreFilterSheet } from "@/widgets";
import { THEMES } from "@/widgets/ExploreFilterSheet/ThemeTab";
import { Button, Input, Skeleton } from "@/shared/ui";
import { cn } from "@/shared/lib/utils";
import { convertToNaverResizeImageUrl } from "@/shared/lib";

/**
 * 탐색 페이지 필터 상태 인터페이스
 */
interface ExplorerFilterState {
  group1: string | null;
  group2: string | null;
  group3: string | null;
  categories: string[] | null;
  features: string[] | null;
  theme_codes: string[] | null;
  rating: number | null;
  exclude_franchises: boolean;
  price_min?: number | null;
  price_max?: number | null;
}

/**
 * 탐색 페이지 컴포넌트
 */
export function ExplorePage() {
  const { show: showPlaceModal } = usePlacePopup();
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [layout, setLayout] = useState<'feed' | 'grid'>('feed');
  
  // 전역 상태 기반 모달: 부모 페이지 재마운트 없이 모달 열기
  const showPopup = (id: string) => showPlaceModal(id);
  
  const defaultFilters: ExplorerFilterState = {
    group1: "서울",
    group2: "중구",
    group3: "",
    categories: [],
    features: [],
    theme_codes: [],
    rating: null,
    exclude_franchises: true,
    price_min: null,
    price_max: null,
  };

  const [filters, setFilters] = useState<ExplorerFilterState>(defaultFilters);

  // 페이지 마운트 시 window 스크롤 초기화
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, []);

  // 필터가 변경될 때마다 스크롤을 최상단으로 이동
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [filters]);

  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    isError,
  } = usePlacesByFilters(filters);

  const observerTarget = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!hasNextPage || isFetchingNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          fetchNextPage();
        }
      },
      { 
        threshold: 0,
        rootMargin: '200px' // 화면 하단 도착 200px 전에 로드 시작
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
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const places = useMemo(() => (data?.pages.flatMap((page) => page) || []) as any[], [data]);

  const resetFilters = () => setFilters(defaultFilters);
  const isInitialLoading = isLoading && places.length === 0;

  const FALLBACK_IMAGE = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`
    <svg width="400" height="600" viewBox="0 0 400 600" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="400" height="600" fill="#F1F5F9"/>
      <rect x="175" y="275" width="50" height="50" rx="8" stroke="#CBD5E1" stroke-width="3"/>
      <path d="M185 285L215 315M215 285L185 315" stroke="#CBD5E1" stroke-width="3" stroke-linecap="round"/>
    </svg>
  `.trim())}`;

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    e.currentTarget.src = FALLBACK_IMAGE;
  };

  // 활성화된 필터 개수 계산 (위치와 기본 카테고리 제외)
  const activeExtraFilterCount = useMemo(() => {
    let count = 0;
    if (filters.theme_codes && filters.theme_codes.length > 0) count += filters.theme_codes.length;
    if (!filters.exclude_franchises) count++;
    if (filters.categories && filters.categories.length > 0) count += filters.categories.length;
    if (filters.price_min !== null || filters.price_max !== null) count++;
    return count;
  }, [filters]);

  // 광역 지역(group1)만 선택되었는지 확인 (구/동 미선택 시 광범위 검색으로 간주)
  const isBroadSearch = useMemo(() => {
    return !!filters.group1 && !filters.group2 && !filters.group3;
  }, [filters.group1, filters.group2, filters.group3]);

  const handleLayoutChange = (newLayout: 'feed' | 'grid') => {
    setLayout(newLayout);
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-surface-950">
      {/* 1. 고정 통합 헤더 (FeaturePage 스타일) */}
      <header className="sticky top-0 z-40 bg-white border-b border-surface-100 dark:bg-surface-950 dark:border-surface-800">
        <div className="max-w-lg mx-auto">
          {/* 상단 헤더 - 타이포 중심 + 우측 아이콘 영역 */}
          <div className="px-5 pt-8 pb-4 flex items-end justify-between">
            <div className="flex flex-col">
              <h1 className="text-xl font-black text-surface-900 dark:text-white relative w-fit">
                탐색
                <div className="absolute -bottom-2 left-0 right-0 h-1 bg-surface-900 dark:bg-white rounded-full" />
              </h1>
              <button 
                onClick={() => setIsFilterOpen(true)}
                className="flex items-center gap-1 mt-2.5 group active:opacity-60 transition-opacity"
              >
                <span className="text-[14px] font-bold text-surface-400 dark:text-surface-500 group-hover:text-surface-900 dark:group-hover:text-white transition-colors">
                  {filters.group2 || filters.group1} {filters.group3 && `· ${filters.group3}`}
                </span>
                <ChevronDown className="size-4 text-surface-300 dark:text-surface-600 group-hover:text-surface-400 dark:group-hover:text-surface-500 transition-colors" />
              </button>
            </div>

            <div className="flex items-center gap-0.5">
              <Button 
                variant="ghost" 
                size="icon" 
                className="size-10 rounded-full hover:bg-surface-50 dark:hover:bg-surface-900 active:scale-90 transition-transform"
                onClick={() => setIsSearchMode(true)}
              >
                <Search className="size-5.5 text-surface-900 dark:text-surface-100" />
              </Button>
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
              
              {/* 레이아웃 전환 버튼 */}
              <div className="flex items-center bg-surface-50 dark:bg-surface-900 p-0.5 rounded-xl ml-1">
                <button 
                  onClick={() => handleLayoutChange('feed')}
                  className={cn(
                    "p-1.5 rounded-lg transition-colors", 
                    layout === 'feed' 
                      ? "bg-white dark:bg-surface-800 shadow-sm text-surface-900 dark:text-white" 
                      : "text-surface-300 dark:text-surface-600"
                  )}
                >
                  <ListIcon className="size-4.5" />
                </button>
                <button 
                  onClick={() => handleLayoutChange('grid')}
                  className={cn(
                    "p-1.5 rounded-lg transition-colors", 
                    layout === 'grid' 
                      ? "bg-white dark:bg-surface-800 shadow-sm text-surface-900 dark:text-white" 
                      : "text-surface-300 dark:text-surface-600"
                  )}
                >
                  <LayoutGrid className="size-4.5" />
                </button>
              </div>
            </div>
          </div>

          {/* 활성 필터 태그 (정리된 스타일) */}
          {(filters.group2 || (filters.categories && filters.categories.length > 0) || (filters.theme_codes && filters.theme_codes.length > 0) || filters.price_min !== null || filters.price_max !== null) && (
            <div className="flex items-center gap-2 px-5 pb-4 overflow-x-auto overflow-y-hidden scrollbar-hide">
              {(activeExtraFilterCount > 1 || (filters.group2 && activeExtraFilterCount > 0)) && (
                <button 
                  onClick={resetFilters}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface-100 dark:bg-surface-800 text-surface-500 dark:text-surface-400 text-[11px] font-bold shrink-0 hover:bg-surface-200 dark:hover:bg-surface-700 transition-colors"
                >
                  <RotateCcw className="size-3" />
                  초기화
                </button>
              )}
              {filters.group2 && (
                <div key={filters.group2} className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-[11px] font-bold border border-blue-100 dark:border-blue-800/50 shrink-0">
                  <span>{filters.group2}</span>
                  <X className="size-3 cursor-pointer opacity-40 hover:opacity-100" onClick={() => {
                    setFilters(prev => ({ ...prev, group2: null }));
                  }} />
                </div>
              )}
              {filters.categories?.map(cat => (
                <div key={cat} className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface-50 dark:bg-surface-900 text-surface-900 dark:text-surface-100 text-[11px] font-bold border border-surface-100 dark:border-surface-800 shrink-0">
                  <span>{cat}</span>
                  <X className="size-3 cursor-pointer opacity-40 hover:opacity-100" onClick={() => {
                    setFilters(prev => ({ ...prev, categories: prev.categories?.filter(c => c !== cat) || [] }));
                  }} />
                </div>
              ))}
              {filters.theme_codes?.map(themeCode => {
                const theme = THEMES.find(t => t.code === themeCode);
                return (
                  <div key={themeCode} className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 text-[11px] font-bold border border-indigo-100 dark:border-indigo-800/50 shrink-0">
                    <span>✨ {theme?.theme_name || themeCode}</span>
                    <X className="size-3 cursor-pointer opacity-40 hover:opacity-100" onClick={() => {
                      setFilters(prev => ({ ...prev, theme_codes: prev.theme_codes?.filter(t => t !== themeCode) || [] }));
                    }} />
                  </div>
                );
              })}
              {(filters.price_min !== null || filters.price_max !== null) && (
                <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 text-[11px] font-bold border border-orange-100 dark:border-orange-800/50 shrink-0">
                  <span>
                    💰 {filters.price_min === null ? `${filters.price_max! / 10000}만원 이하` : 
                        filters.price_max === null ? `${filters.price_min! / 10000}만원 이상` :
                        `${filters.price_min! / 10000}~${filters.price_max! / 10000}만원`}
                  </span>
                  <X className="size-3 cursor-pointer opacity-40 hover:opacity-100" onClick={() => {
                    setFilters(prev => ({ ...prev, price_min: null, price_max: null }));
                  }} />
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      {/* 2. 메인 피드 영역 */}
      <main className="flex-1 w-full max-w-lg mx-auto pb-24 bg-white dark:bg-surface-950 min-h-screen">
        {isInitialLoading ? (
          <div className="space-y-3">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-surface-950">
                {/* 이미지 스켈레톤 */}
                <Skeleton className="aspect-[4/5] w-full" />
                {/* 컨텐츠 스켈레톤 */}
                <div className="px-4 pt-3 pb-4 space-y-3">
                  {/* 액션 버튼 */}
                  <div className="flex items-center gap-4">
                    <Skeleton className="size-6 rounded" />
                    <Skeleton className="size-6 rounded" />
                    <Skeleton className="size-6 rounded" />
                  </div>
                  {/* 장소명 */}
                  <Skeleton className="h-5 w-40" />
                  {/* 위치/별점 */}
                  <Skeleton className="h-4 w-32" />
                  {/* 해시태그 */}
                  <div className="flex gap-2">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-14" />
                  </div>
                </div>
                <div className="h-2 bg-surface-50 dark:bg-surface-900" />
              </div>
            ))}
          </div>
        ) : isError || places.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-40 text-center px-10">
            <div className="size-20 bg-surface-50 dark:bg-surface-900 rounded-full flex items-center justify-center mb-6">
              <Search className="size-10 text-surface-200 dark:text-surface-700" />
            </div>
            <h3 className="text-xl font-bold text-surface-900 dark:text-white mb-2 tracking-tight">
              {isBroadSearch ? "검색 범위를 좁혀보세요" : "찾으시는 장소가 없네요"}
            </h3>
            <p className="text-surface-400 dark:text-surface-500 text-[14px] mb-10 leading-relaxed font-medium">
              {isBroadSearch ? (
                <>
                  {isError ? "검색 범위가 너무 넓어 응답이 지연되고 있습니다." : `광역 지역(${filters.group1}) 전체 검색은 범위가 넓어`}<br />
                  결과를 불러오는 데 시간이 걸릴 수 있습니다.<br />
                  구체적인 지역을 선택해 더 빠르게 탐색해보세요!
                </>
              ) : (
                <>
                  필터나 검색 조건을 변경하여<br />
                  새로운 장소를 발견해보세요.
                </>
              )}
            </p>
            <Button 
              onClick={isBroadSearch ? () => setIsFilterOpen(true) : resetFilters} 
              variant="outline" 
              className="rounded-2xl px-10 h-13 font-bold border-2 border-surface-100 dark:border-surface-800 active:bg-surface-50 dark:active:bg-surface-900"
            >
              {isBroadSearch ? "지역 선택하기" : "조건 초기화"}
            </Button>
          </div>
        ) : (
          <div className={cn(
            layout === 'feed' ? "flex flex-col" : "grid grid-cols-3 gap-0.5 pt-0.5"
          )}>
            {places.map((place) => {
              const folders = (place.features || []).filter((f: any) => f.platform_type === "folder");
              const images = place.images || place.image_urls || (place.thumbnail ? [place.thumbnail] : []);
              const hasImage = images && images.length > 0;
              
              return layout === 'feed' ? (
                <PlaceCard key={place.id} place={place} />
              ) : (
                <div 
                  key={place.id} 
                  className="relative aspect-[3/4] bg-surface-100 dark:bg-surface-900 overflow-hidden active:opacity-80 transition-opacity cursor-pointer group flex items-center justify-center"
                  onClick={() => showPopup(place.id)}
                >
                  {hasImage ? (
                    <img 
                      src={convertToNaverResizeImageUrl(images[0])} 
                      className="w-full h-full object-cover"
                      alt={place.name}
                      loading="lazy"
                      decoding="async"
                      onError={handleImageError}
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-surface-300 dark:text-surface-700">
                      <SquareX className="size-10 stroke-[1.5]" />
                    </div>
                  )}
                  
                  {/* 상단 우측 폴더 갯수 표시 */}
                  {folders.length > 0 && (
                    <div className="absolute top-1.5 right-1.5 z-10">
                      <span className="flex items-center justify-center min-w-[16px] h-[16px] px-1 bg-[#1E8449] text-white text-[9px] font-black rounded-sm shadow-sm">
                        {folders.length}
                      </span>
                    </div>
                  )}

                  {/* 하단 정보 오버레이 */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2 flex flex-col gap-0.5">
                    <span className="text-[10px] text-white/80 font-bold truncate block">
                      {place.group2} {place.group3}
                    </span>
                    <div className="relative inline-block w-fit max-w-full">
                      <span className="text-[13px] text-white font-black truncate block leading-tight">
                        {place.name}
                      </span>
                      {/* 폴더 갯수에 따른 녹색선 */}
                      {folders.length > 0 && (
                        <div 
                          className={cn(
                            "absolute -bottom-0.5 left-0 w-full rounded-full",
                            folders.length >= 15 ? "h-[2.5px] bg-[#1E8449]" :
                            folders.length >= 12 ? "h-[2.2px] bg-[#229954]" :
                            folders.length >= 9 ? "h-[2px] bg-[#27AE60]" :
                            folders.length >= 6 ? "h-[1.8px] bg-[#2ECC71]" :
                            folders.length >= 3 ? "h-[1.5px] bg-[#52BE80]" :
                            "h-[1.2px] bg-[#ABEBC6]"
                          )} 
                        />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {hasNextPage && !isInitialLoading && (
          <div ref={observerTarget} className="p-12 flex justify-center">
            <Loader2 className="size-6 text-surface-300 animate-spin" />
          </div>
        )}
      </main>

      {/* 검색 오버레이 */}
      {isSearchMode && (
        <div className="fixed inset-0 z-[100] bg-white dark:bg-surface-950 flex flex-col">
          <div className="flex items-center gap-3 p-4 border-b border-surface-100 dark:border-surface-800">
            <Button variant="ghost" size="icon" onClick={() => setIsSearchMode(false)}>
              <X className="size-6 text-surface-900 dark:text-white" />
            </Button>
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-surface-300" />
              <Input 
                autoFocus
                placeholder="장소, 메뉴, 지역 검색"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-surface-50 dark:bg-surface-900 border-none h-11 pl-10 rounded-xl font-bold focus-visible:ring-1 focus-visible:ring-surface-200 dark:text-white"
              />
            </div>
          </div>
        </div>
      )}

      {/* 필터 바텀 시트 */}
      <ExploreFilterSheet
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        filters={filters}
        onApply={(newFilters) => {
          setFilters(prev => ({ ...prev, ...newFilters }));
          setIsFilterOpen(false);
        }}
        onReset={resetFilters}
        totalCount={places.length}
      />
    </div>
  );
}
