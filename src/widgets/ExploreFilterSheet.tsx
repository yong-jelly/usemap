import { useState } from "react";
import { RotateCcw, X } from "lucide-react";
import { 
  Drawer, 
  DrawerContent, 
  DrawerHeader, 
  DrawerTitle, 
  DrawerFooter,
  Button 
} from "@/shared/ui";
import { cn } from "@/shared/lib/utils";
import { CategoryTab } from "./ExploreFilterSheet/CategoryTab";
import { RegionTab } from "./ExploreFilterSheet/RegionTab";
import { ThemeTab } from "./ExploreFilterSheet/ThemeTab";

interface ExploreFilterSheetProps {
  isOpen: boolean;
  onClose: () => void;
  filters: any;
  onApply: (filters: any) => void;
  onReset: () => void;
  totalCount: number;
}

export function ExploreFilterSheet({
  isOpen,
  onClose,
  filters,
  onApply,
  onReset,
  totalCount,
}: ExploreFilterSheetProps) {
  const [activeTab, setActiveTab] = useState("category");
  const [selectedGroup1, setSelectedGroup1] = useState<string | null>(filters.group1);
  const [selectedGroup2, setSelectedGroup2] = useState<string | null>(filters.group2);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(filters.categories || []);
  const [selectedThemes, setSelectedThemes] = useState<string[]>(filters.theme_code ? [filters.theme_code] : []);

  const tabs = [
    { id: "region", label: "지역" },
    { id: "category", label: "카테고리" },
    { id: "theme", label: "테마" },
  ];

  const handleGroup1Select = (group1: string) => {
    setSelectedGroup1(group1);
    setSelectedGroup2("전체"); // 시/도 선택 시 기본적으로 '전체' 선택
  };

  const handleGroup2Select = (group2: string) => {
    setSelectedGroup2(group2);
  };

  const handleCategoryToggle = (category: string) => {
    setSelectedCategories(prev =>
      prev.includes(category) 
        ? prev.filter(c => c !== category) 
        : [...prev, category]
    );
  };

  const handleThemeToggle = (themeCode: string) => {
    setSelectedThemes(prev =>
      prev.includes(themeCode)
        ? [] // 단일 선택으로 변경 (API 제약 및 Svelte 레퍼런스 준수)
        : [themeCode]
    );
  };

  const handleReset = () => {
    setSelectedGroup1(null);
    setSelectedGroup2(null);
    setSelectedCategories([]);
    setSelectedThemes([]);
    onReset();
  };

  const handleApply = () => {
    onApply({ 
      group1: selectedGroup1,
      group2: selectedGroup2,
      group3: null, // 상세 지역(dong)은 현재 지원하지 않으므로 null로 초기화
      categories: selectedCategories.length > 0 ? selectedCategories : null,
      theme_code: selectedThemes.length > 0 ? selectedThemes[0] : null,
      exclude_franchises: filters.exclude_franchises ?? true
    });
  };

  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent className="bg-white dark:bg-surface-900 border-t-2 border-[#2B4562]/10 shadow-none rounded-t-[32px] max-w-lg mx-auto h-[85vh]">
        {/* <div className="mx-auto mt-4 h-1.5 w-12 rounded-full bg-surface-200 dark:bg-surface-800" /> */}
        
        {/* Tabs */}
        <div className="px-4 mt-2">
          <div className="flex border-b-2 border-surface-100 dark:border-surface-800">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex-1 py-4 text-lg font-black transition-colors relative",
                    isActive 
                      ? "text-[#6366F1]" 
                      : "text-surface-400 hover:text-surface-600"
                  )}
                >
                  {tab.label}
                  {isActive && (
                    <div className="absolute bottom-[-2px] inset-x-0 h-[3px] bg-[#6366F1] rounded-t-full mx-8" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-8">
          {activeTab === "region" && (
            <RegionTab 
              selectedGroup1={selectedGroup1}
              selectedGroup2={selectedGroup2}
              onGroup1Select={handleGroup1Select}
              onGroup2Select={handleGroup2Select}
            />
          )}
          {activeTab === "category" && (
            <CategoryTab 
              selectedCategories={selectedCategories} 
              onToggle={handleCategoryToggle} 
            />
          )}
          {activeTab === "theme" && (
            <ThemeTab 
              selectedThemes={selectedThemes} 
              onToggle={handleThemeToggle} 
            />
          )}
        </div>

        {/* Footer Actions - Flat Vector Style */}
        <DrawerFooter className="p-6 border-t-2 border-surface-50 dark:border-surface-800 flex flex-row items-center gap-6 bg-white dark:bg-surface-900">
          <button
            onClick={handleReset}
            className="flex items-center gap-2 text-surface-400 font-black hover:text-[#2B4562] transition-colors group"
          >
            <RotateCcw className="size-5 transition-transform group-active:rotate-[-45deg]" />
            <span className="text-lg">초기화</span>
          </button>
          <Button
            onClick={handleApply}
            className="flex-1 bg-[#6366F1] hover:bg-[#5356E2] text-white font-black py-7 rounded-2xl text-xl border-b-4 border-[#5356E2] active:border-b-0 active:translate-y-[2px] transition-all shadow-none"
          >
            {/* {totalCount}개 장소 보기 */}
            필터 적용
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
