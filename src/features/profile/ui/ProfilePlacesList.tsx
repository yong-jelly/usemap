import React, { useEffect, useRef } from "react";
import { Loader2, SquareX } from "lucide-react";
import { usePlacePopup } from "@/shared/lib/place-popup";
import { convertToNaverResizeImageUrl, cn } from "@/shared/lib";

interface ProfilePlacesListProps {
  data: any[];
  isLoading: boolean;
  isFetchingNextPage?: boolean;
  hasNextPage?: boolean;
  fetchNextPage: () => void;
  emptyMessage: string;
  emptyIcon: React.ReactNode;
}

export function ProfilePlacesList({
  data,
  isLoading,
  isFetchingNextPage,
  hasNextPage,
  fetchNextPage,
  emptyMessage,
  emptyIcon,
}: ProfilePlacesListProps) {
  const { show: showPlaceModal } = usePlacePopup();
  const observerTarget = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!hasNextPage || isFetchingNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          fetchNextPage();
        }
      },
      { 
        threshold: 0,
        rootMargin: '200px'
      }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (isLoading && data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
        <p className="mt-4 text-sm text-surface-500">목록을 불러오는 중...</p>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center text-surface-500">
        <div className="mb-4 text-surface-300 dark:text-surface-700">{emptyIcon}</div>
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto bg-white dark:bg-surface-950">
      <div className="grid grid-cols-3 gap-0.5">
        {data.map((place, index) => {
          const folders = (place.features || []).filter((f: any) => f.platform_type === "folder");
          const images = place.images || place.image_urls || (place.thumbnail ? [place.thumbnail] : []);
          const hasImage = images && images.length > 0;
          
          return (
            <div 
              key={`${place.id}-${index}`} 
              className="relative aspect-[3/4] bg-surface-100 dark:bg-surface-900 overflow-hidden active:opacity-80 transition-opacity cursor-pointer group flex items-center justify-center"
              onClick={() => showPlaceModal(place.id)}
            >
              {hasImage ? (
                <img 
                  src={convertToNaverResizeImageUrl(images[0])} 
                  className="w-full h-full object-cover"
                  alt={place.name}
                  loading="lazy"
                  decoding="async"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-surface-300 dark:text-surface-700">
                  <SquareX className="size-10 stroke-[1.5]" />
                </div>
              )}
              
              {/* 상단 우측 폴더 갯수 표시 */}
              {folders.length > 0 && (
                <div className="absolute top-1.5 right-1.5 z-10">
                  <span className="flex items-center justify-center min-w-[16px] h-[16px] px-1 bg-[#1E8449] text-white text-[9px] font-black rounded-sm shadow-sm">
                    {folders.length}
                  </span>
                </div>
              )}

              {/* 하단 정보 오버레이 */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2 flex flex-col gap-0.5">
                <span className="text-[10px] text-white/80 font-bold truncate block">
                  {place.group2} {place.group3}
                </span>
                <div className="relative inline-block w-fit max-w-full">
                  <span className="text-[12px] text-white font-black truncate block leading-tight">
                    {place.name}
                  </span>
                  {/* 폴더 갯수에 따른 녹색선 */}
                  {folders.length > 0 && (
                    <div 
                      className={cn(
                        "absolute -bottom-0.5 left-0 w-full rounded-full",
                        folders.length >= 15 ? "h-[2px] bg-[#1E8449]" :
                        folders.length >= 12 ? "h-[1.8px] bg-[#229954]" :
                        folders.length >= 9 ? "h-[1.5px] bg-[#27AE60]" :
                        folders.length >= 6 ? "h-[1.2px] bg-[#2ECC71]" :
                        folders.length >= 3 ? "h-[1px] bg-[#52BE80]" :
                        "h-[0.8px] bg-[#ABEBC6]"
                      )} 
                    />
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {hasNextPage && (
        <div ref={observerTarget} className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary-500" />
        </div>
      )}
    </div>
  );
}
