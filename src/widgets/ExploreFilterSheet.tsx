import { useState, useRef, useEffect } from "react";
import { RotateCcw, X } from "lucide-react";
import { 
  Drawer, 
  DrawerContent, 
  DrawerHeader, 
  DrawerTitle, 
  DrawerDescription,
  DrawerFooter,
  Button 
} from "@/shared/ui";
import { cn } from "@/shared/lib/utils";
import { CategoryTab } from "./ExploreFilterSheet/CategoryTab";
import { RegionTab } from "./ExploreFilterSheet/RegionTab";
import { ThemeTab } from "./ExploreFilterSheet/ThemeTab";
import { PriceTab } from "./ExploreFilterSheet/PriceTab";
import { useUserLocations } from "@/entities/location";
import { useUserStore } from "@/entities/user";
import { LocationSettingSheet } from "@/features/location/ui/LocationSettingSheet";

interface ExploreFilterSheetProps {
  isOpen: boolean;
  onClose: () => void;
  filters: any;
  onApply: (filters: any) => void;
  onReset: () => void;
  totalCount: number;
  visibleTabs?: ("region" | "category" | "theme" | "price")[];
  onLocationSelect?: () => void;
}

export function ExploreFilterSheet({
  isOpen,
  onClose,
  filters,
  onApply,
  onReset,
  totalCount,
  visibleTabs = ["region", "category", "theme", "price"],
  onLocationSelect,
}: ExploreFilterSheetProps) {
  const [activeTab, setActiveTab] = useState(visibleTabs[0] || "category");
  const scrollRef = useRef<HTMLDivElement>(null);
  const [selectedGroup1, setSelectedGroup1] = useState<string | null>(filters.group1);
  const [selectedGroup2, setSelectedGroup2] = useState<string | null>(filters.group2);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(filters.categories || []);
  const [selectedThemes, setSelectedThemes] = useState<string[]>(filters.theme_codes || []);
  const [selectedPriceMin, setSelectedPriceMin] = useState<number | null>(filters.price_min || null);
  const [selectedPriceMax, setSelectedPriceMax] = useState<number | null>(filters.price_max || null);
  const [isLocationSheetOpen, setIsLocationSheetOpen] = useState(false);

  // 사용자 위치 데이터 조회
  const { isAuthenticated } = useUserStore();
  const { data: userLocations } = useUserLocations({}, { enabled: isOpen && isAuthenticated });
  const hasUserLocation = userLocations && userLocations.length > 0;

  // 탭 변경 시 상단 스크롤
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [activeTab]);

  const allTabs: { id: "region" | "category" | "theme" | "price"; label: string; count: number }[] = [
    { id: "region", label: "지역", count: (selectedGroup1 || selectedGroup2) ? 1 : 0 },
    { id: "category", label: "카테고리", count: selectedCategories.length },
    { id: "theme", label: "테마", count: selectedThemes.length },
    { id: "price", label: "가격", count: (selectedPriceMin !== null || selectedPriceMax !== null) ? 1 : 0 },
  ];

  const tabs = allTabs.filter(tab => visibleTabs.includes(tab.id as any));

  const isResetEnabled = selectedGroup1 !== null || 
    (selectedGroup2 !== null && selectedGroup2 !== "전체") || 
    selectedCategories.length > 0 || 
    selectedThemes.length > 0 ||
    selectedPriceMin !== null ||
    selectedPriceMax !== null;

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
    setSelectedThemes(prev => {
      if (prev.includes(themeCode)) {
        return prev.filter(t => t !== themeCode);
      }
      if (prev.length >= 3) {
        return prev;
      }
      return [...prev, themeCode];
    });
  };

  const handleReset = () => {
    setSelectedGroup1(null);
    setSelectedGroup2(null);
    setSelectedCategories([]);
    setSelectedThemes([]);
    setSelectedPriceMin(null);
    setSelectedPriceMax(null);
    onReset();
  };

  const handleApply = () => {
    onApply({ 
      group1: selectedGroup1,
      group2: selectedGroup2 === "전체" ? null : selectedGroup2,
      group3: null, // 상세 지역(dong)은 현재 지원하지 않으므로 null로 초기화
      categories: selectedCategories,
      theme_codes: selectedThemes,
      price_min: selectedPriceMin,
      price_max: selectedPriceMax,
      exclude_franchises: filters.exclude_franchises ?? true
    });
  };

  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent className="bg-white dark:bg-surface-900 border-t-2 border-[#2B4562]/10 shadow-none rounded-t-[32px] max-w-lg mx-auto h-[85vh]">
        <DrawerHeader className="sr-only">
          <DrawerTitle>필터 설정</DrawerTitle>
          <DrawerDescription>지역, 카테고리, 테마, 가격 등 맛집 검색 필터를 설정하세요.</DrawerDescription>
        </DrawerHeader>
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
                    "flex-1 py-4 text-lg font-medium transition-colors relative flex items-center justify-center gap-1.5",
                    isActive 
                      ? "text-[#6366F1]" 
                      : "text-surface-400 hover:text-surface-600"
                  )}
                >
                  {tab.label}
                  {tab.count > 0 && (
                    <span className={cn(
                      "flex items-center justify-center size-5 rounded-full text-[11px] font-medium transition-colors",
                      isActive ? "bg-[#6366F1] text-white" : "bg-surface-100 text-surface-400"
                    )}>
                      {tab.count}
                    </span>
                  )}
                  {isActive && (
                    <div className="absolute bottom-[-2px] inset-x-0 h-[3px] bg-[#6366F1] rounded-t-full mx-8" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-8">
          {activeTab === "region" && (
            <RegionTab 
              selectedGroup1={selectedGroup1}
              selectedGroup2={selectedGroup2}
              onGroup1Select={handleGroup1Select}
              onGroup2Select={handleGroup2Select}
              hasUserLocation={hasUserLocation}
              onLocationSettingClick={() => setIsLocationSheetOpen(true)}
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
          {activeTab === "price" && (
            <PriceTab 
              selectedMin={selectedPriceMin}
              selectedMax={selectedPriceMax}
              onSelect={(min, max) => {
                setSelectedPriceMin(min);
                setSelectedPriceMax(max);
              }}
            />
          )}
        </div>

        {/* Footer Actions */}
        <DrawerFooter className="p-6 border-t-2 border-surface-50 dark:border-surface-800 flex flex-row items-center gap-3 bg-white dark:bg-surface-900">
          <Button
            onClick={handleReset}
            disabled={!isResetEnabled}
            variant="outline"
            className={cn(
              "flex-1 py-6 rounded-2xl text-lg font-medium transition-all",
              isResetEnabled 
                ? "border-surface-200 text-surface-600 hover:bg-surface-50" 
                : "border-surface-100 text-surface-300 cursor-not-allowed"
            )}
          >
            <RotateCcw className="size-4 mr-2" />
            초기화
          </Button>
          <Button
            onClick={handleApply}
            className="flex-1 bg-[#6366F1] hover:bg-[#5356E2] text-white font-medium py-6 rounded-2xl text-lg transition-all shadow-none"
          >
            필터 적용
          </Button>
        </DrawerFooter>
      </DrawerContent>

      {/* 위치 설정 바텀 시트 */}
      <LocationSettingSheet
        isOpen={isLocationSheetOpen}
        onClose={() => setIsLocationSheetOpen(false)}
        onSelect={() => setIsLocationSheetOpen(false)}
      />
    </Drawer>
  );
}
