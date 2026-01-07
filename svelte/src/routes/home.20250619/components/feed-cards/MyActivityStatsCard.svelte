<script lang="ts">
	import { Heart, MapPin, Bookmark, PlusCircle, Star, Eye, TrendingUp, Calendar, ChevronLeft, ChevronRight } from 'lucide-svelte';

	interface ActivityStats {
		id: string;
		period: string;
		weeklyStats: {
			likes: number;
			visits: number;
			saves: number;
			recommendations: number;
			reviews: number;
			views: number;
		};
		previousWeekStats: {
			likes: number;
			visits: number;
			saves: number;
			recommendations: number;
			reviews: number;
			views: number;
		};
		totalStats?: {
			likes: number;
			visits: number;
			saves: number;
			recommendations: number;
			reviews: number;
			views: number;
		};
		timestamp: string;
	}

	const { card } = $props<{ card: ActivityStats }>();

	let currentView = $state(0); // 0: 이번주, 1: 전체, 2: 상세
	const views = ['이번주', '전체', '상세'];

	function calculateChange(current: number, previous: number): { value: number; isPositive: boolean } {
		if (previous === 0) return { value: 0, isPositive: true };
		const change = ((current - previous) / previous) * 100;
		return { value: Math.abs(change), isPositive: change >= 0 };
	}

	function nextView() {
		currentView = (currentView + 1) % views.length;
	}

	function prevView() {
		currentView = currentView === 0 ? views.length - 1 : currentView - 1;
	}

	function goToView(index: number) {
		currentView = index;
	}

	// 통합된 통계 설정 (단색 + 아이콘만)
	const statsConfig = [
		{ key: 'likes', label: '좋아요', icon: Heart, current: card.weeklyStats.likes, previous: card.previousWeekStats.likes, total: card.totalStats?.likes || 0 },
		{ key: 'visits', label: '방문', icon: MapPin, current: card.weeklyStats.visits, previous: card.previousWeekStats.visits, total: card.totalStats?.visits || 0 },
		{ key: 'saves', label: '저장', icon: Bookmark, current: card.weeklyStats.saves, previous: card.previousWeekStats.saves, total: card.totalStats?.saves || 0 },
		{ key: 'recommendations', label: '추천 등록', icon: PlusCircle, current: card.weeklyStats.recommendations, previous: card.previousWeekStats.recommendations, total: card.totalStats?.recommendations || 0 },
		{ key: 'reviews', label: '리뷰 작성', icon: Star, current: card.weeklyStats.reviews, previous: card.previousWeekStats.reviews, total: card.totalStats?.reviews || 0 },
		{ key: 'views', label: '조회', icon: Eye, current: card.weeklyStats.views, previous: card.previousWeekStats.views, total: card.totalStats?.views || 0 }
	];

	// 상세 분석 데이터
	const detailAnalysis = {
		mostActiveDay: '수요일',
		averageDaily: Math.round((card.weeklyStats.likes + card.weeklyStats.visits + card.weeklyStats.saves) / 7),
		topActivity: '좋아요',
		growthRate: 23,
		weeklyGoal: 50,
		currentProgress: card.weeklyStats.likes + card.weeklyStats.visits + card.weeklyStats.saves
	};
</script>

<article class="bg-white rounded-lg shadow-sm mb-3 overflow-hidden border border-gray-100">
	<!-- 헤더 -->
	<header class="p-4 pb-3">
		<div class="flex items-center justify-between">
			<div class="flex items-center gap-2">
				<div class="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-full">
					<TrendingUp class="w-3 h-3 text-gray-600" />
					<span class="text-xs font-medium text-gray-700">내 활동 통계</span>
				</div>
			</div>
			<Calendar class="w-4 h-4 text-gray-400" />
		</div>
	</header>

	<div class="p-4 pt-0">
		<!-- 뷰 네비게이션 -->
		<div class="flex items-center justify-between mb-4">
			<button 
				class="p-1 rounded-full hover:bg-gray-100 transition-colors"
				onclick={prevView}
			>
				<ChevronLeft class="w-4 h-4 text-gray-500" />
			</button>
			
			<div class="flex items-center gap-3">
				<h3 class="font-semibold text-gray-900 text-lg">{views[currentView]} 활동</h3>
				
				<!-- 인디케이터 점들 -->
				<div class="flex gap-1">
					{#each views as _, index}
						<button
							class="w-2 h-2 rounded-full transition-colors {currentView === index ? 'bg-gray-800' : 'bg-gray-300'}"
							onclick={() => goToView(index)}
						></button>
					{/each}
				</div>
			</div>
			
			<button 
				class="p-1 rounded-full hover:bg-gray-100 transition-colors"
				onclick={nextView}
			>
				<ChevronRight class="w-4 h-4 text-gray-500" />
			</button>
		</div>

		<!-- 뷰 콘텐츠 -->
		<div class="min-h-[280px]">
			{#if currentView === 0}
				<!-- 이번주 뷰 -->
				<div class="space-y-3">
					{#each statsConfig as stat}
						{@const change = calculateChange(stat.current, stat.previous)}
						<div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
							<div class="flex items-center gap-3">
								<div class="p-2 bg-white rounded-lg">
									<stat.icon class="w-4 h-4 text-gray-600" />
								</div>
								<span class="text-sm font-medium text-gray-700">{stat.label}</span>
							</div>
							<div class="flex items-center gap-3">
								<span class="text-xl font-bold text-gray-900">{stat.current}</span>
								{#if change.value > 0}
									<div class="flex items-center gap-1 text-xs px-2 py-1 rounded-full {change.isPositive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}">
										<TrendingUp class="w-3 h-3 {change.isPositive ? '' : 'rotate-180'}" />
										<span>{change.value.toFixed(0)}%</span>
									</div>
								{/if}
							</div>
						</div>
					{/each}
				</div>

			{:else if currentView === 1}
				<!-- 전체 뷰 -->
				<div class="space-y-4">
					<!-- 전체 요약 -->
					<div class="bg-gray-50 rounded-lg p-4">
						<h4 class="text-sm font-medium text-gray-700 mb-3">전체 활동 요약</h4>
						<div class="grid grid-cols-3 gap-4 text-center">
							<div>
								<p class="text-2xl font-bold text-gray-900">
									{statsConfig.reduce((sum, stat) => sum + stat.total, 0)}
								</p>
								<p class="text-xs text-gray-500">총 활동</p>
							</div>
							<div>
								<p class="text-2xl font-bold text-gray-900">
									{statsConfig.reduce((sum, stat) => sum + stat.current, 0)}
								</p>
								<p class="text-xs text-gray-500">이번주</p>
							</div>
							<div>
								<p class="text-2xl font-bold text-gray-900">
									{Math.round(statsConfig.reduce((sum, stat) => sum + stat.current, 0) / 7)}
								</p>
								<p class="text-xs text-gray-500">일평균</p>
							</div>
						</div>
					</div>

					<!-- 전체 vs 이번주 비교 -->
					<div class="space-y-2">
						{#each statsConfig as stat}
							<div class="flex items-center justify-between p-2">
								<div class="flex items-center gap-2">
									<stat.icon class="w-3 h-3 text-gray-500" />
									<span class="text-sm text-gray-600">{stat.label}</span>
								</div>
								<div class="flex items-center gap-4 text-sm">
									<span class="text-gray-900 font-medium">{stat.total}</span>
									<span class="text-gray-500">({stat.current})</span>
								</div>
							</div>
						{/each}
					</div>
				</div>

			{:else}
				<!-- 상세 분석 뷰 -->
				<div class="space-y-4">
					<!-- 주간 목표 진행률 -->
					<div class="bg-gray-50 rounded-lg p-4">
						<div class="flex items-center justify-between mb-2">
							<h4 class="text-sm font-medium text-gray-700">주간 목표</h4>
							<span class="text-xs text-gray-500">{detailAnalysis.currentProgress}/{detailAnalysis.weeklyGoal}</span>
						</div>
						<div class="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
							<div 
								class="h-full bg-gray-800 rounded-full transition-all duration-300"
								style="width: {Math.min((detailAnalysis.currentProgress / detailAnalysis.weeklyGoal) * 100, 100)}%"
							></div>
						</div>
						<p class="text-xs text-gray-500 mt-1">
							{Math.round((detailAnalysis.currentProgress / detailAnalysis.weeklyGoal) * 100)}% 달성
						</p>
					</div>

					<!-- 상세 인사이트 -->
					<div class="space-y-3">
						<div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
							<span class="text-sm text-gray-600">가장 활발한 요일</span>
							<span class="text-sm font-medium text-gray-900">{detailAnalysis.mostActiveDay}</span>
						</div>
						
						<div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
							<span class="text-sm text-gray-600">일평균 활동</span>
							<span class="text-sm font-medium text-gray-900">{detailAnalysis.averageDaily}개</span>
						</div>
						
						<div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
							<span class="text-sm text-gray-600">주요 활동</span>
							<span class="text-sm font-medium text-gray-900">{detailAnalysis.topActivity}</span>
						</div>
						
						<div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
							<span class="text-sm text-gray-600">성장률</span>
							<span class="text-sm font-medium text-green-600">+{detailAnalysis.growthRate}%</span>
						</div>
					</div>

					<!-- 활동 패턴 -->
					<div class="bg-gray-50 rounded-lg p-4">
						<h4 class="text-sm font-medium text-gray-700 mb-3">활동 패턴 분석</h4>
						<div class="space-y-2">
							<div class="flex items-center gap-2 text-xs">
								<div class="w-2 h-2 bg-gray-800 rounded-full"></div>
								<span class="text-gray-600">오후 시간대에 가장 활발</span>
							</div>
							<div class="flex items-center gap-2 text-xs">
								<div class="w-2 h-2 bg-gray-800 rounded-full"></div>
								<span class="text-gray-600">주말보다 평일에 더 활동적</span>
							</div>
							<div class="flex items-center gap-2 text-xs">
								<div class="w-2 h-2 bg-gray-800 rounded-full"></div>
								<span class="text-gray-600">좋아요 활동이 가장 빈번</span>
							</div>
						</div>
					</div>
				</div>
			{/if}
		</div>
	</div>
</article> 