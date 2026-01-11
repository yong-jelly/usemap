/**
 * 네이버 지도 공유 폴더(Folder) 크롤러 CLI
 * 
 * 사용법: bun run tools/cli/folder.ts <shareId_또는_URL>
 */

import { sql, toDate } from '../shared/db';
import { apiClient } from '../shared/api';
import { extractShareId } from '../shared/utils';
import { Bookmark, FolderInfo } from '../shared/types';
import { crawlAndSyncPlaces } from './place';

/**
 * 네이버 폴더 API 호출
 */
async function fetchFolderData(shareId: string) {
    const url = `https://pages.map.naver.com/save-pages/api/maps-bookmark/v3/shares/${shareId}/bookmarks?start=0&limit=5000&sort=lastUseTime&createIdNo=false`;
    const response = await apiClient.get(url);
    return response.data;
}

/**
 * DB에 저장된 장소와 크롤링이 필요한 장소 분류
 */
async function classifyPlaces(bookmarks: Bookmark[], folderId: number) {
    const sids = bookmarks.map(b => b.sid);
    if (sids.length === 0) return { alreadyInPlace: [], needCrawl: [] };

    // 1. 해당 폴더에 이미 연결된 장소 제외
    const existingInFolder = await sql`
        SELECT place_id FROM public.tbl_naver_folder_place
        WHERE folder_id = ${folderId} AND place_id = ANY(${sids})
    `;
    const folderSet = new Set(existingInFolder.map(r => String(r.place_id)));
    const notInFolder = bookmarks.filter(b => !folderSet.has(b.sid));

    if (notInFolder.length === 0) return { alreadyInPlace: [], needCrawl: [] };

    // 2. tbl_place에 이미 존재하는지 확인
    const notInFolderSids = notInFolder.map(b => b.sid);
    const existingInPlace = await sql`
        SELECT id FROM public.tbl_place WHERE id = ANY(${notInFolderSids})
    `;
    const placeSet = new Set(existingInPlace.map(r => String(r.id)));

    const alreadyInPlace = notInFolder.filter(b => placeSet.has(b.sid));
    const needCrawl = notInFolder.filter(b => !placeSet.has(b.sid));

    return { alreadyInPlace, needCrawl };
}

/**
 * 폴더 메타데이터 및 장소 관계 UPSERT
 */
async function syncFolderToDb(folder: FolderInfo, places: Bookmark[], sourceUrl: string) {
    // 1. 폴더 정보 저장
    await sql`
        INSERT INTO public.tbl_naver_folder (
            folder_id, share_id, name, memo, last_use_time, creation_time, url, follow_count, view_count
        ) VALUES (
            ${folder.folderId}, ${folder.shareId}, ${folder.name}, ${folder.memo ?? null},
            ${toDate(folder.lastUseTime)}, ${toDate(folder.creationTime)}, ${sourceUrl},
            ${folder.followCount || 0}, ${folder.viewCount || 0}
        )
        ON CONFLICT (folder_id) DO UPDATE SET
            name = EXCLUDED.name, memo = EXCLUDED.memo, updated_at = NOW()
    `;

    // 2. 폴더-장소 관계 저장
    if (places.length > 0) {
        const relationRows = places.map(p => ({
            folder_id: folder.folderId,
            place_id: p.sid
        }));
        await sql`
            INSERT INTO public.tbl_naver_folder_place ${sql(relationRows)}
            ON CONFLICT DO NOTHING
        `;
    }
}

async function main() {
    const args = process.argv.slice(2);
    if (args.length === 0) {
        console.log('사용법: bun run tools/cli/folder.ts <shareId 또는 URL>');
        process.exit(1);
    }

    const input = args[0];
    const shareId = extractShareId(input);
    const sourceUrl = input.startsWith('http') ? input : `https://map.naver.com/p/favorite/folder/${shareId}`;

    try {
        console.log(`[폴더] 데이터 조회 중... (shareId: ${shareId})`);
        const data = await fetchFolderData(shareId);
        const folder: FolderInfo = { ...data.folder, shareId };
        const bookmarks: Bookmark[] = data.bookmarkList.filter((b: any) => b.type === 'place');

        console.log(`-----------------------------------------`);
        console.log(`폴더명: ${folder.name}`);
        console.log(`장소수: ${bookmarks.length}개`);
        console.log(`-----------------------------------------`);

        // DB 분류 및 동기화
        const { alreadyInPlace, needCrawl } = await classifyPlaces(bookmarks, folder.folderId);
        console.log(`- 기존 DB 존재: ${alreadyInPlace.length}건`);
        console.log(`- 신규 크롤링 필요: ${needCrawl.length}건`);

        let newlySyncedIds: string[] = [];
        if (needCrawl.length > 0) {
            newlySyncedIds = await crawlAndSyncPlaces(needCrawl.map(b => b.sid));
        }

        const finalIdsToLink = new Set([...alreadyInPlace.map(b => b.sid), ...newlySyncedIds]);
        const bookmarksToLink = bookmarks.filter(b => finalIdsToLink.has(b.sid));

        await syncFolderToDb(folder, bookmarksToLink, sourceUrl);
        console.log(`✅ 동기화 완료 (${bookmarksToLink.length}개 장소 연결)`);

    } catch (err: any) {
        console.error('❌ 오류 발생:', err.message);
    } finally {
        await sql.end();
    }
}

main();
