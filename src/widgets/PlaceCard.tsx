import React, { useState } from "react";
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
  MoreHorizontal,
  FolderCheck,
  Flag
} from "lucide-react";
import { Button } from "@/shared/ui";
import { convertToNaverResizeImageUrl, formatWithCommas } from "@/shared/lib";
import { cn } from "@/shared/lib/utils";

interface PlaceCardProps {
  place: any;
  imageAspectRatio?: string; // e.g., "aspect-[4/5]"
  imageWidth?: string; // e.g., "w-[80%]"
  maxImages?: number; // 최대 표시 이미지 개수
  showPrice?: boolean;
  // 피드용 메타 정보
  sourceLabel?: string;
  sourceTitle?: string;
  sourcePath?: string;
  addedAt?: string;
}

/**
 * 여성 직장인 타겟의 미니멀 콘텐츠 중심 장소 카드
 * 마스코트 테마(Navy, Orange, Cream)를 활용한 소프트 벡터 스타일
 */
export function PlaceCard({ 
  place, 
  imageAspectRatio = "aspect-[3/2]", 
  imageWidth = "w-[72%]",
  maxImages,
  showPrice = true,
  sourceLabel,
  sourceTitle,
  sourcePath,
  addedAt
}: PlaceCardProps) {
  const { show: showPlaceModal } = usePlacePopup();
  const [isLiked, setIsLiked] = useState(place.interaction?.is_liked || false);
  const [isSaved, setIsSaved] = useState(place.interaction?.is_saved || false);
  const [showAllFolders, setShowAllFolders] = useState(false);
  
  // 전역 상태 기반 모달: 부모 페이지 재마운트 없이 모달 열기
  const showPopup = (id: string) => showPlaceModal(id);
  
  const folders = (place.features || []).filter((f: any) => f.platform_type === "folder");
  
  // ... rest of the code ...

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    e.currentTarget.src = "https://placehold.co/600x400?text=이미지 준비중";
  };

  const images = place.images || place.image_urls || (place.thumbnail ? [place.thumbnail] : []);
  const navigate = useNavigate();

  return (
    <div className="bg-white dark:bg-surface-900 border-b-8 border-[#FFF9F5] last:border-none overflow-hidden transition-colors duration-150">
      {/* 0. 피드 소스 정보 (선택적) */}
      {(sourceTitle || sourceLabel) && (
        <div className="px-5 pt-5 pb-1 flex items-center justify-between">
          <div 
            className={cn(
              "flex flex-col cursor-pointer group",
              !sourcePath && "cursor-default"
            )}
            onClick={() => sourcePath && navigate(sourcePath)}
          >
            {sourceLabel && (
              <span className="text-[10px] font-bold text-primary-500 uppercase tracking-widest mb-0.5">
                {sourceLabel}
              </span>
            )}
            {sourceTitle && (
              <h3 className="text-[13px] font-bold text-[#2B4562]/60 dark:text-white/60 group-hover:underline underline-offset-2">
                {sourceTitle}
              </h3>
            )}
          </div>
          {addedAt && (
            <span className="text-[10px] font-medium text-surface-300">
              {addedAt}
            </span>
          )}
        </div>
      )}

      {/* 1. 상단 정보 - 미니멀 헤더 */}
      <header className="flex items-start justify-between p-5 pb-3">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <div className="relative">
              <h3 
                className="text-[19px] font-black text-[#2B4562] dark:text-white cursor-pointer tracking-tight relative z-10"
                onClick={() => showPopup(place.id)}
              >
                {place.name}
              </h3>
              {folders.length > 0 && (
                <div 
                  className={cn(
                    "absolute -bottom-1 left-0 w-full rounded-full transition-colors duration-150",
                    folders.length >= 15 ? "h-[5px] bg-[#1E8449]" :
                    folders.length >= 12 ? "h-[4.5px] bg-[#229954]" :
                    folders.length >= 9 ? "h-[4px] bg-[#27AE60]" :
                    folders.length >= 6 ? "h-[3.5px] bg-[#2ECC71]" :
                    folders.length >= 3 ? "h-[3px] bg-[#52BE80]" :
                    "h-[2.5px] bg-[#ABEBC6]"
                  )} 
                />
              )}
            </div>
            {folders.length > 0 && (
              <span className="flex items-center justify-center min-w-[18px] h-[18px] px-1 bg-[#1E8449] text-white text-[10px] font-black rounded -mt-3 animate-in zoom-in duration-300">
                {folders.length}
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-2 text-[13px] text-[#2B4562]/40 font-medium">
            <span>{place.group2} {place.group3}</span>
            <span className="text-[10px]">•</span>
            <div className="flex items-center gap-1">
              <Star strokeWidth={1.2} className="size-3 fill-current" />
              <span>{place.visitor_reviews_score}</span>
            </div>
          </div>
        </div>

        {/* 커뮤니티 스탬프 배지 (미니멀하게 우측 상단 모음) */}
        <div className="flex items-center gap-1">
          {place.experience?.is_visited && (
            <div className="size-7 bg-[#F48E54]/10 rounded-full flex items-center justify-center border border-[#F48E54]/20" title="방문">
              <CheckCircle strokeWidth={1.2} className="size-3.5 text-[#F48E54]" />
            </div>
          )}
          {/* {place.features && place.features.length > 0 && (
            <div className="flex items-center gap-1 bg-[#2B4562]/5 px-2 py-1 rounded-full border border-[#2B4562]/5" title="편의시설">
              <FolderCheck className="size-3.5 text-[#2B4562]/60" />
              <span className="text-[11px] font-black text-[#2B4562]/60">{place.features.length}</span>
            </div>
          )} */}
          <Button variant="ghost" size="icon" className="size-7 text-[#2B4562]/20 hover:text-[#2B4562] ml-1">
            <MoreHorizontal strokeWidth={1.2} className="size-4" />
          </Button>
        </div>
      </header>

      {/* 2. 이미지 피드 - Threads 스타일 가로 스크롤 (세로형) */}
      <div 
        className="w-full cursor-pointer bg-white dark:bg-surface-900"
        onClick={() => showPopup(place.id)}
      >
        {images.length > 0 ? (
          <div 
            className={cn(
              "flex gap-3 px-5 py-1",
              (maxImages === 1 || images.length === 1) 
                ? "overflow-hidden" 
                : "overflow-x-auto snap-x snap-mandatory scrollbar-hide"
            )}
            style={{ 
              willChange: 'scroll-position',
              WebkitOverflowScrolling: 'touch',
              transform: 'translateZ(0)',
            }}
          >
            {images.slice(0, maxImages || 5).map((img: string, index: number) => (
              <div 
                key={index}
                className={cn(
                  "relative flex-shrink-0 snap-center rounded-[24px] overflow-hidden border-2 border-[#2B4562]/5",
                  imageAspectRatio,
                  (maxImages !== 1 && images.length === 1) ? "w-full" : imageWidth
                )}
              >
                {/* 첫 번째 이미지 상단 오버레이 (가격 & 폴더 정보) */}
                {index === 0 && showPrice && (place.avg_price > 0 || folders.length > 0) && (
                  <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
                    {place.avg_price > 0 && (
                      <div className="bg-white/95 px-3 py-1.5 rounded-[14px] shadow-md border border-[#2B4562]/5">
                        <div className="text-[14px] font-black text-[#2B4562] tracking-tight">
                          <span className="text-[10px] text-[#2B4562]/40 mr-1 font-bold">가격</span>
                          {formatWithCommas(place.avg_price, '-', true)}원대
                        </div>
                      </div>
                    )}
                  </div>
                )}
                <img
                  src={convertToNaverResizeImageUrl(img)}
                  alt={`${place.name} ${index + 1}`}
                  className="h-full w-full object-cover"
                  onError={handleImageError}
                  loading="lazy"
                  decoding="async"
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="px-5 py-1">
            <div className="h-40 flex flex-col items-center justify-center text-[#2B4562]/10 bg-[#2B4562]/5 rounded-[24px]">
              <TvMinimalPlay strokeWidth={1.2} className="size-8 mb-2 opacity-30" />
            </div>
          </div>
        )}
      </div>

      {/* 3. 콘텐츠 요약 - 직장인/여성향 타겟 필수 정보만 */}
      <div className="px-5 pt-4 pb-2 space-y-3">
        {/* 핵심 혜택/추천 (PICK) */}
        <div className="flex items-center justify-between">
          {place.voted_summary_text ? (
            <div className="flex items-center gap-1.5 text-[#F48E54] font-black text-[14px]">
              <Flag strokeWidth={1.2} className="size-3.5 fill-current" />
              <span>{place.voted_summary_text}</span>
            </div>
          ) : <div />}
        </div>

        {/* 미니멀 태그 (최대 3개) */}
        <div className="flex flex-wrap gap-x-3 gap-y-1">
          <span className="text-[13px] text-[#F48E54] font-black hover:underline underline-offset-4 cursor-pointer">
            #{place.category}
          </span>
          {(place.keyword_list?.length > 0) && (
            place.keyword_list.slice(0, 3).map((tag: string, i: number) => (
              <span key={i} className="text-[13px] text-blue-500/80 font-bold hover:underline underline-offset-4 cursor-pointer">
                #{tag}
              </span>
            ))
          )}
        </div>

        {/* 폴더 태그 - 태그 영역 바로 아래 배치 */}
        {folders.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-1">
            {showAllFolders ? (
              folders.map((folder: any, i: number) => (
                <button 
                  key={i}
                  className="px-3 py-1.5 bg-[#E9F7EF] text-[#27AE60] text-[13px] font-bold rounded-md flex items-center transition-colors hover:bg-[#D4EEDC] active:scale-95"
                  onClick={() => setShowAllFolders(false)}
                >
                  #{folder.title || folder.feature?.title || '폴더'}
                </button>
              ))
            ) : (
              <button 
                className="px-3 py-1.5 bg-[#E9F7EF] text-[#27AE60] text-[13px] font-bold rounded-md flex items-center transition-colors hover:bg-[#D4EEDC] active:scale-95"
                onClick={() => setShowAllFolders(true)}
              >
                #{folders[0].title || folders[0].feature?.title || '폴더'}
                {folders.length > 1 && (
                  <span className="ml-1.5 px-1.5 py-0.5 bg-[#27AE60]/10 rounded text-[11px]">
                    +{folders.length - 1}
                  </span>
                )}
              </button>
            )}
          </div>
        )}
      </div>

      {/* 4. 액션 바 - 미니멀 아이콘 중심 */}
      <div className="flex items-center justify-between px-5 py-4">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => setIsLiked(!isLiked)}
            className={cn(
              "flex items-center gap-1.5 transition-colors duration-150 group",
              (isLiked || place.interaction?.is_liked) ? "text-[#E05C5C]" : "text-[#2B4562]/40"
            )}
          >
            <Heart strokeWidth={1.2} className={cn("size-6 transition-transform group-active:scale-125", (isLiked || place.interaction?.is_liked) && "fill-current")} />
            <span className="text-[14px] font-bold">{place.interaction?.place_liked_count || 0}</span>
          </button>

          <button 
            onClick={() => showPopup(place.id)}
            className="flex items-center gap-1.5 text-[#2B4562]/40 group"
          >
            <MessageCircle strokeWidth={1.2} className="size-6 transition-transform group-active:scale-125" />
            <span className="text-[14px] font-bold">{place.interaction?.place_comment_count || 0}</span>
          </button>

          <button 
            onClick={() => setIsSaved(!isSaved)}
            className={cn(
              "flex items-center gap-1.5 transition-colors duration-150 group",
              (isSaved || place.interaction?.is_saved) ? "text-[#2B4562]" : "text-[#2B4562]/40"
            )}
          >
            <Bookmark strokeWidth={1.2} className={cn("size-6 transition-transform group-active:scale-125", (isSaved || place.interaction?.is_saved) && "fill-current")} />
            <span className="text-[14px] font-bold">저장</span>
          </button>
        </div>

        <a
          href={`https://map.naver.com/p/entry/place/${place.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center size-10 rounded-full bg-[#2B4562]/5 text-[#2B4562] hover:bg-[#2B4562] hover:text-white transition-colors duration-150 active:scale-95"
          onClick={(e) => e.stopPropagation()}
        >
          <MapPinned strokeWidth={1.2} className="size-5" />
        </a>
      </div>
    </div>
  );
}
