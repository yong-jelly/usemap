import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/shared/lib/utils";

/**
 * ImageViewer 컴포넌트 Props
 */
export interface ImageViewerProps {
  /** 이미지 URL 배열 */
  images: string[];
  /** 초기 표시할 이미지 인덱스 */
  initialIndex?: number;
  /** 열림 상태 */
  isOpen: boolean;
  /** 닫기 콜백 */
  onClose: () => void;
}

/**
 * Airbnb 스타일의 전체화면 이미지 갤러리 컴포넌트
 */
export function ImageViewer({ images, initialIndex = 0, isOpen, onClose }: ImageViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const sliderRef = useRef<HTMLDivElement>(null);
  const thumbnailsRef = useRef<HTMLDivElement>(null);

  // 인덱스 변경 시 슬라이더 위치 조정
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
    }
  }, [isOpen, initialIndex]);

  useEffect(() => {
    if (isOpen && sliderRef.current) {
      const slider = sliderRef.current;
      const targetScroll = slider.offsetWidth * currentIndex;
      slider.scrollTo({ left: targetScroll, behavior: "instant" });
    }
  }, [isOpen, currentIndex]);

  // 배경 스크롤 방지
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // 키보드 내비게이션
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") handlePrev();
      if (e.key === "ArrowRight") handleNext();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, currentIndex, onClose]);

  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : prev));
  }, []);

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : prev));
  }, [images.length]);

  const handleThumbnailClick = (index: number) => {
    setCurrentIndex(index);
  };

  const handleScroll = () => {
    if (!sliderRef.current) return;
    const slider = sliderRef.current;
    const newIndex = Math.round(slider.scrollLeft / slider.offsetWidth);
    if (newIndex !== currentIndex && newIndex >= 0 && newIndex < images.length) {
      setCurrentIndex(newIndex);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100000] flex flex-col bg-black text-white outline-none">
      {/* 헤더 */}
      <header className="flex h-16 items-center justify-between px-6 shrink-0 z-10">
        <div className="text-sm font-medium">
          {currentIndex + 1} / {images.length}
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-full hover:bg-white/10 transition-colors"
          aria-label="닫기"
        >
          <X className="h-6 w-6" />
        </button>
      </header>

      {/* 메인 콘텐츠 (슬라이더) */}
      <div className="relative flex-1 flex items-center justify-center overflow-hidden">
        {/* 이전 버튼 */}
        {currentIndex > 0 && (
          <button
            onClick={handlePrev}
            className="absolute left-6 z-10 p-3 rounded-full bg-black/20 hover:bg-black/40 border border-white/20 transition-all hidden md:flex"
            aria-label="이전 이미지"
          >
            <ChevronLeft className="h-8 w-8" />
          </button>
        )}

        {/* 슬라이더 영역 */}
        <div
          ref={sliderRef}
          onScroll={handleScroll}
          className="flex h-full w-full overflow-x-auto snap-x snap-mandatory scrollbar-hide touch-pan-x"
          style={{ scrollBehavior: "smooth" }}
        >
          {images.map((img, index) => (
            <div
              key={index}
              className="flex-shrink-0 w-full h-full flex items-center justify-center snap-center p-4"
            >
              <img
                src={img}
                alt={`이미지 ${index + 1}`}
                className="max-w-full max-h-full object-contain select-none shadow-2xl"
                draggable={false}
              />
            </div>
          ))}
        </div>

        {/* 다음 버튼 */}
        {currentIndex < images.length - 1 && (
          <button
            onClick={handleNext}
            className="absolute right-6 z-10 p-3 rounded-full bg-black/20 hover:bg-black/40 border border-white/20 transition-all hidden md:flex"
            aria-label="다음 이미지"
          >
            <ChevronRight className="h-8 w-8" />
          </button>
        )}
      </div>

      {/* 푸터 (썸네일 목록) */}
      {images.length > 1 && (
        <footer className="h-24 md:h-32 flex items-center justify-center shrink-0 z-10 px-6">
          <div
            ref={thumbnailsRef}
            className="flex gap-2 overflow-x-auto scrollbar-hide max-w-full py-2"
          >
            {images.map((img, index) => (
              <button
                key={index}
                onClick={() => handleThumbnailClick(index)}
                className={cn(
                  "relative flex-shrink-0 w-16 h-16 md:w-20 md:h-20 rounded-md overflow-hidden transition-all border-2",
                  currentIndex === index ? "border-white opacity-100 scale-105" : "border-transparent opacity-50 hover:opacity-75"
                )}
              >
                <img src={img} className="w-full h-full object-cover" alt={`썸네일 ${index + 1}`} />
              </button>
            ))}
          </div>
        </footer>
      )}
    </div>,
    document.body
  );
}
