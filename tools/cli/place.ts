/**
 * 네이버 장소(Place) 상세 정보 크롤러 CLI
 * 
 * 사용법: bun run tools/cli/place.ts <placeId1> <placeId2> ...
 */

import { sql, toSqlArray } from '../shared/db';
import { requestWithRetry } from '../shared/api';
import { chunkArray, sleep } from '../shared/utils';
import { PlaceDetail } from '../shared/types';

// ---------- [파싱 및 데이터 변환] ----------

function parseRestaurantData(row: any, businessId: string): PlaceDetail {
    try {
        const placeDetail = row;
        const base = row.base;
        if (!base) throw new Error('Base data missing');
        
        const coordinate = base.coordinate || { x: null, y: null };
        const groups = base.address && base.address.split(' ').length > 2
            ? base.address.split(' ')
            : [null, null, null];

        return {
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
            x: coordinate.x || null,
            y: coordinate.y || null,
            homepage: (() => {
                const homepages = placeDetail.shopWindow?.homepages || {};
                const etc = homepages.etc || [];
                const repr = homepages.repr || null;
                const urls = [];
                if (Array.isArray(etc)) {
                    etc.forEach((item: any) => item?.url && urls.push(item.url));
                }
                if (repr?.url) urls.push(repr.url);
                return urls.length > 0 ? urls : null;
            })(),
            keyword_list: placeDetail.informationTab?.keywordList || null,
            images: placeDetail.paiUpperImage?.images || null,
            static_map_url: placeDetail.staticMapUrl || null,
            themes: placeDetail.themes || null,
            visitor_review_medias_total: placeDetail.visitorReviewMediasTotal || 0,
            visitor_review_stats: placeDetail.visitorReviewStats || null,
            menus: base.menus || null,
            street_panorama: base.streetPanorama || null,
            place_images: (() => {
                const imgs = placeDetail.images?.images;
                if (Array.isArray(imgs)) {
                    return imgs.map((img: any) => img.origin || img);
                }
                return null;
            })(),
        };
    } catch (error: any) {
        return {
            id: businessId,
            name: 'Error',
            error: error.message,
            place_id: businessId,
        };
    }
}

// ---------- [API 요청 쿼리] ----------

function getPlaceDetailQuery(businessId: string) {
    return {
        operationName: 'getPlaceDetail',
        variables: { input: { id: businessId, deviceType: 'pcmap', isNx: false } },
        query: `
        query getPlaceDetail($input: PlaceDetailInput) {
          placeDetail(input: $input) {
            shopWindow { homepages { etc { url } repr { url } } }
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
                votedKeyword { totalCount reviewCount userCount details { code iconUrl iconCode displayName count } }
              }
            }
            base {
              id name road category categoryCode categoryCodeList roadAddress paymentInfo conveniences address phone visitorReviewsTotal visitorReviewsScore
              menus { name price recommend description images id index }
              streetPanorama { id pan tilt lon lat fov }
              coordinate { x y mapZoomLevel }
            }
            images { images { origin } totalImages }
          }
        }
        `,
    };
}

// ---------- [크롤링 핵심 로직] ----------

export interface CrawlProgress {
    current: number;
    total: number;
}

export async function crawlForPlace(businessIds: string[], progress?: CrawlProgress): Promise<PlaceDetail[]> {
    const CHUNKS = chunkArray(businessIds, 10);
    const allDetails: PlaceDetail[] = [];

    for (const [idx, chunk] of CHUNKS.entries()) {
        const progressInfo = progress ? ` (${progress.current}/${progress.total})` : '';
        console.log(`[크롤러]${progressInfo} 청크 ${idx + 1}/${CHUNKS.length} 처리 중...`);
        
        try {
            const requests = chunk.map(id => getPlaceDetailQuery(id));
            const response = await requestWithRetry({
                url: 'https://pcmap-api.place.naver.com/place/graphql',
                method: 'POST',
                data: requests
            });

            const rows = response.data;
            rows.forEach((row: any, i: number) => {
                const businessId = chunk[i];
                if (!row.data?.placeDetail) {
                    allDetails.push({ id: businessId, name: 'Error', error: '데이터 없음', place_id: businessId });
                } else {
                    allDetails.push(parseRestaurantData(row.data.placeDetail, businessId));
                }
            });
        } catch (error: any) {
            console.error(`[크롤러] 청크 요청 실패:`, error.message);
            chunk.forEach(id => allDetails.push({ id, name: 'Error', error: '청크 실패', place_id: id }));
        }

        if (idx < CHUNKS.length - 1) await sleep(1000);
    }

    return allDetails;
}

// ---------- [DB 저장 로직] ----------

async function upsertToDb(details: any[]) {
    const validItems = details.filter(item => !item.error);
    const errorItems = details.filter(item => item.error);

    // 1. tbl_bucket 업데이트 (작업 로그용)
    if (details.length > 0) {
        const bucketRows = details.map(item => ({
            key: 'upsert_place_from_cli',
            name: item.error ? `${item.id}-error` : `${item.id}`,
            value: item.error ? String(item.error) : `${item.name ?? ''} ${item.address ?? ''}`.trim()
        }));
        
        await sql`
            INSERT INTO public.tbl_bucket ${sql(bucketRows)}
            ON CONFLICT (key, name) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
        `;
    }

    // 2. tbl_place 업데이트
    if (validItems.length > 0) {
        const placeRows = validItems.map(item => ({
            id: item.id,
            name: item.name ?? null,
            road: item.road ?? null,
            category: item.category ?? null,
            category_code: item.category_code ?? null,
            category_code_list: toSqlArray(item.category_code_list),
            road_address: item.road_address ?? null,
            payment_info: toSqlArray(item.payment_info),
            conveniences: toSqlArray(item.conveniences),
            address: item.address ?? null,
            phone: item.phone ?? null,
            visitor_reviews_total: item.visitor_reviews_total ?? 0,
            visitor_reviews_score: item.visitor_reviews_score ?? 0,
            x: item.x ?? null,
            y: item.y ?? null,
            homepage: toSqlArray(item.homepage),
            keyword_list: toSqlArray(item.keyword_list),
            images: toSqlArray(item.images),
            static_map_url: item.static_map_url ?? null,
            themes: toSqlArray(item.themes),
            visitor_review_medias_total: item.visitor_review_medias_total ?? 0,
            visitor_review_stats: item.visitor_review_stats ? JSON.stringify(item.visitor_review_stats) : null,
            menus: item.menus ? JSON.stringify(item.menus) : null,
            street_panorama: item.street_panorama ? JSON.stringify(item.street_panorama) : null,
            place_images: toSqlArray(item.place_images),
            group1: item.group1 ?? null,
            group2: item.group2 ?? null,
            group3: item.group3 ?? null,
        }));

        await sql`
            INSERT INTO public.tbl_place ${sql(placeRows)}
            ON CONFLICT (id) DO UPDATE SET 
                name = EXCLUDED.name, category = EXCLUDED.category, address = EXCLUDED.address,
                phone = EXCLUDED.phone, x = EXCLUDED.x, y = EXCLUDED.y, updated_at = NOW()
        `;
        console.log(`[DB] tbl_place ${validItems.length}건 업데이트 완료`);
    }
}

/**
 * 다른 모듈(예: folder.ts)에서 호출하기 위한 익스포트 함수
 */
export async function crawlAndSyncPlaces(placeIds: string[], progress?: CrawlProgress) {
    if (placeIds.length === 0) return [];
    
    const details = await crawlForPlace(placeIds, progress);
    await upsertToDb(details);
    
    return details
        .filter(item => !item.error)
        .filter(item => {
            const excludedCodes = ['227616', '227755', '227813', '227815'];
            return !item.category_code_list?.some((code: string) => excludedCodes.includes(code));
        })
        .map(item => item.id);
}

// ---------- [CLI 실행부] ----------

if (require.main === module || (import.meta as any).main) {
    (async () => {
        const args = process.argv.slice(2);
        if (args.length === 0) {
            console.log('사용법: bun run tools/cli/place.ts <placeId1> <placeId2> ...');
            process.exit(1);
        }

        try {
            const details = await crawlForPlace(args);
            await upsertToDb(details);
            console.log('✅ 작업 완료');
        } catch (err) {
            console.error('❌ 실행 중 오류:', err);
        } finally {
            await sql.end();
        }
    })();
}
