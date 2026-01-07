import { useState, useMemo, useEffect, useRef } from "react";
import { 
  Search, 
  Filter, 
  ChevronDown, 
  X, 
  LayoutGrid,
  List as ListIcon,
  SquareX,
  Loader2
} from "lucide-react";
import { usePlacesByFilters } from "@/entities/place/queries";
import { PlaceCard, ExploreFilterSheet } from "@/widgets";
import { Button, Input, Skeleton } from "@/shared/ui";
import { cn } from "@/shared/lib/utils";
import { convertToNaverResizeImageUrl } from "@/shared/lib";
import { usePlacePopup } from "@/shared/lib/place-popup";

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
  price_max?: number;
}

/**
 * 탐색 페이지 컴포넌트
 */
export function ExplorePage() {
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [layout, setLayout] = useState<'feed' | 'grid'>('feed');
  const showPopup = usePlacePopup((state) => state.show);
  
  const defaultFilters: ExplorerFilterState = {
    group1: "서울",
    group2: "중구",
    group3: "태평로1가",
    categories: [],
    features: [],
    theme_codes: [],
    rating: null,
    exclude_franchises: true,
  };

  const [filters, setFilters] = useState<ExplorerFilterState>(defaultFilters);

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
    return count;
  }, [filters]);

  const handleLayoutChange = (newLayout: 'feed' | 'grid') => {
    setLayout(newLayout);
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* 1. 고정 통합 헤더 (SNS 스타일) */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-surface-100 transition-all">
        <div className="max-w-lg mx-auto">
          {/* 타이틀 및 메인 액션 바 */}
          <div className="flex items-center justify-between px-5 py-4">
            <div className="flex flex-col">
              <h1 className="text-2xl font-black text-surface-950 tracking-tight">탐색</h1>
              <button 
                onClick={() => setIsFilterOpen(true)}
                className="flex items-center gap-1 mt-0.5 group active:opacity-60 transition-opacity"
              >
                <span className="text-[13px] font-bold text-surface-400 group-hover:text-surface-900 transition-colors">
                  {filters.group2 || filters.group1} {filters.group3 && `· ${filters.group3}`}
                </span>
                <ChevronDown className="size-3.5 text-surface-300" />
              </button>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="flex items-center bg-surface-50 p-1 rounded-xl">
                <button 
                  onClick={() => handleLayoutChange('feed')}
                  className={cn(
                    "p-1.5 rounded-lg transition-all", 
                    layout === 'feed' ? "bg-white shadow-sm text-surface-900" : "text-surface-300"
                  )}
                >
                  <ListIcon className="size-4.5" />
                </button>
                <button 
                  onClick={() => handleLayoutChange('grid')}
                  className={cn(
                    "p-1.5 rounded-lg transition-all", 
                    layout === 'grid' ? "bg-white shadow-sm text-surface-900" : "text-surface-300"
                  )}
                >
                  <LayoutGrid className="size-4.5" />
                </button>
              </div>
              
              <div className="flex items-center gap-1 border-l border-surface-100 ml-1 pl-3">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="size-10 rounded-full hover:bg-surface-50 active:scale-90 transition-transform"
                  onClick={() => setIsSearchMode(true)}
                >
                  <Search className="size-5.5 text-surface-900" />
                </Button>
                <div className="relative">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="size-10 rounded-full hover:bg-surface-50 active:scale-90 transition-transform"
                    onClick={() => setIsFilterOpen(true)}
                  >
                    <Filter className="size-5.5 text-surface-900" />
                  </Button>
                  {activeExtraFilterCount > 0 && (
                    <span className="absolute top-1 right-1 size-2 bg-[#6366F1] rounded-full ring-2 ring-white animate-in zoom-in" />
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 활성 필터 태그 (조건이 있을 때만 미세하게 노출) */}
          {(filters.group2 || (filters.categories && filters.categories.length > 0) || (filters.theme_codes && filters.theme_codes.length > 0)) && (
            <div className="flex items-center gap-2 px-5 pb-4 overflow-x-auto scrollbar-hide">
              {filters.group2 && (
                <div key={filters.group2} className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 text-[11px] font-bold border border-blue-100">
                  <span>{filters.group2}</span>
                  <X className="size-3 cursor-pointer opacity-40 hover:opacity-100" onClick={() => {
                    setFilters(prev => ({ ...prev, group2: null }));
                  }} />
                </div>
              )}
              {filters.categories?.map(cat => (
                <div key={cat} className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface-50 text-surface-900 text-[11px] font-bold border border-surface-100">
                  <span>{cat}</span>
                  <X className="size-3 cursor-pointer opacity-40 hover:opacity-100" onClick={() => {
                    setFilters(prev => ({ ...prev, categories: prev.categories?.filter(c => c !== cat) || [] }));
                  }} />
                </div>
              ))}
              {filters.theme_codes?.map(themeCode => (
                <div key={themeCode} className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-600 text-[11px] font-bold border border-indigo-100">
                  <span>✨ {themeCode}</span>
                  <X className="size-3 cursor-pointer opacity-40 hover:opacity-100" onClick={() => {
                    setFilters(prev => ({ ...prev, theme_codes: prev.theme_codes?.filter(t => t !== themeCode) || [] }));
                  }} />
                </div>
              ))}
            </div>
          )}
        </div>
      </header>

      {/* 2. 메인 피드 영역 */}
      <main className="flex-1 w-full max-w-lg mx-auto pb-24 bg-white min-h-screen">
        {isInitialLoading ? (
          <div className="space-y-8 mt-10 px-5">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="space-y-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="size-10 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-3 w-40" />
                  </div>
                </div>
                <Skeleton className="aspect-square w-full rounded-2xl" />
              </div>
            ))}
          </div>
        ) : isError || places.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-40 text-center px-10">
            <div className="size-20 bg-surface-50 rounded-full flex items-center justify-center mb-6">
              <Search className="size-10 text-surface-200" />
            </div>
            <h3 className="text-xl font-bold text-surface-900 mb-2 tracking-tight">
              찾으시는 장소가 없네요
            </h3>
            <p className="text-surface-400 text-[14px] mb-10 leading-relaxed font-medium">
              필터나 검색 조건을 변경하여<br />새로운 장소를 발견해보세요.
            </p>
            <Button 
              onClick={resetFilters} 
              variant="outline" 
              className="rounded-2xl px-10 h-13 font-bold border-2 border-surface-100 active:bg-surface-50"
            >
              조건 초기화
            </Button>
          </div>
        ) : (
          <div className={cn(
            layout === 'feed' ? "flex flex-col pt-4" : "grid grid-cols-3 gap-0.5 pt-0.5"
          )}>
            {places.map((place) => {
              const folders = (place.features || []).filter((f: any) => f.platform_type === "folder");
              const hasImage = place.images && place.images.length > 0;
              
              return layout === 'feed' ? (
                <PlaceCard key={place.id} place={place} />
              ) : (
                <div 
                  key={place.id} 
                  className="relative aspect-[3/4] bg-surface-100 overflow-hidden active:opacity-80 transition-opacity cursor-pointer group flex items-center justify-center"
                  onClick={() => showPopup(place.id)}
                >
                  {hasImage ? (
                    <img 
                      src={convertToNaverResizeImageUrl(place.images?.[0])} 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      alt={place.name}
                      loading="lazy"
                      onError={handleImageError}
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-surface-300">
                      <SquareX className="size-10 stroke-[1.5]" />
                    </div>
                  )}
                  
                  {/* 상단 우측 폴더 갯수 표시 */}
                  {folders.length > 0 && (
                    <div className="absolute top-1.5 right-1.5 z-10">
                      <span className="flex items-center justify-center min-w-[16px] h-[16px] px-1 bg-[#1E8449]/90 text-white text-[9px] font-black rounded-sm backdrop-blur-sm shadow-sm">
                        {folders.length}
                      </span>
                    </div>
                  )}

                  {/* 하단 정보 오버레이 (blur 처리) */}
                  <div className="absolute bottom-0 left-0 right-0 bg-black/40 backdrop-blur-[2px] p-2 flex flex-col gap-0.5">
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
        <div className="fixed inset-0 z-[100] bg-white flex flex-col">
          <div className="flex items-center gap-3 p-4 border-b border-surface-100">
            <Button variant="ghost" size="icon" onClick={() => setIsSearchMode(false)}>
              <X className="size-6 text-surface-900" />
            </Button>
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-surface-300" />
              <Input 
                autoFocus
                placeholder="장소, 메뉴, 지역 검색"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-surface-50 border-none h-11 pl-10 rounded-xl font-bold focus-visible:ring-1 focus-visible:ring-surface-200"
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
