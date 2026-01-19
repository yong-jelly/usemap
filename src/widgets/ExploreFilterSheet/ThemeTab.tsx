import React from "react";
import { cn } from "@/shared/lib/utils";
import { THEMES } from "@/shared/config/filter-constants";

interface ThemeTabProps {
  selectedThemes: string[];
  onToggle: (themeCode: string) => void;
}

export function ThemeTab({ selectedThemes, onToggle }: ThemeTabProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-3">
          <h3 className="text-[19px] font-medium text-surface-900 dark:text-white">장소 테마</h3>
          <span className="text-[11px] font-medium text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 px-2.5 py-1 rounded-full border border-indigo-100 dark:border-indigo-800">최대 3개 선택</span>
        </div>
        <p className="text-[12px] text-surface-400 font-normal">선택한 순서대로 검색 중요도가 적용됩니다.</p>
      </div>
      <div className="grid grid-cols-2 gap-3 pb-6">
        {THEMES.map((theme) => {
          const selectedIndex = selectedThemes.indexOf(theme.code);
          const isSelected = selectedIndex !== -1;
          
          return (
            <button
              key={theme.code}
              onClick={() => onToggle(theme.code)}
              disabled={!isSelected && selectedThemes.length >= 3}
              className={cn(
                "flex items-center p-4 rounded-2xl border-2 transition-all gap-3 relative text-left shadow-none",
                isSelected
                  ? "border-[#6366F1] bg-indigo-50/20"
                  : "border-surface-100 dark:border-surface-800 bg-white dark:bg-surface-900",
                !isSelected && selectedThemes.length >= 3 && "opacity-40 cursor-not-allowed"
              )}
            >
              <span className="text-2xl">{theme.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className={cn(
                  "text-[15px] font-medium tracking-tight truncate",
                  isSelected ? "text-[#6366F1]" : "text-surface-900 dark:text-white"
                )}>
                  {theme.theme_name}
                </div>
                <div className="text-[11px] text-surface-400 font-normal truncate">
                  {theme.display_name}
                </div>
              </div>
              {isSelected && (
                <div className="absolute top-2 right-2 size-5 bg-[#6366F1] rounded-full flex items-center justify-center border border-white dark:border-surface-900 shadow-sm animate-in zoom-in duration-200">
                  <span className="text-[11px] font-medium text-white">{selectedIndex + 1}</span>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
