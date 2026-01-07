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
 */
export function ExplorePage() {
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [layout, setLayout] = useState<'feed' | 'grid'>('feed');
  
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
      {/* 1. 상단 현대적 헤더 */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-xl dark:bg-surface-900/90 border-b border-surface-100 dark:border-surface-800 transition-all">
        <div className="max-w-lg mx-auto">
          {/* 상단 라인: 로고 및 액션 */}
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="size-8 rounded-xl bg-[#2B4562] flex items-center justify-center rotate-3 shadow-md shadow-blue-900/10">
                <MapPin className="size-4 text-white" />
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                className="flex items-center gap-1 p-0 h-auto hover:bg-transparent font-bold text-[#2B4562] dark:text-white text-lg"
              >
                {filters.group2}
                <ChevronDown className="size-4 text-surface-400" />
              </Button>
            </div>
            
            <div className="flex items-center gap-1">
              <Button 
                variant="ghost" 
                size="icon" 
                className="rounded-full hover:bg-surface-50"
                onClick={() => setIsSearchMode(true)}
              >
                <Search className="size-5 text-[#2B4562] dark:text-white" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="rounded-full hover:bg-surface-50"
              >
                <Filter className="size-5 text-[#2B4562] dark:text-white" />
              </Button>
            </div>
          </div>

          {/* 하단 라인: 카테고리 칩 (인스타그램 스타일) */}
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide px-4 pb-3">
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
                    "px-4 py-1.5 rounded-full text-[13px] font-bold whitespace-nowrap transition-all border",
                    isActive 
                      ? "bg-[#F48E54] border-[#F48E54] text-white shadow-sm shadow-orange-500/20 scale-105" 
                      : "bg-white dark:bg-surface-800 border-surface-200 dark:border-surface-700 text-surface-600 dark:text-surface-400 hover:bg-surface-50"
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
      <main className="flex-1 w-full max-w-lg mx-auto pb-24 bg-white dark:bg-surface-950 shadow-sm min-h-screen">
        {/* 리스트 헤더: 레이아웃 전환 및 개수 */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-surface-50 dark:border-surface-800/50">
          <h2 className="text-[15px] font-extrabold text-[#2B4562] dark:text-white">
            탐색 결과 <span className="text-[#F48E54] ml-1">{places.length}</span>
          </h2>
          <div className="flex items-center bg-surface-50 dark:bg-surface-800 rounded-lg p-1 gap-1">
            <button 
              onClick={() => setLayout('feed')}
              className={cn("p-1.5 rounded-md transition-all", layout === 'feed' ? "bg-white dark:bg-surface-700 shadow-sm text-orange-500" : "text-surface-400")}
            >
              <ListIcon className="size-4" />
            </button>
            <button 
              onClick={() => setLayout('grid')}
              className={cn("p-1.5 rounded-md transition-all", layout === 'grid' ? "bg-white dark:bg-surface-700 shadow-sm text-orange-500" : "text-surface-400")}
            >
              <LayoutGrid className="size-4" />
            </button>
          </div>
        </div>

        {isInitialLoading ? (
          // 로딩 스켈레톤 (인스타 느낌)
          <div className="space-y-8 mt-4 px-4">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="space-y-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="size-10 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                </div>
                <Skeleton className="aspect-square w-full rounded-2xl" />
              </div>
            ))}
          </div>
        ) : isError || places.length === 0 ? (
          // 에러/결과 없음 (마스코트 테마)
          <div className="flex flex-col items-center justify-center py-32 text-center px-8">
            <div className="size-20 bg-orange-50 dark:bg-orange-900/20 rounded-full flex items-center justify-center mb-6 border-4 border-white dark:border-surface-800 shadow-xl">
              <Search className="size-10 text-orange-400" />
            </div>
            <h3 className="text-xl font-extrabold text-[#2B4562] dark:text-white mb-2">
              앗! 찾으시는 장소가 없어요
            </h3>
            <p className="text-surface-500 text-sm mb-8 leading-relaxed">
              다른 지역을 선택하거나 필터를 초기화해서<br />새로운 맛집을 찾아보세요!
            </p>
            <Button 
              onClick={resetFilters} 
              variant="primary" 
              className="rounded-full px-8 h-12 bg-[#2B4562] hover:bg-[#1e3247] shadow-lg shadow-blue-900/20"
            >
              필터 초기화하기
            </Button>
          </div>
        ) : (
          // 장소 목록 (피드 레이아웃)
          <div className={cn(
            layout === 'feed' ? "flex flex-col" : "grid grid-cols-3 gap-px bg-surface-100 dark:bg-surface-800"
          )}>
            {places.map((place) => (
              layout === 'feed' ? (
                <PlaceCard key={place.id} place={place} />
              ) : (
                <div 
                  key={place.id} 
                  className="aspect-square bg-white dark:bg-surface-900 relative group cursor-pointer"
                  onClick={() => {/* 상세 팝업 */}}
                >
                  <img 
                    src={convertToNaverResizeImageUrl(place.images?.[0])} 
                    className="w-full h-full object-cover"
                    alt={place.name}
                  />
                  {place.features && place.features.length > 0 && (
                    <div className="absolute top-1 right-1">
                      <TvMinimalPlay className="size-4 text-white drop-shadow-md" />
                    </div>
                  )}
                </div>
              )
            ))}
          </div>
        )}

        {/* 더 보기 버튼 (현대적인 로딩 디자인) */}
        {hasNextPage && !isInitialLoading && (
          <div className="p-8 flex justify-center">
            <Button
              onClick={() => fetchNextPage()}
              isLoading={isFetchingNextPage}
              className="bg-white dark:bg-surface-800 border-surface-200 dark:border-surface-700 text-[#2B4562] dark:text-white font-bold rounded-full px-8 h-12 shadow-md hover:shadow-lg transition-all"
            >
              더 많은 장소 보기
              <ChevronDown className="size-4 ml-1" />
            </Button>
          </div>
        )}
      </main>

      {/* 검색 오버레이 (현대적인 전체화면 디자인) */}
      {isSearchMode && (
        <div className="fixed inset-0 z-[100] bg-white dark:bg-surface-950 flex flex-col">
          <div className="flex items-center gap-3 p-4 border-b border-surface-100 dark:border-surface-800">
            <Button variant="ghost" size="icon" onClick={() => setIsSearchMode(false)} className="rounded-full">
              <X className="size-6 text-[#2B4562] dark:text-white" />
            </Button>
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-surface-400" />
              <Input 
                autoFocus
                placeholder="장소명, 메뉴, 지역 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-surface-50 dark:bg-surface-900 border-none h-11 pl-10 rounded-xl"
              />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4">
            <div className="mb-6">
              <h4 className="text-xs font-bold text-surface-400 uppercase tracking-widest mb-4">최근 검색어</h4>
              <div className="flex flex-wrap gap-2">
                {["성수동 카페", "강남역 맛집", "주차 가능한 일식"].map(tag => (
                  <span key={tag} className="px-3 py-1.5 bg-surface-50 dark:bg-surface-800 rounded-full text-sm text-surface-600 dark:text-surface-300">
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
