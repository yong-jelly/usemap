import { Star, Lock, Pencil, Trash2, MapPin } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { safeFormatDate } from "@/shared/lib/date";
import { getReviewImageUrl } from "@/shared/lib/storage";
import type { PlaceUserReview, MyReview } from "@/entities/place/types";

interface ReviewCardProps {
  /** 리뷰 데이터 */
  review: PlaceUserReview | MyReview;
  /** 표시 스타일 변형 */
  variant?: "compact" | "full";
  /** 본인 리뷰 여부 (수정/삭제 버튼 노출) */
  isMyReview?: boolean;
  /** 수정/삭제 버튼 노출 여부 (기본 true) */
  showActions?: boolean;
  /** 수정 버튼 클릭 콜백 */
  onEdit?: () => void;
  /** 삭제 버튼 클릭 콜백 */
  onDelete?: () => void;
  /** 이미지 클릭 콜백 */
  onImageClick?: (images: string[], index: number) => void;
  /** 프로필 클릭 콜백 */
  onProfileClick?: (userId: string) => void;
  /** 카드 전체 클릭 콜백 (장소 정보가 있을 때) */
  onCardClick?: (placeId: string) => void;
}

/**
 * 사용자 리뷰 카드 컴포넌트
 * compact: 가로 스크롤용 요약 카드
 * full: 리스트용 상세 카드
 */
export function ReviewCard({
  review,
  variant = "full",
  isMyReview,
  showActions = true,
  onEdit,
  onDelete,
  onImageClick,
  onProfileClick,
  onCardClick,
}: ReviewCardProps) {
  const { user_id, user_profile, created_at, score, review_content, tags, images, is_private } = review;
  const place_data = 'place_data' in review ? review.place_data : undefined;

  if (variant === "compact") {
    return (
      <article 
        className={cn(
          "flex-shrink-0 w-72 p-4 rounded-xl border shadow-sm transition-colors",
          is_private 
            ? "bg-surface-50/50 dark:bg-surface-900/50 border-surface-100 dark:border-surface-800" 
            : "bg-white dark:bg-surface-900 border-surface-50 dark:border-surface-900",
          onCardClick && "cursor-pointer active:scale-[0.98]"
        )}
        onClick={() => onCardClick?.(review.place_id)}
      >
        <div className="flex gap-3 mb-2">
          <img
            src={user_profile?.profile_image_url || "/default-avatar.png"}
            className={cn(
              "size-8 rounded-full bg-surface-100 object-cover",
              onProfileClick && "cursor-pointer"
            )}
            loading="lazy"
            decoding="async"
            alt={user_profile?.nickname || "익명"}
            onClick={(e) => {
              if (onProfileClick) {
                e.stopPropagation();
                onProfileClick(user_id);
              }
            }}
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span 
                className={cn(
                  "font-medium text-[13px] truncate",
                  onProfileClick && "cursor-pointer hover:underline"
                )}
                onClick={(e) => {
                  if (onProfileClick) {
                    e.stopPropagation();
                    onProfileClick(user_id);
                  }
                }}
              >
                {user_profile?.nickname || "익명"}
              </span>
            <span className="text-[11px] text-surface-400 shrink-0">
              {safeFormatDate(created_at, { year: 'numeric', month: 'short', day: 'numeric' })}
            </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-0.5 text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={cn(
                      "size-2.5",
                      i < score ? "fill-current" : "text-surface-100"
                    )}
                  />
                ))}
              </div>
              {isMyReview && showActions && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit?.();
                    }}
                    className="p-1 text-surface-400 hover:text-primary-500"
                  >
                    <Pencil className="size-3.5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete?.();
                    }}
                    className="p-1 text-surface-400 hover:text-rose-500"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {place_data && (
          <div className="flex items-center gap-1.5 mb-2 px-2 py-1 bg-surface-100 dark:bg-surface-800 rounded-lg">
            <MapPin className="size-3 text-surface-400" />
            <span className="text-[11px] font-medium text-surface-600 dark:text-surface-300 truncate">
              {place_data.name}
            </span>
          </div>
        )}

        <p className="text-[13px] text-surface-600 dark:text-surface-400 leading-relaxed line-clamp-2 h-10 mb-2">
          {review_content}
        </p>

        {images && images.length > 0 && (
          <div className="flex gap-2 overflow-x-auto scrollbar-hide py-1">
            {images.map((img, i) => (
              <div
                key={img.id}
                className="relative size-12 rounded-lg overflow-hidden border border-surface-50 cursor-pointer"
                onClick={(e) => e.stopPropagation()}
              >
                <img
                  src={getReviewImageUrl(img.image_path, "thumbnail")}
                  className="w-full h-full object-cover"
                  onClick={(e) => {
                    e.stopPropagation();
                    const allFullImages = images.map(
                      (image) => getReviewImageUrl(image.image_path, "full") || ""
                    );
                    onImageClick?.(allFullImages, i);
                  }}
                  alt={`리뷰 이미지 ${i + 1}`}
                />
                {i === 2 && images.length > 3 && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-[10px] font-medium text-white pointer-events-none">
                    +{images.length - 3}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex flex-wrap gap-1 mt-2 min-w-0 flex-1">
            {tags && tags.length > 0 && tags.slice(0, 2).map((tag) => (
              <span
                key={tag.code}
                className="text-[10px] text-surface-400 bg-surface-50 px-1.5 py-0.5 rounded truncate max-w-[80px]"
              >
                {tag.label}
              </span>
            ))}
            {tags && tags.length > 2 && (
              <span className="text-[10px] text-surface-300">+{tags.length - 2}</span>
            )}
          </div>
          {is_private && (
            <Lock className="size-3 text-surface-400 ml-2" />
          )}
        </div>
      </article>
    );
  }

  return (
    <article 
      className={cn(
        "flex flex-col gap-3",
        onCardClick && "active:scale-[0.99]"
      )}
      onClick={() => onCardClick?.(review.place_id)}
    >
      <div className="flex items-center gap-3">
        <img
          src={user_profile?.profile_image_url || "/default-avatar.png"}
          className={cn(
            "size-10 rounded-full bg-surface-100 object-cover border border-surface-50 dark:border-surface-800 shadow-sm",
            onProfileClick && "cursor-pointer"
          )}
          loading="lazy"
          decoding="async"
          alt={user_profile?.nickname || "익명"}
          onClick={(e) => {
            if (onProfileClick) {
              e.stopPropagation();
              onProfileClick(user_id);
            }
          }}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-0.5">
            <div className="flex items-center gap-1.5 min-w-0">
              <span 
                className={cn(
                  "font-medium text-[15px] text-surface-900 dark:text-white truncate",
                  onProfileClick && "cursor-pointer hover:underline"
                )}
                onClick={(e) => {
                  if (onProfileClick) {
                    e.stopPropagation();
                    onProfileClick(user_id);
                  }
                }}
              >
                {user_profile?.nickname || "익명"}
              </span>
              {is_private && (
                <Lock className="size-3.5 text-surface-300 fill-current" />
              )}
            </div>
            <span className="text-[12px] text-surface-400 font-medium shrink-0">
              {safeFormatDate(created_at, { year: 'numeric', month: 'short', day: 'numeric' })}
            </span>
          </div>

          <div className="flex items-center gap-0.5 text-amber-400 mb-2">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={cn(
                  "size-3.5",
                  i < score ? "fill-current" : "text-surface-100 dark:text-surface-800"
                )}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 ml-13">
        {place_data && (
          <div className="flex items-center gap-2 px-3 py-2 bg-surface-50 dark:bg-surface-900/50 rounded-xl border border-surface-50 dark:border-surface-900/50 w-fit max-w-full group hover:border-primary-200 dark:hover:border-primary-900 transition-colors">
            <MapPin className="size-4 text-primary-500" />
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-[13px] font-medium text-surface-900 dark:text-surface-100 truncate">
                {place_data.name}
              </span>
              <span className="text-[11px] text-surface-400 font-medium">
                {place_data.group1} {place_data.group2}
              </span>
            </div>
          </div>
        )}

        <p className="text-[14px] text-surface-700 dark:text-surface-300 leading-relaxed whitespace-pre-line font-medium">
          {review_content}
        </p>

        {images && images.length > 0 && (
          <div 
            className="flex gap-2 overflow-x-auto scrollbar-hide py-1"
            style={{ 
              willChange: 'scroll-position',
              WebkitOverflowScrolling: 'touch',
              transform: 'translateZ(0)',
            }}
          >
            {images.map((img, index) => (
              <div
                key={img.id}
                className="flex-shrink-0 size-20 rounded-lg overflow-hidden border border-surface-50 dark:border-surface-900 shadow-sm hover:opacity-90 cursor-pointer"
                onClick={(e) => e.stopPropagation()}
              >
                <img
                  src={getReviewImageUrl(img.image_path, "thumbnail")}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  decoding="async"
                  onClick={(e) => {
                    e.stopPropagation();
                    const allFullImages = images.map(
                      (image) => getReviewImageUrl(image.image_path, "full") || ""
                    );
                    onImageClick?.(allFullImages, index);
                  }}
                  alt={`리뷰 이미지 ${index + 1}`}
                />
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between mt-1">
          <div className="flex flex-wrap gap-1.5">
            {tags && tags.map((tag) => (
              <span
                key={tag.code}
                className="text-[11px] font-medium text-surface-500 dark:text-surface-400 bg-surface-100/50 dark:bg-surface-900 px-2 py-1 rounded-lg"
              >
                #{tag.label}
              </span>
            ))}
          </div>

          {isMyReview && showActions && (
            <div className="flex items-center gap-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit?.();
                }}
                className="p-2 text-surface-400 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-full transition-all"
              >
                <Pencil className="size-4" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete?.();
                }}
                className="p-2 text-surface-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-full transition-all"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
