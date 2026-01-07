/**
 * 고급 리뷰 분석 통계 정보를 담는 인터페이스
 * DuckDB 쿼리의 review_metrics CTE에서 계산된 통계치들을 포함
 */
export interface ReviewAnalyticsStats {
    /** 평균 리뷰 본문 길이 - 텍스트 풍부도의 기본 지표 */
    avg_len: number;
    
    /** 본문 길이 표준편차 - 리뷰 길이의 분포·다양성 */
    stdev_len: number;
    
    /** 리뷰 1건당 평균 방문 횟수 - 재방문성 지표 */
    revisit_rate: number;
    
    /** 리뷰 1건당 미디어 첨부 평균 개수 - 시각 콘텐츠 활용도 */
    media_ratio: number;
    
    /** 리뷰 1건당 평균 조회 수 - 노출력(engagement reach) */
    avg_views: number;
    
    /** 최신 리뷰 가중치 평균 (지수 감쇠) - 최신성 점수 */
    recency_score: number;
    
    /** 종합 참여 지수 - 방문, 조회, 미디어, 텍스트 풍부도 종합 */
    engagement_score: number;
    
    /** 상대적 길이 변동성 (stdev_len / avg_len) */
    length_variation_index: number | null;
    
    /** 방문 집중도 (총 방문 / 총 조회) */
    loyalty_index: number | null;
    
    /** 성장 추이 (최근 한달 리뷰 수 / 전월 리뷰 수) */
    growth_rate: number | null;
  }
  
  /**
   * 고급 분석이 완료된 장소 정보
   * 기본 장소 정보 + 리뷰 분석 통계를 통합한 모델
   */
  export interface AdvancedStatsPlace {
    /** 장소 고유 ID */
    id: string;
    
    /** 장소명 */
    name?: string;
    
    /** 주소 */
    address?: string;
    
    /** 카테고리 */
    category?: string;
    
    /** 지역 그룹 (예: '제주') */
    group1?: string;
    
    /** 생성일시 */
    created?: string;
    
    /** 수정일시 */
    updated?: string;
    
    /** 리뷰 분석 통계 - 개별 컬럼으로 저장된 값들 */
    avg_len?: number;
    stdev_len?: number;
    revisit_rate?: number;
    media_ratio?: number;
    avg_views?: number;
    recency_score?: number;
    engagement_score?: number;
    length_variation_index?: number | null;
    loyalty_index?: number | null;
    growth_rate?: number | null;
    
    /** 구조화된 리뷰 분석 통계 (애플리케이션 레벨에서 생성) */
    review_analytics_stat?: ReviewAnalyticsStats;
  }
  
  /**
   * 시간대별 추천 전략 설정
   */
  export interface TimeBasedRecommendationConfig {
    /** 현재 시간대 구분 */
    timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
    
    /** 식사 시간 여부 */
    isMealTime: boolean;
    
    /** 주말 여부 */
    isWeekend: boolean;
    
    /** 5분 단위 블록 (0-11) */
    mod5: number;
    
    /** 시간대별 집중 카테고리 */
    focusCategory: string;
    
    /** 정렬 기준 */
    orderByClause: string;
  }
  