import React from "react";
import { ChevronRight } from "lucide-react";
import { PlaceSliderCard } from "./PlaceSliderCard";
import { cn } from "@/shared/lib/utils";

interface PlaceSliderProps {
  title: string;
  countLabel?: string;
  items: any[];
  onItemClick?: (id: string) => void;
  onMoreClick?: () => void;
  onTitleClick?: () => void;
  showMoreThreshold?: number;
  showRating?: boolean;
  snap?: boolean;
}

export function PlaceSlider({
  title,
  countLabel,
  items,
  onItemClick,
  onMoreClick,
  onTitleClick,
  showMoreThreshold = 10,
  showRating = false,
  snap = false,
}: PlaceSliderProps) {
  return (
    <div className="flex flex-col gap-3.5 mb-6">
      {(title || countLabel) && (
        <div className="flex items-end justify-between gap-2 px-4">
          <h3 
            className={cn(
              "text-xl font-black text-surface-900 dark:text-white leading-tight",
              onTitleClick && "cursor-pointer hover:underline underline-offset-4"
            )}
            onClick={onTitleClick}
          >
            {title}
          </h3>
          {countLabel && (
            <span className="text-sm font-medium text-surface-400 mb-0.5">{countLabel}</span>
          )}
        </div>
      )}
      <div 
        className={cn(
          "flex overflow-x-auto scrollbar-hide gap-3 pb-2 px-4",
          snap && "snap-x"
        )}
        style={{ 
          willChange: 'scroll-position',
          WebkitOverflowScrolling: 'touch',
          transform: 'translateZ(0)',
        }}
      >
        {items.map((item) => (
          <PlaceSliderCard
            key={item.id || item.place_id}
            placeId={item.id || item.place_id}
            name={item.name || item.place_name}
            thumbnail={item.thumbnail}
            group2={item.group2}
            category={item.category}
            score={item.score}
            reviewCount={item.review_count}
            onClick={onItemClick}
            showRating={showRating}
            snap={snap}
          />
        ))}
        
        {onMoreClick && items.length >= showMoreThreshold && (
          <div 
            className={cn(
              "flex-shrink-0 w-36 flex flex-col",
              snap && "snap-start"
            )}
            onClick={onMoreClick}
          >
            <div className="relative aspect-[3/4] rounded-xl border-2 border-dashed border-surface-200 dark:border-surface-800 flex flex-col items-center justify-center gap-2 text-surface-400 hover:text-surface-600 dark:hover:text-surface-200 transition-colors cursor-pointer bg-surface-50 dark:bg-surface-900/50">
              <div className="w-10 h-10 rounded-full bg-white dark:bg-surface-800 shadow-sm flex items-center justify-center">
                <ChevronRight className="size-5" />
              </div>
              <span className="text-[13px] font-bold">더보기</span>
            </div>
            <div className="mt-auto h-6" />
          </div>
        )}
      </div>
    </div>
  );
}
