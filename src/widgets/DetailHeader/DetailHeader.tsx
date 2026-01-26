import { useNavigate } from "react-router";
import { ChevronLeft, Share2, Settings, User, CheckCircle, Trash2 } from "lucide-react";
import { Button } from "@/shared/ui";
import { cn, getAvatarUrl } from "@/shared/lib/utils";
import { useState } from "react";
import { trackEvent } from "@/shared/lib/gtm";

/**
 * DetailHeader 컴포넌트 프로퍼티
 */
interface DetailHeaderProps {
  /** 헤더 타입 */
  type: 'feature' | 'folder' | 'place';
  /** 상세 타입 (유튜브, 커뮤니티, 폴더 등) */
  subType?: 'youtube' | 'community' | 'folder' | 'naver';
  /** 제목 */
  title: string;
  /** 보조 제목 (예: "유튜브") */
  subtitle?: string;
  /** 썸네일 URL */
  thumbnailUrl?: string;
  /** 구독 여부 */
  isSubscribed?: boolean;
  /** 소유자 여부 (폴더인 경우) */
  isOwner?: boolean;
  /** 구독 토글 중인지 여부 (낙관적 업데이트용) */
  isSubscribing?: boolean;
  /** 구독 버튼 클릭 핸들러 */
  onSubscribe?: () => void;
  /** 공유 버튼 클릭 핸들러 */
  onShare?: () => void;
  /** 설정 버튼 클릭 핸들러 */
  onSettings?: () => void;
  /** 삭제 버튼 클릭 핸들러 (관리자용) */
  onDelete?: () => void;
  /** 뒤로가기 버튼 클릭 핸들러 */
  onBack?: () => void;
  /** 소유자 ID (사용자 프로필 이동용) */
  ownerId?: string;
}

/**
 * /feature 및 /folder 상세 페이지에서 공통으로 사용하는 헤더 컴포넌트
 * 
 * @param props DetailHeaderProps
 * @returns React.ReactElement
 */
export function DetailHeader({
  type,
  subType,
  title,
  subtitle,
  thumbnailUrl,
  isSubscribed = false,
  isOwner = false,
  isSubscribing = false,
  onSubscribe,
  onShare,
  onSettings,
  onDelete,
  onBack,
  ownerId,
}: DetailHeaderProps) {
  const navigate = useNavigate();
  const [isLinkCopied, setIsLinkCopied] = useState(false);

  const handleBack = () => {
    trackEvent("detail_header_back_click", { type, title, location: "detail_header" });
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  const handleShare = () => {
    trackEvent("detail_header_share_click", { type, title, location: "detail_header" });
    if (onShare) {
      onShare();
    } else if (navigator.share) {
      navigator.share({
        title: title,
        url: window.location.href,
      }).catch(() => {
        // 공유 취소 또는 오류 시 클립보드 복사로 폴백
        copyToClipboard();
      });
    } else {
      copyToClipboard();
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(window.location.href);
    setIsLinkCopied(true);
    setTimeout(() => setIsLinkCopied(false), 2000);
  };

  return (
    <header className="flex items-center gap-3 px-4 py-3 border-b border-surface-100 dark:border-surface-800 bg-white dark:bg-surface-950 z-20">
      {/* 뒤로가기 버튼 */}
      <button 
        onClick={handleBack} 
        className="p-1 -ml-1 shrink-0 text-surface-900 dark:text-white hover:opacity-70 transition-opacity"
        aria-label="뒤로가기"
      >
        <ChevronLeft className="size-6" />
      </button>
      
      {/* 타이틀 영역 */}
      <div 
        className={cn(
          "flex-1 flex items-center gap-2 min-w-0",
          ownerId && "cursor-pointer hover:opacity-70 transition-opacity"
        )}
        onClick={() => ownerId && navigate(`/p/user/${ownerId}`)}
      >
        {/* 썸네일 (아이콘/이미지) */}
        {thumbnailUrl ? (
          <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 border border-surface-100 dark:border-surface-800">
            <img 
              src={getAvatarUrl(thumbnailUrl)} 
              alt={title} 
              className="w-full h-full object-cover"
            />
          </div>
        ) : type === 'folder' ? (
          <div className="w-10 h-10 rounded-full bg-surface-100 dark:bg-surface-800 overflow-hidden shrink-0 border border-surface-100 dark:border-surface-800 flex items-center justify-center">
            <User className="size-5 text-surface-400" />
          </div>
        ) : null}

        <div className="flex flex-col min-w-0">
          <h1 className="text-base font-black truncate leading-tight text-surface-900 dark:text-white">
            {title}
          </h1>
          {subtitle && (
            <p className="text-[11px] text-surface-400 font-bold truncate">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* 액션 버튼 영역 */}
      <div className="flex items-center gap-1 shrink-0">
        {/* 구독 버튼 (feature 타입이거나, 폴더 타입인 경우) */}
        {(type === 'feature' || type === 'folder') && onSubscribe && (
          <button
            onClick={() => {
              if (isOwner && type === 'folder') return;
              trackEvent("detail_header_subscribe_click", { type, title, is_subscribed: isSubscribed, location: "detail_header" });
              onSubscribe();
            }}
            disabled={isSubscribing}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-full font-bold transition-colors duration-150 text-xs",
              isSubscribed 
                ? "bg-primary-50 border border-primary-200 text-primary-600 dark:bg-primary-900/20 dark:border-primary-800" 
                : "bg-surface-100 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-surface-700 dark:text-surface-300",
              isOwner && type === 'folder' && "cursor-default opacity-100",
              isSubscribing && "opacity-50 cursor-not-allowed"
            )}
            title={isOwner && type === 'folder' ? "내 폴더 (구독 중)" : (isSubscribed ? "구독 중" : "구독하기")}
          >
            <span>{isSubscribed ? "구독중" : "구독"}</span>
          </button>
        )}

        {/* 공유 버튼 */}
        <button 
          className={cn(
            "p-2 transition-colors hover:bg-surface-50 dark:hover:bg-surface-800 rounded-full",
            isLinkCopied ? "text-green-500" : "text-surface-600 dark:text-surface-300"
          )} 
          onClick={handleShare}
          title="공유하기"
        >
          {isLinkCopied ? <CheckCircle className="size-5" /> : <Share2 className="size-5" />}
        </button>

        {/* 삭제 버튼 (관리자용) */}
        {onDelete && (
          <button 
            className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-full transition-colors" 
            onClick={() => {
              trackEvent("detail_header_delete_click", { type, title, location: "detail_header" });
              onDelete();
            }}
            title="삭제하기"
          >
            <Trash2 className="size-5" />
          </button>
        )}

        {/* 설정 버튼 (폴더 소유자인 경우에만 노출) */}
        {type === 'folder' && isOwner && (
          <button 
            className="p-2 text-surface-600 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-800 rounded-full" 
            onClick={() => {
              trackEvent("detail_header_settings_click", { type, title, location: "detail_header" });
              onSettings?.();
            }}
            title="폴더 설정"
          >
            <Settings className="size-5" />
          </button>
        )}
      </div>
    </header>
  );
}
