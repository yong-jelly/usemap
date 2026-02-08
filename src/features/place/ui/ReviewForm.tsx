import { useState, useEffect } from "react";
import { Star, Camera, X, Lock, Loader2, Calendar, ChevronDown, ChevronUp, Check, Wine, Plus, Minus } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui";
import { getReviewImageUrl } from "@/shared/lib/storage";
import type { PlaceUserReview, ReviewTag, ReviewImage } from "@/entities/place/types";

interface ReviewFormProps {
  /** 초기 평점 */
  initialRating?: number;
  /** 초기 코멘트 */
  initialComment?: string;
  /** 초기 태그 코드 목록 */
  initialTagCodes?: string[];
  /** 초기 비공개 여부 */
  initialIsPrivate?: boolean;
  /** 초기 방문 날짜 */
  initialDate?: string;
  /** 초기 음주 여부 */
  initialIsDrinking?: boolean;
  /** 초기 음주 병 수 */
  initialBottles?: number;
  /** 기존 이미지 목록 (수정 모드용) */
  initialImages?: ReviewImage[];
  /** 사용 가능한 태그 목록 */
  availableTags: ReviewTag[];
  /** 저장 중 여부 */
  isUploading?: boolean;
  /** 제출 핸들러 */
  onSubmit: (data: {
    rating: number;
    comment: string;
    tagCodes: string[];
    isPrivate: boolean;
    visitDate: string;
    imageFiles: File[];
    deletedImageIds: string[];
    isDrinking: boolean;
    bottles: number;
  }) => Promise<void>;
  /** 취소 핸들러 */
  onCancel: () => void;
  /** 폼 제목 (작성/수정 등) */
  title?: string;
}

/**
 * 리뷰 작성/수정 폼 컴포넌트
 */
export function ReviewForm({
  initialRating = 0,
  initialComment = "",
  initialTagCodes = [],
  initialIsPrivate = false,
  initialDate = new Date().toISOString().split('T')[0],
  initialIsDrinking = false,
  initialBottles = 1,
  initialImages = [],
  availableTags,
  isUploading = false,
  onSubmit,
  onCancel,
}: ReviewFormProps) {
  const [rating, setRating] = useState(initialRating);
  const [comment, setComment] = useState(initialComment);
  const [selectedTagCodes, setSelectedTagCodes] = useState<string[]>(initialTagCodes);
  const [isPrivate, setIsPrivate] = useState(initialIsPrivate);
  const [visitDate, setVisitDate] = useState(initialDate);
  
  // 수정 모드 여부 확인
  const isEditMode = initialRating > 0 || initialComment.trim().length > 0;
  
  // 추가 설정 데이터가 있는지 확인 (이미지, 태그, 음주, 비공개)
  const hasAdditionalData = initialImages.length > 0 || 
                             initialTagCodes.length > 0 || 
                             initialIsDrinking === true || 
                             initialIsPrivate === true;
  
  const [showOptions, setShowOptions] = useState(hasAdditionalData);
  
  // 음주 여부 상태
  const [isDrinking, setIsDrinking] = useState(initialIsDrinking);
  const [bottles, setBottles] = useState(initialBottles);
  
  const [reviewFiles, setReviewFiles] = useState<File[]>([]);
  const [reviewPreviews, setReviewPreviews] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<ReviewImage[]>(initialImages);
  const [deletedImageIds, setDeletedImageIds] = useState<string[]>([]);

  const totalImageCount = reviewFiles.length + existingImages.length - deletedImageIds.length;

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const remainingSlot = 5 - totalImageCount;

    if (remainingSlot <= 0) {
      e.target.value = '';
      return;
    }

    const filesToAdd = files.slice(0, remainingSlot);
    
    const processedFilesToAdd = await Promise.all(
      filesToAdd.map(async (file, index) => {
        if (file.type.includes("heic") || file.name.toLowerCase().endsWith(".heic")) {
          try {
            const heic2any = (await import("heic2any")).default;
            const blob = await heic2any({
              blob: file,
              toType: "image/jpeg",
              quality: 0.7
            });
            const convertedBlob = Array.isArray(blob) ? blob[0] : blob;
            // iOS에서 동일한 파일명 부여 문제 방지: 인덱스 추가
            const baseName = file.name.replace(/\.heic$/i, "");
            const uniqueName = `${baseName}-${Date.now()}-${index}.jpg`;
            return new File([convertedBlob], uniqueName, {
              type: "image/jpeg",
              lastModified: file.lastModified // 원본 lastModified 유지
            });
          } catch (error) {
            console.error("HEIC preview conversion failed:", error);
            return file;
          }
        }
        return file;
      })
    );

    // 파일명 기반 중복 체크 제거 (iOS에서 다른 파일에 같은 이름 부여 문제)
    // 서버에서 고유 파일명(timestamp-randomSuffix)을 생성하므로 클라이언트 중복 체크 불필요
    const newFiles = [...reviewFiles, ...processedFilesToAdd];
    setReviewFiles(newFiles);

    const newPreviews = processedFilesToAdd.map(file => URL.createObjectURL(file));
    setReviewPreviews(prev => [...prev, ...newPreviews]);
    
    e.target.value = '';
  };

  const removeNewImage = (index: number) => {
    URL.revokeObjectURL(reviewPreviews[index]);
    setReviewFiles(prev => prev.filter((_, i) => i !== index));
    setReviewPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const removeExistingImage = (imageId: string) => {
    setDeletedImageIds(prev => [...prev, imageId]);
  };

  const toggleTag = (code: string) => {
    setSelectedTagCodes(prev => 
      prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]
    );
  };

  const handleSubmit = async () => {
    if (!comment.trim()) return alert('코멘트를 입력해주세요.');
    await onSubmit({
      rating,
      comment,
      tagCodes: selectedTagCodes,
      isPrivate,
      visitDate,
      imageFiles: reviewFiles,
      deletedImageIds,
      isDrinking,
      bottles
    });
  };

  useEffect(() => {
    return () => {
      reviewPreviews.forEach(url => URL.revokeObjectURL(url));
    };
  }, [reviewPreviews]);

  return (
    <div className="flex flex-col rounded-2xl bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 shadow-sm overflow-hidden">
      {/* 1. 핵심 입력 섹션 (별점 + 날짜 + 코멘트) */}
      <div className="p-5 space-y-5">
        {/* 상단: 별점 & 날짜 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((s) => (
              <button 
                key={s} 
                onClick={() => setRating(s)} 
                className="p-1 -ml-1 first:ml-0 active:scale-90 transition-transform"
                disabled={isUploading}
              >
                <Star className={cn(
                  "size-7", 
                  s <= rating ? "text-amber-400 fill-amber-400" : "text-surface-200 dark:text-surface-700"
                )} />
              </button>
            ))}
            {rating > 0 && (
              <span className="ml-2 text-[15px] font-bold text-amber-500">{rating}점</span>
            )}
          </div>
          
          <div className="flex items-center gap-2 bg-surface-50 dark:bg-surface-800 px-3 py-1.5 rounded-lg">
            <Calendar className="size-3.5 text-surface-400" />
            <input
              type="date"
              value={visitDate}
              onChange={(e) => setVisitDate(e.target.value)}
              className="text-[13px] font-medium bg-transparent border-none outline-none text-surface-600 dark:text-surface-300 p-0 cursor-pointer text-right min-w-[110px]"
              disabled={isUploading}
              max={new Date().toISOString().split('T')[0]}
            />
          </div>
        </div>

        {/* 코멘트 입력 */}
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="이 장소는 어떠셨나요? 후기를 남겨주세요."
          className="w-full h-32 bg-transparent border-none resize-none text-[16px] leading-relaxed text-surface-900 dark:text-surface-100 placeholder:text-surface-400 focus:ring-0 p-0"
          maxLength={500}
          disabled={isUploading}
        />
      </div>

      {/* 2. 추가 옵션 토글 버튼 */}
      <button 
        onClick={() => setShowOptions(!showOptions)}
        className="flex items-center justify-center gap-1.5 py-3 border-t border-surface-100 dark:border-surface-800 text-[13px] font-medium text-surface-500 hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors"
      >
        <span>사진, 태그, 추가 설정</span>
        {showOptions ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
      </button>

      {/* 3. 추가 옵션 섹션 (사진, 태그, 설정) */}
      {showOptions && (
        <div className="p-5 pt-2 space-y-6 border-t border-surface-100 dark:border-surface-800 bg-surface-50/50 dark:bg-surface-900/50">
          
          {/* 사진 첨부 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-medium text-surface-500">사진 첨부</span>
              <span className="text-[11px] text-surface-400">{totalImageCount}/5</span>
            </div>
            <div 
              className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-hide"
              style={{ 
                willChange: 'scroll-position',
                WebkitOverflowScrolling: 'touch',
                transform: 'translateZ(0)',
              }}
            >
              <label className={cn(
                "flex-shrink-0 size-16 flex flex-col items-center justify-center rounded-xl bg-white dark:bg-surface-800 border border-dashed border-surface-300 dark:border-surface-700 text-surface-400 cursor-pointer active:scale-95 transition-all",
                isUploading && "opacity-50 cursor-not-allowed"
              )}>
                <Camera className="size-5 mb-0.5" />
                <input 
                  type="file" 
                  className="hidden" 
                  accept="image/*" 
                  multiple 
                  onChange={handleImageChange} 
                  disabled={isUploading}
                />
              </label>
              
              {existingImages.filter(img => !deletedImageIds.includes(img.id)).map((img) => (
                <div key={img.id} className="relative flex-shrink-0 size-16 rounded-xl overflow-hidden shadow-sm border border-surface-200 dark:border-surface-700">
                  <img 
                    src={getReviewImageUrl(img.image_path, "thumbnail")} 
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover" 
                    alt="리뷰" 
                  />
                  <button 
                    onClick={() => removeExistingImage(img.id)}
                    className="absolute top-1 right-1 p-0.5 bg-black/60 rounded-full text-white"
                    disabled={isUploading}
                  >
                    <X className="size-3" />
                  </button>
                </div>
              ))}

              {reviewPreviews.map((preview, index) => (
                <div key={`new-${index}`} className="relative flex-shrink-0 size-16 rounded-xl overflow-hidden shadow-sm border border-surface-200 dark:border-surface-700">
                  <img 
                    src={preview} 
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover" 
                    alt="새 이미지" 
                  />
                  <button 
                    onClick={() => removeNewImage(index)}
                    className="absolute top-1 right-1 p-0.5 bg-black/60 rounded-full text-white"
                    disabled={isUploading}
                  >
                    <X className="size-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* 태그 선택 */}
          <div className="space-y-2">
            <span className="text-[13px] font-medium text-surface-500">이 장소의 특징</span>
            <div className="flex flex-wrap gap-1.5">
              {availableTags.map(tag => (
                <button
                  key={tag.code}
                  onClick={() => toggleTag(tag.code)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all border",
                    selectedTagCodes.includes(tag.code) 
                      ? "bg-primary-500 border-primary-500 text-white shadow-sm" 
                      : "bg-white dark:bg-surface-800 border-surface-200 dark:border-surface-700 text-surface-500 dark:text-surface-400 hover:bg-surface-50 dark:hover:bg-surface-700"
                  )}
                  disabled={isUploading}
                >
                  {tag.label}
                </button>
              ))}
            </div>
          </div>

          {/* 설정 (음주 & 공개) */}
          <div className="space-y-3 pt-2">
            <span className="text-[13px] font-medium text-surface-500">추가 설정</span>
            
            {/* 음주 여부 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wine className="size-4 text-surface-400" />
                <span className="text-[13px] font-medium text-surface-700 dark:text-surface-300">음주 여부</span>
              </div>
              <div className="flex items-center gap-3">
                {isDrinking && (
                  <div className="flex items-center gap-2 bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-lg p-0.5 h-8">
                    <button 
                      onClick={() => setBottles(Math.max(0.5, bottles - 0.5))}
                      className="p-1 hover:bg-surface-50 dark:hover:bg-surface-700 rounded text-surface-500"
                      disabled={isUploading}
                    >
                      <Minus className="size-3" />
                    </button>
                    <span className="text-[12px] font-medium w-8 text-center tabular-nums">{bottles}병</span>
                    <button 
                      onClick={() => setBottles(bottles + 0.5)}
                      className="p-1 hover:bg-surface-50 dark:hover:bg-surface-700 rounded text-surface-500"
                      disabled={isUploading}
                    >
                      <Plus className="size-3" />
                    </button>
                  </div>
                )}
                <button 
                  onClick={() => setIsDrinking(!isDrinking)}
                  className={cn(
                    "w-12 h-7 rounded-full transition-colors relative",
                    isDrinking ? "bg-primary-500" : "bg-surface-200 dark:bg-surface-700"
                  )}
                  disabled={isUploading}
                >
                  <div className={cn(
                    "absolute top-1 left-1 size-5 bg-white rounded-full shadow-sm transition-transform",
                    isDrinking ? "translate-x-5" : "translate-x-0"
                  )} />
                </button>
              </div>
            </div>

            {/* 공개 설정 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lock className="size-4 text-surface-400" />
                <span className="text-[13px] font-medium text-surface-700 dark:text-surface-300">나만 보기 (비공개)</span>
              </div>
              <button 
                onClick={() => setIsPrivate(!isPrivate)}
                className={cn(
                  "w-12 h-7 rounded-full transition-colors relative",
                  isPrivate ? "bg-primary-500" : "bg-surface-200 dark:bg-surface-700"
                )}
                disabled={isUploading}
              >
                <div className={cn(
                  "absolute top-1 left-1 size-5 bg-white rounded-full shadow-sm transition-transform",
                  isPrivate ? "translate-x-5" : "translate-x-0"
                )} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. 하단 버튼 */}
      <div className="flex gap-3 p-5 pt-3 border-t border-surface-100 dark:border-surface-800">
        <Button 
          variant="ghost"
          onClick={onCancel} 
          className="flex-1 h-11 rounded-xl text-[14px] font-medium text-surface-600 bg-surface-100 hover:bg-surface-200 dark:bg-surface-800 dark:text-surface-300 dark:hover:bg-surface-700" 
          disabled={isUploading}
        >
          취소
        </Button>
        <Button 
          onClick={handleSubmit} 
          className={cn(
            "flex-[2] h-11 rounded-xl text-[14px] font-medium shadow-sm transition-all",
            comment.trim() ? "bg-primary-500 text-white hover:bg-primary-600" : "bg-surface-100 dark:bg-surface-800 text-surface-400 cursor-not-allowed"
          )}
          disabled={isUploading || !comment.trim()}
        >
          {isUploading ? <Loader2 className="size-5 animate-spin text-white" /> : (isEditMode ? "수정 완료" : "작성 완료")}
        </Button>
      </div>
    </div>
  );
}
