import { callSupabaseFunction } from "@/shared/api/edge-function";
import type { HomeDiscoverData } from "./types";

export const homeApi = {
  /**
   * 홈 화면 탐색 데이터 조회 (Edge Function)
   */
  getHomeDiscoverData: async () => {
    const result = await callSupabaseFunction<HomeDiscoverData>('get-home-discover', {
      method: 'POST',
    });

    if (result.error) {
      console.error("Failed to fetch home discover data:", result.results);
      return null;
    }

    return result.results;
  },
};
