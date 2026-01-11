import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
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
  Loader2,
  History,
  ChevronLeft
} from "lucide-react";
import { usePlacesByFilters } from "@/entities/place/queries";
import { PlaceCard, ExploreFilterSheet } from "@/widgets";
import { THEMES } from "@/widgets/ExploreFilterSheet/ThemeTab";
import { Button, Input, Skeleton } from "@/shared/ui";
import { cn } from "@/shared/lib/utils";
import { convertToNaverResizeImageUrl } from "@/shared/lib";
import { useSearchHistory } from "@/features/place/lib/useSearchHistory";
import { searchPlaceService } from "@/shared/api/edge-function";
import { placeApi } from "@/entities/place/api";
import type { Place, PlaceSearchSummary } from "@/entities/place/types";
import { useUIStore } from "@/shared/model/ui-store";

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
 * 탐색 페이지 필터 기본 상태
 */
const DEFAULT_FILTERS: ExplorerFilterState = {
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

/**
 * 탐색 페이지 컴포넌트
 */
export function ExplorePage() {
  const { show: showPlaceModal } = usePlacePopup();
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [layout, setLayout] = useState<'feed' | 'grid'>('feed');
  
  // 검색 상태
  const [searchResults, setSearchResults] = useState<Place[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchQueryDisplay, setSearchQueryDisplay] = useState("");
  const [isSearchLoading, setIsSearchLoading] = useState(false);

  const { history, saveToHistory, removeFromHistory, clearHistory } = useSearchHistory();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { setBottomNavVisible } = useUIStore();
  
  // 전역 상태 기반 모달: 부모 페이지 재마운트 없이 모달 열기
  const showPopup = (id: string) => showPlaceModal(id);
  
  const [filters, setFilters] = useState<ExplorerFilterState>(DEFAULT_FILTERS);

  // 검색 모드 또는 검색 결과 표시 중일 때 하단 네비게이션 숨기기
  useEffect(() => {
    if (isSearchMode || isSearching) {
      setBottomNavVisible(false);
    } else {
      setBottomNavVisible(true);
    }
    // 언마운트 시 복구
    return () => setBottomNavVisible(true);
  }, [isSearchMode, isSearching, setBottomNavVisible]);

  // 페이지 마운트 시 window 스크롤 초기화
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, []);

  // 필터가 변경될 때마다 스크롤을 최상단으로 이동
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [filters]);

  // 검색 모드이거나 검색 결과 표시 중일 때는 필터 쿼리 비활성화
  const shouldFetchByFilters = !isSearchMode && !isSearching;
  
  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    isError,
  } = usePlacesByFilters(filters, shouldFetchByFilters);

  const observerTarget = useRef<HTMLDivElement>(null);

  // 무한 스크롤 Observer
  useEffect(() => {
    // 검색 모드이거나 로딩 중, 또는 다음 페이지가 없으면 옵저버 실행 안함
    if (!shouldFetchByFilters || !hasNextPage || isFetchingNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          fetchNextPage();
        }
      },
      { 
        threshold: 0.1,
        rootMargin: '400px' // 여유 있게 미리 로드
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
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, shouldFetchByFilters]);

  const places = useMemo(() => (data?.pages.flatMap((page) => page) || []) as any[], [data]);

  const resetFilters = useCallback(() => setFilters(DEFAULT_FILTERS), []);
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

  const handleSearch = useCallback(async (query: string) => {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) return;

    // 즉시 검색 결과 모드로 전환하고 로딩 표시
    setIsSearching(true);
    setIsSearchMode(false);
    setIsSearchLoading(true);
    setSearchQueryDisplay(trimmedQuery);
    setSearchResults([]); // 이전 결과 초기화
    
    saveToHistory(trimmedQuery);
    window.scrollTo({ top: 0, behavior: 'instant' });

    try {
      const res = await searchPlaceService(trimmedQuery);
      if (!res.error && res.rows) {
        // 중복 ID 제거
        const uniqueIds = [...new Set(res.rows.map((row: PlaceSearchSummary) => row.id))] as string[];
        if (uniqueIds.length > 0) {
          const data = await placeApi.listPlacesByIds(uniqueIds);
          // 중복 place_data 제거 (ID 기준)
          const seenIds = new Set<string>();
          const uniquePlaces = data
            .map(item => item.place_data)
            .filter(place => {
              if (seenIds.has(place.id)) return false;
              seenIds.add(place.id);
              return true;
            });
          setSearchResults(uniquePlaces);
        } else {
          setSearchResults([]);
        }
      } else {
        setSearchResults([]);
      }
    } catch (err) {
      console.error("Search error:", err);
      setSearchResults([]);
    } finally {
      setIsSearchLoading(false);
    }
  }, [saveToHistory]);

  const exitSearchMode = useCallback(() => {
    setIsSearchMode(false);
    setIsSearching(false);
    setSearchResults([]);
    setSearchQuery("");
    setSearchQueryDisplay("");
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  const enterSearchMode = useCallback(() => {
    setIsSearchMode(true);
    setIsSearching(false);
  }, []);

  // 검색 모드 진입 시 포커스
  useEffect(() => {
    if (isSearchMode) {
      // requestAnimationFrame으로 다음 프레임에 포커스
      requestAnimationFrame(() => {
        searchInputRef.current?.focus();
      });
    }
  }, [isSearchMode]);

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-surface-950">
      {/* 1. 고정 통합 헤더 (FeaturePage 스타일) */}
      <header className="sticky top-0 z-40 bg-white border-b border-surface-100 dark:bg-surface-950 dark:border-surface-800">
        <div className="max-w-lg mx-auto">
          {isSearchMode ? (
            /* 검색 모드 헤더 */
            <div className="flex h-14 items-center px-4 gap-2">
              <button 
                onClick={exitSearchMode}
                className="p-1.5 -ml-1.5 rounded-full active:bg-surface-100 dark:active:bg-surface-800"
              >
                <ChevronLeft className="h-6 w-6 text-surface-900 dark:text-white" />
              </button>
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-surface-300 pointer-events-none" />
                <Input 
                  ref={searchInputRef}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSearch(searchQuery);
                  }}
                  placeholder="장소, 메뉴, 지역 검색"
                  className="w-full bg-surface-50 dark:bg-surface-900 border-none h-11 pl-10 pr-10 rounded-xl font-bold focus-visible:ring-0 dark:text-white [-webkit-tap-highlight-color:transparent]"
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full bg-surface-200 dark:bg-surface-700 text-surface-500"
                  >
                    <X className="size-3" />
                  </button>
                )}
              </div>
              <button 
                onClick={() => handleSearch(searchQuery)}
                disabled={!searchQuery.trim() || isSearchLoading}
                className="ml-1 px-3 py-2 font-bold text-primary-600 disabled:text-surface-300"
              >
                {isSearchLoading ? <Loader2 className="size-5 animate-spin" /> : "검색"}
              </button>
            </div>
          ) : (
            /* 일반 모드 헤더 */
            <>
              {/* 상단 헤더 - 타이포 중심 + 우측 아이콘 영역 */}
              <div className="px-5 pt-8 pb-4 flex items-end justify-between">
                <div className="flex flex-col">
                  <h1 className="text-xl font-black text-surface-900 dark:text-white relative w-fit">
                    {isSearching ? "검색 결과" : "탐색"}
                    <div className="absolute -bottom-2 left-0 right-0 h-1 bg-surface-900 dark:bg-white rounded-full" />
                  </h1>
                  {!isSearching && (
                    <button 
                      onClick={() => setIsFilterOpen(true)}
                      className="flex items-center gap-1 mt-2.5 active:opacity-60"
                    >
                      <span className="text-[14px] font-bold text-surface-400 dark:text-surface-500">
                        {filters.group2 || filters.group1} {filters.group3 && `· ${filters.group3}`}
                      </span>
                      <ChevronDown className="size-4 text-surface-300 dark:text-surface-600" />
                    </button>
                  )}
                </div>

                {!isSearching && (
                  <div className="flex items-center gap-0.5">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="size-10 rounded-full active:bg-surface-50 dark:active:bg-surface-900"
                      onClick={enterSearchMode}
                    >
                      <Search className="size-5.5 text-surface-900 dark:text-surface-100" />
                    </Button>
                    <div className="relative">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="size-10 rounded-full active:bg-surface-50 dark:active:bg-surface-900"
                        onClick={() => setIsFilterOpen(true)}
                      >
                        <Filter className="size-5.5 text-surface-900 dark:text-surface-100" />
                      </Button>
                      {activeExtraFilterCount > 0 && (
                        <span className="absolute top-1 right-1 size-4 bg-[#6366F1] rounded-full ring-2 ring-white dark:ring-surface-950 flex items-center justify-center text-[10px] text-white font-bold">
                          {activeExtraFilterCount}
                        </span>
                      )}
                    </div>
                    
                    {/* 레이아웃 전환 버튼 */}
                    <div className="flex items-center bg-surface-50 dark:bg-surface-900 p-0.5 rounded-xl ml-1">
                      <button 
                        onClick={() => handleLayoutChange('feed')}
                        className={cn(
                          "p-1.5 rounded-lg", 
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
                          "p-1.5 rounded-lg", 
                          layout === 'grid' 
                            ? "bg-white dark:bg-surface-800 shadow-sm text-surface-900 dark:text-white" 
                            : "text-surface-300 dark:text-surface-600"
                        )}
                      >
                        <LayoutGrid className="size-4.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* 활성 필터 태그 (정리된 스타일) */}
              {!isSearching && (filters.group2 || (filters.categories && filters.categories.length > 0) || (filters.theme_codes && filters.theme_codes.length > 0) || filters.price_min !== null || filters.price_max !== null) && (
                <div 
                  className="flex items-center gap-2 px-5 pb-4 overflow-x-auto overflow-y-hidden scrollbar-hide"
                  style={{ WebkitOverflowScrolling: 'touch' }}
                >
                  {(activeExtraFilterCount > 1 || (filters.group2 && activeExtraFilterCount > 0)) && (
                    <button 
                      onClick={resetFilters}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface-100 dark:bg-surface-800 text-surface-500 dark:text-surface-400 text-[11px] font-bold shrink-0 active:bg-surface-200 dark:active:bg-surface-700"
                    >
                      <RotateCcw className="size-3" />
                      초기화
                    </button>
                  )}
                  {filters.group2 && (
                    <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-[11px] font-bold border border-blue-100 dark:border-blue-800/50 shrink-0">
                      <span>{filters.group2}</span>
                      <button className="size-3 active:opacity-60" onClick={() => setFilters(prev => ({ ...prev, group2: null }))}>
                        <X className="size-3" />
                      </button>
                    </div>
                  )}
                  {filters.categories?.map(cat => (
                    <div key={`cat-${cat}`} className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface-50 dark:bg-surface-900 text-surface-900 dark:text-surface-100 text-[11px] font-bold border border-surface-100 dark:border-surface-800 shrink-0">
                      <span>{cat}</span>
                      <button className="size-3 active:opacity-60" onClick={() => setFilters(prev => ({ ...prev, categories: prev.categories?.filter(c => c !== cat) || [] }))}>
                        <X className="size-3" />
                      </button>
                    </div>
                  ))}
                  {filters.theme_codes?.map(themeCode => {
                    const theme = THEMES.find(t => t.code === themeCode);
                    return (
                      <div key={`theme-${themeCode}`} className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 text-[11px] font-bold border border-indigo-100 dark:border-indigo-800/50 shrink-0">
                        <span>✨ {theme?.theme_name || themeCode}</span>
                        <button className="size-3 active:opacity-60" onClick={() => setFilters(prev => ({ ...prev, theme_codes: prev.theme_codes?.filter(t => t !== themeCode) || [] }))}>
                          <X className="size-3" />
                        </button>
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
                      <button className="size-3 active:opacity-60" onClick={() => setFilters(prev => ({ ...prev, price_min: null, price_max: null }))}>
                        <X className="size-3" />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </header>

      {/* 2. 메인 피드 영역 */}
      <main className="flex-1 w-full max-w-lg mx-auto pb-24 bg-surface-300 dark:bg-surface-900 min-h-screen">
        {isSearchLoading ? (
          /* 검색 중 로딩 상태 */
          <div className="flex flex-col items-center justify-center py-40 gap-4">
            <Loader2 className="size-10 text-primary-500 animate-spin" />
            <p className="text-surface-400 font-bold">"{searchQueryDisplay}" 검색 중...</p>
          </div>
        ) : isSearchMode ? (
          /* 검색 기록 표시 */
          <div className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[15px] font-black text-surface-900 dark:text-white">최근 검색어</h3>
              {history.length > 0 && (
                <button 
                  onClick={clearHistory}
                  className="text-[12px] font-bold text-surface-400 active:text-surface-600 dark:active:text-surface-200"
                >
                  전체 삭제
                </button>
              )}
            </div>

            {history.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {history.map((item, index) => (
                  <div 
                    key={`history-${index}-${item}`}
                    className="flex items-center gap-1.5 pl-3 pr-2 py-1.5 rounded-full bg-surface-50 dark:bg-surface-900 border border-surface-100 dark:border-surface-800"
                  >
                    <button 
                      onClick={() => {
                        setSearchQuery(item);
                        handleSearch(item);
                      }}
                      className="text-sm font-bold text-surface-700 dark:text-surface-300 active:text-primary-600"
                    >
                      {item}
                    </button>
                    <button 
                      onClick={() => removeFromHistory(item)}
                      className="p-0.5 rounded-full text-surface-300 active:bg-surface-200 dark:active:bg-surface-800"
                    >
                      <X className="size-3" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-surface-300 dark:text-surface-700">
                <History className="size-12 opacity-20 mb-4" />
                <p className="text-sm font-bold">최근 검색 기록이 없습니다.</p>
              </div>
            )}
          </div>
        ) : isSearching ? (
          <>
            {/* 검색 키워드 및 종료 버튼 표시 - 검색 결과가 있을 때만 */}
            {searchResults.length > 0 && (
              <div className="relative mx-4 mb-3 mt-4 overflow-hidden rounded-2xl bg-gradient-to-br from-primary-50 via-white to-surface-50 dark:from-primary-950/30 dark:via-surface-900 dark:to-surface-950 border border-primary-100/50 dark:border-surface-800 shadow-sm">
                {/* 배경 장식 */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary-100/20 dark:bg-primary-900/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                
                <div className="relative p-4 flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    {/* 아이콘 영역 */}
                    <div className="p-2.5 rounded-xl bg-white dark:bg-surface-800 shadow-sm flex-shrink-0 border border-primary-100/50 dark:border-surface-700">
                      <Search className="size-5 text-primary-600 dark:text-primary-400" />
                    </div>
                    
                    {/* 텍스트 영역 */}
                    <div className="flex flex-col gap-2 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-surface-500 dark:text-surface-400 uppercase tracking-wide">
                          검색 결과
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-[10px] font-black">
                          {searchResults.length}개
                        </span>
                      </div>
                      
                      {/* 검색 키워드 - 배지 형태로 강조 */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-surface-800 border border-primary-200/50 dark:border-primary-800/50 shadow-sm">
                          <span className="text-sm font-black text-surface-900 dark:text-white leading-tight">
                            "{searchQueryDisplay}"
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* 종료 버튼 - 우측 상단 */}
                  <button
                    onClick={exitSearchMode}
                    className="flex items-center justify-center size-9 rounded-xl bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-white hover:bg-white dark:hover:bg-surface-800 active:opacity-60 flex-shrink-0 shadow-sm"
                    aria-label="검색 종료"
                  >
                    <X className="size-4.5" />
                  </button>
                </div>
              </div>
            )}
            {searchResults.length > 0 ? (
              <div className={cn(
                layout === 'feed' ? "flex flex-col gap-3" : "grid grid-cols-3 gap-0.5 pt-0.5"
              )}>
                {searchResults.map((place) => {
                  if (layout === 'feed') {
                    return <PlaceCard key={`search-${place.id}`} place={place} />;
                  }
                  
                  const folders = (place.features || []).filter((f: any) => f.platform_type === "folder");
                  const images = place.images || place.image_urls || [];
                  const hasImage = images.length > 0;
                  
                  return (
                    <div 
                      key={`search-${place.id}`}
                      className="relative aspect-[3/4] bg-surface-100 dark:bg-surface-900 overflow-hidden active:opacity-80 cursor-pointer flex items-center justify-center"
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
                        <SquareX className="size-10 stroke-[1.5] text-surface-300 dark:text-surface-700" />
                      )}
                      
                      {folders.length > 0 && (
                        <span className="absolute top-1.5 right-1.5 z-10 flex items-center justify-center min-w-[16px] h-[16px] px-1 bg-[#1E8449] text-white text-[9px] font-black rounded-sm">
                          {folders.length}
                        </span>
                      )}

                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                        <span className="text-[10px] text-white/80 font-bold truncate block">
                          {place.group2} {place.group3}
                        </span>
                        <span className="text-[13px] text-white font-black truncate block leading-tight">
                          {place.name}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-40 text-center px-10">
                <div className="size-20 bg-surface-50 dark:bg-surface-900 rounded-full flex items-center justify-center mb-6">
                  <Search className="size-10 text-surface-200 dark:text-surface-700" />
                </div>
                <h3 className="text-xl font-bold text-surface-900 dark:text-white mb-2 tracking-tight">
                  검색 결과가 없습니다
                </h3>
                <p className="text-surface-400 dark:text-surface-500 text-[14px] mb-10 leading-relaxed font-medium">
                  "{searchQueryDisplay}"에 대한 검색 결과가 없습니다.<br />
                  다른 검색어로 다시 시도해보세요.
                </p>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={enterSearchMode}
                    className="px-8 py-3 rounded-xl text-[15px] font-bold border-2 border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-surface-900 dark:text-white active:bg-surface-50 dark:active:bg-surface-900"
                  >
                    다시 검색하기
                  </button>
                  <button 
                    onClick={exitSearchMode}
                    className="px-8 py-3 rounded-xl text-[15px] font-bold border-2 border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-surface-900 dark:text-white active:bg-surface-50 dark:active:bg-surface-900"
                  >
                    종료
                  </button>
                </div>
              </div>
            )}
          </>
        ) : isInitialLoading ? (
          <div className="flex flex-col gap-3">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-surface-950 shadow-[0_4px_12px_rgba(0,0,0,0.08)] dark:shadow-[0_4px_12px_rgba(0,0,0,0.3)]">
                {/* 이미지 스켈레톤 */}
                <Skeleton className="aspect-[4/3] w-full rounded-none" />
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
            layout === 'feed' ? "flex flex-col gap-3" : "grid grid-cols-3 gap-0.5 pt-0.5"
          )}>
            {places.map((place) => {
              if (layout === 'feed') {
                return <PlaceCard key={`feed-${place.id}`} place={place} />;
              }

              const folders = (place.features || []).filter((f: any) => f.platform_type === "folder");
              const images = place.images || place.image_urls || [];
              const hasImage = images.length > 0;
              
              return (
                <div 
                  key={`grid-${place.id}`}
                  className="relative aspect-[3/4] bg-surface-100 dark:bg-surface-900 overflow-hidden active:opacity-80 cursor-pointer flex items-center justify-center"
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
                    <SquareX className="size-10 stroke-[1.5] text-surface-300 dark:text-surface-700" />
                  )}
                  
                  {folders.length > 0 && (
                    <span className="absolute top-1.5 right-1.5 z-10 flex items-center justify-center min-w-[16px] h-[16px] px-1 bg-[#1E8449] text-white text-[9px] font-black rounded-sm">
                      {folders.length}
                    </span>
                  )}

                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                    <span className="text-[10px] text-white/80 font-bold truncate block">
                      {place.group2} {place.group3}
                    </span>
                    <span className="text-[13px] text-white font-black truncate block leading-tight">
                      {place.name}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {hasNextPage && !isInitialLoading && shouldFetchByFilters && (
          <div ref={observerTarget} className="p-12 flex justify-center">
            <Loader2 className="size-6 text-surface-300 animate-spin" />
          </div>
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
        onReset={resetFilters}
        totalCount={places.length}
      />
    </div>
  );
}
