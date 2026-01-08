import { apiClient } from "@/shared/api/client";
import type { Place, PlaceDetails, NaverFolder, YoutubeChannel } from "./types";

/**
 * 장소 관련 API 호출을 관리하는 객체
 * Supabase RPC 함수를 호출하여 데이터를 가져옵니다.
 */
export const placeApi = {
  /**
   * 장소의 상세 정보(좋아요, 저장, 댓글 등)를 조회합니다.
   */
  getDetails: async (placeId: string) => {
    const response = await apiClient.rpc<PlaceDetails>("v1_get_place_details", {
      p_place_id: placeId,
    });
    return response.data[0];
  },
  
  /**
   * 장소의 분석 데이터(메뉴별 가격, 투표 결과 등)를 조회합니다.
   */
  getAnalysis: async (placeId: string) => {
    const response = await apiClient.rpc<any>("v1_get_place_analysis", {
      p_place_id: placeId,
    });
    return response.data[0];
  },
  
  /**
   * 장소에 대한 외부 수집 리뷰 목록을 조회합니다.
   */
  getReviews: async (placeId: string, limit: number = 21) => {
    const response = await apiClient.rpc<any>("v1_get_place_reviews", {
      p_place_id: placeId,
      p_limit: limit,
    });
    return response.data;
  },

  /**
   * 필터별 장소 목록을 조회합니다.
   */
  listByFilters: async (params: {
    group1?: string | null;
    group2?: string | null;
    group3?: string | null;
    categories?: string[] | null;
    features?: string[] | null;
    limit?: number;
    offset?: number;
    theme_codes?: string[] | null;
    exclude_franchises?: boolean;
    image_limit?: number;
  }) => {
    const response = await apiClient.rpc<any>("v2_list_places_by_filters", {
      p_group1: params.group1 || null,
      p_group2: params.group2 || null,
      p_group3: params.group3 || null,
      p_category: params.categories && params.categories.length > 0 ? params.categories : null,
      p_convenience: params.features && params.features.length > 0 ? params.features : null,
      p_limit: params.limit || 21,
      p_offset: params.offset || 0,
      p_theme_codes: params.theme_codes && params.theme_codes.length > 0 ? params.theme_codes : null,
      p_exclude_franchises: params.exclude_franchises ?? true,
      p_image_limit: params.image_limit || 3,
    });
    
    return response.data.map((item: any) => item.place_data as Place);
  },

  /**
   * 네이버 폴더 목록을 조회합니다 (v2).
   */
  getNaverFolders: async (limit: number = 20, offset: number = 0) => {
    const response = await apiClient.rpc<NaverFolder>("v2_get_naver_folders", {
      p_limit: limit,
      p_offset: offset,
    });
    return response.data;
  },

  /**
   * 유튜브 채널 목록을 조회합니다 (v2).
   */
  getYoutubeChannels: async (limit: number = 20, offset: number = 0) => {
    const response = await apiClient.rpc<YoutubeChannel>("v2_get_youtube_channels", {
      p_limit: limit,
      p_offset: offset,
    });
    return response.data;
  },
};
