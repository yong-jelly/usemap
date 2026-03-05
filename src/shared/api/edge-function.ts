import { supabase } from "@/shared/lib/supabase";
import { placeApi } from "@/entities/place/api";
import type { PlaceSearchSummary } from "@/entities/place/types";

/** # 또는 @ 접두사 뒤의 place_id 추출. 없으면 null */
function extractPlaceIdFromQuery(query: string): string | null {
  const s = (query ?? "").trim();
  if (!s) return null;
  const match = s.match(/^[#@](.+)$/);
  if (!match) return null;
  const rest = match[1].trim();
  if (!rest) return null;
  return /^\d+$/.test(rest) || /^[a-f0-9]{20,32}$/i.test(rest) ? rest : null;
}

/** Place → PlaceSearchSummary 변환 */
function placeToSummary(p: { id: string; name: string; category: string; address?: string; road_address?: string; group1?: string; group2?: string }): PlaceSearchSummary {
  const commonAddress = [p.group1, p.group2].filter(Boolean).join(" ") || p.address || "";
  return {
    id: p.id,
    name: p.name,
    category: p.category,
    businessCategory: "restaurant",
    commonAddress,
    address: p.address || p.road_address || "",
    __typename: "BusinessSummary",
  };
}

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
 * - #62552651, @1178182642 형식: place_id로 v1_list_places_by_ids 직접 호출 (DB 조회)
 * - 그 외: 네이버 검색 기반 graph-search-place 호출
 */
export async function searchPlaceService(query: string) {
  const placeId = extractPlaceIdFromQuery(query);
  if (placeId) {
    try {
      const data = await placeApi.listPlacesByIds([placeId]);
      const rows: PlaceSearchSummary[] = data
        .map((item) => item.place_data)
        .filter(Boolean)
        .map(placeToSummary);
      return {
        error: false,
        rows,
        count: rows.length,
        queued_count: 0,
        code: 200,
      };
    } catch (err) {
      console.error("Search by place_id error:", err);
      return { error: true, rows: [] };
    }
  }

  const result = await callSupabaseFunction<any>('graph-search-place', {
    body: { query },
  });

  if (result.error) {
    return { error: true, rows: [] };
  }

  return {
    error: false,
    rows: result.results?.rows || [],
    count: result.results?.count || 0,
    queued_count: result.results?.queued_count || 0,
    code: result.results?.code || 500
  };
}

/**
 * 소셜 URL 파싱 서비스 (fn_v1_parse_social_url Edge Function)
 * Threads, Instagram 등의 소셜 URL을 파싱하여 메타데이터를 추출하고 저장합니다.
 */
export async function parseSocialUrlService(url: string, placeId: string) {
  return callSupabaseFunction('fn_v1_parse_social_url', {
    body: { url, place_id: placeId },
  });
}
