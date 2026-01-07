<script lang="ts">
	import Icon from '$lib/components/Icon.svelte';
	import {
		Star,
		Heart,
		Users,
		MapPin,
		Calendar,
		TrendingUp,
		ChevronDown,
		FileText,
		Loader2,
	} from 'lucide-svelte';
	import { safeFormatDate } from '$utils/date.util';

	interface ReviewFeeling {
		id: string;
		name: string;
		count: number;
		percentage: number;
	}

	interface ReviewStats {
		totalReviews: number;
		averageRating: number;
		ratingDistribution: {
			5: number;
			4: number;
			3: number;
			2: number;
			1: number;
		};
		topFeelings: ReviewFeeling[];
		categoryBreakdown: {
			category: string;
			count: number;
			averageRating: number;
		}[];
		monthlyTrend: {
			month: string;
			count: number;
			averageRating: number;
		}[];
	}

	interface MyReviewsData {
		id: string;
		title: string;
		period: string;
		stats: ReviewStats;
		recentReviews: {
			placeId: string;
			restaurantName: string;
			category: string;
			rating: number;
			feelings: string[];
			content: string;
			date: string;
		}[];
		insights: string[];
		timestamp: string;
	}

	const {
		card,
		isLoading = false,
		clickReviewPlace,
	} = $props<{
		card: MyReviewsData;
		isLoading?: boolean;
		clickReviewPlace: (placeId: string) => void;
	}>();

	let showAllFeelings = $state(false);
	let showAllReviews = $state(false);
	let showAllCategories = $state(false);
	let showEmptyState = $state(false);
	// let loadingTimer: number | null = null;

	// 로딩 상태 관리
	// $effect(() => {
	// 	if (isLoading) {
	// 		showEmptyState = false;
	// 		// 3초 후 빈 상태 표시
	// 		loadingTimer = window.setTimeout(() => {
	// 			showEmptyState = true;
	// 		}, 3000);
	// 	} else {
	// 		// 로딩이 완료되면 타이머 클리어
	// 		if (loadingTimer) {
	// 			clearTimeout(loadingTimer);
	// 			loadingTimer = null;
	// 		}
	// 		showEmptyState = false;
	// 	}

	// 	// 컴포넌트 언마운트 시 타이머 정리
	// 	return () => {
	// 		if (loadingTimer) {
	// 			clearTimeout(loadingTimer);
	// 		}
	// 	};
	// });

	// function getRatingWidth(rating: number): number {
	// 	return (rating / 5) * 100;
	// }

	$effect(() => {
		if (!isLoading) {
			if (card.recentReviews.length === 0) {
				showEmptyState = true;
			} else {
				showEmptyState = false;
			}
		}
		// isLoading = false;
		// showEmptyState
	});
	function generateInsights(stats: ReviewStats, recentReviews: any[]): string[] {
		const insights: string[] = [];

		// 평균 별점 인사이트
		if (stats.averageRating >= 4.0) {
			insights.push(
				`평균 별점 ${stats.averageRating.toFixed(1)}점으로 대체로 만족스러운 리뷰 작성`,
			);
		} else if (stats.averageRating >= 3.0) {
			insights.push(`평균 별점 ${stats.averageRating.toFixed(1)}점으로 보통 수준의 리뷰 작성`);
		} else {
			insights.push(`평균 별점 ${stats.averageRating.toFixed(1)}점으로 까다로운 기준의 리뷰 작성`);
		}

		// 가장 많이 선택한 느낌 인사이트
		if (stats.topFeelings.length >= 2) {
			const topTwo = stats.topFeelings.slice(0, 2);
			insights.push(
				`${getFeelingLabel(topTwo[0].name)}(${topTwo[0].percentage}%)와 ${getFeelingLabel(topTwo[1].name)}(${topTwo[1].percentage}%)을 가장 많이 선택`,
			);
		}

		// 카테고리별 평가 인사이트
		if (stats.categoryBreakdown.length > 0) {
			const bestCategory = stats.categoryBreakdown.reduce((prev, current) =>
				prev.averageRating > current.averageRating ? prev : current,
			);
			// if (bestCategory.averageRating >= 4.0) {
			// 	insights.push(
			// 		`${bestCategory.category}에 대한 평가가 가장 높음 (평균 ${bestCategory.averageRating.toFixed(1)}점)`,
			// 	);
			// }
		}

		// 부정적 느낌 비율 인사이트
		const negativeFeelings = stats.topFeelings.filter((f) =>
			['bad_atmosphere', 'bad_taste', 'bad_service'].includes(f.name),
		);
		const negativePercentage = negativeFeelings.reduce((sum, f) => sum + f.percentage, 0);

		if (negativePercentage <= 5) {
			insights.push(`부정적 느낌 선택은 ${negativePercentage.toFixed(0)}%로 매우 낮음`);
		} else if (negativePercentage >= 20) {
			insights.push(`부정적 느낌 선택이 ${negativePercentage.toFixed(0)}%로 비교적 높음`);
		}

		// 식사 동반자 선호도 인사이트
		const companionFeelings = stats.topFeelings.filter((f) =>
			['with_family', 'with_gf', 'alone'].includes(f.name),
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

		return insights.slice(0, 5); // 최대 5개까지만 표시
	}

	let dynamicInsights = $derived(generateInsights(card.stats, card.recentReviews));

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

	let displayedFeelings = $derived(
		showAllFeelings ? card.stats.topFeelings : card.stats.topFeelings.slice(0, 6),
	);
	let displayedReviews = $derived(
		showAllReviews ? card.recentReviews : card.recentReviews.slice(0, 3),
	);
	let displayedCategories = $derived(
		showAllCategories ? card.stats.categoryBreakdown : card.stats.categoryBreakdown.slice(0, 5),
	);

	// 데이터가 없는지 확인하는 함수
	let hasNoData = $derived(
		!card.stats.totalReviews ||
			card.stats.totalReviews === 0 ||
			!card.recentReviews ||
			card.recentReviews.length === 0,
	);
</script>

<article class="mb-3 overflow-hidden rounded-lg border border-gray-100 bg-white shadow-sm">
	<!-- 헤더 -->
	<header class="p-4 pb-3">
		<div class="flex items-center justify-between">
			<div class="flex items-center gap-2">
				<div class="flex items-center gap-1 rounded bg-gray-100 px-2 py-1">
					<Star class="h-3 w-3 text-gray-600" />
					<span class="text-xs font-medium text-gray-700">내 리뷰</span>
				</div>
				<div class="flex items-center gap-1 rounded bg-gray-100 px-2 py-1">
					<span class="text-xs font-medium text-gray-700">{card.period}</span>
				</div>
			</div>
			<Calendar class="h-4 w-4 text-gray-400" />
		</div>
	</header>

	<div class="p-4 pt-0">
		<!-- 타이틀 -->
		<h3 class="mb-4 text-lg font-semibold text-gray-900">{card.title}</h3>

		{#if isLoading && !showEmptyState}
			<!-- 로딩 상태 -->
			<div class="flex flex-col items-center justify-center py-12">
				<div class="mb-4 flex items-center justify-center">
					<Loader2 class="h-8 w-8 animate-spin text-gray-400" />
				</div>
				<h4 class="mb-2 text-base font-medium text-gray-900">리뷰 데이터를 불러오는 중...</h4>
				<p class="text-center text-sm text-gray-500">잠시만 기다려주세요</p>
			</div>
		{:else if (isLoading && showEmptyState) || hasNoData}
			<!-- 데이터 없음 상태 -->
			<div class="flex flex-col items-center justify-center py-12">
				<div class="mb-4 rounded-full bg-gray-100 p-4">
					<FileText class="h-8 w-8 text-gray-400" />
				</div>
				<h4 class="mb-2 text-base font-medium text-gray-900">아직 작성한 리뷰가 없어요</h4>
				<p class="mb-4 text-center text-sm text-gray-500">
					맛집을 방문하고 첫 리뷰를 작성해보세요!
					<br />
					당신의 소중한 경험을 다른 사람들과 공유해보세요.
				</p>
				<button
					class="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800"
				>
					첫 리뷰 작성하기
				</button>
			</div>
		{:else}
			<!-- 기존 데이터 표시 UI -->
			<!-- 리뷰 요약 -->
			<div class="mb-4 rounded-lg bg-gray-50 p-4">
				<h4 class="mb-3 text-sm font-medium text-gray-700">리뷰 현황</h4>
				<div class="grid grid-cols-3 gap-4 text-center">
					<div>
						<p class="text-2xl font-bold text-gray-900">{card.stats.totalReviews}</p>
						<p class="text-xs text-gray-500">작성한 리뷰</p>
					</div>
					<div>
						<div class="flex items-center justify-center gap-1">
							<Star class="h-4 w-4 text-gray-600" />
							<p class="text-2xl font-bold text-gray-900">{card.stats.averageRating.toFixed(1)}</p>
						</div>
						<p class="text-xs text-gray-500">평균 별점</p>
					</div>
					<div>
						<p class="text-2xl font-bold text-gray-900">
							{Math.round(
								((card.stats.ratingDistribution[4] + card.stats.ratingDistribution[5]) /
									card.stats.totalReviews) *
									100,
							)}%
						</p>
						<p class="text-xs text-gray-500">만족도</p>
					</div>
				</div>
			</div>

			<!-- 별점 분포 -->
			<div class="mb-4">
				<h4 class="mb-3 font-medium text-gray-900">별점 분포</h4>
				<div class="space-y-2">
					{#each [5, 4, 3, 2, 1] as rating}
						<div class="flex items-center gap-3">
							<div class="flex w-12 items-center gap-1">
								<Star class="h-3 w-3 text-gray-600" />
								<span class="text-sm text-gray-600">{rating}</span>
							</div>
							<div class="relative flex-1">
								<div class="h-4 w-full overflow-hidden rounded-full bg-gray-100">
									<div
										class="h-full rounded-full bg-gray-600 transition-all duration-500"
										style="width: {(card.stats.ratingDistribution[
											rating as keyof typeof card.stats.ratingDistribution
										] /
											card.stats.totalReviews) *
											100}%"
									></div>
								</div>
							</div>
							<div class="w-8 text-right text-xs text-gray-500">
								{card.stats.ratingDistribution[
									rating as keyof typeof card.stats.ratingDistribution
								]}
							</div>
						</div>
					{/each}
				</div>
			</div>

			<!-- 주요 평가 -->
			<div class="mb-4">
				<div class="mb-3 flex items-center justify-between">
					<h4 class="font-medium text-gray-900">주요 평가</h4>
					{#if card.stats.topFeelings.length > 6}
						<button
							onclick={() => (showAllFeelings = !showAllFeelings)}
							class="flex items-center gap-1 text-xs text-gray-600 transition-colors hover:text-gray-800"
						>
							<span>
								{showAllFeelings ? '접기' : `+${card.stats.topFeelings.length - 6}개 더보기`}
							</span>
							<ChevronDown
								class="h-3 w-3 transform transition-transform {showAllFeelings ? 'rotate-180' : ''}"
							/>
						</button>
					{/if}
				</div>
				<div class="grid grid-cols-2 gap-2">
					{#each displayedFeelings as feeling}
						<div class="flex items-center justify-between rounded bg-gray-100 p-2 text-gray-600">
							<div class="flex items-center gap-2">
								<span class="text-xs">{getFeelingEmoji(feeling.name)}</span>
								<span class="text-sm font-medium">{getFeelingLabel(feeling.name)}</span>
							</div>
							<div class="flex items-center gap-1">
								<span class="text-sm font-bold text-gray-900">{feeling.count}</span>
								<span class="text-xs text-gray-500">({feeling.percentage}%)</span>
							</div>
						</div>
					{/each}
				</div>
			</div>

			<!-- 카테고리별 리뷰 -->
			<div class="mb-4">
				<div class="mb-3 flex items-center justify-between">
					<h4 class="font-medium text-gray-900">카테고리별 리뷰</h4>
					{#if card.stats.categoryBreakdown.length > 5}
						<button
							onclick={() => (showAllCategories = !showAllCategories)}
							class="flex items-center gap-1 text-xs text-gray-600 transition-colors hover:text-gray-800"
						>
							<span>
								{showAllCategories
									? '접기'
									: `+${card.stats.categoryBreakdown.length - 5}개 더보기`}
							</span>
							<ChevronDown
								class="h-3 w-3 transform transition-transform {showAllCategories
									? 'rotate-180'
									: ''}"
							/>
						</button>
					{/if}
				</div>
				<div class="space-y-2">
					{#each displayedCategories as category}
						<div class="flex items-center justify-between rounded bg-gray-100 p-2">
							<div class="flex items-center gap-2">
								<span class="text-sm font-medium text-gray-900">{category.category}</span>
								<div class="flex items-center gap-1">
									<Star class="h-3 w-3 text-gray-600" />
									<span class="text-xs text-gray-600">{category.averageRating.toFixed(1)}</span>
								</div>
							</div>
							<span class="text-sm text-gray-600">{category.count}개</span>
						</div>
					{/each}
				</div>
			</div>

			<!-- 최근 리뷰 -->
			<div class="mb-4">
				<div class="mb-4 flex items-center justify-between">
					<div class="flex items-center gap-2">
						<h4 class="font-semibold text-gray-900">최근 리뷰 Top 10</h4>
						<!-- <div class="rounded-full bg-gray-100 px-2 py-1">
							<span class="text-xs font-medium text-gray-600">{card.recentReviews.length}</span>
						</div> -->
					</div>
					{#if card.recentReviews.length > 3}
						<button
							onclick={() => (showAllReviews = !showAllReviews)}
							class="flex items-center gap-1 text-xs text-gray-600 transition-colors hover:text-gray-800"
						>
							<span>{showAllReviews ? '접기' : `+${card.recentReviews.length - 3}개 더보기`}</span>
							<ChevronDown
								class="h-3 w-3 transform transition-transform {showAllReviews ? 'rotate-180' : ''}"
							/>
						</button>
					{/if}
				</div>
				<div class="space-y-4">
					{#each displayedReviews as review}
						<div
							class="group relative overflow-hidden rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-all hover:border-gray-300 hover:shadow-md"
							onclick={() => clickReviewPlace(review.place_id)}
						>
							<!-- 상단 정보 영역 -->
							<div class="mb-3 flex items-start justify-between">
								<div class="flex-1">
									<div class="mb-2 flex items-center gap-2">
										{#if review.is_private}
											<Icon name="lock-keyhole" class="text-bold text- h-3 w-3 stroke-gray-400" />
										{:else}
											<Icon
												name="lock-keyhole-open"
												class="h-3 w-3 stroke-gray-400 text-gray-400"
											/>
										{/if}
										<h5 class="text-base font-semibold text-gray-900">
											{review.restaurantName}
										</h5>
										<div class="flex items-center gap-1">
											<!-- {#each Array(5) as _, i} -->
											<Star
												class="h-3 w-3 text-gray-300"
												fill="currentColor"
												stroke="currentColor"
											/>
											<!-- {/each} -->
											<span class="ml-1 text-xs font-medium text-gray-700">{review.rating}</span>
										</div>
									</div>
									<div class="flex flex-wrap items-center gap-1 text-xs text-gray-500">
										<span>{review.category}</span>
										<span>•</span>
										<span>{review.group1} {review.group2} {review.group3}</span>
										<!-- <span>•</span>
										<span class={review.is_private ? 'text-gray-600' : 'text-gray-500'}>
											{review.is_private ? '비공개' : '공개'}
										</span> -->
									</div>
								</div>
								<div class="text-right">
									<span class="text-xs text-gray-400">
										{safeFormatDate(review.date, {
											month: 'short',
											day: 'numeric',
										})}
									</span>
								</div>
							</div>

							<!-- 느낌 태그 -->
							{#if review.feelings.length > 0}
								<div class="mb-3 flex flex-wrap gap-1">
									{#each review.feelings as feeling}
										<span
											class="inline-flex items-center gap-1 rounded bg-gray-100 px-2 py-1 text-xs text-gray-600"
										>
											<span class="text-xs">{getFeelingEmoji(feeling)}</span>
											<span>{getFeelingLabel(feeling)}</span>
										</span>
									{/each}
								</div>
							{/if}

							<!-- 리뷰 내용 -->
							{#if review.content}
								<div class="relative">
									<div class="absolute top-0 left-0 h-full w-1 rounded-full bg-gray-300"></div>
									<div class="pl-4">
										<p class="text-sm leading-relaxed text-gray-600">
											"{review.content}"
										</p>
									</div>
								</div>
							{/if}
						</div>
					{/each}
				</div>
			</div>

			<!-- 인사이트 -->
			<div class="rounded-lg bg-gray-50 p-4">
				<h4 class="mb-3 text-sm font-medium text-gray-700">리뷰 인사이트</h4>
				<div class="space-y-2">
					{#each dynamicInsights as insight}
						<div class="flex items-center gap-2 text-xs">
							<div class="h-2 w-2 rounded-full bg-gray-600"></div>
							<span class="text-gray-600">{insight}</span>
						</div>
					{/each}
				</div>
			</div>
		{/if}
	</div>
</article>
