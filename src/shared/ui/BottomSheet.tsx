import { type ReactNode, useEffect, useState } from "react";
import { cn } from "@/shared/lib/utils";

/**
 * 바텀 시트 컴포넌트 속성 인터페이스
 */
interface BottomSheetProps {
  /** 열림 상태 */
  isOpen: boolean;
  /** 닫기 콜백 함수 */
  onClose: () => void;
  /** 시트 내부 콘텐츠 */
  children: ReactNode;
  /** 시트 상단 제목 (선택 사항) */
  title?: string;
}

/**
 * 공통 바텀 시트 컴포넌트
 * 모바일 환경에서 화면 하단에서 위로 올라오는 패널을 구현합니다.
 */
export function BottomSheet({ isOpen, onClose, children, title }: BottomSheetProps) {
  // 실제 DOM 렌더링 여부 상태 (애니메이션 완료 후 제거를 위함)
  const [isRendered, setIsRendered] = useState(isOpen);

  useEffect(() => {
    if (isOpen) {
      setIsRendered(true);
      document.body.style.overflow = "hidden";
    } else {
      const timer = setTimeout(() => setIsRendered(false), 300); // 300ms 애니메이션 후 제거
      document.body.style.overflow = "unset";
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isRendered) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center">
      {/* 반투명 배경(오버레이) */}
      <div
        className={cn(
          "absolute inset-0 bg-black/40 transition-opacity duration-300",
          isOpen ? "opacity-100" : "opacity-0"
        )}
        onClick={onClose}
      />
      
      {/* 시트 본체 */}
      <div
        className={cn(
          "relative w-full max-w-lg bg-white dark:bg-surface-900 rounded-t-2xl shadow-xl transition-transform duration-300 ease-out p-4 pb-8",
          isOpen ? "translate-y-0" : "translate-y-full"
        )}
      >
        {/* 상단 핸들 바 (드래그 가능함을 시각적으로 표시) */}
        <div className="flex justify-center mb-4">
          <div className="w-12 h-1.5 bg-surface-200 dark:bg-surface-800 rounded-full" />
        </div>

        {title && (
          <h2 className="text-lg font-bold mb-4 text-surface-900 dark:text-white">
            {title}
          </h2>
        )}

        {/* 스크롤 가능한 콘텐츠 영역 */}
        <div className="max-h-[70vh] overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
