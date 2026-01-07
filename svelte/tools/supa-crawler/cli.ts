// cli.ts
import { crawlForPlace } from './crawler';
import { upsertBucket, upsertPlace, upsertBookmarks, crawlAndExtractValidIds } from './database';
import { fetchFolderBookmarks, classifyBookmarks } from './naver-folder';

const args = process.argv.slice(2);

function showUsage(): void {
  console.log('사용법:');
  console.log('  플레이스 크롤링: bun run cli.ts <placeId1> <placeId2> ...');
  console.log('  폴더 크롤링: bun run cli.ts folder <shareId>');
  console.log('');
  console.log('예시:');
  console.log('  bun run cli.ts 1732989163 2017243702');
  console.log('  bun run cli.ts folder 5b2b954792f34810aff8c7efcbfd3c39');
  console.log('');
  console.log('환경 변수:');
  console.log('  SUPABASE_URL - Supabase 프로젝트 URL');
  console.log('  SUPABASE_ANON_KEY - Supabase anon key');
  console.log('  또는');
  console.log('  DATABASE_URL - PostgreSQL 연결 문자열');
}

async function handlePlaceCrawling(placeIds: string[]): Promise<void> {
  console.log('플레이스 크롤링 시작:', placeIds);
  
  try {
    const details = await crawlForPlace(placeIds);
    console.log(`크롤링 완료: ${details.length}건`);
    
    await upsertBucket(details);
    console.log('버킷 데이터 업서트 완료');
    
    await upsertPlace(details);
    console.log('플레이스 데이터 업서트 완료');
    
  } catch (error) {
    console.error('플레이스 크롤링 오류:', error);
    throw error;
  }
}

async function handleFolderCrawling(shareId: string): Promise<void> {
  console.log('폴더 크롤링 시작:', shareId);
  
  try {
    const result = await fetchFolderBookmarks(shareId);
    const data = result.data;
    const url = result.url;
    const placeBookmarks = data.bookmarkList.filter((b) => b.type === 'place');

    console.log(`폴더명: ${data.folder.name}`);
    console.log(`메모: ${data.folder.memo || '없음'}`);
    
    if (placeBookmarks.length === 0) {
      console.log('place 타입 북마크가 없습니다.');
      return;
    }

    console.log(`총 북마크 ${placeBookmarks.length}건 수신 – 분류 시작`);

    const { alreadyInPlace, needCrawl } = await classifyBookmarks(
      placeBookmarks, 
      data.folder.folderId
    );

    console.log(`a) tbl_naver_folder 미포함 + tbl_place 존재: ${alreadyInPlace.length}건`);
    console.log(`b) tbl_place 도 없어 크롤링 필요: ${needCrawl.length}건`);

    // 크롤링이 필요한 경우
    let crawledValidIds: string[] = [];
    if (needCrawl.length > 0) {
      console.log('크롤링 시작...');
      crawledValidIds = await crawlAndExtractValidIds(needCrawl.map((b) => b.sid));
      console.log(`크롤링 성공/삽입한 ID: ${crawledValidIds.length}건`);
    }

    // 업서트 대상 결정
    const idsToInsertSet = new Set<string>([
      ...alreadyInPlace.map((b) => b.sid), 
      ...crawledValidIds
    ]);

    if (idsToInsertSet.size === 0) {
      console.log('tbl_naver_folder 에 새로 추가할 항목이 없습니다.');
      return;
    }

    const bookmarksToInsert = placeBookmarks.filter((b) => idsToInsertSet.has(b.sid));
    await upsertBookmarks(data.folder, bookmarksToInsert, url);
    console.log(`tbl_naver_folder 업서트 완료: ${bookmarksToInsert.length}건`);
    
  } catch (error) {
    console.error('폴더 크롤링 오류:', error);
    throw error;
  }
}

async function main(): Promise<void> {
  if (args.length === 0) {
    showUsage();
    process.exit(1);
  }

  try {
    if (args[0] === 'folder') {
      if (args.length < 2) {
        console.error('폴더 크롤링에는 shareId가 필요합니다.');
        showUsage();
        process.exit(1);
      }
      await handleFolderCrawling(args[1]);
    } else {
      await handlePlaceCrawling(args);
    }
    
    console.log('처리 완료');
  } catch (error) {
    console.error('오류 발생:', error);
    process.exit(1);
  }
}

main().catch(console.error);
