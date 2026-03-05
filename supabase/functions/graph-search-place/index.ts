/**
 * =====================================================
 * ID: FN-GRAPH-SEARCH-PLACE
 * 기능: 통합 장소 검색 및 크롤링 큐 등록
 * 작성일: 2026-01-16
 * 설명: 사용자의 검색 쿼리를 바탕으로 외부 API(네이버)에서 장소를 검색하여 결과를 반환합니다.
 *       검색된 장소 중 DB에 없는 신규 장소는 tbl_place_queue에 등록하여 
 *       추후 상세 정보가 크롤링되도록 합니다.
 * 
 * 관련 테이블:
 *   - tbl_place_queue: 신규 장소 큐 등록
 *   - tbl_search_history: 검색 이력 및 통계 저장
 * 
 * 외부 의존성:
 *   - 네이버 플레이스 검색 API
 * 
 * 요청(Request Body):
 *   - query: string (검색 키워드. #62552651 또는 @1178182642 형식이면 place_id로 DB 직접 조회)
 *   - place_id?: string (place_id가 주어지면 네이버 검색 대신 DB에서 직접 조회)
 *   - start?: number (결과 시작 번호, 기본 1)
 *   - display?: number (한 번에 가져올 개수, 기본 100)
 * 
 * 응답(Response):
 *   - 성공: { code: 200, count: number, rows: array, ... }
 *   - 실패: { code: 400 | 500, message: string }
 * =====================================================
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { SearchRequest } from "./types.ts";
import { NaverRestaurantItem } from "./types.ts";
import { fetchFromNaver } from "./naver.ts";
import { handleQueueAndHistory, saveSearchHistoryOnly } from "./queue.ts";

/** # 또는 @ 접두사 뒤의 place_id 추출. 접두사 없으면 null (키워드 검색 유지) */
function extractPlaceIdFromQuery(query: string): string | null {
  const s = (query ?? "").trim();
  if (!s) return null;
  const match = s.match(/^[#@](.+)$/);
  if (!match) return null;
  const rest = match[1].trim();
  if (!rest) return null;
  // 숫자만 또는 20~32자 hex
  return /^\d+$/.test(rest) || /^[a-f0-9]{20,32}$/i.test(rest) ? rest : null;
}

/** tbl_place 행을 NaverRestaurantItem 형식으로 변환 */
function placeRowToNaverItem(row: Record<string, unknown>): NaverRestaurantItem {
  const id = String(row.id ?? "");
  const name = String(row.name ?? "");
  const category = String(row.category ?? "");
  const address = String(row.address ?? "");
  const group1 = String(row.group1 ?? "");
  const group2 = String(row.group2 ?? "");
  const commonAddress = [group1, group2].filter(Boolean).join(" ") || address;
  return {
    id,
    name,
    category,
    businessCategory: "restaurant",
    commonAddress,
    address,
    __typename: "BusinessSummary"
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders
    });
  }

  try {
    const searchParams: SearchRequest = await req.json();
    const { query, place_id: explicitPlaceId, start = 1, display = 100 } = searchParams;

    if (!query && !explicitPlaceId) {
      return new Response(JSON.stringify({
        code: 400,
        count: 0,
        rows: null,
        param: { query, start, display }
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    }

    const authHeader = req.headers.get("Authorization");
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: authHeader ?? "" }
        }
      }
    );

    let userId = null;
    if (authHeader) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        userId = user?.id ?? null;
      } catch (error) {
        console.log("사용자 인증 실패:", error);
      }
    }

    // place_id로 DB 직접 조회 (# 또는 @ 접두사 있을 때만, 예: #62552651 @1178182642)
    const placeIdToLookup = explicitPlaceId ?? extractPlaceIdFromQuery(query ?? "");
    if (placeIdToLookup) {
      const supabaseAdmin = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
      );
      const { data: placeRow, error } = await supabaseAdmin
        .from("tbl_place")
        .select("id, name, category, address, group1, group2")
        .eq("id", placeIdToLookup)
        .single();

      if (!error && placeRow) {
        const item = placeRowToNaverItem(placeRow);
        await saveSearchHistoryOnly(supabase, query || placeIdToLookup, userId, 1);
        return new Response(JSON.stringify({
          code: 200,
          count: 1,
          queued_count: 0,
          crawl_result: null,
          rows: [item],
          param: { query: query || placeIdToLookup, start, display }
        }), {
          status: 200,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json"
          }
        });
      }
      // DB에 없으면 place_id 전용 요청이었을 때만 빈 결과 반환 (네이버 검색 스킵)
      if (explicitPlaceId) {
        await saveSearchHistoryOnly(supabase, placeIdToLookup, userId, 0);
        return new Response(JSON.stringify({
          code: 200,
          count: 0,
          rows: [],
          param: { query: placeIdToLookup, start, display }
        }), {
          status: 200,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json"
          }
        });
      }
      // query가 place_id 형식이었지만 DB에 없음 → 네이버 검색으로 폴백
    }

    const response = await fetchFromNaver(searchParams);

    if (!response.ok) {
      console.error("Naver API Error:", { status: response.status });
      await saveSearchHistoryOnly(supabase, query, userId, 0);
      
      return new Response(JSON.stringify({
        code: response.status,
        count: 0,
        rows: null,
        param: { query, start, display }
      }), {
        status: response.status,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    }

    const data = await response.json();
    
    if (data && data.length > 0 && data[0].data && data[0].data.restaurants) {
      const items = data[0].data.restaurants.items || [];
      
      const { queuedCount, crawlResult } = await handleQueueAndHistory(
        supabase,
        query,
        userId,
        items
      );
      
      return new Response(JSON.stringify({
        code: 200,
        count: items.length,
        queued_count: queuedCount,
        crawl_result: crawlResult,
        rows: items,
        param: { query, start, display }
      }), {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    } else {
      await saveSearchHistoryOnly(supabase, query, userId, 0);
      return new Response(JSON.stringify({
        code: 200,
        count: 0,
        rows: [],
        param: { query, start, display }
      }), {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    }
  } catch (error) {
    console.error("Server Error:", error);
    return new Response(JSON.stringify({
      code: 500,
      count: 0,
      rows: null,
      param: null
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  }
});
