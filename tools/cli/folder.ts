/**
 * 네이버 지도 공유 폴더(Folder) 크롤러 CLI
 * 
 * 사용법: 
 *   1. 특정 폴더 동기화: bun run tools/cli/folder.ts <shareId_또는_URL> [--managed=true] [--filter-food=true]
 *   2. 모든 폴더 동기화: bun run tools/cli/folder.ts --all
 * 
 * 옵션:
 *   --managed=true/false    : 관리 폴더 여부 (기본값: false)
 *   --filter-food=true/false: 비음식점 필터링 (기본값: true) - true인 경우 음식점만 upsert
 * 
 * 예시:
 *   - bun run tools/cli/folder.ts https://naver.me/5R4ugqWr --managed=true
 *   - bun run tools/cli/folder.ts --all --filter-food=false
 */

import { resolveShareId } from '../shared/utils';
import { Bookmark, FolderInfo } from '../shared/types';
import { crawlAndSyncPlaces } from './place';
import { classifyPlaces, fetchFolderData, syncFolderToDb } from './folder-shared';

import { sql } from '../shared/db';

/**
 * 음식점 여부를 판별하여 음식점 place_id 목록 반환
 * @param placeIds 검사할 place_id 배열
 * @returns 음식점인 place_id 배열
 */
async function filterFoodPlaces(placeIds: string[]): Promise<Set<string>> {
    if (placeIds.length === 0) return new Set();
    
    const foodPlaces = await sql`
        SELECT id FROM public.tbl_place 
        WHERE id = ANY(${placeIds})
          AND (category_code_list[1] = '220036' OR category = '떡,한과')
    `;
    return new Set(foodPlaces.map(r => String(r.id)));
}

/**
 * 개별 폴더를 처리하는 핵심 로직
 */
async function processFolder(input: string, managed: boolean, filterFood: boolean = true) {
    const shareId = await resolveShareId(input);
    const sourceUrl = input.startsWith('http') ? input : `https://map.naver.com/p/favorite/folder/${shareId}`;

    console.log(`\n[폴더 처리 시작] shareId: ${shareId}, managed: ${managed}, filterFood: ${filterFood}`);
    
    try {
        const data = await fetchFolderData(shareId);
        if (!data || !data.folder) {
            console.error(`  ❌ 폴더 데이터를 가져올 수 없습니다. (ID: ${shareId})`);
            return;
        }

        const folder: FolderInfo = { ...data.folder, shareId };
        const bookmarks: Bookmark[] = data.bookmarkList.filter((b: any) => b.type === 'place');

        console.log(`  - 폴더명: ${folder.name}`);
        console.log(`  - 장소수: ${bookmarks.length}개`);

        // DB 분류 및 동기화
        const { alreadyInPlace, needCrawl } = await classifyPlaces(bookmarks, folder.folderId);
        console.log(`  - 기존 DB 존재: ${alreadyInPlace.length}건, 신규 크롤링 필요: ${needCrawl.length}건`);

        let newlySyncedIds: string[] = [];
        if (needCrawl.length > 0) {
            newlySyncedIds = await crawlAndSyncPlaces(needCrawl.map(b => b.sid));
        }

        // 최종 연결할 ID 목록 생성
        let finalIdsToLink = new Set([...alreadyInPlace.map(b => b.sid), ...newlySyncedIds]);
        
        // 비음식점 필터링 적용
        if (filterFood) {
            const allIds = Array.from(finalIdsToLink);
            const foodOnlyIds = await filterFoodPlaces(allIds);
            const filteredCount = finalIdsToLink.size - foodOnlyIds.size;
            if (filteredCount > 0) {
                console.log(`  - 비음식점 필터링: ${filteredCount}건 제외`);
            }
            finalIdsToLink = foodOnlyIds;
        }
        
        const bookmarksToLink = bookmarks.filter(b => finalIdsToLink.has(b.sid));

        await syncFolderToDb(folder, bookmarksToLink, sourceUrl, managed);
        console.log(`  ✅ 동기화 완료 (${bookmarksToLink.length}개 장소 연결)`);

    } catch (err: any) {
        console.error(`  ❌ 오류 발생 (${shareId}):`, err.message);
    }
}

async function main() {
    const args = process.argv.slice(2);
    
    let input = '';
    let managed = false;
    let updateAll = false;
    let filterFood = true; // 기본값: 비음식점 필터링 활성화

    for (const arg of args) {
        if (arg.startsWith('--managed=')) {
            managed = arg.split('=')[1] === 'true';
        } else if (arg.startsWith('--filter-food=')) {
            filterFood = arg.split('=')[1] !== 'false'; // false일 때만 비활성화
        } else if (arg === '--all') {
            updateAll = true;
        } else if (!arg.startsWith('--')) {
            input = arg;
        }
    }

    // 인자가 하나도 없거나 --all 옵션이 있는 경우 전체 업데이트 시도
    if (updateAll || (!input && args.length === 0)) {
        console.log('--- DB에 등록된 모든 네이버 폴더 최신화 시작 ---');
        
        try {
            // DB에서 모든 share_id와 url 정보를 가져옴
            const folders = await sql`
                SELECT share_id, url, managed 
                FROM public.tbl_naver_folder 
                ORDER BY updated_at ASC
            `;

            if (folders.length === 0) {
                console.log('최신화할 폴더가 DB에 없습니다.');
            } else {
                console.log(`총 ${folders.length}개의 폴더를 처리합니다. (filterFood: ${filterFood})`);
                for (const f of folders) {
                    // DB에 저장된 managed 상태를 기본으로 하되, 
                    // CLI 인자로 명시했다면 해당 값을 우선 적용
                    const isManaged = args.some(a => a.startsWith('--managed=')) ? managed : f.managed;
                    await processFolder(f.url || f.share_id, isManaged, filterFood);
                }
            }
        } catch (err: any) {
            console.error('전체 조회 중 오류 발생:', err.message);
        }
    } else if (input) {
        // 특정 폴더만 처리
        await processFolder(input, managed, filterFood);
    } else {
        console.log('사용법:');
        console.log('  1. 특정 폴더: bun run tools/cli/folder.ts <shareId 또는 URL> [--managed=true] [--filter-food=true]');
        console.log('  2. 모든 폴더: bun run tools/cli/folder.ts --all [--filter-food=false]');
        console.log('');
        console.log('옵션:');
        console.log('  --managed=true/false     : 관리 폴더 여부 (기본값: false)');
        console.log('  --filter-food=true/false : 비음식점 필터링 (기본값: true)');
        process.exit(1);
    }

    await sql.end();
}

main();
