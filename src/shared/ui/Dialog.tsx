import { forwardRef, type HTMLAttributes, type ReactNode, useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { Button } from "./Button";

/**
 * 다이얼로그(모달) 기본 속성 인터페이스
 */
export interface DialogProps {
  /** 열림 상태 */
  open: boolean;
  /** 열림 상태 변경 콜백 */
  onOpenChange: (open: boolean) => void;
  /** 다이얼로그 내부 콘텐츠 */
  children: ReactNode;
}

/**
 * 공통 다이얼로그(모달) 컴포넌트
 * 화면 중앙에 레이어를 띄울 때 사용합니다.
 */
export function Dialog({ open, onOpenChange, children }: DialogProps) {
  // 다이얼로그가 열렸을 때 배경 스크롤 방지
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // ESC 키를 눌렀을 때 다이얼로그 닫기
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        onOpenChange(false);
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open, onOpenChange]);

  if (!open) return null;

  // Portal을 사용하여 document.body 하위에 렌더링
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* 반투명 배경(오버레이) */}
      <div
        className="fixed inset-0 bg-surface-950/60 animate-fade-in"
        onClick={() => onOpenChange(false)}
      />
      {/* 다이얼로그 본체 */}
      <div className="relative z-50 animate-scale-in">{children}</div>
    </div>,
    document.body
  );
}

/**
 * 다이얼로그 실제 박스 콘텐츠
 */
export const DialogContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "relative w-full max-w-lg rounded-xl p-5 bg-white shadow-soft-lg dark:bg-surface-900 border border-surface-200 dark:border-surface-800",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

DialogContent.displayName = "DialogContent";

/**
 * 다이얼로그 헤더 속성 인터페이스
 */
export interface DialogHeaderProps extends HTMLAttributes<HTMLDivElement> {
  /** 닫기 버튼 노출 여부 및 콜백 */
  onClose?: () => void;
}

/**
 * 다이얼로그 상단 영역 (제목 등)
 */
export const DialogHeader = forwardRef<HTMLDivElement, DialogHeaderProps>(
  ({ className, onClose, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("mb-4 flex items-start justify-between", className)}
        {...props}
      >
        <div className="flex-1">{children}</div>
        {onClose && (
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 -mr-1 -mt-1 text-surface-400">
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    );
  }
);

DialogHeader.displayName = "DialogHeader";

/**
 * 다이얼로그 제목
 */
export const DialogTitle = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => {
    return (
      <h2
        ref={ref}
        className={cn("text-base font-semibold text-surface-900 dark:text-surface-50", className)}
        {...props}
      />
    );
  }
);

DialogTitle.displayName = "DialogTitle";

/**
 * 다이얼로그 상세 설명
 */
export const DialogDescription = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => {
    return (
      <p
        ref={ref}
        className={cn("mt-1 text-sm text-surface-500 dark:text-surface-400", className)}
        {...props}
      />
    );
  }
);

DialogDescription.displayName = "DialogDescription";

/**
 * 다이얼로그 하단 영역 (액션 버튼 등)
 */
export const DialogFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("mt-5 flex justify-end gap-2", className)}
        {...props}
      />
    );
  }
);

DialogFooter.displayName = "DialogFooter";
