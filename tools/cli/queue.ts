/**
 * 장소 크롤링 대기열(Queue) 처리 CLI
 * 
 * 사용법: bun run tools/cli/queue.ts [limit] [--poll]
 * - limit: 한 번에 처리할 최대 항목 수 (기본값: 10)
 * - --poll: 데이터가 없을 경우 3초마다 폴링하며 대기
 */

import { sql } from '../shared/db';
import { crawlAndSyncPlaces, type CrawlProgress } from './place';
import { sleep } from '../shared/utils';

/**
 * DB에 크롤링 결과 저장 및 큐 상태 업데이트
 */
async function processQueueItem(item: any, progress?: CrawlProgress) {
    const startTime = new Date();
    const placeId = item.id;
    
    const progressStr = progress ? `(${progress.current}/${progress.total}) ` : '';
    console.log(`[큐] ${progressStr}처리 시작: ${placeId} (${item.name})`);

    try {
        // 1. 상태를 PROCESSING으로 변경
        await sql`
            UPDATE public.tbl_place_queue 
            SET status = 'PROCESSING', updated_at = NOW() 
            WHERE id = ${placeId}
        `;

        // 2. 크롤링 및 DB 동기화 (place.ts의 공통 로직 활용)
        const syncedIds = await crawlAndSyncPlaces([placeId], progress);
        const isSuccess = syncedIds.length > 0;

        const endTime = new Date();
        const durationMs = endTime.getTime() - startTime.getTime();

        if (!isSuccess) {
            throw new Error('크롤링 결과가 없거나 유효하지 않은 카테고리입니다.');
        }

        // 3. 성공 시: 큐 상태 SUCCESS 변경
        await sql`
            UPDATE public.tbl_place_queue 
            SET status = 'SUCCESS', updated_at = NOW() 
            WHERE id = ${placeId}
        `;

        // 로그 기록
        await sql`
            INSERT INTO public.tbl_crw_log (place_id, status, start_time, end_time, duration_ms)
            VALUES (${placeId}, 'SUCCESS', ${startTime}, ${endTime}, ${durationMs})
        `;

        console.log(`[큐] 성공: ${placeId}`);

    } catch (error: any) {
        const endTime = new Date();
        const durationMs = endTime.getTime() - startTime.getTime();
        const newRetryCount = (item.retry_count || 0) + 1;
        const isStopped = newRetryCount >= (item.retry_limit || 5);
        const newStatus = isStopped ? 'STOPPED' : 'FAILED';

        console.error(`[큐] 실패: ${placeId} - ${error.message}`);

        await sql`
            UPDATE public.tbl_place_queue 
            SET 
                status = ${newStatus}, 
                retry_count = ${newRetryCount}, 
                error_message = ${error.message},
                updated_at = NOW() 
            WHERE id = ${placeId}
        `;

        // 로그 기록
        await sql`
            INSERT INTO public.tbl_crw_log (place_id, status, error_message, start_time, end_time, duration_ms)
            VALUES (${placeId}, 'FAILED', ${error.message}, ${startTime}, ${endTime}, ${durationMs})
        `;
    }
}

async function main() {
    const args = process.argv.slice(2);
    const limit = args.find(arg => !arg.startsWith('--')) ? parseInt(args.find(arg => !arg.startsWith('--'))!, 10) : 10;
    const isPolling = args.includes('--poll');

    try {
        console.log(`[큐] 대기열 처리 시작 (최대 ${limit}건, 폴링: ${isPolling ? 'ON' : 'OFF'})`);

        while (true) {
            // 1. PENDING 상태인 항목 가져오기
            const pendingItems = await sql`
                SELECT * FROM public.tbl_place_queue 
                WHERE status = 'PENDING' 
                ORDER BY created_at ASC 
                LIMIT ${limit}
            `;

            if (pendingItems.length === 0) {
                if (!isPolling) {
                    console.log('[큐] 처리할 대기 항목이 없습니다.');
                    break;
                }
                // 폴링 모드인 경우 3초 대기 후 다시 확인
                process.stdout.write('.'); // 대기 중임을 표시
                await sleep(3000);
                continue;
            }

            console.log(`\n[큐] 총 ${pendingItems.length}건의 항목을 발견했습니다.`);

            // 2. 순차적으로 처리
            for (let i = 0; i < pendingItems.length; i++) {
                const item = pendingItems[i];
                await processQueueItem(item, { current: i + 1, total: pendingItems.length });
                await sleep(500);
            }

            if (!isPolling) {
                console.log('✅ 모든 작업 완료');
                break;
            }
            
            console.log('[큐] 현재 배치 완료, 다음 항목 확인 중...');
            await sleep(1000);
        }

    } catch (err: any) {
        console.error('❌ 실행 중 오류:', err.message);
    } finally {
        await sql.end();
    }
}

main();
