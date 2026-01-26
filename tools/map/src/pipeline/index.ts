import { GraphqlClient } from "../graphql/client";
import { MapDatabase } from "../db";
import { DataTransformer } from "../utils/transformer";
import { BoxGenerator } from "../box/generator";

/**
 * 크롤링 전체 흐름을 제어하는 오케스트레이터 클래스
 */
export class CrawlerPipeline {
  private client = new GraphqlClient();
  private db: MapDatabase;
  private startTime: number = Date.now();
  private processedCount: number = 0;
  private totalBoxes: number = 0;
  private currentBoxIndex: number = 0;

  constructor(dbPath?: string) {
    this.db = new MapDatabase(dbPath);
  }

  /**
   * 지정된 초기 영역에서 데이터 수집을 시작합니다.
   * 
   * [알고리즘: 계층적 영역 탐색]
   * 1. 초기 영역을 대형 격자(기본 10km)로 나눕니다.
   * 2. 각 격자별로 DB 상태를 확인하여 이미 완료된 곳은 건너뜁니다.
   * 3. `processBox`를 호출하여 각 격자를 재귀적으로 분석합니다.
   */
  async search(initialBox: string, initialKm: number = 10) {
    this.startTime = Date.now();
    
    // 기존 DB에서 저장된 개수 초기화 (재실행 시 이어하기 지원)
    this.processedCount = this.db.getPlaceCount();
    if (this.processedCount > 0) {
      console.log(`[Pipeline] 기존 데이터 ${this.processedCount}개를 이어서 수집합니다.`);
    }
    
    const boxes = BoxGenerator.generate(initialBox, initialKm);
    this.totalBoxes = boxes.length;
    console.log(`[Pipeline] Generated ${boxes.length} initial boxes.`);

    for (let i = 0; i < boxes.length; i++) {
      this.currentBoxIndex = i + 1;
      const box = boxes[i];
      const status = this.db.getBoxStatus(box) as any;
      if (status && (status.status === "completed" || status.status === "empty")) {
        continue;
      }

      await this.processBox(box, initialKm);
    }
  }

  private getLogPrefix() {
    const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
    const h = Math.floor(elapsed / 3600);
    const m = Math.floor((elapsed % 3600) / 60);
    const s = elapsed % 60;
    const timeStr = `${h}h ${m}m ${s}s`;
    return `[${timeStr}] [Box ${this.currentBoxIndex}/${this.totalBoxes}] [Saved: ${this.processedCount}]`;
  }

  /**
   * 단일 박스 영역을 분석하고 필요 시 하위 영역으로 분할합니다.
   * 
   * [알고리즘: 적응형 밀도 분할(Adaptive Density Splitting)]
   * 1. 현재 영역의 총 음식점 개수(total)를 API로 조회합니다.
   * 2. 결과가 0개면 'empty' 상태로 저장 후 종료합니다.
   * 3. 결과가 250개(API 노출 한계) 이상인 경우:
   *    - `getNextKm`을 통해 현재 밀도에 적합한 하위 격자 크기를 결정합니다.
   *    - 하위 격자들을 생성하고 `processBox`를 재귀 호출합니다.
   * 4. 결과가 250개 미만인 경우:
   *    - 해당 영역의 모든 페이지 데이터를 수집합니다.
   *    - 각 음식점의 상세 정보와 분석 데이터를 추출하여 DB에 저장합니다.
   */
  private async processBox(box: string, km: number) {
    // 이미 완료된 박스는 스킵 (재실행 시 중복 처리 방지)
    const existingStatus = this.db.getBoxStatus(box) as any;
    if (existingStatus && (existingStatus.status === "completed" || existingStatus.status === "empty")) {
      return;
    }
    
    console.log(`${this.getLogPrefix()} Processing box: ${box} (${km}km)`);
    
    // 1. 현재 영역의 데이터 수 조회
    let listData;
    try {
      const listPayload = this.client.getPlacesListQuery("음식점", box, 1, 1);
      listData = await this.client.request(listPayload);
    } catch (e: any) {
      console.error(`${this.getLogPrefix()} Failed to fetch list for box ${box}: ${e.message}`);
      return;
    }
    
    const total = listData?.data?.businesses?.total ?? 0;

    // 데이터가 없는 경우 상태 저장 후 종료
    if (total === 0) {
      this.db.saveBoxStatus(box, "empty", km);
      return;
    }

    // 처리 중 상태를 기록하여 재시작 시 진행 상황을 보존
    this.db.saveBoxStatus(box, "processing", km);

    // 2. 데이터 밀도가 높은 경우 재귀적 분할 수행
    if (total >= 250 && km > 0.1) {
      const nextKm = this.getNextKm(total, km);
      console.log(`${this.getLogPrefix()} Total ${total} >= 250. Refining to ${nextKm}km...`);
      const subBoxes = BoxGenerator.generate(box, nextKm);
      for (const subBox of subBoxes) {
        await this.processBox(subBox, nextKm);
      }
      this.db.saveBoxStatus(box, "completed", km);
      return;
    }

    // 3. 데이터 수집 가능한 범위 내인 경우 실제 데이터 추출
    const endPage = Math.ceil(total / 50);
    const allItems: any[] = [];
    for (let page = 1; page <= endPage; page++) {
      try {
        const p = this.client.getPlacesListQuery("음식점", box, (page - 1) * 50 + 1, 50);
        const d = await this.client.request(p);
        const items = d?.data?.businesses?.items;
        if (items && Array.isArray(items)) {
          allItems.push(...items);
        }
      } catch (e: any) {
        console.error(`${this.getLogPrefix()} Failed to fetch page ${page} for box ${box}: ${e.message}`);
      }
    }

    // 상세 정보 조회 및 DB 저장
    const batchSize = 10;
    for (let i = 0; i < allItems.length; i += batchSize) {
      const batch = allItems.slice(i, i + batchSize);
      try {
        const batchPayload = this.client.getPlacesBatchDetailQuery(batch.map(item => item.id));
        const batchData = await this.client.request(batchPayload);
        
        for (let j = 0; j < batch.length; j++) {
          const item = batch[j];
          const detail = batchData?.data?.[`item${j}`];

          if (!detail) {
            console.warn(`${this.getLogPrefix()} Detail not found for businessId: ${item.id}`);
            continue;
          }

          // 이미 저장된 장소는 스킵 (중복 처리 방지)
          if (this.db.hasPlace(item.id)) {
            continue;
          }

          const placeRow = DataTransformer.toPlaceRow(detail);
          const analysisRow = DataTransformer.toAnalysisRow(detail);

          if (placeRow) {
            this.db.upsertPlace(placeRow);
            this.processedCount++;
            console.log(`${this.getLogPrefix()} Stored: ${item.name} (${item.id})`);
          }
          
          if (analysisRow) {
            this.db.upsertAnalysis(analysisRow);
          }
        }

        // 네이버의 동시 요청 제한(Rate Limit)을 피하기 위해 요청 간 지연 시간 추가
        await new Promise(r => setTimeout(r, 1000));
      } catch (e: any) {
        console.error(`${this.getLogPrefix()} Failed to process batch starting with ${batch[0].id}: ${e.message}`);
        
        // 배치 전체 실패 시 모든 항목을 실패 기록으로 전송
        for (const item of batch) {
          this.db.saveFail({
            business_id: item.id,
            business_name: item.name,
            reason: e.message,
            box: box,
            km: km
          });
        }
      }
    }

    // 해당 박스 처리 완료 상태 저장
    this.db.saveBoxStatus(box, "completed", km);
  }

  /**
   * 현재 발견된 데이터 수에 따라 다음 분할 격자의 크기를 결정합니다.
   * 
   * [정책: 밀도 기반 하향식 km 결정]
   * - 10km 초기 단계:
   *   - 1000개 이상: 매우 밀집 → 1km로 급격히 축소
   *   - 500개 이상: 밀집 → 2km로 축소
   *   - 400개 이상: 보통 → 3km로 축소
   *   - 기타: 5km로 축소
   * - 이후 단계: 미리 정의된 steps 배열에 따라 점진적으로 축소 (최소 0.1km)
   */
  private getNextKm(total: number, currentKm: number): number {
    if (currentKm === 10) {
      if (total >= 1000) return 1;
      if (total >= 500) return 2;
      if (total >= 400) return 3;
      return 5;
    }
    const steps = [10, 5, 4, 3, 2, 1, 0.5, 0.1];
    const idx = steps.indexOf(currentKm);
    return idx !== -1 && idx < steps.length - 1 ? steps[idx + 1] : 0.1;
  }

  /**
   * 실패한 항목들을 재시도합니다.
   * 
   * [알고리즘: 실패 항목 재처리]
   * 1. retry_count < 5인 실패 항목들을 조회합니다.
   * 2. 각 항목에 대해 상세 정보를 다시 요청합니다.
   * 3. 성공 시 tbl_crawl_fail에서 삭제하고 tbl_place에 저장합니다.
   * 4. 실패 시 retry_count를 증가시킵니다.
   * 5. retry_count >= 5인 항목은 영구 스킵됩니다.
   */
  async retryFailed(maxRetry: number = 5) {
    this.startTime = Date.now();
    this.processedCount = this.db.getPlaceCount();
    
    const stats = this.db.getFailStats();
    console.log(`[Retry] 실패 항목 통계:`);
    console.log(`  - 전체: ${stats.total}개`);
    console.log(`  - 재시도 가능: ${stats.retryable}개`);
    console.log(`  - 최대 재시도 초과 (스킵): ${stats.maxedOut}개`);
    
    const failedItems = this.db.getRetryableFailedItems(maxRetry);
    if (failedItems.length === 0) {
      console.log(`[Retry] 재시도할 항목이 없습니다.`);
      return;
    }
    
    this.totalBoxes = failedItems.length;
    console.log(`[Retry] ${failedItems.length}개 항목 재시도를 시작합니다.\n`);

    let successCount = 0;
    let failCount = 0;

    // 배치 처리 (10개씩)
    const batchSize = 10;
    for (let i = 0; i < failedItems.length; i += batchSize) {
      const batch = failedItems.slice(i, i + batchSize);
      this.currentBoxIndex = Math.min(i + batchSize, failedItems.length);

      try {
        const batchPayload = this.client.getPlacesBatchDetailQuery(batch.map(item => item.business_id));
        const batchData = await this.client.request(batchPayload);

        for (let j = 0; j < batch.length; j++) {
          const item = batch[j];
          const detail = batchData?.data?.[`item${j}`];

          if (!detail) {
            console.warn(`${this.getRetryLogPrefix()} [${item.retry_count + 1}회차] 상세 정보 없음: ${item.business_name} (${item.business_id})`);
            this.db.saveFail({
              business_id: item.business_id,
              business_name: item.business_name,
              reason: "상세 정보 없음",
              box: item.box,
              km: item.km
            });
            failCount++;
            continue;
          }

          // 이미 저장된 장소는 실패 목록에서만 제거
          if (this.db.hasPlace(item.business_id)) {
            this.db.removeFail(item.business_id);
            console.log(`${this.getRetryLogPrefix()} [이미 존재] ${item.business_name} (${item.business_id}) - 실패 목록에서 제거`);
            successCount++;
            continue;
          }

          const placeRow = DataTransformer.toPlaceRow(detail);
          const analysisRow = DataTransformer.toAnalysisRow(detail);

          if (placeRow) {
            this.db.upsertPlace(placeRow);
            this.db.removeFail(item.business_id);
            this.processedCount++;
            successCount++;
            console.log(`${this.getRetryLogPrefix()} [성공] ${item.business_name} (${item.business_id})`);
          }

          if (analysisRow) {
            this.db.upsertAnalysis(analysisRow);
          }
        }

        // Rate limit 방지
        await new Promise(r => setTimeout(r, 1000));
      } catch (e: any) {
        console.error(`${this.getRetryLogPrefix()} 배치 실패: ${e.message}`);
        
        // 배치 전체 실패 시 각 항목의 retry_count 증가
        for (const item of batch) {
          this.db.saveFail({
            business_id: item.business_id,
            business_name: item.business_name,
            reason: e.message,
            box: item.box,
            km: item.km
          });
          failCount++;
        }
      }
    }

    console.log(`\n[Retry] 완료!`);
    console.log(`  - 성공: ${successCount}개`);
    console.log(`  - 실패: ${failCount}개`);
    
    const newStats = this.db.getFailStats();
    console.log(`  - 남은 재시도 가능: ${newStats.retryable}개`);
    console.log(`  - 최대 재시도 초과: ${newStats.maxedOut}개`);
  }

  private getRetryLogPrefix() {
    const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
    const h = Math.floor(elapsed / 3600);
    const m = Math.floor((elapsed % 3600) / 60);
    const s = elapsed % 60;
    const timeStr = `${h}h ${m}m ${s}s`;
    return `[${timeStr}] [Retry ${this.currentBoxIndex}/${this.totalBoxes}] [Saved: ${this.processedCount}]`;
  }
}
