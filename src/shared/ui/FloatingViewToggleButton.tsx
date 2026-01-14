import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Map as MapIcon, List } from "lucide-react";
import { cn } from "@/shared/lib/utils";

interface FloatingViewToggleButtonProps {
  viewMode: "list" | "map";
  onClick: () => void;
  className?: string;
}

export function FloatingViewToggleButton({
  viewMode,
  onClick,
  className,
}: FloatingViewToggleButtonProps) {
  const [isScrolling, setIsScrolling] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // 1. 최초 페이지 진입 시 효과 (아이콘 -> 텍스트 펼쳐짐)
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExpanded(true);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  // 2. 스크롤 감지 로직 (모션 없이 알파값만 변경)
  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;

    const handleScroll = () => {
      // 지도 버튼일 때만 스크롤에 반응
      if (viewMode !== "list") return;

      if (!isScrolling) {
        setIsScrolling(true);
        // 스크롤 중에는 모션(width 변화)을 방지하기 위해 isExpanded 상태를 유지합니다.
      }

      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setIsScrolling(false);
      }, 500); // 스크롤 멈춤 감지 시간을 0.5초로 최적화
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      clearTimeout(timeoutId);
    };
  }, [viewMode, isScrolling]);

  // 지도 뷰일 때는 항상 확장 및 불투명 유지
  const effectiveScrolling = viewMode === "map" ? false : isScrolling;

  return (
    <motion.button
      onClick={onClick}
      layout
      initial={false}
      animate={{
        // 최초 진입 시에만 width 애니메이션이 동작하고, 스크롤 시에는 isExpanded가 유지되므로 width 변화 없음
        width: isExpanded ? "auto" : "48px",
        opacity: effectiveScrolling ? 0.3 : 1, // 스크롤 시 연하게 투명화
        backgroundColor: viewMode === "list" ? "#1b1b1b" : "#ffffff",
      }}
      transition={{
        type: "spring",
        stiffness: 400,
        damping: 30,
        opacity: { duration: 0.15 }, // 투명도 변화는 빠르게
      }}
      className={cn(
        "h-12 rounded-full font-black shadow-2xl flex items-center justify-center overflow-hidden whitespace-nowrap px-3",
        "will-change-[opacity,transform]", // GPU 가속 힌트
        viewMode === "list" 
          ? "bg-surface-900 text-white" 
          : "bg-white text-black border border-surface-200",
        isExpanded && "px-6 min-w-[100px]",
        className
      )}
    >
      <div className="flex items-center gap-2">
        {viewMode === "list" ? (
          <MapIcon className="size-5 shrink-0" />
        ) : (
          <List className="size-5 shrink-0" />
        )}
        
        <AnimatePresence mode="wait">
          {isExpanded && (
            <motion.span
              key={viewMode}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="text-sm tracking-tight"
            >
              {viewMode === "list" ? "지도" : "목록"}
            </motion.span>
          )}
        </AnimatePresence>
      </div>
    </motion.button>
  );
}
