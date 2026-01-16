/**
 * 네이버 공유 폴더의 장소들을 특정 사용자의 서비스 내 폴더(tbl_folder)로 임포트하는 CLI
 * 
 * 사용법: bun run tools/cli/folder-user.ts <shareId_또는_URL> --user_id=<auth_user_id> --folder_id=<target_folder_id>
 */

import { sql } from '../shared/db';
import { extractShareId } from '../shared/utils';
import { Bookmark } from '../shared/types';
import { crawlAndSyncPlaces } from './place';
import { fetchFolderData } from './folder-shared';

async function main() {
    const args = process.argv.slice(2);
    
    // 인자 파싱 (단순 구현)
    let input = '';
    let userId = '';
    let folderId = '';

    for (const arg of args) {
        if (arg.startsWith('--user_id=')) {
            userId = arg.split('=')[1];
        } else if (arg.startsWith('--folder_id=')) {
            folderId = arg.split('=')[1];
        } else if (!arg.startsWith('--')) {
            input = arg;
        }
    }

    if (!input || !userId || !folderId) {
        console.error('❌ 필수 인자가 누락되었습니다.');
        console.log('사용법: bun run tools/cli/folder-user.ts <shareId_또는_URL> --user_id=<auth_user_id> --folder_id=<target_folder_id>');
        process.exit(1);
    }

    const shareId = extractShareId(input);
    if (!shareId) {
        console.error('❌ 유효한 share_id를 찾을 수 없습니다. share_id가 없거나 공개로 설정되어야 합니다.');
        process.exit(1);
    }

    console.log('[진행 과정]');
    console.log('1. 네이버 폴더 유효성 검사');
    console.log('2. 사용자 ID 존재 여부 검사');
    console.log('3. 폴더 ID 존재/소유 여부 검사');
    console.log('4. 장소 목록 확인 및 필요 시 크롤링');
    console.log('5. 폴더-장소 관계 Insert Only 적용');
    console.log('6. place_count 갱신');
    console.log('-----------------------------------------');

    try {
        console.log('진행 2/6: 사용자 ID 존재 여부 검사 중...');
        const [userExists] = await sql`
            SELECT 1 FROM public.tbl_user_profile WHERE auth_user_id = ${userId}
        `;
        if (!userExists) {
            console.error(`❌ 해당 사용자 ID가 존재하지 않습니다: ${userId}`);
            process.exit(1);
        }
        console.log('완료 2/6: 사용자 ID 확인 완료');

        console.log('진행 3/6: 폴더 ID 존재/소유 여부 검사 중...');
        const [folderExists] = await sql`
            SELECT id, title FROM public.tbl_folder WHERE id = ${folderId} AND owner_id = ${userId}
        `;
        if (!folderExists) {
            console.error(`❌ 해당 폴더 ID가 존재하지 않거나 사용자의 소유가 아닙니다: ${folderId}`);
            process.exit(1);
        }
        console.log('완료 3/6: 폴더 ID 확인 완료');

        console.log('진행 1/6: 네이버 폴더 유효성 검사 및 데이터 조회 중...');
        const data = await fetchFolderData(shareId);
        if (!data || !data.folder) {
            console.error('❌ 네이버 폴더 정보를 가져올 수 없습니다. 비공개 폴더인지 확인해주세요.');
            process.exit(1);
        }
        console.log('완료 1/6: 네이버 폴더 유효성 확인 완료');

        const bookmarks: Bookmark[] = data.bookmarkList.filter((b: any) => b.type === 'place');
        console.log(`-----------------------------------------`);
        console.log(`네이버 폴더명: ${data.folder.name}`);
        console.log(`대상 서비스 폴더: ${folderExists.title}`);
        console.log(`장소수: ${bookmarks.length}개`);
        console.log(`-----------------------------------------`);

        if (bookmarks.length === 0) {
            console.log('연결할 장소가 없습니다.');
            return;
        }

        console.log('진행 4/6: 장소 목록 확인 및 크롤링 준비 중...');
        const sids = bookmarks.map(b => b.sid);
        const existingPlaces = await sql`
            SELECT id FROM public.tbl_place WHERE id = ANY(${sids})
        `;
        const existingSet = new Set(existingPlaces.map(r => String(r.id)));
        const needCrawlSids = sids.filter(sid => !existingSet.has(sid));

        let newlySyncedIds: string[] = [];
        if (needCrawlSids.length > 0) {
            console.log(`- 신규 크롤링 필요: ${needCrawlSids.length}건`);
            newlySyncedIds = await crawlAndSyncPlaces(needCrawlSids);
        }

        const finalIdsToLink = [...new Set([...existingPlaces.map(r => String(r.id)), ...newlySyncedIds])];
        console.log('완료 4/6: 장소 목록 확보 완료');

        console.log('진행 5/6: 폴더-장소 관계 Insert Only 적용 중...');
        if (finalIdsToLink.length > 0) {
            const existingRelations = await sql`
                SELECT place_id
                FROM public.tbl_folder_place
                WHERE folder_id = ${folderId}
                  AND user_id = ${userId}
                  AND place_id = ANY(${finalIdsToLink})
            `;
            const existingRelationSet = new Set(existingRelations.map(r => String(r.place_id)));
            const newIdsToInsert = finalIdsToLink.filter(pid => !existingRelationSet.has(pid));

            if (newIdsToInsert.length === 0) {
                console.log('이미 모든 장소가 폴더에 연결되어 있습니다.');
            } else {
                console.log(`[DB] ${newIdsToInsert.length}개 신규 장소를 폴더에 연결 중...`);

                const relationRows = newIdsToInsert.map(pid => ({
                    folder_id: folderId,
                    user_id: userId,
                    place_id: pid
                }));

                await sql`
                    INSERT INTO public.tbl_folder_place ${sql(relationRows)}
                `;

                console.log(`✅ 임포트 완료 (${newIdsToInsert.length}개 신규 장소 연결)`);
            }
        } else {
            console.log('연결할 수 있는 유효한 장소가 없습니다.');
        }

        console.log('완료 5/6: 폴더-장소 연결 처리 완료');

        // 6. place_count 갱신 (UI 표시용)
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
        console.log(`✅ place_count 갱신 완료 (${countRow?.cnt || 0}개)`);
        console.log('완료 6/6: place_count 갱신 완료');

    } catch (err: any) {
        console.error('❌ 오류 발생:', err.message);
    } finally {
        await sql.end();
    }
}

main();
