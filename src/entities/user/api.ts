import { apiClient } from "@/shared/api/client";
import { supabase } from "@/shared/lib/supabase";
import type { UserProfile } from "./types";

export interface ProfileUpdateData {
  nickname: string;
  bio: string | null;
  profile_image_url: string | null;
}

export const userApi = {
  /**
   * 현재 사용자의 상세 프로필 정보를 조회합니다.
   */
  getCurrentProfile: async (): Promise<UserProfile | null> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const response = await apiClient.rpc<UserProfile>("v1_get_user_profile", {
      p_auth_user_id: user.id,
    });
    return response.data[0] || null;
  },

  /**
   * 프로필 정보를 업데이트하거나 신규 생성합니다. (v2)
   */
  upsertProfile: async (data: Partial<ProfileUpdateData> & { email?: string }) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Authentication required");

    const response = await apiClient.rpc<UserProfile>("v2_upsert_user_profile", {
      p_nickname: data.nickname,
      p_bio: data.bio,
      p_profile_image_url: data.profile_image_url,
      p_email: data.email || user.email,
    });

    return {
      success: response.meta.code === 200,
      message: response.meta.message,
      profile: response.data[0],
    };
  },

  /**
   * 프로필 정보를 업데이트합니다. (Legacy)
   */
  updateProfile: async (data: ProfileUpdateData) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Authentication required");

    const response = await apiClient.rpc<UserProfile>("v1_update_user_profile", {
      p_nickname: data.nickname,
      p_bio: data.bio,
      p_profile_image_url: data.profile_image_url,
    });

    return {
      success: response.meta.code === 200,
      message: response.meta.message,
      profile: response.data[0],
    };
  },

  /**
   * 로그아웃 처리
   */
  logout: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }
};
