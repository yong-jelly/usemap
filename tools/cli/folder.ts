/**
 * 네이버 지도 공유 폴더(Folder) 크롤러 CLI
 * 
 * 사용법: bun run tools/cli/folder.ts <shareId_또는_URL>
 */

import { extractShareId } from '../shared/utils';
import { Bookmark, FolderInfo } from '../shared/types';
import { crawlAndSyncPlaces } from './place';
import { classifyPlaces, fetchFolderData, syncFolderToDb } from './folder-shared';

import { sql } from '../shared/db';

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
