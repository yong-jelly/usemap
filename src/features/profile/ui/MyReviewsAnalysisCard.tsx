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
import type { UserReviewAnalysisData } from "@/entities/user/types";

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
    };
  }, [data]);

  const hasNoData = !card || card.stats.totalReviews === 0;

  const dynamicInsights = useMemo(() => {
    if (!card) return [];
    const insights: string[] = [];
    const { stats } = card;

    if (stats.averageRating >= 4.0) {
      insights.push(`평균 별점 ${stats.averageRating.toFixed(1)}점으로 대체로 만족스러운 리뷰 작성`);
    } else if (stats.averageRating >= 3.0) {
      insights.push(`평균 별점 ${stats.averageRating.toFixed(1)}점으로 보통 수준의 리뷰 작성`);
    } else {
      insights.push(`평균 별점 ${stats.averageRating.toFixed(1)}점으로 까다로운 기준의 리뷰 작성`);
    }

    if (stats.topFeelings.length >= 2) {
      const topTwo = stats.topFeelings.slice(0, 2);
      insights.push(
        `${getFeelingLabel(topTwo[0].name)}(${topTwo[0].percentage}%)와 ${getFeelingLabel(topTwo[1].name)}(${topTwo[1].percentage}%)을 가장 많이 선택`
      );
    }

    const negativeFeelings = stats.topFeelings.filter((f) =>
      ['bad_atmosphere', 'bad_taste', 'bad_service'].includes(f.name)
    );
    const negativePercentage = negativeFeelings.reduce((sum, f) => sum + f.percentage, 0);

    if (negativePercentage <= 5) {
      insights.push(`부정적 느낌 선택은 ${negativePercentage.toFixed(0)}%로 매우 낮음`);
    } else if (negativePercentage >= 20) {
      insights.push(`부정적 느낌 선택이 ${negativePercentage.toFixed(0)}%로 비교적 높음`);
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
      <article className="overflow-hidden rounded-2xl border border-surface-100 dark:border-surface-800 bg-white dark:bg-surface-900 p-6">
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="mb-4 h-8 w-8 animate-spin text-primary-500" />
          <h4 className="mb-2 text-base font-medium text-surface-900 dark:text-white">리뷰 데이터를 불러오는 중...</h4>
          <p className="text-center text-sm text-surface-500 dark:text-surface-400">잠시만 기다려주세요</p>
        </div>
      </article>
    );
  }

  if (hasNoData) {
    return (
      <article className="overflow-hidden rounded-2xl border border-surface-100 dark:border-surface-800 bg-white dark:bg-surface-900 p-4">
        <div className="flex flex-col items-center justify-center py-12">
          <div className="mb-4 rounded-full bg-surface-100 dark:bg-surface-800 p-4">
            <FileText className="h-8 w-8 text-surface-400 dark:text-surface-500" />
          </div>
          <h4 className="mb-2 text-base font-medium text-surface-900 dark:text-white">아직 작성한 리뷰가 없어요</h4>
          <p className="mb-4 text-center text-sm text-surface-500 dark:text-surface-400">
            맛집을 방문하고 첫 리뷰를 작성해보세요!
          </p>
        </div>
      </article>
    );
  }

  return (
    <article className="overflow-hidden rounded-2xl border border-surface-100 dark:border-surface-800 bg-white dark:bg-surface-900">
      {/* 헤더 */}
      <header className="p-4 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-lg bg-surface-100 dark:bg-surface-800 px-2.5 py-1.5">
              <Star className="h-3.5 w-3.5 text-amber-500" />
              <span className="text-xs font-medium text-surface-700 dark:text-surface-300">내 리뷰</span>
            </div>
            <div className="flex items-center gap-1 rounded-lg bg-surface-100 dark:bg-surface-800 px-2.5 py-1.5">
              <span className="text-xs font-medium text-surface-500 dark:text-surface-400">{card?.period}</span>
            </div>
          </div>
          <Calendar className="h-4 w-4 text-surface-400 dark:text-surface-500" />
        </div>
      </header>

      <div className="p-4 pt-0">
        <h3 className="mb-4 text-lg font-semibold text-surface-900 dark:text-white">{card?.title}</h3>

        {/* 리뷰 요약 */}
        <div className="mb-4 rounded-xl bg-surface-50 dark:bg-surface-800 p-4">
          <h4 className="mb-3 text-sm font-medium text-surface-600 dark:text-surface-400">리뷰 현황</h4>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-surface-900 dark:text-white">{card?.stats.totalReviews}</p>
              <p className="text-xs text-surface-500 dark:text-surface-400">작성한 리뷰</p>
            </div>
            <div>
              <div className="flex items-center justify-center gap-1">
                <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                <p className="text-2xl font-bold text-surface-900 dark:text-white">{card?.stats.averageRating.toFixed(1)}</p>
              </div>
              <p className="text-xs text-surface-500 dark:text-surface-400">평균 별점</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-surface-900 dark:text-white">
                {Math.round(
                  ((card!.stats.ratingDistribution[4] + card!.stats.ratingDistribution[5]) /
                    card!.stats.totalReviews) *
                    100,
                )}%
              </p>
              <p className="text-xs text-surface-500 dark:text-surface-400">만족도</p>
            </div>
          </div>
        </div>

        {/* 별점 분포 */}
        <div className="mb-4">
          <h4 className="mb-3 font-medium text-surface-900 dark:text-white">별점 분포</h4>
          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map((rating) => (
              <div key={rating} className="flex items-center gap-3">
                <div className="flex w-12 items-center gap-1">
                  <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                  <span className="text-sm text-surface-600 dark:text-surface-400">{rating}</span>
                </div>
                <div className="relative flex-1">
                  <div className="h-4 w-full overflow-hidden rounded-full bg-surface-100 dark:bg-surface-800">
                    <div
                      className="h-full rounded-full bg-amber-500"
                      style={{
                        width: `${(card!.stats.ratingDistribution[rating as 1|2|3|4|5] / card!.stats.totalReviews) * 100}%`
                      }}
                    ></div>
                  </div>
                </div>
                <div className="w-8 text-right text-xs text-surface-500 dark:text-surface-400">
                  {card!.stats.ratingDistribution[rating as 1|2|3|4|5]}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 주요 평가 */}
        {card!.stats.topFeelings.length > 0 && (
          <div className="mb-4">
            <div className="mb-3 flex items-center justify-between">
              <h4 className="font-medium text-surface-900 dark:text-white">주요 평가</h4>
              {card!.stats.topFeelings.length > 6 && (
                <button
                  onClick={() => setShowAllFeelings(!showAllFeelings)}
                  className="flex items-center gap-1 text-xs text-surface-500 dark:text-surface-400"
                >
                  <span>{showAllFeelings ? '접기' : `+${card!.stats.topFeelings.length - 6}개 더보기`}</span>
                  <ChevronDown className={cn("h-3 w-3", showAllFeelings && "rotate-180")} />
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2">
              {displayedFeelings?.map((feeling) => (
                <div key={feeling.id} className="flex items-center justify-between rounded-xl bg-surface-50 dark:bg-surface-800 p-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{getFeelingEmoji(feeling.name)}</span>
                    <span className="text-sm font-medium text-surface-700 dark:text-surface-300">{getFeelingLabel(feeling.name)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-bold text-surface-900 dark:text-white">{feeling.count}</span>
                    <span className="text-xs text-surface-500 dark:text-surface-400">({feeling.percentage}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 카테고리별 리뷰 */}
        {card!.stats.categoryBreakdown.length > 0 && (
          <div className="mb-4">
            <div className="mb-3 flex items-center justify-between">
              <h4 className="font-medium text-surface-900 dark:text-white">카테고리별 리뷰</h4>
              {card!.stats.categoryBreakdown.length > 5 && (
                <button
                  onClick={() => setShowAllCategories(!showAllCategories)}
                  className="flex items-center gap-1 text-xs text-surface-500 dark:text-surface-400"
                >
                  <span>{showAllCategories ? '접기' : `+${card!.stats.categoryBreakdown.length - 5}개 더보기`}</span>
                  <ChevronDown className={cn("h-3 w-3", showAllCategories && "rotate-180")} />
                </button>
              )}
            </div>
            <div className="space-y-2">
              {displayedCategories?.map((category) => (
                <div key={category.category} className="flex items-center justify-between rounded-xl bg-surface-50 dark:bg-surface-800 p-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-surface-900 dark:text-white">{category.category}</span>
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                      <span className="text-xs text-surface-500 dark:text-surface-400">{category.averageRating.toFixed(1)}</span>
                    </div>
                  </div>
                  <span className="text-sm text-surface-600 dark:text-surface-400">{category.count}개</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 최근 리뷰 */}
        {card!.recentReviews.length > 0 && (
          <div className="mb-4">
            <div className="mb-4 flex items-center justify-between">
              <h4 className="font-semibold text-surface-900 dark:text-white">최근 리뷰 Top 10</h4>
              {card!.recentReviews.length > 3 && (
                <button
                  onClick={() => setShowAllReviews(!showAllReviews)}
                  className="flex items-center gap-1 text-xs text-surface-500 dark:text-surface-400"
                >
                  <span>{showAllReviews ? '접기' : `+${card!.recentReviews.length - 3}개 더보기`}</span>
                  <ChevronDown className={cn("h-3 w-3", showAllReviews && "rotate-180")} />
                </button>
              )}
            </div>
            <div className="space-y-3">
              {displayedReviews?.map((review) => (
                <div
                  key={review.created_date + review.place_id}
                  className="relative overflow-hidden rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 p-4 active:bg-surface-50 dark:active:bg-surface-700"
                  onClick={() => onPlaceClick(review.place_id)}
                >
                  <div className="mb-3 flex items-start justify-between">
                    <div className="flex-1">
                      <div className="mb-2 flex items-center gap-2">
                        {review.is_private ? (
                          <Lock className="h-3 w-3 text-surface-400" />
                        ) : (
                          <Unlock className="h-3 w-3 text-surface-400" />
                        )}
                        <h5 className="text-base font-semibold text-surface-900 dark:text-white">
                          {review.place_name}
                        </h5>
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                          <span className="text-xs font-medium text-surface-700 dark:text-surface-300">{review.score}</span>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-1 text-xs text-surface-500 dark:text-surface-400">
                        <span>{review.category}</span>
                        <span>•</span>
                        <span>{review.group1} {review.group2} {review.group3}</span>
                      </div>
                    </div>
                    <span className="text-xs text-surface-400 dark:text-surface-500">{review.created_date}</span>
                  </div>

                  {review.tags && review.tags.length > 0 && (
                    <div className="mb-3 flex flex-wrap gap-1">
                      {review.tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-1 rounded-lg bg-surface-100 dark:bg-surface-700 px-2 py-1 text-xs text-surface-600 dark:text-surface-300"
                        >
                          <span className="text-xs">{getFeelingEmoji(tag)}</span>
                          <span>{getFeelingLabel(tag)}</span>
                        </span>
                      ))}
                    </div>
                  )}

                  {review.review_content && (
                    <div className="relative">
                      <div className="absolute top-0 left-0 h-full w-1 rounded-full bg-primary-300 dark:bg-primary-600"></div>
                      <div className="pl-4">
                        <p className="text-sm leading-relaxed text-surface-600 dark:text-surface-400 line-clamp-2">
                          "{review.review_content}"
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 인사이트 */}
        <div className="rounded-xl bg-surface-50 dark:bg-surface-800 p-4">
          <h4 className="mb-3 text-sm font-medium text-surface-600 dark:text-surface-400">리뷰 인사이트</h4>
          <div className="space-y-2">
            {dynamicInsights.map((insight) => (
              <div key={insight} className="flex items-center gap-2 text-xs">
                <div className="h-2 w-2 rounded-full bg-primary-500"></div>
                <span className="text-surface-600 dark:text-surface-300">{insight}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </article>
  );
}

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
