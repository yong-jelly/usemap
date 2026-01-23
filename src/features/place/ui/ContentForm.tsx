import { useState } from "react";
import { X, Youtube, MessageCircle, Loader2 } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { Button, Input } from "@/shared/ui";

interface ContentFormProps {
  /** 입력 중인 URL */
  initialUrl?: string;
  /** 처리 중 여부 */
  isProcessing?: boolean;
  /** 에러 메시지 */
  error?: string | null;
  /** 제출 핸들러 */
  onSubmit: (url: string) => Promise<void>;
  /** 취소 핸들러 */
  onCancel: () => void;
}

/**
 * 관련 콘텐츠(유튜브, 커뮤니티 링크) 추가 폼 컴포넌트
 */
export function ContentForm({
  initialUrl = "",
  isProcessing = false,
  error = null,
  onSubmit,
  onCancel,
}: ContentFormProps) {
  const [url, setUrl] = useState(initialUrl);

  const handleSubmit = async () => {
    if (!url.trim()) return;
    await onSubmit(url.trim());
  };

  return (
    <div className="flex flex-col rounded-2xl bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 shadow-sm overflow-hidden">
      <div className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-[13px] font-medium text-surface-500">YouTube 또는 커뮤니티 링크</span>
        </div>

        <div className="space-y-2">
          <Input 
            placeholder="유튜브 또는 커뮤니티(다모앙, 클리앙 등) 링크를 입력하세요" 
            className={cn(
              "text-base h-12 bg-surface-50 dark:bg-surface-950 border-none focus-visible:ring-1 focus-visible:ring-primary-500",
              error && "ring-1 ring-rose-500 focus-visible:ring-rose-500"
            )}
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            autoFocus
            disabled={isProcessing}
          />
          
          {error && (
            <p className="text-[12px] text-rose-500 px-1 font-medium animate-in fade-in slide-in-from-top-1">
              {error}
            </p>
          )}
          
          {!error && (
            <p className="text-[11px] text-surface-400 px-1">
              유튜브, 다모앙, 클리앙, 보배드림 링크를 지원합니다.
            </p>
          )}
        </div>
      </div>

      <div className="flex gap-3 p-5 pt-3 border-t border-surface-100 dark:border-surface-800 bg-surface-50/30 dark:bg-surface-900/30">
        <Button 
          variant="ghost"
          onClick={onCancel} 
          className="flex-1 h-11 rounded-xl text-[14px] font-medium text-surface-600 bg-surface-100 hover:bg-surface-200 dark:bg-surface-800 dark:text-surface-300 dark:hover:bg-surface-700" 
          disabled={isProcessing}
        >
          취소
        </Button>
        <Button 
          onClick={handleSubmit} 
          className={cn(
            "flex-[2] h-11 rounded-xl text-[14px] font-medium shadow-sm transition-all",
            url.trim() ? "bg-primary-500 text-white hover:bg-primary-600" : "bg-surface-100 dark:bg-surface-800 text-surface-400 cursor-not-allowed"
          )}
          disabled={isProcessing || !url.trim()}
        >
          {isProcessing ? <Loader2 className="size-5 animate-spin text-white" /> : "추가하기"}
        </Button>
      </div>
    </div>
  );
}
