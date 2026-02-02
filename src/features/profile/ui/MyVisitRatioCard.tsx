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
  insights: string[];
  timestamp: string;
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
      // 총 추천 장소 수
      totalRecommendedRestaurants: bucket?.bucket_data_jsonb?.total_features_count ?? 0,
      // 좋아요한 장소 수
      myLikedRestaurants:
        bucket?.bucket_data_jsonb?.v1_aggr_user_places_region_stats?.reduce(
          (sum, stat) => sum + stat.liked,
          0,
        ) ?? 0,
      // 저장한 장소 수
      mySavedRestaurants:
        bucket?.bucket_data_jsonb?.v1_aggr_user_places_region_stats?.reduce(
          (sum, stat) => sum + stat.saved,
          0,
        ) ?? 0,
      // 방문한 장소 수
      myVisitedRestaurants: totalVisitedPlaces,
      // 방문후 좋아요
      visitedFromLiked: bucket?.bucket_data_jsonb?.total_liked_places_visited ?? 0,
      // 방문후 저장
      visitedFromSaved: bucket?.bucket_data_jsonb?.total_saved_places_visited ?? 0,
      // 추천 장소 수 중 방문한 장소 수
      visitedFromRecommended: bucket?.bucket_data_jsonb?.total_featured_place_visited ?? 0,
      insights: [],
      timestamp: new Date(Date.now() - 7 * 60 * 60 * 1000).toISOString(),
    };
  }, [bucket]);

  // 방문 비율 계산
  const likedVisitRatio = card.myLikedRestaurants > 0 
    ? (card.visitedFromLiked / card.myLikedRestaurants) * 100 
    : 0;

  const savedVisitRatio = card.mySavedRestaurants > 0 
    ? (card.visitedFromSaved / card.mySavedRestaurants) * 100 
    : 0;

  const totalVisitRatio = card.totalRecommendedRestaurants > 0
    ? (card.visitedFromRecommended / card.totalRecommendedRestaurants) * 100
    : 0;

  // 실행력 점수 계산 (가중 평균)
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
    if (percentage >= 70) return 'bg-gray-800';
    if (percentage >= 50) return 'bg-gray-600';
    if (percentage >= 30) return 'bg-gray-500';
    return 'bg-gray-400';
  }

  // 인사이트 생성
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
    <article className="mb-3 overflow-hidden rounded-lg border border-gray-100 bg-white shadow-sm">
      {/* 헤더 */}
      <header className="p-4 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 rounded bg-gray-100 px-2 py-1">
              <Target className="h-3 w-3 text-gray-600" />
              <span className="text-xs font-medium text-gray-700">방문 비율</span>
            </div>
            <div className="flex items-center gap-1 rounded bg-gray-100 px-2 py-1">
              <span className="text-xs font-medium text-gray-600">{card.period}</span>
            </div>
          </div>
          <TrendingUp className="h-4 w-4 text-gray-400" />
        </div>
      </header>

      <div className="p-4 pt-0">
        {/* 타이틀 */}
        <h3 className="mb-4 text-lg font-semibold text-gray-900">{card.title}</h3>

        {/* 방문 현황 요약 */}
        <div className="mb-4 rounded-lg bg-gray-50 p-4">
          <h4 className="mb-3 text-sm font-medium text-gray-700">내 방문 현황</h4>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-gray-900">{card.myVisitedRestaurants}</p>
              <p className="text-xs text-gray-500">총 방문</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{card.myLikedRestaurants}</p>
              <p className="text-xs text-gray-500">좋아요</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{card.mySavedRestaurants}</p>
              <p className="text-xs text-gray-500">저장</p>
            </div>
          </div>
        </div>

        {/* 좋아요 → 방문 비율 */}
        <div className="mb-4">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Heart className="h-4 w-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-900">좋아요 → 방문</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-gray-900">{likedVisitRatio.toFixed(1)}%</span>
              <span className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-500">
                {getRatioLevel(likedVisitRatio)}
              </span>
            </div>
          </div>
          <div className="mb-2 h-2 w-full overflow-hidden rounded-full bg-gray-100">
            <div
              className={cn(
                getProgressColor(likedVisitRatio),
                "h-full rounded-full transition-all duration-500"
              )}
              style={{ width: `${likedVisitRatio}%` }}
            ></div>
          </div>
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>방문 {card.visitedFromLiked}</span>
            <span>좋아요 {card.myLikedRestaurants}</span>
          </div>
        </div>

        {/* 저장 → 방문 비율 */}
        <div className="mb-4">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bookmark className="h-4 w-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-900">저장 → 방문</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-gray-900">{savedVisitRatio.toFixed(1)}%</span>
              <span className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-500">
                {getRatioLevel(savedVisitRatio)}
              </span>
            </div>
          </div>
          <div className="mb-2 h-2 w-full overflow-hidden rounded-full bg-gray-100">
            <div
              className={cn(
                getProgressColor(savedVisitRatio),
                "h-full rounded-full transition-all duration-500"
              )}
              style={{ width: `${savedVisitRatio}%` }}
            ></div>
          </div>
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>방문 {card.visitedFromSaved}</span>
            <span>저장 {card.mySavedRestaurants}</span>
          </div>
        </div>

        {/* 전체 추천 → 방문 비율 */}
        <div className="mb-4">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-900">전체 추천 → 방문</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-gray-900">{totalVisitRatio.toFixed(1)}%</span>
              <span className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-500">
                {getRatioLevel(totalVisitRatio)}
              </span>
            </div>
          </div>
          <div className="mb-2 h-2 w-full overflow-hidden rounded-full bg-gray-100">
            <div
              className={cn(
                getProgressColor(totalVisitRatio),
                "h-full rounded-full transition-all duration-500"
              )}
              style={{ width: `${totalVisitRatio}%` }}
            ></div>
          </div>
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>방문 {card.visitedFromRecommended}</span>
            <span>추천 {card.totalRecommendedRestaurants}</span>
          </div>
        </div>

        {/* 비교 분석 */}
        <div className="mb-4 rounded-lg bg-gray-50 p-4">
          <h4 className="mb-3 text-sm font-medium text-gray-700">비교 분석</h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between rounded border bg-white p-2">
              <span className="text-sm text-gray-600">저장 vs 좋아요</span>
              <span className="text-sm font-medium text-gray-900">
                {savedVisitRatio > likedVisitRatio ? '저장' : '좋아요'}가{' '}
                {Math.abs(savedVisitRatio - likedVisitRatio).toFixed(1)}%p 높음
              </span>
            </div>
            <div className="flex items-center justify-between rounded border bg-white p-2">
              <span className="text-sm text-gray-600">실행력 점수</span>
              <span className="text-sm font-medium text-gray-900">
                {executionScore.toFixed(1)}점 / 100점
              </span>
            </div>
          </div>
        </div>

        {/* 인사이트 */}
        <div className="rounded-lg bg-gray-50 p-4">
          <h4 className="mb-3 text-sm font-medium text-gray-700">인사이트</h4>
          <div className="space-y-2">
            {insights.map((insight) => (
              <div key={insight} className="flex items-center gap-2 text-xs">
                <div className="h-2 w-2 rounded-full bg-gray-800"></div>
                <span className="text-gray-600">{insight}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </article>
  );
}
