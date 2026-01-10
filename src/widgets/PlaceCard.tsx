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
  Sparkles,
  CookingPot
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
  sourceImage?: string;
  sourcePath?: string;
  addedAt?: string;
  comment?: string;
}

/**
 * 모바일 최적화 및 플랫 디자인이 적용된 장소 카드
 */
export function PlaceCard({ 
  place, 
  maxImages = 5,
  showPrice = true,
  sourceLabel,
  sourceTitle,
  sourceImage,
  sourcePath,
  addedAt,
  comment,
  imageAspectRatio = "aspect-[4/3]"
}: PlaceCardProps) {
  const { show: showPlaceModal } = usePlacePopup();
  const [isLiked, setIsLiked] = useState(place.interaction?.is_liked || false);
  const [isSaved, setIsSaved] = useState(place.interaction?.is_saved || false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFoldersExpanded, setIsFoldersExpanded] = useState(false);
  const [isCommentExpanded, setIsCommentExpanded] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  
  const showPopup = (id: string) => showPlaceModal(id);
  
  const folders = (place.features || []).filter((f: any) => f.platform_type === "folder");
  const images = place.images || place.image_urls || (place.thumbnail ? [place.thumbnail] : []);
  const displayImages = images.slice(0, maxImages);

  const COMMENT_LIMIT = 80;
  const isLongComment = comment && comment.length > COMMENT_LIMIT;
  const displayComment = isCommentExpanded ? comment : (comment?.slice(0, COMMENT_LIMIT) + (isLongComment ? "..." : ""));
  
  const handleFolderClick = (e: React.MouseEvent, folderId: string) => {
    e.stopPropagation();
    navigate(`/folder/${folderId}`);
  };
  
  const handleFoldersToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsFoldersExpanded(!isFoldersExpanded);
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    e.currentTarget.src = "https://placehold.co/600x400?text=이미지+준비중";
  };

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

  return (
    <article className="bg-white dark:bg-surface-950 border-b border-surface-50">
      {/* 소스 정보 - 플랫한 스타일 */}
      {(sourceTitle || sourceLabel) && (
        <div className="px-4 pt-4 pb-2 flex items-center justify-between">
          <div 
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => sourcePath && navigate(sourcePath)}
          >
            <div className="size-7 rounded-full bg-primary-500 flex items-center justify-center overflow-hidden border border-surface-100 dark:border-surface-800 relative">
              {sourceImage && (
                <img 
                  src={sourceImage} 
                  alt={sourceTitle || "source"} 
                  className="w-full h-full object-cover absolute inset-0 z-10"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              )}
              <Sparkles className="size-3.5 text-white" />
            </div>
            <div className="flex flex-col">
              {sourceLabel && <span className="text-[10px] font-bold text-primary-500 uppercase">{sourceLabel}</span>}
              {sourceTitle && <span className="text-[13px] font-bold text-surface-700">{sourceTitle}</span>}
            </div>
          </div>
          {addedAt && <span className="text-[11px] text-surface-400">{addedAt}</span>}
        </div>
      )}

      {/* 이미지 슬라이더 - GPU 가속 및 최적화 */}
      <div className="relative cursor-pointer" onClick={() => showPopup(place.id)}>
        {displayImages.length > 0 ? (
          <>
            <div 
              ref={sliderRef}
              className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide"
              style={{ willChange: 'scroll-position', WebkitOverflowScrolling: 'touch', transform: 'translateZ(0)' }}
            >
              {displayImages.map((img: string, index: number) => (
                <div key={index} className={cn("flex-shrink-0 w-full snap-center bg-surface-50", imageAspectRatio)}>
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

            {/* 가격 뱃지 - 반투명 검정 배경 (blur 제거) */}
            <div className="absolute top-3 left-3 flex items-center gap-2 pointer-events-none">
              {showPrice && place.avg_price > 0 && (
                <div className="bg-black/70 px-3 py-1.5 rounded-full">
                  <span className="text-[12px] font-bold text-white">
                    {formatWithCommas(place.avg_price, '-', true)}원대
                  </span>
                </div>
              )}
            </div>

            {/* 폴더 뱃지 - 플랫한 색상 */}
            {folders.length > 0 && (
              <div className="absolute top-3 right-3 pointer-events-none">
                <div className="bg-emerald-600 text-white px-2.5 py-1 rounded-full text-[11px] font-bold">
                  {folders.length} 폴더
                </div>
              </div>
            )}

            {/* 인디케이터 - 심플 도트 */}
            {displayImages.length > 1 && (
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-black/40 px-2.5 py-1.5 rounded-full">
                {displayImages.map((_: any, index: number) => (
                  <div key={index} className={cn("rounded-full", currentImageIndex === index ? "w-3 h-1 bg-white" : "w-1 h-1 bg-white/40")} />
                ))}
              </div>
            )}

            {/* 방문 뱃지 */}
            {place.experience?.is_visited && (
              <div className="absolute bottom-3 right-3 bg-primary-600 text-white px-2.5 py-1 rounded-full text-[11px] font-bold">
                방문
              </div>
            )}
          </>
        ) : (
          <div className={cn("bg-surface-200 dark:bg-surface-800 flex flex-col items-center justify-center text-surface-400 dark:text-surface-500", "aspect-[3/2]")}>
            <CookingPot className="size-10 mb-2" />
            <span className="text-xs">이미지 준비중</span>
          </div>
        )}
      </div>

      {/* 컨텐츠 영역 - Flat & Modern */}
      <div className="px-4 pt-4 pb-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-5">
            <button onClick={() => setIsLiked(!isLiked)} className="active:scale-90 transition-transform">
              <Heart className={cn("size-7", isLiked ? "fill-rose-500 text-rose-500" : "text-surface-700 dark:text-surface-300")} />
            </button>
            <button onClick={() => showPopup(place.id)} className="active:scale-90 transition-transform">
              <MessageCircle className={cn(
                "size-7", 
                place.interaction?.is_reviewed 
                  ? "fill-primary-500 text-primary-500" 
                  : "text-surface-700 dark:text-surface-300"
              )} />
            </button>
            <a href={`https://map.naver.com/p/entry/place/${place.id}`} target="_blank" rel="noopener noreferrer" className="active:scale-90 transition-transform" onClick={(e) => e.stopPropagation()}>
              <MapPinned className="size-7 text-surface-700 dark:text-surface-300" />
            </a>
          </div>
          <button onClick={() => setIsSaved(!isSaved)} className="active:scale-90 transition-transform">
            <Bookmark className={cn("size-7", isSaved ? "fill-surface-900 text-surface-900" : "text-surface-700 dark:text-surface-300")} />
          </button>
        </div>

        <div className="cursor-pointer" onClick={() => showPopup(place.id)}>
          <div className="flex items-baseline gap-2 mb-1">
            <h3 className="text-[17px] font-black text-surface-900 dark:text-white leading-tight">{place.name}</h3>
            <span className="text-[13px] text-surface-400 font-medium">{place.group2} {place.group3}</span>
          </div>
          <div className="flex items-center gap-1.5 text-[13px]">
            <div className="flex items-center gap-0.5 font-bold text-amber-500">
              <Star className="size-3.5 fill-current" />
              {place.visitor_reviews_score}
            </div>
            {place.voted_summary_text && (
              <>
                <span className="text-surface-200">|</span>
                <span className="text-surface-600 dark:text-surface-400 font-medium truncate">{place.voted_summary_text}</span>
              </>
            )}
          </div>
        </div>

        {/* 코멘트 표시 - SNS 스타일 */}
        {comment && (
          <div className="mt-3">
            <p className="text-[14px] text-surface-800 dark:text-surface-200 leading-relaxed whitespace-pre-wrap">
              <span className="font-black mr-2 text-surface-900 dark:text-white">{sourceTitle || "작성자"}</span>
              {displayComment}
              {isLongComment && !isCommentExpanded && (
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsCommentExpanded(true);
                  }}
                  className="ml-1 text-surface-400 font-bold hover:text-surface-600 transition-colors"
                >
                  더 보기
                </button>
              )}
            </p>
          </div>
        )}

        <div className="flex flex-wrap gap-1.5 mt-4">
          <span className="text-[12px] font-bold text-primary-500 bg-primary-50 px-2 py-0.5 rounded">#{place.category}</span>
          {place.keyword_list?.slice(0, 3).map((tag: string, i: number) => (
            <span key={i} className="text-[12px] font-bold text-blue-500 bg-blue-50 px-2 py-0.5 rounded">#{tag}</span>
          ))}
          {folders.length > 0 && (
            <>
              {isFoldersExpanded ? (
                folders.map((folder: any, i: number) => (
                  <button
                    key={folder.id || i}
                    onClick={(e) => handleFolderClick(e, folder.id)}
                    className="text-[12px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors"
                  >
                    {folder.title || `폴더 ${i + 1}`}
                  </button>
                ))
              ) : (
                <button
                  onClick={handleFoldersToggle}
                  className="text-[12px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors"
                >
                  {folders[0]?.title || '폴더 1'}
                  {folders.length > 1 && (
                    <span className="ml-1 text-emerald-500">+{folders.length - 1}</span>
                  )}
                </button>
              )}
            </>
          )}
        </div>
      </div>
      <div className="h-2 bg-surface-50" />
    </article>
  );
}
