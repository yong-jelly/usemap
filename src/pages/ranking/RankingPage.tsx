import { useState, useEffect } from "react";
import { DetailHeader } from "@/widgets/DetailHeader/DetailHeader";
import { ThemeSelector } from "./ui/ThemeSelector";
import { RegionSelector } from "./ui/RegionSelector";
import { RankingList, RankingPlace } from "./ui/RankingList";
import { supabase } from "@/shared/lib/supabase";
import { getThemeNameByCode } from "@/shared/config/filter-constants";

export function RankingPage() {
  const [selectedTheme, setSelectedTheme] = useState("food_good");
  const [selectedRegion, setSelectedRegion] = useState("전국");
  const [places, setPlaces] = useState<RankingPlace[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchRanking() {
      setIsLoading(true);
      try {
        // 1. 랭킹 데이터 가져오기
        let query = supabase
          .from("tbl_theme_top_places")
          .select("*")
          .eq("theme_code", selectedTheme)
          .order("count", { ascending: false })
          .limit(50);

        if (selectedRegion !== "전국") {
          query = query.eq("group1", selectedRegion);
        }

        const { data: rankingData, error: rankingError } = await query;

        if (rankingError) throw rankingError;
        if (!rankingData || rankingData.length === 0) {
          setPlaces([]);
          return;
        }

        // 2. 장소 상세 정보 가져오기
        const placeIds = rankingData.map((item) => item.place_id);
        const { data: placesData, error: placesError } = await supabase
          .from("tbl_place")
          .select("id, name, category, images, road_address")
          .in("id", placeIds);

        if (placesError) throw placesError;

        // 3. 데이터 병합
        const mergedData: RankingPlace[] = rankingData.map((rankItem) => {
          const placeDetail = placesData?.find((p) => p.id === rankItem.place_id);
          return {
            place_id: rankItem.place_id,
            name: placeDetail?.name || "알 수 없는 장소",
            region: rankItem.group1,
            votes: rankItem.count,
            category: placeDetail?.category || "",
            visitor_reviews_score: rankItem.visitor_reviews_score || 0,
            visitor_reviews_total: rankItem.visitor_reviews_total || 0,
            images: placeDetail?.images || [],
            road_address: placeDetail?.road_address || "",
          };
        });

        setPlaces(mergedData);
      } catch (error) {
        console.error("Failed to fetch ranking:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchRanking();
  }, [selectedTheme, selectedRegion]);

  return (
    <div className="min-h-dvh bg-surface-50 dark:bg-surface-950 pb-20">
      <DetailHeader 
        type="place" 
        title="테마 랭킹" 
        onBack={() => window.history.back()} 
      />
      
      <div className="bg-white dark:bg-surface-900 sticky top-0 z-20 shadow-sm">
        <ThemeSelector 
          selectedTheme={selectedTheme} 
          onSelectTheme={setSelectedTheme} 
        />
        <RegionSelector 
          selectedRegion={selectedRegion} 
          onSelectRegion={setSelectedRegion} 
        />
        
        <div className="px-4 py-3 bg-surface-50 dark:bg-surface-950 border-b border-surface-200 dark:border-surface-800 text-sm text-surface-500">
          <span className="font-bold text-primary-600">{getThemeNameByCode(selectedTheme)}</span>
          <span> 테마의 </span>
          <span className="font-bold text-surface-900 dark:text-surface-100">{selectedRegion}</span>
          <span> 랭킹입니다.</span>
        </div>
      </div>

      <div className="mt-2">
        <RankingList places={places} isLoading={isLoading} />
      </div>
    </div>
  );
}
