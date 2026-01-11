/**
 * 장소 크롤링 대기열(Queue) 처리 CLI
 * 
 * 사용법: bun run tools/cli/queue.ts [limit]
 * - limit: 한 번에 처리할 최대 항목 수 (기본값: 10)
 */

import { sql } from '../shared/db';
import { crawlAndSyncPlaces } from './place';
import { sleep } from '../shared/utils';

/**
 * DB에 크롤링 결과 저장 및 큐 상태 업데이트
 */
async function processQueueItem(item: any) {
    const startTime = new Date();
    const placeId = item.id;
    
    console.log(`[큐] 처리 시작: ${placeId} (${item.name})`);

    try {
        // 1. 상태를 PROCESSING으로 변경
        await sql`
            UPDATE public.tbl_place_queue 
            SET status = 'PROCESSING', updated_at = NOW() 
            WHERE id = ${placeId}
        `;

        // 2. 크롤링 및 DB 동기화 (place.ts의 공통 로직 활용)
        const syncedIds = await crawlAndSyncPlaces([placeId]);
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
    const limit = args[0] ? parseInt(args[0], 10) : 10;

    try {
        console.log(`[큐] 대기열 처리 시작 (최대 ${limit}건)`);

        // 1. PENDING 상태인 항목 가져오기
        const pendingItems = await sql`
            SELECT * FROM public.tbl_place_queue 
            WHERE status = 'PENDING' 
            ORDER BY created_at ASC 
            LIMIT ${limit}
        `;

        if (pendingItems.length === 0) {
            console.log('[큐] 처리할 대기 항목이 없습니다.');
            return;
        }

        console.log(`[큐] 총 ${pendingItems.length}건의 항목을 발견했습니다.`);

        // 2. 순차적으로 처리 (동시성 제어가 필요한 경우 수정 가능)
        for (const item of pendingItems) {
            await processQueueItem(item);
            // 각 항목 처리 사이 약간의 간격
            await sleep(500);
        }

        console.log('✅ 모든 작업 완료');

    } catch (err: any) {
        console.error('❌ 실행 중 오류:', err.message);
    } finally {
        await sql.end();
    }
}

main();
