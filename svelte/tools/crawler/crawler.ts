// crawler.ts
import axios from 'axios';

// ---------- [인터페이스 정의] ----------
export interface Coordinate {
	x: number | null;
	y: number | null;
	mapZoomLevel?: number;
}

export interface PlaceMenu {
	name: string;
	price?: string | number;
	recommend?: boolean;
	description?: string;
	images?: string[];
	id?: string;
	index?: number;
}

export interface PlaceBase {
	id: string;
	name: string;
	road?: string;
	category?: string;
	categoryCode?: string;
	categoryCodeList?: string[];
	roadAddress?: string;
	paymentInfo?: string;
	conveniences?: string[];
	address?: string;
	phone?: string;
	visitorReviewsTotal?: number;
	visitorReviewsScore?: number;
	menus?: PlaceMenu[];
	streetPanorama?: any;
	coordinate: Coordinate;
	homepage?: string[];
	keyword_list?: string[];
	images?: string[];
	static_map_url?: string;
	themes?: any;
	visitor_review_medias_total?: number;
	visitor_review_stats?: any;
	place_images?: string[];
	group1?: string;
	group2?: string;
	group3?: string;
}

export interface PlaceDetail {
	base: PlaceBase;
	shopWindow?: any;
	informationTab?: any;
	paiUpperImage?: any;
	staticMapUrl?: string;
	themes?: any;
	visitorReviewMediasTotal?: number;
	visitorReviewStats?: any;
	images?: any;
}

// ---------- [핵심 크롤링 함수] ----------
export async function crawlForPlace(businessIds: string[]): Promise<PlaceDetail[]> {
	// 1. GraphQL 쿼리 리스트 생성
	const requests = makeCombinedRequests(businessIds);

	// 2. API 요청 실행
	const response = await requestWithRetry(requests);

	const rows = response.data;
	const details: PlaceDetail[] = [];

	rows.forEach((row, idx) => {
		const businessId = businessIds[idx];

		const key = Object.keys(row.data)[0];
		const value = row.data[key];

		if (key === 'placeDetail') {
			try {
				const data = parseRestaurantData(value, businessId);
				details.push(data);
			} catch (error) {
				console.error('[placeDetail] 데이터 파싱 오류:', error);
			}
		}
		// 필요시 visitorReviews, visitorReviewStats 추가 가능
	});

	return details;
}

// ---------- [GraphQL 쿼리 생성 함수] ----------
export function makeCombinedRequests(businessIds: string[]): Record<string, any>[] {
	return businessIds.map((id) => getPlaceDetailQuery(id));
}

export function getPlaceDetailQuery(businessId: string) {
	// 쿼리문은 필요에 따라 수정하세요!
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

// ---------- [API 요청 (재시도 포함)] ----------
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

// ---------- [결과 파싱 함수] ----------
export function parseRestaurantData(row: any, businessId: string) {
	try {
		// JSON 문자열을 객체로 변환 (이미 객체인 경우는 그대로 사용)
		// const data = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;

		// 필요한 데이터 추출
		const placeDetail = row;
		// [2025/05/02] base 없는 케이스 있음
		const base = row.base;
		const coordinate = base.coordinate;
		const groups =
			base.address && base.address.split(' ').length > 2
				? base.address.split(' ')
				: [null, null, null];

		const result = {
			// base 정보
			id: base.id,
			name: base.name,
			road: base.road || null,
			category: base.category || null,
			category_code: base.categoryCode || null,
			category_code_list: base.categoryCodeList || null,
			road_address: base.roadAddress || null,
			payment_info: base.paymentInfo || null,
			conveniences: base.conveniences || null,
			address: base.address || null,
			group1: groups[0] || null,
			group2: groups[1] || null,
			group3: groups[2] || null,
			phone: base.phone || null,
			visitor_reviews_total: base.visitorReviewsTotal || 0,
			visitor_reviews_score: base.visitorReviewsScore || 0,

			// 위도, 경도
			// x: base.x || null,
			// y: base.y || null,
			x: coordinate.x || null,
			y: coordinate.y || null,

			// JSON 형태로 저장할 데이터
			homepage: (() => {
				const homepages = placeDetail.shopWindow.homepages || {};
				const etc = homepages.etc || [];
				const repr = homepages.repr || null;
				const urls = [];

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
			menus: base.menus || null,

			// streetPanorama 정보 (위도/경도 제외)
			street_panorama: base.streetPanorama || null,

			// 장소 이미지
			place_images: (() => {
				if (
					placeDetail.images &&
					placeDetail.images.images &&
					Array.isArray(placeDetail.images.images)
				) {
					return placeDetail.images.images.map((img) => img.origin || img);
				}
				return null;
			})(),
		};

		return result;
	} catch (error) {
		// console.error('JSON 파싱 중 오류 발생:', error);
		return {
			error: error.message,
			place_id: businessId || null,
		};
	}
}

// ----- [예시 실행 함수 (CLI 파일에서 사용)] -----
// import { crawlForPlace } from "./crawler";
// crawlForPlace(["123456", "654321"]).then(console.log).catch(console.error);
