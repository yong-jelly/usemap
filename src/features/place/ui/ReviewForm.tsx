import { useState, useEffect } from "react";
import { Star, Camera, X, Lock, Loader2 } from "lucide-react";
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
    imageFiles: File[];
    deletedImageIds: string[];
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
  
  const [reviewFiles, setReviewFiles] = useState<File[]>([]);
  const [reviewPreviews, setReviewPreviews] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<ReviewImage[]>(initialImages);
  const [deletedImageIds, setDeletedImageIds] = useState<string[]>([]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const currentCount = reviewFiles.length + existingImages.length - deletedImageIds.length;
    const remainingSlot = 5 - currentCount;

    if (remainingSlot <= 0) {
      e.target.value = '';
      return;
    }

    const filesToAdd = files.slice(0, remainingSlot);
    const newFiles = [...reviewFiles, ...filesToAdd];
    setReviewFiles(newFiles);

    const newPreviews = filesToAdd.map(file => URL.createObjectURL(file));
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
      imageFiles: reviewFiles,
      deletedImageIds,
    });
  };

  // 컴포넌트 언마운트 시 메모리 해제
  useEffect(() => {
    return () => {
      reviewPreviews.forEach(url => URL.revokeObjectURL(url));
    };
  }, [reviewPreviews]);

  return (
    <div className="p-4 rounded-xl border border-primary-100 bg-primary-50/30 space-y-4">
      <div className="flex justify-between px-2">
        {[1, 2, 3, 4, 5].map((s) => (
          <button 
            key={s} 
            onClick={() => setRating(s)} 
            className="active:scale-90 transition-transform"
            disabled={isUploading}
          >
            <Star className={cn("size-8", s <= rating ? "text-amber-400 fill-current" : "text-surface-200")} />
          </button>
        ))}
      </div>
      
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="이 장소에 대한 솔직한 평을 남겨주세요."
        className="w-full h-24 p-3 rounded-lg bg-white border-none resize-none text-[13px] focus:ring-1 focus:ring-primary-500"
        maxLength={200}
        disabled={isUploading}
      />

      {/* 이미지 업로드 영역 */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        <label className={cn(
          "flex-shrink-0 size-20 flex flex-col items-center justify-center rounded-xl bg-white border-2 border-dashed border-surface-200 text-surface-400 cursor-pointer active:bg-surface-50",
          isUploading && "opacity-50 cursor-not-allowed"
        )}>
          <Camera className="size-6 mb-1" />
          <span className="text-[10px] font-bold">
            {reviewFiles.length + existingImages.length - deletedImageIds.length}/5
          </span>
          <input 
            type="file" 
            className="hidden" 
            accept="image/*" 
            multiple 
            onChange={handleImageChange} 
            disabled={isUploading}
          />
        </label>
        
        {/* 기존 이미지 */}
        {existingImages.filter(img => !deletedImageIds.includes(img.id)).map((img) => (
          <div key={img.id} className="relative flex-shrink-0 size-20 rounded-xl overflow-hidden group">
            <img src={getReviewImageUrl(img.image_path, "thumbnail")} className="w-full h-full object-cover" alt="기존 리뷰 이미지" />
            <button 
              onClick={() => removeExistingImage(img.id)}
              className="absolute top-1 right-1 p-1 bg-black/50 rounded-full text-white"
              disabled={isUploading}
            >
              <X className="size-3" />
            </button>
          </div>
        ))}

        {/* 새 이미지 프리뷰 */}
        {reviewPreviews.map((preview, index) => (
          <div key={`new-${index}`} className="relative flex-shrink-0 size-20 rounded-xl overflow-hidden group">
            <img src={preview} className="w-full h-full object-cover" alt="새 리뷰 이미지" />
            <button 
              onClick={() => removeNewImage(index)}
              className="absolute top-1 right-1 p-1 bg-black/50 rounded-full text-white"
              disabled={isUploading}
            >
              <X className="size-3" />
            </button>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {availableTags.map(tag => (
          <button
            key={tag.code}
            onClick={() => toggleTag(tag.code)}
            className={cn(
              "px-2.5 py-1 rounded-full text-[10px] font-bold transition-colors",
              selectedTagCodes.includes(tag.code) 
                ? "bg-primary-600 text-white" 
                : "bg-white text-surface-400 border border-surface-100",
              isUploading && "opacity-50 cursor-not-allowed"
            )}
            disabled={isUploading}
          >
            {tag.label}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between pt-1">
        <button 
          onClick={() => setIsPrivate(!isPrivate)}
          className={cn(
            "flex items-center gap-1.5 text-[12px] font-bold px-3 py-1.5 rounded-lg transition-colors",
            isPrivate ? "bg-surface-900 text-white" : "text-surface-400 hover:bg-surface-100",
            isUploading && "opacity-50 cursor-not-allowed"
          )}
          disabled={isUploading}
        >
          <Lock className={cn("size-3.5", isPrivate && "fill-current")} />
          {isPrivate ? "나만 보기 (비공개)" : "전체 공개"}
        </button>
      </div>

      <div className="flex gap-2">
        <Button 
          variant="ghost" 
          onClick={onCancel} 
          className="flex-1 h-10 text-[13px] font-bold" 
          disabled={isUploading}
        >
          취소
        </Button>
        <Button 
          onClick={handleSubmit} 
          className="flex-1 h-10 text-[13px] font-bold bg-primary-600 text-white" 
          disabled={isUploading}
        >
          {isUploading ? <Loader2 className="size-4 animate-spin" /> : "저장 완료"}
        </Button>
      </div>
    </div>
  );
}
