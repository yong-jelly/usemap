import React from "react";
import { cn } from "@/shared/lib/utils";

interface ThemeTabProps {
  selectedThemes: string[];
  onToggle: (themeCode: string) => void;
}

export const THEMES = [
  { code: 'food_good', theme_name: '음식맛', display_name: '음식이 맛있어요', emoji: '😋' },
  { code: 'large', theme_name: '음식양', display_name: '양이 많아요', emoji: '🍚' },
  { code: 'special_menu', theme_name: '특별메뉴', display_name: '특별한 메뉴가 있어요', emoji: '✨' },
  { code: 'eat_alone', theme_name: '혼밥', display_name: '혼밥하기 좋아요', emoji: '🧘' },
  { code: 'spacious', theme_name: '넓은매장', display_name: '매장이 넓어요', emoji: '🏢' },
  { code: 'fresh', theme_name: '신선도', display_name: '재료가 신선해요', emoji: '🥬' },
  { code: 'kind', theme_name: '친절', display_name: '친절해요', emoji: '😊' },
  { code: 'price_cheap', theme_name: '가성비', display_name: '가성비가 좋아요', emoji: '💰' },
  { code: 'store_clean', theme_name: '청결', display_name: '매장이 청결해요', emoji: '✨' },
  { code: 'food_fast', theme_name: '빠른 주문', display_name: '음식이 빨리 나와요', emoji: '⚡' },
  { code: 'special_day', theme_name: '특별함', display_name: '특별한 날 가기 좋아요', emoji: '🎉' },
  { code: 'toilet_clean', theme_name: '깨끗 화장실', display_name: '화장실이 깨끗해요', emoji: '🧼' },
  { code: 'together', theme_name: '단체모임', display_name: '단체모임 하기 좋아요', emoji: '👥' },
  { code: 'interior_cool', theme_name: '인테리어', display_name: '인테리어가 멋져요', emoji: '🛋️' },
  { code: 'taste_healthy', theme_name: '건강한 맛', display_name: '건강한 맛이에요', emoji: '🥗' },
  { code: 'view_good', theme_name: '굳 뷰', display_name: '뷰가 좋아요', emoji: '🖼️' },
  { code: 'parking_easy', theme_name: '주차편리', display_name: '주차하기 편해요', emoji: '🚗' },
  { code: 'price_worthy', theme_name: '비싼가치', display_name: '비싼 만큼 가치있어요', emoji: '💎' },
  { code: 'menu_good', theme_name: '알찬구성', display_name: '메뉴 구성이 알차요', emoji: '🍱' },
  { code: 'kid_good', theme_name: '아이와 함께', display_name: '아이와 가기 좋아요', emoji: '👶' },
  { code: 'concept_unique', theme_name: '독특 컨셉', display_name: '컨셉이 독특해요', emoji: '🌈' },
  { code: 'local_taste', theme_name: '현지맛', display_name: '현지 맛에 가까워요', emoji: '🌏' },
  { code: 'atmosphere_calm', theme_name: '분위기', display_name: '차분한 분위기에요', emoji: '🕯️' },
  { code: 'drink_alone', theme_name: '굳 혼술', display_name: '혼술하기 좋아요', emoji: '🍺' },
  { code: 'comfy', theme_name: '편한 좌석', display_name: '좌석이 편해요', emoji: '🛋️' },
  { code: 'pet_good', theme_name: '반려동물', display_name: '반려동물과 가기 좋아요', emoji: '🐾' }
];

export function ThemeTab({ selectedThemes, onToggle }: ThemeTabProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <h3 className="text-[19px] font-black text-surface-900 dark:text-white">장소 테마</h3>
        <span className="text-[11px] font-bold text-surface-400 bg-surface-100 dark:bg-surface-800 px-2.5 py-1 rounded-full">하나만 선택 가능</span>
      </div>
      <div className="grid grid-cols-2 gap-3 pb-6">
        {THEMES.map((theme) => {
          const isSelected = selectedThemes.includes(theme.code);
          return (
            <button
              key={theme.code}
              onClick={() => onToggle(theme.code)}
              className={cn(
                "flex items-center p-4 rounded-2xl border-2 transition-all gap-3 relative text-left shadow-none",
                isSelected
                  ? "border-[#6366F1] bg-indigo-50/20"
                  : "border-surface-100 dark:border-surface-800 bg-white dark:bg-surface-900"
              )}
            >
              <span className="text-2xl">{theme.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className={cn(
                  "text-[15px] font-bold tracking-tight truncate",
                  isSelected ? "text-[#6366F1]" : "text-surface-900 dark:text-white"
                )}>
                  {theme.theme_name}
                </div>
                <div className="text-[11px] text-surface-400 font-medium truncate">
                  {theme.display_name}
                </div>
              </div>
              {isSelected && (
                <div className="absolute top-2 right-2 w-2 h-2 bg-[#6366F1] rounded-full border border-white dark:border-surface-900" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
