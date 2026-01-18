import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router";
import { usePlacePopup } from "@/shared/lib/place-popup";
import { 
  MapPin, 
  Star, 
  CheckCircle, 
  TvMinimalPlay, 
  Heart, 
  MessageCircle, 
  Bookmark, 
  ChevronRight,
  Sparkles,
  CookingPot,
  Users,
  Navigation
} from "lucide-react";
import { convertToNaverResizeImageUrl, formatWithCommas } from "@/shared/lib";
import { cn } from "@/shared/lib/utils";
import { useToggleLike, useToggleSave } from "@/entities/place/queries";

interface PlaceCardProps {
  place: any;
  imageAspectRatio?: string;
  imageWidth?: string;
  maxImages?: number;
  showPrice?: boolean;
  showThumbnail?: boolean;
  sourceLabel?: string;
  sourceTitle?: string;
  sourceImage?: string;
  sourcePath?: string;
  addedAt?: string;
  comment?: string;
  distance?: number;
  className?: string;
  hideShadow?: boolean;
}

/**
 * 모바일 최적화 및 플랫 디자인이 적용된 장소 카드
 */
export function PlaceCard({ 
  place, 
  maxImages = 5,
  showPrice = true,
  showThumbnail = true,
  sourceLabel,
  sourceTitle,
  sourceImage,
  sourcePath,
  addedAt,
  comment,
  distance,
  imageAspectRatio = "aspect-[4/3]",
  className,
  hideShadow = false
}: PlaceCardProps) {
  const { show: showPlaceModal } = usePlacePopup();
  const [isLiked, setIsLiked] = useState(place?.interaction?.is_liked ?? place?.experience?.is_liked ?? false);
  const [isSaved, setIsSaved] = useState(place?.interaction?.is_saved ?? place?.experience?.is_saved ?? false);
  const isReviewed = place?.experience?.user_review_id !== null;
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFoldersExpanded, setIsFoldersExpanded] = useState(false);
  const [isCommentExpanded, setIsCommentExpanded] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const toggleLikeMutation = useToggleLike();
  const toggleSaveMutation = useToggleSave();
  
  const showPopup = (id: string) => showPlaceModal(id);
  
  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newStatus = !isLiked;
    setIsLiked(newStatus);
    toggleLikeMutation.mutate({ 
      likedId: place.id, 
      likedType: 'place', 
      refId: place.id 
    });
  };

  const handleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newStatus = !isSaved;
    setIsSaved(newStatus);
    toggleSaveMutation.mutate({ 
      savedId: place.id, 
      savedType: 'place', 
      refId: place.id 
    });
  };
  
  const folders = (place.features || []).filter((f: any) => f.platform_type === "folder");
  const images = place.images || place.image_urls || (place.thumbnail ? [place.thumbnail] : []);
  const displayImages = images.slice(0, maxImages);

  const COMMENT_LIMIT = 80;
  const isLongComment = comment && comment.length > COMMENT_LIMIT;
  const displayComment = isCommentExpanded ? comment : (comment?.slice(0, COMMENT_LIMIT) + (isLongComment ? "..." : ""));
  
  const handleFolderClick = (e: React.MouseEvent, folder: any) => {
    e.stopPropagation();
    if (folder.platform_type === "folder" && folder.metadata?.channelId) {
      navigate(`/feature/detail/folder/${folder.metadata.channelId}`);
    } else {
      navigate(`/feature/detail/folder/${folder.id}`);
    }
  };
  
  const handleFoldersToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsFoldersExpanded(!isFoldersExpanded);
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    e.currentTarget.src = "https://placehold.co/600x400?text=이미지+준비중";
  };

  useEffect(() => {
    setIsLiked(place?.interaction?.is_liked ?? place?.experience?.is_liked ?? false);
    setIsSaved(place?.interaction?.is_saved ?? place?.experience?.is_saved ?? false);
  }, [place?.interaction?.is_liked, place?.interaction?.is_saved, place?.experience?.is_liked, place?.experience?.is_saved]);

  useEffect(() => {
    if (!showThumbnail) return;
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
  }, [displayImages.length, showThumbnail]);

  return (
    <article className={cn(
      "bg-white dark:bg-surface-950 border-b-[12px] border-surface-200/60 dark:border-black",
      className
    )}>
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
              {sourceLabel?.toLowerCase().includes('커뮤니티') ? (
                <Users className="size-3.5 text-white" />
              ) : (
                <Sparkles className="size-3.5 text-white" />
              )}
            </div>
            <div className="flex flex-col">
              {sourceLabel && <span className="text-[10px] font-medium text-primary-500 uppercase">{sourceLabel}</span>}
              {sourceTitle && <span className="text-[13px] font-medium text-surface-700">{sourceTitle}</span>}
            </div>
          </div>
          {addedAt && <span className="text-[11px] text-surface-400">{addedAt}</span>}
        </div>
      )}

      {/* 이미지 슬라이더 - GPU 가속 및 최적화 */}
      {showThumbnail && (
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

              {/* 가격 및 거리 뱃지 - 반투명 배경 */}
              <div className="absolute top-3 left-3 flex items-center gap-2 pointer-events-none">
                {showPrice && place.avg_price > 0 && (
                  <div className="bg-black/70 px-3 py-1.5 rounded-full">
                    <span className="text-[12px] font-medium text-white">
                      {formatWithCommas(place.avg_price, '-', true)}원대
                    </span>
                  </div>
                )}
                {distance !== undefined && distance !== null && (
                  <div className="bg-primary-600/90 px-3 py-1.5 rounded-full flex items-center gap-1">
                    <Navigation className="size-3 text-white fill-current" />
                    <span className="text-[12px] font-medium text-white">
                      {distance < 1000 ? `${Math.round(distance)}m` : `${(distance / 1000).toFixed(1)}km`}
                    </span>
                  </div>
                )}
              </div>

              {/* 폴더 뱃지 - 플랫한 색상 */}
              {folders.length > 0 && (
                <div className="absolute top-3 right-3 pointer-events-none">
                  <div className="bg-emerald-600 text-white px-2.5 py-1 rounded-full text-[11px] font-medium">
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
                <div className="absolute bottom-3 right-3 bg-primary-600 text-white px-2.5 py-1 rounded-full text-[11px] font-medium">
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
      )}

      {/* 컨텐츠 영역 - Flat & Modern */}
      <div className="px-2 pt-1 pb-5">
      {/* 인터랙션 버튼 - 인스타그램 스타일 */}
      <div className="flex items-center justify-between py-2">
        <div className="flex items-center gap-4">
          {/* 하트 + 숫자 */}
          <button 
            onClick={handleLike} 
            className="flex items-center gap-1.5 active:opacity-60 transition-opacity"
          >
            <Heart className={cn(
              "size-[26px] transition-colors", 
              isLiked 
                ? "fill-rose-500 text-rose-500" 
                : "text-surface-800 dark:text-surface-200"
            )} />
            {(place.interaction?.place_liked_count ?? 0) > 0 && (
              <span className="text-[13px] font-medium text-surface-800 dark:text-surface-200">
                {place.interaction.place_liked_count}
              </span>
            )}
          </button>

          {/* 댓글 + 숫자 (채워지는 컬러 없음) */}
          <button 
            onClick={() => showPopup(place.id)} 
            className="flex items-center gap-1.5 active:opacity-60 transition-opacity"
          >
            <MessageCircle className="size-[26px] text-surface-800 dark:text-surface-200" />
            {(place.interaction?.place_reviews_count ?? 0) > 0 && (
              <span className="text-[13px] font-medium text-surface-800 dark:text-surface-200">
                {place.interaction.place_reviews_count}
              </span>
            )}
          </button>

          {/* 지도 */}
          <a 
            href={`https://map.naver.com/p/entry/place/${place.id}`} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="flex items-center text-surface-800 dark:text-surface-200 active:opacity-60 transition-opacity"
            onClick={(e) => e.stopPropagation()}
          >
            <MapPin className="size-[26px]" />
          </a>
        </div>

        {/* 북마크 */}
        <button 
          onClick={handleSave} 
          className="flex items-center active:opacity-60 transition-opacity"
        >
          <Bookmark className={cn(
            "size-[26px] transition-colors", 
            isSaved 
              ? "fill-amber-500 text-amber-500" 
              : "text-surface-800 dark:text-surface-200"
          )} />
        </button>
      </div>

        <div className="cursor-pointer" onClick={() => showPopup(place.id)}>
          <div className="flex items-baseline gap-2 mb-1">
            <h3 className="text-[17px] font-medium text-surface-900 dark:text-white leading-tight">{place.name}</h3>
          </div>
          <div className="flex items-center gap-2 text-[13px] mb-1">
            <span className="font-medium text-surface-500">{place.group1} {place.group2} {place.group3}</span>
            <span className="text-surface-200">|</span>
            <div className="flex items-center gap-0.5 font-medium text-amber-500">
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
              <span className="font-medium mr-2 text-surface-900 dark:text-white">{sourceTitle || "작성자"}</span>
              {displayComment}
              {isLongComment && !isCommentExpanded && (
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsCommentExpanded(true);
                  }}
                  className="ml-1 text-surface-400 font-medium hover:text-surface-600 transition-colors"
                >
                  더 보기
                </button>
              )}
            </p>
          </div>
        )}

        <div className="flex flex-wrap gap-1.5 mt-4">
          <span className="text-[12px] font-medium text-primary-500 bg-primary-50 px-2 py-0.5 rounded">#{place.category}</span>
          {place.keyword_list?.slice(0, 3).map((tag: string, i: number) => (
            <span key={i} className="text-[12px] font-medium text-blue-500 bg-blue-50 px-2 py-0.5 rounded">#{tag}</span>
          ))}
          {folders.length > 0 && (
            <>
              {isFoldersExpanded || folders.length === 1 ? (
                folders.map((folder: any, i: number) => (
                  <button
                    key={folder.id || i}
                    onClick={(e) => handleFolderClick(e, folder)}
                    className="text-[12px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors"
                  >
                    {folder.title || `폴더 ${i + 1}`}
                  </button>
                ))
              ) : (
                <button
                  onClick={handleFoldersToggle}
                  className="text-[12px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors"
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
    </article>
  );
}
