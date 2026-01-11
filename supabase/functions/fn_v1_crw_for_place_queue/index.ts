import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

/**
 * [fn_v1_crw_for_place_queue]
 * 
 * 설계 목적:
 * 1. tbl_place_queue 테이블에서 대기 중(PENDING)인 장소 하나를 가져옴.
 * 2. 해당 장소의 상세 정보를 네이버 GraphQL API를 통해 크롤링함.
 * 3. 크롤링 성공 시 tbl_place 테이블에 상세 데이터를 저장(upsert)하고, 큐의 상태를 SUCCESS로 변경.
 * 4. 크롤링 실패 시 재시도 횟수를 증가시키고 상태를 FAILED 또는 STOPPED(제한 초과 시)로 변경.
 * 5. 모든 과정은 tbl_crw_log 테이블에 기록하여 추적 가능하게 함.
 * 
 * [테스트용 curl 명령어]
 * curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/fn_v1_crw_for_place_queue' \
 *   --header 'Authorization: Bearer <service-role-key>'
 */

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const startTime = Date.now();
  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  let targetPlace = null;

  try {
    // 1. 처리할 대상 장소 하나 선정 (PENDING 상태 중 가장 오래된 것)
    const { data: queueItems, error: selectError } = await supabaseAdmin
      .from("tbl_place_queue")
      .select("*")
      .eq("status", "PENDING")
      .order("created_at", { ascending: true })
      .limit(1);

    if (selectError) throw selectError;
    if (!queueItems || queueItems.length === 0) {
      return new Response(JSON.stringify({ message: "No pending items in queue" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    targetPlace = queueItems[0];
    const placeId = targetPlace.id;

    // 2. 상태를 PROCESSING으로 변경 (중복 처리 방지)
    await supabaseAdmin
      .from("tbl_place_queue")
      .update({ status: "PROCESSING" })
      .eq("id", placeId);

    console.log(`[CRAWL START] ID: ${placeId}, Name: ${targetPlace.name}`);

    // 3. 네이버 API 크롤링 실행
    const crawlResult = await performCrawl(placeId);

    const endTime = Date.now();
    const durationMs = endTime - startTime;

    if (crawlResult.error) {
      // 4-A. 크롤링 실패 처리
      const newRetryCount = (targetPlace.retry_count || 0) + 1;
      const isStopped = newRetryCount >= (targetPlace.retry_limit || 5);
      const newStatus = isStopped ? "STOPPED" : "FAILED";

      await supabaseAdmin
        .from("tbl_place_queue")
        .update({
          status: newStatus,
          retry_count: newRetryCount,
          error_message: crawlResult.error,
          updated_at: new Date().toISOString()
        })
        .eq("id", placeId);

      // 로그 기록
      await logCrawlResult(supabaseAdmin, {
        place_id: placeId,
        status: "FAILED",
        error_message: crawlResult.error,
        start_time: new Date(startTime).toISOString(),
        end_time: new Date(endTime).toISOString(),
        duration_ms: durationMs
      });

      return new Response(JSON.stringify({ status: "FAILED", error: crawlResult.error }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // 4-B. 크롤링 성공 - tbl_place 저장
    const { error: upsertError } = await supabaseAdmin
      .from("tbl_place")
      .upsert(crawlResult.data, { onConflict: "id" });

    if (upsertError) throw upsertError;

    // 5. 큐 상태 SUCCESS로 변경
    await supabaseAdmin
      .from("tbl_place_queue")
      .update({ status: "SUCCESS", updated_at: new Date().toISOString() })
      .eq("id", placeId);

    // 로그 기록
    await logCrawlResult(supabaseAdmin, {
      place_id: placeId,
      status: "SUCCESS",
      start_time: new Date(startTime).toISOString(),
      end_time: new Date(endTime).toISOString(),
      duration_ms: durationMs
    });

    console.log(`[CRAWL SUCCESS] ID: ${placeId}`);

    return new Response(JSON.stringify({ status: "SUCCESS", place_id: placeId }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("Critical Function Error:", error);
    
    // 타겟이 정해졌던 경우에만 큐 상태 복구 또는 실패 처리
    if (targetPlace) {
      await supabaseAdmin
        .from("tbl_place_queue")
        .update({ status: "FAILED", error_message: error.message })
        .eq("id", targetPlace.id);
    }

    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});

/**
 * 네이버 GraphQL API를 호출하여 장소 정보를 가져옵니다.
 */
async function performCrawl(businessId: string) {
  const query = `
    query getPlaceDetail($input: PlaceDetailInput) {
      placeDetail(input: $input) {
        shopWindow {
          homepages {
            etc { url }
            repr { url }
          }
        }
        informationTab { keywordList }
        paiUpperImage { images }
        themes
        staticMapUrl
        visitorReviewMediasTotal
        visitorReviewStats {
          id
          review { avgRating totalCount }
          analysis {
            themes { code label count }
            menus { code label count }
            votedKeyword {
              totalCount reviewCount userCount
              details { code iconUrl iconCode displayName count }
            }
          }
        }
        base {
          id
          name
          road
          category
          categoryCode
          categoryCodeList
          roadAddress
          paymentInfo
          conveniences
          address
          phone
          visitorReviewsTotal
          visitorReviewsScore
          menus {
            name price recommend description images id index
          }
          streetPanorama { id pan tilt lon lat fov }
          coordinate { x y mapZoomLevel }
        }
        images { images { origin } totalImages }
      }
    }
  `;

  try {
    const response = await fetch("https://pcmap-api.place.naver.com/place/graphql", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify([{
        operationName: "getPlaceDetail",
        variables: {
          input: { id: businessId, deviceType: "pcmap", isNx: false }
        },
        query: query
      }])
    });

    if (!response.ok) throw new Error(`API Request Failed: ${response.status}`);

    const result = await response.json();
    const data = result[0]?.data?.placeDetail;
    if (!data) throw new Error("No data returned from API");

    // 파싱 (cli.ts의 로직 기반)
    const base = data.base;
    const coordinate = base.coordinate;
    const groups = base.address?.split(' ') || [];

    const parsedData = {
      id: base.id,
      name: base.name,
      road: base.road || null,
      category: base.category || null,
      category_code: base.categoryCode || null,
      category_code_list: base.categoryCodeList || [],
      road_address: base.roadAddress || null,
      payment_info: base.paymentInfo || [],
      conveniences: base.conveniences || [],
      address: base.address || null,
      phone: base.phone || null,
      visitor_reviews_total: base.visitorReviewsTotal || 0,
      visitor_reviews_score: base.visitorReviewsScore || 0,
      x: coordinate.x || null,
      y: coordinate.y || null,
      homepage: (() => {
        const homepages = data.shopWindow?.homepages || {};
        const urls = (homepages.etc || []).map((i: any) => i.url).filter(Boolean);
        if (homepages.repr?.url) urls.push(homepages.repr.url);
        return urls;
      })(),
      keyword_list: data.informationTab?.keywordList || [],
      images: data.paiUpperImage?.images || [],
      static_map_url: data.staticMapUrl || null,
      themes: data.themes || [],
      visitor_review_medias_total: data.visitorReviewMediasTotal || 0,
      visitor_review_stats: data.visitorReviewStats || null,
      menus: base.menus || [],
      street_panorama: base.streetPanorama || null,
      place_images: (data.images?.images || []).map((img: any) => img.origin || img),
      group1: groups[0] || null,
      group2: groups[1] || null,
      group3: groups[2] || null,
      updated_at: new Date().toISOString()
    };

    return { data: parsedData };

  } catch (error) {
    return { error: error.message };
  }
}

/**
 * 크롤링 로그를 저장합니다.
 */
async function logCrawlResult(supabase: any, log: any) {
  try {
    await supabase.from("tbl_crw_log").insert(log);
  } catch (err) {
    console.error("Log saving error:", err);
  }
}
