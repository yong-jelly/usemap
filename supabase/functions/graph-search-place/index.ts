// 배포
// supabase functions deploy graph-search-place --no-verify-jwt
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { SearchRequest } from "./types.ts";
import { fetchFromNaver } from "./naver.ts";
import { handleQueueAndHistory, saveSearchHistoryOnly } from "./queue.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders
    });
  }

  try {
    const searchParams: SearchRequest = await req.json();
    const { query, start = 1, display = 100 } = searchParams;

    if (!query) {
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
