import { BaseRepository } from './base.repository';
import type { PopularReview } from '$lib/types/parquet';
import type { ReviewItem2 } from '$services/types';

export class PopularReviewsRepository extends BaseRepository {
    private static instance: PopularReviewsRepository;
    private static initializing = false;

    protected tableConfig = {
        name: 'popular_reviews',
        url: 'https://xyqpggpilgcdsawuvpzn.supabase.co/storage/v1/object/public/data-parquet//popular_reviews.parquet'
    };

    private constructor() {
        super();
    }

    public static async getInstance(): Promise<PopularReviewsRepository> {
        console.log('PopularReviewsRepository.getInstance 호출');
        if (!PopularReviewsRepository.instance) {
            if (PopularReviewsRepository.initializing) {
                // 초기화 중이면 완료될 때까지 대기
                while (PopularReviewsRepository.initializing) {
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
                return PopularReviewsRepository.instance;
            }

            PopularReviewsRepository.initializing = true;
            try {
                PopularReviewsRepository.instance = new PopularReviewsRepository();
                await PopularReviewsRepository.instance.initialize();
            } finally {
                PopularReviewsRepository.initializing = false;
            }
        }
        return PopularReviewsRepository.instance;
    }

    public async getPopularReviews(limit: number = 10): Promise<PopularReview[]> {
        return this.getTableSample<PopularReview>(limit);
    }

    public async getReviews<T>(page: number = 1, size: number = 10): Promise<T[]> {
        if (!this.db) throw new Error('DuckDB가 초기화되지 않았습니다.');

        const conn = await this.db.connect();

        const now = new Date();
  
        // 기본 시간 정보 계산
        const currentHour = now.getHours();
        const currentMin = now.getMinutes();
        const currentDay = now.getDay(); // 0: 일요일, 6: 토요일
        
        // 5분 단위 블록 (0-11, 12가지 경우의 수)
        const mod5 = Math.floor(currentMin / 5);
        
        // 시간대 구분 (식사시간, 카페시간 등)
        const isMealTime = (currentHour >= 7 && currentHour <= 9) || 
                           (currentHour >= 11 && currentHour <= 14) || 
                           (currentHour >= 17 && currentHour <= 21);
        
        // 주말 여부
        const isWeekend = currentDay === 0 || currentDay === 6;
        
        // 오전/오후/저녁/심야 시간대
        const timeOfDay = 
          currentHour >= 5 && currentHour < 12 ? 'morning' :
          currentHour >= 12 && currentHour < 17 ? 'afternoon' :
          currentHour >= 17 && currentHour < 22 ? 'evening' : 'night';
        
        // 카테고리 그룹 설정
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
        
        // 5분 단위 mod 값에 따라 정렬 기준 변경
        let orderByClause = '';
        
        switch(mod5 % 6) {
          case 0:
            // 기본 정렬: 인기도 점수
            orderByClause = `final_pop_score DESC, created DESC`;
            break;
          case 1:
            // 방문 횟수 가중치
            orderByClause = `visit_count DESC, final_pop_score DESC`;
            break;
          case 2:
            // 리뷰 점수 가중치
            orderByClause = `visitor_reviews_score DESC, final_pop_score DESC`;
            break;
          case 3:
            // 시간대별 카테고리 중심
            orderByClause = `CASE WHEN category IN (${focusCategory}) THEN 1 ELSE 0 END DESC, final_pop_score DESC`;
            break;
          case 4:
            // 최신 리뷰 중심
            orderByClause = `created DESC, final_pop_score DESC`;
            break;
          case 5:
            // 주말/주중 특화
            orderByClause = isWeekend ? 
              `visit_count * 2 + visitor_reviews_score DESC, final_pop_score DESC` : 
              `visitor_reviews_score * 1.5 DESC, final_pop_score DESC`;
            break;
        }
        
        // DuckDB 쿼리 생성 - 필터 없이 정렬만 변경
        // const query = `
        //   SELECT * 
        //   FROM 'popular_reviews.parquet'
        //   ORDER BY ${orderByClause}
        //   LIMIT ${limit}
        // `;

        try {
            const q = `
                SELECT * 
                FROM parquet_scan('${this.tableConfig.url}')
                LIMIT ${size}
                OFFSET ${(page - 1) * size}
            `
            console.log(q);
            const result = await conn.query(q);

            const rows = result.toArray();
            return rows.map(row => ({
                ...row,
                media: row.media ? JSON.parse(row.media) : null
            })) as T[];
        } finally {
            await conn.close();
        }
    }

    public async getReviewById(id: string): Promise<PopularReview | null> {
        const results = await this.query<PopularReview>(`
            SELECT * 
            FROM parquet_scan('${this.tableConfig.url}')
            WHERE id = '${id}'
            LIMIT 1
        `);

        return results[0] || null;
    }

    // 인기 리뷰 특화 메서드들
    public async getReviewsByVisitCount(minVisitCount: number, limit: number = 10): Promise<PopularReview[]> {
        return this.query<PopularReview>(`
            SELECT * 
            FROM parquet_scan('${this.tableConfig.url}')
            WHERE visit_count >= ${minVisitCount}
            ORDER BY visit_count DESC
            LIMIT ${limit}
        `);
    }

    public async getReviewsByCategory(category: string, limit: number = 10): Promise<PopularReview[]> {
        return this.query<PopularReview>(`
            SELECT * 
            FROM parquet_scan('${this.tableConfig.url}')
            WHERE category = '${category}'
            ORDER BY final_pop_score DESC
            LIMIT ${limit}
        `);
    }

    public async getReviewsByAuthor(authorId: string, limit: number = 10): Promise<PopularReview[]> {
        return this.query<PopularReview>(`
            SELECT * 
            FROM parquet_scan('${this.tableConfig.url}')
            WHERE author_id = '${authorId}'
            ORDER BY created DESC
            LIMIT ${limit}
        `);
    }

    public async getTopRatedReviews(minScore: number, limit: number = 10): Promise<PopularReview[]> {
        return this.query<PopularReview>(`
            SELECT * 
            FROM parquet_scan('${this.tableConfig.url}')
            WHERE visitor_review_score >= ${minScore}
            ORDER BY visitor_review_score DESC
            LIMIT ${limit}
        `);
    }

    public async searchReviews(keyword: string, limit: number = 10): Promise<PopularReview[]> {
        return this.query<PopularReview>(`
            SELECT * 
            FROM parquet_scan('${this.tableConfig.url}')
            WHERE business_name LIKE '%${keyword}%'
               OR address LIKE '%${keyword}%'
               OR body LIKE '%${keyword}%'
            ORDER BY final_pop_score DESC
            LIMIT ${limit}
        `);
    }
} 