import { useState, useRef, useEffect, type RefObject } from "react";
import { useIntersectionObserver } from "@react-hookz/web";
import { usePlacesByTab } from "@/entities/place/queries";
import { Tabs, Skeleton } from "@/shared/ui";
import { PlaceCard } from "@/widgets";
import { Bookmark } from "lucide-react";

const tabs = [
  { id: "local", label: "로컬", description: "지역 주민들의 검증된 추천과 커뮤니티 기반 정보를 우선으로 하는 신뢰할 수 있는 현지 맛집" },
  { id: "popular", label: "인기", description: "좋아요, 리뷰 수, 별점 등 정량적 지표로 검증된 대중적으로 인기 있는 음식점" },
  { id: "discovery", label: "새로운 발견", description: "네이버 리뷰 200개 이하의 상대적으로 덜 알려졌지만 높은 품질을 가진 숨겨진 보석 같은 음식점" },
];

/**
 * 홈 페이지 컴포넌트
 * 탭별로 필터링된 장소 목록을 무한 스크롤로 표시합니다.
 */
export function HomePage() {
  const [activeTab, setActiveTab] = useState(tabs[0].id);
  const intersectionRef = useRef<HTMLDivElement>(null);
  
  // 무한 스크롤을 위한 Intersection Observer 설정
  const intersection = useIntersectionObserver(intersectionRef as RefObject<HTMLDivElement>, { rootMargin: "100px" });

  // 탭별 장소 데이터 조회 (React Query Infinite Query)
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = usePlacesByTab(activeTab);

  // 모든 페이지의 데이터를 하나의 배열로 평탄화
  const places = data?.pages.flatMap((page) => page) || [];
  const currentTab = tabs.find((t) => t.id === activeTab);

  /**
   * 스크롤이 하단에 도달하면 다음 페이지 데이터를 가져옵니다.
   */
  useEffect(() => {
    if (intersection?.isIntersecting && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [intersection?.isIntersecting, hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <div className="flex flex-col">
      {/* 상단 탭 메뉴: 스티키 헤더 적용 */}
      <Tabs
        tabs={tabs}
        activeTab={activeTab}
        onChange={setActiveTab}
        className="sticky top-14 z-40 bg-white/80 backdrop-blur-md dark:bg-surface-900/80"
      />

      <div className="p-4">
        {/* 현재 탭에 대한 상세 설명 */}
        {currentTab && (
          <div className="mb-4 p-3 rounded-lg bg-surface-100 dark:bg-surface-800/50">
            <p className="text-center text-xs text-surface-600 dark:text-surface-400 leading-relaxed">
              {currentTab.description}
            </p>
          </div>
        )}

        {/* 로딩 상태 표시 */}
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="h-48 w-full rounded-xl" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : places.length === 0 ? (
          // 데이터가 없을 때 표시
          <div className="py-20 text-center text-surface-500 animate-fade-in">
            <Bookmark className="mx-auto mb-4 h-16 w-16 opacity-20" />
            <p>표시할 장소가 없습니다.</p>
          </div>
        ) : (
          // 장소 목록 표시
          <div className="grid gap-4 animate-fade-in">
            {places.map((place, i) => (
              <PlaceCard key={`${place.id}-${i}`} place={place} />
            ))}
          </div>
        )}

        {/* 무한 스크롤 감지 영역 및 로딩 스피너 */}
        <div ref={intersectionRef} className="h-20 flex items-center justify-center">
          {isFetchingNextPage && (
            <div className="size-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
          )}
        </div>
      </div>
    </div>
  );
}
