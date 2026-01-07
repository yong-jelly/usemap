<script lang="ts">
	import { X, Trash2, TrendingUp, Clock, Search, Star, ChevronRight, ArrowLeft } from 'lucide-svelte';
	import { fade, fly } from 'svelte/transition';
	import { quintOut } from 'svelte/easing';
	import Icon from '$lib/components/Icon.svelte';
	import { bucketStore } from '$lib/stores/bucket.store';

	// Props 정의
	let {
		isOpen = false,
		searchQuery = '',
		onClose,
		onSearch,
		onClearHistory = () => {},
		onRemoveHistoryItem = () => {}
	} = $props<{
		isOpen: boolean;
		searchQuery: string;
		onClose: (skipHistory?: boolean) => void;
		onSearch: (query: string) => void;
		onClearHistory?: () => void;
		onRemoveHistoryItem?: (query: string) => void;
	}>();

	// 검색 상태 관리
	let localSearchQuery = $state('');
	let inputRef: HTMLInputElement;

	// 팝업이 열릴 때 입력 필드에 포커스 설정
	$effect(() => {
		if (isOpen) {
			localSearchQuery = searchQuery;
			setTimeout(() => {
				inputRef?.focus();
			}, 50);
		}
	});

	// 검색 기록 타입 정의
	interface SearchHistoryItem {
		query: string;
		timestamp: number;
	}

	// 검색 기록을 bucketStore에서 관리
	let searchHistory = $state<SearchHistoryItem[]>([]);

	// 날짜 포맷팅 함수 (MM/DD HH:MM)
	function formatSearchDate(timestamp: number): string {
		const date = new Date(timestamp);
		const month = String(date.getMonth() + 1).padStart(2, '0');
		const day = String(date.getDate()).padStart(2, '0');
		const hours = String(date.getHours()).padStart(2, '0');
		const minutes = String(date.getMinutes()).padStart(2, '0');
		return `${month}/${day} ${hours}:${minutes}`;
	}

	// 검색 기록 로드
	function loadSearchHistory() {
		const history = bucketStore.get('search', 'history') || [];

		// 기존 문자열 배열 데이터와 호환성 유지
		if (Array.isArray(history)) {
			if (history.length > 0 && typeof history[0] === 'string') {
				// 기존 문자열 배열을 새 형태로 변환
				searchHistory = history.map(query => ({
					query,
					timestamp: Date.now() - Math.random() * 24 * 60 * 60 * 1000 // 임시 타임스탬프
				}));
			} else {
				// 이미 새 형태의 데이터
				searchHistory = history;
			}
		} else {
			searchHistory = [];
		}
	}

	// 검색 기록 저장
	function saveSearchHistory(history: SearchHistoryItem[]) {
		// 최대 5개까지만 유지
		const limitedHistory = history.slice(0, 5);
		bucketStore.set('search', 'history', limitedHistory, 0); // 만료 없음
		searchHistory = limitedHistory;
	}

	// 검색 기록에 새 검색어 추가
	function addToSearchHistory(query: string) {
		if (!query.trim()) return;

		// 기존 검색어 제거 (중복 방지)
		const filteredHistory = searchHistory.filter(item => item.query !== query);
		// 새 검색어를 맨 앞에 추가
		const newHistory = [
			{ query: query.trim(), timestamp: Date.now() },
			...filteredHistory
		];

		saveSearchHistory(newHistory);
	}

	// 컴포넌트 마운트 시 검색 기록 로드
	$effect(() => {
		loadSearchHistory();
	});

	// 인기 검색어 (하드코딩)
	const trendingSearches = [
		'흑백 요리사',
		'제주도 흑돼지',
		'건강한 샐러드',
		'연남동 카페',
		'홍대 파스타',
		'이태원 브런치',
		'강남 스테이크',
		'합정 디저트',
	];

	// 테마별 추천 검색어 (하드코딩)
	const themedSearches = [
		'서울 가족 모임',
		'광화문 데이트',
		'제주도 도민맛집',
		'수제버거',
		'인스타 카페',
		'경주 경리단길 데이트',
		'모임하기 좋은',
		'아이와 함께',
		'특별한날',
		'파인다이닝',
		'한식 오마카세',
		'소고기 오마카세'
	];

	// 추천 음식점 (하드코딩)
	const recommendedPlaces = [
		{
			id: '1',
			name: '맛있는 국수집',
			category: '한식',
			rating: 4.8,
			reviewCount: 243,
			image: 'https://placeimg.com/100/100/arch'
		},
		{
			id: '2',
			name: '스타 파스타',
			category: '양식',
			rating: 4.5,
			reviewCount: 187,
			image: 'https://placeimg.com/100/100/nature'
		},
		{
			id: '3',
			name: '카페 봉봉',
			category: '카페',
			rating: 4.7,
			reviewCount: 158,
			image: 'https://placeimg.com/100/100/people'
		},
		{
			id: '4',
			name: '마라마라',
			category: '중식',
			rating: 4.6,
			reviewCount: 210,
			image: 'https://placeimg.com/100/100/tech'
		}
	];

	// 필터링된 검색 결과 (하드코딩)
	let filteredResults = $derived(
		localSearchQuery.trim()
			? recommendedPlaces.filter(place =>
				place.name.toLowerCase().includes(localSearchQuery.toLowerCase()) ||
				place.category.toLowerCase().includes(localSearchQuery.toLowerCase())
			)
			: []
	);

	// 검색 실행
	function executeSearch(query: string) {
		if (query.trim()) {
			// 검색 기록에 추가
			addToSearchHistory(query.trim());
			onSearch(query.trim());
		}
	}

	// 직접 검색 실행
	function handleSearch() {
		if (localSearchQuery.trim()) {
			executeSearch(localSearchQuery);
		}
	}

	// 검색 기록 삭제
	function removeHistoryItem(query: string) {
		const newHistory = searchHistory.filter(item => item.query !== query);
		saveSearchHistory(newHistory);
		onRemoveHistoryItem(query);
	}

	// 전체 검색 기록 삭제
	function clearAllHistory() {
		saveSearchHistory([]);
		onClearHistory();
	}

	// 닫기 처리
	function handleClose(skipHistory = false) {
		localSearchQuery = '';
		onClose(skipHistory);
	}

	// ESC 키 이벤트 처리
	function handleKeyDown(e: KeyboardEvent) {
		if (e.key === 'Escape' && isOpen) {
			handleClose(true); // ESC 키로 닫을 때는 히스토리 조작 건너뛰기
		} else if (e.key === 'Enter' && localSearchQuery.trim()) {
			handleSearch();
		}
	}

	// 효과 - ESC 키 이벤트 리스너 등록/해제
	$effect(() => {
		if (isOpen) {
			window.addEventListener('keydown', handleKeyDown);
		} else {
			window.removeEventListener('keydown', handleKeyDown);
		}

		return () => {
			window.removeEventListener('keydown', handleKeyDown);
		};
	});
</script>

{#if isOpen}
<div
	class="fixed inset-0 z-40 bg-white dark:bg-neutral-900"
	transition:fade={{ duration: 200 }}
>
	<!-- 검색 헤더 -->
	<div class="fixed top-0 inset-x-0 z-50 bg-white dark:bg-neutral-800 border-b border-gray-200 dark:border-neutral-700">
		<div class="flex items-center justify-between h-14 px-3 max-w-lg mx-auto">
			<!-- 뒤로가기 버튼 -->
			<button
				type="button"
				onclick={() => handleClose(true)  }
				class="inline-flex items-center justify-center size-8 rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-neutral-400 dark:hover:text-neutral-300 dark:hover:bg-neutral-700 transition-colors"
				aria-label="뒤로 가기"
			>
				<ArrowLeft class="h-5 w-5" />
			</button>

			<!-- 검색 입력 필드 -->
			<div class="flex-1 px-2">
				<div class="relative">
					<input
						type="text"
						bind:value={localSearchQuery}
						bind:this={inputRef}
						placeholder="음식점 검색..."
						onkeydown={handleKeyDown}
						class="w-full bg-gray-100 dark:bg-neutral-700 dark:text-gray-200 rounded-full py-2 pl-9 pr-4 text-base focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white dark:focus:bg-neutral-600 transition-colors"
					/>
					<Search class="absolute left-3 top-3 h-4 w-4 text-gray-400 dark:text-neutral-400" />
					{#if localSearchQuery}
						<button
							type="button"
							onclick={() => localSearchQuery = ''}
							class="absolute right-3 top-3 text-gray-400 hover:text-gray-600 dark:text-neutral-400 dark:hover:text-neutral-300"
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
				onclick={handleSearch}
				class="text-sm font-medium text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 ml-2 transition-colors disabled:opacity-50 disabled:pointer-events-none"
				disabled={!localSearchQuery.trim()}
			>
				검색
			</button>
		</div>
	</div>

	<div class="mx-auto flex h-full w-full max-w-lg flex-col">
		<!-- 컨텐츠 영역 (스크롤 가능) -->
		<div class="flex-1 overflow-y-auto pt-16 pb-16">
			<div class="px-4 py-2">
				{#if localSearchQuery.trim() && filteredResults.length > 0}
					<!-- 검색 결과 -->
					<div class="mt-2 mb-6">
						<h3 class="text-base font-medium text-gray-800 dark:text-gray-200 mb-3">'{localSearchQuery}' 검색 결과</h3>
						<div class="space-y-3">
							{#each filteredResults as place}
							<div
								class="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-neutral-700 p-3 hover:shadow-sm transition-shadow"
								onclick={() => executeSearch(place.name)}
							>
								<div class="flex justify-between items-center">
									<h4 class="font-medium text-gray-900 dark:text-gray-100">{place.name}</h4>
									<span class="bg-gray-100 dark:bg-neutral-700 text-xs font-medium text-gray-600 dark:text-gray-300 rounded-full px-2 py-0.5">{place.category}</span>
								</div>
								<div class="flex items-center mt-1 text-sm text-gray-500 dark:text-gray-400">
									<span class="flex items-center text-yellow-500">
										<Star class="h-3 w-3 fill-current mr-1" />
										{place.rating}
									</span>
									<span class="mx-2">•</span>
									<span>리뷰 {place.reviewCount}개</span>
								</div>
							</div>
							{/each}
						</div>
					</div>
				{/if}

				<!-- 검색 내역 섹션 -->
				<div class="mb-6" transition:fly={{ y: 10, duration: 200, delay: 50 }}>
					<div class="flex items-center justify-between mb-2">
						<div class="flex items-center text-gray-800 dark:text-gray-200">
							<Clock class="h-4 w-4 mr-2" />
							<h3 class="text-base font-medium">최근 검색</h3>
						</div>
						{#if searchHistory.length > 0}
						<button
							class="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 flex items-center"
							onclick={clearAllHistory}
						>
							<Trash2 class="h-3 w-3 mr-1" />
							전체 삭제
						</button>
						{/if}
					</div>

					{#if searchHistory.length > 0}
					<div class="space-y-2">
						{#each searchHistory as historyItem, i (historyItem.query + historyItem.timestamp)}
						<div
							class="flex items-center justify-between py-2 border-b border-gray-100 dark:border-neutral-800"
							transition:fly={{ y: 5, duration: 150, delay: 50 + i * 30 }}
						>
							<button
								class="flex items-center text-sm text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 flex-1 text-left"
								onclick={() => executeSearch(historyItem.query)}
							>
								<Search class="h-4 w-4 mr-3 text-gray-400 dark:text-gray-500" />
								<div class="flex flex-col items-start">
									<span class="text-gray-900 dark:text-gray-100">{historyItem.query}</span>
									<span class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{formatSearchDate(historyItem.timestamp)}</span>
								</div>
							</button>
							<button
								class="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400 p-1"
								onclick={() => removeHistoryItem(historyItem.query)}
								aria-label="삭제"
							>
								<X class="h-4 w-4" />
							</button>
						</div>
						{/each}
					</div>
					{:else}
					<div class="py-8 text-center">
						<div class="flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
							<Search class="h-8 w-8 mb-2 opacity-50" />
							<p class="text-sm">최근 검색 기록이 없습니다</p>
							<p class="text-xs mt-1">검색을 시작해보세요!</p>
						</div>
					</div>
					{/if}
				</div>

				<!-- 인기 검색어 섹션 -->
				<div class="mb-6" transition:fly={{ y: 10, duration: 200, delay: 100 }}>
					<div class="flex items-center mb-2">
						<TrendingUp class="h-4 w-4 mr-2 text-gray-800 dark:text-gray-200" />
						<h3 class="text-base font-medium text-gray-800 dark:text-gray-200">인기 검색어</h3>
					</div>

					<div class="flex flex-wrap gap-2 mt-3">
						{#each trendingSearches as trend, i}
						<button
							class="flex items-center rounded-full px-3 py-1.5 bg-gray-100 dark:bg-neutral-800 hover:bg-gray-200 dark:hover:bg-neutral-700 transition-colors"
							onclick={() => executeSearch(trend)}
							transition:fly={{ y: 5, duration: 150, delay: 100 + i * 30 }}
						>
							<span class="text-xs font-medium text-gray-900 dark:text-gray-100 mr-1.5">{i+1}</span>
							<span class="text-sm text-gray-700 dark:text-gray-300">{trend}</span>
						</button>
						{/each}
					</div>
				</div>

				<!-- 테마별 추천 검색어 섹션 -->
				<div class="mb-6" transition:fly={{ y: 10, duration: 200, delay: 150 }}>
					<div class="flex items-center mb-2">
						<!-- <Star class="h-4 w-4 mr-2 text-gray-800 dark:text-gray-200" /> -->
              <Icon name="coffee" class="h-4 w-4 mr-2 text-gray-800 dark:text-gray-200" />
						<h3 class="text-base font-medium text-gray-800 dark:text-gray-200">테마별 검색어</h3>
					</div>

					<div class="grid grid-cols-2 gap-2 mt-3">
						{#each themedSearches as theme, i}
						<button
							class="flex items-center justify-center rounded-lg px-3 py-2.5 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 hover:from-indigo-100 hover:to-purple-100 dark:hover:from-indigo-800/30 dark:hover:to-purple-800/30 border border-indigo-200/50 dark:border-indigo-700/50 transition-all duration-200"
							onclick={() => executeSearch(theme)}
							transition:fly={{ y: 5, duration: 150, delay: 150 + i * 40 }}
						>
							<span class="text-sm font-medium text-gray-800 dark:text-gray-200 text-center leading-tight">{theme}</span>
						</button>
						{/each}
					</div>
				</div>

				<!-- 추천 음식점 섹션
				<div class="mb-6" transition:fly={{ y: 10, duration: 200, delay: 150 }}>
					<div class="flex items-center justify-between mb-3">
						<div class="flex items-center">
							<Star class="h-4 w-4 mr-2 text-gray-800 dark:text-gray-200" />
							<h3 class="text-base font-medium text-gray-800 dark:text-gray-200">추천 맛집</h3>
						</div>
						<button class="text-xs text-indigo-600 dark:text-indigo-400 flex items-center">
							모두 보기
							<ChevronRight class="h-3 w-3 ml-0.5" />
						</button>
					</div>

					<div class="space-y-3">
						{#each recommendedPlaces as place, i}
						<div
							class="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-neutral-700 p-3 hover:shadow-sm transition-shadow"
							onclick={() => executeSearch(place.name)}
							transition:fly={{ y: 5, duration: 150, delay: 150 + i * 50 }}
						>
							<div class="flex justify-between items-start">
								<div>
									<h4 class="font-medium text-gray-900 dark:text-gray-100">{place.name}</h4>
									<div class="flex items-center mt-1 text-sm text-gray-500 dark:text-gray-400">
										<span class="flex items-center text-yellow-500">
											<Star class="h-3 w-3 fill-current mr-1" />
											{place.rating}
										</span>
										<span class="mx-2">•</span>
										<span>리뷰 {place.reviewCount}개</span>
									</div>
								</div>
								<span class="bg-gray-100 dark:bg-neutral-700 text-xs font-medium text-gray-600 dark:text-gray-300 rounded-full px-2 py-0.5">{place.category}</span>
							</div>
						</div>
						{/each}
					</div>
				</div>-->
			</div>
		</div>
	</div>
</div>
{/if}
