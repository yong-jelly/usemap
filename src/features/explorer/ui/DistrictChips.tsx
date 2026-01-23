import React, { useEffect, useRef } from "react";
import { cn } from "@/shared/lib/utils";
import { REGION_DATA } from "@/shared/config/filter-constants";
import { HorizontalScroll } from "@/shared/ui/HorizontalScroll";

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
  const scrollRef = useRef<HTMLDivElement>(null);
  const currentGroup2List = REGION_DATA.find(r => r.group1 === selectedGroup1)?.group2_json || [];

  // 지역(group1) 또는 검색 모드 종료 시 스크롤을 가장 왼쪽으로 이동
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ left: 0, behavior: 'instant' });
    }
  }, [selectedGroup1, selectedGroup2]); // selectedGroup2가 "전체"로 바뀔 때도 초기화되도록 추가

  if (!selectedGroup1) return null;

  return (
    <HorizontalScroll 
      ref={scrollRef}
      className="flex-1 h-full min-w-0"
      containerClassName="flex items-center gap-2 px-4 h-full"
      scrollAmount={200}
      fadeEdges={false}
    >
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
    </HorizontalScroll>
  );
}
