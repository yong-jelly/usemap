import { useUserPlacesStats } from "@/entities/user/queries";
import { Loader2 } from "lucide-react";
import { useMemo } from "react";

export function ProfileStatsSection() {
  const { data: placesStats, isLoading } = useUserPlacesStats();

  const stats = useMemo(() => {
    if (!placesStats?.bucket_data_jsonb?.v1_aggr_user_places_region_stats) {
      return { liked: 0, saved: 0, visited: 0 };
    }

    const regionStats = placesStats.bucket_data_jsonb.v1_aggr_user_places_region_stats;
    
    return regionStats.reduce(
      (acc, curr) => ({
        liked: acc.liked + (curr.liked || 0),
        saved: acc.saved + (curr.saved || 0),
        visited: acc.visited + (curr.visited || 0),
      }),
      { liked: 0, saved: 0, visited: 0 }
    );
  }, [placesStats]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-6">
        <Loader2 className="h-5 w-5 animate-spin text-surface-300" />
      </div>
    );
  }

  return (
    <div className="px-5 py-2">
      <div className="flex items-center justify-around py-6 bg-surface-50 dark:bg-surface-800/50 rounded-2xl border border-surface-100 dark:border-surface-800">
        <div className="flex flex-col items-center gap-1 flex-1">
          <span className="text-xl font-medium text-surface-900 dark:text-white">{stats.liked}</span>
          <span className="text-[13px] font-medium text-surface-500 dark:text-surface-400">찜했어요</span>
        </div>
        <div className="w-[1px] h-8 bg-surface-200 dark:bg-surface-700" />
        <div className="flex flex-col items-center gap-1 flex-1">
          <span className="text-xl font-medium text-surface-900 dark:text-white">{stats.saved}</span>
          <span className="text-[13px] font-medium text-surface-500 dark:text-surface-400">보는중</span>
        </div>
        <div className="w-[1px] h-8 bg-surface-200 dark:bg-surface-700" />
        <div className="flex flex-col items-center gap-1 flex-1">
          <span className="text-xl font-medium text-surface-900 dark:text-white">{stats.visited}</span>
          <span className="text-[13px] font-medium text-surface-500 dark:text-surface-400">봤어요</span>
        </div>
      </div>
    </div>
  );
}
