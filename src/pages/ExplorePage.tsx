import { useState, useMemo } from "react";
import { 
  Search, 
  Filter, 
  MapPin, 
  ChevronDown, 
  X, 
  RefreshCcw,
  LayoutGrid,
  List as ListIcon,
  TvMinimalPlay
} from "lucide-react";
import { usePlacesByFilters } from "@/entities/place/queries";
import { PlaceCard } from "@/widgets";
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
  themes: string | null;
  rating: number | null;
  exclude_franchises: boolean;
}

/**
 * 탐색 페이지 컴포넌트
 * 마스코트 아이콘의 컬러 팔레트(네이비, 오렌지, 레드)를 반영한 현대적인 피드 구성
 * 피그마 스타일의 플랫 벡터 UI (그림자 제거, 테두리 강조)
 */
export function ExplorePage() {
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [layout, setLayout] = useState<'feed' | 'grid'>('feed');
  const showPopup = usePlacePopup((state) => state.show);
  
  const defaultFilters: ExplorerFilterState = {
    group1: "서울",
    group2: "중구",
    group3: "태평로1가",
    categories: [],
    features: [],
    themes: null,
    rating: null,
    exclude_franchises: true,
  };

  const [filters, setFilters] = useState<ExplorerFilterState>(defaultFilters);

  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    isError,
  } = usePlacesByFilters(filters);

  const places = useMemo(() => (data?.pages.flatMap((page) => page) || []) as any[], [data]);

  const handleCategoryToggle = (category: string) => {
    setFilters(prev => {
      const current = prev.categories || [];
      const next = current.includes(category)
        ? current.filter(c => c !== category)
        : [...current, category];
      return { ...prev, categories: next.length > 0 ? next : null };
    });
  };

  const resetFilters = () => setFilters(defaultFilters);
  const isInitialLoading = isLoading && places.length === 0;

  return (
    <div className="flex flex-col min-h-screen bg-[#FFF9F5] dark:bg-surface-950">
      {/* 1. 상단 현대적 헤더 - Flat Vector Style */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl dark:bg-surface-900/95 border-b-2 border-[#2B4562]/10 transition-all">
        <div className="max-w-lg mx-auto">
          {/* 상단 라인: 로고 및 액션 */}
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="size-9 rounded-xl bg-[#2B4562] flex items-center justify-center rotate-3 border-2 border-[#2B4562]">
                <MapPin className="size-5 text-white" />
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                className="flex items-center gap-1 p-0 h-auto hover:bg-transparent font-black text-[#2B4562] dark:text-white text-xl tracking-tight"
              >
                {filters.group2}
                <ChevronDown className="size-5 text-[#2B4562]/40" />
              </Button>
            </div>
            
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="icon" 
                className="rounded-xl hover:bg-surface-50 border-2 border-transparent active:border-[#2B4562]/20"
                onClick={() => setIsSearchMode(true)}
              >
                <Search className="size-6 text-[#2B4562] dark:text-white" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="rounded-xl hover:bg-surface-50 border-2 border-transparent active:border-[#2B4562]/20"
              >
                <Filter className="size-6 text-[#2B4562] dark:text-white" />
              </Button>
            </div>
          </div>

          {/* 하단 라인: 카테고리 칩 (Kawaii Flat Style) */}
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide px-4 pb-4">
            {["전체", "음식점", "카페", "주점", "베이커리", "일식", "한식", "양식"].map((cat) => {
              const isAll = cat === "전체";
              const isActive = isAll 
                ? (!filters.categories || filters.categories.length === 0)
                : filters.categories?.includes(cat);
              
              return (
                <button
                  key={cat}
                  onClick={() => isAll ? setFilters(prev => ({ ...prev, categories: null })) : handleCategoryToggle(cat)}
                  className={cn(
                    "px-5 py-2 rounded-full text-[14px] font-black whitespace-nowrap transition-all border-2",
                    isActive 
                      ? "bg-[#F48E54] border-[#2B4562] text-white translate-y-[-1px]" 
                      : "bg-white dark:bg-surface-800 border-[#2B4562]/10 text-[#2B4562]/60 dark:text-surface-400 hover:border-[#2B4562]/30"
                  )}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* 2. 메인 피드 영역 */}
      <main className="flex-1 w-full max-w-lg mx-auto pb-24 bg-white dark:bg-surface-950 min-h-screen border-x-2 border-[#2B4562]/5">
        {/* 리스트 헤더: 레이아웃 전환 및 개수 */}
        <div className="flex items-center justify-between px-4 py-5 border-b-2 border-[#2B4562]/5">
          <h2 className="text-[16px] font-black text-[#2B4562] dark:text-white flex items-center gap-2">
            탐색 결과 <span className="bg-[#F48E54]/10 text-[#F48E54] px-2 py-0.5 rounded-lg text-sm">{places.length}</span>
          </h2>
          <div className="flex items-center bg-[#2B4562]/5 dark:bg-surface-800 rounded-xl p-1 gap-1 border-2 border-transparent">
            <button 
              onClick={() => setLayout('feed')}
              className={cn("p-2 rounded-lg transition-all border-2", layout === 'feed' ? "bg-white dark:bg-surface-700 border-[#2B4562] text-[#2B4562]" : "border-transparent text-surface-400")}
            >
              <ListIcon className="size-4.5" />
            </button>
            <button 
              onClick={() => setLayout('grid')}
              className={cn("p-2 rounded-lg transition-all border-2", layout === 'grid' ? "bg-white dark:bg-surface-700 border-[#2B4562] text-[#2B4562]" : "border-transparent text-surface-400")}
            >
              <LayoutGrid className="size-4.5" />
            </button>
          </div>
        </div>

        {isInitialLoading ? (
          // 로딩 스켈레톤
          <div className="space-y-8 mt-6 px-4">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="space-y-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="size-12 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-28" />
                    <Skeleton className="h-4 w-40" />
                  </div>
                </div>
                <Skeleton className="aspect-square w-full rounded-3xl" />
              </div>
            ))}
          </div>
        ) : isError || places.length === 0 ? (
          // 에러/결과 없음 (Mascot Theme)
          <div className="flex flex-col items-center justify-center py-32 text-center px-8">
            <div className="size-24 bg-[#FFF9F5] dark:bg-orange-900/20 rounded-full flex items-center justify-center mb-8 border-4 border-[#F48E54]">
              <Search className="size-12 text-[#F48E54]" />
            </div>
            <h3 className="text-2xl font-black text-[#2B4562] dark:text-white mb-3">
              앗! 찾으시는 장소가 없어요
            </h3>
            <p className="text-[#2B4562]/50 text-[15px] mb-10 leading-relaxed font-medium">
              다른 지역을 선택하거나 필터를 초기화해서<br />새로운 맛집을 찾아보세요!
            </p>
            <Button 
              onClick={resetFilters} 
              variant="primary" 
              className="rounded-2xl px-10 h-14 bg-[#2B4562] hover:bg-[#1e3247] text-white font-black text-lg border-b-4 border-[#1e3247] active:border-b-0 active:translate-y-[2px] transition-all"
            >
              필터 초기화하기
            </Button>
          </div>
        ) : (
          // 장소 목록
          <div className={cn(
            layout === 'feed' ? "flex flex-col" : "grid grid-cols-3"
          )}>
            {places.map((place) => {
              const folders = (place.features || []).filter((f: any) => f.platform_type === "folder");
              
              return layout === 'feed' ? (
                <PlaceCard key={place.id} place={place} />
              ) : (
                <div 
                  key={place.id} 
                  className="relative aspect-[3/4] bg-white dark:bg-surface-900 overflow-hidden group cursor-pointer border border-gray-100 dark:border-neutral-800"
                  onClick={() => showPopup(place.id)}
                >
                  <img 
                    src={convertToNaverResizeImageUrl(place.images?.[0])} 
                    className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                    alt={place.name}
                    loading="lazy"
                  />
                  {/* 정보 오버레이 - Svelte RecentViewPlaceCard 스타일과 동일하게 적용 */}
                  <div className="absolute bottom-0 left-0 right-0 backdrop-blur-[2px] px-2 py-1 md:px-3 md:py-2">
                    <div className="text-white text-xs font-semibold truncate" style={{ maxWidth: "100%" }}>
                      {place.address}
                    </div>
                    <div className="relative inline-block max-w-full">
                      <div className="text-white text-xs md:text-sm font-bold truncate leading-tight line-clamp-2 relative z-10" style={{ maxWidth: "100%" }}>
                        {place.name}
                      </div>
                      {folders.length > 0 && (
                        <div 
                          className={cn(
                            "absolute bottom-0 left-0 w-full rounded-full transition-all",
                            folders.length >= 15 ? "h-[4px] bg-[#1E8449]" :
                            folders.length >= 12 ? "h-[3.5px] bg-[#229954]" :
                            folders.length >= 9 ? "h-[3px] bg-[#27AE60]" :
                            folders.length >= 6 ? "h-[2.5px] bg-[#2ECC71]" :
                            folders.length >= 3 ? "h-[2px] bg-[#52BE80]" :
                            "h-[1.5px] bg-[#ABEBC6]"
                          )} 
                        />
                      )}
                    </div>
                  </div>

                  {place.features && place.features.length > 0 && (
                    <div className="absolute top-2 right-2 z-10">
                      <TvMinimalPlay className="size-4 text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.5)]" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* 더 보기 버튼 */}
        {hasNextPage && !isInitialLoading && (
          <div className="p-10 flex justify-center">
            <Button
              onClick={() => fetchNextPage()}
              isLoading={isFetchingNextPage}
              className="bg-white dark:bg-surface-800 border-2 border-[#2B4562] text-[#2B4562] dark:text-white font-black rounded-2xl px-10 h-14 border-b-4 active:border-b-2 active:translate-y-[2px] transition-all text-lg"
            >
              더 많은 장소 보기
              <ChevronDown className="size-5 ml-2" />
            </Button>
          </div>
        )}
      </main>

      {/* 검색 오버레이 */}
      {isSearchMode && (
        <div className="fixed inset-0 z-[100] bg-[#FFF9F5] dark:bg-surface-950 flex flex-col">
          <div className="flex items-center gap-3 p-4 border-b-2 border-[#2B4562]/10">
            <Button variant="ghost" size="icon" onClick={() => setIsSearchMode(false)} className="rounded-xl border-2 border-transparent active:border-[#2B4562]/20">
              <X className="size-7 text-[#2B4562] dark:text-white" />
            </Button>
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-[#2B4562]/30" />
              <Input 
                autoFocus
                placeholder="장소명, 메뉴, 지역 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white dark:bg-surface-900 border-2 border-[#2B4562]/10 h-13 pl-12 rounded-2xl font-bold text-lg focus-visible:ring-0 focus-visible:border-[#F48E54]"
              />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6">
            <div className="mb-8">
              <h4 className="text-sm font-black text-[#2B4562]/40 uppercase tracking-widest mb-5">최근 검색어</h4>
              <div className="flex flex-wrap gap-2.5">
                {["성수동 카페", "강남역 맛집", "주차 가능한 일식"].map(tag => (
                  <span key={tag} className="px-5 py-2.5 bg-white dark:bg-surface-800 border-2 border-[#2B4562]/10 rounded-2xl text-[15px] font-bold text-[#2B4562] dark:text-surface-300 active:border-[#F48E54] cursor-pointer">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
