import { Star, SquareX, Bookmark } from "lucide-react";
import { convertToNaverResizeImageUrl } from "@/shared/lib";
import { cn } from "@/shared/lib/utils";

interface PlaceSliderCardProps {
  placeId: string;
  name: string;
  thumbnail?: string;
  group2?: string;
  category?: string;
  score?: number;
  reviewCount?: number;
  onClick?: (id: string) => void;
  showRating?: boolean;
  snap?: boolean;
}

export function PlaceSliderCard({
  placeId,
  name,
  thumbnail,
  group2,
  category,
  score = 0,
  reviewCount = 0,
  onClick,
  showRating = false,
  snap = false,
}: PlaceSliderCardProps) {
  return (
    <div 
      className={cn(
        "flex-shrink-0 w-36 cursor-pointer group",
        snap && "snap-start"
      )}
      onClick={() => onClick?.(placeId)}
    >
      <div className="relative aspect-[3/4] rounded-xl overflow-hidden mb-2 shadow-sm bg-surface-100 dark:bg-surface-800">
        {thumbnail ? (
          <img 
            src={convertToNaverResizeImageUrl(thumbnail)} 
            alt={name} 
            className="w-full h-full object-cover transition-transform group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-surface-300 dark:text-surface-600">
            <SquareX className="size-8 stroke-[1.5]" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
        <div className="absolute bottom-2 left-2 right-8 flex flex-col gap-0.5">
          <span className="text-white text-[13px] font-bold line-clamp-1">{name}</span>
          <div className="flex items-center gap-1 text-white/80 text-[10px] font-medium">
            <span>{group2}</span>
            <span className="opacity-50">•</span>
            <span>{category}</span>
          </div>
        </div>
        <button className="absolute bottom-2 right-2 p-1 text-white/90 hover:text-white transition-colors">
          <Bookmark className="size-4" />
        </button>
      </div>
      {showRating && (
        <div className="flex items-center gap-1.5 mt-1">
           <div className="flex items-center gap-0.5">
              <Star className="size-3 text-yellow-400 fill-yellow-400" />
              <span className="text-[11px] font-black">{score}</span>
           </div>
           <span className="text-[11px] text-surface-400">({reviewCount})</span>
        </div>
      )}
    </div>
  );
}
