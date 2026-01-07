<!-- @migration-task Error while migrating Svelte code: `{@const}` must be the immediate child of `{#snippet}`, `{#if}`, `{:else if}`, `{:else}`, `{#each}`, `{:then}`, `{:catch}`, `<svelte:fragment>`, `<svelte:boundary` or `<Component>`
https://svelte.dev/e/const_tag_invalid_placement -->
<!-- @migration-task Error while migrating Svelte code: `{@const}` must be the immediate child of `{#snippet}`, `{#if}`, `{:else if}`, `{:else}`, `{#each}`, `{:then}`, `{:catch}`, `<svelte:fragment>`, `<svelte:boundary` or `<Component>`
https://svelte.dev/e/const_tag_invalid_placement -->
<!-- @migration-task Error while migrating Svelte code: `{@const}` must be the immediate child of `{#snippet}`, `{#if}`, `{:else if}`, `{:else}`, `{#each}`, `{:then}`, `{:catch}`, `<svelte:fragment>`, `<svelte:boundary` or `<Component>`
https://svelte.dev/e/const_tag_invalid_placement -->
<!-- @migration-task Error while migrating Svelte code: `{@const}` must be the immediate child of `{#snippet}`, `{#if}`, `{:else if}`, `{:else}`, `{#each}`, `{:then}`, `{:catch}`, `<svelte:fragment>`, `<svelte:boundary` or `<Component>`
https://svelte.dev/e/const_tag_invalid_placement -->
<!-- @migration-task Error while migrating Svelte code: `{@const}` must be the immediate child of `{#snippet}`, `{#if}`, `{:else if}`, `{:else}`, `{#each}`, `{:then}`, `{:catch}`, `<svelte:fragment>`, `<svelte:boundary` or `<Component>`
https://svelte.dev/e/const_tag_invalid_placement -->
<!-- @migration-task Error while migrating Svelte code: `{@const}` must be the immediate child of `{#snippet}`, `{#if}`, `{:else if}`, `{:else}`, `{#each}`, `{:then}`, `{:catch}`, `<svelte:fragment>`, `<svelte:boundary` or `<Component>`
https://svelte.dev/e/const_tag_invalid_placement -->
<!-- @migration-task Error while migrating Svelte code: `{@const}` must be the immediate child of `{#snippet}`, `{#if}`, `{:else if}`, `{:else}`, `{#each}`, `{:then}`, `{:catch}`, `<svelte:fragment>`, `<svelte:boundary` or `<Component>`
https://svelte.dev/e/const_tag_invalid_placement -->
<!-- @migration-task Error while migrating Svelte code: `{@const}` must be the immediate child of `{#snippet}`, `{#if}`, `{:else if}`, `{:else}`, `{#each}`, `{:then}`, `{:catch}`, `<svelte:fragment>`, `<svelte:boundary` or `<Component>`
https://svelte.dev/e/const_tag_invalid_placement -->
<!-- @migration-task Error while migrating Svelte code: `{@const}` must be the immediate child of `{#snippet}`, `{#if}`, `{:else if}`, `{:else}`, `{#each}`, `{:then}`, `{:catch}`, `<svelte:fragment>`, `<svelte:boundary` or `<Component>`
https://svelte.dev/e/const_tag_invalid_placement -->
<!-- @migration-task Error while migrating Svelte code: `{@const}` must be the immediate child of `{#snippet}`, `{#if}`, `{:else if}`, `{:else}`, `{#each}`, `{:then}`, `{:catch}`, `<svelte:fragment>`, `<svelte:boundary` or `<Component>`
https://svelte.dev/e/const_tag_invalid_placement -->
<script lang="ts">
	import Indicator from '$lib/components/Indicator.svelte';
	import { onMount } from 'svelte';
	
	// 그룹 랭킹 타입 정의
	interface GroupRanking {
		id: string;
		name: string;
		thumbnail: string;
		memberCount: number;
		placeCount: number;
		likeCount: number;
		saveCount: number;
		weeklyGrowth: number;
		rank: number;
		previousRank: number;
		tags: string[];
		isOfficial: boolean;
	}
	
	// 상태
	let rankings = $state<GroupRanking[]>([]);
	let loading = $state(true);
	let period = $state<'weekly' | 'monthly'>('weekly');
	let category = $state<'all' | 'activity' | 'growth'>('all');
	
	// 더미 데이터
	const weeklyRankings: GroupRanking[] = [
		{
			id: 'group-1',
			name: '서울 맛집 탐험대',
			thumbnail: 'https://placehold.co/300x200?text=서울맛집',
			memberCount: 1245,
			placeCount: 67,
			likeCount: 5678,
			saveCount: 987,
			weeklyGrowth: 23,
			rank: 1,
			previousRank: 2,
			tags: ['서울', '맛집', '데이트', '혼밥'],
			isOfficial: false
		},
		{
			id: 'group-2',
			name: '분위기 좋은 카페 모음',
			thumbnail: 'https://placehold.co/300x200?text=감성카페',
			memberCount: 978,
			placeCount: 42,
			likeCount: 3456,
			saveCount: 786,
			weeklyGrowth: 15,
			rank: 2,
			previousRank: 1,
			tags: ['카페', '디저트', '베이커리', '인스타그램'],
			isOfficial: false
		},
		{
			id: 'group-3',
			name: '가성비 끝판왕 맛집',
			thumbnail: 'https://placehold.co/300x200?text=가성비맛집',
			memberCount: 2356,
			placeCount: 89,
			likeCount: 7890,
			saveCount: 1234,
			weeklyGrowth: 8,
			rank: 3,
			previousRank: 3,
			tags: ['가성비', '든든', '저렴', '대학가'],
			isOfficial: false
		},
		{
			id: 'group-4',
			name: '신상 맛집 얼리어답터',
			thumbnail: 'https://placehold.co/300x200?text=신상맛집',
			memberCount: 732,
			placeCount: 23,
			likeCount: 1890,
			saveCount: 432,
			weeklyGrowth: 45,
			rank: 4,
			previousRank: 8,
			tags: ['신상', '오픈', '트렌드', '핫플레이스'],
			isOfficial: false
		},
		{
			id: 'group-5',
			name: '고기 맛집 정복하기',
			thumbnail: 'https://placehold.co/300x200?text=고기맛집',
			memberCount: 1578,
			placeCount: 56,
			likeCount: 4567,
			saveCount: 876,
			weeklyGrowth: 5,
			rank: 5,
			previousRank: 4,
			tags: ['고기', '구이', '바베큐', '회식'],
			isOfficial: false
		},
		{
			id: 'region-1',
			name: '서울 강남구 맛집',
			thumbnail: 'https://placehold.co/300x200?text=강남맛집',
			memberCount: 1420,
			placeCount: 88,
			likeCount: 3245,
			saveCount: 765,
			weeklyGrowth: 12,
			rank: 6,
			previousRank: 6,
			tags: ['서울', '강남', '논현', '역삼'],
			isOfficial: true
		},
		{
			id: 'region-2',
			name: '서울 마포구 맛집',
			thumbnail: 'https://placehold.co/300x200?text=마포맛집',
			memberCount: 1240,
			placeCount: 76,
			likeCount: 2987,
			saveCount: 654,
			weeklyGrowth: 10,
			rank: 7,
			previousRank: 7,
			tags: ['서울', '마포', '홍대', '합정'],
			isOfficial: true
		},
		{
			id: 'group-6',
			name: '해산물 & 회 맛집',
			thumbnail: 'https://placehold.co/300x200?text=해산물맛집',
			memberCount: 862,
			placeCount: 38,
			likeCount: 1876,
			saveCount: 432,
			weeklyGrowth: 28,
			rank: 8,
			previousRank: 10,
			tags: ['해산물', '회', '씨푸드', '제철'],
			isOfficial: false
		},
		{
			id: 'group-7',
			name: '디저트 러버 클럽',
			thumbnail: 'https://placehold.co/300x200?text=디저트',
			memberCount: 1105,
			placeCount: 49,
			likeCount: 2345,
			saveCount: 543,
			weeklyGrowth: -5,
			rank: 9,
			previousRank: 5,
			tags: ['디저트', '달콤', '케이크', '마카롱'],
			isOfficial: false
		},
		{
			id: 'group-8',
			name: '혼밥 맛집 컬렉션',
			thumbnail: 'https://placehold.co/300x200?text=혼밥맛집',
			memberCount: 1832,
			placeCount: 74,
			likeCount: 3456,
			saveCount: 765,
			weeklyGrowth: -2,
			rank: 10,
			previousRank: 9,
			tags: ['혼밥', '1인분', '편안함', '가성비'],
			isOfficial: false
		}
	];
	
	const monthlyRankings: GroupRanking[] = [
		{
			id: 'group-3',
			name: '가성비 끝판왕 맛집',
			thumbnail: 'https://placehold.co/300x200?text=가성비맛집',
			memberCount: 2356,
			placeCount: 89,
			likeCount: 7890,
			saveCount: 1234,
			weeklyGrowth: 32,
			rank: 1,
			previousRank: 2,
			tags: ['가성비', '든든', '저렴', '대학가'],
			isOfficial: false
		},
		{
			id: 'group-1',
			name: '서울 맛집 탐험대',
			thumbnail: 'https://placehold.co/300x200?text=서울맛집',
			memberCount: 1245,
			placeCount: 67,
			likeCount: 5678,
			saveCount: 987,
			weeklyGrowth: 18,
			rank: 2,
			previousRank: 1,
			tags: ['서울', '맛집', '데이트', '혼밥'],
			isOfficial: false
		},
		// ... 나머지 몇 개만 순서 변경
		{
			id: 'group-8',
			name: '혼밥 맛집 컬렉션',
			thumbnail: 'https://placehold.co/300x200?text=혼밥맛집',
			memberCount: 1832,
			placeCount: 74,
			likeCount: 3456,
			saveCount: 765,
			weeklyGrowth: 25,
			rank: 3,
			previousRank: 7,
			tags: ['혼밥', '1인분', '편안함', '가성비'],
			isOfficial: false
		}
	];
	
	// 필터링된 랭킹 목록
	let filteredRankings = $state<GroupRanking[]>([]);
	
	// 랭킹 데이터 로드
	function loadRankings() {
		loading = true;
		
		// 실제 구현에서는 API 호출
		setTimeout(() => {
			rankings = period === 'weekly' ? weeklyRankings : monthlyRankings;
			filterRankings();
			loading = false;
		}, 500);
	}
	
	// 랭킹 필터링
	function filterRankings() {
		if (category === 'growth') {
			filteredRankings = [...rankings].sort((a, b) => b.weeklyGrowth - a.weeklyGrowth);
		} else if (category === 'activity') {
			filteredRankings = [...rankings].sort((a, b) => (b.likeCount + b.saveCount) - (a.likeCount + a.saveCount));
		} else {
			filteredRankings = rankings;
		}
	}
	
	// 기간 변경
	function changePeriod(newPeriod: 'weekly' | 'monthly') {
		period = newPeriod;
		loadRankings();
	}
	
	// 카테고리 변경
	function changeCategory(newCategory: 'all' | 'activity' | 'growth') {
		category = newCategory;
		filterRankings();
	}
	
	// 랭킹 변화 아이콘 및 클래스
	function getRankChangeIcon(current: number, previous: number): { icon: string, class: string } {
		if (current < previous) {
			return {
				icon: '↑',
				class: 'text-green-500'
			};
		} else if (current > previous) {
			return {
				icon: '↓',
				class: 'text-red-500'
			};
		} else {
			return {
				icon: '-',
				class: 'text-gray-500'
			};
		}
	}
	
	// 숫자 포맷팅
	function formatNumber(num: number): string {
		return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
	}
	
	// 컴포넌트 초기화
	onMount(() => {
		loadRankings();
	});
</script>

<div class="p-4">
	<!-- 헤더 -->
	<div class="mb-6">
		<h2 class="text-xl font-bold text-gray-900">그룹 랭킹</h2>
		<p class="text-sm text-gray-600 mt-1">인기 있는 그룹들을 확인하고 참여해보세요!</p>
	</div>
	
	<!-- 필터 옵션 -->
	<div class="flex flex-wrap gap-3 mb-6">
		<div class="bg-white rounded-lg overflow-hidden border border-gray-200 shadow-sm">
			<div class="flex text-sm">
				<button 
					class="px-4 py-2 font-medium transition-colors {period === 'weekly' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'}"
					on:click={() => changePeriod('weekly')}
				>
					주간 랭킹
				</button>
				<button 
					class="px-4 py-2 font-medium transition-colors {period === 'monthly' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'}"
					on:click={() => changePeriod('monthly')}
				>
					월간 랭킹
				</button>
			</div>
		</div>
		
		<div class="bg-white rounded-lg overflow-hidden border border-gray-200 shadow-sm">
			<div class="flex text-sm">
				<button 
					class="px-4 py-2 font-medium transition-colors {category === 'all' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'}"
					on:click={() => changeCategory('all')}
				>
					종합
				</button>
				<button 
					class="px-4 py-2 font-medium transition-colors {category === 'activity' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'}"
					on:click={() => changeCategory('activity')}
				>
					활동순
				</button>
				<button 
					class="px-4 py-2 font-medium transition-colors {category === 'growth' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'}"
					on:click={() => changeCategory('growth')}
				>
					성장순
				</button>
			</div>
		</div>
	</div>
	
	<!-- 랭킹 목록 -->
	{#if loading}
		<!-- <div class="flex justify-center items-center py-12">
			<div class="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-500"></div>
		</div> -->
		<Indicator text="그룹 랭킹을 불러오는 중..." />
	{:else if filteredRankings.length === 0}
		<div class="text-center py-12 bg-white rounded-lg border border-gray-200">
			<svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 mx-auto text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
			</svg>
			<h3 class="text-gray-500 font-medium mb-2">랭킹 정보가 없습니다</h3>
			<p class="text-gray-400 text-sm">잠시 후 다시 시도해주세요.</p>
		</div>
	{:else}
		<div class="space-y-4">
			{#each filteredRankings as group, index}
				{#if index < 3}
					<!-- 상위 3개 그룹: 큰 카드 표시 -->
					<div class="bg-white rounded-lg overflow-hidden border border-gray-200 shadow-sm relative">
						<!-- 랭킹 뱃지 -->
						<div class="absolute top-3 left-3 w-8 h-8 rounded-full flex items-center justify-center {index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-300' : 'bg-amber-600'} text-white font-bold shadow-md">
							{group.rank}
						</div>
						
						<!-- 순위 변동 배지 -->
						{#if group.rank !== group.previousRank}
							<div class="absolute top-3 right-3">
								{#if group.rank < group.previousRank}
									<span class="bg-green-100 text-green-600 text-xs px-2 py-1 rounded-full font-medium flex items-center gap-0.5">
										<svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
											<path fill-rule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clip-rule="evenodd" />
										</svg>
										{Math.abs(group.rank - group.previousRank)}
									</span>
								{:else}
									<span class="bg-red-100 text-red-600 text-xs px-2 py-1 rounded-full font-medium flex items-center gap-0.5">
										<svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
											<path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
										</svg>
										{Math.abs(group.rank - group.previousRank)}
									</span>
								{/if}
							</div>
						{/if}
						
						<div class="flex flex-col sm:flex-row">
							<!-- 썸네일 -->
							<div class="w-full sm:w-1/3 h-40 sm:h-auto overflow-hidden">
								<img src={group.thumbnail} alt={group.name} class="w-full h-full object-cover" />
							</div>
							
							<!-- 그룹 정보 -->
							<div class="p-4 flex-1">
								<!-- 그룹명 -->
								<div class="flex items-center gap-2 mb-2">
									<h3 class="font-bold text-lg text-gray-900">{group.name}</h3>
									{#if group.isOfficial}
										<span class="bg-blue-100 text-blue-600 text-xs px-2 py-0.5 rounded-full">공식</span>
									{/if}
								</div>
								
								<!-- 태그 -->
								<div class="flex flex-wrap gap-2 mb-3">
									{#each group.tags.slice(0, 4) as tag}
										<span class="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">#{tag}</span>
									{/each}
								</div>
								
								<!-- 통계 -->
								<div class="grid grid-cols-2 gap-3 mb-4">
									<div class="flex flex-col">
										<span class="text-xs text-gray-500">멤버</span>
										<span class="font-medium text-gray-800">{formatNumber(group.memberCount)}명</span>
									</div>
									<div class="flex flex-col">
										<span class="text-xs text-gray-500">음식점</span>
										<span class="font-medium text-gray-800">{formatNumber(group.placeCount)}개</span>
									</div>
									<div class="flex flex-col">
										<span class="text-xs text-gray-500">좋아요</span>
										<span class="font-medium text-gray-800">{formatNumber(group.likeCount)}</span>
									</div>
									<div class="flex flex-col">
										<span class="text-xs text-gray-500">저장</span>
										<span class="font-medium text-gray-800">{formatNumber(group.saveCount)}</span>
									</div>
								</div>
								
								<!-- 참여 버튼 -->
								<button 
									class="w-full py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors text-sm font-medium"
								>
									참여하기
								</button>
							</div>
						</div>
					</div>
				{:else}
					<!-- 나머지 그룹: 리스트 형태로 표시 -->
					<div class="bg-white rounded-lg overflow-hidden border border-gray-200 shadow-sm">
						<div class="flex items-center p-3">
							<!-- 랭킹 -->
							<div class="w-8 h-8 rounded-full flex items-center justify-center bg-gray-100 text-gray-700 font-medium mr-3">
								{group.rank}
							</div>
							
							<!-- 썸네일 -->
							<div class="w-12 h-12 rounded-md overflow-hidden mr-3">
								<img src={group.thumbnail} alt={group.name} class="w-full h-full object-cover" />
							</div>
							
							<!-- 그룹 정보 -->
							<div class="flex-1">
								<div class="flex items-center gap-2">
									<h3 class="font-medium text-gray-900">{group.name}</h3>
									{#if group.isOfficial}
										<span class="bg-blue-100 text-blue-600 text-xs px-1.5 py-0.5 rounded-full">공식</span>
									{/if}
								</div>
								<div class="text-xs text-gray-500 mt-0.5">
									멤버 {formatNumber(group.memberCount)}명 · 음식점 {formatNumber(group.placeCount)}개
								</div>
							</div>
							
							<!-- 순위 변동 -->
							<div class="mr-3 flex items-center gap-1">
								{@const rankChange = getRankChangeIcon(group.rank, group.previousRank)}
								<span class={`text-sm font-medium ${rankChange.class}`}>{rankChange.icon}</span>
								{#if group.rank !== group.previousRank}
									<span class="text-xs text-gray-500">{Math.abs(group.rank - group.previousRank)}</span>
								{/if}
							</div>
							
							<!-- 참여 버튼 -->
							<button 
								class="px-3 py-1.5 rounded-md bg-blue-50 text-blue-600 text-sm font-medium hover:bg-blue-100 transition-colors"
							>
								참여
							</button>
						</div>
					</div>
				{/if}
			{/each}
		</div>
	{/if}
	
	<!-- 업데이트 정보 -->
	<div class="mt-6 text-center text-xs text-gray-500">
		{period === 'weekly' ? '주간' : '월간'} 랭킹 • 매주 월요일 업데이트
	</div>
</div> 