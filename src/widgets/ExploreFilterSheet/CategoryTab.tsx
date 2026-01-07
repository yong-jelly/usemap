import React from "react";
import { cn } from "@/shared/lib/utils";

interface CategoryTabProps {
  selectedCategories: string[];
  onToggle: (category: string) => void;
}

const CATEGORIES = [
  { name: '한식', emoji: '🍚' },
  { name: '카페,디저트', emoji: '🍰' },
  { name: '카페', emoji: '☕' },
  { name: '치킨,닭강정', emoji: '🍗' },
  { name: '육류,고기요리', emoji: '🥩' },
  { name: '중식당', emoji: '🥢' },
  { name: '맥주,호프', emoji: '🍺' },
  { name: '생선회', emoji: '🐟' },
  { name: '베이커리', emoji: '🍞' },
  { name: '종합분식', emoji: '🍢' },
  { name: '요리주점', emoji: '🏮' },
  { name: '돼지고기구이', emoji: '🥓' },
  { name: '족발,보쌈', emoji: '🍖' },
  { name: '피자', emoji: '🍕' },
  { name: '일식당', emoji: '🍣' },
  { name: '포장마차', emoji: '⛺' },
  { name: '분식', emoji: '🍤' },
  { name: '칼국수,만두', emoji: '🥟' },
  { name: '국밥', emoji: '🍲' },
  { name: '곱창,막창,양', emoji: '🔥' },
  { name: '돈가스', emoji: '🍛' },
  { name: '해물,생선요리', emoji: '🦐' },
  { name: '양식', emoji: '🍝' },
  { name: '햄버거', emoji: '🍔' },
  { name: '김밥', emoji: '🍙' },
  { name: '국수', emoji: '🍜' },
  { name: '순대,순댓국', emoji: '🥣' },
  { name: '찌개,전골', emoji: '🥘' },
  { name: '이자카야', emoji: '🍶' },
  { name: '바(BAR)', emoji: '🍸' },
  { name: '소고기구이', emoji: '🐮' },
  { name: '장어,먹장어요리', emoji: '🐍' },
  { name: '오리요리', emoji: '🦆' },
  { name: '한식뷔페', emoji: '🍽️' },
  { name: '감자탕', emoji: '🦴' },
  { name: '초밥,롤', emoji: '🍣' },
  { name: '아귀찜,해물찜', emoji: '🌶️' },
  { name: '유흥주점', emoji: '💃' },
  { name: '야식', emoji: '🌙' },
  { name: '해장국', emoji: '🥄' }
];

export function CategoryTab({ selectedCategories, onToggle }: CategoryTabProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <h3 className="text-[19px] font-black text-surface-900 dark:text-white">음식 종류</h3>
        <span className="text-[11px] font-bold text-surface-400 bg-surface-100 dark:bg-surface-800 px-2.5 py-1 rounded-full">중복 선택 가능</span>
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
                "text-[13px] font-bold tracking-tight text-center break-keep",
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
