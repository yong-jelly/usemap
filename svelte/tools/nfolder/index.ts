/*
-- 최신 폴더 ID 조회
select folder_id from tbl_naver_folder order by created_at desc limit 1;

-- 해당 폴더의 장소 데이터 삭제
delete from tbl_naver_folder_place where folder_id = (select folder_id from tbl_naver_folder order by created_at desc limit 1);

-- 해당 폴더 삭제
delete from tbl_naver_folder where folder_id = (select folder_id from tbl_naver_folder order by created_at desc limit 1);

bun i postgres --no-save
export DATABASE_URL=postgres://postgres.xyqpggpilgcdsawuvpzn:ZNDqDunnaydr0aFQ@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres
*/
/*
drop table if exists public.tbl_naver_folder_place;
drop table if exists public.tbl_naver_folder;


-- 1. 폴더 메타데이터 테이블 (필수 필드만)
-- 수정: 테이블 정의 내 INDEX 구문 제거
CREATE TABLE public.tbl_naver_folder (
    folder_id BIGINT PRIMARY KEY,
    share_id VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    memo TEXT,
    last_use_time TIMESTAMPTZ,
    creation_time TIMESTAMPTZ NOT NULL,
    follow_count INTEGER DEFAULT 0,
    view_count INTEGER DEFAULT 0,
    url VARCHAR(2048),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 2. 폴더-장소 관계 테이블 (many-to-many, sid만 반영)
-- 수정: 테이블 정의 내 INDEX 구문 제거
CREATE TABLE public.tbl_naver_folder_place (
    folder_id BIGINT NOT NULL,
    place_id VARCHAR(255) NOT NULL,
    PRIMARY KEY (folder_id, place_id),
    FOREIGN KEY (folder_id) REFERENCES public.tbl_naver_folder(folder_id) ON DELETE CASCADE,
    FOREIGN KEY (place_id) REFERENCES public.tbl_place(id) ON DELETE CASCADE
);


-- 3. 인덱스 생성 (별도 구문으로 분리)
-- 이것이 PostgreSQL의 표준 방식입니다.
CREATE INDEX idx_folder_name ON public.tbl_naver_folder (name);
CREATE INDEX idx_folder_creation_time ON public.tbl_naver_folder (creation_time);

CREATE INDEX idx_folder_place_folder_id ON public.tbl_naver_folder_place (folder_id);
CREATE INDEX idx_folder_place_place_id ON public.tbl_naver_folder_place (place_id);


*/
/*
url 기본 구조
id 인자 값 예시 : 5b2b954792f34810aff8c7efcbfd3c39
https://pages.map.naver.com/save-pages/api/maps-bookmark/v3/shares/{id}/bookmarks?start=0&limit=5000&sort=lastUseTime&createIdNo=false

응답값 구조
{
  "folder": {
    "folderId": 67188075,
    "name": "백반기행 맛집지도-3편",
    "memo": "허영만의 백반기행 101회에서 150회까지 방영목록.",
    "lastUseTime": 1651324578000,
    "creationTime": 1651126726000
  },
  "bookmarkList": [
    {
      "type": "place",
      "sid": "1411433545"
    }
  ]
}
*/
/*

*/

// -------------------- TypeScript 구현 --------------------
// bun run tools/nfolder/index.ts <shareId>
// 예) bun run tools/nfolder/index.ts 5b2b954792f34810aff8c7efcbfd3c39

import axios from 'axios';
// @ts-ignore – bun 환경에서는 타입 미설치 가능성
import postgres from 'postgres';
import { crawlAndExtractValidIds } from '../crawler/cli';

interface Bookmark {
    type: string;
    sid: string;
}

interface FolderInfo {
    folderId: number;
    shareId: string;
    name: string;
    memo?: string;
    lastUseTime?: number; // epoch ms
    creationTime?: number; // epoch ms
    followCount?: number;
    viewCount?: number;
}

interface FolderApiResponse {
    folder: FolderInfo;
    bookmarkList: Bookmark[];
}
let url = '';
// API 호출 → 폴더 + 북마크 목록 가져오기
async function fetchFolderBookmarks(shareId: string): Promise<FolderApiResponse> {
    url = `https://pages.map.naver.com/save-pages/api/maps-bookmark/v3/shares/${shareId}/bookmarks?start=0&limit=5000&sort=lastUseTime&createIdNo=false`;
    console.log(url);
    const response = await axios.get(url, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 30000,
    });
    return response.data as FolderApiResponse;
}

// Postgres 연결 (DATABASE_URL 이 있으면 사용)
function getSqlClient() {
    return process.env.DATABASE_URL
        ? postgres(process.env.DATABASE_URL)
        : postgres({
              host: process.env.PGHOST || 'localhost',
              port: +(process.env.PGPORT || 5432),
              user: process.env.PGUSER || 'postgres',
              password: process.env.PGPASSWORD || '',
              database: process.env.PGDATABASE || 'postgres',
          });
}

// epoch(ms) → Date | null 변환 헬퍼
const toDate = (ms?: number) => (ms ? new Date(ms) : null);

// values -> '{val1,val2}' 형식의 Postgres array literal 생성
const pgArray = (vals: string[]) => `{${vals.join(',')}}`;

// 분류 로직: 폴더에 아직 없는 북마크를 두 그룹으로 분리
// 1) alreadyInPlace    : tbl_place 에 이미 존재 → 바로 tbl_naver_folder 에 넣으면 됨
// 2) needCrawl         : tbl_place 에도 없어서 크롤링 필요
async function classifyBookmarks(places: Bookmark[], folderId: number, sql: any) {
    const sids = places.map((p) => p.sid);
    if (sids.length === 0) return { alreadyInPlace: [] as Bookmark[], needCrawl: [] as Bookmark[] };

    // a. tbl_naver_folder 에 존재하는 항목 먼저 제외
    const existingInFolder = await sql<{ place_id: string }[]>`
        SELECT DISTINCT place_id
        FROM public.tbl_naver_folder_place
        WHERE folder_id = ${folderId} AND place_id = ANY(${pgArray(sids)}::text[])
    `;
    const folderSet = new Set(existingInFolder.map((r: { place_id: string }) => String(r.place_id)));
    // tbl_naver_folder 에 존재하지 않는 항목 추출
    const notInFolder = places.filter((p) => !folderSet.has(p.sid));
    // tbl_naver_folder에 모두 포함되어 있다면 tbl_place에도 존재하므로 크롤링 필요 없음
    if (notInFolder.length === 0) {
        return { alreadyInPlace: [], needCrawl: [] };
    }

    const notInFolderSids = notInFolder.map((p) => p.sid);

    // b. tbl_place 에 존재 여부 확인
    const existingInPlaceRows = await sql<{ id: string }[]>`
        SELECT id
        FROM public.tbl_place
        WHERE id = ANY(${pgArray(notInFolderSids)}::text[])
    `;
    const placeSet = new Set(existingInPlaceRows.map((r: { id: string }) => String(r.id)));

    const alreadyInPlace = notInFolder.filter((p) => placeSet.has(p.sid));
    const needCrawl = notInFolder.filter((p) => !placeSet.has(p.sid));

    return { alreadyInPlace, needCrawl };
}

// 북마크(place) → tbl_naver_folder UPSERT
async function upsertBookmarks(folder: FolderInfo, places: Bookmark[], sqlInstance?: any) {
    const sql = sqlInstance ?? getSqlClient();

    // 1) 폴더 메타데이터 upsert
    await sql`
        INSERT INTO public.tbl_naver_folder (
            folder_id, share_id, name, memo, last_use_time, creation_time, url, follow_count, view_count
        ) VALUES (
            ${folder.folderId},
            ${folder.shareId},
            ${folder.name},
            ${folder.memo ?? null},
            ${toDate(folder.lastUseTime)},
            ${toDate(folder.creationTime)},
            ${url},
            ${folder.followCount},
            ${folder.viewCount}
        )
        ON CONFLICT (folder_id) DO UPDATE
        SET
            share_id = EXCLUDED.share_id,
            name = EXCLUDED.name,
            memo = EXCLUDED.memo,
            last_use_time = EXCLUDED.last_use_time,
            creation_time = EXCLUDED.creation_time,
            follow_count = EXCLUDED.follow_count,
            view_count = EXCLUDED.view_count,
            url = EXCLUDED.url,
            updated_at = timezone('utc', now());
    `;

    // 2) 폴더-장소 관계 upsert
    for (const bm of places) {
        await sql`
            INSERT INTO public.tbl_naver_folder_place (
                folder_id, place_id
            ) VALUES (
                ${folder.folderId},
                ${bm.sid}
            )
            ON CONFLICT (folder_id, place_id) DO NOTHING;
        `;
    }

    if (!sqlInstance) {
        await sql.end();
    }
}

// -------------------- 단일 ShareId 처리 함수 --------------------
async function handleShareId(shareId: string, sql: any) {
    console.log(`\n===== [${shareId}] 폴더 처리 시작 =====`);

    const data = await fetchFolderBookmarks(shareId);
    const placeBookmarks = data.bookmarkList.filter((b) => b.type === 'place');

    console.log(`folder.name: ${data.folder.name} | memo: ${data.folder.memo}`);
    if (placeBookmarks.length === 0) {
        console.log('place 타입 북마크가 없습니다.');
        // 폴더 메타데이터만 upsert (관계는 없음)
        await upsertBookmarks(data.folder, [], sql);
        return;
    }

    console.log(`총 북마크 ${placeBookmarks.length}건 수신 - 분류 시작`);

    const { alreadyInPlace, needCrawl } = await classifyBookmarks(placeBookmarks, data.folder.folderId, sql);

    console.log(`a) tbl_naver_folder 미포함 + tbl_place 존재 ${alreadyInPlace.length}건`);
    console.log(`b) tbl_place 도 없어 크롤링 필요한 건수 ${needCrawl.length}건`);

    // b 단계 처리 – 크롤링 및 tbl_place upsert
    let crawledValidIds: string[] = [];
    if (needCrawl.length > 0) {
        crawledValidIds = await crawlAndExtractValidIds(needCrawl.map((b) => b.sid), sql);
        console.log(`크롤링 성공/삽입한 ID ${crawledValidIds.length}건`, crawledValidIds);
    }

    // 업서트 대상 = alreadyInPlace + (크롤링 성공 ID)
    const idsToInsertSet = new Set<string>([...alreadyInPlace.map((b) => b.sid), ...crawledValidIds]);
    const bookmarksToInsert = placeBookmarks.filter((b) => idsToInsertSet.has(b.sid));

    if (bookmarksToInsert.length === 0) {
        console.log('tbl_naver_folder_place 에 새로 추가할 항목이 없습니다. 폴더 메타데이터만 업서트합니다.');
    }

    await upsertBookmarks(data.folder, bookmarksToInsert, sql);
    console.log(`tbl_naver_folder_place 업서트 완료: ${bookmarksToInsert.length}건`);
}

// -------------------- CLI 진입점 --------------------
(async () => {
    const args = process.argv.slice(2);
    if (args.length === 0) {
        console.log('사용법: bun run tools/nfolder/index.ts shareId1,shareId2,...');
        process.exit(1);
    }

    // 첫 번째 인자를 콤마(,)로 분리하여 다중 shareId 지원
    const shareIds = args[0]
        .split(',')
        .map((id) => id.trim())
        .filter((id) => id.length > 0);

    if (shareIds.length === 0) {
        console.log('유효한 shareId 가 없습니다.');
        process.exit(1);
    }

    const sql = getSqlClient() as any;

    try {
        for (const shareId of shareIds) {
            try {
                await handleShareId(shareId, sql);
            } catch (err) {
                console.error(`shareId '${shareId}' 처리 중 오류 발생:`, err);
            }
        }
    } finally {
        await sql.end();
    }
})();


/*
https://campaign.nbilly.naver.com/myplace/year-end-spots2023
https://www.placedict.com/
https://map.naver.com/p/favorite/FwBLJOnWeRkKngPa:K_LK8JgRCqMOafWxr_4u4PGBjEHpyw?c=6.00,0,0,0,dh
*/
