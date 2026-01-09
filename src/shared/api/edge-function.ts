import { supabase } from "@/shared/lib/supabase";

/**
 * Supabase Edge Function 호출을 위한 공통 유틸리티
 */
export async function callSupabaseFunction<T = any>(
  functionName: string,
  options: {
    method?: 'GET' | 'POST';
    body?: any;
    query?: Record<string, string | number | boolean | undefined | null>;
  } = {}
) {
  try {
    const { data, error } = await supabase.functions.invoke(functionName, {
      method: options.method || 'POST',
      body: options.body,
      queryParams: options.query as any,
    });

    if (error) {
      console.error(`Edge Function Error (${functionName}):`, error);
      return { error: true, results: error.message };
    }

    return { error: false, results: data as T };
  } catch (err: any) {
    console.error(`Edge Function Exception (${functionName}):`, err);
    return { error: true, results: err.message };
  }
}

/**
 * YouTube 비디오 메타 정보 요청 서비스
 */
export async function requestYouTubeMetaService(videoId: string) {
  return callSupabaseFunction('ytube-meta', {
    body: { youtubeId: videoId },
  });
}

/**
 * 커뮤니티 URL 메타 정보 요청 서비스
 */
export async function requestCommunityMetaService(url: string) {
  return callSupabaseFunction('community-meta', {
    body: { url },
  });
}

/**
 * 장소 검색 서비스 (graph-search-place Edge Function)
 */
export async function searchPlaceService(query: string) {
  const result = await callSupabaseFunction<{ items: any[] }>('graph-search-place', {
    body: { query },
  });
  
  if (result.error) {
    return { error: true, items: [] };
  }
  
  return { error: false, items: result.results?.items || [] };
}
