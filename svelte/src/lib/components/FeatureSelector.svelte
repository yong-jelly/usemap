<script lang="ts">
	import BottomSheet from '$lib/BottomSheet';
	import { onMount } from 'svelte';
	import CircleCheckbox from './CircleCheckbox.svelte';
	
	interface Option {
		code: string;
		name: string;
	}
	
	// 선택된 코드 배열
	let selectedCodes = $state<string[]>([]);
	let tempSelectedCodes = $state<string[]>([]); // 임시 선택 상태
	
	// 외부에서 전달받는 props (일반적인 이름으로 변경)
	const {
		options = [],
		onSelect = (codes: string[]) => {},
		initialSelection = [],
		isOpen = false,
		onOpen = () => {},
		onClose = () => {},
		onSheetDragStart = () => {},
		onSheetDragEnd = () => {}
	} = $props<{
		options: Option[];
		onSelect?: (codes: string[]) => void;
		initialSelection?: string[];
		isOpen?: boolean;
		onOpen?: () => void;
		onClose?: () => void;
		onSheetDragStart?: () => void;
		onSheetDragEnd?: () => void;
	}>();
	
	const allOptionCodes = options.map((opt: Option) => opt.code);
	// 바텀시트 상태
	let isSheetOpen = $state(isOpen);
	
	// isOpen prop 변경 감지 및 임시 상태 초기화
	$effect(() => {
		isSheetOpen = isOpen;
		if (isOpen) {
			tempSelectedCodes = [...selectedCodes];
		}
	});
	
	// 초기 선택값 설정
	onMount(() => {
		selectedCodes = [...initialSelection];
		tempSelectedCodes = [...initialSelection];
	});
	
	// 항목 선택/해제 핸들러
	function toggleItem(code: string) {
		const currentSelection = [...tempSelectedCodes];
		const index = currentSelection.indexOf(code);
		if (index > -1) {
			currentSelection.splice(index, 1);
		} else {
			currentSelection.push(code);
		}
		tempSelectedCodes = currentSelection;
	}
	
	// 적용 버튼 핸들러
	function handleApply() {
		selectedCodes = [...tempSelectedCodes];
		onSelect(selectedCodes);
		isSheetOpen = false;
	}
</script>

<div class="item-selector">
	<!-- BottomSheet 선택기 -->
	<BottomSheet
		bind:isSheetOpen
		settings={{
			maxHeight: 0.5,
			snapPoints: [0.5, 0.8],
			startingSnapPoint: 0.4
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
					<div class="px-4 py-3 border-b border-gray-200 dark:border-neutral-700">
						<h3 class="text-lg font-medium text-center">콘텐츠 유형</h3>
					</div>
				</BottomSheet.Handle>
				
				<BottomSheet.Content style="flex: 1 1 0; display: flex; flex-direction: column; min-height: 0;">
					<div class="flex-1 min-h-0 overflow-y-auto">
						<div class="">
							{#each options as option}
								<button
									class="w-full flex items-center justify-between p-3"
									onclick={(e) => {
										e.stopPropagation();
										toggleItem(option.code);
									}}
								>
									<span class="font-medium">{option.name}</span>
									<CircleCheckbox checked={tempSelectedCodes.includes(option.code)} />
								</button>
							{/each}
						</div>
					</div>
					<div class="pt-2 pb-0 flex flex-col gap-2">
						<div class="flex gap-2">
							<button
								class="flex-1 py-2.5 rounded-lg bg-indigo-600 text-white font-medium text-sm transition-colors hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
								onclick={handleApply}
								disabled={tempSelectedCodes.length === 0}
							>
								적용 {tempSelectedCodes.length > 0 ? `(${tempSelectedCodes.length})` : ''}
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
</style> 