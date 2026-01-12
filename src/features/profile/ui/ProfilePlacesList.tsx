import React, { useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";
import { usePlacePopup } from "@/shared/lib/place-popup";
import { PlaceThumbnail } from "@/shared/ui/place/PlaceThumbnail";

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
        {data.map((item, index) => {
          // unified place_data 구조 지원
          const place = item.place_data || item;
          const placeId = item.place_id || place.id;
          const images = place.images || place.image_urls || (place.thumbnail ? [place.thumbnail] : []);
          
          return (
            <PlaceThumbnail
              key={`${placeId}-${index}`}
              placeId={placeId}
              name={place.name}
              thumbnail={images[0]}
              group2={place.group2}
              group3={place.group3}
              category={place.category}
              features={place.features}
              interaction={place.interaction}
              onClick={showPlaceModal}
            />
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
