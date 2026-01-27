import React, { useState, useEffect, useRef, useCallback } from "react";
import { useIntersection } from "@/shared/lib/use-intersection";
import { 
  Search, 
  Camera, 
  ChevronRight, 
  User, 
  ChevronLeft, 
  X, 
  History,
  Loader2
} from "lucide-react";
import { useNavigate } from "react-router";
import { useMyAndPublicFolders } from "@/entities/folder/queries";
import { BottomNav } from "@/widgets/BottomNav";
import { cn, getAvatarUrl } from "@/shared/lib/utils";
import { useSearchHistory } from "@/features/place/lib/useSearchHistory";
import { useUIStore } from "@/shared/model/ui-store";
import { trackEvent } from "@/shared/lib/gtm";
import { placeApi } from "@/entities/place/api";
import { searchPlaceService } from "@/shared/api/edge-function";
import type { Place, PlaceSearchSummary } from "@/entities/place/types";
import { PlaceThumbnail } from "@/shared/ui/place/PlaceThumbnail";
import { usePlacePopup } from "@/shared/lib/place-popup";

/**
 * 핀터레스트 스타일의 폴더 카드 컴포넌트
 */
function PinterestFolderCard({ folder }: { folder: any }) {
  const navigate = useNavigate();
  
  // 미리보기 이미지들 추출 (최대 6개)
  const previewImages = folder.preview_places?.slice(0, 6).map((p: any) => 
    p.image_urls?.[0] || p.images?.[0] || p.thumbnail
  ).filter(Boolean) || [];

  const handleGoDetail = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/folder/${folder.id}`);
  };

  /**
   * 이미지 개수에 따른 핀터레스트 스타일 레이아웃 렌더링
   */
  const renderImageGrid = () => {
    const count = previewImages.length;

    if (count === 0) {
      return (
        <div className="w-full h-full flex items-center justify-center text-surface-400">
          이미지가 없습니다
        </div>
      );
    }

    if (count === 1) {
      return (
        <div className="w-full h-full bg-surface-200 dark:bg-surface-800">
          <img src={previewImages[0]} alt="" className="w-full h-full object-cover" loading="lazy" />
        </div>
      );
    }

    if (count === 2) {
      return (
        <div className="grid grid-cols-2 gap-0.5 w-full h-full">
          <div className="bg-surface-200 dark:bg-surface-800">
            <img src={previewImages[0]} alt="" className="w-full h-full object-cover" loading="lazy" />
          </div>
          <div className="bg-surface-200 dark:bg-surface-800">
            <img src={previewImages[1]} alt="" className="w-full h-full object-cover" loading="lazy" />
          </div>
        </div>
      );
    }

    if (count === 3) {
      return (
        <div className="flex gap-0.5 w-full h-full">
          <div className="w-2/3 bg-surface-200 dark:bg-surface-800">
            <img src={previewImages[0]} alt="" className="w-full h-full object-cover" loading="lazy" />
          </div>
          <div className="flex flex-col gap-0.5 w-1/3">
            <div className="h-1/2 bg-surface-200 dark:bg-surface-800">
              <img src={previewImages[1]} alt="" className="w-full h-full object-cover" loading="lazy" />
            </div>
            <div className="h-1/2 bg-surface-200 dark:bg-surface-800">
              <img src={previewImages[2]} alt="" className="w-full h-full object-cover" loading="lazy" />
            </div>
          </div>
        </div>
      );
    }

    if (count === 4) {
      return (
        <div className="grid grid-cols-2 grid-rows-2 gap-0.5 w-full h-full">
          {previewImages.map((img: string, i: number) => (
            <div key={i} className="bg-surface-200 dark:bg-surface-800">
              <img src={img} alt="" className="w-full h-full object-cover" loading="lazy" />
            </div>
          ))}
        </div>
      );
    }

    if (count === 5) {
      return (
        <div className="flex gap-0.5 w-full h-full">
          <div className="w-1/2 bg-surface-200 dark:bg-surface-800">
            <img src={previewImages[0]} alt="" className="w-full h-full object-cover" loading="lazy" />
          </div>
          <div className="flex flex-col gap-0.5 w-1/2">
            <div className="flex gap-0.5 h-1/2">
              <div className="w-1/2 bg-surface-200 dark:bg-surface-800">
                <img src={previewImages[1]} alt="" className="w-full h-full object-cover" loading="lazy" />
              </div>
              <div className="w-1/2 bg-surface-200 dark:bg-surface-800">
                <img src={previewImages[2]} alt="" className="w-full h-full object-cover" loading="lazy" />
              </div>
            </div>
            <div className="flex gap-0.5 h-1/2">
              <div className="w-1/2 bg-surface-200 dark:bg-surface-800">
                <img src={previewImages[3]} alt="" className="w-full h-full object-cover" loading="lazy" />
              </div>
              <div className="w-1/2 bg-surface-200 dark:bg-surface-800">
                <img src={previewImages[4]} alt="" className="w-full h-full object-cover" loading="lazy" />
              </div>
            </div>
          </div>
        </div>
      );
    }

    // 6개 이상
    return (
      <div className="grid grid-cols-3 grid-rows-2 gap-0.5 w-full h-full">
        {previewImages.map((img: string, i: number) => (
          <div key={i} className="bg-surface-200 dark:bg-surface-800">
            <img src={img} alt="" className="w-full h-full object-cover" loading="lazy" />
          </div>
        ))}
      </div>
    );
  };

  return (
    <div 
      className="flex flex-col gap-3 mb-12 cursor-pointer group"
      onClick={() => navigate(`/folder/${folder.id}`)}
    >
      {/* 텍스트 영역: 타이틀 상단 배치 */}
      <div className="flex flex-col px-1">
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-col overflow-hidden">
            {/* 설명 텍스트를 타이틀 위로 배치 */}
            {folder.description && (
              <div className="flex items-center gap-1 mb-0.5">
                <span className="text-[13px] text-surface-500 dark:text-surface-400 font-medium truncate">
                  {folder.description}
                </span>
                <span className="text-[12px] text-surface-400 dark:text-surface-500 font-medium flex-shrink-0 flex items-center">
                  <span className="mx-1 opacity-40">•</span>
                  {folder.place_count}개
                </span>
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <h3 className="text-[18px] font-medium text-surface-900 dark:text-white leading-tight truncate">
                {folder.title}
              </h3>
              {!folder.description && (
                <span className="text-[12px] text-surface-400 dark:text-surface-500 font-medium flex-shrink-0 flex items-center">
                  <span className="mx-1 opacity-40">•</span>
                  {folder.place_count}개
                </span>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-3 flex-shrink-0">
            {/* 다른 유저일 때만 프로필 표시 */}
            {!folder.is_mine && (
              <div className="flex items-center gap-2">
                <span className="text-[12px] text-surface-500 dark:text-surface-400 font-medium">
                  {folder.owner_nickname}
                </span>
                <div className="size-6 rounded-full overflow-hidden bg-surface-200 border border-surface-100 dark:border-surface-800">
                  {folder.owner_avatar_url ? (
                    <img src={getAvatarUrl(folder.owner_avatar_url)} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <User className="size-full p-1 text-surface-400" />
                  )}
                </div>
              </div>
            )}
            <button 
              onClick={handleGoDetail}
              className="p-1.5 -mr-1.5 rounded-full hover:bg-surface-100 dark:hover:bg-neutral-900 transition-colors"
            >
              <ChevronRight className="size-5 text-surface-400" />
            </button>
          </div>
        </div>
      </div>

      {/* 핀터레스트 스타일 이미지 콜라주 - 개수별 가변 레이아웃 */}
      <div className="relative aspect-[16/9] w-full rounded-[20px] overflow-hidden bg-surface-100 dark:bg-surface-900 shadow-sm group-active:scale-[0.99] transition-transform duration-200">
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
    <div className="min-h-screen bg-white dark:bg-black pb-24">
      {/* 상단 스티키 검색바 (Explorer 스타일) */}
      <header className="sticky top-0 z-30 bg-white dark:bg-black border-b border-surface-100 dark:border-surface-800">
        <div className="max-w-lg mx-auto h-[64px] flex items-center px-5 gap-3">
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
            <button className="size-11 rounded-xl bg-surface-50 dark:bg-surface-900 flex items-center justify-center shrink-0">
              <Camera className="size-5 text-surface-400" />
            </button>
          )}
        </div>
      </header>

      {/* --- 검색 포커스 모드 (Explorer 스타일 History) --- */}
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
                  placeholder="지역과 함께 음식점을 검색하면 더 정확한 결과를 얻을 수 있어요."
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

      {/* 메인 콘텐츠 영역 */}
      <main className="px-5 max-w-lg mx-auto mt-6">
        {isSearching ? (
          /* 검색 결과 모드 */
          isSearchLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="size-8 text-primary-500 animate-spin" />
              <p className="text-[14px] font-bold text-surface-300 animate-pulse">
                "{searchQueryDisplay}" 검색 결과를 가져오고 있어요
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
              <p className="text-surface-400 dark:text-surface-500 text-[14px] leading-relaxed font-medium">
                다른 검색어로 시도해보세요.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-0.5 pt-0.5 -mx-5">
              {searchResults.map((place) => (
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
          )
        ) : (
          /* 기본 폴더 리스트 모드 */
          <>
            {isLoading ? (
              <div className="flex flex-col gap-10">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex flex-col gap-3 animate-pulse">
                    <div className="aspect-[16/9] w-full bg-surface-100 dark:bg-neutral-900 rounded-[20px]" />
                    <div className="h-4 w-1/2 bg-surface-100 dark:bg-neutral-900 rounded" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col">
                {folders.map((folder) => (
                  <PinterestFolderCard key={folder.id} folder={folder} />
                ))}
              </div>
            )}

            {/* 무한 스크롤 트리거 */}
            {(hasNextPage || isFetchingNextPage) && (
              <div ref={ref} className="py-12 flex justify-center">
                <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
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
