import { Star } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { PlaceThumbnail } from "./PlaceThumbnail";

interface PlaceSliderCardProps {
  placeId: string;
  name: string;
  thumbnail?: string;
  group2?: string;
  category?: string;
  score?: number;
  reviewCount?: number;
  placeLikedCount?: number;
  placeReviewsCount?: number;
  features?: any[];
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
  placeLikedCount = 0,
  placeReviewsCount = 0,
  features = [],
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
    >
      <PlaceThumbnail
        placeId={placeId}
        name={name}
        thumbnail={thumbnail}
        group2={group2}
        category={category}
        features={features}
        interaction={{
          place_liked_count: placeLikedCount,
          place_reviews_count: placeReviewsCount,
        }}
        onClick={onClick}
        aspectRatio="aspect-[3/4]"
        rounded
        showBadge
        showUnderline
        showCounts
      />
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
