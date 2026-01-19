import { useState } from "react";
import { useFolderReviews, useUpsertFolderReview } from "@/entities/folder/queries";
import { Button, Input } from "@/shared/ui";
import { 
  Star, 
  Loader2, 
  MessageSquare, 
  ChevronDown, 
  ChevronUp,
  User as UserIcon
} from "lucide-react";
import { cn, formatKoreanDate } from "@/shared/lib/utils";
import { useUserStore } from "@/entities/user";
import type { FolderReview } from "@/entities/folder/types";

interface FolderReviewSectionProps {
  folderId: string;
  placeId: string;
  placeName: string;
}

export function FolderReviewSection({ folderId, placeId, placeName }: FolderReviewSectionProps) {
  const { isAuthenticated } = useUserStore();
  const { data: reviews = [], isLoading } = useFolderReviews(folderId, placeId);
  const { mutate: upsertReview, isPending } = useUpsertFolderReview();
  
  const [isExpanded, setIsExpanded] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [score, setScore] = useState(0);
  const [content, setContent] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (score === 0 || !content.trim()) return;

    upsertReview({
      folderId,
      placeId,
      reviewContent: content,
      score,
    }, {
      onSuccess: () => {
        setShowForm(false);
        setScore(0);
        setContent("");
      }
    });
  };

  const myReview = reviews.find((r: FolderReview) => r.is_my_review);
  const otherReviews = reviews.filter((r: FolderReview) => !r.is_my_review);
  const avgScore = reviews.length > 0 
    ? (reviews.reduce((acc: number, r: FolderReview) => acc + r.score, 0) / reviews.length).toFixed(1)
    : null;

  if (isLoading) {
    return (
      <div className="flex justify-center py-4">
        <Loader2 className="size-5 animate-spin text-surface-300" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 p-4 bg-surface-50 dark:bg-surface-900 rounded-2xl">
      <button 
        className="flex items-center justify-between"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <MessageSquare className="size-4 text-primary-500" />
          <span className="text-sm font-bold">비공개 리뷰</span>
          <span className="text-xs text-surface-400">({reviews.length})</span>
          {avgScore && (
            <div className="flex items-center gap-1 ml-2">
              <Star className="size-3.5 fill-amber-400 text-amber-400" />
              <span className="text-sm font-bold text-amber-500">{avgScore}</span>
            </div>
          )}
        </div>
        {isExpanded ? (
          <ChevronUp className="size-5 text-surface-400" />
        ) : (
          <ChevronDown className="size-5 text-surface-400" />
        )}
      </button>

      {isExpanded && (
        <div className="flex flex-col gap-4 pt-2">
          {/* 내 리뷰 */}
          {myReview ? (
            <div className="p-3 bg-white dark:bg-surface-800 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-primary-500">내 리뷰</span>
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star 
                        key={i} 
                        className={cn(
                          "size-3",
                          i <= myReview.score ? "fill-amber-400 text-amber-400" : "text-surface-200"
                        )} 
                      />
                    ))}
                  </div>
                </div>
                <span className="text-xs text-surface-400">
                  {formatKoreanDate(myReview.created_at)}
                </span>
              </div>
              <p className="text-sm">{myReview.review_content}</p>
            </div>
          ) : isAuthenticated && (
            showForm ? (
              <form onSubmit={handleSubmit} className="p-3 bg-white dark:bg-surface-800 rounded-xl flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-surface-500">평점</span>
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setScore(i)}
                        className="p-0.5"
                      >
                        <Star 
                          className={cn(
                            "size-5 transition-colors",
                            i <= score ? "fill-amber-400 text-amber-400" : "text-surface-200"
                          )} 
                        />
                      </button>
                    ))}
                  </div>
                </div>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="이 폴더 멤버들에게만 보여지는 리뷰입니다."
                  className="w-full p-3 text-base bg-surface-50 dark:bg-surface-900 rounded-xl resize-none h-20 focus:outline-none"
                />
                <div className="flex justify-end gap-2">
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setShowForm(false)}
                  >
                    취소
                  </Button>
                  <Button 
                    type="submit" 
                    size="sm"
                    disabled={score === 0 || !content.trim() || isPending}
                  >
                    {isPending ? <Loader2 className="size-4 animate-spin" /> : "등록"}
                  </Button>
                </div>
              </form>
            ) : (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowForm(true)}
                className="gap-1.5"
              >
                <Star className="size-4" />
                비공개 리뷰 작성
              </Button>
            )
          )}

          {/* 다른 멤버 리뷰 */}
          {otherReviews.length > 0 && (
            <div className="flex flex-col gap-2">
              {otherReviews.map((review: FolderReview) => (
                <div key={review.id} className="p-3 bg-white dark:bg-surface-800 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {review.user_avatar ? (
                        <img 
                          src={review.user_avatar} 
                          alt="" 
                          className="size-5 rounded-full object-cover"
                        />
                      ) : (
                        <div className="size-5 rounded-full bg-surface-200 flex items-center justify-center">
                          <UserIcon className="size-3 text-surface-400" />
                        </div>
                      )}
                      <span className="text-xs font-medium">{review.user_nickname || '익명'}</span>
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <Star 
                            key={i} 
                            className={cn(
                              "size-3",
                              i <= review.score ? "fill-amber-400 text-amber-400" : "text-surface-200"
                            )} 
                          />
                        ))}
                      </div>
                    </div>
                    <span className="text-xs text-surface-400">
                      {formatKoreanDate(review.created_at)}
                    </span>
                  </div>
                  <p className="text-sm">{review.review_content}</p>
                </div>
              ))}
            </div>
          )}

          {reviews.length === 0 && !showForm && (
            <p className="text-sm text-surface-400 text-center py-2">
              아직 리뷰가 없습니다.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
