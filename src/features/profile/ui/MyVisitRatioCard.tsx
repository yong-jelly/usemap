import { useMemo } from "react";
import { Heart, Bookmark, MapPin, TrendingUp, Target } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import type { UserPlacesStatsBucket } from "@/entities/user/types";

interface MyVisitRatioCardProps {
  bucket?: UserPlacesStatsBucket | null;
}

interface VisitRatioData {
  id: string;
  title: string;
  period: string;
  totalRecommendedRestaurants: number;
  myLikedRestaurants: number;
  mySavedRestaurants: number;
  myVisitedRestaurants: number;
  visitedFromLiked: number;
  visitedFromSaved: number;
  visitedFromRecommended: number;
}

export function MyVisitRatioCard({ bucket }: MyVisitRatioCardProps) {
  const card = useMemo<VisitRatioData>(() => {
    const totalVisitedPlaces = bucket?.bucket_data_jsonb?.v1_aggr_user_places_region_stats?.reduce(
      (sum, stat) => sum + stat.visited,
      0,
    ) ?? 0;

    return {
      id: 'ratio-1',
      title: '내 방문 실행력 분석',
      period: '전체 기간',
      totalRecommendedRestaurants: bucket?.bucket_data_jsonb?.total_features_count ?? 0,
      myLikedRestaurants:
        bucket?.bucket_data_jsonb?.v1_aggr_user_places_region_stats?.reduce(
          (sum, stat) => sum + stat.liked,
          0,
        ) ?? 0,
      mySavedRestaurants:
        bucket?.bucket_data_jsonb?.v1_aggr_user_places_region_stats?.reduce(
          (sum, stat) => sum + stat.saved,
          0,
        ) ?? 0,
      myVisitedRestaurants: totalVisitedPlaces,
      visitedFromLiked: bucket?.bucket_data_jsonb?.total_liked_places_visited ?? 0,
      visitedFromSaved: bucket?.bucket_data_jsonb?.total_saved_places_visited ?? 0,
      visitedFromRecommended: bucket?.bucket_data_jsonb?.total_featured_place_visited ?? 0,
    };
  }, [bucket]);

  const likedVisitRatio = card.myLikedRestaurants > 0 
    ? (card.visitedFromLiked / card.myLikedRestaurants) * 100 
    : 0;

  const savedVisitRatio = card.mySavedRestaurants > 0 
    ? (card.visitedFromSaved / card.mySavedRestaurants) * 100 
    : 0;

  const totalVisitRatio = card.totalRecommendedRestaurants > 0
    ? (card.visitedFromRecommended / card.totalRecommendedRestaurants) * 100
    : 0;

  const executionScore = useMemo(() => {
    const likedWeight = 0.4;
    const savedWeight = 0.4;
    const totalWeight = 0.2;
    return (
      likedVisitRatio * likedWeight + savedVisitRatio * savedWeight + totalVisitRatio * totalWeight
    );
  }, [likedVisitRatio, savedVisitRatio, totalVisitRatio]);

  function getRatioLevel(percentage: number): string {
    if (percentage >= 70) return '매우 높음';
    if (percentage >= 50) return '높음';
    if (percentage >= 30) return '보통';
    return '낮음';
  }

  function getProgressColor(percentage: number): string {
    if (percentage >= 70) return 'bg-primary-500';
    if (percentage >= 50) return 'bg-primary-400';
    if (percentage >= 30) return 'bg-surface-500';
    return 'bg-surface-400';
  }

  const insights = useMemo(() => {
    const calculatedInsights: string[] = [];

    if (savedVisitRatio > likedVisitRatio) {
      calculatedInsights.push(`저장한 곳을 더 잘 방문하는 편 (${savedVisitRatio.toFixed(1)}%)`);
    } else {
      calculatedInsights.push(
        `좋아요한 곳 방문률은 ${likedVisitRatio.toFixed(1)}%로 ${getRatioLevel(likedVisitRatio)}`,
      );
    }

    calculatedInsights.push(
      `전체 추천 대비 방문률 ${totalVisitRatio.toFixed(1)}%는 ${getRatioLevel(totalVisitRatio)}`,
    );

    calculatedInsights.push(
      `실행력 점수 ${executionScore.toFixed(1)}점으로 ${executionScore >= 70 ? '우수함' : executionScore >= 50 ? '보통' : '개선 여지 있음'}`,
    );

    return calculatedInsights;
  }, [savedVisitRatio, likedVisitRatio, totalVisitRatio, executionScore]);

  return (
    <article className="overflow-hidden rounded-2xl border border-surface-100 dark:border-surface-800 bg-white dark:bg-surface-900">
      {/* 헤더 */}
      <header className="p-4 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-lg bg-surface-100 dark:bg-surface-800 px-2.5 py-1.5">
              <Target className="h-3.5 w-3.5 text-surface-500 dark:text-surface-400" />
              <span className="text-xs font-medium text-surface-700 dark:text-surface-300">방문 비율</span>
            </div>
            <div className="flex items-center gap-1 rounded-lg bg-surface-100 dark:bg-surface-800 px-2.5 py-1.5">
              <span className="text-xs font-medium text-surface-500 dark:text-surface-400">{card.period}</span>
            </div>
          </div>
          <TrendingUp className="h-4 w-4 text-surface-400 dark:text-surface-500" />
        </div>
      </header>

      <div className="p-4 pt-0">
        <h3 className="mb-4 text-lg font-semibold text-surface-900 dark:text-white">{card.title}</h3>

        {/* 방문 현황 요약 */}
        <div className="mb-4 rounded-xl bg-surface-50 dark:bg-surface-800 p-4">
          <h4 className="mb-3 text-sm font-medium text-surface-600 dark:text-surface-400">내 방문 현황</h4>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-surface-900 dark:text-white">{card.myVisitedRestaurants}</p>
              <p className="text-xs text-surface-500 dark:text-surface-400">총 방문</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-surface-900 dark:text-white">{card.myLikedRestaurants}</p>
              <p className="text-xs text-surface-500 dark:text-surface-400">좋아요</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-surface-900 dark:text-white">{card.mySavedRestaurants}</p>
              <p className="text-xs text-surface-500 dark:text-surface-400">저장</p>
            </div>
          </div>
        </div>

        {/* 좋아요 → 방문 비율 */}
        <div className="mb-4">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Heart className="h-4 w-4 text-rose-500" />
              <span className="text-sm font-medium text-surface-900 dark:text-white">좋아요 → 방문</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-surface-900 dark:text-white">{likedVisitRatio.toFixed(1)}%</span>
              <span className="rounded-lg bg-surface-100 dark:bg-surface-800 px-2 py-1 text-xs text-surface-500 dark:text-surface-400">
                {getRatioLevel(likedVisitRatio)}
              </span>
            </div>
          </div>
          <div className="mb-2 h-2 w-full overflow-hidden rounded-full bg-surface-100 dark:bg-surface-800">
            <div
              className={cn(getProgressColor(likedVisitRatio), "h-full rounded-full")}
              style={{ width: `${likedVisitRatio}%` }}
            ></div>
          </div>
          <div className="flex items-center justify-between text-xs text-surface-500 dark:text-surface-400">
            <span>방문 {card.visitedFromLiked}</span>
            <span>좋아요 {card.myLikedRestaurants}</span>
          </div>
        </div>

        {/* 저장 → 방문 비율 */}
        <div className="mb-4">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bookmark className="h-4 w-4 text-amber-500" />
              <span className="text-sm font-medium text-surface-900 dark:text-white">저장 → 방문</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-surface-900 dark:text-white">{savedVisitRatio.toFixed(1)}%</span>
              <span className="rounded-lg bg-surface-100 dark:bg-surface-800 px-2 py-1 text-xs text-surface-500 dark:text-surface-400">
                {getRatioLevel(savedVisitRatio)}
              </span>
            </div>
          </div>
          <div className="mb-2 h-2 w-full overflow-hidden rounded-full bg-surface-100 dark:bg-surface-800">
            <div
              className={cn(getProgressColor(savedVisitRatio), "h-full rounded-full")}
              style={{ width: `${savedVisitRatio}%` }}
            ></div>
          </div>
          <div className="flex items-center justify-between text-xs text-surface-500 dark:text-surface-400">
            <span>방문 {card.visitedFromSaved}</span>
            <span>저장 {card.mySavedRestaurants}</span>
          </div>
        </div>

        {/* 전체 추천 → 방문 비율 */}
        <div className="mb-4">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary-500" />
              <span className="text-sm font-medium text-surface-900 dark:text-white">전체 추천 → 방문</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-surface-900 dark:text-white">{totalVisitRatio.toFixed(1)}%</span>
              <span className="rounded-lg bg-surface-100 dark:bg-surface-800 px-2 py-1 text-xs text-surface-500 dark:text-surface-400">
                {getRatioLevel(totalVisitRatio)}
              </span>
            </div>
          </div>
          <div className="mb-2 h-2 w-full overflow-hidden rounded-full bg-surface-100 dark:bg-surface-800">
            <div
              className={cn(getProgressColor(totalVisitRatio), "h-full rounded-full")}
              style={{ width: `${totalVisitRatio}%` }}
            ></div>
          </div>
          <div className="flex items-center justify-between text-xs text-surface-500 dark:text-surface-400">
            <span>방문 {card.visitedFromRecommended}</span>
            <span>추천 {card.totalRecommendedRestaurants}</span>
          </div>
        </div>

        {/* 비교 분석 */}
        <div className="mb-4 rounded-xl bg-surface-50 dark:bg-surface-800 p-4">
          <h4 className="mb-3 text-sm font-medium text-surface-600 dark:text-surface-400">비교 분석</h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 p-3">
              <span className="text-sm text-surface-600 dark:text-surface-400">저장 vs 좋아요</span>
              <span className="text-sm font-medium text-surface-900 dark:text-white">
                {savedVisitRatio > likedVisitRatio ? '저장' : '좋아요'}가{' '}
                {Math.abs(savedVisitRatio - likedVisitRatio).toFixed(1)}%p 높음
              </span>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 p-3">
              <span className="text-sm text-surface-600 dark:text-surface-400">실행력 점수</span>
              <span className="text-sm font-medium text-surface-900 dark:text-white">
                {executionScore.toFixed(1)}점 / 100점
              </span>
            </div>
          </div>
        </div>

        {/* 인사이트 */}
        <div className="rounded-xl bg-surface-50 dark:bg-surface-800 p-4">
          <h4 className="mb-3 text-sm font-medium text-surface-600 dark:text-surface-400">인사이트</h4>
          <div className="space-y-2">
            {insights.map((insight) => (
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
