/**
 * 네이버 플레이스 GraphQL API 클라이언트
 */
export class GraphqlClient {
  private baseUrl = "https://pcmap-api.place.naver.com/place/graphql";

  /**
   * GraphQL 요청을 수행하며, 실패 시 지수 백오프 전략으로 재시도합니다.
   * 
   * [알고리즘: 지수 백오프(Exponential Backoff)]
   * 1. 요청을 시도합니다.
   * 2. HTTP 429(Rate Limit) 발생 시:
   *    - 현재 대기 시간(interval)만큼 멈춥니다.
   *    - 다음 대기 시간을 2배로 늘립니다 (3s -> 6s -> 12s...).
   *    - 최대 재시도 횟수(retries)까지 반복합니다.
   * 3. 기타 네트워크 오류 발생 시에도 동일하게 재시도합니다.
   */
  async request(payload: any, retries = 5, interval = 5000) {
    for (let i = 0; i < retries; i++) {
      try {
        const response = await fetch(this.baseUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.93 Safari/537.36",
            "Origin": "https://pcmap.place.naver.com",
            "Referer": "https://pcmap.place.naver.com/",
            "Accept": "*/*",
            "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
          },
          body: JSON.stringify(payload),
        });

        if (response.status === 429) {
          console.warn(`[429] Too many requests. Retrying in ${interval}ms... (Attempt ${i + 1}/${retries})`);
          await new Promise(r => setTimeout(r, interval));
          interval *= 2;
          continue;
        }

        if (!response.ok) {
          console.warn(`[${response.status}] Unexpected response. Retrying in ${interval}ms...`);
          await new Promise(r => setTimeout(r, interval));
          interval *= 2;
          continue;
        }

        const result = await response.json();
        
        // GraphQL 에러 처리
        if (result.errors && result.errors.length > 0) {
          console.warn(`[GraphQL Error] ${result.errors[0].message}`);
          // 에러가 있어도 data가 있으면 반환, 없으면 재시도
          if (!result.data) {
            await new Promise(r => setTimeout(r, interval));
            interval *= 2;
            continue;
          }
        }

        return result;
      } catch (e: any) {
        console.error(`Request failed: ${e.message}. Retrying...`);
        await new Promise(r => setTimeout(r, interval));
      }
    }
    throw new Error("Max retries exceeded");
  }

  /**
   * 특정 영역 내의 장소 목록을 조회하는 쿼리를 생성합니다.
   * @param query 검색어 (예: "음식점")
   * @param bounds 좌표 범위 ("경도;위도;경도;위도")
   * @param start 시작 인덱스
   * @param display 한 번에 가져올 개수 (최대 50)
   */
  getPlacesListQuery(query: string, bounds: string, start: number, display: number) {
    return {
      operationName: "getPlacesList",
      variables: {
        input: { query, start, display, adult: false, spq: true, queryRank: "", bounds }
      },
      query: `query getPlacesList($input: PlacesInput) {
        businesses: places(input: $input) {
          total
          items {
            id name normalizedName category categoryCodeList roadAddress address fullAddress commonAddress phone x y visitorReviewScore blogCafeReviewCount bookingReviewCount
          }
        }
      }`
    };
  }

  /**
   * 여러 장소의 상세 정보를 한 번에 조회하는 쿼리를 생성합니다.
   * Naver Place GraphQL은 배열 형태의 입력을 지원하지 않으므로, 
   * 단일 요청 내에 여러 개의 alias 쿼리를 묶어서 보냅니다.
   */
  getPlacesBatchDetailQuery(businessIds: string[]) {
    const queries = businessIds.map((id, index) => {
      return `
        item${index}: placeDetail(input: { id: "${id}", deviceType: "pcmap", isNx: false }) {
          shopWindow { homepages { etc { url } repr { url } } }
          informationTab { keywordList }
          paiUpperImage { images }
          themes staticMapUrl visitorReviewMediasTotal
          visitorReviewStats { id review { avgRating totalCount } analysis { themes { code label count } menus { code label count } votedKeyword { totalCount reviewCount userCount details { code iconUrl iconCode displayName count } } } }
          base { id name road category categoryCode categoryCodeList roadAddress paymentInfo conveniences address phone visitorReviewsTotal visitorReviewsScore menus { name price recommend description images id index } streetPanorama { id pan tilt lon lat fov } coordinate { x y mapZoomLevel } }
          images { images { origin } totalImages }
        }
      `;
    });

    return {
      operationName: "getPlacesBatchDetail",
      query: `query getPlacesBatchDetail {
        ${queries.join("\n")}
      }`
    };
  }
}
