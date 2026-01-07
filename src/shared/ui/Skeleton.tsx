import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "@/shared/lib/utils";

/**
 * 스켈레톤 컴포넌트 속성 인터페이스
 */
export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  /** 스켈레톤 형태 변형 */
  variant?: "text" | "circular" | "rectangular";
}

/**
 * 공통 스켈레톤 컴포넌트
 * 데이터 로딩 중 플레이스홀더를 표시하여 사용자 경험을 개선합니다.
 */
export const Skeleton = forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, variant = "rectangular", ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "animate-pulse bg-surface-200 dark:bg-surface-800",
          {
            "h-4 w-full rounded": variant === "text",
            "rounded-full": variant === "circular",
            "rounded-lg": variant === "rectangular",
          },
          className
        )}
        {...props}
      />
    );
  }
);

Skeleton.displayName = "Skeleton";
