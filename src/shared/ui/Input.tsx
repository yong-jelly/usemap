import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/shared/lib/utils";

/**
 * 입력창 컴포넌트 속성 인터페이스
 */
export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** 에러 메시지 */
  error?: string;
}

/**
 * 공통 입력창 컴포넌트
 * 프로젝트의 디자인 가이드에 맞춘 기본 텍스트 입력 필드입니다.
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5 w-full">
        <input
          type={type}
          className={cn(
            "flex h-10 w-full rounded-lg border border-surface-200 bg-white px-3 py-2 text-sm transition-all",
            "placeholder:text-surface-400",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40 focus-visible:ring-offset-0 focus-visible:border-primary-500",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "dark:border-surface-700 dark:bg-surface-900 dark:text-surface-50 dark:placeholder:text-surface-500",
            error && "border-accent-rose focus-visible:ring-accent-rose/20 focus-visible:border-accent-rose",
            className
          )}
          ref={ref}
          {...props}
        />
        {error && (
          <span className="text-xs text-accent-rose animate-in fade-in slide-in-from-top-1">
            {error}
          </span>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
