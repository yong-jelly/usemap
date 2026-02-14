import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useIntersection } from "@/shared/lib/use-intersection";
import { useNavigate } from "react-router";
import { 
  Search, 
  Filter, 
  ChevronLeft, 
  X, 
  History,
  Loader2
} from "lucide-react";

/**
 * 검색 포커스 오버레이 - 입력 시 SearchPage 전체 리렌더 방지로 키보드 딜레이 완화
 */
function SearchFocusOverlay({
  onSearch,
  onBack,
  history,
  clearHistory,
  removeFromHistory,
}: {
  onSearch: (query: string) => void;
  onBack: () => void;
  history: string[];
  clearHistory: () => void;
  removeFromHistory: (item: string) => void;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <div className="fixed inset-0 z-[60] bg-white dark:bg-surface-950 p-0 flex flex-col">
      <div className="max-w-lg mx-auto w-full flex flex-col h-full bg-white dark:bg-surface-950">
        <div className="h-[72px] flex items-center px-5 gap-4 border-b border-surface-50 dark:border-surface-900">
          <button 
            onClick={onBack}
            className="p-2 -ml-2 active:scale-90 transition-transform"
          >
            <ChevronLeft className="size-6 text-surface-900 dark:text-white" />
          </button>
          <div className="flex-1 relative flex items-center">
            <Search className="absolute left-4 size-4 text-surface-300 stroke-[2px]" />
            <input 
              ref={inputRef}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && searchQuery.trim() && onSearch(searchQuery.trim())}
              placeholder="지역과 음식점 검색"
              className="w-full h-12 pl-11 pr-10 rounded-xl bg-surface-50 dark:bg-surface-900 border-none text-[16px] outline-none"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="absolute right-3 p-1 rounded-full bg-surface-200">
                <X className="size-3 text-white" />
              </button>
            )}
          </div>
          <button 
            onClick={() => searchQuery.trim() && onSearch(searchQuery.trim())}
            disabled={!searchQuery.trim()}
            className="text-sm font-medium text-primary-600 disabled:text-surface-300"
          >
            검색
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-10">
          <div>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <History className="size-4 text-surface-400" />
                <h3 className="text-xs font-medium text-surface-400 uppercase tracking-widest">최근 검색어</h3>
              </div>
              {history.length > 0 && (
                <button 
                  onClick={clearHistory} 
                  className="text-[11px] font-medium text-surface-400 uppercase tracking-tight"
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
                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-surface-50 dark:bg-surface-900 border border-surface-100 dark:border-surface-800"
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
                      className="text-[10px] text-surface-300 font-bold"
                    >
                      ×
                    </button>
                  </div>
                ))
              ) : (
                <div className="w-full flex flex-col items-center justify-center py-10">
                  <p className="text-sm text-surface-300 font-medium">최근 검색 기록이 없습니다.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
import { useMyAndPublicFolders } from "@/entities/folder/queries";
import { BottomNav } from "@/widgets/BottomNav";
import { PlaceCard } from "@/widgets/PlaceCard";
import { cn, getAvatarUrl, formatRelativeTime } from "@/shared/lib/utils";
import { useSearchHistory } from "@/features/place/lib/useSearchHistory";
import { useUIStore } from "@/shared/model/ui-store";
import { trackEvent } from "@/shared/lib/gtm";
import { placeApi } from "@/entities/place/api";
import { searchPlaceService } from "@/shared/api/edge-function";
import type { Place, PlaceSearchSummary } from "@/entities/place/types";
import { usePlacePopup } from "@/shared/lib/place-popup";
import { ExploreFilterSheet } from "@/widgets/ExploreFilterSheet";
import { usePlacesByFilters } from "@/entities/place/queries";
import { getPriceLabel, getThemeNameByCode } from "@/shared/config/filter-constants";
import { useUserStore } from "@/entities/user";

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
  group1: null,
  group2: null,
  group3: null,
  categories: [],
  theme_codes: [],
  price_min: null,
  price_max: null,
  exclude_franchises: true,
};

/**
 * 아카이브 스타일의 폴더 카드 컴포넌트
 */
function ArchiveFolderCard({ folder }: { folder: any }) {
  const navigate = useNavigate();
  
  // 미리보기 이미지들 추출 (최대 6개)
  const previewImages = folder.preview_places?.slice(0, 6).map((p: any) => 
    p.image_urls?.[0] || p.images?.[0] || p.thumbnail
  ).filter(Boolean) || [];

  /**
   * 이미지 개수에 따른 촘촘하고 여백 없는 그리드 레이아웃
   */
  const renderImageGrid = () => {
    const count = previewImages.length;

    if (count === 0) {
      return (
        <div className="w-full h-full flex items-center justify-center bg-surface-50 dark:bg-surface-900">
          <span className="text-[10px] text-surface-400 font-medium uppercase tracking-widest">No Images</span>
        </div>
      );
    }

    if (count === 1) {
      return (
        <div className="w-full h-full">
          <img src={previewImages[0]} alt="" className="w-full h-full object-cover" loading="lazy" />
        </div>
      );
    }

    if (count === 2) {
      return (
        <div className="grid grid-cols-2 gap-px w-full h-full bg-surface-100 dark:bg-surface-800">
          <img src={previewImages[0]} alt="" className="w-full h-full object-cover" loading="lazy" />
          <img src={previewImages[1]} alt="" className="w-full h-full object-cover" loading="lazy" />
        </div>
      );
    }

    if (count === 3) {
      return (
        <div className="grid grid-cols-3 grid-rows-2 gap-px w-full h-full bg-surface-100 dark:bg-surface-800">
          <div className="col-span-2 row-span-2">
            <img src={previewImages[0]} alt="" className="w-full h-full object-cover" loading="lazy" />
          </div>
          <div className="col-span-1 row-span-1">
            <img src={previewImages[1]} alt="" className="w-full h-full object-cover" loading="lazy" />
          </div>
          <div className="col-span-1 row-span-1">
            <img src={previewImages[2]} alt="" className="w-full h-full object-cover" loading="lazy" />
          </div>
        </div>
      );
    }

    if (count === 4) {
      return (
        <div className="grid grid-cols-2 grid-rows-2 gap-px w-full h-full bg-surface-100 dark:bg-surface-800">
          {previewImages.slice(0, 4).map((img: string, i: number) => (
            <img key={i} src={img} alt="" className="w-full h-full object-cover" loading="lazy" />
          ))}
        </div>
      );
    }

    if (count === 5) {
      return (
        <div className="grid grid-cols-2 grid-rows-2 gap-px w-full h-full bg-surface-100 dark:bg-surface-800">
          <div className="col-span-1 row-span-2">
            <img src={previewImages[0]} alt="" className="w-full h-full object-cover" loading="lazy" />
          </div>
          <div className="col-span-1 row-span-2 grid grid-cols-2 grid-rows-2 gap-px">
            {previewImages.slice(1, 5).map((img: string, i: number) => (
              <img key={i} src={img} alt="" className="w-full h-full object-cover" loading="lazy" />
            ))}
          </div>
        </div>
      );
    }

    // 6개
    return (
      <div className="grid grid-cols-3 grid-rows-2 gap-px w-full h-full bg-surface-100 dark:bg-surface-800">
        {previewImages.slice(0, 6).map((img: string, i: number) => (
          <img key={i} src={img} alt="" className="w-full h-full object-cover" loading="lazy" />
        ))}
      </div>
    );
  };

  return (
    <div 
      className="flex flex-col mb-10 cursor-pointer group"
      onClick={() => navigate(`/folder/${folder.id}`)}
    >
      {/* 텍스트 영역: 타이틀 상단 배치, Flat 스타일 */}
      <div className="flex flex-col mb-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-col overflow-hidden">
            <h3 className="text-base font-medium text-surface-900 dark:text-white leading-tight truncate">
              {folder.title}
              <span className="text-surface-400 font-normal ml-1.5">· {folder.place_count}개</span>
            </h3>
            {folder.description && (
              <p className="text-[12px] text-surface-500 dark:text-surface-400 mt-1 truncate">
                {folder.description}
              </p>
            )}
          </div>
          
          {!folder.is_mine && (
            <div className="flex items-center gap-2.5 flex-shrink-0">
              <span className="text-[13px] text-surface-600 dark:text-surface-400 font-medium">
                {folder.owner_nickname}
              </span>
              <div className="size-7 rounded-full overflow-hidden bg-surface-100 border border-surface-100 dark:border-surface-800">
                {folder.owner_avatar_url && (
                  <img src={getAvatarUrl(folder.owner_avatar_url)} alt="" className="w-full h-full object-cover" />
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 촘촘한 그리드 이미지 콜라주 */}
      <div className="relative aspect-[16/9] w-full rounded-xl overflow-hidden bg-surface-50 dark:bg-surface-900 border border-surface-100 dark:border-surface-800">
        {renderImageGrid()}
      </div>
    </div>
  );
}

export function SearchPage() {
  const navigate = useNavigate();
  const { show: showPlaceModal } = usePlacePopup();
  const [searchQueryDisplay, setSearchQueryDisplay] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<Place[]>([]);
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const [filters, setFilters] = useState<ExplorerFilterState>(DEFAULT_FILTERS);

  const { isAuthenticated } = useUserStore();

  const { history, saveToHistory, clearHistory, removeFromHistory } = useSearchHistory();
  const { setBottomNavVisible } = useUIStore();

  const { 
    data, 
    fetchNextPage, 
    hasNextPage, 
    isFetchingNextPage,
    isLoading 
  } = useMyAndPublicFolders();

  const { ref, inView } = useIntersection();

  useEffect(() => {
    if (inView && hasNextPage && !isSearching) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, fetchNextPage, isSearching]);

  // 검색 페이지에서는 항상 하단 네비게이션 숨기기
  useEffect(() => {
    setBottomNavVisible(false);
    return () => setBottomNavVisible(true);
  }, [setBottomNavVisible]);

  const handleSearch = useCallback(async (query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return;
    
    setSearchQueryDisplay(trimmed);
    saveToHistory(trimmed);
    setIsSearchFocused(false);
    setIsSearching(true);
    setIsSearchLoading(true);
    setSearchResults([]);

    window.scrollTo({ top: 0, behavior: 'instant' });
    trackEvent("search_page_execute", { query: trimmed });

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
    setFilters(DEFAULT_FILTERS); // 필터도 초기화
  };

  const folders = data?.pages.flat() || [];

  // 활성화된 추가 필터 개수
  const activeExtraFilterCount = useMemo(() => {
    let count = 0;
    if (filters.categories && filters.categories.length > 0) count += filters.categories.length;
    if (filters.theme_codes && filters.theme_codes.length > 0) count += filters.theme_codes.length;
    if (filters.price_min !== null || filters.price_max !== null) count++;
    return count;
  }, [filters]);

  // 필터가 활성화되어 있는지 여부
  const isFilterActive = activeExtraFilterCount > 0;

  // 필터 기반 데이터 호출
  const {
    data: filterData,
    isLoading: isFilterLoading,
    isFetchingNextPage: isFetchingNextFilterPage,
    hasNextPage: hasNextFilterPage,
    fetchNextPage: fetchNextFilterPage,
  } = usePlacesByFilters(filters, isFilterActive && !isSearching);

  const filterResults = useMemo(() => (filterData?.pages.flatMap((page) => page) || []) as Place[], [filterData]);

  // 무한 스크롤 통합 처리
  useEffect(() => {
    if (inView && !isSearching) {
      if (isFilterActive && hasNextFilterPage && !isFetchingNextFilterPage) {
        fetchNextFilterPage();
      } else if (!isFilterActive && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    }
  }, [inView, isSearching, isFilterActive, hasNextFilterPage, isFetchingNextFilterPage, fetchNextFilterPage, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleFilterApply = (newFilters: any) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setIsFilterSheetOpen(false);
    setIsSearching(false); // 필터 적용 시 검색 모드 종료 (필터 결과 우선)
    trackEvent("search_page_filter_apply", newFilters);
  };

  const handleFilterReset = () => {
    setFilters(DEFAULT_FILTERS);
    setIsFilterSheetOpen(false);
    trackEvent("search_page_filter_reset", {});
  };

  const handleBack = () => {
    if (window.history.length > 2) { // 1은 현재 페이지, 2 이상이어야 이전 페이지가 있음
      navigate(-1);
    } else {
      navigate("/feature");
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-surface-950 pb-24">
      {/* 상단 스티키 검색바 (아이콘 + 텍스트) */}
      <header className="sticky top-0 z-30 bg-white dark:bg-surface-950 border-b border-surface-100 dark:border-surface-800">
        <div className="max-w-lg mx-auto h-[72px] flex items-center px-5 gap-3">
          {!isSearching && (
            <button 
              onClick={handleBack}
              className="mr-1 p-2 -ml-2 active:scale-90 transition-transform"
            >
              <ChevronLeft className="size-6 text-surface-900 dark:text-white" />
            </button>
          )}
          {isSearching && (
            <button onClick={exitSearch} className="mr-1 p-2 -ml-2 active:scale-90 transition-transform">
              <ChevronLeft className="size-6 text-surface-900 dark:text-white" />
            </button>
          )}
          <div 
            onClick={() => setIsSearchFocused(true)}
            className="flex-1 flex items-center h-12 rounded-xl bg-surface-50 dark:bg-surface-900 px-4 transition-all cursor-pointer overflow-hidden"
          >
            <Search className="size-4 text-surface-400 stroke-[2.5px] shrink-0" />
            <div className="flex-1 flex items-center gap-2 ml-3 overflow-hidden">
              {isFilterActive && !searchQueryDisplay && !isSearching && (() => {
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
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 text-[12px] font-medium shrink-0 max-w-[160px]">
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
                {searchQueryDisplay || "지역과 음식점 검색"}
              </span>
            </div>
            {searchQueryDisplay && (
              <button 
                onClick={(e) => { e.stopPropagation(); exitSearch(); }}
                className="ml-auto p-1 rounded-full bg-surface-200 dark:bg-surface-700"
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
                  isFilterActive 
                    ? "bg-primary-50 border-primary-200 text-primary-600 dark:bg-primary-900 dark:border-primary-800 dark:text-primary-400" 
                    : "bg-surface-50 border-transparent text-surface-400 dark:bg-surface-900 active:bg-surface-100"
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
      </header>

      {/* 검색 포커스 모드 - 입력 시 SearchPage 리렌더 없이 오버레이만 갱신하여 키보드 딜레이 완화 */}
      {isSearchFocused && (
        <SearchFocusOverlay
          onSearch={handleSearch}
          onBack={handleBack}
          history={history}
          clearHistory={clearHistory}
          removeFromHistory={removeFromHistory}
        />
      )}

      {/* 메인 콘텐츠 영역 */}
      <main className="px-5 max-w-lg mx-auto mt-8">
        {isSearching ? (
          /* 검색 결과 모드 */
          isSearchLoading ? (
            <div className="flex flex-col items-center justify-center py-32 gap-4">
              <Loader2 className="size-8 text-primary-500 animate-spin" />
              <p className="text-[14px] font-medium text-surface-300 animate-pulse uppercase tracking-widest">
                검색중...
              </p>
            </div>
          ) : searchResults.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-40 text-center px-10">
              <div className="size-20 bg-surface-50 dark:bg-surface-900 rounded-full flex items-center justify-center mb-6">
                <Search className="size-10 text-surface-200 dark:text-surface-700" />
              </div>
              <h3 className="text-xl font-medium text-surface-900 dark:text-white mb-2 tracking-tight">
                결과가 없습니다
              </h3>
              <p className="text-surface-400 dark:text-surface-500 text-[14px] font-medium">
                다른 검색어로 시도해보세요.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-0 pt-0.5 -mx-5">
              {searchResults.map((place) => (
                <PlaceCard
                  key={place.id}
                  place={place}
                  sourceLabel="검색 결과"
                  sourceTitle={place.category}
                  addedAt={place.created_at ? formatRelativeTime(place.created_at) : undefined}
                  showPrice={true}
                />
              ))}
            </div>
          )
        ) : isFilterActive ? (
          /* 필터 결과 모드 */
          isFilterLoading && filterResults.length === 0 ? (
            <div className="flex flex-col gap-10">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex flex-col gap-3 animate-pulse">
                  <div className="aspect-[16/9] w-full bg-surface-50 dark:bg-surface-900 rounded-xl" />
                  <div className="h-4 w-1/2 bg-surface-50 dark:bg-surface-900 rounded" />
                </div>
              ))}
            </div>
          ) : filterResults.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-40 text-center px-10">
              <div className="size-20 bg-surface-50 dark:bg-surface-900 rounded-full flex items-center justify-center mb-6">
                <Search className="size-10 text-surface-200 dark:text-surface-700" />
              </div>
              <h3 className="text-xl font-medium text-surface-900 dark:text-white mb-2 tracking-tight">
                결과가 없습니다
              </h3>
              <p className="text-surface-400 dark:text-surface-500 text-[14px] font-medium">
                필터 조건을 변경해보세요.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-0 pt-0.5 -mx-5">
              {filterResults.map((place) => (
                <PlaceCard
                  key={place.id}
                  place={place}
                  sourceLabel="필터 결과"
                  sourceTitle={place.category}
                  addedAt={place.created_at ? formatRelativeTime(place.created_at) : undefined}
                  showPrice={true}
                />
              ))}
              {(hasNextFilterPage || isFetchingNextFilterPage) && (
                <div ref={ref} className="py-12 flex justify-center">
                  <Loader2 className="size-6 text-primary-500 animate-spin" />
                </div>
              )}
            </div>
          )
        ) : (
          /* 기본 폴더 리스트 모드 */
          <>
            {isLoading ? (
              <div className="flex flex-col gap-10">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex flex-col gap-3 animate-pulse">
                    <div className="aspect-[16/9] w-full bg-surface-50 dark:bg-surface-900 rounded-xl" />
                    <div className="h-4 w-1/2 bg-surface-50 dark:bg-surface-900 rounded" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col">
                {folders.map((folder) => (
                  <ArchiveFolderCard key={folder.id} folder={folder} />
                ))}
              </div>
            )}

            {/* 무한 스크롤 트리거 */}
            {(hasNextPage || isFetchingNextPage) && (
              <div ref={ref} className="py-12 flex justify-center">
                <Loader2 className="size-6 text-primary-500 animate-spin" />
              </div>
            )}
            
            {!isLoading && folders.length === 0 && (
              <div className="py-20 text-center text-surface-400 font-medium">
                표시할 폴더가 없습니다.
              </div>
            )}
          </>
        )}
      </main>

      {/* 공용 필터 바텀 시트 */}
      <ExploreFilterSheet 
        isOpen={isFilterSheetOpen}
        onClose={() => setIsFilterSheetOpen(false)}
        filters={filters}
        onApply={handleFilterApply}
        onReset={handleFilterReset}
        totalCount={isSearching ? searchResults.length : (isFilterActive ? filterResults.length : 0)}
      />
    </div>
  );
}
