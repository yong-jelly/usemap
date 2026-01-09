import { Heart } from "lucide-react";
import { useMyLikedPlaces } from "@/entities/place/queries";
import { ProfilePlacesList } from "./ProfilePlacesList";

export function LikedPlacesTab() {
  const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } = useMyLikedPlaces();
  const places = data?.pages.flatMap((page) => page) || [];

  return (
    <ProfilePlacesList
      data={places}
      isLoading={isLoading}
      isFetchingNextPage={isFetchingNextPage}
      hasNextPage={hasNextPage}
      fetchNextPage={fetchNextPage}
      emptyMessage="좋아요한 장소가 없습니다."
      emptyIcon={<Heart className="h-16 w-16" />}
      imageAspectRatio="aspect-[3/4]"
      imageWidth="w-36"
    />
  );
}
