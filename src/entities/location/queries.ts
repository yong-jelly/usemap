import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { locationApi } from "./api";

export const locationKeys = {
  all: ["location"] as const,
  list: () => [...locationKeys.all, "list"] as const,
};

/**
 * 사용자 위치 저장 Mutation
 */
export function useSaveLocation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: locationApi.saveUserLocation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: locationKeys.list() });
    },
  });
}

/**
 * 사용자 위치 목록 조회
 */
export function useUserLocations(
  params: { limit?: number } = {},
  options: { enabled?: boolean } = {}
) {
  return useQuery({
    queryKey: [...locationKeys.list(), params.limit],
    queryFn: () => locationApi.getUserLocations(params),
    ...options
  });
}

/**
 * 사용자 위치 삭제 Mutation
 */
export function useDeleteLocation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: locationApi.deleteUserLocation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: locationKeys.list() });
    },
  });
}
