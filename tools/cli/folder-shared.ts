/**
 * 네이버 폴더 관련 공통 로직
 */
import { sql, toDate } from '../shared/db';
import { apiClient } from '../shared/api';
import { Bookmark, FolderInfo } from '../shared/types';

/**
 * 네이버 폴더 API 호출
 */
export async function fetchFolderData(shareId: string) {
    const url = `https://pages.map.naver.com/save-pages/api/maps-bookmark/v3/shares/${shareId}/bookmarks?start=0&limit=5000&sort=lastUseTime&createIdNo=false`;
    const response = await apiClient.get(url);
    return response.data;
}

/**
 * DB에 저장된 장소와 크롤링이 필요한 장소 분류
 */
export async function classifyPlaces(bookmarks: Bookmark[], folderId: number) {
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
export async function syncFolderToDb(folder: FolderInfo, places: Bookmark[], sourceUrl: string, managed: boolean = false) {
    // 1. 폴더 정보 저장
    await sql`
        INSERT INTO public.tbl_naver_folder (
            folder_id, share_id, name, memo, last_use_time, creation_time, url, follow_count, view_count, managed
        ) VALUES (
            ${folder.folderId}, ${folder.shareId}, ${folder.name}, ${folder.memo ?? null},
            ${toDate(folder.lastUseTime)}, ${toDate(folder.creationTime)}, ${sourceUrl},
            ${folder.followCount || 0}, ${folder.viewCount || 0}, ${managed}
        )
        ON CONFLICT (folder_id) DO UPDATE SET
            name = EXCLUDED.name, memo = EXCLUDED.memo, managed = EXCLUDED.managed, updated_at = NOW()
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
