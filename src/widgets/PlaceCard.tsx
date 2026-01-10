import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router";
import { usePlacePopup } from "@/shared/lib/place-popup";
import { 
  MapPinned, 
  Star, 
  CheckCircle, 
  TvMinimalPlay, 
  Heart, 
  MessageCircle, 
  Bookmark, 
  ChevronRight,
  Sparkles
} from "lucide-react";
import { convertToNaverResizeImageUrl, formatWithCommas } from "@/shared/lib";
import { cn } from "@/shared/lib/utils";

interface PlaceCardProps {
  place: any;
  imageAspectRatio?: string;
  imageWidth?: string;
  maxImages?: number;
  showPrice?: boolean;
  sourceLabel?: string;
  sourceTitle?: string;
  sourcePath?: string;
  addedAt?: string;
}

/**
 * 현대적이고 세련된 장소 피드 카드
 * 전체 너비 이미지 슬라이드 + 도트 인디케이터 + 오버레이 뱃지
 */
export function PlaceCard({ 
  place, 
  maxImages = 5,
  showPrice = true,
  sourceLabel,
  sourceTitle,
  sourcePath,
  addedAt
}: PlaceCardProps) {
  const { show: showPlaceModal } = usePlacePopup();
  const [isLiked, setIsLiked] = useState(place.interaction?.is_liked || false);
  const [isSaved, setIsSaved] = useState(place.interaction?.is_saved || false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const sliderRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  
  const showPopup = (id: string) => showPlaceModal(id);
  
  const folders = (place.features || []).filter((f: any) => f.platform_type === "folder");
  const images = place.images || place.image_urls || (place.thumbnail ? [place.thumbnail] : []);
  const displayImages = images.slice(0, maxImages);

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    e.currentTarget.src = "https://placehold.co/600x400?text=이미지+준비중";
  };

  // 스크롤 위치 감지하여 현재 이미지 인덱스 업데이트
  useEffect(() => {
    const slider = sliderRef.current;
    if (!slider || displayImages.length <= 1) return;

    const handleScroll = () => {
      const scrollLeft = slider.scrollLeft;
      const itemWidth = slider.offsetWidth;
      const newIndex = Math.round(scrollLeft / itemWidth);
      setCurrentImageIndex(Math.min(newIndex, displayImages.length - 1));
    };

    slider.addEventListener('scroll', handleScroll, { passive: true });
    return () => slider.removeEventListener('scroll', handleScroll);
  }, [displayImages.length]);

  // 도트 클릭 시 해당 이미지로 스크롤
  const scrollToImage = (index: number) => {
    if (!sliderRef.current) return;
    const itemWidth = sliderRef.current.offsetWidth;
    sliderRef.current.scrollTo({ left: itemWidth * index, behavior: 'smooth' });
  };

  return (
    <article className="bg-white dark:bg-surface-950 mb-3">
      {/* 피드 소스 정보 헤더 */}
      {(sourceTitle || sourceLabel) && (
        <div className="px-4 pt-4 pb-2 flex items-center justify-between">
          <div 
            className={cn(
              "flex items-center gap-2 cursor-pointer group",
              !sourcePath && "cursor-default"
            )}
            onClick={() => sourcePath && navigate(sourcePath)}
          >
            <div className="size-8 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
              <Sparkles className="size-4 text-white" />
            </div>
            <div className="flex flex-col">
              {sourceLabel && (
                <span className="text-[10px] font-bold text-primary-500 uppercase tracking-wide">
                  {sourceLabel}
                </span>
              )}
              {sourceTitle && (
                <span className="text-[13px] font-bold text-surface-700 dark:text-surface-300 group-hover:text-primary-600 transition-colors">
                  {sourceTitle}
                </span>
              )}
            </div>
          </div>
          {addedAt && (
            <span className="text-[11px] font-medium text-surface-400">{addedAt}</span>
          )}
        </div>
      )}

      {/* 이미지 슬라이드 - 전체 너비 */}
      <div 
        className="relative cursor-pointer"
        onClick={() => showPopup(place.id)}
      >
        {displayImages.length > 0 ? (
          <>
            <div 
              ref={sliderRef}
              className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide"
              style={{ 
                scrollSnapType: 'x mandatory',
                WebkitOverflowScrolling: 'touch',
              }}
            >
              {displayImages.map((img: string, index: number) => (
                <div 
                  key={index}
                  className="flex-shrink-0 w-full aspect-[4/5] snap-center bg-surface-100 dark:bg-surface-900"
                >
                  <img
                    src={convertToNaverResizeImageUrl(img)}
                    alt={`${place.name} ${index + 1}`}
                    className="w-full h-full object-cover"
                    onError={handleImageError}
                    loading={index === 0 ? "eager" : "lazy"}
                    decoding="async"
                  />
                </div>
              ))}
            </div>

            {/* 이미지 오버레이 - 좌상단 뱃지 */}
            <div className="absolute top-3 left-3 flex items-center gap-2 pointer-events-none">
              {showPrice && place.avg_price > 0 && (
                <div className="bg-white/95 dark:bg-surface-900/95 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-lg">
                  <span className="text-[13px] font-black text-surface-800 dark:text-white">
                    {formatWithCommas(place.avg_price, '-', true)}원대
                  </span>
                </div>
              )}
            </div>

            {/* 우상단 폴더 수 뱃지 */}
            {folders.length > 0 && (
              <div className="absolute top-3 right-3 pointer-events-none">
                <div className="bg-emerald-500 text-white px-2.5 py-1 rounded-full shadow-lg flex items-center gap-1">
                  <span className="text-[11px] font-black">{folders.length}</span>
                  <span className="text-[10px] font-bold opacity-90">폴더</span>
                </div>
              </div>
            )}

            {/* 도트 인디케이터 */}
            {displayImages.length > 1 && (
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-black/30 backdrop-blur-sm px-2.5 py-1.5 rounded-full">
                {displayImages.map((_, index) => (
                  <button
                    key={index}
                    onClick={(e) => {
                      e.stopPropagation();
                      scrollToImage(index);
                    }}
                    className={cn(
                      "rounded-full transition-all duration-200",
                      currentImageIndex === index 
                        ? "w-5 h-1.5 bg-white" 
                        : "w-1.5 h-1.5 bg-white/50 hover:bg-white/70"
                    )}
                  />
                ))}
              </div>
            )}

            {/* 방문 뱃지 */}
            {place.experience?.is_visited && (
              <div className="absolute bottom-3 right-3 bg-primary-500 text-white px-2.5 py-1 rounded-full shadow-lg flex items-center gap-1">
                <CheckCircle className="size-3.5" />
                <span className="text-[11px] font-bold">방문</span>
              </div>
            )}
          </>
        ) : (
          <div className="aspect-[4/5] bg-surface-100 dark:bg-surface-900 flex flex-col items-center justify-center">
            <TvMinimalPlay className="size-12 text-surface-300 dark:text-surface-700" />
            <span className="text-[13px] text-surface-400 dark:text-surface-600 mt-2 font-medium">이미지 준비중</span>
          </div>
        )}
      </div>

      {/* 컨텐츠 영역 */}
      <div className="px-4 pt-3 pb-4">
        {/* 액션 버튼 */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsLiked(!isLiked)}
              className="group active:scale-90 transition-transform"
            >
              <Heart 
                className={cn(
                  "size-6 transition-colors",
                  isLiked 
                    ? "fill-rose-500 text-rose-500" 
                    : "text-surface-700 dark:text-surface-300"
                )} 
              />
            </button>
            <button 
              onClick={() => showPopup(place.id)}
              className="group active:scale-90 transition-transform"
            >
              <MessageCircle className="size-6 text-surface-700 dark:text-surface-300" />
            </button>
            <a
              href={`https://map.naver.com/p/entry/place/${place.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="active:scale-90 transition-transform"
              onClick={(e) => e.stopPropagation()}
            >
              <MapPinned className="size-6 text-surface-700 dark:text-surface-300" />
            </a>
          </div>
          <button 
            onClick={() => setIsSaved(!isSaved)}
            className="group active:scale-90 transition-transform"
          >
            <Bookmark 
              className={cn(
                "size-6 transition-colors",
                isSaved 
                  ? "fill-surface-900 text-surface-900 dark:fill-white dark:text-white" 
                  : "text-surface-700 dark:text-surface-300"
              )} 
            />
          </button>
        </div>

        {/* 좋아요 수 */}
        {(place.interaction?.place_liked_count > 0 || isLiked) && (
          <div className="mb-2">
            <span className="text-[13px] font-bold text-surface-900 dark:text-white">
              좋아요 {(place.interaction?.place_liked_count || 0) + (isLiked ? 1 : 0)}개
            </span>
          </div>
        )}

        {/* 장소명 + 위치 */}
        <div 
          className="cursor-pointer"
          onClick={() => showPopup(place.id)}
        >
          <div className="flex items-start gap-2 mb-1">
            <h3 className="text-[16px] font-black text-surface-900 dark:text-white leading-tight">
              {place.name}
            </h3>
            {folders.length > 0 && (
              <div 
                className={cn(
                  "mt-0.5 h-1 rounded-full flex-shrink-0 w-8",
                  folders.length >= 15 ? "bg-emerald-600" :
                  folders.length >= 10 ? "bg-emerald-500" :
                  folders.length >= 5 ? "bg-emerald-400" :
                  "bg-emerald-300"
                )} 
              />
            )}
          </div>
          <div className="flex items-center gap-2 text-[13px] text-surface-500 dark:text-surface-400">
            <span className="font-medium">{place.group2} {place.group3}</span>
            <span>·</span>
            <div className="flex items-center gap-0.5">
              <Star className="size-3.5 fill-amber-400 text-amber-400" />
              <span className="font-bold">{place.visitor_reviews_score}</span>
            </div>
          </div>
        </div>

        {/* 추천 요약 */}
        {place.voted_summary_text && (
          <p className="mt-2.5 text-[14px] text-surface-700 dark:text-surface-300 leading-relaxed">
            <span className="font-bold text-surface-900 dark:text-white">추천</span>{' '}
            {place.voted_summary_text}
          </p>
        )}

        {/* 해시태그 */}
        <div className="flex flex-wrap gap-x-1.5 gap-y-1 mt-3">
          <span 
            className="text-[13px] font-bold text-primary-500 cursor-pointer hover:text-primary-600 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              // 카테고리 필터 적용 가능
            }}
          >
            #{place.category}
          </span>
          {place.keyword_list?.slice(0, 4).map((tag: string, i: number) => (
            <span 
              key={i} 
              className="text-[13px] font-bold text-blue-500 cursor-pointer hover:text-blue-600 transition-colors"
            >
              #{tag}
            </span>
          ))}
        </div>

        {/* 폴더 태그 */}
        {folders.length > 0 && (
          <div className="flex items-center gap-2 mt-3 overflow-x-auto scrollbar-hide">
            {folders.slice(0, 3).map((folder: any, i: number) => (
              <button 
                key={i}
                className="flex-shrink-0 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 text-[12px] font-bold rounded-lg border border-emerald-100 dark:border-emerald-800/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors active:scale-95"
                onClick={() => navigate(`/folder/${folder.id || folder.feature?.id}`)}
              >
                📁 {folder.title || folder.feature?.title || '폴더'}
              </button>
            ))}
            {folders.length > 3 && (
              <button 
                className="flex-shrink-0 px-3 py-1.5 bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400 text-[12px] font-bold rounded-lg hover:bg-surface-200 dark:hover:bg-surface-700 transition-colors flex items-center gap-0.5"
                onClick={() => showPopup(place.id)}
              >
                +{folders.length - 3}개 더보기
                <ChevronRight className="size-3.5" />
              </button>
            )}
          </div>
        )}

        {/* 댓글 미리보기 (있다면) */}
        {place.interaction?.place_comment_count > 0 && (
          <button 
            className="mt-3 text-[13px] text-surface-400 dark:text-surface-500 font-medium"
            onClick={() => showPopup(place.id)}
          >
            댓글 {place.interaction.place_comment_count}개 모두 보기
          </button>
        )}
      </div>

      {/* 카드 구분선 */}
      <div className="h-2 bg-surface-50 dark:bg-surface-900" />
    </article>
  );
}
