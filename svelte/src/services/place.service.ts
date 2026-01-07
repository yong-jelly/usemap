import { supabase } from '$lib/supabase';
import type { UserProfile } from './types';

export interface ProfileUpdateData {
  nickname: string;
  bio?: string | null;
  profile_image_url?: string | null;
}

export const placeService = {

  /**
   * 음식점 방문 경험 정보 조회
   * @param placeId 음식점 ID
   * @returns 방문 경험 정보
   */
  async getPlaceExperience(placeId: string) {
    try {
      const { data, error } = await supabase.rpc('v1_get_visited_place', {
        p_place_id: placeId
      });

      if (error) {
        console.error('방문 경험 조회 오류:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('방문 경험 조회 중 오류 발생:', error);
      throw error;
    }
  },
  /**
   * 방문 경험 저장 또는 업데이트
   * @param placeId 음식점 ID
   * @param id 방문 경험 ID
   * @param visitedAt 방문 일자
   * @param cancel 취소 여부
   * @returns 
   */
  async togglePlaceExperience(placeId: string, id?: string,cancel: boolean = false) {
    const { data, error } = await supabase.rpc('v1_save_or_update_visited_place', {
      p_place_id: placeId,
      // p_visited_at: visitedAt,
      p_id: id,
      p_cancel: cancel
    });

    if (error) {
      console.error('방문 경험 저장 오류:', error);
      throw error;
    }

    return data;
  },

  /**
   * 음식점의 특징 정보 조회
   * @param businessId 음식점 ID
   * @param limit 조회할 최대 개수
   * @param offset 조회 시작 위치
   */
  async getPlaceFeatures(businessId: string, limit: number = 20, offset: number = 0) {
    try {
      const { data, error } = await supabase.rpc('v1_get_place_features', {
        p_business_id: businessId,
        p_limit: limit,
        p_offset: offset
      });
      
      if (error) {
        console.error('음식점 특징 조회 오류:', error);
        throw error;
      }
      
      return data || [];
    } catch (error) {
      console.error('음식점 특징 조회 중 오류 발생:', error);
      throw error;
    }
  },
  /**
   * 현재 로그인한 사용자의 프로필 조회
   */
  async getCurrentUserProfile(): Promise<UserProfile | null> {
    try {
      const { data, error } = await supabase.rpc('get_user_profile');
      
      if (error) {
        console.error('프로필 조회 오류:', error);
        throw error;
      }
      
      return data?.[0] || null;
    } catch (error) {
      console.error('프로필 조회 중 오류 발생:', error);
      throw error;
    }
  },

  /**
   * 특정 public_profile_id로 사용자 프로필 조회
   */
  async getProfileById(publicProfileId: string): Promise<UserProfile | null> {
    try {
      const { data, error } = await supabase.rpc('get_user_profile_by_id', {
        p_public_profile_id: publicProfileId
      });
      
      if (error) {
        console.error('프로필 조회 오류:', error);
        throw error;
      }
      
      return data?.[0] || null;
    } catch (error) {
      console.error('프로필 조회 중 오류 발생:', error);
      throw error;
    }
  },

  /**
   * 닉네임으로 프로필 검색
   */
  async searchProfilesByNickname(nickname: string, limit: number = 10): Promise<UserProfile[]> {
    try {
      const { data, error } = await supabase.rpc('search_profiles_by_nickname', {
        p_nickname: nickname,
        p_limit: limit
      });
      
      if (error) {
        console.error('프로필 검색 오류:', error);
        throw error;
      }
      
      return data || [];
    } catch (error) {
      console.error('프로필 검색 중 오류 발생:', error);
      throw error;
    }
  },

  /**
   * 현재 로그인한 사용자의 프로필 업데이트
   */
  async updateProfile(profileData: ProfileUpdateData): Promise<{ success: boolean; profile?: UserProfile; message?: string }> {
    try {
      const { data, error } = await supabase.rpc('update_user_profile', {
        p_nickname: profileData.nickname,
        p_bio: profileData.bio,
        p_profile_image_url: profileData.profile_image_url
      });
      
      if (error) {
        console.error('프로필 업데이트 오류:', error);
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error('프로필 업데이트 중 오류 발생:', error);
      throw error;
    }
  },

  /**
   * 프로필 생성 (트리거가 자동으로 생성하지 않을 경우)
   */
  async createProfile(profileData: ProfileUpdateData): Promise<{ success: boolean; profile?: UserProfile; message?: string }> {
    try {
      const { data, error } = await supabase.rpc('create_user_profile', {
        p_nickname: profileData.nickname,
        p_bio: profileData.bio,
        p_profile_image_url: profileData.profile_image_url
      });
      
      if (error) {
        console.error('프로필 생성 오류:', error);
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error('프로필 생성 중 오류 발생:', error);
      throw error;
    }
  }
};