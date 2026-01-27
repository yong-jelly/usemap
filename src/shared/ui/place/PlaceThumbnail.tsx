import React from "react";
import { CookingPot, Heart, MessageCircle, Bookmark } from "lucide-react";
import { convertToNaverResizeImageUrl, cn } from "@/shared/lib";
import { useIntersection } from "@/shared/lib/use-intersection";

export interface PlaceThumbnailProps {
  placeId: string;
  name: string;
  thumbnail?: string;
  group2?: string;
  group3?: string;
  category?: string;
  features?: any[]; // 폴더 정보 등
  interaction?: {
    place_liked_count?: number;
    place_reviews_count?: number;
    is_saved?: boolean;
  };
  onClick?: (id: string) => void;
  aspectRatio?: string; // "aspect-[3/4]" 등
  rounded?: boolean; // 둥근 모서리 여부
  showBadge?: boolean; // 우측 상단 폴더 배지
  showUnderline?: boolean; // 녹색 언더바
  showCounts?: boolean; // 좋아요/리뷰 카운트
  className?: string;
}

/**
 * 장소 썸네일 공통 컴포넌트
 * ProfilePlacesList와 PlaceSliderCard에서 공통으로 사용됩니다.
 */
export function PlaceThumbnail({
  placeId,
  name,
  thumbnail,
  group2,
  group3,
  category,
  features = [],
  interaction,
  onClick,
  aspectRatio = "aspect-[3/4]",
  rounded = false,
  showBadge = true,
  showUnderline = true,
  showCounts = true,
  className,
}: PlaceThumbnailProps) {
  const folders = (features || []).filter((f: any) => f.platform_type === "folder");
  const hasImage = !!thumbnail;
  const { ref, inView } = useIntersection({
    triggerOnce: true,
    rootMargin: '200px',
  });

  return (
    <div
      ref={ref}
      className={cn(
        "relative bg-surface-100 dark:bg-surface-900 overflow-hidden active:opacity-80 transition-opacity cursor-pointer group flex items-center justify-center",
        aspectRatio,
        rounded && "rounded-xl",
        className
      )}
      onClick={() => onClick?.(placeId)}
    >
      {hasImage ? (
        inView ? (
          <img
            src={convertToNaverResizeImageUrl(thumbnail)}
            className="w-full h-full object-cover animate-in fade-in duration-500"
            alt={name}
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="w-full h-full bg-surface-100 dark:bg-surface-900" />
        )
      ) : (
        <div className="flex flex-col items-center justify-center w-full h-full bg-zinc-800">
          <CookingPot className="size-10 text-zinc-500/50 stroke-[1.5]" />
        </div>
      )}

      {/* 상단 우측 폴더 갯수 배지 */}
      {showBadge && folders.length > 0 && (
        <div className="absolute top-1.5 right-1.5 z-10">
          <span className="flex items-center justify-center min-w-[16px] h-[16px] px-1 bg-[#1E8449] text-white text-[9px] font-black rounded-sm shadow-sm">
            {folders.length}
          </span>
        </div>
      )}

      {/* 하단 정보 오버레이 */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-2 flex flex-col gap-0.5">
        {(group2 || group3 || category) && (
          <span className="text-[10px] text-white/80 font-bold truncate block">
            {group2} {group3} {category && !group2 && `#${category}`}
          </span>
        )}
        <div className="relative inline-block w-fit max-w-full">
          <span className="text-[12px] text-white font-black truncate block leading-tight">
            {name}
          </span>
          {/* 폴더 갯수에 따른 녹색선 언더바 */}
          {showUnderline && folders.length > 0 && (
            <div
              className={cn(
                "absolute -bottom-0.5 left-0 w-full rounded-full",
                folders.length >= 15 ? "h-[2px] bg-[#1E8449]" :
                folders.length >= 12 ? "h-[1.8px] bg-[#229954]" :
                folders.length >= 9 ? "h-[1.5px] bg-[#27AE60]" :
                folders.length >= 6 ? "h-[1.2px] bg-[#2ECC71]" :
                folders.length >= 3 ? "h-[1px] bg-[#52BE80]" :
                "h-[0.8px] bg-[#ABEBC6]"
              )}
            />
          )}
        </div>

        {/* 저장됨 및 좋아요/리뷰 카운트 표시 */}
        {(interaction?.is_saved || (showCounts && (interaction?.place_liked_count || 0) + (interaction?.place_reviews_count || 0) > 0)) && (
          <div className="flex items-center gap-2 mt-0.5">
            {interaction?.is_saved && (
              <div className="flex items-center">
                <Bookmark className="size-3 fill-amber-500 text-amber-500" />
              </div>
            )}
            {showCounts && (interaction?.place_liked_count || 0) > 0 && (
              <div className="flex items-center gap-0.5 text-white">
                <Heart className="size-2.5 fill-rose-500 text-rose-500" />
                <span className="text-[9px] font-bold">{interaction?.place_liked_count}</span>
              </div>
            )}
            {showCounts && (interaction?.place_reviews_count || 0) > 0 && (
              <div className="flex items-center gap-0.5 text-white">
                <MessageCircle className="size-2.5 text-white fill-white/20" />
                <span className="text-[9px] font-bold">{interaction?.place_reviews_count}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
