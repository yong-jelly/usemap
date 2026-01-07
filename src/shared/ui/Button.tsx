import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/shared/lib/utils";

/**
 * 버튼 컴포넌트 속성 인터페이스
 */
export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** 버튼 스타일 변형 */
  variant?: "primary" | "secondary" | "outline" | "ghost" | "destructive";
  /** 버튼 크기 */
  size?: "sm" | "md" | "lg" | "icon";
  /** 로딩 상태 표시 여부 */
  isLoading?: boolean;
}

/**
 * 공통 버튼 컴포넌트
 * 프로젝트 전체에서 사용되는 표준 버튼입니다.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", isLoading, disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-lg transition-all duration-150",
          "font-medium whitespace-nowrap text-sm",
          "disabled:pointer-events-none disabled:opacity-50",
          // 포커스 시 스타일링 (접근성 고려)
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40 focus-visible:ring-offset-2",
          {
            // 변형별 스타일링
            "bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-800 shadow-soft-sm hover:shadow-soft-md":
              variant === "primary",
            "bg-surface-100 text-surface-700 hover:bg-surface-200 active:bg-surface-300 dark:bg-surface-800 dark:text-surface-200 dark:hover:bg-surface-700":
              variant === "secondary",
            "border border-surface-200 bg-white text-surface-700 hover:bg-surface-50 hover:border-surface-300 dark:border-surface-700 dark:bg-surface-900 dark:text-surface-200 dark:hover:bg-surface-800":
              variant === "outline",
            "bg-transparent text-surface-600 hover:bg-surface-100 hover:text-surface-900 dark:text-surface-400 dark:hover:bg-surface-800 dark:hover:text-surface-100":
              variant === "ghost",
            "bg-accent-rose text-white hover:bg-red-600 active:bg-red-700":
              variant === "destructive",
            // 크기별 스타일링
            "h-8 px-3": size === "sm",
            "h-9 px-4": size === "md",
            "h-11 px-5": size === "lg",
            "h-9 w-9 p-0": size === "icon",
          },
          className
        )}
        {...props}
      >
        {isLoading ? (
          // 로딩 중일 때 스피너 표시
          <>
            <svg
              className="h-4 w-4 animate-spin"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span>로딩 중...</span>
          </>
        ) : (
          children
        )}
      </button>
    );
  }
);

Button.displayName = "Button";
