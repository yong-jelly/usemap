import React from "react";
import { cn } from "@/shared/lib/utils";

interface PriceRange {
  label: string;
  min: number | null;
  max: number | null;
}

const PRICE_RANGES: PriceRange[] = [
  { label: "전체", min: null, max: null },
  { label: "1만원 이하", min: null, max: 10000 },
  { label: "1~2만원", min: 10000, max: 20000 },
  { label: "2~3만원", min: 20000, max: 30000 },
  { label: "3~5만원", min: 30000, max: 50000 },
  { label: "5~10만원", min: 50000, max: 100000 },
  { label: "10만원 이상", min: 100000, max: null },
];

interface PriceTabProps {
  selectedMin: number | null;
  selectedMax: number | null;
  onSelect: (min: number | null, max: number | null) => void;
}

export function PriceTab({ selectedMin, selectedMax, onSelect }: PriceTabProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <h3 className="text-sm font-bold text-surface-400">가격대 선택</h3>
        <div className="grid grid-cols-2 gap-2">
          {PRICE_RANGES.map((range) => {
            const isSelected = selectedMin === range.min && selectedMax === range.max;
            return (
              <button
                key={range.label}
                onClick={() => onSelect(range.min, range.max)}
                className={cn(
                  "py-4 rounded-2xl text-[15px] font-bold transition-all border-2",
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
