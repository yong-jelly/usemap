<!-- @migration-task Error while migrating Svelte code: `$:` is not allowed in runes mode, use `$derived` or `$effect` instead
https://svelte.dev/e/legacy_reactive_statement_invalid -->
<!-- @migration-task Error while migrating Svelte code: `$:` is not allowed in runes mode, use `$derived` or `$effect` instead
https://svelte.dev/e/legacy_reactive_statement_invalid -->
<script lang="ts">
	import { Heart, Bookmark, MapPin, TrendingUp, Target } from 'lucide-svelte';

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

	const { card } = $props<{ card: VisitRatioData }>();

	function getProgressColor(percentage: number): string {
		if (percentage >= 70) return 'bg-gray-800';
		if (percentage >= 50) return 'bg-gray-600';
		if (percentage >= 30) return 'bg-gray-500';
		return 'bg-gray-400';
	}

	function getRatioLevel(percentage: number): string {
		if (percentage >= 70) return '매우 높음';
		if (percentage >= 50) return '높음';
		if (percentage >= 30) return '보통';
		return '낮음';
	}

	let likedVisitRatio = $derived(card.myLikedRestaurants > 0 ? (card.visitedFromLiked / card.myLikedRestaurants) * 100 : 0);
	let savedVisitRatio = $derived(card.mySavedRestaurants > 0 ? (card.visitedFromSaved / card.mySavedRestaurants) * 100 : 0);
	let totalVisitRatio = $derived(card.totalRecommendedRestaurants > 0 ? (card.visitedFromRecommended / card.totalRecommendedRestaurants) * 100 : 0);
</script>

<article class="bg-white rounded-lg shadow-sm mb-3 overflow-hidden border border-gray-100">
	<!-- 헤더 -->
	<header class="p-4 pb-3">
		<div class="flex items-center justify-between">
			<div class="flex items-center gap-2">
				<div class="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-full">
					<Target class="w-3 h-3 text-gray-600" />
					<span class="text-xs font-medium text-gray-700">방문 비율</span>
				</div>
				<div class="px-2 py-1 bg-gray-50 rounded-full">
					<span class="text-xs font-medium text-gray-600">{card.period}</span>
				</div>
			</div>
			<TrendingUp class="w-4 h-4 text-gray-400" />
		</div>
	</header>

	<div class="p-4 pt-0">
		<!-- 타이틀 -->
		<h3 class="font-semibold text-gray-900 text-lg mb-4">{card.title}</h3>

		<!-- 방문 현황 요약 -->
		<div class="bg-gray-50 rounded-lg p-4 mb-4">
			<h4 class="text-sm font-medium text-gray-700 mb-3">내 방문 현황</h4>
			<div class="grid grid-cols-3 gap-4 text-center">
				<div>
					<p class="text-2xl font-bold text-gray-900">{card.myVisitedRestaurants}</p>
					<p class="text-xs text-gray-500">총 방문</p>
				</div>
				<div>
					<p class="text-2xl font-bold text-gray-900">{card.myLikedRestaurants}</p>
					<p class="text-xs text-gray-500">좋아요</p>
				</div>
				<div>
					<p class="text-2xl font-bold text-gray-900">{card.mySavedRestaurants}</p>
					<p class="text-xs text-gray-500">북마크</p>
				</div>
			</div>
		</div>

		<!-- 좋아요 → 방문 비율 -->
		<div class="mb-4">
			<div class="flex items-center justify-between mb-2">
				<div class="flex items-center gap-2">
					<Heart class="w-4 h-4 text-gray-600" />
					<span class="text-sm font-medium text-gray-900">좋아요 → 방문</span>
				</div>
				<div class="flex items-center gap-2">
					<span class="text-sm font-bold text-gray-900">{likedVisitRatio.toFixed(1)}%</span>
					<span class="text-xs text-gray-500 px-2 py-1 bg-gray-100 rounded-full">
						{getRatioLevel(likedVisitRatio)}
					</span>
				</div>
			</div>
			<div class="w-full h-2 bg-gray-100 rounded-full overflow-hidden mb-2">
				<div 
					class="{getProgressColor(likedVisitRatio)} h-full rounded-full transition-all duration-500"
					style="width: {likedVisitRatio}%"
				></div>
			</div>
			<div class="flex items-center justify-between text-xs text-gray-500">
				<span>{card.visitedFromLiked}곳 방문</span>
				<span>{card.myLikedRestaurants}곳 중</span>
			</div>
		</div>

		<!-- 북마크 → 방문 비율 -->
		<div class="mb-4">
			<div class="flex items-center justify-between mb-2">
				<div class="flex items-center gap-2">
					<Bookmark class="w-4 h-4 text-gray-600" />
					<span class="text-sm font-medium text-gray-900">북마크 → 방문</span>
				</div>
				<div class="flex items-center gap-2">
					<span class="text-sm font-bold text-gray-900">{savedVisitRatio.toFixed(1)}%</span>
					<span class="text-xs text-gray-500 px-2 py-1 bg-gray-100 rounded-full">
						{getRatioLevel(savedVisitRatio)}
					</span>
				</div>
			</div>
			<div class="w-full h-2 bg-gray-100 rounded-full overflow-hidden mb-2">
				<div 
					class="{getProgressColor(savedVisitRatio)} h-full rounded-full transition-all duration-500"
					style="width: {savedVisitRatio}%"
				></div>
			</div>
			<div class="flex items-center justify-between text-xs text-gray-500">
				<span>{card.visitedFromSaved}곳 방문</span>
				<span>{card.mySavedRestaurants}곳 중</span>
			</div>
		</div>

		<!-- 전체 추천 → 방문 비율 -->
		<div class="mb-4">
			<div class="flex items-center justify-between mb-2">
				<div class="flex items-center gap-2">
					<MapPin class="w-4 h-4 text-gray-600" />
					<span class="text-sm font-medium text-gray-900">전체 추천 → 방문</span>
				</div>
				<div class="flex items-center gap-2">
					<span class="text-sm font-bold text-gray-900">{totalVisitRatio.toFixed(1)}%</span>
					<span class="text-xs text-gray-500 px-2 py-1 bg-gray-100 rounded-full">
						{getRatioLevel(totalVisitRatio)}
					</span>
				</div>
			</div>
			<div class="w-full h-2 bg-gray-100 rounded-full overflow-hidden mb-2">
				<div 
					class="{getProgressColor(totalVisitRatio)} h-full rounded-full transition-all duration-500"
					style="width: {totalVisitRatio}%"
				></div>
			</div>
			<div class="flex items-center justify-between text-xs text-gray-500">
				<span>{card.visitedFromRecommended}곳 방문</span>
				<span>{card.totalRecommendedRestaurants}곳 중</span>
			</div>
		</div>

		<!-- 비교 분석 -->
		<div class="bg-gray-50 rounded-lg p-4 mb-4">
			<h4 class="text-sm font-medium text-gray-700 mb-3">비교 분석</h4>
			<div class="space-y-2">
				<div class="flex items-center justify-between p-2 bg-white rounded border">
					<span class="text-sm text-gray-600">북마크 vs 좋아요</span>
					<span class="text-sm font-medium text-gray-900">
						{savedVisitRatio > likedVisitRatio ? '북마크' : '좋아요'}가 
						{Math.abs(savedVisitRatio - likedVisitRatio).toFixed(1)}%p 높음
					</span>
				</div>
				<div class="flex items-center justify-between p-2 bg-white rounded border">
					<span class="text-sm text-gray-600">실행력 점수</span>
					<span class="text-sm font-medium text-gray-900">
						{((likedVisitRatio + savedVisitRatio) / 2).toFixed(0)}점 / 100점
					</span>
				</div>
			</div>
		</div>

		<!-- 인사이트 -->
		<div class="bg-gray-50 rounded-lg p-4">
			<h4 class="text-sm font-medium text-gray-700 mb-3">인사이트</h4>
			<div class="space-y-2">
				{#each card.insights as insight}
					<div class="flex items-center gap-2 text-xs">
						<div class="w-2 h-2 bg-gray-800 rounded-full"></div>
						<span class="text-gray-600">{insight}</span>
					</div>
				{/each}
			</div>
		</div>
	</div>
</article> 