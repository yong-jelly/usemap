import { callSupabaseFunction } from "@/shared/api/edge-function";
import type { HomeDiscoverData } from "./types";

export const homeApi = {
  /**
   * 홈 화면 탐색 데이터 조회 (Edge Function)
   * UI 구성 및 테스트를 위해 /public/discover.json 목업 데이터를 사용합니다.
   * 최종적으로는 동일한 응답의 API를 사용할 예정입니다.
   */
  getHomeDiscoverData: async () => {
    // [개발용 목업] /public/discover.json 사용
    try {
      const response = await fetch('/discover.json');
      if (!response.ok) throw new Error('Failed to fetch discover.json');
      const data = await response.json();
      
      console.log("Home discover mock data received:", {
        popularPlaces: data?.popularPlaces?.length || 0,
        users: data?.users?.length || 0,
        publicFolders: data?.publicFolders?.length || 0,
      });
      
      return data as HomeDiscoverData;
    } catch (error) {
      console.error("Failed to fetch mock discover data:", error);
      
      // 폴백: 원래 API 호출 시도 (또는 null 반환)
      const result = await callSupabaseFunction<HomeDiscoverData>('get-home-discover', {
        method: 'POST',
      });

      if (result.error) {
        return null;
      }

      return result.results;
    }
  },
};
