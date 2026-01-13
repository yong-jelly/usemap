import { useRef, useEffect, useState } from "react";
import { MessageCircle, Loader2, Image as ImageIcon } from "lucide-react";
import { useMyReviews, useMyReviewsCounts } from "@/entities/place/queries";
import { ReviewCard, ImageViewer, PlaceThumbnail } from "@/shared/ui";
import { usePlacePopup } from "@/shared/lib/place-popup";
import { getReviewImageUrl } from "@/shared/lib/storage";
import { useNavigate } from "react-router";
import { cn } from "@/shared/lib/utils";

export function MyReviewsTab() {
  const navigate = useNavigate();
  const { show: showPlaceModal } = usePlacePopup();
  const [filterType, setFilterType] = useState<'public' | 'private' | 'image'>('public');
  const [sortBy, setSortBy] = useState<'latest' | 'score'>('latest');
  
  // 레이아웃 모드를 filterType에 따라 즉시 결정 (상태 동기화 문제 해결)
  const layoutMode = filterType === 'image' ? 'grid' : 'sns';
  
  const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } = useMyReviews(filterType, sortBy);
  const { data: counts } = useMyReviewsCounts();
  const observerTarget = useRef<HTMLDivElement>(null);
  
  const [imageViewerState, setImageViewerState] = useState<{
    isOpen: boolean;
    images: string[];
    initialIndex: number;
  }>({
    isOpen: false,
    images: [],
    initialIndex: 0,
  });

  const reviews = data?.pages.flatMap((page) => page) || [];

  const filters = [
    { id: 'public', label: '공개', count: counts?.public_count },
    { id: 'private', label: '비공개', count: counts?.private_count },
    { id: 'image', label: '이미지', icon: ImageIcon, count: counts?.image_count },
  ] as const;

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
        rootMargin: '200px'
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

  const isInitialLoading = isLoading && reviews.length === 0;

  return (
    <div className="flex flex-col gap-0 bg-white dark:bg-surface-950 min-h-screen">
      {/* 필터 탭 */}
      <div 
        className="flex items-center justify-between px-5 py-3 bg-white dark:bg-surface-950 sticky top-24 z-10 border-b border-surface-50 dark:border-surface-900"
      >
        <div 
          className="flex items-center gap-2 overflow-x-auto scrollbar-hide flex-1"
          style={{ 
            willChange: 'scroll-position',
            WebkitOverflowScrolling: 'touch',
            transform: 'translateZ(0)',
          }}
        >
          {filters.map((filter) => (
            <button
              key={filter.id}
              onClick={() => setFilterType(filter.id)}
              className={cn(
                "px-3.5 py-1.5 rounded-full text-[12px] font-bold transition-all flex items-center gap-1.5 border shrink-0",
                filterType === filter.id
                  ? "bg-surface-900 text-white border-surface-900 dark:bg-white dark:text-black dark:border-white shadow-sm"
                  : "bg-surface-50 text-surface-500 border-surface-100 dark:bg-surface-900 dark:text-surface-400 dark:border-surface-800"
              )}
            >
              {filter.icon && <filter.icon className="size-3" />}
              {filter.label}
              {filter.count !== undefined && (
                <span className={cn(
                  "text-[10px] opacity-60 font-medium",
                  filterType === filter.id ? "text-white" : "text-surface-400"
                )}>
                  {filter.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* 정렬 토글 */}
        <div className="flex items-center gap-1 ml-4 shrink-0 bg-surface-50 dark:bg-surface-900 p-1 rounded-lg border border-surface-100 dark:border-surface-800">
          <button
            onClick={() => setSortBy('latest')}
            className={cn(
              "px-2.5 py-1 rounded-md text-[11px] font-bold transition-all",
              sortBy === 'latest' 
                ? "bg-white dark:bg-surface-800 text-surface-900 dark:text-white shadow-sm" 
                : "text-surface-400"
            )}
          >
            날짜순
          </button>
          <button
            onClick={() => setSortBy('score')}
            className={cn(
              "px-2.5 py-1 rounded-md text-[11px] font-bold transition-all",
              sortBy === 'score' 
                ? "bg-white dark:bg-surface-800 text-surface-900 dark:text-white shadow-sm" 
                : "text-surface-400"
            )}
          >
            별점순
          </button>
        </div>
      </div>

      {isInitialLoading ? (
        <div className="flex-1 flex flex-col gap-2 p-2.5">
          {[1, 2, 3, 4, 5].map((i) => (
            <div 
              key={i} 
              className="bg-surface-50 dark:bg-surface-900/40 rounded-[20px] h-40 animate-pulse"
            />
          ))}
        </div>
      ) : reviews.length > 0 ? (
        layoutMode === 'grid' ? (
          <div className="grid grid-cols-3 gap-0.5 bg-white dark:bg-surface-950 w-full overflow-hidden">
            {reviews.map((review) => {
              const place = review.place_data;
              // 리뷰 이미지가 있으면 getReviewImageUrl로 변환, 없으면 장소 이미지
              const thumbnail = (review.images && review.images.length > 0) 
                ? getReviewImageUrl(review.images[0].image_path, "thumbnail") 
                : (place.image_urls && place.image_urls.length > 0 ? place.image_urls[0] : undefined);
              
              return (
                <PlaceThumbnail
                  key={review.id}
                  placeId={review.place_id}
                  name={place.name}
                  thumbnail={thumbnail}
                  group2={place.group2}
                  group3={place.group3}
                  category={place.category}
                  onClick={(id) => showPlaceModal(id)}
                  aspectRatio="aspect-square"
                  showBadge={false}
                  showUnderline={false}
                  showCounts={false}
                  className="w-full border-none"
                />
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col gap-2 p-2.5">
            {reviews.map((review) => (
              <div 
                key={review.id} 
                className="bg-white dark:bg-surface-900 rounded-[20px] border border-surface-100 dark:border-surface-800/60 shadow-sm overflow-hidden p-4"
              >
                <ReviewCard
                  review={review}
                  isMyReview={true}
                  showActions={false}
                  onCardClick={(placeId) => showPlaceModal(placeId)}
                  onImageClick={(images, index) => setImageViewerState({
                    isOpen: true,
                    images,
                    initialIndex: index
                  })}
                />
              </div>
            ))}
          </div>
        )
      ) : (
        <div className="flex flex-col items-center justify-center py-32 text-center text-surface-500">
          <div className="mb-4 text-surface-300 dark:text-surface-700">
            <MessageCircle className="h-16 w-16 opacity-10" />
          </div>
          <p className="text-lg font-bold text-surface-900 dark:text-white">리뷰가 없습니다</p>
          <p className="text-sm text-surface-500 mt-1">방문한 장소에 대한 첫 리뷰를 남겨보세요!</p>
        </div>
      )}

      {hasNextPage && (
        <div ref={observerTarget} className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-primary-500" />
        </div>
      )}

      <ImageViewer
        images={imageViewerState.images}
        initialIndex={imageViewerState.initialIndex}
        isOpen={imageViewerState.isOpen}
        onClose={() => setImageViewerState(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
