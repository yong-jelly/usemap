<script lang="ts">
	import StatCard from './components/StatCard.svelte';
	import PlaceCardModern from './components/PlaceCardModern.svelte';
	import { Flame, BarChart, Sparkles } from 'lucide-svelte';

	let activeTab = $state('my-activity');

	type StatCardProps = {
		title: string;
		category: string;
		userStat: { user: number; total: number };
		totalStat: { user: number; total: number };
		format?: 'percentage' | 'count';
	};

	// --- Mock Data ---
	const myStatsData: Record<string, StatCardProps> = $state({
		visited: {
			title: '방문율',
			category: '전국 추천 음식점',
			userStat: { user: 88, total: 1250 },
			totalStat: { user: 31250, total: 1250 * 500 } // Assume 500 users avg
		},
		liked: {
			title: '좋아요 비율',
			category: '전국 추천 음식점',
			userStat: { user: 210, total: 5500 }, // Total likes I've given
			totalStat: { user: 120500, total: 5500 * 500 },
			format: 'count'
		},
		gangnamVisited: {
			title: '방문율 (강남구)',
			category: '서울시 강남구',
			userStat: { user: 12, total: 78 },
			totalStat: { user: 1560, total: 78 * 500 }
		},
		koreanFoodVisited: {
			title: '방문율 (한식)',
			category: '음식 카테고리: 한식',
			userStat: { user: 35, total: 320 },
			totalStat: { user: 64000, total: 320 * 500 }
		}
	});

	const trendingData = $state({
		mostViewed: [
			{
				id: 1,
				name: '더피자 소년',
				category: '피자',
				imageUrl:
					'https://search.pstatic.net/common/?autoRotate=true&quality=95&type=w750&src=https%3A%2F%2Fldb-phinf.pstatic.net%2F20230206_145%2F1675661445749mGNQH_JPEG%2Fimage.jpg',
				tags: ['주간 1위', '2,431회'],
				region: '강남구'
			},
			{
				id: 2,
				name: '고향집',
				category: '한식',
				imageUrl:
					'https://search.pstatic.net/common/?autoRotate=true&quality=95&type=w750&src=https%3A%2F%2Fldb-phinf.pstatic.net%2F20230502_264%2F1682998398489wTk5a_JPEG%2F20230425_190342.jpg',
				tags: ['주간 2위', '1,988회'],
				region: '종로구'
			}
		],
		newlyRecommended: [
			{
				id: 3,
				name: '어머니의 손맛',
				category: '백반',
				imageUrl: 'https://placehold.co/400x400?text=맛집3',
				tags: ['신규추천'],
				region: '마포구'
			}
		]
	});
</script>

<div class="bg-gray-100 min-h-screen">
	<!-- 상단 헤더 -->
	<header class="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-gray-200">
		<div class="px-4 py-3 max-w-5xl mx-auto">
			<h1 class="text-lg font-semibold text-gray-900">통계 및 트렌드</h1>
		</div>
	</header>

	<!-- 탭 메뉴 -->
	<div class="bg-white border-b border-gray-200">
		<nav class="flex justify-center -mb-px" aria-label="Tabs">
			<button
				onclick={() => (activeTab = 'my-activity')}
				class="w-1/2 md:w-auto shrink-0 border-b-2 px-4 py-3 text-sm font-medium text-center transition-colors"
				class:border-indigo-500={activeTab === 'my-activity'}
				class:text-indigo-600={activeTab === 'my-activity'}
				class:border-transparent={activeTab !== 'my-activity'}
				class:text-gray-500={activeTab !== 'my-activity'}
				class:hover:text-gray-700={activeTab !== 'my-activity'}
			>
				나의 활동 분석
			</button>
			<button
				onclick={() => (activeTab = 'overall-trends')}
				class="w-1/2 md:w-auto shrink-0 border-b-2 px-4 py-3 text-sm font-medium text-center transition-colors"
				class:border-indigo-500={activeTab === 'overall-trends'}
				class:text-indigo-600={activeTab === 'overall-trends'}
				class:border-transparent={activeTab !== 'overall-trends'}
				class:text-gray-500={activeTab !== 'overall-trends'}
				class:hover:text-gray-700={activeTab !== 'overall-trends'}
			>
				전체 트렌드
			</button>
		</nav>
	</div>

	<!-- 메인 콘텐츠 -->
	<main class="p-4 max-w-5xl mx-auto space-y-8 pb-20">
		{#if activeTab === 'my-activity'}
			<div class="space-y-4">
				<div class="p-4 bg-indigo-50 text-indigo-800 rounded-lg text-sm">
					로그인 사용자에게만 제공되는 개인 맞춤형 통계입니다. 전체 사용자의 평균 데이터와 내 활동을
					비교해 보세요.
				</div>
				<StatCard {...myStatsData.visited} />
				<StatCard {...myStatsData.liked} />
				<StatCard {...myStatsData.gangnamVisited} />
				<StatCard {...myStatsData.koreanFoodVisited} />
			</div>
		{:else if activeTab === 'overall-trends'}
			<div class="space-y-8">
				<section>
					<h2 class="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
						<Flame class="w-5 h-5 text-orange-500" />
						주간 가장 많이 본 맛집
					</h2>
					<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
						{#each trendingData.mostViewed as place}
							<PlaceCardModern {...place} />
						{/each}
					</div>
				</section>
				<section>
					<h2 class="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
						<Sparkles class="w-5 h-5 text-yellow-500" />
						새롭게 추천된 맛집
					</h2>
					<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
						{#each trendingData.newlyRecommended as place}
							<PlaceCardModern {...place} />
						{/each}
					</div>
				</section>
				<section>
					<h2 class="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
						<BarChart class="w-5 h-5 text-blue-500" />
						카테고리별 통계 (전체)
					</h2>
					<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div class="bg-white p-4 rounded-lg border">
							<h3 class="font-medium">Top 5 방문 카테고리</h3>
							<!-- Placeholder for chart -->
							<div class="h-40 bg-gray-100 mt-2 rounded flex items-center justify-center">
								<p class="text-gray-400 text-sm">차트 영역</p>
							</div>
						</div>
						<div class="bg-white p-4 rounded-lg border">
							<h3 class="font-medium">Top 5 좋아요 지역</h3>
							<!-- Placeholder for chart -->
							<div class="h-40 bg-gray-100 mt-2 rounded flex items-center justify-center">
								<p class="text-gray-400 text-sm">차트 영역</p>
							</div>
						</div>
					</div>
				</section>
			</div>
		{/if}
	</main>
</div>