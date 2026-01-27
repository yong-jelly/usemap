import React, { useState, useEffect, useRef, useCallback } from "react";
import { useIntersection } from "@/shared/lib/use-intersection";
import { useNavigate } from "react-router";
import { 
  Search, 
  Camera, 
  ChevronLeft, 
  X, 
  History,
  Loader2
} from "lucide-react";
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
  const { show: showPlaceModal } = usePlacePopup();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchQueryDisplay, setSearchQueryDisplay] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<Place[]>([]);
  
  const { history, saveToHistory, clearHistory, removeFromHistory } = useSearchHistory();
  const { setBottomNavVisible } = useUIStore();
  const inputRef = useRef<HTMLInputElement>(null);

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

  // 검색 모드 또는 결과 표시 중일 때 하단 네비게이션 숨기기
  useEffect(() => {
    if (isSearchFocused || isSearching) {
      setBottomNavVisible(false);
    } else {
      setBottomNavVisible(true);
    }
    return () => setBottomNavVisible(true);
  }, [isSearchFocused, isSearching, setBottomNavVisible]);

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
  };

  const folders = data?.pages.flat() || [];

  const shouldShowBottomNav = !isSearchFocused && !isSearching;

  return (
    <div className="min-h-screen bg-white dark:bg-surface-950 pb-24">
      {/* 상단 스티키 검색바 (아이콘 + 텍스트) */}
      <header className="sticky top-0 z-30 bg-white dark:bg-surface-950 border-b border-surface-100 dark:border-surface-800">
        <div className="max-w-lg mx-auto h-[72px] flex items-center px-5 gap-3">
          {isSearching && (
            <button onClick={exitSearch} className="mr-1 p-2 -ml-2 active:scale-90 transition-transform">
              <ChevronLeft className="size-6 text-surface-900 dark:text-white" />
            </button>
          )}
          <div 
            onClick={() => {
              setIsSearchFocused(true);
              setTimeout(() => inputRef.current?.focus(), 50);
            }}
            className="flex-1 flex items-center h-12 rounded-xl bg-surface-50 dark:bg-surface-900 px-4 transition-all cursor-pointer overflow-hidden"
          >
            <Search className="size-4 text-surface-400 stroke-[2.5px] shrink-0" />
            <div className="flex-1 flex items-center gap-2 ml-3 overflow-hidden">
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
            <button className="p-2 rounded-xl bg-surface-50 dark:bg-surface-900 flex items-center justify-center shrink-0">
              <Camera className="size-5 text-surface-400" />
            </button>
          )}
        </div>
      </header>

      {/* --- 검색 포커스 모드 (아이콘 + 텍스트) --- */}
      {isSearchFocused && (
        <div className="fixed inset-0 z-[60] bg-white dark:bg-surface-950 p-0 flex flex-col">
          <div className="max-w-lg mx-auto w-full flex flex-col h-full bg-white dark:bg-surface-950">
            <div className="h-[72px] flex items-center px-5 gap-4 border-b border-surface-50 dark:border-surface-900">
              <button 
                onClick={() => setIsSearchFocused(false)}
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
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch(searchQuery)}
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
                onClick={() => handleSearch(searchQuery)}
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
                    <h3 className="text-xs font-medium text-surface-400 uppercase tracking-widest">Recent Searches</h3>
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
      )}

      {/* 메인 콘텐츠 영역 */}
      <main className="px-5 max-w-lg mx-auto mt-8">
        {isSearching ? (
          /* 검색 결과 모드 */
          isSearchLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="size-8 text-primary-500 animate-spin" />
              <p className="text-[14px] font-medium text-surface-300 animate-pulse uppercase tracking-widest">
                Searching...
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

      {shouldShowBottomNav && <BottomNav />}
    </div>
  );
}
