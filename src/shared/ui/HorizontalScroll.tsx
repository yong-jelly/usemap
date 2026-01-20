import React, { useState, useRef, useEffect, useCallback, useImperativeHandle, forwardRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/shared/lib/utils";

interface HorizontalScrollProps {
  children: React.ReactNode;
  className?: string;
  containerClassName?: string;
  containerStyle?: React.CSSProperties;
  scrollAmount?: number;
  showArrowsOnMobile?: boolean;
  fadeEdges?: boolean;
  fadeLeft?: boolean;
  fadeRight?: boolean;
}

/**
 * 가로 스크롤 영역에 PC 환경에서 좌우 네비게이션 화살표를 제공하는 래퍼 컴포넌트
 */
export const HorizontalScroll = forwardRef<HTMLDivElement, HorizontalScrollProps>(({
  children,
  className,
  containerClassName,
  containerStyle,
  scrollAmount = 300,
  showArrowsOnMobile = false,
  fadeEdges = false,
  fadeLeft,
  fadeRight,
}, ref) => {
  const internalRef = useRef<HTMLDivElement>(null);
  const scrollRef = (ref as React.MutableRefObject<HTMLDivElement>) || internalRef;
  
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // 개별 설정이 없으면 fadeEdges를 따름
  const finalFadeLeft = fadeLeft ?? fadeEdges;
  const finalFadeRight = fadeRight ?? fadeEdges;

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (el) {
      const { scrollLeft, scrollWidth, clientWidth } = el;
      // 소수점 발생 대비 1.5px 정도의 여유를 둠
      setShowLeftArrow(scrollLeft > 1.5);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 1.5);
    }
  }, [scrollRef]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      checkScroll();
      window.addEventListener("resize", checkScroll);
      el.addEventListener("scroll", checkScroll, { passive: true });
      
      return () => {
        window.removeEventListener("resize", checkScroll);
        el.removeEventListener("scroll", checkScroll);
      };
    }
  }, [checkScroll, children, scrollRef]);

  const handleScroll = (e: React.MouseEvent, direction: "left" | "right") => {
    e.stopPropagation();
    const el = scrollRef.current;
    if (el) {
      const amount = direction === "left" ? -scrollAmount : scrollAmount;
      el.scrollBy({ left: amount, behavior: "smooth" });
    }
  };

  return (
    <div 
      className={cn("relative group/scroll", className)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={(e) => {
        // 부모로의 클릭 이벤트 전파를 막고 싶을 때가 있지만, 
        // HorizontalScroll 자체는 컨테이너이므로 내부 아이템 클릭은 허용해야 함.
        // 여기서는 화살표 버튼에서만 명시적으로 막음.
      }}
    >
      {/* 왼쪽 그라데이션 및 화살표 */}
      {finalFadeLeft && (
        <div 
          className={cn(
            "absolute left-0 top-0 bottom-0 w-12 z-10 pointer-events-none transition-opacity duration-300 bg-gradient-to-r from-white dark:from-surface-950 to-transparent",
            showLeftArrow ? "opacity-100" : "opacity-0"
          )}
        />
      )}
      
      {showLeftArrow && (isHovered || showArrowsOnMobile) && (
        <button
          onClick={(e) => handleScroll(e, "left")}
          className={cn(
            "absolute left-2 top-1/2 -translate-y-1/2 z-20 size-8 rounded-full bg-white/80 dark:bg-surface-800/80 shadow-md border border-surface-100 dark:border-surface-700 flex items-center justify-center text-surface-600 dark:text-surface-300 hover:bg-white dark:hover:bg-surface-700 transition-all active:scale-90",
            !showArrowsOnMobile && "hidden group-hover/scroll:flex"
          )}
          aria-label="Scroll left"
        >
          <ChevronLeft className="size-5" />
        </button>
      )}

      {/* 스크롤 컨테이너 */}
      <div
        ref={scrollRef}
        className={cn(
          "overflow-x-auto scrollbar-hide",
          containerClassName
        )}
        style={{ WebkitOverflowScrolling: "touch", ...containerStyle }}
      >
        {children}
      </div>

      {/* 오른쪽 그라데이션 및 화살표 */}
      {finalFadeRight && (
        <div 
          className={cn(
            "absolute right-0 top-0 bottom-0 w-12 z-10 pointer-events-none transition-opacity duration-300 bg-gradient-to-l from-white dark:from-surface-950 to-transparent",
            showRightArrow ? "opacity-100" : "opacity-0"
          )}
        />
      )}
      
      {showRightArrow && (isHovered || showArrowsOnMobile) && (
        <button
          onClick={(e) => handleScroll(e, "right")}
          className={cn(
            "absolute right-2 top-1/2 -translate-y-1/2 z-20 size-8 rounded-full bg-white/80 dark:bg-surface-800/80 shadow-md border border-surface-100 dark:border-surface-700 flex items-center justify-center text-surface-600 dark:text-surface-300 hover:bg-white dark:hover:bg-surface-700 transition-all active:scale-90",
            !showArrowsOnMobile && "hidden group-hover/scroll:flex"
          )}
          aria-label="Scroll right"
        >
          <ChevronRight className="size-5" />
        </button>
      )}
    </div>
  );
});

HorizontalScroll.displayName = "HorizontalScroll";
