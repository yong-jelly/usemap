import { THEMES } from "@/shared/config/filter-constants";
import { cn } from "@/shared/lib/utils";

interface ThemeSelectorProps {
  selectedTheme: string;
  onSelectTheme: (themeCode: string) => void;
}

export function ThemeSelector({ selectedTheme, onSelectTheme }: ThemeSelectorProps) {
  // 인기 테마와 일반 테마 분리 (예시: 빵, 디저트, 고기, 커피 등을 상단에 배치)
  const POPULAR_THEMES = ['food_good', 'bread_good', 'dessert_good', 'meat_good', 'coffee_good', 'eat_alone', 'price_cheap'];
  
  const popularThemes = THEMES.filter(t => POPULAR_THEMES.includes(t.code));
  const otherThemes = THEMES.filter(t => !POPULAR_THEMES.includes(t.code));

  return (
    <div className="flex flex-col gap-4 py-4">
      <div className="px-4">
        <h3 className="text-lg font-bold mb-2">🔥 인기 테마</h3>
        <div className="flex flex-wrap gap-2">
          {popularThemes.map((theme) => (
            <button
              key={theme.code}
              onClick={() => onSelectTheme(theme.code)}
              className={cn(
                "px-3 py-1.5 rounded-full text-sm font-medium transition-colors",
                selectedTheme === theme.code
                  ? "bg-primary-500 text-white shadow-md"
                  : "bg-surface-100 text-surface-600 hover:bg-surface-200 dark:bg-surface-800 dark:text-surface-300"
              )}
            >
              <span className="mr-1">{theme.emoji}</span>
              {theme.display_name}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4">
        <h3 className="text-sm text-surface-500 font-medium mb-2">전체 테마</h3>
        <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-hide">
          {otherThemes.map((theme) => (
            <button
              key={theme.code}
              onClick={() => onSelectTheme(theme.code)}
              className={cn(
                "px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors flex-shrink-0",
                selectedTheme === theme.code
                  ? "bg-primary-500 text-white shadow-md"
                  : "bg-surface-100 text-surface-600 hover:bg-surface-200 dark:bg-surface-800 dark:text-surface-300"
              )}
            >
              <span className="mr-1">{theme.emoji}</span>
              {theme.theme_name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
