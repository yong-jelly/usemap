import { useUserStore } from "@/entities/user";
import { cn } from "@/shared/lib/utils";
import { CheckCircle } from "lucide-react";

interface VisitedFilterTabProps {
  totalCount: number;
  visitedCount: number;
  showVisitedOnly: boolean;
  onToggle: (showVisitedOnly: boolean) => void;
  className?: string;
}

/**
 * 방문한 장소 필터링 탭 컴포넌트
 * 로그인한 사용자에게만 표시됩니다.
 */
export function VisitedFilterTab({
  totalCount,
  visitedCount,
  showVisitedOnly,
  onToggle,
  className,
}: VisitedFilterTabProps) {
  const { isAuthenticated } = useUserStore();

  if (!isAuthenticated) return null;

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <button
        onClick={() => onToggle(false)}
        className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all",
          !showVisitedOnly
            ? "bg-surface-900 text-white dark:bg-white dark:text-surface-900 shadow-sm"
            : "bg-surface-100 text-surface-500 hover:bg-surface-200 dark:bg-surface-800 dark:text-surface-400 dark:hover:bg-surface-700"
        )}
      >
        <span>전체</span>
        <span className={cn(
          "opacity-80",
          !showVisitedOnly ? "text-white dark:text-surface-900" : "text-surface-500 dark:text-surface-400"
        )}>
          {totalCount}
        </span>
      </button>

      <button
        onClick={() => onToggle(true)}
        className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all",
          showVisitedOnly
            ? "bg-primary-500 text-white shadow-sm ring-2 ring-primary-100 dark:ring-primary-900/30"
            : "bg-surface-100 text-surface-500 hover:bg-surface-200 dark:bg-surface-800 dark:text-surface-400 dark:hover:bg-surface-700"
        )}
      >
        <CheckCircle className="size-3.5" />
        <span>방문</span>
        <span className={cn(
          "opacity-80",
          showVisitedOnly ? "text-white" : "text-surface-500 dark:text-surface-400"
        )}>
          {visitedCount}
        </span>
      </button>
    </div>
  );
}
