import React from "react";
import { 
  User, 
  MessageCircle
} from "lucide-react";
import { cn } from "@/shared/lib/utils";
import type { Feature } from "@/entities/place/types";
import naverIcon from "@/assets/images/naver-map-logo.png";

/**
 * YouTube 로고 SVG 아이콘 컴포넌트
 */
function YoutubeIcon({ className }: { className?: string }) {
  return (
    <svg 
      width="16" 
      height="16" 
      viewBox="0 0 32 32" 
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path 
        d="M29.41,9.26a3.5,3.5,0,0,0-2.47-2.47C24.76,6.2,16,6.2,16,6.2s-8.76,0-10.94.59A3.5,3.5,0,0,0,2.59,9.26,36.13,36.13,0,0,0,2,16a36.13,36.13,0,0,0,.59,6.74,3.5,3.5,0,0,0,2.47,2.47C7.24,25.8,16,25.8,16,25.8s8.76,0,10.94-.59a3.5,3.5,0,0,0,2.47-2.47A36.13,36.13,0,0,0,30,16,36.13,36.13,0,0,0,29.41,9.26Z" 
        fill="currentColor"
      />
      <path 
        d="M13.2,20.2V11.8L20.47,16Z" 
        fill="white"
      />
    </svg>
  );
}

interface PlaceSourceHighlightProps {
  features: Feature[];
  onFeatureClick?: (feature: Feature) => void;
  className?: string;
}

/**
 * 장소의 출처(Source)를 미니멀하고 소셜한 형태로 보여주는 컴포넌트
 * SNS 피드처럼 아이콘과 카운트만 표시하고, 유저 프로필은 강조하여 표시
 */
export function PlaceSourceHighlight({
  features,
  onFeatureClick,
  className
}: PlaceSourceHighlightProps) {
  // 출처 유형별 분류
  const youtubeFeatures = features.filter(f => f.platform_type === 'youtube');
  const folderFeatures = features.filter(f => f.platform_type === 'folder');
  const userFeatures = features.filter(f => f.platform_type === 'public_user');
  const communityFeatures = features.filter(f => f.platform_type === 'community');
  const socialFeatures = features.filter(f => f.platform_type === 'social');

  const hasAnySource = youtubeFeatures.length > 0 || 
                       folderFeatures.length > 0 || 
                       userFeatures.length > 0 || 
                       communityFeatures.length > 0 || 
                       socialFeatures.length > 0;

  if (!hasAnySource) return null;

  // 유저 아바타 스택 (최대 6개 표시)
  const MAX_VISIBLE_AVATARS = 6;
  const visibleUsers = userFeatures.slice(0, MAX_VISIBLE_AVATARS);

  return (
    <div className={cn("flex flex-col gap-4 p-4 rounded-2xl bg-surface-50 dark:bg-surface-900/50 border border-surface-100 dark:border-surface-800", className)}>
      {/* 상단: Social Mentions 요약 */}
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-bold text-surface-900 dark:text-surface-100 uppercase tracking-wider">Social Mentions</span>
        <div className="flex items-center gap-4">
          {/* 유튜브 카운트 */}
          {youtubeFeatures.length > 0 && (
            <button
              onClick={() => youtubeFeatures[0] && onFeatureClick?.(youtubeFeatures[0])}
              className="flex items-center gap-1.5 hover:opacity-70 transition-opacity"
            >
              <YoutubeIcon className="text-red-600 dark:text-red-500 size-4" />
              <span className="text-[13px] font-bold text-surface-900 dark:text-surface-100">{youtubeFeatures.length}</span>
            </button>
          )}
          {/* 폴더 카운트 */}
          {folderFeatures.length > 0 && (
            <button
              onClick={() => folderFeatures[0] && onFeatureClick?.(folderFeatures[0])}
              className="flex items-center gap-1.5 hover:opacity-70 transition-opacity"
            >
              <div className="size-4 rounded-sm overflow-hidden border border-surface-200 dark:border-surface-700">
                <img src={naverIcon} alt="" className="size-full object-cover" />
              </div>
              <span className="text-[13px] font-bold text-surface-900 dark:text-surface-100">{folderFeatures.length}</span>
            </button>
          )}
          {/* 커뮤니티/소셜 카운트 */}
          {(communityFeatures.length + socialFeatures.length) > 0 && (
            <button
              onClick={() => (communityFeatures[0] || socialFeatures[0]) && onFeatureClick?.(communityFeatures[0] || socialFeatures[0])}
              className="flex items-center gap-1.5 hover:opacity-70 transition-opacity"
            >
              <MessageCircle className="size-4 text-surface-400 dark:text-surface-500" />
              <span className="text-[13px] font-bold text-surface-900 dark:text-surface-100">{communityFeatures.length + socialFeatures.length}</span>
            </button>
          )}
        </div>
      </div>

      <div className="h-px bg-surface-100 dark:bg-surface-800 w-full" />

      {/* 하단: Shared by 유저 프로필 */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-3">
          <span className="text-[13px] font-bold text-surface-900 dark:text-surface-100 uppercase tracking-wider">Shared by</span>
          <div className="flex items-center gap-2">
            {visibleUsers.map((user, index) => {
              const profileUrl = user.metadata?.profileImageUrl;
              const nickname = user.metadata?.nickname || 'U';
              
              return (
                <button
                  key={user.id || index}
                  onClick={() => onFeatureClick?.(user)}
                  className="relative size-10 rounded-full border-2 border-surface-200 dark:border-surface-700 p-0.5 hover:scale-110 transition-transform active:scale-95 bg-white dark:bg-surface-800 shadow-sm"
                >
                  <div className="size-full rounded-full overflow-hidden bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                    {profileUrl ? (
                      <img src={profileUrl} alt={nickname} className="size-full object-cover" />
                    ) : (
                      <User className="size-5 text-violet-600 dark:text-violet-400" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
        <button 
          onClick={() => userFeatures[0] && onFeatureClick?.(userFeatures[0])}
          className="text-[13px] font-medium text-surface-400 dark:text-surface-500 hover:text-surface-900 dark:hover:text-surface-100 transition-colors"
        >
          See all
        </button>
      </div>
    </div>
  );
}
