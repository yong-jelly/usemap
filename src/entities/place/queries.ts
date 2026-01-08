import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { placeApi } from "./api";

/**
 * 장소 관련 React Query 키 정의
 */
export const placeKeys = {
  all: ["place"] as const,
  details: (id: string) => [...placeKeys.all, "details", id] as const,
  reviews: (id: string) => [...placeKeys.all, "reviews", id] as const,
  analysis: (id: string) => [...placeKeys.all, "analysis", id] as const,
  list: (tab: string, group1?: string | null) => [...placeKeys.all, "list", tab, group1] as const,
  filters: (filters: any) => [...placeKeys.all, "filters", filters] as const,
  naverFolders: () => [...placeKeys.all, "naverFolders"] as const,
  youtubeChannels: () => [...placeKeys.all, "youtubeChannels"] as const,
};

/**
 * 특정 장소의 상세 정보를 조회하는 Hook
 */
export function usePlaceDetails(id: string) {
  return useQuery({
    queryKey: placeKeys.details(id),
    queryFn: () => placeApi.getDetails(id),
    enabled: !!id,
  });
}

/**
 * 특정 장소의 리뷰 목록을 조회하는 Hook
 */
export function usePlaceReviews(id: string, limit?: number) {
  return useQuery({
    queryKey: placeKeys.reviews(id),
    queryFn: () => placeApi.getReviews(id, limit),
    enabled: !!id,
  });
}

/**
 * 네이버 폴더 목록을 무한 스크롤로 조회하는 Hook
 */
export function useNaverFolders() {
  return useInfiniteQuery({
    queryKey: placeKeys.naverFolders(),
    queryFn: ({ pageParam = 0 }) => placeApi.getNaverFolders(20, pageParam),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage || lastPage.length < 20) return undefined;
      return allPages.length * 20;
    },
  });
}

/**
 * 유튜브 채널 목록을 무한 스크롤로 조회하는 Hook
 */
export function useYoutubeChannels() {
  return useInfiniteQuery({
    queryKey: placeKeys.youtubeChannels(),
    queryFn: ({ pageParam = 0 }) => placeApi.getYoutubeChannels(20, pageParam),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage || lastPage.length < 20) return undefined;
      return allPages.length * 20;
    },
  });
}

/**
 * 탭별 장소 목록을 무한 스크롤로 조회하는 Hook
 */
export function usePlacesByTab(tabName: string, group1: string | null = null) {
  return useInfiniteQuery({
    queryKey: placeKeys.list(tabName, group1),
    queryFn: ({ pageParam = 0 }) => 
      placeApi.listByTab({ 
        tabName, 
        offset: pageParam, 
        limit: 21, 
        group1 
      }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      // 마지막 페이지의 데이터 개수가 limit보다 적으면 다음 페이지가 없는 것으로 간주
      if (lastPage.length < 21) return undefined;
      return allPages.length * 21;
    },
  });
}

/**
 * 필터별 장소 목록을 무한 스크롤로 조회하는 Hook
 */
export function usePlacesByFilters(filters: any) {
  return useInfiniteQuery({
    queryKey: placeKeys.filters(filters),
    queryFn: ({ pageParam = 0 }) => 
      placeApi.listByFilters({ 
        ...filters,
        offset: pageParam, 
        limit: 21,
        image_limit: 5,
      }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length < 21) return undefined;
      return allPages.length * 21;
    },
  });
}
