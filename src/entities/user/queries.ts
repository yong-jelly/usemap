import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { userApi, type ProfileUpdateData } from "./api";
import { useUserStore } from "./index";

export const userKeys = {
  all: ["user"] as const,
  profile: () => [...userKeys.all, "profile"] as const,
  subscribers: () => [...userKeys.all, "subscribers"] as const,
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
