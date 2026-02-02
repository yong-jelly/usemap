import { useState, useMemo } from "react";
import { BarChart, Heart, Bookmark, MapPin } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import type { 
  UserPlacesStatsBucket, 
  UserPlaceRegionStats, 
  UserPlaceCategorizedStats 
} from "@/entities/user/types";

// ----------------------- 타입 정의 -----------------------
interface PreferenceItem {
  name: string;
  total: number;
  likes: number;
  saves: number;
  visits: number;
}

interface PreferenceCardData {
  title: string;
  period: string;
  summary: {
    totalActivities: number;
    topRegion: string;
    topCategory: string;
  };
  regionPreferences: PreferenceItem[];
  categoryPreferences: PreferenceItem[];
}

interface MyPreferencesChartProps {
  bucket?: UserPlacesStatsBucket | null;
}

// ----------------------- 데이터 가공 로직 ------------------------------
function mapRegionStats(stats: UserPlaceRegionStats[]): PreferenceItem[] {
  return stats
    .map((s) => ({
      name: s.agg_group,
      total: s.all,
      likes: s.liked,
      saves: s.saved,
      visits: s.visited,
    }))
    .sort((a, b) => b.total - a.total);
}

function mapCategoryStats(stats: UserPlaceCategorizedStats[]): PreferenceItem[] {
  const items: PreferenceItem[] = stats
    .map((s) => ({
      name: s.agg_group,
      total: s.all,
      likes: s.liked,
      saves: s.saved,
      visits: s.visited,
    }))
    .sort((a, b) => b.total - a.total);

  if (items.length <= 10) return items;

  const top10 = items.slice(0, 10);
  const others = items.slice(10);

  const aggregate = {
    name: '기타',
    total: others.reduce((sum, i) => sum + i.total, 0),
    likes: others.reduce((sum, i) => sum + i.likes, 0),
    saves: others.reduce((sum, i) => sum + i.saves, 0),
    visits: others.reduce((sum, i) => sum + i.visits, 0),
  };

  return [...top10, aggregate];
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getFullYear()}.${(d.getMonth() + 1).toString().padStart(2, '0')}.${d.getDate().toString().padStart(2, '0')}`;
}

function parseBucket(b: UserPlacesStatsBucket | undefined): PreferenceCardData {
  if (!b) {
    return {
      title: '내 취향 분석',
      period: '-',
      summary: { totalActivities: 0, topRegion: '-', topCategory: '-' },
      regionPreferences: [],
      categoryPreferences: [],
    };
  }
  const regionStats = b.bucket_data_jsonb.v1_aggr_user_places_region_stats || [];
  const categoryStats = b.bucket_data_jsonb.v1_aggr_user_places_categorized_stats || [];

  const regionPreferences = mapRegionStats(regionStats);
  const categoryPreferences = mapCategoryStats(categoryStats);
  const totalActivities = regionStats.reduce((sum, r) => sum + r.all, 0);

  return {
    title: '내 활동과 취향 분석',
    period: formatDate(b.bucket_created_at),
    summary: {
      totalActivities,
      topRegion: regionPreferences[0]?.name || '-',
      topCategory: categoryPreferences[0]?.name || '-',
    },
    regionPreferences,
    categoryPreferences,
  };
}

export function MyPreferencesChart({ bucket }: MyPreferencesChartProps) {
  const [showAllRegions, setShowAllRegions] = useState(false);
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [currentView, setCurrentView] = useState(0);

  const card = useMemo(() => parseBucket(bucket || undefined), [bucket]);

  const viewLabels = ['전체', '좋아요', '저장', '방문'];
  const ViewIcons = [BarChart, Heart, Bookmark, MapPin];

  function getTopItems(items: PreferenceItem[], showAll: boolean): PreferenceItem[] {
    return showAll ? items : items.slice(0, 4);
  }

  function getValueByView(item: PreferenceItem, view: number): number {
    switch (view) {
      case 0: return item.total;
      case 1: return item.likes;
      case 2: return item.saves;
      case 3: return item.visits;
      default: return item.total;
    }
  }

  return (
    <article className="overflow-hidden rounded-2xl border border-surface-100 dark:border-surface-800 bg-white dark:bg-surface-900">
      {/* 헤더 */}
      <header className="p-4 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-lg bg-surface-100 dark:bg-surface-800 px-2.5 py-1.5">
              <BarChart className="h-3.5 w-3.5 text-surface-500 dark:text-surface-400" />
              <span className="text-xs font-medium text-surface-700 dark:text-surface-300">내 취향 분석</span>
            </div>
            <div className="flex items-center gap-1 rounded-lg bg-surface-100 dark:bg-surface-800 px-2.5 py-1.5">
              <span className="text-xs font-medium text-surface-500 dark:text-surface-400">{card.period} 기준</span>
            </div>
          </div>
        </div>
      </header>

      <div className="p-4 pt-0">
        {/* 타이틀 */}
        <h3 className="mb-4 text-lg font-semibold text-surface-900 dark:text-white">{card.title}</h3>

        {/* 활동 요약 */}
        <div className="mb-4 rounded-xl bg-surface-50 dark:bg-surface-800 p-4">
          <h4 className="mb-3 text-sm font-medium text-surface-600 dark:text-surface-400">활동 요약</h4>
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-surface-900 dark:text-white">{card.summary.totalActivities}</p>
              <p className="text-xs text-surface-500 dark:text-surface-400">총 활동</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-surface-900 dark:text-white">
                {card.regionPreferences.filter((r) => r.visits > 0).length}
                <span className="text-sm font-normal text-surface-400">/ 14</span>
              </p>
              <p className="text-xs text-surface-500 dark:text-surface-400">지역 방문</p>
            </div>
          </div>
          <div className="mt-3 space-y-1 border-t border-surface-200 dark:border-surface-700 pt-3">
            <p className="text-sm text-surface-600 dark:text-surface-400">
              가장 많이 방문한 지역: <span className="font-medium text-surface-900 dark:text-white">{card.summary.topRegion}</span>
            </p>
            <p className="text-sm text-surface-600 dark:text-surface-400">
              선호 음식 종류: <span className="font-medium text-surface-900 dark:text-white">{card.summary.topCategory}</span>
            </p>
          </div>
        </div>

        {/* 활동별 보기 탭 */}
        <div className="mb-4 flex items-center gap-1 rounded-xl bg-surface-100 dark:bg-surface-800 p-1">
          {viewLabels.map((label, index) => {
            const Icon = ViewIcons[index];
            return (
              <button
                key={label}
                className={cn(
                  "flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium",
                  currentView === index
                    ? "bg-white dark:bg-surface-700 text-surface-900 dark:text-white"
                    : "text-surface-500 dark:text-surface-400"
                )}
                onClick={() => setCurrentView(index)}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            );
          })}
        </div>

        {/* 지역별 선호도 */}
        <div className="mb-6">
          <div className="mb-3 flex items-center justify-between">
            <h4 className="font-medium text-surface-900 dark:text-white">지역별 선호도</h4>
            {card.regionPreferences.length > 4 && (
              <button
                className="text-xs text-surface-500 dark:text-surface-400"
                onClick={() => setShowAllRegions(!showAllRegions)}
              >
                {showAllRegions ? '접기' : `+${card.regionPreferences.length - 4}개 더보기`}
              </button>
            )}
          </div>

          <div className="space-y-2">
            {card.regionPreferences.length === 0 ? (
              <p className="py-4 text-center text-sm text-surface-500 dark:text-surface-400">데이터가 없습니다.</p>
            ) : (
              getTopItems(card.regionPreferences, showAllRegions).map((region) => {
                const value = getValueByView(region, currentView);
                const totalValue = card.regionPreferences.reduce(
                  (sum, item) => sum + getValueByView(item, currentView),
                  0
                );
                const percentage = totalValue > 0 ? Math.round((value / totalValue) * 100) : 0;
                
                return (
                  <div key={region.name} className="flex items-center gap-3">
                    <div className="w-12 text-right text-sm text-surface-600 dark:text-surface-400">{region.name}</div>
                    <div className="relative flex-1">
                      <div className="h-6 w-full overflow-hidden rounded-full bg-surface-100 dark:bg-surface-800">
                        {value > 0 && (
                          <div
                            className="flex h-full items-center justify-end rounded-full bg-surface-800 dark:bg-surface-500 pr-2"
                            style={{ width: `${percentage}%` }}
                          >
                            {percentage >= 10 && (
                              <span className="text-xs font-medium text-white dark:text-surface-900">{percentage}%</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="w-10 text-right text-xs text-surface-500 dark:text-surface-400">{value}</div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* 카테고리별 선호도 */}
        <div className="mb-4">
          <div className="mb-3 flex items-center justify-between">
            <h4 className="font-medium text-surface-900 dark:text-white">음식 카테고리별 선호도</h4>
            {card.categoryPreferences.length > 4 && (
              <button
                className="text-xs text-surface-500 dark:text-surface-400"
                onClick={() => setShowAllCategories(!showAllCategories)}
              >
                {showAllCategories ? '접기' : `+${card.categoryPreferences.length - 4}개 더보기`}
              </button>
            )}
          </div>

          <div className="space-y-2">
            {card.categoryPreferences.length === 0 ? (
              <p className="py-4 text-center text-sm text-surface-500 dark:text-surface-400">데이터가 없습니다.</p>
            ) : (
              getTopItems(card.categoryPreferences, showAllCategories).map((category) => {
                const value = getValueByView(category, currentView);
                const isOthers = category.name === '기타';
                const totalValue = card.categoryPreferences
                  .filter((item) => item.name !== '기타')
                  .reduce((sum, item) => sum + getValueByView(item, currentView), 0);
                const percentage = !isOthers && totalValue > 0 ? Math.round((value / totalValue) * 100) : 0;

                return (
                  <div key={category.name} className="flex items-center gap-3">
                    <div className="w-12 text-right text-sm text-surface-600 dark:text-surface-400">
                      {category.name.includes(',') ? category.name.split(',')[0] : category.name}
                    </div>
                    <div className="relative flex-1">
                      <div className="h-6 w-full overflow-hidden rounded-full bg-surface-100 dark:bg-surface-800">
                        {!isOthers && value > 0 && (
                          <div
                            className="flex h-full items-center justify-end rounded-full bg-surface-800 dark:bg-surface-500 pr-2"
                            style={{ width: `${percentage}%` }}
                          >
                            {percentage >= 10 && (
                              <span className="text-xs font-medium text-white dark:text-surface-900">{percentage}%</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="w-10 text-right text-xs text-surface-500 dark:text-surface-400">{value}</div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* 취향 인사이트 */}
        <div className="rounded-xl bg-surface-50 dark:bg-surface-800 p-4">
          <h4 className="mb-3 text-sm font-medium text-surface-600 dark:text-surface-400">취향 인사이트</h4>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs">
              <div className="h-2 w-2 rounded-full bg-primary-500"></div>
              <span className="text-surface-600 dark:text-surface-300">{card.summary.topRegion}에서 가장 활발하게 활동</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <div className="h-2 w-2 rounded-full bg-primary-500"></div>
              <span className="text-surface-600 dark:text-surface-300">{card.summary.topCategory} 음식을 가장 선호</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <div className="h-2 w-2 rounded-full bg-primary-500"></div>
              <span className="text-surface-600 dark:text-surface-300">
                {card.regionPreferences.filter((r) => r.visits > 0).length}개 지역,{' '}
                {bucket
                  ? bucket.bucket_data_jsonb.v1_aggr_user_places_categorized_stats.filter((c) => c.visited > 0).length
                  : card.categoryPreferences.filter((c) => c.visits > 0).length}
                개 카테고리 경험
              </span>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
