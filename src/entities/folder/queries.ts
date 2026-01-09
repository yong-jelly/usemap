import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { folderApi } from "./api";

export const folderKeys = {
  all: ["folder"] as const,
  list: (type: 'public' | 'my') => [...folderKeys.all, "list", type] as const,
  details: (id: string) => [...folderKeys.all, "details", id] as const,
  places: (id: string) => [...folderKeys.all, "places", id] as const,
  placesForMap: (id: string) => [...folderKeys.all, "placesForMap", id] as const,
  access: (id: string) => [...folderKeys.all, "access", id] as const,
  inviteHistory: (id: string) => [...folderKeys.all, "inviteHistory", id] as const,
  reviews: (folderId: string, placeId?: string) => 
    [...folderKeys.all, "reviews", folderId, placeId] as const,
};

/**
 * 공개 폴더 목록 무한 스크롤 조회
 */
export function usePublicFolders() {
  return useInfiniteQuery({
    queryKey: folderKeys.list('public'),
    queryFn: ({ pageParam = 0 }) => folderApi.listPublicFolders({ limit: 20, offset: pageParam }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage || lastPage.length < 20) return undefined;
      return allPages.length * 20;
    },
  });
}

/**
 * 내 폴더 목록 조회
 */
export function useMyFolders(params: { placeId?: string } = {}) {
  return useQuery({
    queryKey: [...folderKeys.list('my'), params.placeId],
    queryFn: () => folderApi.listMyFolders(params),
  });
}

/**
 * 내 구독 목록 조회
 */
export function useMySubscriptions() {
  return useQuery({
    queryKey: [...folderKeys.all, "subscriptions"],
    queryFn: () => folderApi.listMySubscriptions(),
  });
}

/**
 * 내 피드 무한 스크롤 조회
 */
export function useMyFeed(filters: { price_min?: number | null; price_max?: number | null } = {}) {
  return useInfiniteQuery({
    queryKey: [...folderKeys.all, "feed", filters],
    queryFn: ({ pageParam = 0 }) => folderApi.getMyFeed({ limit: 20, offset: pageParam, ...filters }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage || lastPage.length < 20) return undefined;
      return allPages.length * 20;
    },
  });
}

/**
 * 폴더 정보 조회 (단건)
 */
export function useFolderInfo(folderId: string) {
  return useQuery({
    queryKey: folderKeys.details(folderId),
    queryFn: () => folderApi.getFolderInfo(folderId),
    enabled: !!folderId,
  });
}

/**
 * 폴더 생성 Mutation
 */
export function useCreateFolder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: folderApi.createFolder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: folderKeys.list('my') });
    },
  });
}

/**
 * 폴더 구독 토글 Mutation
 */
export function useToggleFolderSubscription() {
  const queryClient = useQueryClient();
  const subscriptionKey = [...folderKeys.all, "subscriptions"];

  return useMutation({
    mutationFn: folderApi.toggleFolderSubscription,
    onSuccess: (result, folderId) => {
      // 성공 시: 캐시의 목록에서 해당 아이템의 구독 상태를 업데이트하거나 새로 추가 (낙관적 업데이트)
      queryClient.setQueryData<any[]>(subscriptionKey, (old) => {
        if (!old) return old;
        
        const exists = old.some(sub => sub.subscription_type === 'folder' && sub.feature_id === folderId);
        
        if (exists) {
          return old.map((sub) => 
            (sub.subscription_type === 'folder' && sub.feature_id === folderId)
              ? { ...sub, is_subscribed: result.is_subscribed }
              : sub
          );
        } else if (result.is_subscribed) {
          // 새로 구독한 경우 목록에 추가
          return [{
            subscription_type: 'folder',
            feature_id: folderId,
            is_subscribed: true,
            created_at: new Date().toISOString()
          }, ...old];
        }
        return old;
      });
      
      // 관련 쿼리 무효화 (폴더 상세 및 목록)
      queryClient.invalidateQueries({ queryKey: folderKeys.list('public') });
      queryClient.invalidateQueries({ queryKey: folderKeys.details(folderId) });
    },
  });
}

/**
 * 피쳐 구독 토글 Mutation
 */
export function useToggleFeatureSubscription() {
  const queryClient = useQueryClient();
  const subscriptionKey = [...folderKeys.all, "subscriptions"];

  return useMutation({
    mutationFn: folderApi.toggleFeatureSubscription,
    onSuccess: (result, { type, id }) => {
      // 성공 시: 캐시의 목록에서 해당 아이템의 구독 상태를 업데이트하거나 새로 추가 (낙관적 업데이트)
      queryClient.setQueryData<any[]>(subscriptionKey, (old) => {
        if (!old) return old;

        const exists = old.some(sub => sub.subscription_type === type && sub.feature_id === id);

        if (exists) {
          return old.map((sub) => 
            (sub.subscription_type === type && sub.feature_id === id)
              ? { ...sub, is_subscribed: result.is_subscribed }
              : sub
          );
        } else if (result.is_subscribed) {
          return [{
            subscription_type: type,
            feature_id: id,
            is_subscribed: true,
            created_at: new Date().toISOString()
          }, ...old];
        }
        return old;
      });
    },
  });
}

/**
 * 폴더에 장소 추가 Mutation
 */
export function useAddPlaceToFolder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: folderApi.addPlaceToFolder,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: folderKeys.places(variables.folderId) });
      queryClient.invalidateQueries({ queryKey: folderKeys.list('my') });
    },
  });
}

/**
 * 기본 폴더 생성 Mutation
 */
export function useEnsureDefaultFolder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: folderApi.ensureDefaultFolder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: folderKeys.list('my') });
    },
  });
}

/**
 * 폴더 내 장소 목록 무한 스크롤 조회
 */
export function useFolderPlaces(folderId: string) {
  return useInfiniteQuery({
    queryKey: folderKeys.places(folderId),
    queryFn: ({ pageParam = 0 }) => 
      folderApi.getFolderPlaces({ folderId, limit: 20, offset: pageParam }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage || lastPage.length < 20) return undefined;
      return allPages.length * 20;
    },
    enabled: !!folderId,
  });
}

/**
 * 폴더 접근 권한 체크
 */
export function useFolderAccess(folderId: string) {
  return useQuery({
    queryKey: folderKeys.access(folderId),
    queryFn: () => folderApi.checkFolderAccess(folderId),
    enabled: !!folderId,
  });
}

/**
 * 폴더에서 장소 제거 Mutation
 */
export function useRemovePlaceFromFolder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: folderApi.removePlaceFromFolder,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: folderKeys.places(variables.folderId) });
      queryClient.invalidateQueries({ queryKey: folderKeys.details(variables.folderId) });
      queryClient.invalidateQueries({ queryKey: folderKeys.list('my') });
    },
  });
}

/**
 * 초대 코드 재생성 Mutation
 */
export function useRegenerateInviteCode() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: folderApi.regenerateInviteCode,
    onSuccess: (_, folderId) => {
      queryClient.invalidateQueries({ queryKey: folderKeys.details(folderId) });
      queryClient.invalidateQueries({ queryKey: folderKeys.inviteHistory(folderId) });
    },
  });
}

/**
 * 초대 코드 검증 Mutation
 */
export function useVerifyInviteCode() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: folderApi.verifyInviteCode,
    onSuccess: (result) => {
      if (result?.folder_id) {
        queryClient.invalidateQueries({ queryKey: folderKeys.access(result.folder_id) });
        queryClient.invalidateQueries({ queryKey: folderKeys.details(result.folder_id) });
        queryClient.invalidateQueries({ queryKey: [...folderKeys.all, "subscriptions"] });
      }
    },
  });
}

/**
 * 초대 히스토리 조회
 */
export function useInviteHistory(folderId: string) {
  return useQuery({
    queryKey: folderKeys.inviteHistory(folderId),
    queryFn: () => folderApi.getInviteHistory(folderId),
    enabled: !!folderId,
  });
}

/**
 * 폴더 숨김 Mutation
 */
export function useHideFolder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: folderApi.hideFolder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: folderKeys.list('my') });
      queryClient.invalidateQueries({ queryKey: folderKeys.list('public') });
    },
  });
}

/**
 * 폴더 정보 업데이트 Mutation
 */
export function useUpdateFolder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: folderApi.updateFolder,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: folderKeys.details(variables.folderId) });
      queryClient.invalidateQueries({ queryKey: folderKeys.list('my') });
      queryClient.invalidateQueries({ queryKey: folderKeys.list('public') });
    },
  });
}

/**
 * 비공개 폴더 리뷰 작성/수정 Mutation
 */
export function useUpsertFolderReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: folderApi.upsertFolderReview,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: folderKeys.reviews(variables.folderId, variables.placeId) 
      });
      queryClient.invalidateQueries({ 
        queryKey: folderKeys.reviews(variables.folderId) 
      });
    },
  });
}

/**
 * 비공개 폴더 리뷰 조회
 */
export function useFolderReviews(folderId: string, placeId?: string) {
  return useQuery({
    queryKey: folderKeys.reviews(folderId, placeId),
    queryFn: () => folderApi.getFolderReviews({ folderId, placeId }),
    enabled: !!folderId,
  });
}

/**
 * 폴더 내 장소 지도용 경량 목록 조회 (전체, 버튼 클릭 시 수동 조회)
 */
export function useFolderPlacesForMap(folderId: string, enabled: boolean = false) {
  return useQuery({
    queryKey: folderKeys.placesForMap(folderId),
    queryFn: () => folderApi.getFolderPlacesForMap(folderId),
    enabled: !!folderId && enabled,
    staleTime: 1000 * 60 * 5, // 5분간 캐시 유지
  });
}
