/**
 * 네이버 장소 검색 → 크롤링 → 폴더 저장 CLI
 *
 * 사용법: bun run tools/cli/search.ts <folder_id> <검색어> [--test]
 *
 * --test: 시뮬레이션 모드 (DB 변경 없이 로그만 출력)
 */

import { sql } from '../shared/db';
import { requestWithRetry } from '../shared/api';
import { sleep } from '../shared/utils';
import { crawlAndSyncPlaces } from './place';

// ---------- [타입] ----------

interface NaverSearchItem {
    id: string;
    name: string;
    category: string;
    businessCategory: string;
    commonAddress: string;
    address: string;
}

interface SearchPageResult {
    page: number;
    start: number;
    count: number;
    items: NaverSearchItem[];
}

// ---------- [네이버 검색 API] ----------

const NAVER_GRAPHQL_URL = 'https://pcmap-api.place.naver.com/graphql';

const NAVER_HEADERS = {
    accept: '*/*',
    'accept-language': 'ko',
    'content-type': 'application/json',
    origin: 'https://pcmap.place.naver.com',
    priority: 'u=1, i',
    'sec-ch-ua': '"Chromium";v="136", "Google Chrome";v="136", "Not.A/Brand";v="99"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"macOS"',
    'sec-fetch-dest': 'empty',
    'sec-fetch-mode': 'cors',
    'sec-fetch-site': 'same-site',
    'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36',
};

const SEARCH_QUERY = `query getRestaurants($restaurantListInput: RestaurantListInput) {
  restaurants: restaurantList(input: $restaurantListInput) {
    items {
      ...CommonBusinessItems
      __typename
    }
    __typename
  }
}

fragment CommonBusinessItems on BusinessSummary {
  id
  name
  category
  businessCategory
  commonAddress
  address
  __typename
}`;

function buildSearchBody(query: string, start: number, display: number) {
    return [{
        operationName: 'getRestaurants',
        variables: {
            restaurantListInput: { query, start, display, deviceType: 'pcmap' },
        },
        query: SEARCH_QUERY,
    }];
}

async function searchNaverPlaces(query: string, display = 100): Promise<{ items: NaverSearchItem[]; pages: SearchPageResult[] }> {
    const allItems: NaverSearchItem[] = [];
    const pages: SearchPageResult[] = [];
    let start = 1;
    let page = 1;

    while (true) {
        console.log(`[검색] 페이지 ${page} (start=${start}, display=${display}) 요청 중...`);

        const response = await requestWithRetry({
            url: NAVER_GRAPHQL_URL,
            method: 'POST',
            headers: NAVER_HEADERS,
            data: buildSearchBody(query, start, display),
        });

        const items: NaverSearchItem[] = response.data?.[0]?.data?.restaurants?.items ?? [];
        console.log(`[검색] 페이지 ${page}: ${items.length}건 수신`);

        pages.push({ page, start, count: items.length, items });
        allItems.push(...items);

        if (items.length < display) break;

        start += display;
        page++;
        await sleep(500);
    }

    return { items: allItems, pages };
}

// ---------- [메인 로직] ----------

async function main() {
    const args = process.argv.slice(2);

    let folderId = '';
    let keyword = '';
    let isTest = false;

    for (const arg of args) {
        if (arg === '--test') {
            isTest = true;
        } else if (!folderId) {
            folderId = arg;
        } else if (!keyword) {
            keyword = arg;
        }
    }

    if (!folderId || !keyword) {
        console.log('사용법: bun run tools/cli/search.ts <folder_id> <검색어> [--test]');
        console.log('');
        console.log('예시:');
        console.log('  bun run tools/cli/search.ts 0e4e7d8e-0e51-4cdc-9dfb-06b6a9b58f3e 천하제빵 --test');
        console.log('  bun run tools/cli/search.ts 0e4e7d8e-0e51-4cdc-9dfb-06b6a9b58f3e 천하제빵');
        process.exit(1);
    }

    if (isTest) {
        console.log('=========================================');
        console.log('  🧪 시뮬레이션 모드 (DB 변경 없음)');
        console.log('=========================================');
    }

    console.log('');
    console.log(`[설정] 폴더 ID: ${folderId}`);
    console.log(`[설정] 검색어: ${keyword}`);
    console.log(`[설정] 모드: ${isTest ? '시뮬레이션 (--test)' : '실행'}`);
    console.log('-----------------------------------------');

    try {
        // STEP 1: 폴더 검증
        console.log('\n[1/7] 폴더 검증 중...');
        const [folder] = await sql`
            SELECT id, title, description, owner_id, permission, place_count
            FROM public.tbl_folder
            WHERE id = ${folderId}
        `;
        if (!folder) {
            console.warn(`⚠️ 폴더를 찾을 수 없습니다: ${folderId} (검색만 진행, DB 저장 건너뜀)`);
        } else {
            console.log(`  폴더명: ${folder.title}`);
            console.log(`  설명: ${folder.description || '(없음)'}`);
            console.log(`  권한: ${folder.permission}`);
            console.log(`  현재 장소 수: ${folder.place_count}개`);
        }

        // STEP 2: 사용자 정보 조회 (폴더 있을 때만)
        let user: { nickname: string; email: string } | null = null;
        if (folder) {
            console.log('\n[2/7] 사용자 정보 조회 중...');
            const [u] = await sql`
                SELECT auth_user_id, nickname, email, bio, profile_image_url
                FROM public.tbl_user_profile
                WHERE auth_user_id = ${folder.owner_id}
            `;
            if (!u) {
                console.error(`❌ 폴더 소유자 정보를 찾을 수 없습니다: ${folder.owner_id}`);
                process.exit(1);
            }
            user = { nickname: String(u.nickname ?? ''), email: String(u.email ?? '') };
            console.log(`  닉네임: ${user.nickname}`);
            console.log(`  이메일: ${user.email}`);
        } else {
            console.log('\n[2/7] 사용자 정보 조회 (폴더 없음 → 스킵)');
        }

        // STEP 3: 네이버 검색 (페이징)
        console.log('\n[3/7] 네이버 장소 검색 중...');
        const { items: searchItems, pages } = await searchNaverPlaces(keyword);

        console.log(`\n  📊 검색 결과 요약`);
        console.log(`  키워드: "${keyword}"`);
        console.log(`  총 결과: ${searchItems.length}건`);
        console.log(`  페이지 수: ${pages.length}`);
        pages.forEach(p => console.log(`    - 페이지 ${p.page}: ${p.count}건 (start=${p.start})`));

        if (searchItems.length === 0) {
            console.log('\n검색 결과가 없습니다. 종료합니다.');
            return;
        }

        const placeIds = searchItems.map(item => item.id);
        const uniquePlaceIds = [...new Set(placeIds)];
        console.log(`  고유 장소 수: ${uniquePlaceIds.length}건`);

        if (!folder) {
            console.log('\n=========================================');
            console.log('  📋 검색 결과 (폴더 없음 → DB 저장 건너뜀)');
            console.log('=========================================');
            console.log(`  검색어: "${keyword}"`);
            console.log(`  검색 결과: ${searchItems.length}건 (고유: ${uniquePlaceIds.length}건)`);
            console.log('=========================================');
            return;
        }

        // STEP 4: 기존 DB 데이터 확인
        console.log('\n[4/7] 기존 DB 데이터 확인 중...');
        const existingPlaces = await sql`
            SELECT id FROM public.tbl_place WHERE id = ANY(${uniquePlaceIds})
        `;
        const existingPlaceSet = new Set(existingPlaces.map(r => String(r.id)));
        const needCrawlIds = uniquePlaceIds.filter(id => !existingPlaceSet.has(id));

        console.log(`  DB에 이미 있는 장소: ${existingPlaceSet.size}건`);
        console.log(`  신규 크롤링 대상: ${needCrawlIds.length}건`);

        // 기존 폴더-장소 관계 확인
        const existingRelations = await sql`
            SELECT place_id
            FROM public.tbl_folder_place
            WHERE folder_id = ${folderId}
              AND place_id = ANY(${uniquePlaceIds})
              AND deleted_at IS NULL
        `;
        const existingRelationSet = new Set(existingRelations.map(r => String(r.place_id)));
        console.log(`  이미 폴더에 연결된 장소: ${existingRelationSet.size}건`);

        // STEP 5: 신규 장소 크롤링
        console.log('\n[5/7] 신규 장소 상세 크롤링...');
        let newlySyncedIds: string[] = [];

        if (needCrawlIds.length === 0) {
            console.log('  크롤링할 신규 장소가 없습니다.');
        } else if (isTest) {
            console.log(`  [시뮬레이션] ${needCrawlIds.length}건 크롤링 예정 (스킵)`);
            needCrawlIds.forEach(id => {
                const item = searchItems.find(s => s.id === id);
                console.log(`    - ${id}: ${item?.name ?? '?'} (${item?.category ?? '?'})`);
            });
        } else {
            console.log(`  ${needCrawlIds.length}건 크롤링 시작...`);
            newlySyncedIds = await crawlAndSyncPlaces(needCrawlIds);
            console.log(`  크롤링 완료: ${newlySyncedIds.length}건 저장됨`);
        }

        // 폴더에 연결할 최종 장소 목록
        const allAvailableIds = isTest
            ? uniquePlaceIds
            : [...new Set([...existingPlaces.map(r => String(r.id)), ...newlySyncedIds])];
        const newIdsToInsert = allAvailableIds.filter(id => !existingRelationSet.has(id));

        console.log(`\n  새로 폴더에 연결할 장소: ${newIdsToInsert.length}건`);

        // STEP 6: 폴더-장소 관계 INSERT
        console.log('\n[6/7] 폴더-장소 관계 저장...');
        if (newIdsToInsert.length === 0) {
            console.log('  추가할 새 장소가 없습니다.');
        } else if (isTest) {
            console.log(`  [시뮬레이션] ${newIdsToInsert.length}건 INSERT 예정 (스킵)`);
            newIdsToInsert.slice(0, 20).forEach(id => {
                const item = searchItems.find(s => s.id === id);
                console.log(`    - ${id}: ${item?.name ?? '?'} | ${item?.address ?? item?.commonAddress ?? '?'}`);
            });
            if (newIdsToInsert.length > 20) {
                console.log(`    ... 외 ${newIdsToInsert.length - 20}건`);
            }
        } else {
            const relationRows = newIdsToInsert.map(pid => ({
                folder_id: folderId,
                user_id: folder.owner_id,
                place_id: pid,
            }));

            await sql`
                INSERT INTO public.tbl_folder_place ${sql(relationRows)}
                ON CONFLICT (folder_id, place_id) DO UPDATE SET
                    deleted_at = NULL,
                    updated_at = NOW()
            `;
            console.log(`  ${newIdsToInsert.length}건 폴더-장소 관계 저장 완료`);
        }

        // STEP 7: place_count 갱신
        console.log('\n[7/7] place_count 갱신...');
        if (isTest) {
            const estimatedCount = (folder.place_count || 0) + newIdsToInsert.length;
            console.log(`  [시뮬레이션] place_count 업데이트 예정: ${folder.place_count} → ~${estimatedCount}`);
        } else {
            const [countRow] = await sql`
                SELECT count(*)::int AS cnt
                FROM public.tbl_folder_place
                WHERE folder_id = ${folderId} AND deleted_at IS NULL
            `;
            await sql`
                UPDATE public.tbl_folder
                SET place_count = ${countRow?.cnt || 0}, updated_at = NOW()
                WHERE id = ${folderId}
            `;
            console.log(`  place_count 갱신 완료: ${countRow?.cnt || 0}개`);
        }

        // 최종 리포트
        console.log('\n=========================================');
        console.log('  📋 최종 리포트');
        console.log('=========================================');
        console.log(`  모드: ${isTest ? '시뮬레이션 (--test)' : '실행 완료'}`);
        console.log(`  검색어: "${keyword}"`);
        console.log(`  검색 결과: ${searchItems.length}건 (고유: ${uniquePlaceIds.length}건)`);
        console.log(`  폴더: ${folder.title} (${folderId})`);
        console.log(`  소유자: ${user?.nickname ?? '-'} (${user?.email ?? '-'})`);
        console.log(`  DB 기존 장소: ${existingPlaceSet.size}건`);
        console.log(`  신규 크롤링: ${needCrawlIds.length}건${isTest ? ' (스킵)' : ` → ${newlySyncedIds.length}건 성공`}`);
        console.log(`  기존 폴더 연결: ${existingRelationSet.size}건`);
        console.log(`  신규 폴더 연결: ${newIdsToInsert.length}건${isTest ? ' (스킵)' : ''}`);
        console.log('=========================================');

        if (isTest) {
            console.log('\n💡 실제 실행하려면 --test 옵션을 제거하세요.');
        } else {
            console.log('\n✅ 모든 작업이 완료되었습니다.');
        }

    } catch (err: any) {
        console.error('❌ 오류 발생:', err.message || err);
        process.exit(1);
    } finally {
        await sql.end();
    }
}

main();
