import { useState } from "react";
import { 
  MapPinned, 
  Star, 
  CheckCircle, 
  TvMinimalPlay, 
  Heart, 
  MessageCircle, 
  Bookmark, 
  Share2,
  MoreHorizontal,
  FolderCheck
} from "lucide-react";
import { Card, Button } from "@/shared/ui";
import { convertToNaverResizeImageUrl, formatWithCommas } from "@/shared/lib";
import { cn } from "@/shared/lib/utils";
import { usePlacePopup } from "@/shared/lib/place-popup";

interface PlaceCardProps {
  place: any;
}

/**
 * 현대적인 인스타그램/X 스타일의 장소 카드 컴포넌트
 * Svelte의 explore/components/PlaceCard.svelte 로직을 똑같이 재현
 */
export function PlaceCard({ place }: PlaceCardProps) {
  const [isLiked, setIsLiked] = useState(place.interaction?.is_liked || false);
  const [isSaved, setIsSaved] = useState(place.interaction?.is_saved || false);
  const showPopup = usePlacePopup((state) => state.show);

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    e.currentTarget.src = "https://placehold.co/600x400?text=이미지 준비중";
  };

  const images = place.images || [];

  return (
    <div className="bg-white dark:bg-surface-900 border-b border-surface-100 dark:border-surface-800 last:border-none overflow-hidden">
      {/* 1. 헤더 영역 */}
      <header className="flex items-center border-b border-surface-50 dark:border-surface-800 p-3">
        <div className="flex flex-col flex-1">
          <div className="flex items-center gap-1 flex-wrap">
            <span 
              className="text-base font-bold text-surface-900 dark:text-white cursor-pointer"
              onClick={() => showPopup(place.id)}
            >
              {place.name}
            </span>
            {place.experience?.is_visited && (
              <>
                <span className="text-xs text-surface-400">•</span>
                <CheckCircle className="size-4 text-red-600 fill-red-600/10" />
              </>
            )}
            {place.features && place.features.length > 0 && (
              <>
                <span className="text-xs text-surface-400">•</span>
                <TvMinimalPlay className="size-4 text-red-600" />
              </>
            )}
            {place.naver_folder?.folders?.length > 0 && (
              <>
                <span className="text-xs text-surface-400">•</span>
                <FolderCheck className="size-4 text-red-600" />
              </>
            )}
            <span className="text-xs text-surface-400">•</span>
            <div className="flex items-center gap-1">
              <Star className="size-3.5 fill-yellow-400 text-yellow-400" />
              <span className="text-xs font-bold text-surface-900 dark:text-white">
                {place.visitor_reviews_score}
              </span>
              <span className="text-xs text-surface-400">
                ({formatWithCommas(place.visitor_reviews_total)})
              </span>
            </div>
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
              {place.category}
            </span>
            <span className="text-[13px] text-surface-500 truncate max-w-[200px]">
              {place.address}
            </span>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="size-8 text-surface-400 ml-auto">
          <MoreHorizontal className="size-5" />
        </Button>
      </header>

      {/* 2. 이미지 영역 (Svelte 로직 재현) */}
      <div 
        className="w-full cursor-pointer bg-surface-50 dark:bg-surface-800"
        onClick={() => showPopup(place.id)}
      >
        {images.length === 1 && (
          <div className="h-80 w-full overflow-hidden">
            <img
              src={convertToNaverResizeImageUrl(images[0])}
              alt={place.name}
              className="h-full w-full object-cover"
              onError={handleImageError}
              loading="lazy"
            />
          </div>
        )}
        {images.length === 2 && (
          <div className="grid h-80 w-full grid-cols-2 gap-1 overflow-hidden">
            <img
              src={convertToNaverResizeImageUrl(images[0])}
              alt={`${place.name} 1`}
              className="h-full w-full object-cover"
              onError={handleImageError}
              loading="lazy"
            />
            <img
              src={convertToNaverResizeImageUrl(images[1])}
              alt={`${place.name} 2`}
              className="h-full w-full object-cover"
              onError={handleImageError}
              loading="lazy"
            />
          </div>
        )}
        {images.length >= 3 && (
          <div className="grid h-[220px] w-full grid-cols-3 overflow-hidden">
            <img
              src={convertToNaverResizeImageUrl(images[0])}
              alt={`${place.name} 1`}
              className="col-span-2 h-[220px] w-full border border-surface-50 dark:border-surface-800 object-cover"
              onError={handleImageError}
              loading="lazy"
            />
            <div className="grid h-[220px] grid-rows-2">
              <img
                src={convertToNaverResizeImageUrl(images[1])}
                alt={`${place.name} 2`}
                className="h-full w-full border border-surface-50 dark:border-surface-800 object-cover"
                onError={handleImageError}
                loading="lazy"
              />
              <div className="relative">
                <img
                  src={convertToNaverResizeImageUrl(images[2])}
                  alt={`${place.name} 3`}
                  className="h-full w-full border border-surface-50 dark:border-surface-800 object-cover"
                  onError={handleImageError}
                  loading="lazy"
                />
                {images.length > 3 && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white font-bold text-xs">
                    +{images.length - 3}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        {images.length === 0 && (
          <div className="h-40 flex items-center justify-center text-surface-300">
            이미지 없음
          </div>
        )}
      </div>

      {/* 3. 정보 및 태그 영역 */}
      <div className="px-3 pt-3 pb-4 space-y-3">
        {/* 지역 태그 */}
        <div className="flex flex-wrap gap-2">
          {place.group1 && (
            <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-[11px] font-bold dark:bg-blue-900/30 dark:text-blue-400">
              {place.group1}
            </span>
          )}
          {place.group2 && (
            <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 text-[11px] font-bold dark:bg-indigo-900/30 dark:text-indigo-400">
              {place.group2}
            </span>
          )}
          {place.group3 && (
            <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 text-[11px] font-bold dark:bg-indigo-900/30 dark:text-indigo-400">
              {place.group3}
            </span>
          )}
        </div>

        {/* 가격 정보 */}
        {place.avg_price > 0 && (
          <div className="flex items-center gap-1">
            <span className="text-xs text-surface-500">가격</span>
            <span className="text-sm font-bold text-surface-900 dark:text-white">
              {formatWithCommas(place.avg_price)}원대
            </span>
          </div>
        )}

        {/* 해시태그 및 테마 */}
        {(place.keyword_list?.length > 0 || place.themes?.length > 0) && (
          <div className="flex flex-wrap gap-x-2 gap-y-1">
            {[...(place.keyword_list || []), ...(place.themes || [])].map((tag: string, i: number) => (
              <span key={i} className="text-[13px] text-blue-600 dark:text-blue-400 font-medium hover:underline cursor-pointer">
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* 특별 뱃지 (Svelte 로직 참고) */}
        {place.features && place.features.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-1">
            {place.features.map((feature: any, i: number) => (
              feature.platform_type === 'folder' && (
                <span key={i} className="inline-flex items-center gap-1 rounded bg-green-50 px-2 py-0.5 text-xs font-bold text-green-700 dark:bg-green-900/30 dark:text-green-400">
                  #{feature.title || '추천'}
                </span>
              )
            ))}
          </div>
        )}
      </div>

      {/* 4. 액션 바 */}
      <div className="flex items-center justify-between border-t border-surface-50 dark:border-surface-800 px-2 py-2">
        <div className="flex items-center gap-1">
          {/* 좋아요 */}
          <button 
            onClick={() => setIsLiked(!isLiked)}
            className="flex items-center gap-1.5 px-2 py-1.5 rounded-full transition-colors hover:bg-surface-50 dark:hover:bg-surface-800"
          >
            <Heart className={cn("size-4.5", (isLiked || place.interaction?.is_liked) ? "fill-red-500 text-red-500" : "text-surface-500")} />
            <span className="text-sm font-bold text-surface-700 dark:text-surface-300">
              {place.interaction?.place_liked_count || 0}
            </span>
          </button>

          {/* 댓글 */}
          <button 
            onClick={() => showPopup(place.id)}
            className="flex items-center gap-1.5 px-2 py-1.5 rounded-full transition-colors hover:bg-surface-50 dark:hover:bg-surface-800"
          >
            <MessageCircle className={cn("size-4.5", place.interaction?.is_commented ? "fill-red-500 text-red-500" : "text-surface-500")} />
            <span className="text-sm font-bold text-surface-700 dark:text-surface-300">
              {place.interaction?.place_comment_count || 0}
            </span>
          </button>

          {/* 저장 */}
          <button 
            onClick={() => setIsSaved(!isSaved)}
            className="flex items-center gap-1.5 px-2 py-1.5 rounded-full transition-colors hover:bg-surface-50 dark:hover:bg-surface-800"
          >
            <Bookmark className={cn("size-4.5", (isSaved || place.interaction?.is_saved) ? "fill-blue-600 text-blue-600" : "text-surface-500")} />
            <span className="text-sm font-bold text-surface-700 dark:text-surface-300">저장</span>
          </button>
        </div>

        {/* 네이버 지도 버튼 */}
        <a
          href={`https://map.naver.com/p/entry/place/${place.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-surface-500 hover:bg-green-50 dark:hover:bg-green-900/20 hover:text-green-600 transition-colors"
          onClick={(e) => e.stopPropagation()}
        >
          <MapPinned className="size-4.5" />
          <span className="text-sm font-bold">지도</span>
        </a>
      </div>
    </div>
  );
}
