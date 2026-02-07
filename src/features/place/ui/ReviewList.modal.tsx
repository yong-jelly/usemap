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
  onWrite: () => void;
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
    const publicReviews = reviews.filter(r => !r.is_private || r.is_my_review);
    if (showOnlyMyReviews) {
      return publicReviews.filter(r => r.is_my_review);
    }
    return publicReviews;
  }, [reviews, showOnlyMyReviews]);

  const myReview = useMemo(() => reviews.find(r => r.is_my_review), [reviews]);

  return createPortal(
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-white dark:bg-surface-950">
      <div className="w-full h-full flex flex-col md:max-w-md md:h-[90vh] md:rounded-[24px] md:overflow-hidden md:border md:border-surface-200 md:shadow-xl relative bg-white dark:bg-surface-950">
        <header className="relative z-20 flex h-14 flex-shrink-0 items-center justify-between px-4 bg-white dark:bg-surface-950 border-b border-surface-100 dark:border-surface-800">
          <div className="flex items-center gap-2">
            <button 
              onClick={onClose} 
              className="p-2 -ml-2 hover:bg-surface-100 dark:hover:bg-surface-800 rounded-lg transition-colors"
            >
              <ChevronLeft className="h-6 w-6 text-surface-900 dark:text-surface-100" />
            </button>
            <h2 className="text-lg font-medium text-surface-900 dark:text-white truncate max-w-[200px]">
              방문 리뷰 <span className="text-primary-500">{reviews.length}</span>
            </h2>
          </div>
          
          <button 
            onClick={onWrite}
            className="flex items-center gap-1 px-3 py-1.5 bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 text-[13px] font-medium rounded-lg active:scale-95 transition-transform"
          >
            <Plus className="size-3.5" />
            작성
          </button>
        </header>

        <div className="flex-1 overflow-y-auto pb-safe scrollbar-hide bg-surface-50 dark:bg-surface-900">
          <div className="sticky top-0 z-10 bg-white/80 dark:bg-surface-950/80 backdrop-blur-md px-4 py-3 border-b border-surface-100 dark:border-surface-800">
            {isAuthenticated && myReview && (
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
            )}
          </div>

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
    </div>,
    document.body
  );
}
