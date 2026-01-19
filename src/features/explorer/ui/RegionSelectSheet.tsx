import React from "react";
import { 
  Drawer, 
  DrawerContent, 
  DrawerHeader, 
  DrawerTitle, 
  DrawerDescription
} from "@/shared/ui";
import { REGION_DATA } from "@/shared/config/filter-constants";
import { cn } from "@/shared/lib/utils";

interface RegionSelectSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (group1: string) => void;
  selectedGroup1: string | null;
}

/**
 * 시/도(group1) 선택용 바텀 시트
 * 네이버 히든아카이브 스타일의 지역 선택 UI
 */
export function RegionSelectSheet({ 
  isOpen, 
  onClose, 
  onSelect,
  selectedGroup1 
}: RegionSelectSheetProps) {
  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent className="bg-white dark:bg-surface-900 border-t-2 border-[#2B4562]/10 shadow-none rounded-t-[32px] max-w-lg mx-auto pb-10">
        <DrawerHeader className="px-6 pt-8 pb-4">
          <DrawerTitle className="text-left text-[19px] font-semibold text-surface-900 dark:text-white">지역 선택</DrawerTitle>
          <DrawerDescription className="text-left text-[14px] text-surface-500 dark:text-surface-400 mt-1">
            탐색하고 싶은 시/도를 선택해주세요.
          </DrawerDescription>
        </DrawerHeader>

        <div className="px-6 py-2">
          <div className="grid grid-cols-3 gap-3">
            {REGION_DATA.map((region) => {
              const isSelected = selectedGroup1 === region.group1;
              return (
                <button
                  key={region.group1}
                  onClick={() => {
                    onSelect(region.group1);
                    onClose();
                  }}
                  className={cn(
                    "py-4 rounded-2xl text-[15px] font-medium transition-all border-2 text-center",
                    isSelected 
                      ? "border-[#6366F1] bg-indigo-50/10 text-[#6366F1]" 
                      : "border-surface-100 dark:border-surface-800 text-surface-500 dark:text-surface-400 hover:border-surface-200 active:scale-[0.98]"
                  )}
                >
                  {region.group1}
                </button>
              );
            })}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
