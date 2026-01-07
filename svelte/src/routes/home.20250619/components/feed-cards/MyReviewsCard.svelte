<script lang="ts">
	import { Star, Heart, Users, MapPin, Calendar, TrendingUp, ChevronDown } from 'lucide-svelte';
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

	const { card } = $props<{ card: MyReviewsData }>();

	let showAllFeelings = $state(false);
	let showAllReviews = $state(false);

	function getRatingWidth(rating: number): number {
		return (rating / 5) * 100;
	}

	function getFeelingEmoji(feeling: string): string {
		const emojiMap: Record<string, string> = {
			'지역 주민 추천': '🏠',
			'자주 방문': '🔄',
			'또 오고싶음': '💕',
			'분위기 최고': '✨',
			'맛 최고': '😋',
			여자친구랑: '💑',
			가족과: '👨‍👩‍👧‍👦',
			혼밥: '😌',
			'분위기 별로': '😐',
			'맛 별로': '😕',
			'서비스 별로': '😒',
		};
		return emojiMap[feeling] || '📝';
	}

	function getFeelingColor(feeling: string): string {
		const positives = [
			'지역 주민 추천',
			'자주 방문',
			'또 오고싶음',
			'분위기 최고',
			'맛 최고',
			'여자친구랑',
			'가족과',
			'혼밥',
		];
		return positives.includes(feeling) ? 'text-gray-700 bg-gray-100' : 'text-gray-600 bg-gray-50';
	}

	let displayedFeelings = $derived(
		showAllFeelings ? card.stats.topFeelings : card.stats.topFeelings.slice(0, 6),
	);
	let displayedReviews = $derived(
		showAllReviews ? card.recentReviews : card.recentReviews.slice(0, 3),
	);
</script>

<article class="mb-3 overflow-hidden rounded-lg border border-gray-100 bg-white shadow-sm">
	<!-- 헤더 -->
	<header class="p-4 pb-3">
		<div class="flex items-center justify-between">
			<div class="flex items-center gap-2">
				<div class="flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1">
					<Star class="h-3 w-3 text-gray-600" />
					<span class="text-xs font-medium text-gray-700">내 리뷰</span>
				</div>
				<div class="rounded-full bg-gray-50 px-2 py-1">
					<span class="text-xs font-medium text-gray-600">{card.period}</span>
				</div>
			</div>
			<Calendar class="h-4 w-4 text-gray-400" />
		</div>
	</header>

	<div class="p-4 pt-0">
		<!-- 타이틀 -->
		<h3 class="mb-4 text-lg font-semibold text-gray-900">{card.title}</h3>

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
									class="h-full rounded-full bg-gray-700 transition-all duration-500"
									style="width: {(card.stats.ratingDistribution[
										rating as keyof typeof card.stats.ratingDistribution
									] /
										card.stats.totalReviews) *
										100}%"
								></div>
							</div>
						</div>
						<div class="w-8 text-right text-xs text-gray-500">
							{card.stats.ratingDistribution[rating as keyof typeof card.stats.ratingDistribution]}
						</div>
					</div>
				{/each}
			</div>
		</div>

		<!-- 자주 선택한 느낌 -->
		<div class="mb-4">
			<div class="mb-3 flex items-center justify-between">
				<h4 class="font-medium text-gray-900">자주 선택한 느낌</h4>
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
					<div
						class="flex items-center justify-between p-2 {getFeelingColor(feeling.name)} rounded"
					>
						<div class="flex items-center gap-2">
							<span class="text-sm">{getFeelingEmoji(feeling.name)}</span>
							<span class="text-sm font-medium">{feeling.name}</span>
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
			<h4 class="mb-3 font-medium text-gray-900">카테고리별 리뷰</h4>
			<div class="space-y-2">
				{#each card.stats.categoryBreakdown as category}
					<div class="flex items-center justify-between rounded bg-gray-50 p-2">
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
			<div class="mb-3 flex items-center justify-between">
				<h4 class="font-medium text-gray-900">최근 리뷰</h4>
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
			<div class="space-y-3">
				{#each displayedReviews as review}
					<div class="rounded-lg border border-gray-200 p-3">
						<div class="mb-2 flex items-start justify-between">
							<div class="flex-1">
								<h5 class="text-sm font-medium text-gray-900">{review.restaurantName}</h5>
								<div class="mt-1 flex items-center gap-2">
									<span class="text-xs text-gray-500">{review.category}</span>
									<div class="flex items-center gap-1">
										{#each Array(5) as _, i}
											<Star
												class="h-3 w-3 {i < review.rating
													? 'fill-current text-gray-800'
													: 'text-gray-300'}"
											/>
										{/each}
									</div>
								</div>
							</div>
							<span class="text-xs text-gray-400">
								{safeFormatDate(review.date)}
							</span>
						</div>

						{#if review.feelings.length > 0}
							<div class="mb-2 flex flex-wrap gap-1">
								{#each review.feelings as feeling}
									<span
										class="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1 text-xs"
									>
										<span>{getFeelingEmoji(feeling)}</span>
										<span>{feeling}</span>
									</span>
								{/each}
							</div>
						{/if}

						{#if review.content}
							<p class="text-sm leading-relaxed text-gray-600">{review.content}</p>
						{/if}
					</div>
				{/each}
			</div>
		</div>

		<!-- 인사이트 -->
		<div class="rounded-lg bg-gray-50 p-4">
			<h4 class="mb-3 text-sm font-medium text-gray-700">리뷰 인사이트</h4>
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
