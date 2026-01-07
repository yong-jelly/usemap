<script lang="ts">
	import { Search, X, ArrowLeft } from 'lucide-svelte';
	import { quintOut } from 'svelte/easing';
	import FilterButtonGroup from '$lib/components/explore/FilterButtonGroup.svelte';
	import type { ExplorerFilterState } from '$services/types';

	// Props 정의
	let {
		onSearch,
		onToggleSearchPopup,
		filters,
		onFilterSelect,
		onEvent,
		onFilterStart,
		isFirstOpenMyLocationSheetOpen,
		viewMode,
	} = $props<{
		onSearch: (query: string) => void;
		onToggleSearchPopup?: () => void;
		filters: ExplorerFilterState;
		onFilterSelect: (filterId: string, value: any) => void;
		onEvent: (event: any) => void;
		onFilterStart: () => void;
		isFirstOpenMyLocationSheetOpen: boolean;
		viewMode: string;
	}>();

	// 검색 모드 상태 관리
	let isSearchMode = $state(false);
	let searchQuery = $state('');
	let inputRef: HTMLInputElement;

	// 테마 버튼 데이터 (필터 태그 표시용)
	const themeButtons = [
		{ id: 'all', label: '전체' },
		{ id: 'food_good', label: '음식맛' },
		{ id: 'price_cheap', label: '가성비' },
		{ id: 'large', label: '음식양' },
		{ id: 'special_menu', label: '특별메뉴' },
		{ id: 'eat_alone', label: '혼밥' },
		{ id: 'spacious', label: '넓은매장' },
		{ id: 'fresh', label: '신선도' },
		{ id: 'kind', label: '친절' },
		{ id: 'store_clean', label: '청결' },
		{ id: 'food_fast', label: '빠른 주문' },
		{ id: 'special_day', label: '특별함' },
		{ id: 'toilet_clean', label: '깨끗 화장실' },
		{ id: 'together', label: '단체모임' },
		{ id: 'interior_cool', label: '인테리어' },
		{ id: 'taste_healthy', label: '건강한 맛' },
		{ id: 'view_good', label: '굳 뷰' },
		{ id: 'parking_easy', label: '주차편리' },
		{ id: 'price_worthy', label: '비싼가치' },
		{ id: 'menu_good', label: '알찬구성' },
		{ id: 'kid_good', label: '아이와 함께' },
		{ id: 'concept_unique', label: '독특 컨셉' },
		{ id: 'local_taste', label: '현지맛' },
		{ id: 'atmosphere_calm', label: '분위기' },
		{ id: 'drink_alone', label: '굳 혼술' },
		{ id: 'comfy', label: '편한 좌석' },
		{ id: 'pet_good', label: '반려동물' },
	];

	// 검색 모드 전환
	function toggleSearchMode() {
		// SearchPopup이 있는 경우 SearchPopup을 사용
		if (onToggleSearchPopup) {
			onToggleSearchPopup();
			return;
		}

		// 그렇지 않으면 기본 검색 모드 사용
		isSearchMode = !isSearchMode;
		if (!isSearchMode) {
			searchQuery = '';
		} else {
			// 검색 모드로 전환 후 입력 필드에 포커스 (마이크로태스크로 지연 실행)
			setTimeout(() => {
				inputRef?.focus();
			}, 10);
		}
	}

	// 검색창 열기 (팝업)
	function openSearchPopup() {
		if (onToggleSearchPopup) {
			onToggleSearchPopup();
		} else {
			toggleSearchMode();
		}
	}

	// 검색 실행
	function executeSearch() {
		if (searchQuery.trim()) {
			onSearch(searchQuery.trim());
			isSearchMode = false;
		}
	}

	// 키보드 이벤트 처리
	function handleKeyDown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			executeSearch();
		} else if (e.key === 'Escape') {
			toggleSearchMode();
		}
	}

	// 필터 태그 제거 함수들
	function removeGroup2() {
		onFilterSelect('region', {
			group1: filters.group1,
			group2: null,
			group3: null,
		});
	}

	function removeGroup3() {
		onFilterSelect('region', {
			group1: filters.group1,
			group2: filters.group2,
			group3: null,
		});
	}

	function removeCategory(cat: string) {
		const newCategories = filters.categories.filter((c: string) => c !== cat);
		onFilterSelect('categories', newCategories);
	}

	function removeFeature(feat: string) {
		const newFeatures = filters.features.filter((f: string) => f !== feat);
		onFilterSelect('convenience', newFeatures);
	}

	function removeTheme() {
		onFilterSelect('theme', null);
	}

	function removeRating() {
		onFilterSelect('rating', null);
	}

	// 모드 전환 트랜지션에 사용할 설정
	const transitionConfig = { duration: 200, easing: quintOut };
</script>

<!-- 헤더 컨테이너 (트렌드 페이지와 동일한 구조) -->
<!-- <header class="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm dark:bg-neutral-800 dark:border-neutral-700"> -->
<header>
	<!-- <div class="px-4 py-3"> -->
	<div class="px-4 py-3">
		{#if !isSearchMode}
			<!-- 상단 헤더 영역 -->
			<div class="mb-3 flex items-center justify-between">
				<h1 class="flex items-center gap-2 text-xl font-bold text-gray-900 dark:text-gray-100">
					탐색
				</h1>
				<div class="flex gap-2">
					<button
						type="button"
						class="rounded-lg p-2 transition-colors hover:bg-gray-100 dark:hover:bg-neutral-700"
						onclick={openSearchPopup}
						aria-label="검색"
					>
						<Search class="h-5 w-5 text-gray-600 dark:text-gray-400" />
					</button>
				</div>
			</div>

			<!-- 필터 버튼 그룹 -->
			{#if viewMode !== 'search'}
				<div>
					<FilterButtonGroup
						{isFirstOpenMyLocationSheetOpen}
						{onFilterSelect}
						{onEvent}
						onStart={onFilterStart}
					/>
				</div>
			{/if}

			<!-- 선택된 필터 태그 영역 -->
			{#if viewMode !== 'search' && (filters.group1 || filters.group2 || filters.group3 || (filters.categories && filters.categories.length) || (filters.features && filters.features.length) || filters.themes || filters.rating)}
				<div class="flex flex-wrap gap-2 pb-2">
					<!-- group1: 지역1 (제거 불가) -->
					{#if filters.group1}
						<span
							class="inline-flex items-center rounded border border-blue-300 bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700 dark:border-blue-700 dark:bg-blue-900 dark:text-blue-200"
						>
							{filters.group1}
						</span>
					{/if}
					<!-- group2: 지역2 (제거 가능) -->
					{#if filters.group2 && filters.group2 !== '전체'}
						<button
							class="inline-flex items-center rounded border border-gray-300 bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700 transition hover:bg-gray-200 dark:border-gray-700 dark:bg-neutral-800 dark:text-gray-200 dark:hover:bg-neutral-700"
							onclick={removeGroup2}
						>
							{filters.group2}
							<X class="ml-1 h-3 w-3" />
						</button>
					{/if}
					<!-- group3: 지역3 (제거 가능) -->
					{#if filters.group3}
						<button
							class="inline-flex items-center rounded border border-gray-300 bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700 transition hover:bg-gray-200 dark:border-gray-700 dark:bg-neutral-800 dark:text-gray-200 dark:hover:bg-neutral-700"
							onclick={removeGroup3}
						>
							{filters.group3}
							<X class="ml-1 h-3 w-3" />
						</button>
					{/if}
					<!-- categories: 카테고리 (여러 개) -->
					{#each filters.categories as cat (cat)}
						<button
							class="inline-flex items-center rounded border border-green-300 bg-green-100 px-3 py-1 text-xs font-medium text-green-700 transition hover:bg-green-200 dark:border-green-700 dark:bg-green-900 dark:text-green-200 dark:hover:bg-green-800"
							onclick={() => removeCategory(cat)}
						>
							{cat}
							<X class="ml-1 h-3 w-3" />
						</button>
					{/each}
					<!-- features: 편의시설 (여러 개) -->
					{#each filters.features as feat (feat)}
						<button
							class="inline-flex items-center rounded border border-yellow-300 bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-700 transition hover:bg-yellow-200 dark:border-yellow-700 dark:bg-yellow-900 dark:text-yellow-800 dark:hover:bg-yellow-800"
							onclick={() => removeFeature(feat)}
						>
							{feat}
							<X class="ml-1 h-3 w-3" />
						</button>
					{/each}
					<!-- themes: 테마 (단일) -->
					{#if filters.themes}
						<button
							class="inline-flex items-center rounded border border-purple-300 bg-purple-100 px-3 py-1 text-xs font-medium text-purple-700 transition hover:bg-purple-200 dark:border-purple-700 dark:bg-purple-900 dark:text-purple-200 dark:hover:bg-purple-800"
							onclick={removeTheme}
						>
							{themeButtons.find((t) => t.id === filters.themes)?.label ?? filters.themes}
							<X class="ml-1 h-3 w-3" />
						</button>
					{/if}
					<!-- rating: 평점 (단일) -->
					{#if filters.rating}
						<button
							class="inline-flex items-center rounded border border-pink-300 bg-pink-100 px-3 py-1 text-xs font-medium text-pink-700 transition hover:bg-pink-200 dark:border-pink-700 dark:bg-pink-900 dark:text-pink-200 dark:hover:bg-pink-800"
							onclick={removeRating}
						>
							평점 {filters.rating} 이상
							<X class="ml-1 h-3 w-3" />
						</button>
					{/if}
				</div>
			{/if}
		{:else}
			<!-- 검색 모드 헤더 -->
			<div class="flex items-center justify-between">
				<!-- 뒤로가기 버튼 -->
				<button
					type="button"
					onclick={toggleSearchMode}
					class="inline-flex size-8 items-center justify-center rounded text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:text-neutral-400 dark:hover:bg-neutral-700 dark:hover:text-neutral-300"
					aria-label="뒤로 가기"
				>
					<ArrowLeft class="h-5 w-5" />
				</button>

				<!-- 검색 입력 필드 -->
				<div class="flex-1 px-2">
					<div class="relative">
						<input
							type="text"
							bind:value={searchQuery}
							bind:this={inputRef}
							placeholder="음식점 검색..."
							onkeydown={handleKeyDown}
							class="w-full rounded bg-gray-100 py-2 pr-4 pl-9 text-sm transition-colors focus:bg-white focus:ring-1 focus:ring-indigo-500 focus:outline-none dark:bg-neutral-700 dark:text-gray-200 dark:focus:bg-neutral-600"
						/>
						<Search class="absolute top-2 left-3 h-4 w-4 text-gray-400 dark:text-neutral-400" />
						{#if searchQuery}
							<button
								type="button"
								onclick={() => (searchQuery = '')}
								class="absolute top-2 right-3 text-gray-400 hover:text-gray-600 dark:text-neutral-400 dark:hover:text-neutral-300"
								aria-label="검색어 지우기"
							>
								<X class="h-4 w-4" />
							</button>
						{/if}
					</div>
				</div>

				<!-- 검색 버튼 -->
				<button
					type="button"
					onclick={executeSearch}
					class="ml-2 text-sm font-medium text-indigo-600 transition-colors hover:text-indigo-800 disabled:pointer-events-none disabled:opacity-50 dark:text-indigo-400 dark:hover:text-indigo-300"
					disabled={!searchQuery.trim()}
				>
					검색
				</button>
			</div>
		{/if}
	</div>
</header>
