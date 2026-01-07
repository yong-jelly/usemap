<!-- @migration-task Error while migrating Svelte code: Cannot use `export let` in runes mode — use `$props()` instead
https://svelte.dev/e/legacy_export_invalid -->
<!-- @migration-task Error while migrating Svelte code: Cannot use `export let` in runes mode — use `$props()` instead
https://svelte.dev/e/legacy_export_invalid -->
<!-- @migration-task Error while migrating Svelte code: Cannot use `export let` in runes mode — use `$props()` instead
https://svelte.dev/e/legacy_export_invalid -->
<!-- @migration-task Error while migrating Svelte code: Cannot use `export let` in runes mode — use `$props()` instead
https://svelte.dev/e/legacy_export_invalid -->
<!-- @migration-task Error while migrating Svelte code: Cannot use `export let` in runes mode — use `$props()` instead
https://svelte.dev/e/legacy_export_invalid -->
<!-- @migration-task Error while migrating Svelte code: Cannot use `export let` in runes mode — use `$props()` instead
https://svelte.dev/e/legacy_export_invalid -->
<!-- @migration-task Error while migrating Svelte code: Cannot use `export let` in runes mode — use `$props()` instead
https://svelte.dev/e/legacy_export_invalid -->
<!-- @migration-task Error while migrating Svelte code: Cannot use `export let` in runes mode — use `$props()` instead
https://svelte.dev/e/legacy_export_invalid -->
<!-- @migration-task Error while migrating Svelte code: Cannot use `export let` in runes mode — use `$props()` instead
https://svelte.dev/e/legacy_export_invalid -->
<!-- @migration-task Error while migrating Svelte code: Cannot use `export let` in runes mode — use `$props()` instead
https://svelte.dev/e/legacy_export_invalid -->
<script lang="ts">
	import Indicator from '$lib/components/Indicator.svelte';
	import { onMount } from 'svelte';
	
	// 그룹 ID
	export let groupId: string;
	
	// 챌린지 타입 정의
	interface Challenge {
		id: string;
		title: string;
		description: string;
		thumbnail: string;
		startDate: string;
		endDate: string;
		category: string;
		participantCount: number;
		isActive: boolean;
		progress: number;
		reward: {
			type: 'point' | 'badge';
			amount: number;
			name: string;
		};
		isParticipating: boolean;
		places: {
			id: string;
			name: string;
			completed: boolean;
		}[];
	}
	
	// 상태
	let challenges = $state<Challenge[]>([]);
	let loading = $state(true);
	let activeTab = $state<'all' | 'participating' | 'completed'>('all');
	
	// 더미 데이터
	const dummyChallenges: Challenge[] = [
		{
			id: 'challenge-1',
			title: '이번 주 신상 맛집 3곳 방문하기',
			description: '새로 오픈한 맛집을 방문하고 인증하면 포인트를 드립니다! 기간 내 3곳을 모두 방문하면 보너스 포인트 지급!',
			thumbnail: 'https://placehold.co/600x400?text=신상맛집',
			startDate: '2023-06-01',
			endDate: '2023-06-30',
			category: 'visit',
			participantCount: 156,
			isActive: true,
			progress: 67,
			reward: {
				type: 'point',
				amount: 500,
				name: '포인트'
			},
			isParticipating: true,
			places: [
				{ id: 'place-1', name: '고기야 미안해', completed: true },
				{ id: 'place-2', name: '바다의 황제', completed: false },
				{ id: 'place-3', name: '커피가 필요해', completed: false }
			]
		},
		{
			id: 'challenge-2',
			title: '홍대 카페 5곳 컬렉션 완성하기',
			description: '홍대 지역의 인기 카페 5곳을 모두 저장해 컬렉션을 완성하세요. 나만의 카페 지도를 만들어보세요!',
			thumbnail: 'https://placehold.co/600x400?text=홍대카페',
			startDate: '2023-06-15',
			endDate: '2023-07-15',
			category: 'collection',
			participantCount: 89,
			isActive: true,
			progress: 40,
			reward: {
				type: 'badge',
				amount: 1,
				name: '카페 탐험가 배지'
			},
			isParticipating: false,
			places: [
				{ id: 'place-4', name: '커피 천국', completed: false },
				{ id: 'place-5', name: '디저트 파라다이스', completed: false },
				{ id: 'place-6', name: '인스타 핫플', completed: false },
				{ id: 'place-7', name: '아트 카페', completed: false },
				{ id: 'place-8', name: '로스팅 연구소', completed: false }
			]
		},
		{
			id: 'challenge-3',
			title: '여름 보양식 맛집 리뷰 작성하기',
			description: '무더운 여름을 이겨내는 보양식 맛집을 방문하고 리뷰를 작성하세요. 최소 300자 이상의 리뷰가 필요합니다.',
			thumbnail: 'https://placehold.co/600x400?text=보양식',
			startDate: '2023-07-01',
			endDate: '2023-08-31',
			category: 'review',
			participantCount: 64,
			isActive: true,
			progress: 20,
			reward: {
				type: 'point',
				amount: 1000,
				name: '포인트'
			},
			isParticipating: true,
			places: [
				{ id: 'place-9', name: '장어의 신', completed: false },
				{ id: 'place-10', name: '삼계탕 명가', completed: false },
				{ id: 'place-11', name: '해신탕 전문점', completed: false }
			]
		},
		{
			id: 'challenge-4',
			title: '분위기 좋은 데이트 코스 3곳 공유하기',
			description: '연인과 함께 가기 좋은 데이트 코스를 발견하고 그룹에 공유해보세요. 사진과 함께 공유하면 보너스 포인트!',
			thumbnail: 'https://placehold.co/600x400?text=데이트코스',
			startDate: '2023-05-15',
			endDate: '2023-06-15',
			category: 'share',
			participantCount: 132,
			isActive: false,
			progress: 100,
			reward: {
				type: 'badge',
				amount: 1,
				name: '로맨틱 마스터 배지'
			},
			isParticipating: true,
			places: [
				{ id: 'place-12', name: '강변 레스토랑', completed: true },
				{ id: 'place-13', name: '루프탑 바', completed: true },
				{ id: 'place-14', name: '디저트 카페', completed: true }
			]
		}
	];
	
	// 필터링된 챌린지 목록
	let filteredChallenges = $state<Challenge[]>([]);
	
	// 챌린지 데이터 로드
	function loadChallenges() {
		loading = true;
		
		// 실제 구현에서는 API 호출
		setTimeout(() => {
			challenges = dummyChallenges;
			filterChallenges();
			loading = false;
		}, 500);
	}
	
	// 챌린지 필터링
	function filterChallenges() {
		if (activeTab === 'participating') {
			filteredChallenges = challenges.filter(c => c.isParticipating && c.isActive);
		} else if (activeTab === 'completed') {
			filteredChallenges = challenges.filter(c => c.isParticipating && !c.isActive);
		} else {
			filteredChallenges = challenges.filter(c => c.isActive);
		}
	}
	
	// 탭 변경
	function changeTab(tab: 'all' | 'participating' | 'completed') {
		activeTab = tab;
		filterChallenges();
	}
	
	// 챌린지 참여 토글
	function toggleParticipation(challengeId: string) {
		challenges = challenges.map(challenge => {
			if (challenge.id === challengeId) {
				const newIsParticipating = !challenge.isParticipating;
				return {
					...challenge,
					isParticipating: newIsParticipating,
					participantCount: challenge.participantCount + (newIsParticipating ? 1 : -1)
				};
			}
			return challenge;
		});
		
		filterChallenges();
	}
	
	// 장소 완료 토글
	function togglePlaceCompletion(challengeId: string, placeId: string) {
		challenges = challenges.map(challenge => {
			if (challenge.id === challengeId) {
				const updatedPlaces = challenge.places.map(place => {
					if (place.id === placeId) {
						return { ...place, completed: !place.completed };
					}
					return place;
				});
				
				// 완료된 장소 수 계산
				const completedCount = updatedPlaces.filter(p => p.completed).length;
				const totalCount = updatedPlaces.length;
				
				// 진행률 업데이트
				const newProgress = Math.round((completedCount / totalCount) * 100);
				
				return {
					...challenge,
					places: updatedPlaces,
					progress: newProgress,
				};
			}
			return challenge;
		});
		
		filterChallenges();
	}
	
	// 날짜 포맷팅
	function formatDate(dateString: string): string {
		const date = new Date(dateString);
		return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
	}
	
	// 남은 기간 계산
	function getRemainingDays(endDateString: string): number {
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		
		const endDate = new Date(endDateString);
		endDate.setHours(0, 0, 0, 0);
		
		const diffTime = endDate.getTime() - today.getTime();
		return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
	}
	
	// 숫자 포맷팅
	function formatNumber(num: number): string {
		return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
	}
	
	// 컴포넌트 초기화
	onMount(() => {
		loadChallenges();
	});
</script>

<div class="p-4">
	<!-- 헤더 -->
	<div class="mb-6">
		<h2 class="text-xl font-bold text-gray-900">챌린지</h2>
		<p class="text-sm text-gray-600 mt-1">맛집을 방문하고 미션을 완료하여 보상을 받으세요!</p>
	</div>
	
	<!-- 탭 메뉴 -->
	<div class="flex border-b border-gray-200 mb-6">
		<button 
			class="px-4 py-2 text-sm font-medium transition-colors {activeTab === 'all' ? 'text-blue-600 border-b-2 border-blue-500' : 'text-gray-600 hover:text-gray-800'}"
			on:click={() => changeTab('all')}
		>
			진행 중
		</button>
		<button 
			class="px-4 py-2 text-sm font-medium transition-colors {activeTab === 'participating' ? 'text-blue-600 border-b-2 border-blue-500' : 'text-gray-600 hover:text-gray-800'}"
			on:click={() => changeTab('participating')}
		>
			참여 중
		</button>
		<button 
			class="px-4 py-2 text-sm font-medium transition-colors {activeTab === 'completed' ? 'text-blue-600 border-b-2 border-blue-500' : 'text-gray-600 hover:text-gray-800'}"
			on:click={() => changeTab('completed')}
		>
			완료됨
		</button>
	</div>
	
	<!-- 챌린지 목록 -->
	{#if loading}
		<!-- <div class="flex justify-center items-center py-12">
			<div class="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-500"></div>
		</div> -->
		<Indicator text="챌린지를 불러오는 중..." />
	{:else if filteredChallenges.length === 0}
		<div class="text-center py-12 bg-white rounded-lg border border-gray-200">
			<svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 mx-auto text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
			</svg>
			{#if activeTab === 'participating'}
				<h3 class="text-gray-500 font-medium mb-2">참여 중인 챌린지가 없습니다</h3>
				<p class="text-gray-400 text-sm">진행 중인 챌린지에 참여해보세요!</p>
			{:else if activeTab === 'completed'}
				<h3 class="text-gray-500 font-medium mb-2">완료한 챌린지가 없습니다</h3>
				<p class="text-gray-400 text-sm">챌린지에 참여하여 보상을 받아보세요!</p>
			{:else}
				<h3 class="text-gray-500 font-medium mb-2">진행 중인 챌린지가 없습니다</h3>
				<p class="text-gray-400 text-sm">곧 새로운 챌린지가 시작될 예정입니다.</p>
			{/if}
		</div>
	{:else}
		<div class="space-y-6">
			{#each filteredChallenges as challenge}
				<div class="bg-white rounded-lg overflow-hidden border border-gray-200 shadow-sm">
					<!-- 챌린지 헤더 -->
					<div class="relative h-40 overflow-hidden">
						<img src={challenge.thumbnail} alt={challenge.title} class="w-full h-full object-cover" />
						<div class="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
						
						<!-- 카테고리 배지 -->
						<div class="absolute top-3 left-3">
							{#if challenge.category === 'visit'}
								<span class="bg-green-500 text-white text-xs px-2 py-1 rounded-full font-medium">방문 인증</span>
							{:else if challenge.category === 'collection'}
								<span class="bg-purple-500 text-white text-xs px-2 py-1 rounded-full font-medium">컬렉션</span>
							{:else if challenge.category === 'review'}
								<span class="bg-blue-500 text-white text-xs px-2 py-1 rounded-full font-medium">리뷰 작성</span>
							{:else}
								<span class="bg-orange-500 text-white text-xs px-2 py-1 rounded-full font-medium">정보 공유</span>
							{/if}
						</div>
						
						<!-- 참여 현황 -->
						<div class="absolute bottom-3 left-3 right-3 flex justify-between items-center">
							<div class="text-sm text-white font-medium">{challenge.title}</div>
							<div class="text-xs text-white">참여자 {formatNumber(challenge.participantCount)}명</div>
						</div>
					</div>
					
					<!-- 챌린지 정보 -->
					<div class="p-4">
						<p class="text-sm text-gray-600 mb-3">{challenge.description}</p>
						
						<!-- 기간 정보 -->
						<div class="flex justify-between items-center text-xs text-gray-500 mb-3">
							<div>기간: {formatDate(challenge.startDate)} ~ {formatDate(challenge.endDate)}</div>
							{#if challenge.isActive}
								<div class="text-blue-600 font-medium">
									{getRemainingDays(challenge.endDate)}일 남음
								</div>
							{:else}
								<div class="text-gray-500">종료됨</div>
							{/if}
						</div>
						
						<!-- 보상 정보 -->
						<div class="flex items-center gap-2 bg-yellow-50 p-2 rounded-md mb-4">
							<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
							</svg>
							<span class="text-sm text-yellow-700">
								보상: 
								{#if challenge.reward.type === 'point'}
									<span class="font-medium">{formatNumber(challenge.reward.amount)} {challenge.reward.name}</span>
								{:else}
									<span class="font-medium">{challenge.reward.name}</span>
								{/if}
							</span>
						</div>
						
						<!-- 진행률 -->
						{#if challenge.isParticipating}
							<div class="mb-4">
								<div class="flex justify-between items-center mb-1">
									<span class="text-xs text-gray-600">진행률</span>
									<span class="text-xs font-medium {challenge.progress === 100 ? 'text-green-600' : 'text-blue-600'}">{challenge.progress}%</span>
								</div>
								<div class="h-2 bg-gray-100 rounded-full overflow-hidden">
									<div 
										class="h-full {challenge.progress === 100 ? 'bg-green-500' : 'bg-blue-500'}" 
										style="width: {challenge.progress}%"
									></div>
								</div>
							</div>
							
							<!-- 미션 목록 -->
							<div class="mb-4">
								<h4 class="text-sm font-medium text-gray-700 mb-2">미션 목록</h4>
								<div class="space-y-2">
									{#each challenge.places as place}
										<div 
											class="flex items-center justify-between p-2 rounded-md border {place.completed ? 'bg-green-50 border-green-100' : 'bg-white border-gray-200'}"
										>
											<div class="flex items-center">
												<div class="h-5 w-5 mr-2">
													{#if place.completed}
														<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
															<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
														</svg>
													{:else}
														<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-300" viewBox="0 0 20 20" fill="currentColor">
															<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clip-rule="evenodd" />
														</svg>
													{/if}
												</div>
												<span class="text-sm {place.completed ? 'text-green-700 line-through' : 'text-gray-700'}">{place.name}</span>
											</div>
											{#if challenge.isActive && !place.completed}
												<button 
													class="text-xs text-blue-600 font-medium hover:text-blue-700"
													on:click={() => togglePlaceCompletion(challenge.id, place.id)}
												>
													완료하기
												</button>
											{/if}
										</div>
									{/each}
								</div>
							</div>
						{/if}
						
						<!-- 액션 버튼 -->
						{#if challenge.isActive}
							{#if challenge.isParticipating}
								<button 
									class="w-full py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors text-sm font-medium"
									on:click={() => toggleParticipation(challenge.id)}
								>
									참여 취소
								</button>
							{:else}
								<button 
									class="w-full py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors text-sm font-medium"
									on:click={() => toggleParticipation(challenge.id)}
								>
									참여하기
								</button>
							{/if}
						{:else}
							<div class="text-center py-2 bg-gray-100 text-gray-500 rounded-md text-sm">
								{challenge.isParticipating && challenge.progress === 100 ? '챌린지 완료! 보상 획득 성공' : '종료된 챌린지입니다'}
							</div>
						{/if}
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div> 