import React from "react";
import { cn } from "@/shared/lib/utils";
import { CATEGORIES } from "@/shared/config/filter-constants";

interface CategoryTabProps {
  selectedCategories: string[];
  onToggle: (category: string) => void;
}

export function CategoryTab({ selectedCategories, onToggle }: CategoryTabProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <h3 className="text-[19px] font-medium text-surface-900 dark:text-white">음식 종류</h3>
        <span className="text-[11px] font-medium text-surface-400 bg-surface-100 dark:bg-surface-800 px-2.5 py-1 rounded-full">중복 선택 가능</span>
      </div>
      <div className="grid grid-cols-3 gap-3.5 pb-6">
        {CATEGORIES.map((cat) => {
          const isSelected = selectedCategories.includes(cat.name);
          return (
            <button
              key={cat.name}
              onClick={() => onToggle(cat.name)}
              className={cn(
                "flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all aspect-square gap-2 relative",
                isSelected
                  ? "border-[#6366F1] bg-indigo-50/20"
                  : "border-surface-100 dark:border-surface-800 bg-white dark:bg-surface-900"
              )}
            >
              {isSelected && (
                <div className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-[#6366F1] rounded-full border-2 border-white dark:border-surface-900" />
              )}
              <span className="text-3xl">{cat.emoji}</span>
              <span className={cn(
                "text-[13px] font-medium tracking-tight text-center break-keep",
                isSelected ? "text-[#6366F1]" : "text-surface-600 dark:text-surface-400"
              )}>
                {cat.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
