import { useUserPlacesStats, useUserReviewAnalysis } from "@/entities/user/queries";
import { usePlacePopup } from "@/shared/lib/place-popup";
import { MyPreferencesChart } from "./MyPreferencesChart";
import { MyVisitRatioCard } from "./MyVisitRatioCard";
import { MyReviewsAnalysisCard } from "./MyReviewsAnalysisCard";
import { Loader2 } from "lucide-react";

export function AnalysisTab() {
  const { data: placesStats, isLoading: isPlacesLoading } = useUserPlacesStats();
  const { data: reviewAnalysis, isLoading: isReviewLoading } = useUserReviewAnalysis();
  const { show: showPlaceModal } = usePlacePopup();

  if (isPlacesLoading || isReviewLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-4 space-y-3">
      <MyPreferencesChart bucket={placesStats} />
      <MyVisitRatioCard bucket={placesStats} />
      <MyReviewsAnalysisCard 
        data={reviewAnalysis} 
        onPlaceClick={showPlaceModal} 
      />
    </div>
  );
}
