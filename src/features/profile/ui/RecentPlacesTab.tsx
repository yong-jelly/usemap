import { Clock } from "lucide-react";
import { useMyRecentPlaces } from "@/entities/place/queries";
import { ProfilePlacesList } from "./ProfilePlacesList";

export function RecentPlacesTab() {
  const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } = useMyRecentPlaces();
  const places = data?.pages.flatMap((page) => page) || [];

  return (
    <ProfilePlacesList
      data={places}
      isLoading={isLoading}
      isFetchingNextPage={isFetchingNextPage}
      hasNextPage={hasNextPage}
      fetchNextPage={fetchNextPage}
      emptyMessage="최근 본 장소가 없습니다."
      emptyIcon={<Clock className="h-16 w-16" />}
      imageAspectRatio="aspect-[3/4]"
      imageWidth="w-36"
    />
  );
}
