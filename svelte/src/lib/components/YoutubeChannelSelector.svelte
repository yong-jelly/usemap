<script lang="ts">
	import BottomSheet from '$lib/BottomSheet';
	import { supabase } from '$lib/supabase';
	import { onMount } from 'svelte';

	// 유튜브 채널 타입 정의
	interface YoutubeChannel {
		id: string;
		name: string;
		count: number;
	}

	// 선택된 채널 ID 배열
	let selectedChannels = $state<string[]>([]);
	let isAllSelected = $state(true); // 기본값은 전체 선택

	// 유튜브 채널 목록
	let channels = $state<YoutubeChannel[]>([]);
	let isChannelsLoading = $state(false);
	let channelsError = $state<string | null>(null);

	// 외부에서 전달받는 props
	const {
		onChannelSelect = (channelIds: string[]) => {},
		initialChannels = [],
		isOpen = false,
		onOpen = () => {},
		onClose = () => {},
		onSheetDragStart = () => {},
		onSheetDragEnd = () => {},
	} = $props<{
		onChannelSelect?: (channelIds: string[]) => void;
		initialChannels?: string[];
		isOpen?: boolean;
		onOpen?: () => void;
		onClose?: () => void;
		onSheetDragStart?: () => void;
		onSheetDragEnd?: () => void;
	}>();

	// 바텀시트 상태
	let isSheetOpen = $state(isOpen);

	// isOpen prop 변경 감지
	$effect(() => {
		isSheetOpen = isOpen;
		if (isOpen && channels.length === 0) {
			fetchYoutubeChannels();
		}
	});

	// 초기 채널 설정
	onMount(() => {
		selectedChannels = initialChannels;
		isAllSelected = initialChannels.length === 0;
	});

	// 유튜브 채널 목록 조회
	async function fetchYoutubeChannels() {
		isChannelsLoading = true;
		channelsError = null;

		try {
			const { data, error } = await supabase.rpc('v1_get_youtube_channels');

			if (error) {
				channelsError = '채널 목록을 불러오는데 실패했습니다.';
				console.error('유튜브 채널 조회 실패:', error);
			} else {
				channels = data || [];
			}
		} catch (error) {
			channelsError = '채널 목록을 불러오는데 실패했습니다.';
			console.error('유튜브 채널 조회 오류:', error);
		} finally {
			isChannelsLoading = false;
		}
	}

	// 전체 선택 핸들러
	function handleAllSelect() {
		isAllSelected = true;
		selectedChannels = []; // 기존 선택된 항목들 해제
	}

	// 개별 채널 선택 핸들러
	function handleChannelSelect(channelId: string) {
		// 전체 선택 해제
		isAllSelected = false;

		// 이미 선택된 채널이면 선택 해제
		if (selectedChannels.includes(channelId)) {
			selectedChannels = selectedChannels.filter((id) => id !== channelId);
		} else {
			// 선택되지 않은 채널이면 선택 추가
			selectedChannels = [...selectedChannels, channelId];
		}
	}

	// 전체 초기화 핸들러
	function handleReset() {
		isAllSelected = true;
		selectedChannels = [];
	}

	// 적용 핸들러
	function handleApply() {
		// 전체 선택이거나 아무것도 선택되지 않은 경우 빈 배열 전달
		const channelsToApply = isAllSelected ? [] : selectedChannels;
		onChannelSelect(channelsToApply);
		isSheetOpen = false;
	}

	// 적용 버튼 활성화 여부
	let isApplyEnabled = $derived(isAllSelected || selectedChannels.length > 0);

	// 선택된 채널 수 표시용
	let selectedCount = $derived(isAllSelected ? 0 : selectedChannels.length);
</script>

<div class="youtube-channel-selector">
	<!-- BottomSheet 채널 선택기 -->
	<BottomSheet
		bind:isSheetOpen
		settings={{
			maxHeight: 0.9,
			snapPoints: [0.6, 0.9],
			startingSnapPoint: 0.9,
		}}
		onopen={onOpen}
		onclose={onClose}
		onsheetdragstart={onSheetDragStart}
		onsheetdragend={onSheetDragEnd}
	>
		<BottomSheet.Overlay>
			<BottomSheet.Sheet
				style="max-width: 600px; margin: 0 auto; height: 100%; display: flex; flex-direction: column; min-height: 0;"
			>
				<BottomSheet.Handle>
					<BottomSheet.Grip />
					<div class="border-b border-gray-200 px-4 py-3 dark:border-neutral-700">
						<h3 class="text-center text-lg font-medium">유튜브 채널 선택</h3>
						<p class="mt-1 text-center text-sm text-gray-500 dark:text-gray-400">
							원하는 채널을 선택해주세요 (다중 선택 가능)
						</p>
					</div>
				</BottomSheet.Handle>
				<BottomSheet.Content
					style="flex: 1 1 0; display: flex; flex-direction: column; min-height: 0;"
				>
					<!-- <div class="p-0 pb-20"> -->
					<div class="flex min-h-0 flex-1 flex-col gap-2 md:flex-row">
						<div
							class="min-w-0 flex-1 overflow-y-auto border-b border-gray-100 p-2 md:border-r md:border-b-0 dark:border-neutral-800"
						>
							{#if isChannelsLoading}
								<div class="flex items-center justify-center py-8">
									<div class="h-8 w-8 animate-spin rounded-full border-b-2 border-indigo-500"></div>
								</div>
							{:else if channelsError}
								<div class="py-8 text-center">
									<p class="text-red-500 dark:text-red-400">{channelsError}</p>
									<button
										class="mt-2 px-4 py-2 text-sm text-indigo-600 hover:text-indigo-800"
										onclick={fetchYoutubeChannels}
									>
										다시 시도
									</button>
								</div>
							{:else}
								<div class="space-y-3">
									<!-- 전체 선택 버튼 (전체 너비) -->
									<button
										class="channel-item flex w-full items-center rounded-lg border p-3 transition-all"
										class:selected={isAllSelected}
										onclick={handleAllSelect}
									>
										<div class="flex-1 text-left">
											<div class="font-bold text-indigo-600 dark:text-indigo-400">전체</div>
											<div class="mt-1 text-xs text-gray-500 dark:text-gray-400">
												모든 채널 포함
											</div>
										</div>
										{#if isAllSelected}
											<div
												class="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-500 text-white"
											>
												<svg
													xmlns="http://www.w3.org/2000/svg"
													class="h-4 w-4"
													viewBox="0 0 24 24"
													fill="none"
													stroke="currentColor"
													stroke-width="2"
													stroke-linecap="round"
													stroke-linejoin="round"
												>
													<path d="M20 6 9 17l-5-5" />
												</svg>
											</div>
										{/if}
									</button>

									<!-- 개별 채널 목록 (2단 그리드) -->
									<div class="grid grid-cols-2 gap-2">
										{#each channels as channel}
											<button
												class="channel-item flex min-h-[80px] w-full flex-col items-start rounded-lg border p-3 transition-all"
												class:selected={selectedChannels.includes(channel.id)}
												onclick={(e) => {
													e.stopPropagation();
													handleChannelSelect(channel.id);
												}}
											>
												<div class="w-full flex-1 text-left">
													<div class="truncate pr-1 text-sm font-medium" title={channel.name}>
														{channel.name}
													</div>
													<div class="mt-1 text-xs text-gray-500 dark:text-gray-400">
														콘텐츠 {channel.count}개
													</div>
												</div>
												{#if selectedChannels.includes(channel.id)}
													<div
														class="mt-1 flex h-5 w-5 items-center justify-center self-end rounded-full bg-indigo-500 text-white"
													>
														<svg
															xmlns="http://www.w3.org/2000/svg"
															class="h-3 w-3"
															viewBox="0 0 24 24"
															fill="none"
															stroke="currentColor"
															stroke-width="2"
															stroke-linecap="round"
															stroke-linejoin="round"
														>
															<path d="M20 6 9 17l-5-5" />
														</svg>
													</div>
												{/if}
											</button>
										{/each}
									</div>
								</div>
							{/if}
						</div>
					</div>

					<!-- 하단 고정 버튼들 -->
					<div class="flex flex-col gap-2 pt-2 pb-0">
						<div class="flex gap-2">
							<button
								class="flex-1 rounded-lg border border-gray-300 py-2.5 text-sm font-medium text-gray-700 transition-colors active:bg-gray-100 dark:border-neutral-700 dark:text-gray-200 dark:active:bg-neutral-800"
								onclick={(e) => {
									e.stopPropagation();
									handleReset();
								}}
							>
								전체
							</button>
							<button
								class="flex-1 rounded-lg bg-indigo-600 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700 active:bg-indigo-800 disabled:cursor-not-allowed disabled:opacity-50"
								disabled={!isApplyEnabled}
								onclick={(e) => {
									e.stopPropagation();
									handleApply();
								}}
							>
								적용{selectedCount > 0 ? ` (${selectedCount})` : ''}
							</button>
						</div>
					</div>
				</BottomSheet.Content>
			</BottomSheet.Sheet>
		</BottomSheet.Overlay>
	</BottomSheet>
</div>

<style>
	.min-h-0 {
		min-height: 0 !important;
	}
	.channel-item {
		border-color: #e5e7eb;
		background-color: white;
	}

	.channel-item.selected {
		border-color: #6366f1;
		background-color: #eef2ff;
	}

	:global(.dark) .channel-item {
		border-color: #404040;
		background-color: #262626;
	}

	:global(.dark) .channel-item.selected {
		border-color: #6366f1;
		background-color: rgba(99, 102, 241, 0.1);
	}
</style>
