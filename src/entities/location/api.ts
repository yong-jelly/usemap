import { apiClient } from "@/shared/api/client";
import type { UserLocation, SaveLocationResponse } from "./types";

export const locationApi = {
  /**
   * 사용자 위치 저장 (가장 가까운 음식점 정보 포함)
   */
  saveUserLocation: async (params: { latitude: number; longitude: number }) => {
    const response = await apiClient.rpc<SaveLocationResponse>("v1_save_user_location", {
      p_latitude: params.latitude,
      p_longitude: params.longitude,
    });
    return response.data?.[0];
  },

  /**
   * 사용자 위치 목록 조회 (최근 10개)
   */
  getUserLocations: async (params: { limit?: number } = {}) => {
    const response = await apiClient.rpc<UserLocation>("v1_get_user_locations", {
      p_limit: params.limit || 10,
    });
    return response.data;
  },

  /**
   * 사용자 위치 삭제
   */
  deleteUserLocation: async (locationId: string) => {
    const response = await apiClient.rpc<boolean>("v1_delete_user_location", {
      p_location_id: locationId,
    });
    return response.data?.[0];
  },
};
