import { BaseRepository } from './base.repository';
import type { AdvancedStatsPlace, ReviewAnalyticsStats, TimeBasedRecommendationConfig } from './advanced-stats-types';

/**
 * 고급 리뷰 분석 통계가 포함된 장소 데이터를 관리하는 Repository
 * 
 * 주요 기능:
 * - 시간대별 동적 추천 알고리즘
 * - 다양한 분석 지표 기반 정렬
 * - 카테고리별 특화 검색
 * - 성능 최적화된 DuckDB 쿼리
 */
export class AdvancedStatsPlacesRepository extends BaseRepository {
    private static instance: AdvancedStatsPlacesRepository;
    private static initializing = false;

    protected tableConfig = {
        name: 'advanced-stats-places',
        url: 'https://xyqpggpilgcdsawuvpzn.supabase.co/storage/v1/object/public/review-analytics-parquet-exports-v1//advancedStats_jeju.parquet'
    };

    private constructor() {
        super();
    }

    /**
     * 싱글톤 인스턴스 반환
     * 동시 초기화 방지를 위한 락 메커니즘 포함
     */
    public static async getInstance(): Promise<AdvancedStatsPlacesRepository> {
        console.log('AdvancedStatsPlacesRepository.getInstance 호출');
        if (!AdvancedStatsPlacesRepository.instance) {
            if (AdvancedStatsPlacesRepository.initializing) {
                // 초기화 중이면 완료될 때까지 대기 (100ms 간격으로 폴링)
                while (AdvancedStatsPlacesRepository.initializing) {
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
                return AdvancedStatsPlacesRepository.instance;
            }

            AdvancedStatsPlacesRepository.initializing = true;
            try {
                AdvancedStatsPlacesRepository.instance = new AdvancedStatsPlacesRepository();
                await AdvancedStatsPlacesRepository.instance.initialize();
            } finally {
                AdvancedStatsPlacesRepository.initializing = false;
            }
        }
        return AdvancedStatsPlacesRepository.instance;
    }

    /**
     * 기본 인기 장소 조회 (하위 호환성을 위해 유지)
     * @param limit 조회할 최대 개수
     * @returns 인기 장소 목록
     */
    public async getPopularPlaces(limit: number = 10): Promise<AdvancedStatsPlace[]> {
        return this.getTableSample<AdvancedStatsPlace>(limit);
    }

    /**
     * 시간대별 개인화된 추천 알고리즘이 적용된 장소 조회
     * 
     * 추천 로직:
     * - 현재 시간대에 따른 카테고리 가중치 적용
     * - 5분 단위로 정렬 기준 변경 (다양성 확보)
     * - 주말/주중 구분하여 서로 다른 가중치 적용
     * - 식사시간 여부에 따른 음식점 우선 추천
     * 
     * @param page 페이지 번호 (1부터 시작)
     * @param size 페이지당 항목 수
     * @returns 시간대별 추천 장소 목록
     */
    public async getRecommendedPlaces(page: number = 1, size: number = 10): Promise<AdvancedStatsPlace[]> {
        if (!this.db) throw new Error('DuckDB가 초기화되지 않았습니다.');

        const conn = await this.db.connect();
        const timeConfig = this.calculateTimeBasedConfig();

        try {
            const query = `
                SELECT * 
                FROM parquet_scan('${this.tableConfig.url}')
                WHERE engagement_score IS NOT NULL  -- 분석 데이터가 있는 장소만
                ORDER BY ${timeConfig.orderByClause}
                LIMIT ${size}
                OFFSET ${(page - 1) * size}
            `;
            
            console.log(`🕐 시간대별 추천 쿼리 실행:`, {
                timeOfDay: timeConfig.timeOfDay,
                isMealTime: timeConfig.isMealTime,
                isWeekend: timeConfig.isWeekend,
                mod5: timeConfig.mod5,
                orderStrategy: timeConfig.orderByClause.split(',')[0]
            });

            const result = await conn.query(query);
            const rows = result.toArray();
            
            // 결과 데이터를 AdvancedStatsPlace 형태로 변환 및 구조화
            return this.transformToAdvancedStatsPlace(rows);
            
        } finally {
            await conn.close();
        }
    }

    /**
     * 현재 시간을 기반으로 추천 전략 설정을 계산
     * @returns 시간대별 추천 설정 객체
     */
    private calculateTimeBasedConfig(): TimeBasedRecommendationConfig {
        const now = new Date();
        const currentHour = now.getHours();
        const currentMin = now.getMinutes();
        const currentDay = now.getDay(); // 0: 일요일, 6: 토요일
        
        // 5분 단위 블록 계산 (0-11, 총 12가지 경우의 수)
        const mod5 = Math.floor(currentMin / 5);
        
        // 식사시간 판별 (아침: 7-9시, 점심: 11-14시, 저녁: 17-21시)
        const isMealTime = (currentHour >= 7 && currentHour <= 9) || 
                           (currentHour >= 11 && currentHour <= 14) || 
                           (currentHour >= 17 && currentHour <= 21);
        
        // 주말 여부 판별
        const isWeekend = currentDay === 0 || currentDay === 6;
        
        // 시간대 구분 (4개 시간대)
        const timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night' = 
          currentHour >= 5 && currentHour < 12 ? 'morning' :
          currentHour >= 12 && currentHour < 17 ? 'afternoon' :
          currentHour >= 17 && currentHour < 22 ? 'evening' : 'night';
        
        // 시간대별 집중 카테고리 설정
        let focusCategory = '';
        if (isMealTime) {
          focusCategory = "'음식점', '식당', '레스토랑', '카페', '베이커리', '패스트푸드'";
        } else if (timeOfDay === 'morning' || timeOfDay === 'afternoon') {
          focusCategory = "'카페', '베이커리', '문화시설', '쇼핑'";
        } else if (timeOfDay === 'evening') {
          focusCategory = "'술집', '펍', '바', '음식점', '레스토랑'";
        } else {
          focusCategory = "'편의점', '24시', '숙박'";
        }
        
        // 5분 단위 mod 값에 따른 다양한 정렬 전략 (사용자 경험 다양성 확보)
        let orderByClause = '';
        switch(mod5 % 6) {
          case 0:
            // 종합 참여도 우선 정렬
            orderByClause = `engagement_score DESC NULLS LAST, recency_score DESC`;
            break;
          case 1:
            // 재방문성 중심 정렬
            orderByClause = `revisit_rate DESC NULLS LAST, engagement_score DESC`;
            break;
          case 2:
            // 최신성 중심 정렬
            orderByClause = `recency_score DESC NULLS LAST, engagement_score DESC`;
            break;
          case 3:
            // 시간대별 카테고리 특화 정렬
            orderByClause = `CASE WHEN category IN (${focusCategory}) THEN engagement_score * 1.5 ELSE engagement_score END DESC NULLS LAST`;
            break;
          case 4:
            // 미디어 풍부도 중심 정렬
            orderByClause = `media_ratio DESC NULLS LAST, engagement_score DESC`;
            break;
          case 5:
            // 주말/주중 특화 정렬
            orderByClause = isWeekend ? 
              `loyalty_index DESC NULLS LAST, engagement_score DESC` : 
              `avg_views DESC NULLS LAST, engagement_score DESC`;
            break;
        }

        return {
            timeOfDay,
            isMealTime,
            isWeekend,
            mod5,
            focusCategory,
            orderByClause
        };
    }

    /**
     * Raw 데이터를 AdvancedStatsPlace 모델로 변환
     * 개별 통계 컬럼들을 구조화된 객체로 재구성
     */
    private transformToAdvancedStatsPlace(rows: any[]): AdvancedStatsPlace[] {
        return rows.map(row => {
            // 구조화된 리뷰 분석 통계 객체 생성
            const review_analytics_stat: ReviewAnalyticsStats | undefined = 
                (row.avg_len !== undefined || row.engagement_score !== undefined) ? {
                    avg_len: row.avg_len || 0,
                    stdev_len: row.stdev_len || 0,
                    revisit_rate: row.revisit_rate || 0,
                    media_ratio: row.media_ratio || 0,
                    avg_views: row.avg_views || 0,
                    recency_score: row.recency_score || 0,
                    engagement_score: row.engagement_score || 0,
                    length_variation_index: row.length_variation_index,
                    loyalty_index: row.loyalty_index,
                    growth_rate: row.growth_rate
                } : undefined;

            return {
                ...row,
                review_analytics_stat,
                // media 필드가 JSON 문자열인 경우 파싱
                media: row.media ? (typeof row.media === 'string' ? JSON.parse(row.media) : row.media) : null
            } as AdvancedStatsPlace;
        });
    }

    /**
     * 특정 장소 ID로 상세 정보 조회
     * @param id 장소 고유 ID
     * @returns 장소 상세 정보 (없으면 null)
     */
    public async getPlaceById(id: string): Promise<AdvancedStatsPlace | null> {
        const results = await this.query<any>(`
            SELECT * 
            FROM parquet_scan('${this.tableConfig.url}')
            WHERE id = '${id}'
            LIMIT 1
        `);

        if (results.length === 0) return null;
        
        const transformed = this.transformToAdvancedStatsPlace(results);
        return transformed[0];
    }

    /**
     * 참여도 점수 기준 상위 장소 조회
     * @param minEngagementScore 최소 참여도 점수
     * @param limit 조회 개수 제한
     * @returns 고참여도 장소 목록
     */
    public async getPlacesByEngagementScore(minEngagementScore: number, limit: number = 10): Promise<AdvancedStatsPlace[]> {
        const results = await this.query<any>(`
            SELECT * 
            FROM parquet_scan('${this.tableConfig.url}')
            WHERE engagement_score >= ${minEngagementScore}
            ORDER BY engagement_score DESC
            LIMIT ${limit}
        `);
        
        return this.transformToAdvancedStatsPlace(results);
    }

    /**
     * 재방문율 기준 상위 장소 조회 (충성도가 높은 장소)
     * @param minRevisitRate 최소 재방문율
     * @param limit 조회 개수 제한
     * @returns 고재방문율 장소 목록
     */
    public async getPlacesByRevisitRate(minRevisitRate: number, limit: number = 10): Promise<AdvancedStatsPlace[]> {
        const results = await this.query<any>(`
            SELECT * 
            FROM parquet_scan('${this.tableConfig.url}')
            WHERE revisit_rate >= ${minRevisitRate}
            ORDER BY revisit_rate DESC, engagement_score DESC
            LIMIT ${limit}
        `);
        
        return this.transformToAdvancedStatsPlace(results);
    }

    /**
     * 카테고리별 장소 조회 (해당 카테고리 내에서 참여도순 정렬)
     * @param category 카테고리명
     * @param limit 조회 개수 제한
     * @returns 카테고리별 장소 목록
     */
    public async getPlacesByCategory(category: string, limit: number = 10): Promise<AdvancedStatsPlace[]> {
        const results = await this.query<any>(`
            SELECT * 
            FROM parquet_scan('${this.tableConfig.url}')
            WHERE category = '${category}'
              AND engagement_score IS NOT NULL
            ORDER BY engagement_score DESC
            LIMIT ${limit}
        `);
        
        return this.transformToAdvancedStatsPlace(results);
    }

    /**
     * 성장률 기준 급상승 장소 조회 (트렌딩 장소 발견)
     * @param minGrowthRate 최소 성장률 (1.0 = 100% 성장)
     * @param limit 조회 개수 제한
     * @returns 급성장 장소 목록
     */
    public async getTrendingPlaces(minGrowthRate: number = 1.2, limit: number = 10): Promise<AdvancedStatsPlace[]> {
        const results = await this.query<any>(`
            SELECT * 
            FROM parquet_scan('${this.tableConfig.url}')
            WHERE growth_rate >= ${minGrowthRate}
              AND growth_rate IS NOT NULL
            ORDER BY growth_rate DESC, engagement_score DESC
            LIMIT ${limit}
        `);
        
        return this.transformToAdvancedStatsPlace(results);
    }

    /**
     * 최신성 점수 기준 최근 핫한 장소 조회
     * @param minRecencyScore 최소 최신성 점수 (0-1 범위)
     * @param limit 조회 개수 제한
     * @returns 최신 핫한 장소 목록
     */
    public async getRecentlyPopularPlaces(minRecencyScore: number = 0.5, limit: number = 10): Promise<AdvancedStatsPlace[]> {
        const results = await this.query<any>(`
            SELECT * 
            FROM parquet_scan('${this.tableConfig.url}')
            WHERE recency_score >= ${minRecencyScore}
            ORDER BY recency_score DESC, engagement_score DESC
            LIMIT ${limit}
        `);
        
        return this.transformToAdvancedStatsPlace(results);
    }

    /**
     * 통합 검색 기능 (장소명, 주소, 카테고리 통합 검색)
     * @param keyword 검색 키워드
     * @param limit 조회 개수 제한
     * @returns 검색 결과 장소 목록
     */
    public async searchPlaces(keyword: string, limit: number = 10): Promise<AdvancedStatsPlace[]> {
        // SQL Injection 방지를 위한 기본적인 키워드 정제
        const sanitizedKeyword = keyword.replace(/'/g, "''");
        
        const results = await this.query<any>(`
            SELECT * 
            FROM parquet_scan('${this.tableConfig.url}')
            WHERE (name LIKE '%${sanitizedKeyword}%'
               OR address LIKE '%${sanitizedKeyword}%'
               OR category LIKE '%${sanitizedKeyword}%')
              AND engagement_score IS NOT NULL
            ORDER BY engagement_score DESC
            LIMIT ${limit}
        `);
        
        return this.transformToAdvancedStatsPlace(results);
    }

    /**
     * 고급 필터링 검색 (여러 조건 조합)
     * @param filters 필터 조건 객체
     * @returns 필터링된 장소 목록
     */
    public async getPlacesWithFilters(filters: {
        category?: string;
        minEngagementScore?: number;
        minRevisitRate?: number;
        minGrowthRate?: number;
        limit?: number;
    }): Promise<AdvancedStatsPlace[]> {
        const conditions: string[] = ['engagement_score IS NOT NULL'];
        
        if (filters.category) {
            conditions.push(`category = '${filters.category}'`);
        }
        if (filters.minEngagementScore !== undefined) {
            conditions.push(`engagement_score >= ${filters.minEngagementScore}`);
        }
        if (filters.minRevisitRate !== undefined) {
            conditions.push(`revisit_rate >= ${filters.minRevisitRate}`);
        }
        if (filters.minGrowthRate !== undefined) {
            conditions.push(`growth_rate >= ${filters.minGrowthRate}`);
        }

        const whereClause = conditions.join(' AND ');
        const limit = filters.limit || 10;

        const results = await this.query<any>(`
            SELECT * 
            FROM parquet_scan('${this.tableConfig.url}')
            WHERE ${whereClause}
            ORDER BY engagement_score DESC
            LIMIT ${limit}
        `);
        
        return this.transformToAdvancedStatsPlace(results);
    }

    /**
     * 분석 통계 요약 정보 조회
     * @returns 전체 데이터의 통계 요약
     */
    public async getAnalyticsSummary(): Promise<{
        total_places: number;
        avg_engagement_score: number;
        avg_revisit_rate: number;
        total_high_growth_places: number;
    }> {
        const results = await this.query<any>(`
            SELECT 
                COUNT(*) as total_places,
                AVG(engagement_score) as avg_engagement_score,
                AVG(revisit_rate) as avg_revisit_rate,
                COUNT(CASE WHEN growth_rate > 1.5 THEN 1 END) as total_high_growth_places
            FROM parquet_scan('${this.tableConfig.url}')
            WHERE engagement_score IS NOT NULL
        `);
        
        return results[0] || {
            total_places: 0,
            avg_engagement_score: 0,
            avg_revisit_rate: 0,
            total_high_growth_places: 0
        };
    }
}
