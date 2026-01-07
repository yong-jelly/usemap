import { PopularReviewsRepository } from '$lib/repositories/popular-reviews.repository';
import type { PopularReview } from '$lib/types/parquet';

export async function countParquetRows(): Promise<number> {
    try {
        const repository = PopularReviewsRepository.getInstance();
        await repository.initialize();
        
        // 행 수 조회
        const count = await repository.getTableRowCount();
        
        // 샘플 데이터 조회
        const sampleData = await repository.getTableSample<PopularReview>(1);
        console.log('Parquet 파일 샘플 데이터:', sampleData);
        
        return count;
    } catch (error) {
        console.error('Parquet 파일 읽기 오류:', error);
        throw error;
    }
} 