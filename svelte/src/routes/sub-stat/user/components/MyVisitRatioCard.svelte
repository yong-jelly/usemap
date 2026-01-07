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

	// 방문 비율 계산 함수들
	let likedVisitRatio = $derived(
		card.myLikedRestaurants > 0 ? (card.visitedFromLiked / card.myLikedRestaurants) * 100 : 0,
	);
	let savedVisitRatio = $derived(
		card.mySavedRestaurants > 0 ? (card.visitedFromSaved / card.mySavedRestaurants) * 100 : 0,
	);
	let totalVisitRatio = $derived(
		card.totalRecommendedRestaurants > 0
			? (card.visitedFromRecommended / card.totalRecommendedRestaurants) * 100
			: 0,
	);

	// 실행력 점수 계산 (가중 평균)
	let executionScore = $derived.by(() => {
		const likedWeight = 0.4;
		const savedWeight = 0.4;
		const totalWeight = 0.2;

		return (
			likedVisitRatio * likedWeight + savedVisitRatio * savedWeight + totalVisitRatio * totalWeight
		);
	});

	// 인사이트를 derived로 계산
	let insights = $derived.by(() => {
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
	});

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
</script>

<article class="mb-3 overflow-hidden rounded-lg border border-gray-100 bg-white shadow-sm">
	<!-- 헤더 -->
	<header class="p-4 pb-3">
		<div class="flex items-center justify-between">
			<div class="flex items-center gap-2">
				<div class="flex items-center gap-1 rounded bg-gray-100 px-2 py-1">
					<Target class="h-3 w-3 text-gray-600" />
					<span class="text-xs font-medium text-gray-700">방문 비율</span>
				</div>
				<div class="flex items-center gap-1 rounded bg-gray-100 px-2 py-1">
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
					<p class="text-2xl font-bold text-gray-900">{card.myLikedRestaurants}</p>
					<p class="text-xs text-gray-500">좋아요</p>
				</div>
				<div>
					<p class="text-2xl font-bold text-gray-900">{card.mySavedRestaurants}</p>
					<p class="text-xs text-gray-500">저장</p>
				</div>
			</div>
		</div>

		<!-- 좋아요 → 방문 비율 -->
		<div class="mb-4">
			<div class="mb-2 flex items-center justify-between">
				<div class="flex items-center gap-2">
					<Heart class="h-4 w-4 text-gray-600" />
					<span class="text-sm font-medium text-gray-900">좋아요 → 방문</span>
				</div>
				<div class="flex items-center gap-2">
					<span class="text-sm font-bold text-gray-900">{likedVisitRatio.toFixed(1)}%</span>
					<span class="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-500">
						{getRatioLevel(likedVisitRatio)}
					</span>
				</div>
			</div>
			<div class="mb-2 h-2 w-full overflow-hidden rounded-full bg-gray-100">
				<div
					class="{getProgressColor(
						likedVisitRatio,
					)} h-full rounded-full transition-all duration-500"
					style="width: {likedVisitRatio}%"
				></div>
			</div>
			<div class="flex items-center justify-between text-xs text-gray-500">
				<span>방문 {card.visitedFromLiked}</span>
				<span>좋아요 {card.myLikedRestaurants}</span>
			</div>
		</div>

		<!-- 저장 → 방문 비율 -->
		<div class="mb-4">
			<div class="mb-2 flex items-center justify-between">
				<div class="flex items-center gap-2">
					<Bookmark class="h-4 w-4 text-gray-600" />
					<span class="text-sm font-medium text-gray-900">저장 → 방문</span>
				</div>
				<div class="flex items-center gap-2">
					<span class="text-sm font-bold text-gray-900">{savedVisitRatio.toFixed(1)}%</span>
					<span class="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-500">
						{getRatioLevel(savedVisitRatio)}
					</span>
				</div>
			</div>
			<div class="mb-2 h-2 w-full overflow-hidden rounded-full bg-gray-100">
				<div
					class="{getProgressColor(
						savedVisitRatio,
					)} h-full rounded-full transition-all duration-500"
					style="width: {savedVisitRatio}%"
				></div>
			</div>
			<div class="flex items-center justify-between text-xs text-gray-500">
				<span>방문 {card.visitedFromSaved}</span>
				<span>저장 {card.mySavedRestaurants}</span>
			</div>
		</div>

		<!-- 전체 추천 → 방문 비율 -->
		<div class="mb-4">
			<div class="mb-2 flex items-center justify-between">
				<div class="flex items-center gap-2">
					<MapPin class="h-4 w-4 text-gray-600" />
					<span class="text-sm font-medium text-gray-900">전체 추천 → 방문</span>
				</div>
				<div class="flex items-center gap-2">
					<span class="text-sm font-bold text-gray-900">{totalVisitRatio.toFixed(1)}%</span>
					<span class="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-500">
						{getRatioLevel(totalVisitRatio)}
					</span>
				</div>
			</div>
			<div class="mb-2 h-2 w-full overflow-hidden rounded-full bg-gray-100">
				<div
					class="{getProgressColor(
						totalVisitRatio,
					)} h-full rounded-full transition-all duration-500"
					style="width: {totalVisitRatio}%"
				></div>
			</div>
			<div class="flex items-center justify-between text-xs text-gray-500">
				<span>방문 {card.visitedFromRecommended}</span>
				<span>추천 {card.totalRecommendedRestaurants}</span>
			</div>
		</div>

		<!-- 비교 분석 -->
		<div class="mb-4 rounded-lg bg-gray-50 p-4">
			<h4 class="mb-3 text-sm font-medium text-gray-700">비교 분석</h4>
			<div class="space-y-2">
				<div class="flex items-center justify-between rounded border bg-white p-2">
					<span class="text-sm text-gray-600">저장 vs 좋아요</span>
					<span class="text-sm font-medium text-gray-900">
						{savedVisitRatio > likedVisitRatio ? '저장' : '좋아요'}가
						{Math.abs(savedVisitRatio - likedVisitRatio).toFixed(1)}%p 높음
					</span>
				</div>
				<div class="flex items-center justify-between rounded border bg-white p-2">
					<span class="text-sm text-gray-600">실행력 점수</span>
					<span class="text-sm font-medium text-gray-900">
						{executionScore.toFixed(1)}점 / 100점
					</span>
				</div>
			</div>
		</div>

		<!-- 인사이트 -->
		<div class="rounded-lg bg-gray-50 p-4">
			<h4 class="mb-3 text-sm font-medium text-gray-700">인사이트</h4>
			<div class="space-y-2">
				{#if insights.length > 0}
					{#each insights as insight (insight)}
						<div class="flex items-center gap-2 text-xs">
							<div class="h-2 w-2 rounded-full bg-gray-800"></div>
							<span class="text-gray-600">{insight}</span>
						</div>
					{/each}
				{/if}
			</div>
		</div>
	</div>
</article>
