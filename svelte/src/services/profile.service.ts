import { supabase } from '$lib/supabase';
import type { UserProfile } from './types';

export interface ProfileUpdateData {
  nickname: string;
  bio?: string | null;
  profile_image_url?: string | null;
}

export const profileService = {
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