import { useState } from "react";
import { X, Youtube, MessageCircle, Loader2 } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { Button, Input } from "@/shared/ui";

interface ContentFormProps {
  /** 입력 중인 URL */
  initialUrl?: string;
  /** 처리 중 여부 */
  isProcessing?: boolean;
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
          <button 
            onClick={onCancel} 
            className="p-1 text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800 rounded-full transition-colors"
            disabled={isProcessing}
          >
            <X className="size-4" />
          </button>
        </div>

        <Input 
          placeholder="유튜브 또는 커뮤니티(다모앙, 클리앙 등) 링크를 입력하세요" 
          className="text-base h-12 bg-surface-50 dark:bg-surface-950 border-none focus-visible:ring-1 focus-visible:ring-primary-500"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          autoFocus
          disabled={isProcessing}
        />

        <div className="flex items-center gap-3 px-1">
          <div className="flex items-center gap-1.5 text-[12px] text-surface-400">
            <Youtube className="size-3.5 text-rose-500" />
            <span>YouTube</span>
          </div>
          <div className="flex items-center gap-1.5 text-[12px] text-surface-400">
            <MessageCircle className="size-3.5 text-emerald-500" />
            <span>커뮤니티</span>
          </div>
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
