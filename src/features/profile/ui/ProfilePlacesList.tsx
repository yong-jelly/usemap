import { useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";
import { PlaceCard } from "@/widgets/PlaceCard";

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
        <p className="mt-4 text-sm text-gray-500">목록을 불러오는 중...</p>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center text-gray-500">
        <div className="mb-4 text-gray-300 dark:text-gray-600">{emptyIcon}</div>
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl bg-gray-50 dark:bg-neutral-900">
      <div className="grid">
        {data.map((place, index) => (
          <PlaceCard key={`${place.id}-${index}`} place={place} />
        ))}
      </div>
      
      {hasNextPage && (
        <div ref={observerTarget} className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary-500" />
        </div>
      )}
    </div>
  );
}
