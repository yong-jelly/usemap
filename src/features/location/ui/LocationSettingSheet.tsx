import React from "react";
import { 
  Drawer, 
  DrawerContent, 
  DrawerHeader, 
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose
} from "@/shared/ui/Drawer";
import { Button } from "@/shared/ui";
import { Navigation, Trash2, MapPin, Loader2 } from "lucide-react";
import { useUserLocations, useSaveLocation, useDeleteLocation } from "@/entities/location";
import { useUserStore } from "@/entities/user";
import { getCurrentLocation } from "@/shared/lib/location";
import { formatRelativeTime } from "@/shared/lib/utils";
import { toast } from "sonner";

import { LocationGuideBox } from "./LocationGuideBox";

interface LocationSettingSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (lat: number, lng: number, id: string) => void;
  selectedId?: string;
}

export function LocationSettingSheet({ 
  isOpen, 
  onClose, 
  onSelect,
  selectedId 
}: LocationSettingSheetProps) {
  const { isAuthenticated } = useUserStore();
  const { data: locations, isLoading: isLoadingList } = useUserLocations(
    {}, 
    { enabled: isOpen && isAuthenticated }
  );
  const saveLocationMutation = useSaveLocation();
  const deleteLocationMutation = useDeleteLocation();

  const handleSaveCurrentLocation = async () => {
    try {
      const pos = await getCurrentLocation();
      saveLocationMutation.mutate(
        { latitude: pos.latitude, longitude: pos.longitude },
        {
          onSuccess: (data) => {
            if (data) {
              // toast.success("현재 위치가 저장되었습니다.", { duration: 1000 });
              onSelect(pos.latitude, pos.longitude, data.id);
            }
          },
          onError: () => {
            toast.error("위치 저장 중 오류가 발생했습니다.", { duration: 1000 });
          }
        }
      );
    } catch (error: any) {
      toast.error(error.message || "위치 정보를 가져올 수 없습니다.", { duration: 1000 });
    }
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    deleteLocationMutation.mutate(id, {
      onSuccess: () => {
        // toast.success("위치 정보가 삭제되었습니다.", { duration: 1000 });
      }
    });
  };

  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent className="max-w-lg mx-auto">
        <DrawerHeader>
          <DrawerTitle className="text-left text-xl">위치 설정</DrawerTitle>
          <DrawerDescription className="text-left">
            거리순 정렬을 위해 위치 정보를 설정해주세요.
          </DrawerDescription>
        </DrawerHeader>

        <div className="px-4 py-2 space-y-6">
          {/* 가이드 메시지 영역 */}
          <LocationGuideBox 
            description={[
              "• 브라우저의 위치 권한 요청이 뜨면 '허용'을 눌러주세요.",
              "• 거리순 정렬은 저장된 위치 정보를 기반으로 계산됩니다."
            ]}
          />

          {/* 현재 위치 저장 버튼 */}
          <Button 
            onClick={handleSaveCurrentLocation}
            disabled={saveLocationMutation.isPending}
            className="w-full h-14 rounded-2xl text-base gap-2 shadow-sm"
          >
            {saveLocationMutation.isPending ? (
              <Loader2 className="size-5 animate-spin" />
            ) : (
              <Navigation className="size-5 fill-current" />
            )}
            현재 위치 저장 및 사용
          </Button>

          {/* 저장된 위치 목록 */}
          <div className="space-y-3">
            <h3 className="text-sm text-surface-500 px-1">최근 저장된 위치</h3>
            {isLoadingList ? (
              <div className="py-8 flex justify-center">
                <Loader2 className="size-6 text-surface-300 animate-spin" />
              </div>
            ) : locations && locations.length > 0 ? (
              <div className="space-y-2">
                {locations.map((loc) => (
                  <div 
                    key={loc.id}
                    onClick={() => onSelect(loc.latitude, loc.longitude, loc.id)}
                    className={`
                      w-full flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer active:scale-[0.98]
                      ${selectedId === loc.id 
                        ? "bg-primary-50 border-primary-200 dark:bg-primary-900/10 dark:border-primary-800" 
                        : "bg-white border-surface-100 dark:bg-surface-900 dark:border-surface-800"}
                    `}
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className={`size-10 rounded-full flex items-center justify-center shrink-0 ${selectedId === loc.id ? 'bg-primary-500 text-white' : 'bg-surface-100 text-surface-400 dark:bg-surface-800'}`}>
                        <MapPin className="size-5" />
                      </div>
                      <div className="text-left truncate">
                        <div className="text-sm text-surface-900 dark:text-white truncate">
                          {loc.nearest_place_name} 근처
                        </div>
                        <div className="text-[12px] text-surface-500 truncate">
                          {loc.nearest_place_address}
                        </div>
                        <div className="text-[10px] text-surface-400 mt-0.5">
                          {formatRelativeTime(loc.created_at)} 저장
                        </div>
                      </div>
                    </div>
                    <button 
                      onClick={(e) => handleDelete(e, loc.id)}
                      disabled={deleteLocationMutation.isPending}
                      className="p-2 text-surface-300 hover:text-rose-500 transition-colors"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-10 text-center text-surface-400 text-sm bg-surface-50 dark:bg-surface-900/50 rounded-2xl border border-dashed border-surface-200 dark:border-surface-800">
                저장된 위치 정보가 없습니다.
              </div>
            )}
          </div>
        </div>

        {/* <DrawerFooter className="pb-8">
          <DrawerClose asChild>
            <Button variant="outline" className="rounded-xl h-12">닫기</Button>
          </DrawerClose>
        </DrawerFooter> */}
      </DrawerContent>
    </Drawer>
  );
}
