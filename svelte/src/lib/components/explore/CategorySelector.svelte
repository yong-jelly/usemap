<script lang="ts">
	import BottomSheet from '$lib/BottomSheet';
	import { onMount } from 'svelte';

	// 카테고리 데이터
	const categories = [
		'한식',
		'카페,디저트',
		'카페',
		'치킨,닭강정',
		'육류,고기요리',
		'중식당',
		'맥주,호프',
		'생선회',
		'베이커리',
		'종합분식',
		'요리주점',
		'돼지고기구이',
		'족발,보쌈',
		'피자',
		'일식당',
		'포장마차',
		'분식',
		'칼국수,만두',
		'국밥',
		'곱창,막창,양',
		'돈가스',
		'해물,생선요리',
		'양식',
		'햄버거',
		'김밥',
		'국수',
		'순대,순댓국',
		'찌개,전골',
		'이자카야',
		'바(BAR)',
		'소고기구이',
		'장어,먹장어요리',
		'오리요리',
		'한식뷔페',
		'감자탕',
		'초밥,롤',
		'아귀찜,해물찜',
		'유흥주점',
		'야식',
		'해장국'
	];

	// 선택된 카테고리
	let selectedCategories = $state<string[]>([]);

	// 외부에서 전달받는 props
	const {
		onCategoriesSelect = (categories: string[]) => {},
		initialCategories = [],
		isOpen = false,
		onOpen = () => {},
		onClose = () => {},
		onSheetDragStart = () => {},
		onSheetDragEnd = () => {}
	} = $props<{
		onCategoriesSelect?: (categories: string[]) => void;
		initialCategories?: string[];
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
	});

	// 초기 카테고리 설정
	onMount(() => {
		selectedCategories = [...initialCategories];
	});

	// 카테고리 선택 핸들러
	function handleCategoryToggle(category: string) {
		// 이미 선택된 카테고리인 경우 제거, 아니면 추가
		if (selectedCategories.includes(category)) {
			selectedCategories = selectedCategories.filter(c => c !== category);
		} else {
			selectedCategories = [...selectedCategories, category];
		}
	}

	// 적용 버튼 핸들러
	function applySelection() {
		// 부모 컴포넌트에 선택된 카테고리 전달
		onCategoriesSelect(selectedCategories);

		// 선택 후 바텀시트 닫기
		isSheetOpen = false;
	}

	// 초기화 버튼 핸들러
	function resetSelection() {
		selectedCategories = [];
	}

	// 선택된 카테고리 개수
	let selectedCount = $derived(() => selectedCategories.length);
</script>

<div class="category-selector">
	<!-- BottomSheet 카테고리 선택기 -->
	<BottomSheet
		bind:isSheetOpen
		settings={{
			maxHeight: 0.9,
			snapPoints: [0.5, 0.9],
			startingSnapPoint: 0.9
		}}
		onopen={onOpen}
		onclose={onClose}
		onsheetdragstart={onSheetDragStart}
		onsheetdragend={onSheetDragEnd}
	>
		<BottomSheet.Overlay>
			<BottomSheet.Sheet style="max-width: 600px; margin: 0 auto; height: 100%; display: flex; flex-direction: column; min-height: 0;">
				<BottomSheet.Handle>
					<BottomSheet.Grip />
					<div class="px-4 py-3 border-b border-gray-200 dark:border-neutral-700">
						<h3 class="text-lg font-medium text-center">카테고리 선택</h3>
						<p class="text-sm text-gray-500 dark:text-gray-400 text-center mt-1">
							원하는 카테고리를 여러 개 선택할 수 있습니다
						</p>
					</div>
				</BottomSheet.Handle>
				<BottomSheet.Content style="flex: 1 1 0; display: flex; flex-direction: column; min-height: 0;">
					<!-- 카테고리 목록 (스크롤) -->
					<div class="flex-1 overflow-y-auto p-0 min-h-0">
						<div class="flex flex-wrap gap-2 mb-6">
							{#each categories as category}
								<button
									class="category-item rounded px-3 py-1.5 text-sm transition-colors flex items-center {selectedCategories.includes(category)
										? 'bg-rose-100 text-rose-600 border border-rose-300 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-800'
										: 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-transparent dark:bg-neutral-800 dark:text-gray-300 dark:hover:bg-neutral-700'}"
									onclick={() => handleCategoryToggle(category)}
								>
									{category}
									{#if selectedCategories.includes(category)}
										<svg xmlns="http://www.w3.org/2000/svg" class="ml-1 h-3.5 w-3.5 text-rose-600 dark:text-rose-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
											<path d="M18 6 6 18M6 6l12 12"/>
										</svg>
									{/if}
								</button>
							{/each}
						</div>
					</div>
					<!-- 하단 고정 버튼 영역 -->
					<div class="pt-2 pb-0 flex flex-col gap-2">
						<div class="flex gap-2">
							<button
								class="flex-1 py-2.5 rounded-lg border border-gray-300 dark:border-neutral-700 text-gray-700 dark:text-gray-200 font-medium text-sm transition-colors active:bg-gray-100 dark:active:bg-neutral-800"
								onclick={resetSelection}
							>
								초기화
							</button>
							<button
								class="flex-1 py-2.5 rounded-lg bg-indigo-600 text-white font-medium text-sm transition-colors hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
								onclick={applySelection}
							>
								적용 {selectedCount() > 0 ? `(${selectedCount()})` : ''}
							</button>
						</div>
					</div>
				</BottomSheet.Content>
			</BottomSheet.Sheet>
		</BottomSheet.Overlay>
	</BottomSheet>
</div>

<style>
	/* 다크 모드 추가 스타일링이 필요한 경우 여기에 추가 */
	.min-h-0 { min-height: 0 !important; }
</style>
