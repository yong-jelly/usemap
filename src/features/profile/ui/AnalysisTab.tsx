import { useUserPlacesStats, useUserReviewAnalysis } from "@/entities/user/queries";
import { usePlacePopup } from "@/shared/lib/place-popup";
import { MyPreferencesChart } from "./MyPreferencesChart";
import { MyVisitRatioCard } from "./MyVisitRatioCard";
import { MyReviewsAnalysisCard } from "./MyReviewsAnalysisCard";
import { RevisitAnalysisCard } from "./RevisitAnalysisCard";
import { Loader2 } from "lucide-react";

export function AnalysisTab() {
  const { data: placesStats, isLoading: isPlacesLoading } = useUserPlacesStats();
  const { data: reviewAnalysis, isLoading: isReviewLoading } = useUserReviewAnalysis();
  const { show: showPlaceModal } = usePlacePopup();

  if (isPlacesLoading || isReviewLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center bg-white dark:bg-surface-950">
        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-surface-950 px-4 py-4 space-y-4">
      {/* 취향 분석 */}
      <MyPreferencesChart bucket={placesStats} />
      
      {/* 방문 실행력 */}
      <MyVisitRatioCard bucket={placesStats} />
      
      {/* 재방문 분석 */}
      <RevisitAnalysisCard 
        data={reviewAnalysis?.revisit_analysis} 
        onPlaceClick={showPlaceModal} 
      />
      
      {/* 리뷰 분석 */}
      <MyReviewsAnalysisCard 
        data={reviewAnalysis} 
        onPlaceClick={showPlaceModal} 
      />
    </div>
  );
}
