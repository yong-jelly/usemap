import { useNavigate } from "react-router";
import { Star, ThumbsUp } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { convertToNaverResizeImageUrl } from "@/shared/lib";

export interface RankingPlace {
  place_id: string;
  name: string;
  region: string;
  votes: number;
  category: string;
  visitor_reviews_score: number;
  visitor_reviews_total: number;
  images: string[];
  road_address: string;
}

interface RankingListProps {
  places: RankingPlace[];
  isLoading: boolean;
}

export function RankingList({ places, isLoading }: RankingListProps) {
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 px-4 pb-20">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex gap-4 p-4 bg-white dark:bg-surface-900 rounded-xl shadow-sm border border-surface-100 dark:border-surface-800 animate-pulse">
            <div className="w-24 h-24 bg-surface-200 dark:bg-surface-800 rounded-lg flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-5 bg-surface-200 dark:bg-surface-800 rounded w-3/4" />
              <div className="h-4 bg-surface-200 dark:bg-surface-800 rounded w-1/2" />
              <div className="h-4 bg-surface-200 dark:bg-surface-800 rounded w-1/4" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (places.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-surface-500">
        <p>랭킹 데이터가 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 px-4 pb-20">
      {places.map((place, index) => (
        <div 
          key={place.place_id}
          onClick={() => navigate(`/place/${place.place_id}`)}
          className="flex gap-4 p-4 bg-white dark:bg-surface-900 rounded-xl shadow-sm border border-surface-100 dark:border-surface-800 active:scale-[0.98] transition-transform cursor-pointer relative overflow-hidden"
        >
          {/* 랭킹 배지 */}
          <div className={cn(
            "absolute top-0 left-0 w-8 h-8 flex items-center justify-center rounded-br-xl text-sm font-bold text-white z-10",
            index < 3 ? "bg-primary-500" : "bg-surface-500"
          )}>
            {index + 1}
          </div>

          {/* 이미지 */}
          <div className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0 bg-surface-100 relative">
            {place.images && place.images.length > 0 ? (
              <img 
                src={convertToNaverResizeImageUrl(place.images[0])} 
                alt={place.name}
                className="w-full h-full object-cover"
                loading="lazy"
                decoding="async"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-surface-400 text-xs">
                No Image
              </div>
            )}
          </div>

          {/* 정보 */}
          <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
            <div>
              <h3 className="text-lg font-bold text-surface-900 dark:text-surface-50 truncate leading-tight mb-1">
                {place.name}
              </h3>
              <p className="text-sm text-surface-500 truncate">
                {place.region} · {place.category}
              </p>
            </div>
            
            <div className="flex items-center gap-3 text-sm mt-2">
              <div className="flex items-center gap-1 text-amber-500 font-medium">
                <Star className="size-3.5 fill-current" />
                {place.visitor_reviews_score > 0 ? place.visitor_reviews_score.toFixed(1) : '-'}
              </div>
              <div className="flex items-center gap-1 text-primary-600 font-medium">
                <ThumbsUp className="size-3.5" />
                {place.votes.toLocaleString()}표
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
