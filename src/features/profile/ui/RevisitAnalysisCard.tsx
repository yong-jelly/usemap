import { RefreshCw, Trophy, ChevronDown } from "lucide-react";
import { useState } from "react";
import { cn } from "@/shared/lib/utils";
import type { RevisitAnalysis } from "@/entities/user/types";

interface RevisitAnalysisCardProps {
  data?: RevisitAnalysis | null;
  onPlaceClick: (placeId: string) => void;
}

export function RevisitAnalysisCard({ data, onPlaceClick }: RevisitAnalysisCardProps) {
  const [showAllPlaces, setShowAllPlaces] = useState(false);

  if (!data || data.total_unique_places === 0) {
    return (
      <article className="overflow-hidden rounded-2xl border border-surface-100 dark:border-surface-800 bg-white dark:bg-surface-900 p-4">
        <div className="flex flex-col items-center justify-center py-8">
          <div className="mb-4 rounded-full bg-surface-100 dark:bg-surface-800 p-4">
            <RefreshCw className="h-8 w-8 text-surface-400 dark:text-surface-500" />
          </div>
          <h4 className="mb-2 text-base font-medium text-surface-900 dark:text-white">방문 기록이 없어요</h4>
          <p className="text-center text-sm text-surface-500 dark:text-surface-400">
            방문 기록을 남기면 단골 장소를 분석해드려요
          </p>
        </div>
      </article>
    );
  }

  const displayedPlaces = showAllPlaces 
    ? data.top_revisited 
    : data.top_revisited.slice(0, 5);

  const getRevisitLevel = (rate: number): { label: string; color: string } => {
    if (rate >= 50) return { label: '단골 전문가', color: 'text-amber-500' };
    if (rate >= 30) return { label: '재방문 마니아', color: 'text-primary-500' };
    if (rate >= 15) return { label: '탐험가', color: 'text-green-500' };
    return { label: '개척자', color: 'text-blue-500' };
  };

  const levelInfo = getRevisitLevel(data.revisit_rate);

  return (
    <article className="overflow-hidden rounded-2xl border border-surface-100 dark:border-surface-800 bg-white dark:bg-surface-900">
      {/* 헤더 */}
      <header className="p-4 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-lg bg-surface-100 dark:bg-surface-800 px-2.5 py-1.5">
              <RefreshCw className="h-3.5 w-3.5 text-surface-500 dark:text-surface-400" />
              <span className="text-xs font-medium text-surface-700 dark:text-surface-300">재방문 분석</span>
            </div>
          </div>
          <Trophy className="h-4 w-4 text-amber-400" />
        </div>
      </header>

      <div className="p-4 pt-0">
        <h3 className="mb-4 text-lg font-semibold text-surface-900 dark:text-white">나의 단골 장소</h3>

        {/* 요약 */}
        <div className="mb-4 rounded-xl bg-surface-50 dark:bg-surface-800 p-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-surface-900 dark:text-white">{data.total_unique_places}</p>
              <p className="text-xs text-surface-500 dark:text-surface-400">방문 장소</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-surface-900 dark:text-white">{data.revisited_places_count}</p>
              <p className="text-xs text-surface-500 dark:text-surface-400">재방문 장소</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-primary-500">{data.revisit_rate}%</p>
              <p className="text-xs text-surface-500 dark:text-surface-400">재방문율</p>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-surface-200 dark:border-surface-700 text-center">
            <span className={cn("text-sm font-medium", levelInfo.color)}>
              {levelInfo.label}
            </span>
            <p className="text-xs text-surface-500 dark:text-surface-400 mt-1">
              방문한 장소 중 {data.revisit_rate}%를 재방문했어요
            </p>
          </div>
        </div>

        {/* 재방문율 게이지 */}
        <div className="mb-4">
          <h4 className="mb-3 font-medium text-surface-900 dark:text-white">재방문율</h4>
          <div className="h-4 w-full overflow-hidden rounded-full bg-surface-100 dark:bg-surface-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary-400 to-primary-600"
              style={{ width: `${Math.min(data.revisit_rate, 100)}%` }}
            ></div>
          </div>
          <div className="mt-2 flex justify-between text-xs text-surface-500 dark:text-surface-400">
            <span>0%</span>
            <span>개척자</span>
            <span>탐험가</span>
            <span>마니아</span>
            <span>전문가</span>
            <span>100%</span>
          </div>
        </div>

        {/* 단골 장소 TOP */}
        {data.top_revisited.length > 0 && (
          <div className="mb-4">
            <div className="mb-3 flex items-center justify-between">
              <h4 className="font-medium text-surface-900 dark:text-white">단골 장소 TOP {data.top_revisited.length}</h4>
              {data.top_revisited.length > 5 && (
                <button
                  onClick={() => setShowAllPlaces(!showAllPlaces)}
                  className="flex items-center gap-1 text-xs text-surface-500 dark:text-surface-400"
                >
                  <span>{showAllPlaces ? '접기' : `+${data.top_revisited.length - 5}개 더보기`}</span>
                  <ChevronDown className={cn("h-3 w-3", showAllPlaces && "rotate-180")} />
                </button>
              )}
            </div>
            <div className="space-y-2">
              {displayedPlaces.map((place, index) => (
                <div
                  key={place.place_id}
                  className="flex items-center gap-3 p-3 rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 active:bg-surface-50 dark:active:bg-surface-700"
                  onClick={() => onPlaceClick(place.place_id)}
                >
                  {/* 순위 */}
                  <div className={cn(
                    "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold",
                    index === 0 && "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400",
                    index === 1 && "bg-surface-200 dark:bg-surface-700 text-surface-600 dark:text-surface-300",
                    index === 2 && "bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400",
                    index > 2 && "bg-surface-100 dark:bg-surface-800 text-surface-500"
                  )}>
                    {index + 1}
                  </div>

                  {/* 장소 정보 */}
                  <div className="flex-1 min-w-0">
                    <h5 className="font-medium text-surface-900 dark:text-white truncate">
                      {place.place_name}
                    </h5>
                    <div className="flex items-center gap-1 text-xs text-surface-500 dark:text-surface-400">
                      <span>{place.category}</span>
                      <span>•</span>
                      <span>{place.group2} {place.group3}</span>
                    </div>
                  </div>

                  {/* 방문 횟수 */}
                  <div className="flex-shrink-0 text-right">
                    <p className="text-lg font-bold text-primary-500">{place.visit_count}회</p>
                    <p className="text-xs text-surface-400 dark:text-surface-500">방문</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 인사이트 */}
        <div className="rounded-xl bg-surface-50 dark:bg-surface-800 p-4">
          <h4 className="mb-3 text-sm font-medium text-surface-600 dark:text-surface-400">재방문 인사이트</h4>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs">
              <div className="h-2 w-2 rounded-full bg-primary-500"></div>
              <span className="text-surface-600 dark:text-surface-300">
                총 {data.total_unique_places}곳 방문 중 {data.revisited_places_count}곳 재방문
              </span>
            </div>
            {data.top_revisited.length > 0 && (
              <>
                <div className="flex items-center gap-2 text-xs">
                  <div className="h-2 w-2 rounded-full bg-primary-500"></div>
                  <span className="text-surface-600 dark:text-surface-300">
                    최다 방문: {data.top_revisited[0].place_name} ({data.top_revisited[0].visit_count}회)
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <div className="h-2 w-2 rounded-full bg-primary-500"></div>
                  <span className="text-surface-600 dark:text-surface-300">
                    가장 오래된 단골: {data.top_revisited.sort((a, b) => 
                      new Date(a.first_visited_at).getTime() - new Date(b.first_visited_at).getTime()
                    )[0]?.first_visited_at}부터
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
