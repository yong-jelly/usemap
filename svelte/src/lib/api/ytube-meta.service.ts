import { callSupabaseFunction } from './supabase-function';
import type { YouTubeVideoSnippet } from '$services/types';

/**
 * YouTube 비디오 메타 정보 요청 서비스
 * @param videoId - YouTube 비디오 ID
 * @returns YouTubeVideoSnippet
 */
export async function requestYouTubeMetaService(videoId: string) {
  try {
    const result = await callSupabaseFunction<YouTubeVideoSnippet>(
      'ytube-meta',
      {
        method: 'POST',
        body: { youtubeId: videoId },
        anonymous: true
      }
    );
    return {error:false, results:result};
  } catch (error: any) {
    return { error: true, results: error.message };
  }
} 