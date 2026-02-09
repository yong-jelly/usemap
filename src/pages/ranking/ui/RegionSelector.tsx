import { REGION_DATA } from "@/shared/config/filter-constants";
import { cn } from "@/shared/lib/utils";

interface RegionSelectorProps {
  selectedRegion: string;
  onSelectRegion: (region: string) => void;
}

export function RegionSelector({ selectedRegion, onSelectRegion }: RegionSelectorProps) {
  // '전국' 옵션 추가
  const regions = [{ group1: '전국' }, ...REGION_DATA];

  return (
    <div className="flex overflow-x-auto gap-2 px-4 py-2 border-b border-surface-100 dark:border-surface-800 scrollbar-hide bg-white dark:bg-surface-900 sticky top-[56px] z-10">
      {regions.map((region) => (
        <button
          key={region.group1}
          onClick={() => onSelectRegion(region.group1)}
          className={cn(
            "px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors flex-shrink-0",
            selectedRegion === region.group1
              ? "bg-surface-900 text-white dark:bg-white dark:text-surface-900"
              : "text-surface-500 hover:text-surface-900 dark:text-surface-400 dark:hover:text-surface-100"
          )}
        >
          {region.group1}
        </button>
      ))}
    </div>
  );
}
