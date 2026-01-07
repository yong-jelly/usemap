<script lang="ts">
	import { MapPin, Eye, Heart, Bookmark, Star, Calendar, Users, TrendingUp } from 'lucide-svelte';

	interface RestaurantStats {
		placeId: string;
		placeName: string;
		category: string;
		address: string;
		group1: string; // 지역
		weeklyStats: {
			views: number;
			likes: number;
			saves: number;
			visits: number;
		};
		totalStats: {
			views: number;
			likes: number;
			saves: number;
			visits: number;
		};
		myContributions: {
			features: number; // 내가 등록한 추천 수
			reviews: number;  // 내가 작성한 리뷰 수
		};
		createdAt: string;
	}

	interface MyRestaurantData {
		id: string;
		title: string;
		period: string;
		restaurants: RestaurantStats[];
		summary: {
			totalRestaurants: number;
			totalFeatures: number;
			totalViews: number;
			totalEngagements: number;
		};
		timestamp: string;
	}

	const { card } = $props<{ card: MyRestaurantData }>();

	function formatNumber(num: number): string {
		if (num >= 1000) {
			return `${(num / 1000).toFixed(1)}K`;
		}
		return num.toString();
	}

	function getPopularityLevel(restaurant: RestaurantStats): string {
		const totalReactions = restaurant.totalStats.likes + restaurant.totalStats.saves + restaurant.totalStats.visits;
		if (totalReactions >= 50) return '인기';
		if (totalReactions >= 20) return '관심';
		if (totalReactions >= 10) return '보통';
		return '조용';
	}

	function formatTimeAgo(dateString: string): string {
		const now = new Date();
		const date = new Date(dateString);
		const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
		
		if (diffInDays === 0) return '오늘';
		if (diffInDays === 1) return '어제';
		if (diffInDays < 7) return `${diffInDays}일 전`;
		if (diffInDays < 30) return `${Math.floor(diffInDays / 7)}주 전`;
		return `${Math.floor(diffInDays / 30)}개월 전`;
	}
</script>

<article class="bg-white rounded-lg shadow-sm mb-3 overflow-hidden border border-gray-100">
	<!-- 헤더 -->
	<header class="p-4 pb-3">
		<div class="flex items-center justify-between">
			<div class="flex items-center gap-2">
				<div class="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-full">
					<MapPin class="w-3 h-3 text-gray-600" />
					<span class="text-xs font-medium text-gray-700">내 추천 음식점</span>
				</div>
				<div class="px-2 py-1 bg-gray-50 rounded-full">
					<span class="text-xs font-medium text-gray-600">{card.period}</span>
				</div>
			</div>
			<Calendar class="w-4 h-4 text-gray-400" />
		</div>
	</header>

	<div class="p-4 pt-0">
		<!-- 타이틀 -->
		<h3 class="font-semibold text-gray-900 text-lg mb-4">{card.title}</h3>

		<!-- 전체 요약 -->
		<div class="bg-gray-50 rounded-lg p-4 mb-4">
			<h4 class="text-sm font-medium text-gray-700 mb-3">내 추천 현황</h4>
			<div class="grid grid-cols-4 gap-4 text-center">
				<div>
					<p class="text-2xl font-bold text-gray-900">{card.summary.totalRestaurants}</p>
					<p class="text-xs text-gray-500">추천 음식점</p>
				</div>
				<div>
					<p class="text-2xl font-bold text-gray-900">{card.summary.totalFeatures}</p>
					<p class="text-xs text-gray-500">작성 콘텐츠</p>
				</div>
				<div>
					<p class="text-2xl font-bold text-gray-900">{formatNumber(card.summary.totalViews)}</p>
					<p class="text-xs text-gray-500">총 조회수</p>
				</div>
				<div>
					<p class="text-2xl font-bold text-gray-900">{formatNumber(card.summary.totalEngagements)}</p>
					<p class="text-xs text-gray-500">총 반응</p>
				</div>
			</div>
		</div>

		<!-- 음식점 목록 -->
		<div class="space-y-3">
			{#each card.restaurants as restaurant}
				<div class="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
					<!-- 음식점 기본 정보 -->
					<div class="flex items-start justify-between mb-3">
						<div class="flex-1">
							<div class="flex items-center gap-2 mb-1">
								<h4 class="font-medium text-gray-900">{restaurant.placeName}</h4>
								<span class="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
									{getPopularityLevel(restaurant)}
								</span>
							</div>
							<div class="flex items-center gap-2 text-sm text-gray-500 mb-1">
								<span>{restaurant.category}</span>
								<span>•</span>
								<span>{restaurant.group1}</span>
							</div>
							<p class="text-xs text-gray-400">{restaurant.address}</p>
						</div>
						<div class="text-right text-xs text-gray-500">
							{formatTimeAgo(restaurant.createdAt)}
						</div>
					</div>

					<!-- 내 기여도 -->
					<div class="flex items-center gap-4 mb-3 p-2 bg-gray-50 rounded">
						<div class="flex items-center gap-1 text-xs">
							<span class="text-gray-700 font-medium">내 추천: {restaurant.myContributions.features}개</span>
						</div>
						{#if restaurant.myContributions.reviews > 0}
							<div class="flex items-center gap-1 text-xs">
								<Star class="w-3 h-3 text-gray-600" />
								<span class="text-gray-700 font-medium">리뷰: {restaurant.myContributions.reviews}개</span>
							</div>
						{/if}
					</div>

					<!-- 사용자 반응 통계 -->
					<div class="space-y-2">
						<h5 class="text-sm font-medium text-gray-700">사용자 반응</h5>
						<div class="grid grid-cols-2 gap-3">
							<!-- 조회 & 좋아요 -->
							<div class="p-3 bg-gray-50 rounded">
								<div class="flex items-center justify-between mb-2">
									<div class="flex items-center gap-1">
										<Eye class="w-3 h-3 text-gray-600" />
										<span class="text-xs text-gray-600">조회</span>
									</div>
									<span class="text-sm font-bold text-gray-900">{formatNumber(restaurant.totalStats.views)}</span>
								</div>
								<div class="flex items-center justify-between">
									<div class="flex items-center gap-1">
										<Heart class="w-3 h-3 text-gray-600" />
										<span class="text-xs text-gray-600">좋아요</span>
									</div>
									<div class="flex items-center gap-1">
										<span class="text-sm font-bold text-gray-900">{restaurant.totalStats.likes}</span>
										{#if restaurant.weeklyStats.likes > 0}
											<span class="text-xs text-gray-500">(+{restaurant.weeklyStats.likes})</span>
										{/if}
									</div>
								</div>
							</div>

							<!-- 저장 & 방문 -->
							<div class="p-3 bg-gray-50 rounded">
								<div class="flex items-center justify-between mb-2">
									<div class="flex items-center gap-1">
										<Bookmark class="w-3 h-3 text-gray-600" />
										<span class="text-xs text-gray-600">저장</span>
									</div>
									<div class="flex items-center gap-1">
										<span class="text-sm font-bold text-gray-900">{restaurant.totalStats.saves}</span>
										{#if restaurant.weeklyStats.saves > 0}
											<span class="text-xs text-gray-500">(+{restaurant.weeklyStats.saves})</span>
										{/if}
									</div>
								</div>
								<div class="flex items-center justify-between">
									<div class="flex items-center gap-1">
										<Users class="w-3 h-3 text-gray-600" />
										<span class="text-xs text-gray-600">방문</span>
									</div>
									<div class="flex items-center gap-1">
										<span class="text-sm font-bold text-gray-900">{restaurant.totalStats.visits}</span>
										{#if restaurant.weeklyStats.visits > 0}
											<span class="text-xs text-gray-500">(+{restaurant.weeklyStats.visits})</span>
										{/if}
									</div>
								</div>
							</div>
						</div>
					</div>

					<!-- 주간 변화 요약 -->
					{#if restaurant.weeklyStats.views > 0 || restaurant.weeklyStats.likes > 0 || restaurant.weeklyStats.saves > 0 || restaurant.weeklyStats.visits > 0}
						<div class="mt-3 pt-2 border-t border-gray-100">
							<div class="flex items-center gap-1 text-xs text-gray-600">
								<TrendingUp class="w-3 h-3" />
								<span>이번 주: 조회 +{restaurant.weeklyStats.views}, 반응 +{restaurant.weeklyStats.likes + restaurant.weeklyStats.saves + restaurant.weeklyStats.visits}</span>
							</div>
						</div>
					{/if}
				</div>
			{/each}
		</div>

		<!-- 결과 없음 -->
		{#if card.restaurants.length === 0}
			<div class="py-8 text-center">
				<div class="text-4xl mb-2">🍽️</div>
				<p class="text-sm text-gray-500 mb-1">아직 추천한 음식점이 없습니다</p>
				<p class="text-xs text-gray-400">새로운 맛집을 발견하고 추천해보세요!</p>
			</div>
		{/if}

		<!-- 더보기 버튼 -->
		{#if card.restaurants.length > 0}
			<div class="mt-4 pt-3 border-t border-gray-100">
				<button class="w-full text-sm text-gray-600 hover:text-gray-700 font-medium transition-colors">
					모든 추천 음식점 보기
				</button>
			</div>
		{/if}
	</div>
</article> 