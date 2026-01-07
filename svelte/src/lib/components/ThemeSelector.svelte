<script lang="ts">
	import BottomSheet from '$lib/BottomSheet';
	import { onMount } from 'svelte';
	
	// 테마 데이터
	const themes = [
		{ code: 'food_good', theme_name: '음식맛', display_name: '음식이 맛있어요' },
		{ code: 'large', theme_name: '음식양', display_name: '양이 많아요' },
		{ code: 'special_menu', theme_name: '특별메뉴', display_name: '특별한 메뉴가 있어요' },
		{ code: 'eat_alone', theme_name: '혼밥', display_name: '혼밥하기 좋아요' },
		{ code: 'spacious', theme_name: '넓은매장', display_name: '매장이 넓어요' },
		{ code: 'fresh', theme_name: '신선도', display_name: '재료가 신선해요' },
		{ code: 'kind', theme_name: '친절', display_name: '친절해요' },
		{ code: 'price_cheap', theme_name: '가성비', display_name: '가성비가 좋아요' },
		{ code: 'store_clean', theme_name: '청결', display_name: '매장이 청결해요' },
		{ code: 'food_fast', theme_name: '빠른 주문', display_name: '음식이 빨리 나와요' },
		{ code: 'special_day', theme_name: '특별함', display_name: '특별한 날 가기 좋아요' },
		{ code: 'toilet_clean', theme_name: '깨끗 화장실', display_name: '화장실이 깨끗해요' },
		{ code: 'together', theme_name: '단체모임', display_name: '단체모임 하기 좋아요' },
		{ code: 'interior_cool', theme_name: '인테리어', display_name: '인테리어가 멋져요' },
		{ code: 'taste_healthy', theme_name: '건강한 맛', display_name: '건강한 맛이에요' },
		{ code: 'view_good', theme_name: '굳 뷰', display_name: '뷰가 좋아요' },
		{ code: 'parking_easy', theme_name: '주차편리', display_name: '주차하기 편해요' },
		{ code: 'price_worthy', theme_name: '비싼가치', display_name: '비싼 만큼 가치있어요' },
		{ code: 'menu_good', theme_name: '알찬구성', display_name: '메뉴 구성이 알차요' },
		{ code: 'kid_good', theme_name: '아이와 함께', display_name: '아이와 가기 좋아요' },
		{ code: 'concept_unique', theme_name: '독특 컨셉', display_name: '컨셉이 독특해요' },
		{ code: 'local_taste', theme_name: '현지맛', display_name: '현지 맛에 가까워요' },
		{ code: 'atmosphere_calm', theme_name: '분위기', display_name: '차분한 분위기에요' },
		{ code: 'drink_alone', theme_name: '굳 혼술', display_name: '혼술하기 좋아요' },
		{ code: 'comfy', theme_name: '편한 좌석', display_name: '좌석이 편해요' },
		{ code: 'pet_good', theme_name: '반려동물', display_name: '반려동물과 가기 좋아요' }
	];
	
	// 선택된 테마
	let selectedTheme = $state<string | null>(null);
	
	// 외부에서 전달받는 props
	const { 
		onThemeSelect = (themeCode: string | null) => {}, 
		initialTheme = null,
		isOpen = false,
		onOpen = () => {},
		onClose = () => {},
		onSheetDragStart = () => {},
		onSheetDragEnd = () => {}
	} = $props<{
		onThemeSelect?: (themeCode: string | null) => void;
		initialTheme?: string | null;
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
	
	// 초기 테마 설정
	onMount(() => {
		selectedTheme = initialTheme;
	});
	
	// 테마 선택 핸들러
	function handleThemeSelect(themeCode: string | null) {
		// 같은 테마를 다시 선택하면 선택 해제
		if (selectedTheme === themeCode) {
			selectedTheme = null;
		} else {
			selectedTheme = themeCode;
		}
		
		// 부모 컴포넌트에 선택된 테마 전달
		onThemeSelect(selectedTheme);
		
		// 선택 후 바텀시트 닫기
		isSheetOpen = false;
	}
	
	// 선택된 테마 이름 가져오기
	let selectedThemeName = $derived(() => {
		if (!selectedTheme) return '테마 선택';
		const theme = themes.find(t => t.code === selectedTheme);
		return theme ? theme.theme_name : '테마 선택';
	});
</script>

<div class="theme-selector">
	<!-- BottomSheet 테마 선택기 -->
	<BottomSheet 
		bind:isSheetOpen
		settings={{
			maxHeight: 0.8,
			snapPoints: [0.5, 0.8],
			startingSnapPoint: 0.9
		}}
		onopen={onOpen}
		onclose={onClose}
		onsheetdragstart={onSheetDragStart}
		onsheetdragend={onSheetDragEnd}
	>
		<BottomSheet.Overlay>
			<BottomSheet.Sheet style="max-width: 600px; margin: 0 auto;">
				<BottomSheet.Handle>
					<BottomSheet.Grip />
					<div class="px-4 py-3 border-b border-gray-200 dark:border-neutral-700">
						<h3 class="text-lg font-medium text-center">테마 선택</h3>
						<p class="text-sm text-gray-500 dark:text-gray-400 text-center mt-1">
							가장 중요한 테마 하나만 선택해주세요
						</p>
					</div>
				</BottomSheet.Handle>
				<BottomSheet.Content>
					<div class="p-0">
						<div class="grid grid-cols-2 gap-3">
							{#each themes as theme}
								<button
									class="theme-item flex items-center p-3 rounded-lg border transition-all"
									class:selected={selectedTheme === theme.code}
									onclick={() => handleThemeSelect(theme.code)}
								>
									<div class="flex-1">
										<div class="font-medium">{theme.theme_name}</div>
										<div class="text-xs text-gray-500 dark:text-gray-400 mt-1">{theme.display_name}</div>
									</div>
									{#if selectedTheme === theme.code}
										<div class="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center text-white">
											<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
												<path d="M20 6 9 17l-5-5"/>
											</svg>
										</div>
									{/if}
								</button>
							{/each}
						</div>
						
						<!-- 테마 초기화 버튼 -->
						<div class="mt-6 flex justify-center">
							<button
								class="px-4 py-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
								onclick={() => handleThemeSelect(null)}
							>
								테마 초기화
							</button>
						</div>
					</div>
				</BottomSheet.Content>
			</BottomSheet.Sheet>
		</BottomSheet.Overlay>
	</BottomSheet>
</div>

<style>
	.theme-item {
		border-color: #e5e7eb;
		background-color: white;
	}
	
	.theme-item.selected {
		border-color: #6366f1;
		background-color: #eef2ff;
	}
	
	:global(.dark) .theme-item {
		border-color: #404040;
		background-color: #262626;
	}
	
	:global(.dark) .theme-item.selected {
		border-color: #6366f1;
		background-color: rgba(99, 102, 241, 0.1);
	}
</style> 