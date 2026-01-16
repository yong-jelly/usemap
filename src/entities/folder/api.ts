import { apiClient } from "@/shared/api/client";
import { supabase } from "@/shared/lib/supabase";
import type { 
  Folder, 
  FolderPlace, 
  FolderAccess, 
  InviteHistory, 
  FolderReview,
  CreateFolderResult 
} from "./types";

export const folderApi = {
  /**
   * 공개 폴더 목록 조회
   */
  listPublicFolders: async (params: { limit?: number; offset?: number } = {}) => {
    const response = await apiClient.rpc<Folder>("v1_list_public_folders", {
      p_limit: params.limit || 20,
      p_offset: params.offset || 0,
    });
    return response.data;
  },

  /**
   * 내 폴더 목록 조회
   */
  listMyFolders: async (params: { placeId?: string } = {}) => {
    const response = await apiClient.rpc<Folder>("v1_list_my_folders", {
      p_place_id: params.placeId || null,
    });
    return response.data;
  },

  /**
   * 특정 사용자의 공개 폴더 목록 조회
   */
  listUserSharedFolders: async (params: { userId: string; limit?: number; offset?: number }) => {
    const response = await apiClient.rpc<Folder>("v1_list_user_shared_folders", {
      p_user_id: params.userId,
      p_limit: params.limit || 20,
      p_offset: params.offset || 0,
    });
    return response.data;
  },

  /**
   * 폴더 생성
   */
  createFolder: async (params: {
    title: string;
    description?: string;
    permission?: string;
    permissionWriteType?: number;
  }) => {
    const response = await apiClient.rpc<CreateFolderResult>("v1_create_folder", {
      p_title: params.title,
      p_description: params.description || null,
      p_permission: params.permission || 'public',
      p_permission_write_type: params.permissionWriteType || 0,
    });
    return response.data?.[0];
  },

  /**
   * 폴더 정보 조회 (단건)
   */
  getFolderInfo: async (folderId: string) => {
    const response = await apiClient.rpc<Folder>("v1_get_folder_info", {
      p_folder_id: folderId,
    });
    return response.data?.[0];
  },

  /**
   * 네이버 장소 단건 임포트 (Step 1~4)
   */
  importPlaceToFolder: async (params: { folderId: string; input: string }) => {
    const { data, error } = await supabase.functions.invoke("fn_v1_import_place_to_folder", {
      body: {
        folderId: params.folderId,
        input: params.input
      }
    });

    if (error) {
      throw error;
    }

    return data;
  },

  /**
   * 폴더 접근 권한 체크
   */
  checkFolderAccess: async (folderId: string) => {
    const response = await apiClient.rpc<FolderAccess>("v1_check_folder_access", {
      p_folder_id: folderId,
    });
    return response.data?.[0];
  },

  /**
   * 폴더에 장소 추가
   */
  addPlaceToFolder: async (params: { folderId: string; placeId: string; comment?: string }) => {
    const response = await apiClient.rpc<boolean>("v1_add_place_to_folder", {
      p_folder_id: params.folderId,
      p_place_id: params.placeId,
      p_comment: params.comment || null,
    });
    
    // 에러 체크
    if (response.meta.code !== 200) {
      const error = new Error(response.meta.message || '장소 추가에 실패했습니다.');
      (error as any).meta = response.meta;
      throw error;
    }
    
    return response.data[0];
  },

  /**
   * 폴더에서 장소 제거
   */
  removePlaceFromFolder: async (params: { folderId: string; placeId: string }) => {
    const response = await apiClient.rpc<boolean>("v1_remove_place_from_folder", {
      p_folder_id: params.folderId,
      p_place_id: params.placeId,
    });
    return response.data[0];
  },

  /**
   * 폴더 내 장소 목록 조회
   */
  getFolderPlaces: async (params: {
    folderId: string;
    limit?: number;
    offset?: number;
  }) => {
    const response = await apiClient.rpc<FolderPlace>("v1_get_folder_places", {
      p_folder_id: params.folderId,
      p_limit: params.limit || 20,
      p_offset: params.offset || 0,
    });
    return response.data;
  },

  /**
   * 폴더 구독 토글
   */
  toggleFolderSubscription: async (folderId: string) => {
    const response = await apiClient.rpc<{ is_subscribed: boolean; subscriber_count: number }>(
      "v1_toggle_folder_subscription",
      { p_folder_id: folderId }
    );
    return response.data[0];
  },

  /**
   * 피쳐(네이버, 유튜브, 커뮤니티) 구독 토글
   */
  toggleFeatureSubscription: async (params: { type: string; id: string }) => {
    const response = await apiClient.rpc<{ is_subscribed: boolean }>(
      "v1_toggle_feature_subscription",
      { p_feature_type: params.type, p_feature_id: params.id }
    );
    return response.data[0];
  },

  /**
   * 구독 중인 목록 조회
   */
  listMySubscriptions: async () => {
    const response = await apiClient.rpc<any>("v1_list_my_subscriptions");
    return response.data;
  },

  /**
   * 내 피드 조회
   */
  getMyFeed: async (params: { limit?: number; offset?: number; price_min?: number | null; price_max?: number | null } = {}) => {
    const response = await apiClient.rpc<any>("v1_get_my_feed", {
      p_limit: params.limit || 20,
      p_offset: params.offset || 0,
      p_price_min: params.price_min || null,
      p_price_max: params.price_max || null,
    });
    return response.data;
  },

  /**
   * 공개 피드 조회 (로그인 불필요)
   */
  getPublicFeed: async (params: { sourceType?: string | null; limit?: number; offset?: number } = {}) => {
    const response = await apiClient.rpc<any>("v1_get_public_feed", {
      p_source_type: params.sourceType || null,
      p_limit: params.limit || 10,
      p_offset: params.offset || 0,
    });
    return response.data;
  },

  /**
   * 기본 폴더 생성 (필요시)
   */
  ensureDefaultFolder: async () => {
    const response = await apiClient.rpc<boolean>("v1_ensure_default_folder");
    return response.data[0];
  },

  /**
   * 초대 코드 재생성 (24시간 유효)
   */
  regenerateInviteCode: async (folderId: string) => {
    const response = await apiClient.rpc<{ invite_code: string; expires_at: string }>(
      "v1_regenerate_invite_code",
      { p_folder_id: folderId }
    );
    return response.data?.[0];
  },

  /**
   * 초대 코드 검증 및 구독
   */
  verifyInviteCode: async (params: { folderId: string; inviteCode: string }) => {
    const response = await apiClient.rpc<{ success: boolean; error?: string; folder_id?: string }>(
      "v1_verify_invite_code",
      { p_folder_id: params.folderId, p_invite_code: params.inviteCode }
    );
    return response.data?.[0];
  },

  /**
   * 초대 히스토리 조회 (관리자용)
   */
  getInviteHistory: async (folderId: string) => {
    const response = await apiClient.rpc<InviteHistory>("v1_get_invite_history", {
      p_folder_id: folderId,
    });
    return response.data;
  },

  /**
   * 폴더 숨김
   */
  hideFolder: async (folderId: string) => {
    const response = await apiClient.rpc<boolean>("v1_hide_folder", {
      p_folder_id: folderId,
    });
    return response.data[0];
  },

  /**
   * 폴더 정보 업데이트
   */
  updateFolder: async (params: {
    folderId: string;
    title?: string;
    description?: string;
    permissionWriteType?: number;
  }) => {
    const response = await apiClient.rpc<boolean>("v1_update_folder", {
      p_folder_id: params.folderId,
      p_title: params.title || null,
      p_description: params.description || null,
      p_permission_write_type: params.permissionWriteType ?? null,
    });
    return response.data[0];
  },

  /**
   * 비공개 폴더 리뷰 작성/수정
   */
  upsertFolderReview: async (params: {
    folderId: string;
    placeId: string;
    reviewContent: string;
    score: number;
  }) => {
    const response = await apiClient.rpc<{ id: string; success: boolean }>(
      "v1_upsert_folder_review",
      {
        p_folder_id: params.folderId,
        p_place_id: params.placeId,
        p_review_content: params.reviewContent,
        p_score: params.score,
      }
    );
    return response.data[0];
  },

  /**
   * 비공개 폴더 리뷰 조회
   */
  getFolderReviews: async (params: { folderId: string; placeId?: string }) => {
    const response = await apiClient.rpc<FolderReview>("v1_get_folder_reviews", {
      p_folder_id: params.folderId,
      p_place_id: params.placeId || null,
    });
    return response.data;
  },

  /**
   * 폴더 내 장소 지도용 경량 목록 조회 (전체)
   */
  getFolderPlacesForMap: async (folderId: string) => {
    const response = await apiClient.rpc<{
      place_id: string;
      name: string;
      x: string;
      y: string;
    }>("v1_get_folder_places_for_map", {
      p_folder_id: folderId,
    });
    return response.data;
  },
};
