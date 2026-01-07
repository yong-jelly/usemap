// crawler.ts
import axios from 'axios';
import { PlaceDetail } from './types';

export async function crawlForPlace(businessIds: string[]): Promise<PlaceDetail[]> {
  const requests = makeCombinedRequests(businessIds);
  const response = await requestWithRetry(requests);
  const rows = response.data;
  const details: PlaceDetail[] = [];

  rows.forEach((row: any, idx: number) => {
    const businessId = businessIds[idx];
    const key = Object.keys(row.data)[0];
    const value = row.data[key];

    if (key === 'placeDetail') {
      try {
        const data = parseRestaurantData(value, businessId);
        details.push(data);
      } catch (error: any) {
        console.error('[placeDetail] 데이터 파싱 오류:', error);
        details.push({
          error: error.message,
          place_id: businessId,
        } as PlaceDetail);
      }
    }
  });

  return details;
}

export function makeCombinedRequests(businessIds: string[]): Record<string, any>[] {
  return businessIds.map((id) => getPlaceDetailQuery(id));
}

export function getPlaceDetailQuery(businessId: string) {
  return {
    operationName: 'getPlaceDetail',
    variables: {
      input: {
        id: businessId,
        deviceType: 'pcmap',
        isNx: false,
      },
    },
    query: `
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
    `,
  };
}

async function requestWithRetry(
  data: any,
  retries: number = 5,
  retryInterval: number = 7000,
): Promise<any> {
  const config = {
    method: 'post' as const,
    maxBodyLength: Infinity,
    url: 'https://pcmap-api.place.naver.com/place/graphql',
    headers: { 'Content-Type': 'application/json' },
    data,
    timeout: 60000,
  };

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await axios(config);
      if (response.status !== 429) return response;
      console.warn(`[${attempt}] 429 Too Many Requests, ${retryInterval / 1000}s 대기`);
    } catch (error: any) {
      console.warn(`[${attempt}] 오류: ${error.message}, ${retryInterval / 1000}s 대기`);
    }
    await new Promise((resolve) => setTimeout(resolve, retryInterval));
    retryInterval *= 2;
  }
  throw new Error('최대 재시도 횟수 초과!');
}

export function parseRestaurantData(row: any, businessId: string): PlaceDetail {
  try {
    const placeDetail = row;
    const base = row.base;
    
    if (!base) {
      throw new Error('base 데이터가 없습니다');
    }

    const coordinate = base.coordinate;
    const groups =
      base.address && base.address.split(' ').length > 2
        ? base.address.split(' ')
        : [null, null, null];

    const result: PlaceDetail = {
      base: {
        id: base.id,
        name: base.name,
        road: base.road || null,
        category: base.category || null,
        categoryCode: base.categoryCode || null,
        categoryCodeList: base.categoryCodeList || null,
        roadAddress: base.roadAddress || null,
        paymentInfo: base.paymentInfo || null,
        conveniences: base.conveniences || null,
        address: base.address || null,
        phone: base.phone || null,
        visitorReviewsTotal: base.visitorReviewsTotal || 0,
        visitorReviewsScore: base.visitorReviewsScore || 0,
        menus: base.menus || null,
        streetPanorama: base.streetPanorama || null,
        coordinate: {
          x: coordinate?.x || null,
          y: coordinate?.y || null,
          mapZoomLevel: coordinate?.mapZoomLevel || null,
        },
        group1: groups[0] || null,
        group2: groups[1] || null,
        group3: groups[2] || null,
        homepage: (() => {
          const homepages = placeDetail.shopWindow?.homepages || {};
          const etc = homepages.etc || [];
          const repr = homepages.repr || null;
          const urls: string[] = [];

          if (Array.isArray(etc) && etc.length > 0) {
            etc.forEach((item: any) => {
              if (item && item.url) urls.push(item.url);
            });
          }

          if (repr && repr.url) {
            urls.push(repr.url);
          }

          return urls.length > 0 ? urls : null;
        })(),
        keyword_list: (placeDetail.informationTab && placeDetail.informationTab.keywordList) || null,
        images: (placeDetail.paiUpperImage && placeDetail.paiUpperImage.images) || null,
        static_map_url: placeDetail.staticMapUrl || null,
        themes: placeDetail.themes || null,
        visitor_review_medias_total: placeDetail.visitorReviewMediasTotal || 0,
        visitor_review_stats: placeDetail.visitorReviewStats || null,
        place_images: (() => {
          if (
            placeDetail.images &&
            placeDetail.images.images &&
            Array.isArray(placeDetail.images.images)
          ) {
            return placeDetail.images.images.map((img: any) => img.origin || img);
          }
          return null;
        })(),
      },
      shopWindow: placeDetail.shopWindow || null,
      informationTab: placeDetail.informationTab || null,
      paiUpperImage: placeDetail.paiUpperImage || null,
      staticMapUrl: placeDetail.staticMapUrl || null,
      themes: placeDetail.themes || null,
      visitorReviewMediasTotal: placeDetail.visitorReviewMediasTotal || 0,
      visitorReviewStats: placeDetail.visitorReviewStats || null,
      images: placeDetail.images || null,
    };

    return result;
  } catch (error: any) {
    return {
      error: error.message,
      place_id: businessId || null,
    } as PlaceDetail;
  }
}
