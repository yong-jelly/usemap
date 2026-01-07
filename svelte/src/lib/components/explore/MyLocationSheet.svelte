<script lang="ts">
	import BottomSheet from '$lib/BottomSheet';
	import Indicator from '$lib/components/Indicator.svelte';
	import { MapPin, X } from 'lucide-svelte';
	import type { MyLocationModel } from '$services/types';

	const {
		isOpen = false,
		location = null,
		loading = false,
		error = null,
		requestMyLocation = () => {},
		onApply = (region: {
			group1: string | null;
			group2: string | null;
			group3: string | null;
			address: string;
		}) => {},
		onOpen = () => {},
		onClose = () => {},
		onSheetDragStart = () => {},
		onSheetDragEnd = () => {},
	} = $props<{
		isOpen?: boolean;
		location?: MyLocationModel | null;
		loading?: boolean;
		error?: string | null;
		requestMyLocation?: () => void;
		onApply?: (region: {
			group1: string | null;
			group2: string | null;
			group3: string | null;
			address: string;
		}) => void;
		onOpen?: () => void;
		onClose?: () => void;
		onSheetDragStart?: () => void;
		onSheetDragEnd?: () => void;
	}>();

	let isSheetOpen = $state(isOpen);
	$effect(() => {
		isSheetOpen = isOpen;
	});

	// 주소 파싱
	let groups = $state<string[]>([]);
	// $inspect(location);
	$effect(() => {
		if (location) {
			groups = location.detail?.legal?.split(' ').filter(Boolean) ?? [];
			selectedGroupIndex = null;
		} else {
			groups = [];
			selectedGroupIndex = null;
		}
	});

	let selectedGroupIndex = $state<number | null>(null);

	function handleGroupSelect(idx: number) {
		selectedGroupIndex = idx === selectedGroupIndex ? null : idx;
	}

	function handleApply() {
		if (selectedGroupIndex !== null && groups.length > 0) {
			const region: { group1?: string; group2?: string; group3?: string; address: string } = {
				address: location,
			};
			if (selectedGroupIndex >= 0) region.group1 = groups[0];
			if (selectedGroupIndex >= 1) region.group2 = groups[1];
			if (selectedGroupIndex >= 2) region.group3 = groups[2];
			// 서울특별시, 대전광역시 등 시/도 이름 중 앞 2글자만 사용
			region.group1 = region.group1?.substring(0, 2);
			// if (region.group1 == '서울특별시') {
			//   region.group1 = '서울'
			// } else if (region.group1 == '대전광역시') {
			//   region.group1 = '대전'
			// }
			console.log('[handleApply]', region);
			onApply(region);
			isSheetOpen = false;
		}
	}
</script>

<BottomSheet
	bind:isSheetOpen
	settings={{ maxHeight: 0.9, snapPoints: [0.3, 0.9], startingSnapPoint: 0.9 }}
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
				<div
					class="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-neutral-700"
				>
					<h3 class="w-full text-center text-lg font-semibold">내 위치로 지역 선택</h3>
					<button class="absolute top-3 right-4 p-1" onclick={onClose} aria-label="닫기">
						<X class="h-5 w-5 text-gray-400" />
					</button>
				</div>
			</BottomSheet.Handle>
			<BottomSheet.Content>
				<div class="flex flex-col gap-4 p-6">
					<div class="mb-2 flex items-center gap-2">
						<MapPin class="h-6 w-6 text-blue-500" />
						<span class="font-medium text-gray-800 dark:text-gray-200">현재 위치</span>
					</div>

					<!--
          [2025-05-21] loading내부에 loading의 값을 변경하는 함수 또는 요소가 있는경우 항상 e.stopPropagation();를 호출해서 이벤트 전파를 막아야 한다.
            - 이유는 모르겠당, 이것때문에 2시간 날림 ㅜㅜ
          -->
					{#if loading}
						<Indicator text="위치 정보 가져오는 중..." size="sm" color="blue" />
					{:else if error}
						<div class="mb-2 text-sm text-red-500">{error}</div>
						<button
							class="w-full rounded-lg bg-blue-500 py-2 text-white"
							onclick={(e) => {
								e.stopPropagation();
								requestMyLocation();
							}}
						>
							다시 시도
						</button>
					{:else if location}
						<div class="flex flex-col gap-3">
							<div class="flex flex-col gap-2">
								<div class="flex gap-2">
									{#each groups as group, idx}
										<button
											class="group-btn flex-1 rounded-lg border px-4 py-3 text-base font-medium shadow-sm transition-all
                        {selectedGroupIndex === idx
												? 'border-indigo-600 bg-indigo-600 text-white shadow-md'
												: 'border-gray-300 bg-white text-gray-700 hover:bg-gray-100 dark:border-neutral-700 dark:bg-neutral-800 dark:text-gray-200 dark:hover:bg-neutral-700'}"
											onclick={() => handleGroupSelect(idx)}
										>
											{#if idx === 0}{group}
											{:else if idx === 1}{group}
											{:else}{group}{/if}
										</button>
									{/each}
								</div>
								<div class="mt-1 text-center text-xs text-gray-500 dark:text-gray-400">
									시/도, 시/군/구, 하위 주소 중 하나를 선택하면 해당 지역으로 음식점이 조회됩니다.
								</div>
							</div>
							<button
								class="mt-2 w-full rounded-lg bg-blue-500 py-2 text-white"
								onclick={(e) => {
									e.stopPropagation();
									requestMyLocation();
								}}
							>
								위치 새로고침
							</button>
						</div>
					{:else}
						<div class="text-sm text-gray-500">위치 정보를 불러오려면 아래 버튼을 눌러주세요.</div>
						<button
							class="w-full rounded-lg bg-blue-500 py-2 text-white"
							onclick={(e) => {
								e.stopPropagation();
								requestMyLocation();
							}}
						>
							내 위치 가져오기
						</button>
					{/if}
				</div>
				<div class="px-6 pb-6">
					<button
						class="w-full rounded-lg py-3 font-semibold shadow transition-colors
              {selectedGroupIndex !== null
							? 'bg-indigo-600 text-white hover:bg-indigo-700'
							: 'cursor-not-allowed bg-gray-200 text-gray-400'}"
						onclick={handleApply}
						disabled={selectedGroupIndex === null}
					>
						적용
					</button>
				</div>
			</BottomSheet.Content>
		</BottomSheet.Sheet>
	</BottomSheet.Overlay>
</BottomSheet>

<style>
	.group-btn {
		min-width: 100px;
		margin-right: 0.5rem;
		transition: box-shadow 0.2s;
	}
	.group-btn:last-child {
		margin-right: 0;
	}
	:global(.dark) .bg-gray-100 {
		background-color: #262626;
	}
</style>
