import { supabase } from '$lib/supabase';
import type { PlaceDetail } from '$services/types';

class SupabasePlaceService {
  private supabase;

  constructor() {
    this.supabase = supabase;
  }

  /**
   * 장소 상세 정보를 가져옵니다.
   * @param id 장소 ID
   * @returns 장소 상세 정보
   */
  async getPlaceDetail(id: string) {
    try {
      const { data, error } = await this.supabase
        .rpc('v1_get_place_detail', { p_place_id: id });

      if (error) throw error;

      return { result: { row: data } };
    } catch (error) {
      console.error('Failed to get place detail:', error);
      return { result: { row: null } };
    }
  }

  /**
   * 태그 마스터 데이터 가져오기
   * @returns 모든 활성화된 태그 목록
   */
  async getTags() {
    try {
      const { data, error } = await this.supabase
        .rpc('v1_get_tags');
      
      return { data, error };
    } catch (error) {
      console.error('태그 로드 실패:', error);
      return { data: null, error: error as any };
    }
  }

  /**
   * 사용자가 특정 장소에 추가한 태그 가져오기
   * @param businessId 장소 ID
   * @returns 사용자가 추가한 태그 목록
   */
  async getUserTags(businessId: string) {
    try {
      const { data, error } = await this.supabase
        .rpc('v1_get_user_tags', { p_business_id: businessId });
      
      return { data, error };
    } catch (error) {
      console.error('사용자 태그 로드 실패:', error);
      return { data: null, error: error as any };
    }
  }

  /**
   * 태그 추가
   * @param tagData 태그 데이터 (business_id, tag_id)
   * @returns 추가된 태그 정보
   */
  async addTag(tagData: { business_id: string; tag_id: string }) {
    try {
      const { data, error } = await this.supabase
        .rpc('v1_add_tag', {
          p_business_id: tagData.business_id,
          p_tag_id: tagData.tag_id
        });
      
      return { data, error };
    } catch (error) {
      console.error('태그 추가 실패:', error);
      return { data: null, error: error as any };
    }
  }

  /**
   * 태그 삭제
   * @param tagId 삭제할 태그 ID
   * @returns 삭제 결과
   */
  async removeTag(tagId: string) {
    try {
      const { data: success, error } = await this.supabase
        .rpc('v1_remove_tag', { p_tag_id: tagId });
      
      return { success, error };
    } catch (error) {
      console.error('태그 삭제 실패:', error);
      return { success: false, error: error as any };
    }
  }

  /**
   * 장소의 인기 태그를 가져옵니다.
   * @param businessId 장소 ID
   * @param limit 가져올 태그 수(기본값: 10)
   * @returns 인기 태그 목록
   */
  async getPopularTagsForPlace(businessId: string, limit: number = 10) {
    try {
      const { data, error } = await this.supabase
        .rpc('v1_get_popular_tags_for_place', { 
          p_business_id: businessId,
          p_limit: limit
        });
      
      return { data, error };
    } catch (error) {
      console.error('인기 태그 로드 실패:', error);
      return { data: null, error: error as any };
    }
  }

  /**
   * 카테고리별 인기 태그를 가져옵니다.
   * @param category 태그 카테고리 ('positive', 'neutral', 'negative', 'hateful')
   * @param limit 가져올 태그 수(기본값: 20)
   * @returns 카테고리별 인기 태그 목록
   */
  async getPopularTagsByCategory(category: string, limit: number = 20) {
    try {
      const { data, error } = await this.supabase
        .rpc('v1_get_popular_tags_by_category', { 
          p_category: category,
          p_limit: limit
        });
      
      return { data, error };
    } catch (error) {
      console.error('카테고리별 인기 태그 로드 실패:', error);
      return { data: null, error: error as any };
    }
  }
}

export const supabasePlaceService = new SupabasePlaceService(); 