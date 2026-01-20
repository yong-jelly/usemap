/**
 * 장소 크롤링 대기열(Queue) 처리 CLI
 * 
 * 사용법: bun run tools/cli/queue.ts [--batch=10] [--poll]
 * - --batch=N: N개씩 묶어서 bulk 크롤링 (기본값: 10)
 * - --poll   : 데이터가 없을 경우 3초마다 폴링하며 대기
 * 
 * 예시:
 *   - bun run tools/cli/queue.ts --batch=20         # 20개씩 bulk 처리
 *   - bun run tools/cli/queue.ts --batch=10 --poll  # 10개씩 bulk 처리 + 폴링
 */

import { sql } from '../shared/db';
import { crawlAndSyncPlaces } from './place';
import { chunkArray, sleep } from '../shared/utils';

/**
 * 배치(bulk) 단위로 크롤링 처리
 * @param items 처리할 큐 아이템 배열
 * @returns 성공/실패 개수
 */
async function processQueueBatch(items: any[], batchIndex: number, totalBatches: number) {
    const startTime = new Date();
    const placeIds = items.map(item => item.id);
    
    console.log(`\n[큐] 배치 ${batchIndex}/${totalBatches} 처리 시작 (${placeIds.length}건)`);
    items.forEach(item => console.log(`  - ${item.id} (${item.name})`));
    
    try {
        // 1. 상태를 PROCESSING으로 일괄 변경
        await sql`
            UPDATE public.tbl_place_queue 
            SET status = 'PROCESSING', updated_at = NOW() 
            WHERE id = ANY(${placeIds})
        `;

        // 2. bulk 크롤링 및 DB 동기화 (folder.ts와 동일한 방식)
        const syncedIds = await crawlAndSyncPlaces(placeIds);
        const syncedSet = new Set(syncedIds);

        const endTime = new Date();
        const durationMs = endTime.getTime() - startTime.getTime();

        // 3. 결과에 따라 각 항목 상태 업데이트
        let successCount = 0;
        let failCount = 0;

        for (const item of items) {
            const placeId = item.id;
            const isSuccess = syncedSet.has(placeId);

            if (isSuccess) {
                await sql`
                    UPDATE public.tbl_place_queue 
                    SET status = 'SUCCESS', updated_at = NOW() 
                    WHERE id = ${placeId}
                `;
                await sql`
                    INSERT INTO public.tbl_crw_log (place_id, status, start_time, end_time, duration_ms)
                    VALUES (${placeId}, 'SUCCESS', ${startTime}, ${endTime}, ${durationMs})
                `;
                successCount++;
            } else {
                const newRetryCount = (item.retry_count || 0) + 1;
                const isStopped = newRetryCount >= (item.retry_limit || 5);
                const newStatus = isStopped ? 'STOPPED' : 'FAILED';
                const errorMessage = '크롤링 결과가 없거나 유효하지 않은 카테고리입니다.';

                await sql`
                    UPDATE public.tbl_place_queue 
                    SET 
                        status = ${newStatus}, 
                        retry_count = ${newRetryCount}, 
                        error_message = ${errorMessage},
                        updated_at = NOW() 
                    WHERE id = ${placeId}
                `;
                await sql`
                    INSERT INTO public.tbl_crw_log (place_id, status, error_message, start_time, end_time, duration_ms)
                    VALUES (${placeId}, 'FAILED', ${errorMessage}, ${startTime}, ${endTime}, ${durationMs})
                `;
                failCount++;
            }
        }

        console.log(`[큐] 배치 ${batchIndex}/${totalBatches} 완료: 성공 ${successCount}건, 실패 ${failCount}건 (${durationMs}ms)`);
        return { successCount, failCount };

    } catch (error: any) {
        console.error(`[큐] 배치 ${batchIndex} 전체 실패:`, error.message);
        
        // 전체 배치 실패 시 모든 항목을 FAILED로 처리
        const endTime = new Date();
        const durationMs = endTime.getTime() - startTime.getTime();

        for (const item of items) {
            const newRetryCount = (item.retry_count || 0) + 1;
            const isStopped = newRetryCount >= (item.retry_limit || 5);
            const newStatus = isStopped ? 'STOPPED' : 'FAILED';

            await sql`
                UPDATE public.tbl_place_queue 
                SET 
                    status = ${newStatus}, 
                    retry_count = ${newRetryCount}, 
                    error_message = ${error.message},
                    updated_at = NOW() 
                WHERE id = ${item.id}
            `;
            await sql`
                INSERT INTO public.tbl_crw_log (place_id, status, error_message, start_time, end_time, duration_ms)
                VALUES (${item.id}, 'FAILED', ${error.message}, ${startTime}, ${endTime}, ${durationMs})
            `;
        }

        return { successCount: 0, failCount: items.length };
    }
}

async function main() {
    const args = process.argv.slice(2);
    
    let batchSize = 10;
    let isPolling = false;

    for (const arg of args) {
        if (arg.startsWith('--batch=')) {
            batchSize = parseInt(arg.split('=')[1], 10) || 10;
        } else if (arg === '--poll') {
            isPolling = true;
        }
        // 기존 숫자 옵션은 무시 (--batch가 있으면)
    }

    try {
        console.log(`[큐] 대기열 처리 시작 (bulk 배치 크기: ${batchSize}, 폴링: ${isPolling ? 'ON' : 'OFF'})`);

        while (true) {
            // 1. PENDING 상태인 모든 항목 가져오기
            const pendingItems = await sql`
                SELECT * FROM public.tbl_place_queue 
                WHERE status = 'PENDING' 
                ORDER BY created_at ASC
            `;

            if (pendingItems.length === 0) {
                if (!isPolling) {
                    console.log('[큐] 처리할 대기 항목이 없습니다.');
                    break;
                }
                process.stdout.write('.');
                await sleep(3000);
                continue;
            }

            console.log(`\n[큐] 총 ${pendingItems.length}건의 항목을 발견했습니다. (${batchSize}개씩 bulk 처리)`);

            // 2. batchSize 단위로 나누어 bulk 처리
            const batches = chunkArray(pendingItems, batchSize);
            let totalSuccess = 0;
            let totalFail = 0;

            for (let i = 0; i < batches.length; i++) {
                const batch = batches[i];
                const result = await processQueueBatch(batch, i + 1, batches.length);
                totalSuccess += result.successCount;
                totalFail += result.failCount;
                
                // 배치 간 잠시 대기
                if (i < batches.length - 1) await sleep(1000);
            }

            console.log(`\n[큐] 전체 처리 완료: 성공 ${totalSuccess}건, 실패 ${totalFail}건`);

            if (!isPolling) {
                console.log('✅ 모든 작업 완료');
                break;
            }
            
            console.log('[큐] 다음 항목 확인 중...');
            await sleep(1000);
        }

    } catch (err: any) {
        console.error('❌ 실행 중 오류:', err.message);
    } finally {
        await sql.end();
    }
}

main();
