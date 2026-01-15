import { MapPin, MessageCircle } from "lucide-react";
import { cn } from "@/shared/lib/utils";

interface PlaceActionRowProps {
  /** 네이버 장소 ID */
  placeId: string;
  /** 리뷰 개수 */
  reviewsCount?: number;
  /** 유튜브 콘텐츠 개수 (선택) */
  youtubeCount?: number;
  /** 플레이스(네이버폴더) 콘텐츠 개수 (선택) */
  placeCount?: number;
  /** 맛탐정 폴더 콘텐츠 개수 (선택) */
  detectiveCount?: number;
  /** 커뮤니티 콘텐츠 개수 (선택) */
  communityCount?: number;
  /** 플랫폼별 콘텐츠 개수(유튜브, 플레이스, 맛탐정, 커뮤니티) 표시 여부 (기본값: false) */
  showStats?: boolean;
  /** 리뷰 클릭 핸들러 */
  onReviewClick?: () => void;
  /** 추가 클래스 */
  className?: string;
}

/**
 * 장소 상세 정보에서 사용되는 액션 및 통계 행 컴포넌트
 * 네이버 지도 링크, 리뷰 카운트와 선택적으로 각 플랫폼별 콘텐츠 개수를 표시합니다.
 */
export function PlaceActionRow({
  placeId,
  reviewsCount = 0,
  youtubeCount = 0,
  placeCount = 0,
  detectiveCount = 0,
  communityCount = 0,
  showStats = false,
  onReviewClick,
  className
}: PlaceActionRowProps) {
  return (
    <div className={cn("flex items-center justify-between mb-6 px-1", className)}>
      <div className="flex items-center gap-4">
        <a 
          href={`https://map.naver.com/p/entry/place/${placeId}`} 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-surface-600 dark:text-surface-400 text-[13px] font-bold"
        >
          <MapPin className="size-4" /> 네이버 지도
        </a>
        <button 
          onClick={onReviewClick}
          className="flex items-center gap-1.5 text-surface-600 dark:text-surface-400 text-[13px] font-bold"
        >
          <MessageCircle className="size-4" /> 리뷰 {reviewsCount}
        </button>
      </div>

      {showStats && (
        <div className="flex items-center gap-3 text-surface-600 dark:text-surface-400 text-[13px] font-bold">
          <div className="flex items-center gap-1">
            <span>유튜브</span>
            <span>{youtubeCount}</span>
          </div>
          <div className="flex items-center gap-1">
            <span>플레이스</span>
            <span>{placeCount}</span>
          </div>
          <div className="flex items-center gap-1">
            <span>맛탐정</span>
            <span>{detectiveCount}</span>
          </div>
          <div className="flex items-center gap-1">
            <span>커뮤니티</span>
            <span>{communityCount}</span>
          </div>
        </div>
      )}
    </div>
  );
}
