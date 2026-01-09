import { CheckCircle } from "lucide-react";
import { useMyVisitedPlaces } from "@/entities/place/queries";
import { ProfilePlacesList } from "./ProfilePlacesList";

export function VisitedPlacesTab() {
  const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } = useMyVisitedPlaces();
  const places = data?.pages.flatMap((page) => page) || [];

  return (
    <ProfilePlacesList
      data={places}
      isLoading={isLoading}
      isFetchingNextPage={isFetchingNextPage}
      hasNextPage={hasNextPage}
      fetchNextPage={fetchNextPage}
      emptyMessage="방문한 장소가 없습니다."
      emptyIcon={<CheckCircle className="h-16 w-16" />}
      imageAspectRatio="aspect-[3/4]"
      imageWidth="w-36"
    />
  );
}
