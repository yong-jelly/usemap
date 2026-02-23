import { useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, Plus, LayoutGrid, List } from "lucide-react";
import { useNavigate } from "react-router";
import { useUserStore } from "@/entities/user";
import { ReviewCard, ImageViewer } from "@/shared/ui";
import { cn } from "@/shared/lib/utils";
import type { PlaceUserReview } from "@/entities/place/types";

type ViewMode = "feed" | "grid";
type FilterType = "all" | "photo" | "5star" | "again" | "atmosphere";
type SortType = "latest" | "score_high" | "score_low";

interface ReviewListModalProps {
  placeId: string;
  placeName: string;
  reviews: PlaceUserReview[];
  onClose: () => void;
  onEdit: (reviewId: string) => void;
  onDelete: (reviewId: string) => void;
  onWrite?: () => void;
}

export function ReviewListModal({
  placeId,
  placeName,
  reviews,
  onClose,
  onEdit,
  onDelete,
  onWrite,
}: ReviewListModalProps) {
  const navigate = useNavigate();
  const { profile: currentUser, isAuthenticated } = useUserStore();

  const [showOnlyMyReviews, setShowOnlyMyReviews] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("feed");
  const [filter, setFilter] = useState<FilterType>("all");
  const [sort, setSort] = useState<SortType>("latest");
  const [imageViewerState, setImageViewerState] = useState<{
    isOpen: boolean;
    images: string[];
    initialIndex: number;
  }>({
    isOpen: false,
    images: [],
    initialIndex: 0,
  });

  const filteredAndSortedReviews = useMemo(() => {
    const accessibleReviews = reviews.filter((r) => !r.is_private || r.is_my_review);
    let result = showOnlyMyReviews
      ? accessibleReviews.filter((r) => r.is_my_review)
      : accessibleReviews;

    if (filter === "photo") {
      result = result.filter((r) => (r.images?.length ?? 0) > 0 || r.has_images);
    } else if (filter === "5star") {
      result = result.filter((r) => r.score === 5);
    } else if (filter === "again") {
      result = result.filter((r) => r.tags?.some((t) => t.code === "again"));
    } else if (filter === "atmosphere") {
      result = result.filter((r) =>
        r.tags?.some((t) => t.code === "good_atmosphere" || t.code === "bad_atmosphere")
      );
    }

    if (sort === "latest") {
      result = [...result].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    } else if (sort === "score_high") {
      result = [...result].sort((a, b) => b.score - a.score);
    } else if (sort === "score_low") {
      result = [...result].sort((a, b) => a.score - b.score);
    }

    return result;
  }, [reviews, showOnlyMyReviews, filter, sort]);

  const myReview = useMemo(() => reviews.find((r) => r.is_my_review), [reviews]);

  const filterChips: { id: FilterType; label: string }[] = [
    { id: "all", label: "전체" },
    { id: "photo", label: "사진만" },
    { id: "5star", label: "5점" },
    { id: "again", label: "재방문" },
    { id: "atmosphere", label: "분위기" },
  ];

  return createPortal(
    <>
      <div className="fixed inset-0 z-[120] flex items-center justify-center">
        <div className="absolute inset-0 bg-black/70" onClick={onClose} />
        
        <div className={cn(
          "relative w-full h-full bg-white dark:bg-surface-950 flex flex-col",
          "md:max-w-md md:h-[90vh] md:rounded-[24px] md:overflow-hidden"
        )}>
          {/* 헤더 */}
          <header className="flex h-14 items-center px-4 shrink-0 bg-white dark:bg-surface-950 border-b border-surface-100 dark:border-surface-800">
            <button
              onClick={onClose}
              className="p-1.5 -ml-1.5 rounded-full hover:bg-surface-100 dark:hover:bg-surface-800"
            >
              <ChevronLeft className="h-6 w-6 text-surface-900 dark:text-surface-100" />
            </button>
            <div className="ml-3 flex-1 min-w-0">
              <h1 className="text-[15px] font-semibold text-surface-900 dark:text-surface-100">
                리뷰 <span className="text-primary-500">{filteredAndSortedReviews.length}</span>
              </h1>
              <p className="text-[11px] text-surface-400 truncate">{placeName}</p>
            </div>
            {isAuthenticated && onWrite && (
              <button
                onClick={onWrite}
                className="flex items-center gap-1 px-3 py-1.5 bg-primary-500 text-white text-[13px] font-medium rounded-lg active:scale-95"
              >
                <Plus className="size-4" /> 작성
              </button>
            )}
          </header>

          {/* Sticky 컨트롤: View Toggle + Filter + Sort + 내 리뷰 */}
          <div className="sticky top-0 z-10 bg-white dark:bg-surface-950 border-b border-surface-100 dark:border-surface-800 px-4 py-3 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1 bg-surface-100 dark:bg-surface-800 p-1 rounded-lg">
                <button
                  onClick={() => setViewMode("feed")}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-medium transition-all",
                    viewMode === "feed"
                      ? "bg-white dark:bg-surface-700 text-surface-900 dark:text-white shadow-sm"
                      : "text-surface-500"
                  )}
                >
                  <List className="size-3.5" /> 피드
                </button>
                <button
                  onClick={() => setViewMode("grid")}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-medium transition-all",
                    viewMode === "grid"
                      ? "bg-white dark:bg-surface-700 text-surface-900 dark:text-white shadow-sm"
                      : "text-surface-500"
                  )}
                >
                  <LayoutGrid className="size-3.5" /> 그리드
                </button>
              </div>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortType)}
                className="text-[12px] font-medium bg-surface-100 dark:bg-surface-800 border-0 rounded-lg px-2.5 py-1.5 text-surface-600 dark:text-surface-400 focus:ring-1 focus:ring-primary-500"
              >
                <option value="latest">최신순</option>
                <option value="score_high">평점높음</option>
                <option value="score_low">평점낮음</option>
              </select>
            </div>
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-0.5">
              {isAuthenticated && myReview && (
                <button
                  onClick={() => setShowOnlyMyReviews(!showOnlyMyReviews)}
                  className={cn(
                    "shrink-0 px-3 py-1.5 rounded-full text-[12px] font-medium transition-all border",
                    showOnlyMyReviews
                      ? "bg-primary-500 border-primary-500 text-white"
                      : "bg-surface-100 dark:bg-surface-800 border-transparent text-surface-500"
                  )}
                >
                  내 리뷰
                </button>
              )}
              {filterChips.map((chip) => (
                <button
                  key={chip.id}
                  onClick={() => setFilter(chip.id)}
                  className={cn(
                    "shrink-0 px-3 py-1.5 rounded-full text-[12px] font-medium transition-all border",
                    filter === chip.id
                      ? "bg-primary-500 border-primary-500 text-white"
                      : "bg-surface-100 dark:bg-surface-800 border-transparent text-surface-500"
                  )}
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </div>

          {/* 메인 영역 */}
          <div
            className="flex-1 overflow-y-auto pb-safe scrollbar-hide bg-white dark:bg-surface-950"
            style={{ WebkitOverflowScrolling: "touch" }}
          >
            <div className="p-4">
              {filteredAndSortedReviews.length > 0 ? (
                viewMode === "feed" ? (
                  <div className="space-y-3">
                    {filteredAndSortedReviews.map((review) => (
                      <div
                        key={review.id}
                        className="rounded-xl border border-surface-100 dark:border-surface-800 overflow-hidden bg-white dark:bg-surface-900"
                      >
                        <ReviewCard
                          variant="feed"
                          review={review}
                          isMyReview={review.is_my_review}
                          onEdit={() => onEdit(review.id)}
                          onDelete={() => onDelete(review.id)}
                          onProfileClick={(userId) => navigate(`/p/user/${userId}`)}
                          onImageClick={(images, index) =>
                            setImageViewerState({
                              isOpen: true,
                              images,
                              initialIndex: index,
                            })
                          }
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {filteredAndSortedReviews.map((review) => (
                      <div
                        key={review.id}
                        className="rounded-xl border border-surface-100 dark:border-surface-800 overflow-hidden bg-white dark:bg-surface-900"
                      >
                        <ReviewCard
                          variant="grid"
                          review={review}
                          isMyReview={review.is_my_review}
                          onEdit={() => onEdit(review.id)}
                          onDelete={() => onDelete(review.id)}
                          onProfileClick={(userId) => navigate(`/p/user/${userId}`)}
                          onImageClick={(images, index) =>
                            setImageViewerState({
                              isOpen: true,
                              images,
                              initialIndex: index,
                            })
                          }
                        />
                      </div>
                    ))}
                  </div>
                )
              ) : (
                <div className="py-20 text-center">
                  <p className="text-surface-400 text-[14px]">
                    {filter !== "all" || showOnlyMyReviews
                      ? "조건에 맞는 리뷰가 없습니다."
                      : "작성된 리뷰가 없습니다."}
                  </p>
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
