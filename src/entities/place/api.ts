import { apiClient } from "@/shared/api/client";
import type { 
  Place, 
  PlaceDetails, 
  NaverFolder, 
  YoutubeChannel, 
  CommunityContent, 
  CommunityRegion,
  PlaceUserReview,
  Feature
} from "./types";

/**
 * 장소 관련 API 호출을 관리하는 객체
 * Supabase RPC 함수를 호출하여 데이터를 가져옵니다.
 */
export const placeApi = {
  /**
   * 장소의 상세 정보(좋아요, 저장, 댓글 등)를 조회합니다.
   * @deprecated v1_get_place_by_id_with_set_recent_view 사용 권장
   */
  getDetails: async (placeId: string) => {
    const response = await apiClient.rpc<PlaceDetails>("v1_get_place_details", {
      p_place_id: placeId,
    });
    return response.data[0];
  },

  /**
   * ID 기반 장소 상세 데이터 조회 및 최근 본 장소 기록
   */
  getPlaceByIdWithRecentView: async (placeId: string) => {
    const response = await apiClient.rpc<Place>("v1_get_place_by_id_with_set_recent_view", {
      p_business_id: placeId,
    });
    return response.data[0];
  },

  /**
   * 장소의 사용자 리뷰 목록을 조회합니다.
   */
  getUserReviews: async (placeId: string, limit: number = 100) => {
    const response = await apiClient.rpc<PlaceUserReview>("v1_list_place_user_review", {
      p_place_id: placeId,
      p_limit: limit,
    });
    return response.data;
  },

  /**
   * 장소의 특징(유튜브, 커뮤니티 등) 목록을 조회합니다.
   */
  getPlaceFeatures: async (placeId: string) => {
    const response = await apiClient.rpc<Feature>("v1_get_place_features", {
      p_business_id: placeId,
    });
    return response.data;
  },

  /**
   * 사용자 리뷰를 저장하거나 수정합니다.
   */
  upsertUserReview: async (params: {
    p_review_id?: string;
    p_place_id: string;
    p_review_content: string;
    p_score: number;
    p_is_private: boolean;
    p_gender_code?: string | null;
    p_age_group_code?: string | null;
    p_tag_codes?: string[];
    p_profile_gender_and_age_by_pass?: boolean;
  }) => {
    const response = await apiClient.rpc<any>("v1_upsert_place_user_review", params);
    if (response.meta.code !== 200) throw new Error(response.meta.message);
    return response.data[0];
  },

  /**
   * 사용자 리뷰를 삭제합니다.
   */
  deleteUserReview: async (reviewId: string) => {
    const response = await apiClient.rpc<any>("v1_delete_place_user_review", {
      p_review_id: reviewId,
    });
    if (response.meta.code !== 200) throw new Error(response.meta.message);
    return response.data[0];
  },

  /**
   * 장소 특징(유튜브, 커뮤니티 등)을 추가하거나 수정합니다.
   */
  upsertPlaceFeature: async (params: {
    p_feature_id?: string;
    p_business_id: string;
    p_platform_type: string;
    p_content_url: string;
    p_title: string | null;
    p_metadata: any;
  }) => {
    const response = await apiClient.rpc<any>("v1_upsert_place_feature", params);
    if (response.meta.code !== 200) throw new Error(response.meta.message);
    return response.data[0];
  },

  /**
   * 장소 특징을 삭제합니다.
   */
  deletePlaceFeature: async (featureId: string) => {
    const response = await apiClient.rpc<any>("v1_delete_place_feature", {
      p_feature_id: featureId,
    });
    if (response.meta.code !== 200) throw new Error(response.meta.message);
    return response.data[0];
  },

  /**
   * 좋아요 상태를 토글합니다.
   */
  toggleLike: async (params: { likedId: string; likedType: string; refId: string }) => {
    const response = await apiClient.rpc<any>("v1_toggle_like", {
      p_liked_id: params.likedId,
      p_liked_type: params.likedType,
      p_ref_liked_id: params.refId,
    });
    return response.data[0].liked as boolean;
  },

  /**
   * 저장 상태를 토글합니다.
   */
  toggleSave: async (params: { savedId: string; savedType: string; refId: string }) => {
    const response = await apiClient.rpc<any>("v1_toggle_save", {
      p_saved_id: params.savedId,
      p_saved_type: params.savedType,
      p_ref_saved_id: params.refId,
    });
    return response.data[0].saved as boolean;
  },

  /**
   * 방문 기록을 저장하거나 취소합니다.
   */
  toggleVisited: async (params: { placeId: string; cancel?: boolean }) => {
    const response = await apiClient.rpc<any>("v1_save_or_update_visited_place", {
      p_place_id: params.placeId,
      p_cancel: params.cancel ?? false,
    });
    return response.data;
  },

  /**
   * 탭별 장소 목록을 조회합니다.
   */
  listByTab: async (params: {
    tabName: string;
    limit?: number;
    offset?: number;
    group1?: string | null;
  }) => {
    const response = await apiClient.rpc<any>("v1_list_places_by_tab", {
      p_tab_name: params.tabName,
      p_limit: params.limit || 21,
      p_offset: params.offset || 0,
      p_group1: params.group1 || null,
    });
    return response.data.map((item: any) => item.place_data as Place);
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
    price_min?: number;
    price_max?: number;
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
      p_price_min: params.price_min || null,
      p_price_max: params.price_max || null,
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

  /**
   * 커뮤니티 게시글 목록을 지역별로 조회합니다 (v2).
   */
  getCommunityContents: async (params: {
    domain?: string | null;
    limit?: number;
    offset?: number;
  }) => {
    const response = await apiClient.rpc<CommunityRegion>("v2_get_community_contents", {
      p_domain: params.domain || null,
      p_limit: params.limit || 20,
      p_offset: params.offset || 0,
    });
    return response.data;
  },

  /**
   * 네이버 폴더 상세 장소 목록을 조회합니다.
   */
  getPlacesByNaverFolder: async (params: { folderId: string; limit?: number; offset?: number }) => {
    const response = await apiClient.rpc<any>("v2_get_places_by_naver_folder", {
      p_folder_id: parseInt(params.folderId),
      p_limit: params.limit || 20,
      p_offset: params.offset || 0,
    });
    return response.data;
  },

  /**
   * 유튜브 채널 상세 장소 목록을 조회합니다.
   */
  getPlacesByYoutubeChannel: async (params: { channelId: string; limit?: number; offset?: number }) => {
    const response = await apiClient.rpc<any>("v2_get_places_by_youtube_channel", {
      p_channel_id: params.channelId,
      p_limit: params.limit || 20,
      p_offset: params.offset || 0,
    });
    return response.data;
  },

  /**
   * 커뮤니티 지역 상세 장소 목록을 조회합니다.
   */
  getPlacesByCommunityRegion: async (params: { regionName: string; domain?: string | null; limit?: number; offset?: number }) => {
    const response = await apiClient.rpc<any>("v2_get_places_by_community_region", {
      p_region_name: params.regionName,
      p_domain: params.domain || null,
      p_limit: params.limit || 20,
      p_offset: params.offset || 0,
    });
    return response.data;
  },

  /**
   * 네이버 폴더 정보를 조회합니다.
   */
  getNaverFolderInfo: async (folderId: string) => {
    const response = await apiClient.rpc<NaverFolder>("v2_get_naver_folder_info", {
      p_folder_id: parseInt(folderId),
    });
    return response.data[0];
  },

  /**
   * 유튜브 채널 정보를 조회합니다.
   */
  getYoutubeChannelInfo: async (channelId: string) => {
    const response = await apiClient.rpc<YoutubeChannel>("v2_get_youtube_channel_info", {
      p_channel_id: channelId,
    });
    return response.data[0];
  },

  /**
   * 내가 저장(북마크)한 장소 목록을 조회합니다.
   */
  getMyBookmarkedPlaces: async (limit: number = 20, offset: number = 0) => {
    const response = await apiClient.rpc<any>("v1_get_my_bookmarked_places", {
      p_limit: limit,
      p_offset: offset,
    });
    return response.data;
  },

  /**
   * 내가 최근 본 장소 목록을 조회합니다.
   */
  getMyRecentViewPlaces: async (limit: number = 20, offset: number = 0) => {
    const response = await apiClient.rpc<any>("v1_get_my_recent_view_places", {
      p_limit: limit,
      p_offset: offset,
    });
    return response.data;
  },

  /**
   * 내가 좋아요 누른 장소 목록을 조회합니다.
   */
  getMyLikedPlaces: async (limit: number = 20, offset: number = 0) => {
    const response = await apiClient.rpc<any>("v1_get_my_liked_places", {
      p_limit: limit,
      p_offset: offset,
    });
    return response.data;
  },

  /**
   * 내가 방문한 장소 목록을 조회합니다.
   */
  getMyVisitedPlaces: async (limit: number = 20, offset: number = 0) => {
    const response = await apiClient.rpc<any>("v1_list_visited_place", {
      p_limit: limit,
      p_offset: offset,
    });
    return response.data;
  },

  /**
   * 장소 ID 목록으로 상세 정보 목록을 조회합니다.
   * @param placeIds 장소 ID 배열
   */
  listPlacesByIds: async (placeIds: string[]) => {
    const response = await apiClient.rpc<{ place_data: Place }>("v1_list_places_by_ids", {
      p_place_ids: placeIds,
    });
    return response.data;
  },
};
