import { Bookmark } from "lucide-react";
import { useMySavedPlaces } from "@/entities/place/queries";
import { ProfilePlacesList } from "./ProfilePlacesList";

export function SavedPlacesTab() {
  const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } = useMySavedPlaces();
  const places = data?.pages.flatMap((page) => page) || [];

  return (
    <ProfilePlacesList
      data={places}
      isLoading={isLoading}
      isFetchingNextPage={isFetchingNextPage}
      hasNextPage={hasNextPage}
      fetchNextPage={fetchNextPage}
      emptyMessage="저장한 장소가 없습니다."
      emptyIcon={<Bookmark className="h-16 w-16" />}
    />
  );
}
