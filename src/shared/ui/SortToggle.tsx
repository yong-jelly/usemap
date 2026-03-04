import { MapPin } from "lucide-react";
import { cn } from "@/shared/lib/utils";

interface SortToggleProps {
  sortBy: 'recent' | 'distance';
  onSortByRecent: () => void;
  onSortByDistance: () => void;
  onLocationClick?: () => void;
  hasLocation?: boolean;
  className?: string;
}

export function SortToggle({
  sortBy,
  onSortByRecent,
  onSortByDistance,
  onLocationClick,
  hasLocation,
  className,
}: SortToggleProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="flex bg-surface-100 dark:bg-surface-800 p-1 rounded-xl">
        <button
          onClick={onSortByRecent}
          className={cn(
            "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
            sortBy === 'recent'
              ? "bg-white dark:bg-surface-700 text-surface-900 dark:text-white shadow-sm"
              : "text-surface-500 hover:text-surface-700 dark:text-surface-400"
          )}
        >
          최신순
        </button>
        <button
          onClick={onSortByDistance}
          className={cn(
            "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
            sortBy === 'distance'
              ? "bg-white dark:bg-surface-700 text-surface-900 dark:text-white shadow-sm"
              : "text-surface-500 hover:text-surface-700 dark:text-surface-400"
          )}
        >
          거리순
        </button>
      </div>
      {onLocationClick && (
        <button
          onClick={onLocationClick}
          className={cn(
            "p-2 rounded-xl transition-colors",
            hasLocation
              ? "bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400"
              : "bg-surface-100 text-surface-400 dark:bg-surface-800 hover:text-surface-600"
          )}
        >
          <MapPin className="size-5" />
        </button>
      )}
    </div>
  );
}
