import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, Loader2, Star, MapPin } from "lucide-react";
import { convertToNaverResizeImageUrl } from "@/shared/lib";
import { cn } from "@/shared/lib/utils";
import { Button, Input } from "@/shared/ui";
import type { Place } from "@/entities/place/types";

interface PlaceCommentFormProps {
  place: Place;
  initialComment?: string;
  onBack: () => void;
  onSave: (comment: string) => Promise<void> | void;
  onClose: () => void;
}

export function PlaceCommentForm({ place, initialComment = "", onBack, onSave, onClose }: PlaceCommentFormProps) {
  const [comment, setComment] = useState(initialComment);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setComment(initialComment);
    setError(null); // 초기화 시 에러도 초기화
  }, [initialComment]);

  const handleSave = async () => {
    if (!canSave) return;
    
    setIsSaving(true);
    setError(null);
    try {
      await onSave(comment.trim());
      // 성공 시에만 화면 전환 (onSave가 성공적으로 완료된 경우)
    } catch (err: any) {
      // 에러 발생 시 에러 메시지 표시 및 화면 전환 방지
      const errorMessage = err?.message || err?.meta?.message || '저장에 실패했습니다.';
      setError(errorMessage);
      alert(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  // 모달이 열릴 때 부모 스크롤 방지
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const canSave = comment.length <= 1000;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      
      <div className="relative w-full h-full bg-white dark:bg-surface-950 flex flex-col md:max-w-md md:h-[90vh] md:rounded-[32px] md:overflow-hidden md:shadow-2xl">
        {/* 헤더 */}
        <header className="flex h-14 items-center px-4 border-b border-surface-100 dark:border-surface-800 shrink-0 bg-white dark:bg-surface-900">
          <button 
            onClick={onBack} 
            className="p-1.5 -ml-1.5 rounded-full hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
          >
            <ChevronLeft className="h-5 w-5 text-surface-600 dark:text-surface-400" />
          </button>
          <h1 className="ml-3 flex-1 text-lg font-bold text-surface-900 dark:text-surface-50">
            {initialComment ? "메모 수정" : "메모 작성"}
          </h1>
          <Button
            onClick={handleSave}
            disabled={!canSave || isSaving}
            className="h-8 px-4 rounded-full font-bold text-sm"
            size="sm"
          >
            {isSaving ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              "저장"
            )}
          </Button>
        </header>

        {/* 컨텐츠 영역 */}
        <div className="flex-1 overflow-y-auto pb-safe scrollbar-hide">
          {/* 업체 정보 */}
          <div className="p-5 border-b border-surface-100 dark:border-surface-800 bg-white dark:bg-surface-900">
            <div className="flex gap-4">
              <div className="size-20 rounded-[20px] bg-surface-100 dark:bg-surface-800 overflow-hidden flex-shrink-0 border border-surface-50 dark:border-surface-800 shadow-sm">
                {place.image_urls?.[0] || place.place_images?.[0] ? (
                  <img 
                    src={convertToNaverResizeImageUrl(place.image_urls?.[0] || place.place_images?.[0] || "")} 
                    alt={place.name} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <MapPin className="size-8 text-surface-200" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0 py-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-black text-[16px] text-surface-900 dark:text-white truncate">
                    {place.name}
                  </h4>
                  {place.visitor_reviews_score > 0 && (
                    <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-yellow-400/10 text-yellow-600 dark:text-yellow-400 text-[10px] font-black">
                      <Star className="size-2.5 fill-current" />
                      {place.visitor_reviews_score.toFixed(1)}
                    </div>
                  )}
                </div>
                <p className="text-xs font-bold text-primary-600 mb-1">{place.category}</p>
                <p className="text-xs font-medium text-surface-400 line-clamp-2 leading-relaxed">
                  {place.road_address || place.address}
                </p>
              </div>
            </div>
          </div>

          {/* 코멘트 입력 영역 */}
          <div className="p-5">
            <textarea
              value={comment}
              onChange={(e) => {
                const value = e.target.value;
                if (value.length <= 1000) {
                  setComment(value);
                  setError(null); // 입력 시 에러 초기화
                }
              }}
              placeholder="이 음식점에 대한 메모를 작성해주세요..."
              className={cn(
                "w-full min-h-[300px] p-4 rounded-2xl",
                "bg-surface-50 dark:bg-surface-900",
                "border border-surface-200 dark:border-surface-800",
                "text-surface-900 dark:text-surface-50",
                "placeholder:text-surface-400",
                "focus:outline-none focus:ring-2 focus:ring-primary-500/20",
                "resize-none",
                error && "border-red-500 focus:ring-red-500/20"
              )}
              autoFocus
            />
            <div className="flex items-center justify-between mt-2">
              {error && (
                <span className="text-xs font-medium text-red-500">
                  {error}
                </span>
              )}
              <span className={cn(
                "text-xs font-medium ml-auto",
                comment.length > 1000 ? "text-red-500" : "text-surface-400"
              )}>
                {comment.length} / 1000
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
