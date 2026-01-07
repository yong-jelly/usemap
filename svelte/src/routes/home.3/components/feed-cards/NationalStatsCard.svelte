<script lang="ts">
	import { MapPin, Calendar, TrendingUp, Users, ChevronLeft, ChevronRight, ChevronDown, Youtube, MessageSquare } from 'lucide-svelte';

	interface CategoryStats {
		name: string;
		count: number;
		percentage: number;
	}

	interface RegionStats {
		name: string;
		count: number;
		rank: number;
	}

	interface PlatformStats {
		youtube: {
			totalRestaurants: number;
			totalRecommendations: number;
			totalUsers: number;
			topCategories: CategoryStats[];
			topRegions: RegionStats[];
		};
		community: {
			totalRestaurants: number;
			totalRecommendations: number;
			totalUsers: number;
			topCategories: CategoryStats[];
			topRegions: RegionStats[];
		};
	}

	interface NationalStatsData {
		id: string;
		title: string;
		period: string;
		totalRestaurants: number;
		totalRecommendations: number;
		totalUsers: number;
		myContribution: {
			restaurants: number;
			recommendations: number;
			rank: number;
		};
		topCategories: CategoryStats[];
		topRegions: RegionStats[];
		platformStats: PlatformStats;
		timestamp: string;
	}

	const { card } = $props<{ card: NationalStatsData }>();

	let currentView = $state<'total' | 'youtube' | 'community'>('total');
	let showAllCategories = $state(false);
	let showAllRegions = $state(false);

	function formatNumber(num: number): string {
		if (num >= 10000) {
			return `${(num / 10000).toFixed(1)}만`;
		}
		if (num >= 1000) {
			return `${(num / 1000).toFixed(1)}K`;
		}
		return num.toString();
	}

	function getCurrentData() {
		if (currentView === 'youtube') {
			return card.platformStats.youtube;
		} else if (currentView === 'community') {
			return card.platformStats.community;
		}
		return {
			totalRestaurants: card.totalRestaurants,
			totalRecommendations: card.totalRecommendations,
			totalUsers: card.totalUsers,
			topCategories: card.topCategories,
			topRegions: card.topRegions
		};
	}

	function getViewTitle() {
		if (currentView === 'youtube') return '유튜브 추천 통계';
		if (currentView === 'community') return '커뮤니티 추천 통계';
		return '전국 추천 음식점 통계';
	}

	function getViewIcon() {
		if (currentView === 'youtube') return Youtube;
		if (currentView === 'community') return MessageSquare;
		return MapPin;
	}

	function nextView() {
		if (currentView === 'total') currentView = 'youtube';
		else if (currentView === 'youtube') currentView = 'community';
		else currentView = 'total';
	}

	function prevView() {
		if (currentView === 'total') currentView = 'community';
		else if (currentView === 'community') currentView = 'youtube';
		else currentView = 'total';
	}

	let currentData = $derived(getCurrentData());
	let viewTitle = $derived(getViewTitle());
	let ViewIcon = $derived(getViewIcon());
	let displayedCategories = $derived(showAllCategories ? currentData.topCategories : currentData.topCategories.slice(0, 4));
	let displayedRegions = $derived(showAllRegions ? currentData.topRegions : currentData.topRegions.slice(0, 4));
</script>

<article class="bg-white rounded-lg shadow-sm mb-3 overflow-hidden border border-gray-100">
	<!-- 헤더 -->
	<header class="p-4 pb-3">
		<div class="flex items-center justify-between">
			<div class="flex items-center gap-2">
				<div class="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-full">
					<svelte:component this={ViewIcon} class="w-3 h-3 text-gray-600" />
					<span class="text-xs font-medium text-gray-700">
						{currentView === 'total' ? '전국 통계' : currentView === 'youtube' ? '유튜브' : '커뮤니티'}
					</span>
				</div>
				<div class="px-2 py-1 bg-gray-50 rounded-full">
					<span class="text-xs font-medium text-gray-600">{card.period}</span>
				</div>
			</div>
			<div class="flex items-center gap-2">
				<button 
					onclick={prevView}
					class="p-1 hover:bg-gray-100 rounded-full transition-colors"
					aria-label="이전 보기"
				>
					<ChevronLeft class="w-4 h-4 text-gray-400" />
				</button>
				<div class="flex gap-1">
					<div class="w-2 h-2 rounded-full {currentView === 'total' ? 'bg-gray-800' : 'bg-gray-300'}"></div>
					<div class="w-2 h-2 rounded-full {currentView === 'youtube' ? 'bg-gray-800' : 'bg-gray-300'}"></div>
					<div class="w-2 h-2 rounded-full {currentView === 'community' ? 'bg-gray-800' : 'bg-gray-300'}"></div>
				</div>
				<button 
					onclick={nextView}
					class="p-1 hover:bg-gray-100 rounded-full transition-colors"
					aria-label="다음 보기"
				>
					<ChevronRight class="w-4 h-4 text-gray-400" />
				</button>
			</div>
		</div>
	</header>

	<div class="p-4 pt-0">
		<!-- 타이틀 -->
		<h3 class="font-semibold text-gray-900 text-lg mb-4">{viewTitle}</h3>

		<!-- 현황 요약 -->
		<div class="bg-gray-50 rounded-lg p-4 mb-4">
			<h4 class="text-sm font-medium text-gray-700 mb-3">
				{currentView === 'total' ? '전국 현황' : currentView === 'youtube' ? '유튜브 현황' : '커뮤니티 현황'}
			</h4>
			<div class="grid grid-cols-3 gap-4 text-center">
				<div>
					<p class="text-2xl font-bold text-gray-900">{formatNumber(currentData.totalRestaurants)}</p>
					<p class="text-xs text-gray-500">등록 음식점</p>
				</div>
				<div>
					<p class="text-2xl font-bold text-gray-900">{formatNumber(currentData.totalRecommendations)}</p>
					<p class="text-xs text-gray-500">총 추천</p>
				</div>
				<div>
					<p class="text-2xl font-bold text-gray-900">{formatNumber(currentData.totalUsers)}</p>
					<p class="text-xs text-gray-500">참여 사용자</p>
				</div>
			</div>
		</div>

		<!-- 내 기여도 -->
		<div class="bg-gray-50 rounded-lg p-4 mb-4">
			<h4 class="text-sm font-medium text-gray-700 mb-3">내 기여도</h4>
			<div class="space-y-3">
				<div class="flex items-center justify-between">
					<span class="text-sm text-gray-600">추천한 음식점</span>
					<div class="flex items-center gap-2">
						<span class="text-sm font-medium text-gray-900">{card.myContribution.restaurants}곳</span>
						<span class="text-xs text-gray-500">
							({((card.myContribution.restaurants / card.totalRestaurants) * 100).toFixed(2)}%)
						</span>
					</div>
				</div>
				<div class="flex items-center justify-between">
					<span class="text-sm text-gray-600">작성한 추천</span>
					<div class="flex items-center gap-2">
						<span class="text-sm font-medium text-gray-900">{card.myContribution.recommendations}개</span>
						<span class="text-xs text-gray-500">
							({((card.myContribution.recommendations / card.totalRecommendations) * 100).toFixed(2)}%)
						</span>
					</div>
				</div>
				<div class="flex items-center justify-between">
					<span class="text-sm text-gray-600">전국 순위</span>
					<div class="flex items-center gap-1">
						<TrendingUp class="w-3 h-3 text-gray-600" />
						<span class="text-sm font-medium text-gray-900">{card.myContribution.rank}위</span>
						<span class="text-xs text-gray-500">/ {formatNumber(card.totalUsers)}명</span>
					</div>
				</div>
			</div>
		</div>

		<!-- 인기 카테고리 -->
		<div class="mb-4">
			<div class="flex items-center justify-between mb-3">
				<h4 class="font-medium text-gray-900">인기 음식 카테고리</h4>
				{#if currentData.topCategories.length > 4}
					<button 
						onclick={() => showAllCategories = !showAllCategories}
						class="flex items-center gap-1 text-xs text-gray-600 hover:text-gray-800 transition-colors"
					>
						<span>{showAllCategories ? '접기' : `+${currentData.topCategories.length - 4}개 더보기`}</span>
						<ChevronDown class="w-3 h-3 transform transition-transform {showAllCategories ? 'rotate-180' : ''}" />
					</button>
				{/if}
			</div>
			<div class="space-y-2">
				{#each displayedCategories as category, index}
					<div class="flex items-center gap-3">
						<div class="w-6 text-sm text-gray-500 text-center">{index + 1}</div>
						<div class="w-16 text-sm text-gray-600">{category.name}</div>
						<div class="flex-1 relative">
							<div class="w-full h-5 bg-gray-100 rounded-full overflow-hidden">
								<div 
									class="h-full bg-gray-800 rounded-full transition-all duration-500"
									style="width: {category.percentage}%"
								></div>
							</div>
						</div>
						<div class="w-12 text-xs text-gray-500 text-right">{category.count}</div>
					</div>
				{/each}
			</div>
		</div>

		<!-- 인기 지역 -->
		<div class="mb-4">
			<div class="flex items-center justify-between mb-3">
				<h4 class="font-medium text-gray-900">추천 많은 지역</h4>
				{#if currentData.topRegions.length > 4}
					<button 
						onclick={() => showAllRegions = !showAllRegions}
						class="flex items-center gap-1 text-xs text-gray-600 hover:text-gray-800 transition-colors"
					>
						<span>{showAllRegions ? '접기' : `+${currentData.topRegions.length - 4}개 더보기`}</span>
						<ChevronDown class="w-3 h-3 transform transition-transform {showAllRegions ? 'rotate-180' : ''}" />
					</button>
				{/if}
			</div>
			<div class="space-y-2">
				{#each displayedRegions as region, index}
					<div class="flex items-center justify-between p-2 bg-gray-50 rounded">
						<div class="flex items-center gap-2">
							<span class="text-sm text-gray-500">{region.rank}</span>
							<span class="text-sm font-medium text-gray-900">{region.name}</span>
						</div>
						<span class="text-sm text-gray-600">{formatNumber(region.count)}곳</span>
					</div>
				{/each}
			</div>
		</div>

		<!-- 통계 인사이트 -->
		<div class="bg-gray-50 rounded-lg p-4">
			<h4 class="text-sm font-medium text-gray-700 mb-3">통계 인사이트</h4>
			<div class="space-y-2">
				<div class="flex items-center gap-2 text-xs">
					<div class="w-2 h-2 bg-gray-800 rounded-full"></div>
					<span class="text-gray-600">가장 인기: {currentData.topCategories[0]?.name} ({currentData.topCategories[0]?.percentage}%)</span>
				</div>
				<div class="flex items-center gap-2 text-xs">
					<div class="w-2 h-2 bg-gray-800 rounded-full"></div>
					<span class="text-gray-600">추천 1위 지역: {currentData.topRegions[0]?.name}</span>
				</div>
				<div class="flex items-center gap-2 text-xs">
					<div class="w-2 h-2 bg-gray-800 rounded-full"></div>
					<span class="text-gray-600">평균 사용자당 {(currentData.totalRecommendations / currentData.totalUsers).toFixed(1)}개 추천</span>
				</div>
				{#if currentView !== 'total'}
					<div class="flex items-center gap-2 text-xs">
						<div class="w-2 h-2 bg-gray-800 rounded-full"></div>
						<span class="text-gray-600">
							{currentView === 'youtube' ? '유튜브' : '커뮤니티'} 전용 통계
						</span>
					</div>
				{/if}
			</div>
		</div>
	</div>
</article> 