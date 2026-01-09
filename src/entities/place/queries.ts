import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { placeApi } from "./api";

/**
 * 장소 관련 React Query 키 정의
 */
export const placeKeys = {
  all: ["place"] as const,
  details: (id: string) => [...placeKeys.all, "details", id] as const,
  reviews: (id: string) => [...placeKeys.all, "reviews", id] as const,
  analysis: (id: string) => [...placeKeys.all, "analysis", id] as const,
  userReviews: (id: string) => [...placeKeys.all, "userReviews", id] as const,
  features: (id: string) => [...placeKeys.all, "features", id] as const,
  list: (tab: string, group1?: string | null) => [...placeKeys.all, "list", tab, group1] as const,
  filters: (filters: any) => [...placeKeys.all, "filters", filters] as const,
  naverFolders: () => [...placeKeys.all, "naverFolders"] as const,
  youtubeChannels: () => [...placeKeys.all, "youtubeChannels"] as const,
  mySaved: () => [...placeKeys.all, "mySaved"] as const,
  myRecent: () => [...placeKeys.all, "myRecent"] as const,
  myLiked: () => [...placeKeys.all, "myLiked"] as const,
  myVisited: () => [...placeKeys.all, "myVisited"] as const,
  communityContents: (filters: any) => [...placeKeys.all, "communityContents", filters] as const,
  featurePlaces: (type: string, id: string, domain?: string | null) => [...placeKeys.all, "featurePlaces", type, id, domain] as const,
  featureInfo: (type: string, id: string) => [...placeKeys.all, "featureInfo", type, id] as const,
  featurePlacesForMap: (type: string, id: string, domain?: string | null) => [...placeKeys.all, "featurePlacesForMap", type, id, domain] as const,
};

/**
 * 특정 장소의 상세 정보를 조회하는 Hook
 * @deprecated usePlaceByIdWithRecentView 사용 권장
 */
export function usePlaceDetails(id: string) {
  return useQuery({
    queryKey: placeKeys.details(id),
    queryFn: () => placeApi.getDetails(id),
    enabled: !!id,
  });
}

/**
 * ID 기반 장소 상세 데이터 조회 및 최근 본 장소 기록 Hook
 */
export function usePlaceByIdWithRecentView(id: string) {
  return useQuery({
    queryKey: placeKeys.details(id),
    queryFn: () => placeApi.getPlaceByIdWithRecentView(id),
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
 * 특정 장소의 사용자 리뷰 목록을 조회하는 Hook
 */
export function usePlaceUserReviews(id: string, limit?: number) {
  return useQuery({
    queryKey: placeKeys.userReviews(id),
    queryFn: () => placeApi.getUserReviews(id, limit),
    enabled: !!id,
  });
}

/**
 * 특정 장소의 특징(유튜브, 커뮤니티 등) 목록을 조회하는 Hook
 */
export function usePlaceFeatures(id: string) {
  return useQuery({
    queryKey: placeKeys.features(id),
    queryFn: () => placeApi.getPlaceFeatures(id),
    enabled: !!id,
  });
}

/**
 * 사용자 리뷰 저장 Mutation Hook
 */
export function useUpsertUserReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: placeApi.upsertUserReview,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: placeKeys.userReviews(variables.p_place_id) });
      queryClient.invalidateQueries({ queryKey: placeKeys.details(variables.p_place_id) });
    },
  });
}

/**
 * 사용자 리뷰 삭제 Mutation Hook
 */
export function useDeleteUserReview(placeId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: placeApi.deleteUserReview,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: placeKeys.userReviews(placeId) });
      queryClient.invalidateQueries({ queryKey: placeKeys.details(placeId) });
    },
  });
}

/**
 * 장소 특징 저장 Mutation Hook
 */
export function useUpsertPlaceFeature() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: placeApi.upsertPlaceFeature,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: placeKeys.features(variables.p_business_id) });
    },
  });
}

/**
 * 장소 특징 삭제 Mutation Hook
 */
export function useDeletePlaceFeature(placeId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: placeApi.deletePlaceFeature,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: placeKeys.features(placeId) });
    },
  });
}

/**
 * 좋아요 상태 토글 Mutation Hook
 */
export function useToggleLike() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: placeApi.toggleLike,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: placeKeys.details(variables.likedId) });
    },
  });
}

/**
 * 저장 상태 토글 Mutation Hook
 */
export function useToggleSave() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: placeApi.toggleSave,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: placeKeys.details(variables.savedId) });
    },
  });
}

/**
 * 방문 기록 토글 Mutation Hook
 */
export function useToggleVisited() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: placeApi.toggleVisited,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: placeKeys.details(variables.placeId) });
    },
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

/**
 * 내가 저장한 장소 목록을 무한 스크롤로 조회하는 Hook
 */
export function useMySavedPlaces() {
  return useInfiniteQuery({
    queryKey: placeKeys.mySaved(),
    queryFn: ({ pageParam = 0 }) => placeApi.getMyBookmarkedPlaces(21, pageParam),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage || lastPage.length < 21) return undefined;
      return allPages.length * 21;
    },
  });
}

/**
 * 내가 최근 본 장소 목록을 무한 스크롤로 조회하는 Hook
 */
export function useMyRecentPlaces() {
  return useInfiniteQuery({
    queryKey: placeKeys.myRecent(),
    queryFn: ({ pageParam = 0 }) => placeApi.getMyRecentViewPlaces(21, pageParam),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage || lastPage.length < 21) return undefined;
      return allPages.length * 21;
    },
  });
}

/**
 * 내가 좋아요 누른 장소 목록을 무한 스크롤로 조회하는 Hook
 */
export function useMyLikedPlaces() {
  return useInfiniteQuery({
    queryKey: placeKeys.myLiked(),
    queryFn: ({ pageParam = 0 }) => placeApi.getMyLikedPlaces(21, pageParam),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage || lastPage.length < 21) return undefined;
      return allPages.length * 21;
    },
  });
}

/**
 * 내가 방문한 장소 목록을 무한 스크롤로 조회하는 Hook
 */
export function useMyVisitedPlaces() {
  return useInfiniteQuery({
    queryKey: placeKeys.myVisited(),
    queryFn: ({ pageParam = 0 }) => placeApi.getMyVisitedPlaces(21, pageParam),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage || lastPage.length < 21) return undefined;
      return allPages.length * 21;
    },
  });
}

/**
 * 커뮤니티 게시글 목록을 지역별로 무한 스크롤 조회하는 Hook
 */
export function useCommunityContents(filters: { domain?: string | null }) {
  return useInfiniteQuery({
    queryKey: placeKeys.communityContents(filters),
    queryFn: ({ pageParam = 0 }) => placeApi.getCommunityContents({
      domain: filters.domain,
      limit: 20,
      offset: pageParam,
    }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage || lastPage.length < 20) return undefined;
      return allPages.length * 20;
    },
  });
}

/**
 * 피쳐별 상세 장소 목록을 무한 스크롤로 조회하는 Hook
 */
export function useFeaturePlaces(params: { 
  type: 'folder' | 'youtube' | 'community';
  id: string;
  domain?: string | null;
}) {
  return useInfiniteQuery({
    queryKey: placeKeys.featurePlaces(params.type, params.id, params.domain),
    queryFn: ({ pageParam = 0 }) => {
      const limit = 20;
      switch (params.type) {
        case 'folder':
          return placeApi.getPlacesByNaverFolder({ folderId: params.id, limit, offset: pageParam });
        case 'youtube':
          return placeApi.getPlacesByYoutubeChannel({ channelId: params.id, limit, offset: pageParam });
        case 'community':
          return placeApi.getPlacesByCommunityRegion({ regionName: params.id, domain: params.domain, limit, offset: pageParam });
      }
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage || lastPage.length < 20) return undefined;
      return allPages.length * 20;
    },
    enabled: !!params.id,
  });
}

/**
 * 피쳐 정보(폴더명, 채널명 등)를 조회하는 Hook
 */
export function useFeatureInfo(params: { type: 'folder' | 'youtube' | 'community'; id: string }) {
  return useQuery({
    queryKey: placeKeys.featureInfo(params.type, params.id),
    queryFn: () => {
      switch (params.type) {
        case 'folder':
          return placeApi.getNaverFolderInfo(params.id);
        case 'youtube':
          return placeApi.getYoutubeChannelInfo(params.id);
        case 'community':
          return Promise.resolve({ name: params.id }); // 지역명 자체가 정보
      }
    },
    enabled: !!params.id,
  });
}

/**
 * 피쳐별 지도용 전체 장소 목록을 조회하는 Hook (버튼 클릭 시 수동 조회)
 */
export function useFeaturePlacesForMap(params: { 
  type: 'folder' | 'youtube' | 'community';
  id: string;
  domain?: string | null;
  enabled?: boolean;
}) {
  return useQuery({
    queryKey: placeKeys.featurePlacesForMap(params.type, params.id, params.domain),
    queryFn: () => {
      switch (params.type) {
        case 'folder':
          return placeApi.getPlacesByNaverFolderForMap(params.id);
        case 'youtube':
          return placeApi.getPlacesByYoutubeChannelForMap(params.id);
        case 'community':
          return placeApi.getPlacesByCommunityRegionForMap({ regionName: params.id, domain: params.domain });
      }
    },
    enabled: !!params.id && (params.enabled ?? false),
    staleTime: 1000 * 60 * 5, // 5분간 캐시 유지
  });
}
