import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { userApi, type ProfileUpdateData } from "./api";
import { useUserStore } from "./index";
import { supabase } from "@/shared/lib/supabase";
import type { UserPlacesStatsBucket, UserReviewAnalysisData } from "./types";

export const userKeys = {
  all: ["user"] as const,
  profile: () => [...userKeys.all, "profile"] as const,
  subscribers: () => [...userKeys.all, "subscribers"] as const,
  placesStats: (recreation: boolean) => [...userKeys.all, "placesStats", recreation] as const,
  reviewAnalysis: () => [...userKeys.all, "reviewAnalysis"] as const,
};

/**
 * 현재 사용자의 프로필 정보를 조회하는 Hook
 */
export function useUserProfile() {
  const { profile: storeProfile, setProfile } = useUserStore();
  
  return useQuery({
    queryKey: userKeys.profile(),
    queryFn: async () => {
      const profile = await userApi.getCurrentProfile();
      if (profile) {
        setProfile(profile);
      }
      return profile;
    },
    initialData: storeProfile || undefined,
  });
}

/**
 * 프로필 정보를 업데이트하거나 신규 생성하는 Hook (v2)
 */
export function useUpsertProfile() {
  const queryClient = useQueryClient();
  const { setProfile } = useUserStore();

  return useMutation({
    mutationFn: (data: Partial<ProfileUpdateData> & { email?: string }) => userApi.upsertProfile(data),
    onSuccess: (result) => {
      if (result.success && result.profile) {
        setProfile(result.profile);
        queryClient.invalidateQueries({ queryKey: userKeys.profile() });
      }
    },
  });
}

/**
 * 프로필 정보를 업데이트하는 Hook
 */
export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const { setProfile } = useUserStore();

  return useMutation({
    mutationFn: (data: ProfileUpdateData) => userApi.updateProfile(data),
    onSuccess: (result) => {
      if (result.success && result.profile) {
        setProfile(result.profile);
        queryClient.invalidateQueries({ queryKey: userKeys.profile() });
      }
    },
  });
}

/**
 * 로그아웃 처리를 위한 Hook
 */
export function useLogout() {
  const queryClient = useQueryClient();
  const logout = useUserStore((state) => state.logout);

  return useMutation({
    mutationFn: () => logout(),
    onSuccess: () => {
      queryClient.clear();
      window.location.href = "/";
    },
  });
}

/**
 * 내 구독자 목록을 조회하는 Hook
 */
export function useMySubscribers() {
  return useQuery({
    queryKey: userKeys.subscribers(),
    queryFn: () => userApi.getMySubscribers(),
  });
}

// 사용자 장소 통계 (지역별/카테고리별 선호도, 방문 실행력)
export function useUserPlacesStats(recreation = false) {
  return useQuery({
    queryKey: userKeys.placesStats(recreation),
    queryFn: async () => {
      const { data, error } = await supabase.rpc("v1_aggr_combine_user_places", {
        recreation,
      });
      if (error) throw error;
      return data?.[0] as UserPlacesStatsBucket | null;
    },
  });
}

// 사용자 리뷰 분석 (별점 분포, 태그, 카테고리, 최근 리뷰)
export function useUserReviewAnalysis() {
  return useQuery({
    queryKey: userKeys.reviewAnalysis(),
    queryFn: async () => {
      const { data, error } = await supabase.rpc("v2_aggr_review_user_places");
      if (error) throw error;
      return data as UserReviewAnalysisData | null;
    },
  });
}
