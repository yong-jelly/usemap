<script lang="ts">
	import { BarChart, Calendar, Heart, Bookmark, MapPin } from 'lucide-svelte';

	interface PreferenceItem {
		name: string;
		likes: number;
		saves: number;
		visits: number;
		total: number;
	}

	interface MyPreferencesData {
		id: string;
		title: string;
		period: string;
		regionPreferences: PreferenceItem[];
		categoryPreferences: PreferenceItem[];
		summary: {
			totalActivities: number;
			topRegion: string;
			topCategory: string;
			mostLikedRegion: string;
			mostVisitedCategory: string;
		};
		timestamp: string;
	}

	const { card } = $props<{ card: MyPreferencesData }>();

	let showAllRegions = $state(false);
	let showAllCategories = $state(false);
	let currentView = $state(0); // 0: 합계, 1: 좋아요, 2: 저장, 3: 방문

	const viewLabels = ['전체', '좋아요', '저장', '방문'];
	const viewIcons = [BarChart, Heart, Bookmark, MapPin];

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

	function getMaxValue(items: PreferenceItem[], view: number): number {
		return Math.max(...items.map(item => getValueByView(item, view)));
	}

	function toggleRegions() {
		showAllRegions = !showAllRegions;
	}

	function toggleCategories() {
		showAllCategories = !showAllCategories;
	}

	function changeView(index: number) {
		currentView = index;
	}
</script>

<article class="bg-white rounded-lg shadow-sm mb-3 overflow-hidden border border-gray-100">
	<!-- 헤더 -->
	<header class="p-4 pb-3">
		<div class="flex items-center justify-between">
			<div class="flex items-center gap-2">
				<div class="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-full">
					<BarChart class="w-3 h-3 text-gray-600" />
					<span class="text-xs font-medium text-gray-700">내 취향 분석</span>
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

		<!-- 활동 요약 -->
		<div class="bg-gray-50 rounded-lg p-4 mb-4">
			<h4 class="text-sm font-medium text-gray-700 mb-3">활동 요약</h4>
			<div class="grid grid-cols-2 gap-4 text-center">
				<div>
					<p class="text-2xl font-bold text-gray-900">{card.summary.totalActivities}</p>
					<p class="text-xs text-gray-500">총 활동</p>
				</div>
				<div>
					<p class="text-lg font-medium text-gray-900">{card.regionPreferences.length}</p>
					<p class="text-xs text-gray-500">지역 탐방</p>
				</div>
			</div>
			<div class="mt-3 pt-3 border-t border-gray-200 space-y-1">
				<p class="text-sm text-gray-600">가장 많이 간 지역: <span class="font-medium text-gray-900">{card.summary.topRegion}</span></p>
				<p class="text-sm text-gray-600">선호 음식 종류: <span class="font-medium text-gray-900">{card.summary.topCategory}</span></p>
			</div>
		</div>

		<!-- 활동별 보기 탭 -->
		<div class="flex items-center gap-1 mb-4 p-1 bg-gray-100 rounded-lg">
			{#each viewLabels as label, index}
				{@const SvelteComponent = viewIcons[index]}
				<button
					class="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-xs font-medium rounded-md transition-colors {currentView === index ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}"
					onclick={() => changeView(index)}
				>
					<SvelteComponent class="w-3 h-3" />
					{label}
				</button>
			{/each}
		</div>

		<!-- 지역별 선호도 -->
		<div class="mb-6">
			<div class="flex items-center justify-between mb-3">
				<h4 class="font-medium text-gray-900">지역별 선호도</h4>
				{#if card.regionPreferences.length > 4}
					<button
						class="text-xs text-gray-500 hover:text-gray-700 transition-colors"
						onclick={toggleRegions}
					>
						{showAllRegions ? '접기' : `+${card.regionPreferences.length - 4}개 더보기`}
					</button>
				{/if}
			</div>
			
			<div class="space-y-2">
				{#each getTopItems(card.regionPreferences, showAllRegions) as region}
					{@const value = getValueByView(region, currentView)}
					{@const maxValue = getMaxValue(card.regionPreferences, currentView)}
					<div class="flex items-center gap-3">
						<div class="w-12 text-sm text-gray-600 text-right">{region.name}</div>
						<div class="flex-1 relative">
							<div class="w-full h-6 bg-gray-100 rounded-full overflow-hidden">
								<div 
									class="h-full bg-gray-800 rounded-full transition-all duration-500 flex items-center justify-end pr-2"
									style="width: {maxValue > 0 ? (value / maxValue) * 100 : 0}%"
								>
									{#if value > 0}
										<span class="text-xs text-white font-medium">{value}</span>
									{/if}
								</div>
							</div>
						</div>
						<div class="w-8 text-xs text-gray-500 text-right">
							{maxValue > 0 ? Math.round((value / maxValue) * 100) : 0}%
						</div>
					</div>
				{/each}
			</div>
		</div>

		<!-- 카테고리별 선호도 -->
		<div class="mb-4">
			<div class="flex items-center justify-between mb-3">
				<h4 class="font-medium text-gray-900">음식 카테고리별 선호도</h4>
				{#if card.categoryPreferences.length > 4}
					<button
						class="text-xs text-gray-500 hover:text-gray-700 transition-colors"
						onclick={toggleCategories}
					>
						{showAllCategories ? '접기' : `+${card.categoryPreferences.length - 4}개 더보기`}
					</button>
				{/if}
			</div>
			
			<div class="space-y-2">
				{#each getTopItems(card.categoryPreferences, showAllCategories) as category}
					{@const value = getValueByView(category, currentView)}
					{@const maxValue = getMaxValue(card.categoryPreferences, currentView)}
					<div class="flex items-center gap-3">
						<div class="w-12 text-sm text-gray-600 text-right">{category.name}</div>
						<div class="flex-1 relative">
							<div class="w-full h-6 bg-gray-100 rounded-full overflow-hidden">
								<div 
									class="h-full bg-gray-800 rounded-full transition-all duration-500 flex items-center justify-end pr-2"
									style="width: {maxValue > 0 ? (value / maxValue) * 100 : 0}%"
								>
									{#if value > 0}
										<span class="text-xs text-white font-medium">{value}</span>
									{/if}
								</div>
							</div>
						</div>
						<div class="w-8 text-xs text-gray-500 text-right">
							{maxValue > 0 ? Math.round((value / maxValue) * 100) : 0}%
						</div>
					</div>
				{/each}
			</div>
		</div>

		<!-- 취향 인사이트 -->
		<div class="bg-gray-50 rounded-lg p-4">
			<h4 class="text-sm font-medium text-gray-700 mb-3">취향 인사이트</h4>
			<div class="space-y-2">
				<div class="flex items-center gap-2 text-xs">
					<div class="w-2 h-2 bg-gray-800 rounded-full"></div>
					<span class="text-gray-600">{card.summary.topRegion}에서 가장 활발하게 활동</span>
				</div>
				<div class="flex items-center gap-2 text-xs">
					<div class="w-2 h-2 bg-gray-800 rounded-full"></div>
					<span class="text-gray-600">{card.summary.topCategory} 음식을 가장 선호</span>
				</div>
				<div class="flex items-center gap-2 text-xs">
					<div class="w-2 h-2 bg-gray-800 rounded-full"></div>
					<span class="text-gray-600">{card.regionPreferences.length}개 지역, {card.categoryPreferences.length}개 카테고리 경험</span>
				</div>
			</div>
		</div>
	</div>
</article> 