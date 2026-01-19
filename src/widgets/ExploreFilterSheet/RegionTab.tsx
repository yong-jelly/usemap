import React from "react";
import { cn } from "@/shared/lib/utils";
import { REGION_DATA } from "@/shared/config/filter-constants";

interface RegionTabProps {
  selectedGroup1: string | null;
  selectedGroup2: string | null;
  onGroup1Select: (group1: string) => void;
  onGroup2Select: (group2: string) => void;
}

export function RegionTab({ 
  selectedGroup1, 
  selectedGroup2, 
  onGroup1Select, 
  onGroup2Select 
}: RegionTabProps) {
  const currentGroup2List = REGION_DATA.find(r => r.group1 === selectedGroup1)?.group2_json || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <h3 className="text-[19px] font-medium text-surface-900 dark:text-white">지역 선택</h3>
        <span className="text-[11px] font-medium text-surface-400 bg-surface-100 dark:bg-surface-800 px-2.5 py-1 rounded-full">시/도 및 시/군/구</span>
      </div>

      <div className="flex h-[50vh] -mx-6 overflow-hidden border-t-2 border-surface-100 dark:border-surface-800">
        {/* Sidebar: 시/도 (group1) */}
        <div className="w-[100px] overflow-y-auto bg-white dark:bg-surface-900 border-r-2 border-surface-100 dark:border-surface-800 scrollbar-hide">
          {REGION_DATA.map((region) => {
            const isSelected = selectedGroup1 === region.group1;
            return (
              <button
                key={region.group1}
                onClick={() => onGroup1Select(region.group1)}
                className={cn(
                  "w-full px-4 py-5 flex items-center justify-center transition-all",
                  isSelected
                    ? "text-surface-900 dark:text-white font-medium"
                    : "text-surface-300 dark:text-surface-600 hover:text-surface-500"
                )}
              >
                <span className="text-[15px] tracking-tight">
                  {region.group1}
                </span>
              </button>
            );
          })}
        </div>

        {/* Content: 시/군/구 (group2) */}
        <div className="flex-1 overflow-y-auto bg-white dark:bg-surface-900 p-5 scrollbar-hide">
          {!selectedGroup1 ? (
            <div className="flex flex-col items-center justify-center h-full text-surface-200 gap-4 opacity-40">
              <div className="size-16 bg-white dark:bg-surface-900 rounded-full flex items-center justify-center border-2 border-surface-100 dark:border-surface-800">
                <span className="text-3xl">📍</span>
              </div>
              <p className="font-medium text-[15px]">시/도를 먼저 선택해주세요</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 pb-4">
              {currentGroup2List.map((group2) => {
                const isSelected = selectedGroup2 === group2 || (group2 === "전체" && !selectedGroup2);
                return (
                  <button
                    key={group2}
                    onClick={() => onGroup2Select(group2)}
                    className={cn(
                      "px-3 py-4 rounded-2xl text-[15px] font-medium border-2 transition-all text-center relative shadow-none",
                      isSelected
                        ? "border-[#6366F1] bg-indigo-50/10 text-[#6366F1]"
                        : "border-surface-100 dark:border-surface-800 text-surface-500 dark:text-surface-400 hover:border-surface-200"
                    )}
                  >
                    {group2}
                    {isSelected && (
                      <div className="absolute top-2 right-2 w-2 h-2 bg-[#6366F1] rounded-full border border-white dark:border-surface-900" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
