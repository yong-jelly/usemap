import React from "react";
import { cn } from "@/shared/lib/utils";
import { PRICE_RANGES } from "@/shared/config/filter-constants";

interface PriceTabProps {
  selectedMin: number | null;
  selectedMax: number | null;
  onSelect: (min: number | null, max: number | null) => void;
}

export function PriceTab({ selectedMin, selectedMax, onSelect }: PriceTabProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <h3 className="text-sm font-medium text-surface-400">가격대 선택</h3>
        <div className="grid grid-cols-2 gap-2">
          {PRICE_RANGES.map((range) => {
            const isSelected = selectedMin === range.min && selectedMax === range.max;
            return (
              <button
                key={range.label}
                onClick={() => onSelect(range.min, range.max)}
                className={cn(
                  "py-4 rounded-2xl text-[15px] font-medium transition-all border-2",
                  isSelected
                    ? "bg-indigo-50 border-[#6366F1] text-[#6366F1]"
                    : "bg-surface-50 border-transparent text-surface-600 hover:bg-surface-100"
                )}
              >
                {range.label}
              </button>
            );
          })}
        </div>
      </div>
      
      <p className="text-[13px] text-surface-400 leading-relaxed">
        * 평균 가격은 등록된 메뉴 정보를 바탕으로 계산된 대략적인 금액입니다. 실제 가격과 차이가 있을 수 있습니다.
      </p>
    </div>
  );
}
