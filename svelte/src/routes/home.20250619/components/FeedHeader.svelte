<script lang="ts">
	import { Bell, Settings2, MapPin, TrendingUp } from 'lucide-svelte';
	import BottomSheet from '$lib/BottomSheet';

	interface FeedTab {
		id: string;
		label: string;
		icon?: any;
		badge?: number;
	}

	let activeTab = $state('all');
	let isNotificationOpen = $state(false);
	let isSettingsOpen = $state(false);
	let hasNewNotifications = $state(true);

	const { onTabChange } = $props<{
		onTabChange: (tabId: string) => void;
	}>();

	// 피드 탭 구성
	const tabs: FeedTab[] = [
		{ id: 'all', label: '전체' },
		{ id: 'recommended', label: '추천', badge: 3 },
		{ id: 'trending', label: '트렌딩' },
		{ id: 'stats', label: '통계' },
		{ id: 'challenges', label: '도전' },
	];

	function handleTabChange(tabId: string) {
		activeTab = tabId;
		onTabChange(tabId);
	}

	function openNotifications() {
		isNotificationOpen = true;
		hasNewNotifications = false;
	}

	function openSettings() {
		isSettingsOpen = true;
	}

	// 하드코딩된 사용자 데이터
	const userData = {
		name: '김맛집',
		level: 7,
		exp: 450,
		maxExp: 600,
		visitedPlaces: 23,
		location: '서울 강남구',
		streak: 5,
	};
</script>

<header class="sticky top-0 z-50 border-b border-gray-200 bg-white">
	<!-- 상단 바 -->
	<div class="flex items-center justify-between px-4 py-3">
		<div class="flex items-center gap-3">
			<h1 class="text-xl font-bold text-gray-900">피드</h1>
			<div class="flex items-center gap-1 text-xs text-gray-500">
				<MapPin class="h-3 w-3" />
				<span>{userData.location}</span>
			</div>
		</div>

		<div class="flex items-center gap-2">
			<!-- 알림 버튼 -->
			<button
				class="relative rounded-lg p-2 transition-colors hover:bg-gray-100"
				onclick={openNotifications}
			>
				<Bell class="h-5 w-5 text-gray-600" />
				{#if hasNewNotifications}
					<div class="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-red-500"></div>
				{/if}
			</button>

			<!-- 설정 버튼 -->
			<button class="rounded-lg p-2 transition-colors hover:bg-gray-100" onclick={openSettings}>
				<Settings2 class="h-5 w-5 text-gray-600" />
			</button>
		</div>
	</div>

	<!-- 사용자 상태 미니 위젯 -->
	<div class="px-4 pb-3">
		<div class="rounded-lg border border-blue-100 bg-gradient-to-r from-blue-50 to-purple-50 p-3">
			<div class="flex items-center justify-between">
				<div class="flex items-center gap-3">
					<div
						class="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-purple-500"
					>
						<span class="text-xs font-bold text-white">L{userData.level}</span>
					</div>
					<div>
						<p class="text-sm font-medium text-gray-900">안녕하세요, {userData.name}님!</p>
						<p class="text-xs text-gray-500">
							{userData.visitedPlaces}곳 방문 • {userData.streak}일 연속 활동
						</p>
					</div>
				</div>
				<div class="text-right">
					<div class="mb-1 flex items-center gap-1 text-xs text-gray-500">
						<TrendingUp class="h-3 w-3" />
						<span>레벨업까지</span>
					</div>
					<div class="h-1.5 w-16 overflow-hidden rounded-full bg-gray-200">
						<div
							class="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300"
							style="width: {(userData.exp / userData.maxExp) * 100}%"
						></div>
					</div>
				</div>
			</div>
		</div>
	</div>

	<!-- 탭 네비게이션 -->
	<div class="scrollbar-hide flex overflow-x-auto">
		{#each tabs as tab}
			<button
				class="relative flex-shrink-0 px-4 py-3 text-center font-medium transition-colors duration-200 hover:bg-gray-50
				{activeTab === tab.id ? 'text-gray-900' : 'text-gray-500 hover:text-gray-700'}"
				onclick={() => handleTabChange(tab.id)}
			>
				<div class="flex items-center gap-2">
					<span class="text-sm whitespace-nowrap">{tab.label}</span>
					{#if tab.badge}
						<span
							class="flex h-5 min-w-[1.2rem] items-center justify-center rounded-full bg-red-500 px-1.5 py-0.5 text-xs text-white"
						>
							{tab.badge}
						</span>
					{/if}
				</div>
				{#if activeTab === tab.id}
					<div
						class="absolute bottom-0 left-1/2 h-0.5 w-8 -translate-x-1/2 transform rounded-full bg-blue-500"
					></div>
				{/if}
			</button>
		{/each}
	</div>
</header>

<!-- 알림 BottomSheet -->
<BottomSheet
	bind:isSheetOpen={isNotificationOpen}
	settings={{ maxHeight: 0.8, snapPoints: [0.5, 0.8], startingSnapPoint: 0.5 }}
>
	<BottomSheet.Overlay>
		<BottomSheet.Sheet style="max-width: 600px; margin: 0 auto;">
			<BottomSheet.Handle>
				<BottomSheet.Grip />
				<div class="flex items-center justify-between border-b border-gray-100 px-4 py-3">
					<span class="text-lg font-semibold text-gray-900">알림</span>
					<button class="p-1" onclick={() => (isNotificationOpen = false)}>
						<svg
							class="h-6 w-6 text-gray-400"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M6 18L18 6M6 6l12 12"
							/>
						</svg>
					</button>
				</div>
			</BottomSheet.Handle>

			<BottomSheet.Content>
				<div class="space-y-4 p-4">
					<div class="flex items-start gap-3 rounded-lg bg-blue-50 p-3">
						<div class="mt-2 h-2 w-2 rounded-full bg-blue-500"></div>
						<div>
							<p class="text-sm font-medium text-gray-900">새로운 도전 과제가 있어요!</p>
							<p class="mt-1 text-xs text-gray-500">이번 주 5곳 이상 방문하기 (현재 3/5)</p>
							<p class="mt-1 text-xs text-gray-400">2시간 전</p>
						</div>
					</div>

					<div class="flex items-start gap-3 rounded-lg p-3 hover:bg-gray-50">
						<div class="mt-2 h-2 w-2 rounded-full bg-gray-300"></div>
						<div>
							<p class="text-sm font-medium text-gray-900">근처 맛집 추천</p>
							<p class="mt-1 text-xs text-gray-500">강남역 근처 새로운 맛집 3곳이 추가되었어요</p>
							<p class="mt-1 text-xs text-gray-400">5시간 전</p>
						</div>
					</div>

					<div class="flex items-start gap-3 rounded-lg p-3 hover:bg-gray-50">
						<div class="mt-2 h-2 w-2 rounded-full bg-gray-300"></div>
						<div>
							<p class="text-sm font-medium text-gray-900">레벨업 축하합니다!</p>
							<p class="mt-1 text-xs text-gray-500">레벨 7 달성으로 새로운 뱃지를 획득했어요</p>
							<p class="mt-1 text-xs text-gray-400">1일 전</p>
						</div>
					</div>
				</div>
			</BottomSheet.Content>
		</BottomSheet.Sheet>
	</BottomSheet.Overlay>
</BottomSheet>

<!-- 설정 BottomSheet -->
<BottomSheet
	bind:isSheetOpen={isSettingsOpen}
	settings={{ maxHeight: 0.8, snapPoints: [0.6, 0.8], startingSnapPoint: 0.6 }}
>
	<BottomSheet.Overlay>
		<BottomSheet.Sheet style="max-width: 600px; margin: 0 auto;">
			<BottomSheet.Handle>
				<BottomSheet.Grip />
				<div class="flex items-center justify-between border-b border-gray-100 px-4 py-3">
					<span class="text-lg font-semibold text-gray-900">피드 설정</span>
					<button class="p-1" onclick={() => (isSettingsOpen = false)}>
						<svg
							class="h-6 w-6 text-gray-400"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M6 18L18 6M6 6l12 12"
							/>
						</svg>
					</button>
				</div>
			</BottomSheet.Handle>

			<BottomSheet.Content>
				<div class="space-y-6 p-4">
					<div class="space-y-4">
						<h3 class="text-sm font-medium text-gray-700">피드 개인화</h3>
						<div class="space-y-3">
							<label class="flex items-center justify-between">
								<span class="text-sm text-gray-600">위치 기반 추천</span>
								<input type="checkbox" class="h-4 w-4 rounded text-blue-600" checked />
							</label>
							<label class="flex items-center justify-between">
								<span class="text-sm text-gray-600">유튜브 추천 표시</span>
								<input type="checkbox" class="h-4 w-4 rounded text-blue-600" checked />
							</label>
							<label class="flex items-center justify-between">
								<span class="text-sm text-gray-600">커뮤니티 글 표시</span>
								<input type="checkbox" class="h-4 w-4 rounded text-blue-600" checked />
							</label>
						</div>
					</div>

					<div class="space-y-4">
						<h3 class="text-sm font-medium text-gray-700">알림 설정</h3>
						<div class="space-y-3">
							<label class="flex items-center justify-between">
								<span class="text-sm text-gray-600">새로운 추천 알림</span>
								<input type="checkbox" class="h-4 w-4 rounded text-blue-600" checked />
							</label>
							<label class="flex items-center justify-between">
								<span class="text-sm text-gray-600">도전 과제 알림</span>
								<input type="checkbox" class="h-4 w-4 rounded text-blue-600" checked />
							</label>
						</div>
					</div>
				</div>
			</BottomSheet.Content>
		</BottomSheet.Sheet>
	</BottomSheet.Overlay>
</BottomSheet>

<style>
	.scrollbar-hide {
		-ms-overflow-style: none;
		scrollbar-width: none;
	}
	.scrollbar-hide::-webkit-scrollbar {
		display: none;
	}
</style>
