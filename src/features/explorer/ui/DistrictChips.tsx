import React from "react";
import { cn } from "@/shared/lib/utils";
import { REGION_DATA } from "@/shared/config/filter-constants";

interface DistrictChipsProps {
  selectedGroup1: string | null;
  selectedGroup2: string | null;
  onSelect: (group2: string) => void;
}

/**
 * 군/구(group2) 가로 스크롤 Chip 목록
 * 네이버 히든아카이브 스타일의 지역 필터 UI
 */
export function DistrictChips({ 
  selectedGroup1, 
  selectedGroup2, 
  onSelect 
}: DistrictChipsProps) {
  const currentGroup2List = REGION_DATA.find(r => r.group1 === selectedGroup1)?.group2_json || [];

  if (!selectedGroup1) return null;

  return (
    <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide px-4 h-full">
      {currentGroup2List.map((group2) => {
        const isSelected = selectedGroup2 === group2 || (group2 === "전체" && !selectedGroup2);
        return (
          <button
            key={group2}
            onClick={() => onSelect(group2)}
            className={cn(
              "px-4 py-1.5 rounded-full text-[13px] font-bold transition-all shrink-0 border-2",
              isSelected
                ? "bg-surface-900 border-surface-900 text-white dark:bg-white dark:border-white dark:text-surface-950"
                : "bg-transparent border-transparent text-surface-400 dark:text-surface-500 hover:text-surface-600 active:scale-[0.95]"
            )}
          >
            {group2}
          </button>
        );
      })}
    </div>
  );
}
