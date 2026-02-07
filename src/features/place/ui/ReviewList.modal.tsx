import { useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, Plus } from "lucide-react";
import { useNavigate } from "react-router";
import { useUserStore } from "@/entities/user";
import { ReviewCard, ImageViewer } from "@/shared/ui";
import { cn } from "@/shared/lib/utils";
import type { PlaceUserReview } from "@/entities/place/types";

interface ReviewListModalProps {
  placeId: string;
  placeName: string;
  reviews: PlaceUserReview[];
  onClose: () => void;
  onEdit: (reviewId: string) => void;
  onDelete: (reviewId: string) => void;
  // onWrite: () => void;
}

export function ReviewListModal({
  placeId,
  placeName,
  reviews,
  onClose,
  onEdit,
  onDelete,
  onWrite
}: ReviewListModalProps) {
  const navigate = useNavigate();
  const { profile: currentUser, isAuthenticated } = useUserStore();
  
  const [showOnlyMyReviews, setShowOnlyMyReviews] = useState(false);
  const [imageViewerState, setImageViewerState] = useState<{
    isOpen: boolean;
    images: string[];
    initialIndex: number;
  }>({
    isOpen: false,
    images: [],
    initialIndex: 0,
  });

  const filteredReviews = useMemo(() => {
    const publicReviews = reviews.filter(r => !r.is_my_review || !r.is_private || r.is_my_review);
    // Note: The logic in original was slightly different, keeping it functional
    const accessibleReviews = reviews.filter(r => !r.is_private || r.is_my_review);
    if (showOnlyMyReviews) {
      return accessibleReviews.filter(r => r.is_my_review);
    }
    return accessibleReviews;
  }, [reviews, showOnlyMyReviews]);

  const myReview = useMemo(() => reviews.find(r => r.is_my_review), [reviews]);

  return createPortal(
    <>
      <div className="fixed inset-0 z-[120] flex items-center justify-center">
        <div className="absolute inset-0 bg-black/70" onClick={onClose} />
        
        <div className={cn(
          "relative w-full h-full bg-white dark:bg-surface-950 flex flex-col",
          "md:max-w-md md:h-[90vh] md:rounded-[24px] md:overflow-hidden"
        )}>
          {/* 헤더 */}
          <header className="flex h-14 items-center px-4 shrink-0 bg-white dark:bg-surface-900">
            <button 
              onClick={onClose} 
              className="p-1.5 -ml-1.5 rounded-full hover:bg-surface-100 dark:hover:bg-surface-800"
            >
              {/* <ChevronLeft className="h-5 w-5 text-surface-600 dark:text-surface-400" /> */}
              <ChevronLeft className="h-6 w-6 text-surface-900 dark:text-surface-100" />
            </button>
            <div className="ml-3 flex-1 min-w-0">
              {/* <h1 className="text-lg font-bold text-surface-900 dark:text-surface-50 truncate">
                리뷰 <span className="text-primary-500">{reviews.length}</span>
              </h1> */}
              {/* <p className="text-[11px] text-surface-400 truncate">{placeName}</p> */}
            </div>
            
            {/* <button 
              onClick={onWrite}
              className="px-3 py-1.5 text-sm font-bold text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-950/30 rounded-lg"
            >
              작성
            </button> */}
          </header>

          {/* 메인 영역 */}
          <div 
            className="flex-1 overflow-y-auto pb-safe scrollbar-hide bg-white dark:bg-surface-950"
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            {isAuthenticated && myReview && (
              <div className="sticky top-0 z-10 bg-white dark:bg-surface-950 px-4 py-3 border-b border-surface-100 dark:border-surface-800">
                <button
                  onClick={() => setShowOnlyMyReviews(!showOnlyMyReviews)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-[13px] font-medium transition-all border",
                    showOnlyMyReviews 
                      ? "bg-primary-500 border-primary-500 text-white shadow-sm shadow-primary-100" 
                      : "bg-white dark:bg-surface-900 border-surface-200 dark:border-surface-700 text-surface-500"
                  )}
                >
                  내 리뷰만 보기
                </button>
              </div>
            )}

            <div className="p-4 space-y-3">
              {filteredReviews.length > 0 ? (
                filteredReviews.map(review => (
                  <div 
                    key={review.id} 
                    className="bg-white dark:bg-surface-950 rounded-xl border border-surface-200 dark:border-surface-800 p-4 shadow-sm"
                  >
                    <ReviewCard
                      review={review}
                      isMyReview={review.is_my_review}
                      onEdit={() => onEdit(review.id)}
                      onDelete={() => onDelete(review.id)}
                      onProfileClick={(userId) => navigate(`/p/user/${userId}`)}
                      onImageClick={(images, index) => setImageViewerState({
                        isOpen: true,
                        images,
                        initialIndex: index
                      })}
                    />
                  </div>
                ))
              ) : (
                <div className="py-20 text-center">
                  <p className="text-surface-400">작성된 리뷰가 없습니다.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <ImageViewer
          images={imageViewerState.images}
          initialIndex={imageViewerState.initialIndex}
          isOpen={imageViewerState.isOpen}
          onClose={() => setImageViewerState(prev => ({ ...prev, isOpen: false }))}
        />
      </div>
    </>,
    document.body
  );
}
