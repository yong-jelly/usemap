import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { 
  Search, 
  ChevronDown, 
  X, 
  Filter,
  History,
  ChevronLeft,
  Loader2,
  ArrowRight,
  RotateCcw
} from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { RegionSelectSheet } from "@/features/explorer/ui/RegionSelectSheet";
import { DistrictChips } from "@/features/explorer/ui/DistrictChips";
import { useSearchHistory } from "@/features/place/lib/useSearchHistory";
import { PlaceThumbnail } from "@/shared/ui/place/PlaceThumbnail";
import { usePlacePopup } from "@/shared/lib/place-popup";
import { ExploreFilterSheet } from "@/widgets/ExploreFilterSheet";
import { getPriceLabel, getThemeNameByCode } from "@/shared/config/filter-constants";
import { usePlacesByFilters } from "@/entities/place/queries";
import { searchPlaceService } from "@/shared/api/edge-function";
import { placeApi } from "@/entities/place/api";
import type { Place, PlaceSearchSummary } from "@/entities/place/types";
import { useUIStore } from "@/shared/model/ui-store";
import { Button } from "@/shared/ui";
import { trackEvent } from "@/shared/lib/gtm";

// 필터 상태 인터페이스
interface ExplorerFilterState {
  group1: string | null;
  group2: string | null;
  group3: string | null;
  categories: string[] | null;
  theme_codes: string[] | null;
  price_min: number | null;
  price_max: number | null;
  exclude_franchises: boolean;
}

// 기본 필터 상태
const DEFAULT_FILTERS: ExplorerFilterState = {
  group1: "서울",
  group2: "전체",
  group3: null,
  categories: [],
  theme_codes: [],
  price_min: null,
  price_max: null,
  exclude_franchises: true,
};

/**
 * 탐색 페이지 (Explorer) - 검색 및 필터 강화 버전
 */
export function ExplorerPage() {
  const { show: showPlaceModal } = usePlacePopup();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchQueryDisplay, setSearchQueryDisplay] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [isRegionSheetOpen, setIsRegionSheetOpen] = useState(false);
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  
  const [filters, setFilters] = useState<ExplorerFilterState>(DEFAULT_FILTERS);
  const [searchResults, setSearchResults] = useState<Place[]>([]);
  
  const { history, saveToHistory, clearHistory, removeFromHistory } = useSearchHistory();
  const { setBottomNavVisible } = useUIStore();
  const inputRef = useRef<HTMLInputElement>(null);
  const observerTarget = useRef<HTMLDivElement>(null);

  // 검색 모드 또는 결과 표시 중일 때 하단 네비게이션 숨기기
  useEffect(() => {
    if (isSearchFocused || isSearching) {
      setBottomNavVisible(false);
    } else {
      setBottomNavVisible(true);
    }
    return () => setBottomNavVisible(true);
  }, [isSearchFocused, isSearching, setBottomNavVisible]);

  // 조건 변경 시 스크롤 최상단 이동 (모션 없이)
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [filters, isSearching]);

  // 활성화된 추가 필터 개수 (지역 제외)
  const activeExtraFilterCount = useMemo(() => {
    let count = 0;
    if (filters.categories && filters.categories.length > 0) count += filters.categories.length;
    if (filters.theme_codes && filters.theme_codes.length > 0) count += filters.theme_codes.length;
    if (filters.price_min !== null || filters.price_max !== null) count++;
    return count;
  }, [filters]);

  // 검색 결과 표시 중이 아닐 때만 필터 기반 데이터 호출
  const shouldFetchByFilters = !isSearching;
  
  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    isError
  } = usePlacesByFilters({
    ...filters,
    group2: filters.group2 === "전체" ? null : filters.group2
  }, shouldFetchByFilters);

  const places = useMemo(() => (data?.pages.flatMap((page) => page) || []) as Place[], [data]);

  // 무한 스크롤 Observer
  useEffect(() => {
    if (!shouldFetchByFilters || !hasNextPage || isFetchingNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          fetchNextPage();
        }
      },
      { threshold: 0.1, rootMargin: '400px' }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) observer.observe(currentTarget);
    return () => {
      if (currentTarget) observer.unobserve(currentTarget);
    };
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, shouldFetchByFilters]);

  // 텍스트 검색 처리
  const handleSearch = useCallback(async (query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return;
    
    setSearchQuery(trimmed);
    setSearchQueryDisplay(trimmed);
    saveToHistory(trimmed);
    setIsSearchFocused(false);
    setIsSearching(true);
    setIsSearchLoading(true);
    setSearchResults([]);

    window.scrollTo({ top: 0, behavior: 'instant' });
    trackEvent("explorer_search_execute", { query: trimmed });

    try {
      const res = await searchPlaceService(trimmed);
      if (!res.error && res.rows) {
        const uniqueIds = [...new Set(res.rows.map((row: PlaceSearchSummary) => row.id))] as string[];
        if (uniqueIds.length > 0) {
          const data = await placeApi.listPlacesByIds(uniqueIds);
          const seenIds = new Set<string>();
          const uniquePlaces = data
            .map(item => item.place_data)
            .filter(place => {
              if (seenIds.has(place.id)) return false;
              seenIds.add(place.id);
              return true;
            });
          setSearchResults(uniquePlaces);
        }
      }
    } catch (err) {
      console.error("Search error:", err);
    } finally {
      setIsSearchLoading(false);
    }
  }, [saveToHistory]);

  const exitSearch = () => {
    setIsSearching(false);
    setIsSearchFocused(false);
    setSearchQuery("");
    setSearchQueryDisplay("");
    setSearchResults([]);
    // 검색 종료 시 지역 필터를 "전체"로 초기화
    setFilters(prev => ({ ...prev, group2: "전체" }));
  };

  const handleFilterApply = (newFilters: any) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setIsFilterSheetOpen(false);
    trackEvent("explorer_filter_apply", newFilters);
  };

  const handleFilterReset = () => {
    setFilters(DEFAULT_FILTERS);
    setIsFilterSheetOpen(false);
    trackEvent("explorer_filter_reset", {});
  };

  return (
    <div className="flex flex-col min-h-dvh bg-white dark:bg-surface-950">
      {/* --- 통합 고정 헤더 --- */}
      <header className={cn(
        "fixed top-0 inset-x-0 z-50 bg-white dark:bg-surface-950 border-b border-surface-100 dark:border-surface-800 transition-all duration-300",
        isSearching ? "h-[64px]" : "h-[109px]"
      )}>
        <div className="max-w-lg mx-auto flex flex-col h-full">
          {/* 상단: 검색 영역 */}
          <div className="h-[64px] flex items-center px-5 gap-3">
            {isSearching && (
              <button onClick={exitSearch} className="mr-1 active:scale-90 transition-transform">
                <ChevronLeft className="size-6 text-surface-900 dark:text-white" />
              </button>
            )}
            <div 
              onClick={() => {
                setIsSearchFocused(true);
                setTimeout(() => inputRef.current?.focus(), 50);
              }}
              className="flex-1 flex items-center h-11 rounded-xl bg-surface-50 dark:bg-surface-900 px-4 transition-all cursor-pointer overflow-hidden"
            >
              <Search className="size-4 text-surface-400 stroke-[2.5px] shrink-0" />
              <div className="flex-1 flex items-center gap-2 ml-3 overflow-hidden">
                {activeExtraFilterCount > 0 && !searchQueryDisplay && !isSearching && (() => {
                  const parts: string[] = [];
                  const cats = filters.categories || [];
                  if (cats.length === 1) parts.push(cats[0]);
                  else if (cats.length > 1) parts.push(`${cats[0]} +${cats.length - 1}`);
                  
                  const themes = filters.theme_codes || [];
                  if (themes.length > 0) parts.push(themes.map(getThemeNameByCode).join(", "));
                  
                  const priceLabel = getPriceLabel(filters.price_min, filters.price_max);
                  if (priceLabel) parts.push(priceLabel);
                  
                  const summaryText = parts.join(", ");
                  
                  return (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 text-[12px] font-medium shrink-0 max-w-[200px]">
                      <span className="truncate">{summaryText}</span>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleFilterReset(); }}
                        className="hover:bg-primary-200 dark:hover:bg-primary-800 rounded-full p-0.5 transition-colors shrink-0"
                      >
                        <X className="size-3" />
                      </button>
                    </div>
                  );
                })()}
                <span className={cn(
                  "text-[14px] truncate",
                  searchQueryDisplay ? "text-surface-900 dark:text-white" : "text-surface-400"
                )}>
                  {searchQueryDisplay || "지역과 함께 음식점을 검색하면 더 정확한 결과를 얻을 수 있어요."}
                </span>
              </div>
              {searchQueryDisplay && (
                <button 
                  onClick={(e) => { e.stopPropagation(); exitSearch(); }}
                  className="ml-auto size-5 flex items-center justify-center rounded-full bg-surface-200 dark:bg-surface-700"
                >
                  <X className="size-3 text-white" />
                </button>
              )}
            </div>
            {!isSearching && (
              <div className="relative">
                <button 
                  onClick={() => setIsFilterSheetOpen(true)}
                  className={cn(
                    "size-11 rounded-xl border flex items-center justify-center shrink-0 transition-colors",
                    activeExtraFilterCount > 0 
                      ? "bg-primary-50 border-primary-200 text-primary-600 dark:bg-primary-900 dark:border-primary-800 dark:text-primary-400" 
                      : "bg-white border-surface-100 text-surface-600 dark:bg-surface-950 dark:border-surface-800 dark:text-surface-300 active:bg-surface-50"
                  )}
                >
                  <Filter className="size-5" />
                </button>
                {activeExtraFilterCount > 0 && (
                  <div className="absolute -top-1 -right-1 size-4 bg-primary-600 rounded-full flex items-center justify-center text-[9px] font-black text-white ring-2 ring-white dark:ring-surface-950">
                    {activeExtraFilterCount}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 하단: 지역 필터 영역 */}
          {!isSearching && (
            <div className="h-11 flex items-center border-t border-surface-50 dark:border-surface-900 relative">
              <button 
                onClick={() => setIsRegionSheetOpen(true)}
                className="flex items-center gap-1.5 pl-6 pr-5 h-full border-r border-surface-50 dark:border-surface-900 text-[14px] text-surface-900 dark:text-white shrink-0 active:bg-surface-50 transition-colors bg-white dark:bg-surface-950 z-10"
              >
                {filters.group1} <ChevronDown className="ml-0.5 size-4 text-surface-500 stroke-[3px]" />
              </button>
              <DistrictChips 
                selectedGroup1={filters.group1} 
                selectedGroup2={filters.group2} 
                onSelect={(g2) => setFilters(prev => ({ ...prev, group2: g2 }))} 
              />
            </div>
          )}
        </div>
      </header>

      {/* --- 검색 포커스 모드 (History) --- */}
      {isSearchFocused && (
        <div className="fixed inset-0 z-[60] bg-white dark:bg-surface-950 p-0 flex flex-col">
          <div className="max-w-lg mx-auto w-full flex flex-col h-full bg-white dark:bg-surface-950">
            <div className="h-[64px] flex items-center px-4 gap-2 border-b border-surface-50 dark:border-surface-900">
              <button 
                onClick={() => setIsSearchFocused(false)}
                className="p-1.5 -ml-1 rounded-full active:bg-surface-100 dark:active:bg-surface-800 transition-colors"
              >
                <ChevronLeft className="size-6 text-surface-900 dark:text-white" />
              </button>
              <div className="flex-1 relative flex items-center">
                <Search className="absolute left-4 size-4 text-surface-300 stroke-[2px]" />
                <input 
                  ref={inputRef}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch(searchQuery)}
                  placeholder="장소, 메뉴, 분위기 검색"
                  className="w-full h-11 pl-11 pr-10 rounded-xl bg-surface-50 dark:bg-surface-900 border-none text-[16px] outline-none"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery("")} className="absolute right-3 size-5 flex items-center justify-center rounded-full bg-surface-200">
                    <X className="size-3 text-white" />
                  </button>
                )}
              </div>
              <button 
                onClick={() => handleSearch(searchQuery)}
                disabled={!searchQuery.trim()}
                className="ml-1 px-2 py-2 font-medium text-primary-600 disabled:text-surface-300 text-[15px]"
              >
                검색
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-10">
              <div>
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-[15px] font-medium text-surface-900 dark:text-white">최근 검색어</h3>
                  {history.length > 0 && (
                    <button 
                      onClick={clearHistory} 
                      className="text-[12px] font-medium text-surface-400 active:text-surface-600 dark:active:text-surface-200"
                    >
                      전체 삭제
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {history.length > 0 ? (
                    history.slice(0, 10).map((h, i) => (
                      <div 
                        key={i} 
                        className="flex items-center gap-1.5 pl-4 pr-3 py-2 rounded-full bg-surface-50 dark:bg-surface-900 border border-surface-100 dark:border-surface-800"
                      >
                        <button 
                          onClick={() => {
                            setSearchQuery(h);
                            inputRef.current?.focus();
                          }}
                          className="text-sm font-medium text-surface-700 dark:text-surface-300"
                        >
                          {h}
                        </button>
                        <button 
                          onClick={() => removeFromHistory(h)}
                          className="p-0.5 rounded-full text-surface-300 hover:text-surface-500 transition-colors"
                        >
                          <X className="size-3.5" />
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="w-full flex flex-col items-center justify-center py-10 text-surface-200 dark:text-surface-700">
                      <History className="size-10 opacity-20 mb-3" />
                      <p className="text-sm font-medium">최근 검색 기록이 없습니다.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- 메인 콘텐츠 --- */}
      <main className={cn(
        "flex-1 w-full max-w-lg mx-auto pb-20",
        isSearching ? "pt-[64px]" : "pt-[109px]"
      )}>
        {isSearchLoading || (isLoading && places.length === 0) ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="size-8 text-primary-500 animate-spin" />
            <p className="text-[14px] font-bold text-surface-300 animate-pulse">
              {isSearching ? `"${searchQueryDisplay}" 검색 결과를 가져오고 있어요` : "장소를 불러오고 있어요"}
            </p>
          </div>
        ) : (isError || (!isSearching && places.length === 0) || (isSearching && searchResults.length === 0)) ? (
          <div className="flex flex-col items-center justify-center py-40 text-center px-10">
            <div className="size-20 bg-surface-50 dark:bg-surface-900 rounded-full flex items-center justify-center mb-6">
              <Search className="size-10 text-surface-200 dark:text-surface-700" />
            </div>
            <h3 className="text-xl font-medium text-surface-900 dark:text-white mb-2 tracking-tight">
              결과가 없습니다
            </h3>
            <p className="text-surface-400 dark:text-surface-500 text-[14px] mb-10 leading-relaxed font-medium">
              필터나 검색 조건을 변경하여<br />
              새로운 장소를 발견해보세요.
            </p>
            <Button 
              onClick={handleFilterReset} 
              variant="outline" 
              className="rounded-2xl px-10 h-13 font-medium border-2 border-surface-100 dark:border-surface-800"
            >
              조건 초기화
            </Button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-0.5 pt-0.5">
              {(isSearching ? searchResults : places).map((place) => (
                <PlaceThumbnail
                  key={place.id}
                  placeId={place.id}
                  name={place.name}
                  thumbnail={place.images?.[0] || place.image_urls?.[0] || place.place_images?.[0]}
                  group2={place.group2}
                  group3={place.group3}
                  category={place.category}
                  features={place.features}
                  interaction={place.interaction}
                  onClick={showPlaceModal}
                  aspectRatio="aspect-[3/4]"
                  showBadge={true}
                  showCounts={true}
                />
              ))}
            </div>
            {hasNextPage && !isSearching && (
              <div ref={observerTarget} className="p-12 flex justify-center">
                <Loader2 className="size-6 text-surface-300 animate-spin" />
              </div>
            )}
          </>
        )}
      </main>

      {/* 지역 선택 바텀 시트 */}
      <RegionSelectSheet 
        isOpen={isRegionSheetOpen}
        onClose={() => setIsRegionSheetOpen(false)}
        onSelect={(group1) => {
          setFilters(prev => ({ ...prev, group1, group2: "전체" }));
        }}
        selectedGroup1={filters.group1}
      />

      {/* 공용 필터 바텀 시트 */}
      <ExploreFilterSheet 
        isOpen={isFilterSheetOpen}
        onClose={() => setIsFilterSheetOpen(false)}
        filters={filters}
        onApply={handleFilterApply}
        onReset={handleFilterReset}
        totalCount={isSearching ? searchResults.length : places.length}
      />
    </div>
  );
}
