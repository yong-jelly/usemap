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
      <div className="p-4 space-y-3">
        <div className="space-y-2">
          <div className="flex gap-2 items-center">
            <div className="relative flex-1">
              <Input
                placeholder="콘텐츠 링크를 붙여넣으세요"
                className={cn(
                  "text-base h-11 bg-surface-50 dark:bg-surface-950 border-none focus-visible:ring-1 focus-visible:ring-primary-500 pr-10",
                  error && "ring-1 ring-rose-500 focus-visible:ring-rose-500"
                )}
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                autoFocus
                disabled={isProcessing}
              />
              {url && !isProcessing && (
                <button
                  onClick={() => setUrl("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>
            
            <div className="flex gap-1 items-center shrink-0">
              <Button
                onClick={handleSubmit}
                disabled={isProcessing || !url.trim()}
                className={cn(
                  "h-11 px-4 rounded-xl text-[14px] font-medium transition-all",
                  url.trim()
                    ? "bg-primary-500 text-white hover:bg-primary-600"
                    : "bg-surface-100 dark:bg-surface-800 text-surface-400 cursor-not-allowed"
                )}
              >
                {isProcessing ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  "저장"
                )}
              </Button>
              
              <button
                type="button"
                onClick={onCancel}
                disabled={isProcessing}
                className="h-11 px-3 text-[13px] text-surface-400 hover:text-surface-600 dark:text-surface-500 dark:hover:text-surface-300 transition-colors"
              >
                취소
              </button>
            </div>
          </div>

          {error && (
            <p className="text-[12px] text-rose-500 px-1 font-medium animate-in fade-in slide-in-from-top-1">
              {error}
            </p>
          )}

          {!error && (
            <p className="text-[11px] text-surface-400 px-1 leading-relaxed">
              쓰레드, 인스타그램, 유튜브, 다모앙, 클리앙 등 링크를 지원합니다.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
