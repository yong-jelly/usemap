import { callSupabaseFunction } from './supabase-function';
import type { CommunityMetaInfo } from '$services/types';

/**
 * 커뮤니티(블로그 등) URL 메타 정보 요청 서비스
 * @param url - 커뮤니티 URL
 * @returns CommunityMetaInfo
 */
export async function requestCommunityMetaService(url: string) {
  try {
    const result = await callSupabaseFunction<CommunityMetaInfo>(
      'community-meta',
      {
        method: 'POST',
        body: { url: url },
        anonymous: true
      }
    );
    return {error:false, results:result};
  } catch (error: any) {
    return { error: true, results: error.message };
  }
} 