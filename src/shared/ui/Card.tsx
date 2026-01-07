import { type HTMLAttributes, forwardRef } from "react";
import { cn } from "@/shared/lib/utils";

/**
 * 카드 컴포넌트 속성 인터페이스
 */
export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** 카드 스타일 변형 */
  variant?: "default" | "outline" | "ghost";
  /** 카드 내부 여백 크기 */
  padding?: "none" | "sm" | "md" | "lg";
}

/**
 * 공통 카드 컴포넌트
 * 콘텐츠를 그룹화하여 시각적으로 구분할 때 사용합니다.
 */
export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = "default", padding = "md", ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "rounded-xl overflow-hidden transition-all duration-150",
          {
            // 스타일 변형별 클래스
            "bg-white dark:bg-surface-900 shadow-soft-sm border border-surface-200 dark:border-surface-800 hover:shadow-soft-md":
              variant === "default",
            "bg-transparent border border-surface-200 dark:border-surface-800":
              variant === "outline",
            "bg-transparent": variant === "ghost",
            // 패딩 크기별 클래스
            "p-0": padding === "none",
            "p-3": padding === "sm",
            "p-4": padding === "md",
            "p-6": padding === "lg",
          },
          className
        )}
        {...props}
      />
    );
  }
);

Card.displayName = "Card";
