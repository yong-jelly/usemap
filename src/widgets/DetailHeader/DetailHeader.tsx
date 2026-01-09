import { useNavigate } from "react-router";
import { ChevronLeft, Share2, Settings, User, CheckCircle } from "lucide-react";
import { Button } from "@/shared/ui";
import { cn } from "@/shared/lib/utils";
import { useState } from "react";

/**
 * DetailHeader 컴포넌트 프로퍼티
 */
interface DetailHeaderProps {
  /** 헤더 타입 */
  type: 'feature' | 'folder';
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
  /** 구독 버튼 클릭 핸들러 */
  onSubscribe?: () => void;
  /** 공유 버튼 클릭 핸들러 */
  onShare?: () => void;
  /** 설정 버튼 클릭 핸들러 */
  onSettings?: () => void;
  /** 뒤로가기 버튼 클릭 핸들러 */
  onBack?: () => void;
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
  onSubscribe,
  onShare,
  onSettings,
  onBack,
}: DetailHeaderProps) {
  const navigate = useNavigate();
  const [isLinkCopied, setIsLinkCopied] = useState(false);

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  const handleShare = () => {
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
      <div className="flex-1 flex items-center gap-2 min-w-0">
        {/* 썸네일 (아이콘/이미지) */}
        {thumbnailUrl ? (
          <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 border border-surface-100 dark:border-surface-800">
            <img 
              src={thumbnailUrl} 
              alt={title} 
              className="w-full h-full object-cover"
            />
          </div>
        ) : subType === 'folder' ? (
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
        {/* 구독 버튼 (feature 타입이거나, 폴더이면서 내 폴더가 아닌 경우) */}
        {(type === 'feature' || (type === 'folder' && !isOwner)) && onSubscribe && (
          <Button
            variant={isSubscribed ? "outline" : "default"}
            size="sm"
            onClick={onSubscribe}
            className={cn(
              "h-8 px-3 text-xs font-bold rounded-full transition-all",
              isSubscribed ? "bg-surface-50 dark:bg-surface-800 text-surface-500" : "bg-primary-500 text-white"
            )}
          >
            {isSubscribed ? "구독중" : "구독"}
          </Button>
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

        {/* 설정 버튼 (폴더 소유자인 경우에만 노출) */}
        {type === 'folder' && isOwner && (
          <button 
            className="p-2 text-surface-600 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-800 rounded-full" 
            onClick={onSettings}
            title="폴더 설정"
          >
            <Settings className="size-5" />
          </button>
        )}
      </div>
    </header>
  );
}
