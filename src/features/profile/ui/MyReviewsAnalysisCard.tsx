import { useState, useMemo } from "react";
import { 
  Star, 
  Calendar, 
  ChevronDown, 
  FileText, 
  Loader2,
  Lock,
  Unlock
} from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { safeFormatDate } from "@/shared/lib/date";
import type { 
  UserReviewAnalysisData, 
  ReviewStats, 
  ReviewFeeling 
} from "@/entities/user/types";

// 타입 호환성을 위한 로컬 인터페이스 정의
interface ReviewStatsLocal {
  totalReviews: number;
  averageRating: number;
  ratingDistribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
  topFeelings: {
    id: string;
    name: string;
    count: number;
    percentage: number;
  }[];
  categoryBreakdown: {
    category: string;
    count: number;
    averageRating: number;
  }[];
}

interface MyReviewsAnalysisCardProps {
  data?: UserReviewAnalysisData | null;
  isLoading?: boolean;
  onPlaceClick: (placeId: string) => void;
}

export function MyReviewsAnalysisCard({ 
  data, 
  isLoading = false, 
  onPlaceClick 
}: MyReviewsAnalysisCardProps) {
  const [showAllFeelings, setShowAllFeelings] = useState(false);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [showAllCategories, setShowAllCategories] = useState(false);

  // 데이터 가공
  const card = useMemo(() => {
    if (!data) return null;

    const stats: ReviewStatsLocal = {
      totalReviews: data.review_summary.total_reviews,
      averageRating: data.review_summary.average_rating,
      ratingDistribution: {
        5: data.rating_distribution.find(r => r.rating === 5)?.count ?? 0,
        4: data.rating_distribution.find(r => r.rating === 4)?.count ?? 0,
        3: data.rating_distribution.find(r => r.rating === 3)?.count ?? 0,
        2: data.rating_distribution.find(r => r.rating === 2)?.count ?? 0,
        1: data.rating_distribution.find(r => r.rating === 1)?.count ?? 0,
      },
      topFeelings: data.tag_analysis.map(t => ({
        id: t.tag_code,
        name: t.tag_code,
        count: t.count,
        percentage: t.percentage
      })),
      categoryBreakdown: data.category_analysis.map(c => ({
        category: c.category,
        count: c.count,
        averageRating: c.average_rating
      }))
    };

    return {
      title: '내가 작성한 리뷰 분석',
      period: '전체 기간',
      stats,
      recentReviews: data.recent_reviews,
      timestamp: new Date().toISOString()
    };
  }, [data]);

  const hasNoData = !card || card.stats.totalReviews === 0;

  // 인사이트 생성 로직
  const dynamicInsights = useMemo(() => {
    if (!card) return [];
    const insights: string[] = [];
    const { stats } = card;

    // 평균 별점 인사이트
    if (stats.averageRating >= 4.0) {
      insights.push(`평균 별점 ${stats.averageRating.toFixed(1)}점으로 대체로 만족스러운 리뷰 작성`);
    } else if (stats.averageRating >= 3.0) {
      insights.push(`평균 별점 ${stats.averageRating.toFixed(1)}점으로 보통 수준의 리뷰 작성`);
    } else {
      insights.push(`평균 별점 ${stats.averageRating.toFixed(1)}점으로 까다로운 기준의 리뷰 작성`);
    }

    // 가장 많이 선택한 느낌 인사이트
    if (stats.topFeelings.length >= 2) {
      const topTwo = stats.topFeelings.slice(0, 2);
      insights.push(
        `${getFeelingLabel(topTwo[0].name)}(${topTwo[0].percentage}%)와 ${getFeelingLabel(topTwo[1].name)}(${topTwo[1].percentage}%)을 가장 많이 선택`
      );
    }

    // 부정적 느낌 비율 인사이트
    const negativeFeelings = stats.topFeelings.filter((f) =>
      ['bad_atmosphere', 'bad_taste', 'bad_service'].includes(f.name)
    );
    const negativePercentage = negativeFeelings.reduce((sum, f) => sum + f.percentage, 0);

    if (negativePercentage <= 5) {
      insights.push(`부정적 느낌 선택은 ${negativePercentage.toFixed(0)}%로 매우 낮음`);
    } else if (negativePercentage >= 20) {
      insights.push(`부정적 느낌 선택이 ${negativePercentage.toFixed(0)}%로 비교적 높음`);
    }

    // 식사 동반자 선호도 인사이트
    const companionFeelings = stats.topFeelings.filter((f) =>
      ['with_family', 'with_gf', 'alone'].includes(f.name)
    );
    if (companionFeelings.length > 0) {
      const topCompanion = companionFeelings[0];
      if (topCompanion.name === 'with_family') {
        insights.push('가족과 함께하는 식사를 선호하는 편');
      } else if (topCompanion.name === 'with_gf') {
        insights.push('연인과 함께하는 식사를 선호하는 편');
      } else if (topCompanion.name === 'alone') {
        insights.push('혼자 식사하는 것을 선호하는 편');
      }
    }

    return insights.slice(0, 5);
  }, [card]);

  const displayedFeelings = useMemo(() => 
    showAllFeelings ? card?.stats.topFeelings : card?.stats.topFeelings.slice(0, 6),
  [card, showAllFeelings]);

  const displayedReviews = useMemo(() => 
    showAllReviews ? card?.recentReviews : card?.recentReviews.slice(0, 3),
  [card, showAllReviews]);

  const displayedCategories = useMemo(() => 
    showAllCategories ? card?.stats.categoryBreakdown : card?.stats.categoryBreakdown.slice(0, 5),
  [card, showAllCategories]);

  if (isLoading && !card) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="mb-4 h-8 w-8 animate-spin text-gray-400" />
        <h4 className="mb-2 text-base font-medium text-gray-900">리뷰 데이터를 불러오는 중...</h4>
        <p className="text-center text-sm text-gray-500">잠시만 기다려주세요</p>
      </div>
    );
  }

  if (hasNoData) {
    return (
      <article className="mb-3 overflow-hidden rounded-lg border border-gray-100 bg-white shadow-sm p-4">
        <div className="flex flex-col items-center justify-center py-12">
          <div className="mb-4 rounded-full bg-gray-100 p-4">
            <FileText className="h-8 w-8 text-gray-400" />
          </div>
          <h4 className="mb-2 text-base font-medium text-gray-900">아직 작성한 리뷰가 없어요</h4>
          <p className="mb-4 text-center text-sm text-gray-500">
            맛집을 방문하고 첫 리뷰를 작성해보세요!
            <br />
            당신의 소중한 경험을 다른 사람들과 공유해보세요.
          </p>
        </div>
      </article>
    );
  }

  return (
    <article className="mb-3 overflow-hidden rounded-lg border border-gray-100 bg-white shadow-sm">
      {/* 헤더 */}
      <header className="p-4 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 rounded bg-gray-100 px-2 py-1">
              <Star className="h-3 w-3 text-gray-600" />
              <span className="text-xs font-medium text-gray-700">내 리뷰</span>
            </div>
            <div className="flex items-center gap-1 rounded bg-gray-100 px-2 py-1">
              <span className="text-xs font-medium text-gray-700">{card?.period}</span>
            </div>
          </div>
          <Calendar className="h-4 w-4 text-gray-400" />
        </div>
      </header>

      <div className="p-4 pt-0">
        {/* 타이틀 */}
        <h3 className="mb-4 text-lg font-semibold text-gray-900">{card?.title}</h3>

        {/* 리뷰 요약 */}
        <div className="mb-4 rounded-lg bg-gray-50 p-4">
          <h4 className="mb-3 text-sm font-medium text-gray-700">리뷰 현황</h4>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-gray-900">{card?.stats.totalReviews}</p>
              <p className="text-xs text-gray-500">작성한 리뷰</p>
            </div>
            <div>
              <div className="flex items-center justify-center gap-1">
                <Star className="h-4 w-4 text-gray-600" />
                <p className="text-2xl font-bold text-gray-900">{card?.stats.averageRating.toFixed(1)}</p>
              </div>
              <p className="text-xs text-gray-500">평균 별점</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {Math.round(
                  ((card!.stats.ratingDistribution[4] + card!.stats.ratingDistribution[5]) /
                    card!.stats.totalReviews) *
                    100,
                )}%
              </p>
              <p className="text-xs text-gray-500">만족도</p>
            </div>
          </div>
        </div>

        {/* 별점 분포 */}
        <div className="mb-4">
          <h4 className="mb-3 font-medium text-gray-900">별점 분포</h4>
          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map((rating) => (
              <div key={rating} className="flex items-center gap-3">
                <div className="flex w-12 items-center gap-1">
                  <Star className="h-3 w-3 text-gray-600" />
                  <span className="text-sm text-gray-600">{rating}</span>
                </div>
                <div className="relative flex-1">
                  <div className="h-4 w-full overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full bg-gray-600 transition-all duration-500"
                      style={{
                        width: `${(card!.stats.ratingDistribution[rating as 1|2|3|4|5] / card!.stats.totalReviews) * 100}%`
                      }}
                    ></div>
                  </div>
                </div>
                <div className="w-8 text-right text-xs text-gray-500">
                  {card!.stats.ratingDistribution[rating as 1|2|3|4|5]}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 주요 평가 */}
        <div className="mb-4">
          <div className="mb-3 flex items-center justify-between">
            <h4 className="font-medium text-gray-900">주요 평가</h4>
            {card!.stats.topFeelings.length > 6 && (
              <button
                onClick={() => setShowAllFeelings(!showAllFeelings)}
                className="flex items-center gap-1 text-xs text-gray-600 transition-colors hover:text-gray-800"
              >
                <span>
                  {showAllFeelings ? '접기' : `+${card!.stats.topFeelings.length - 6}개 더보기`}
                </span>
                <ChevronDown
                  className={cn("h-3 w-3 transform transition-transform", showAllFeelings && "rotate-180")}
                />
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2">
            {displayedFeelings?.map((feeling) => (
              <div key={feeling.id} className="flex items-center justify-between rounded bg-gray-100 p-2 text-gray-600">
                <div className="flex items-center gap-2">
                  <span className="text-xs">{getFeelingEmoji(feeling.name)}</span>
                  <span className="text-sm font-medium">{getFeelingLabel(feeling.name)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-sm font-bold text-gray-900">{feeling.count}</span>
                  <span className="text-xs text-gray-500">({feeling.percentage}%)</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 카테고리별 리뷰 */}
        <div className="mb-4">
          <div className="mb-3 flex items-center justify-between">
            <h4 className="font-medium text-gray-900">카테고리별 리뷰</h4>
            {card!.stats.categoryBreakdown.length > 5 && (
              <button
                onClick={() => setShowAllCategories(!showAllCategories)}
                className="flex items-center gap-1 text-xs text-gray-600 transition-colors hover:text-gray-800"
              >
                <span>
                  {showAllCategories ? '접기' : `+${card!.stats.categoryBreakdown.length - 5}개 더보기`}
                </span>
                <ChevronDown
                  className={cn("h-3 w-3 transform transition-transform", showAllCategories && "rotate-180")}
                />
              </button>
            )}
          </div>
          <div className="space-y-2">
            {displayedCategories?.map((category) => (
              <div key={category.category} className="flex items-center justify-between rounded bg-gray-100 p-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-900">{category.category}</span>
                  <div className="flex items-center gap-1">
                    <Star className="h-3 w-3 text-gray-600" />
                    <span className="text-xs text-gray-600">{category.averageRating.toFixed(1)}</span>
                  </div>
                </div>
                <span className="text-sm text-gray-600">{category.count}개</span>
              </div>
            ))}
          </div>
        </div>

        {/* 최근 리뷰 */}
        <div className="mb-4">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h4 className="font-semibold text-gray-900">최근 리뷰 Top 10</h4>
            </div>
            {card!.recentReviews.length > 3 && (
              <button
                onClick={() => setShowAllReviews(!showAllReviews)}
                className="flex items-center gap-1 text-xs text-gray-600 transition-colors hover:text-gray-800"
              >
                <span>{showAllReviews ? '접기' : `+${card!.recentReviews.length - 3}개 더보기`}</span>
                <ChevronDown
                  className={cn("h-3 w-3 transform transition-transform", showAllReviews && "rotate-180")}
                />
              </button>
            )}
          </div>
          <div className="space-y-4">
            {displayedReviews?.map((review) => (
              <div
                key={review.created_date + review.place_id}
                className="group relative overflow-hidden rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-all hover:border-gray-300 hover:shadow-md cursor-pointer"
                onClick={() => onPlaceClick(review.place_id)}
              >
                {/* 상단 정보 영역 */}
                <div className="mb-3 flex items-start justify-between">
                  <div className="flex-1">
                    <div className="mb-2 flex items-center gap-2">
                      {review.is_private ? (
                        <Lock className="h-3 w-3 stroke-gray-400" />
                      ) : (
                        <Unlock className="h-3 w-3 stroke-gray-400 text-gray-400" />
                      )}
                      <h5 className="text-base font-semibold text-gray-900">
                        {review.place_name}
                      </h5>
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 text-gray-300 fill-current" />
                        <span className="ml-1 text-xs font-medium text-gray-700">{review.score}</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-1 text-xs text-gray-500">
                      <span>{review.category}</span>
                      <span>•</span>
                      <span>{review.group1} {review.group2} {review.group3}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-gray-400">
                      {review.created_date}
                    </span>
                  </div>
                </div>

                {/* 느낌 태그 */}
                {review.tags && review.tags.length > 0 && (
                  <div className="mb-3 flex flex-wrap gap-1">
                    {review.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 rounded bg-gray-100 px-2 py-1 text-xs text-gray-600"
                      >
                        <span className="text-xs">{getFeelingEmoji(tag)}</span>
                        <span>{getFeelingLabel(tag)}</span>
                      </span>
                    ))}
                  </div>
                )}

                {/* 리뷰 내용 */}
                {review.review_content && (
                  <div className="relative">
                    <div className="absolute top-0 left-0 h-full w-1 rounded-full bg-gray-300"></div>
                    <div className="pl-4">
                      <p className="text-sm leading-relaxed text-gray-600 line-clamp-2">
                        "{review.review_content}"
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 인사이트 */}
        <div className="rounded-lg bg-gray-50 p-4">
          <h4 className="mb-3 text-sm font-medium text-gray-700">리뷰 인사이트</h4>
          <div className="space-y-2">
            {dynamicInsights.map((insight) => (
              <div key={insight} className="flex items-center gap-2 text-xs">
                <div className="h-2 w-2 rounded-full bg-gray-600"></div>
                <span className="text-gray-600">{insight}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </article>
  );
}

// 헬퍼 함수들
function getFeelingEmoji(feeling: string): string {
  const emojiMap: Record<string, string> = {
    local: '🏠',
    frequent: '🔄',
    again: '💕',
    good_atmosphere: '✨',
    good_taste: '😋',
    with_gf: '💑',
    with_family: '👨‍👩‍👧‍👦',
    alone: '😌',
    bad_atmosphere: '😐',
    bad_taste: '😕',
    bad_service: '😒',
  };
  return emojiMap[feeling] || '📝';
}

function getFeelingLabel(feeling: string): string {
  const labelMap: Record<string, string> = {
    local: '지역 주민 추천',
    frequent: '자주 방문',
    again: '또 오고싶음',
    good_atmosphere: '분위기 최고',
    good_taste: '맛 최고',
    with_gf: '여자친구랑',
    with_family: '가족과',
    alone: '혼밥',
    bad_atmosphere: '분위기 별로',
    bad_taste: '맛 별로',
    bad_service: '서비스 별로',
  };
  return labelMap[feeling] || feeling;
}
