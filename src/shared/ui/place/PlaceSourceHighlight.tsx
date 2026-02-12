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

/**
 * Instagram 로고 SVG 아이콘 컴포넌트
 */
function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg 
      width="16" 
      height="16" 
      viewBox="0 0 24 24" 
      className={className}
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
    </svg>
  );
}

/**
 * Threads 로고 SVG 아이콘 컴포넌트
 */
function ThreadsIcon({ className }: { className?: string }) {
  return (
    <svg 
      width="16" 
      height="16" 
      viewBox="0 0 24 24" 
      className={className}
      fill="currentColor"
    >
      <path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.03-3.579.879-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.96-3.898-5.984-8.304-6.015-2.91.022-5.11.936-6.54 2.717C4.307 6.504 3.616 8.914 3.59 12c.025 3.086.718 5.496 2.057 7.164 1.432 1.781 3.631 2.695 6.54 2.717 2.623-.02 4.358-.631 5.8-2.045 1.647-1.613 1.618-3.593 1.09-4.798-.31-.71-.873-1.3-1.634-1.75-.192 1.352-.622 2.446-1.284 3.272-.853 1.061-2.108 1.6-3.73 1.6-1.123 0-2.131-.266-2.998-.794-1.076-.654-1.72-1.755-1.72-2.948 0-1.883 1.462-3.396 3.26-3.396.34 0 .68.046 1.006.137.93.26 1.643.9 2.01 1.805.195.48.292.995.288 1.534-.004.517-.105 1.009-.301 1.464.39.102.8.156 1.222.156 1.053 0 1.857-.347 2.39-1.032.594-.76.922-1.96 1.004-3.678l.012-.34-.34.012c-1.718.082-2.918.41-3.678 1.004-.685.533-1.032 1.337-1.032 2.39 0 .422.054.832.156 1.222.455-.196.947-.297 1.464-.301.539-.004 1.054.093 1.534.288.905.367 1.545 1.08 1.805 2.01.091.326.137.666.137 1.006 0 1.798-1.513 3.26-3.396 3.26-1.193 0-2.294-.644-2.948-1.72-.528-.867-.794-1.875-.794-2.998 0-1.622.539-2.877 1.6-3.73.826-.662 1.92-1.092 3.272-1.284-.45-.761-1.04-1.324-1.75-1.634-1.205-.528-3.185-.557-4.798 1.09-1.414 1.442-2.025 3.177-2.045 5.8.022 2.909.936 5.108 2.717 6.54 1.668 1.339 4.078 2.032 7.164 2.057 3.576-.025 6.427-.717 8.479-2.057 1.337-1.786 2.078-4.295 2.098-7.455v-.014C24 5.043 23.28 2.746 21.902 1H21.9c-1.373-.895-2.933-1.367-4.632-1.398h-.014C12.344.024 8.684 1.205 6.834 3.509 5.188 5.561 4.339 8.412 4.31 11.99v.01c.025 3.579.87 6.432 2.513 8.487 1.848 2.306 4.604 3.49 8.182 3.513h.01c2.744-.022 5.04-.728 6.82-2.103.94-.725 1.74-1.61 2.386-2.634l-1.69-1.05c-.535.854-1.2 1.593-1.98 2.196-1.483 1.145-3.415 1.725-5.745 1.725z"/>
    </svg>
  );
}

interface PlaceSourceHighlightProps {
  features: Feature[];
  onFeatureClick?: (feature: Feature) => void;
  className?: string;
}

/**
 * 장소의 출처(Source)를 심플하게 보여주는 컴포넌트
 * 페이지의 다른 섹션들과 동일한 스타일로 통일
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

  // 소셜 미디어별 세부 분류
  const instagramFeatures = socialFeatures.filter(f => f.content_url?.includes('instagram.com'));
  const threadsFeatures = socialFeatures.filter(f => f.content_url?.includes('threads.net'));
  const otherSocialFeatures = socialFeatures.filter(f => 
    !f.content_url?.includes('instagram.com') && !f.content_url?.includes('threads.net')
  );

  const hasAnySocialSource = youtubeFeatures.length > 0 || 
                              folderFeatures.length > 0 || 
                              communityFeatures.length > 0 || 
                              socialFeatures.length > 0;

  const hasUsers = userFeatures.length > 0;

  if (!hasAnySocialSource && !hasUsers) return null;

  // 유저 아바타 (최대 5개 표시)
  const MAX_VISIBLE_AVATARS = 5;
  const visibleUsers = userFeatures.slice(0, MAX_VISIBLE_AVATARS);
  const remainingUsers = userFeatures.length - MAX_VISIBLE_AVATARS;

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {/* 미디어 언급 */}
      {hasAnySocialSource && (
        <div>
          <span className="text-[13px] font-bold text-surface-500 dark:text-surface-400 uppercase tracking-wider">
            미디어 언급
          </span>
          <div className="flex items-center gap-2 mt-2 overflow-x-auto scrollbar-hide">
            {/* 유튜브 */}
            {youtubeFeatures.length > 0 && (
              <button
                onClick={() => youtubeFeatures[0] && onFeatureClick?.(youtubeFeatures[0])}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-full text-[13px] font-medium whitespace-nowrap shrink-0 active:opacity-70"
              >
                <YoutubeIcon className="text-[#FF0000] size-4" />
                <span>YouTube ({youtubeFeatures.length})</span>
              </button>
            )}

            {/* 인스타그램 */}
            {instagramFeatures.length > 0 && (
              <button
                onClick={() => instagramFeatures[0] && onFeatureClick?.(instagramFeatures[0])}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-pink-50 dark:bg-pink-900/20 text-pink-700 dark:text-pink-300 rounded-full text-[13px] font-medium whitespace-nowrap shrink-0 active:opacity-70"
              >
                <InstagramIcon className="text-[#E4405F] size-4" />
                <span>Instagram ({instagramFeatures.length})</span>
              </button>
            )}

            {/* 쓰레드 */}
            {threadsFeatures.length > 0 && (
              <button
                onClick={() => threadsFeatures[0] && onFeatureClick?.(threadsFeatures[0])}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-100 dark:bg-surface-800 text-surface-700 dark:text-surface-300 rounded-full text-[13px] font-medium whitespace-nowrap shrink-0 active:opacity-70"
              >
                <ThreadsIcon className="text-surface-900 dark:text-white size-4" />
                <span>Threads ({threadsFeatures.length})</span>
              </button>
            )}

            {/* 네이버 */}
            {folderFeatures.length > 0 && (
              <button
                onClick={() => folderFeatures[0] && onFeatureClick?.(folderFeatures[0])}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-full text-[13px] font-medium whitespace-nowrap shrink-0 active:opacity-70"
              >
                <img src={naverIcon} alt="" className="size-4 rounded-sm object-cover" />
                <span>Naver ({folderFeatures.length})</span>
              </button>
            )}

            {/* 커뮤니티 */}
            {(communityFeatures.length + otherSocialFeatures.length) > 0 && (
              <button
                onClick={() => (communityFeatures[0] || otherSocialFeatures[0]) && onFeatureClick?.(communityFeatures[0] || otherSocialFeatures[0])}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-full text-[13px] font-medium whitespace-nowrap shrink-0 active:opacity-70"
              >
                <MessageCircle className="size-4" />
                <span>커뮤니티 ({communityFeatures.length + otherSocialFeatures.length})</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* 공유한 사람 */}
      {hasUsers && (
        <div>
          <span className="text-[13px] font-bold text-surface-500 dark:text-surface-400 uppercase tracking-wider">
            공유한 사람
          </span>
          <div className="flex items-center gap-2 mt-2 overflow-x-auto scrollbar-hide">
            {visibleUsers.map((user, index) => {
              const profileUrl = user.metadata?.profileImageUrl;
              const nickname = user.metadata?.nickname || '익명';
              
              return (
                <button
                  key={user.id || index}
                  onClick={() => onFeatureClick?.(user)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300 rounded-full text-[13px] font-medium whitespace-nowrap shrink-0 active:opacity-70"
                >
                  <div className="size-5 rounded-full overflow-hidden bg-violet-200 dark:bg-violet-800 flex items-center justify-center">
                    {profileUrl ? (
                      <img src={profileUrl} alt={nickname} className="size-full object-cover" />
                    ) : (
                      <User className="size-3" />
                    )}
                  </div>
                  <span>{nickname}</span>
                </button>
              );
            })}
            {remainingUsers > 0 && (
              <button
                onClick={() => userFeatures[0] && onFeatureClick?.(userFeatures[0])}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400 rounded-full text-[13px] font-medium whitespace-nowrap shrink-0 active:opacity-70"
              >
                <span>+{remainingUsers}명 더 보기</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

