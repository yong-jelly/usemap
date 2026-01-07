<script lang="ts">
	import { MapPin, Heart, Bookmark, Users, TrendingUp, BarChart3 } from 'lucide-svelte';

	interface VisitAnalysisData {
		id: string;
		title: string;
		period: string;
		myVisitedRestaurants: number;
		likedFromVisited: number;
		savedFromVisited: number;
		totalRecommendedRestaurants: number;
		visitedFromTotal: number;
		averageUserVisitRate: number;
		insights: string[];
		timestamp: string;
	}

	const { card } = $props<{ card: VisitAnalysisData }>();

	function getPerformanceLevel(percentage: number, average: number): string {
		if (percentage >= average + 20) return '매우 높음';
		if (percentage >= average + 10) return '높음';
		if (percentage >= average - 10) return '평균';
		return '낮음';
	}

	function getPerformanceColor(percentage: number, average: number): string {
		if (percentage >= average + 20) return 'bg-gray-800';
		if (percentage >= average + 10) return 'bg-gray-600';
		if (percentage >= average - 10) return 'bg-gray-500';
		return 'bg-gray-400';
	}

	let likedFromVisitedRatio = $derived(
		card.myVisitedRestaurants > 0 ? (card.likedFromVisited / card.myVisitedRestaurants) * 100 : 0,
	);
	let savedFromVisitedRatio = $derived(
		card.myVisitedRestaurants > 0 ? (card.savedFromVisited / card.myVisitedRestaurants) * 100 : 0,
	);
	let visitFromTotalRatio = $derived(
		card.totalRecommendedRestaurants > 0
			? (card.visitedFromTotal / card.totalRecommendedRestaurants) * 100
			: 0,
	);
</script>

<article class="mb-3 overflow-hidden rounded-lg border border-gray-100 bg-white shadow-sm">
	<!-- 헤더 -->
	<header class="p-4 pb-3">
		<div class="flex items-center justify-between">
			<div class="flex items-center gap-2">
				<div class="flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1">
					<BarChart3 class="h-3 w-3 text-gray-600" />
					<span class="text-xs font-medium text-gray-700">방문 분석</span>
				</div>
				<div class="rounded-full bg-gray-50 px-2 py-1">
					<span class="text-xs font-medium text-gray-600">{card.period}</span>
				</div>
			</div>
			<TrendingUp class="h-4 w-4 text-gray-400" />
		</div>
	</header>

	<div class="p-4 pt-0">
		<!-- 타이틀 -->
		<h3 class="mb-4 text-lg font-semibold text-gray-900">{card.title}</h3>

		<!-- 방문 현황 요약 -->
		<div class="mb-4 rounded-lg bg-gray-50 p-4">
			<h4 class="mb-3 text-sm font-medium text-gray-700">내 방문 현황</h4>
			<div class="grid grid-cols-3 gap-4 text-center">
				<div>
					<p class="text-2xl font-bold text-gray-900">{card.myVisitedRestaurants}</p>
					<p class="text-xs text-gray-500">총 방문</p>
				</div>
				<div>
					<p class="text-2xl font-bold text-gray-900">{card.likedFromVisited}</p>
					<p class="text-xs text-gray-500">방문 후 좋아요</p>
				</div>
				<div>
					<p class="text-2xl font-bold text-gray-900">{card.savedFromVisited}</p>
					<p class="text-xs text-gray-500">방문 후 저장</p>
				</div>
			</div>
		</div>

		<!-- 방문 → 좋아요 비율 -->
		<div class="mb-4">
			<div class="mb-2 flex items-center justify-between">
				<div class="flex items-center gap-2">
					<Heart class="h-4 w-4 text-gray-600" />
					<span class="text-sm font-medium text-gray-900">방문 → 좋아요</span>
				</div>
				<div class="flex items-center gap-2">
					<span class="text-sm font-bold text-gray-900">{likedFromVisitedRatio.toFixed(1)}%</span>
					<span class="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-500">만족도 지표</span>
				</div>
			</div>
			<div class="mb-2 h-2 w-full overflow-hidden rounded-full bg-gray-100">
				<div
					class="h-full rounded-full bg-gray-700 transition-all duration-500"
					style="width: {likedFromVisitedRatio}%"
				></div>
			</div>
			<div class="flex items-center justify-between text-xs text-gray-500">
				<span>{card.likedFromVisited}곳 좋아요</span>
				<span>{card.myVisitedRestaurants}곳 방문 중</span>
			</div>
		</div>

		<!-- 방문 → 저장 비율 -->
		<div class="mb-4">
			<div class="mb-2 flex items-center justify-between">
				<div class="flex items-center gap-2">
					<Bookmark class="h-4 w-4 text-gray-600" />
					<span class="text-sm font-medium text-gray-900">방문 → 저장</span>
				</div>
				<div class="flex items-center gap-2">
					<span class="text-sm font-bold text-gray-900">{savedFromVisitedRatio.toFixed(1)}%</span>
					<span class="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-500">재방문 의향</span>
				</div>
			</div>
			<div class="mb-2 h-2 w-full overflow-hidden rounded-full bg-gray-100">
				<div
					class="h-full rounded-full bg-gray-700 transition-all duration-500"
					style="width: {savedFromVisitedRatio}%"
				></div>
			</div>
			<div class="flex items-center justify-between text-xs text-gray-500">
				<span>{card.savedFromVisited}곳 저장</span>
				<span>{card.myVisitedRestaurants}곳 방문 중</span>
			</div>
		</div>

		<!-- 전체 추천 대비 방문 비율 -->
		<div class="mb-4">
			<div class="mb-2 flex items-center justify-between">
				<div class="flex items-center gap-2">
					<MapPin class="h-4 w-4 text-gray-600" />
					<span class="text-sm font-medium text-gray-900">전체 추천 대비 방문</span>
				</div>
				<div class="flex items-center gap-2">
					<span class="text-sm font-bold text-gray-900">{visitFromTotalRatio.toFixed(1)}%</span>
					<span class="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-500">
						{getPerformanceLevel(visitFromTotalRatio, card.averageUserVisitRate)}
					</span>
				</div>
			</div>
			<div class="mb-2 h-2 w-full overflow-hidden rounded-full bg-gray-100">
				<div
					class="{getPerformanceColor(
						visitFromTotalRatio,
						card.averageUserVisitRate,
					)} h-full rounded-full transition-all duration-500"
					style="width: {visitFromTotalRatio}%"
				></div>
			</div>
			<div class="flex items-center justify-between text-xs text-gray-500">
				<span>{card.visitedFromTotal}곳 방문</span>
				<span>{card.totalRecommendedRestaurants}곳 추천 중</span>
			</div>
		</div>

		<!-- 평균 비교 -->
		<div class="mb-4 rounded-lg bg-gray-50 p-4">
			<h4 class="mb-3 text-sm font-medium text-gray-700">평균 대비 비교</h4>
			<div class="space-y-2">
				<div class="flex items-center justify-between rounded border bg-white p-2">
					<span class="text-sm text-gray-600">내 방문률</span>
					<span class="text-sm font-medium text-gray-900">{visitFromTotalRatio.toFixed(1)}%</span>
				</div>
				<div class="flex items-center justify-between rounded border bg-white p-2">
					<span class="text-sm text-gray-600">평균 방문률</span>
					<span class="text-sm font-medium text-gray-900">
						{card.averageUserVisitRate.toFixed(1)}%
					</span>
				</div>
				<div class="flex items-center justify-between rounded border bg-white p-2">
					<span class="text-sm text-gray-600">차이</span>
					<span class="text-sm font-medium text-gray-900">
						{visitFromTotalRatio > card.averageUserVisitRate ? '+' : ''}{(
							visitFromTotalRatio - card.averageUserVisitRate
						).toFixed(1)}%p
					</span>
				</div>
			</div>
		</div>

		<!-- 만족도 분석 -->
		<div class="mb-4 rounded-lg bg-gray-50 p-4">
			<h4 class="mb-3 text-sm font-medium text-gray-700">방문 후 만족도</h4>
			<div class="grid grid-cols-2 gap-3">
				<div class="rounded bg-white p-3 text-center">
					<div class="mb-1 flex items-center justify-center gap-1">
						<Heart class="h-3 w-3 text-gray-600" />
						<span class="text-xs text-gray-600">좋아요율</span>
					</div>
					<p class="text-lg font-bold text-gray-900">{likedFromVisitedRatio.toFixed(0)}%</p>
					<p class="text-xs text-gray-500">
						{likedFromVisitedRatio >= 70
							? '매우 만족'
							: likedFromVisitedRatio >= 50
								? '만족'
								: likedFromVisitedRatio >= 30
									? '보통'
									: '아쉬움'}
					</p>
				</div>
				<div class="rounded bg-white p-3 text-center">
					<div class="mb-1 flex items-center justify-center gap-1">
						<Bookmark class="h-3 w-3 text-gray-600" />
						<span class="text-xs text-gray-600">저장율</span>
					</div>
					<p class="text-lg font-bold text-gray-900">{savedFromVisitedRatio.toFixed(0)}%</p>
					<p class="text-xs text-gray-500">
						{savedFromVisitedRatio >= 50
							? '재방문 의향 높음'
							: savedFromVisitedRatio >= 30
								? '재방문 의향 보통'
								: '재방문 의향 낮음'}
					</p>
				</div>
			</div>
		</div>

		<!-- 인사이트 -->
		<div class="rounded-lg bg-gray-50 p-4">
			<h4 class="mb-3 text-sm font-medium text-gray-700">분석 인사이트</h4>
			<div class="space-y-2">
				{#each card.insights as insight}
					<div class="flex items-center gap-2 text-xs">
						<div class="h-2 w-2 rounded-full bg-gray-800"></div>
						<span class="text-gray-600">{insight}</span>
					</div>
				{/each}
			</div>
		</div>
	</div>
</article>
