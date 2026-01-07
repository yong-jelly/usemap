<script lang="ts">
	import ThemeSelector from '$lib/components/ThemeSelector.svelte';
	import CategorySelector from '$lib/components/explore/CategorySelector.svelte';
	import RegionSelectorSheet from '$lib/components/explore/RegionSelectorSheet.svelte';
	import ConvenienceSelector from '$lib/components/explore/ConvenienceSelector.svelte';
	import { toggleBottomNav } from '$lib/stores/ui.store';
	import { onMount } from 'svelte';
	import MyLocationSheet from '$lib/components/explore/MyLocationSheet.svelte';
	import { MapPin } from 'lucide-svelte';
	import { requestMyLocationService } from '$lib/api/location.service';
	import { bucketStore } from '$lib/stores/bucket.store';
	import type { MyLocationModel } from '$services/types';
	import { getCurrentLocation, getLocationCacheKey } from '$utils/location.util';
	import Icon from '../Icon.svelte';
	// 필터 버튼 타입 정의
	interface FilterButton {
		id: string;
		label: string;
		hasDropdown: boolean;
	}

	// 필터 버튼 데이터
	const filterButtons: FilterButton[] = [
		{ id: 'mylocation', label: '', hasDropdown: false },
		{ id: 'region', label: '지역', hasDropdown: true },
		{ id: 'category', label: '카테고리', hasDropdown: true },
		{ id: 'theme', label: '테마', hasDropdown: true },
		// { id: 'convenience', label: '편의시설', hasDropdown: true },
	];

	// 활성화된 버튼 ID
	let activeButtonId = $state<string | null>(null);

	// 테마 선택기 상태
	let isThemeSelectorOpen = $state(false);
	let selectedTheme = $state<string | null>(null);

	// 카테고리 선택기 상태
	let isCategorySelectorOpen = $state(false);
	let selectedCategories = $state<string[]>([]);

	// 지역 선택기 상태
	let isRegionSelectorOpen = $state(false);
	let selectedRegionGroup1 = $state<string | null>(null);
	let selectedRegionGroup2 = $state<string | null>(null);

	// 편의시설 선택기 상태
	let isConvenienceSelectorOpen = $state(false);
	let selectedConveniences = $state<string[]>([]);

	// 내 위치 시트 상태
	let isMyLocationSheetOpen = $state(false);
	let myLocation = $state<string | null>(null);
	let myLocationLoading = $state(false);
	let myLocationError = $state<string | null>(null);

	// 이벤트 로그
	let eventLog = $state<string[]>([]);

	let myLocationModel = $state<MyLocationModel>({ status: 'loading', address: null });

	// 내 위치 활성화 여부
	let isMyLocationActive = $state(false);

	// Props
	const {
		onFilterSelect = (filterId: string, value: any) => {},
		onEvent = (event: { type: string; message: string; timestamp: number }) => {},
		onStart = () => {},
		// 1회성으로 최초 실행시 내 위치 시트 열림 여부
		isFirstOpenMyLocationSheetOpen: isFirstOpenMyLocationSheetOpenProp,
	} = $props<{
		onFilterSelect?: (filterId: string, value: any) => void;
		onEvent?: (event: { type: string; message: string; timestamp: number }) => void;
		onStart?: () => void;
		isFirstOpenMyLocationSheetOpen?: boolean;
	}>();

	// 이벤트 로깅 함수
	function logEvent(message: string, type: string = 'info') {
		const timestamp = Date.now();
		const formattedTime = new Date().toLocaleTimeString();
		const logMessage = `[${formattedTime}] ${message}`;

		// 로그 추가
		eventLog = [...eventLog, logMessage];

		// 최대 로그 수 제한 (최신 50개만 유지)
		if (eventLog.length > 50) {
			eventLog = eventLog.slice(-50);
		}

		// 부모 컴포넌트에 이벤트 전달
		onEvent({ type, message, timestamp });

		console.log(`[FilterButtonGroup] ${message}`);
	}

	// 시트 상태 초기화 함수
	function resetAllSheets() {
		isThemeSelectorOpen = false;
		isCategorySelectorOpen = false;
		isRegionSelectorOpen = false;
		isConvenienceSelectorOpen = false;
		isMyLocationSheetOpen = false;
	}

	// 버튼 클릭 핸들러
	function handleButtonClick(button: FilterButton) {
		logEvent(`버튼 클릭: ${button.label}`, 'button');

		// 모든 시트 닫기
		resetAllSheets();

		// 같은 버튼을 다시 클릭하면 비활성화 및 시트 닫기
		// if (activeButtonId === button.id) {
		// 	activeButtonId = null;
		// 	logEvent(`버튼 비활성화: ${button.label}`, 'button');
		// 	return;
		// }

		activeButtonId = button.id;

		// 버튼별 동작 처리
		switch (button.id) {
			case 'mylocation':
				isMyLocationSheetOpen = true;
				requestMyLocation();
				logEvent('내 위치 시트 열림', 'sheet');
				break;
			case 'theme':
				// 테마 선택기 표시
				isThemeSelectorOpen = true;
				logEvent('테마 선택기 열림', 'sheet');
				break;
			case 'category':
				// 카테고리 선택기 표시
				isCategorySelectorOpen = true;
				logEvent('카테고리 선택기 열림', 'sheet');
				break;
			case 'region':
				// 지역 선택기 표시
				isRegionSelectorOpen = true;
				logEvent('지역 선택기 열림', 'sheet');
				break;
			case 'convenience':
				isConvenienceSelectorOpen = true;
				logEvent('편의시설 선택기 열림', 'sheet');
				break;
		}
	}

	// 테마 선택 핸들러
	function handleThemeSelect(themeCode: string | null) {
		selectedTheme = themeCode;
		onFilterSelect('theme', themeCode);

		if (themeCode) {
			logEvent(`테마 선택: ${themeCode}`, 'selection');
		} else {
			logEvent('테마 선택 해제', 'selection');
		}

		// 테마가 null이면 버튼 비활성화
		if (!themeCode) {
			activeButtonId = null;
		}
	}

	// 카테고리 선택 핸들러
	function handleCategoriesSelect(categories: string[]) {
		selectedCategories = categories;
		onFilterSelect('categories', categories);

		if (categories.length > 0) {
			logEvent(`카테고리 ${categories.length}개 선택: ${categories.join(', ')}`, 'selection');
		} else {
			logEvent('카테고리 선택 해제', 'selection');
		}

		// 카테고리가 비어있으면 버튼 비활성화
		if (categories.length === 0) {
			activeButtonId = null;
		}
	}

	// 지역 선택 핸들러
	function handleRegionSelect(region: { group1: string | null; group2: string | null }) {
		isMyLocationActive = false;
		selectedRegionGroup1 = region.group1;
		selectedRegionGroup2 = region.group2;
		onFilterSelect('region', region);
		if (region.group1 && region.group2) {
			logEvent(`지역 선택: ${region.group1} / ${region.group2}`, 'selection');
		} else {
			logEvent('지역 선택 해제', 'selection');
		}
		isRegionSelectorOpen = false;
		activeButtonId = null;
	}

	// 편의시설 선택 핸들러
	function handleConveniencesSelect(conveniences: string[]) {
		selectedConveniences = conveniences;
		onFilterSelect('convenience', conveniences);
		if (conveniences.length > 0) {
			logEvent(`편의시설 ${conveniences.length}개 선택: ${conveniences.join(', ')}`, 'selection');
		} else {
			logEvent('편의시설 선택 해제', 'selection');
		}
		if (conveniences.length === 0) {
			activeButtonId = null;
		}
	}

	// 내 위치 요청 함수
	/**
	 * 내 위치 요청 및 상태 처리 함수 (서비스 함수만 호출)
	 * - 동일 좌표(x, y) 요청 시 kvBucketStore(geocode 버킷)에서 캐시 사용
	 */
	async function requestMyLocation() {
		myLocationLoading = true;
		myLocationError = null;
		myLocationModel = { status: 'loading', address: null };

		try {
			const { latitude, longitude } = await getCurrentLocation();
			const key = getLocationCacheKey(latitude, longitude);

			// 1. 캐시 체크
			const cached = bucketStore.get('my_geocode', key);
			if (cached) {
				await new Promise((resolve) => setTimeout(resolve, 700));
				const address = cached instanceof Map ? cached.get('address') : cached.address;
				const adm = cached instanceof Map ? cached.get('adm') : cached.adm;
				const legal = cached instanceof Map ? cached.get('legal') : cached.legal;

				myLocationModel = {
					status: 'success',
					address,
					detail: { adm, legal, latitude, longitude },
				};
				myLocation = myLocationModel.address;
				myLocationError = null;
				logEvent(`내 위치 캐시 사용: ${myLocationModel.address}`, 'location');
				myLocationLoading = false;
				return;
			}

			// 2. 서비스 호출
			const { address, adm, legal } = await requestMyLocationService(key);
			// 3. 캐시 저장
			bucketStore.set('my_geocode', key, { address, adm, legal }, 60);

			myLocationModel = {
				status: 'success',
				address,
				detail: { adm, legal, latitude, longitude },
			};
			myLocation = myLocationModel.address;
			myLocationError = null;
			logEvent(`내 위치 요청 성공: ${myLocationModel.address}`, 'location');
		} catch (error: any) {
			myLocationModel = {
				status: 'error',
				address: null,
				error: error?.message || '위치 정보를 가져오는 중 오류가 발생했습니다.',
			};
			myLocationError = myLocationModel.error || null;
			myLocation = null;
			logEvent('내 위치 요청 실패: ' + (error?.message || '알 수 없는 오류'), 'location');
		} finally {
			myLocationLoading = false;
		}
	}

	// 선택된 테마 이름 표시
	// $effect(() => {
	// 	console.log('[***** isMyLocationSheetOpen]', isMyLocationSheetOpen);
	// });
	$effect(() => {
		if (selectedTheme) {
			// 테마가 선택되면 테마 버튼을 활성화 상태로 유지
			activeButtonId = 'theme';
		}
	});

	// 선택된 카테고리 개수 표시
	$effect(() => {
		if (selectedCategories.length > 0) {
			// 카테고리가 선택되면 카테고리 버튼을 활성화 상태로 유지
			activeButtonId = 'category';
		}
	});

	// 선택된 지역 표시
	$effect(() => {
		if (selectedRegionGroup1 && selectedRegionGroup2) {
			activeButtonId = 'region';
		}
	});

	// 선택된 편의시설 개수 표시
	$effect(() => {
		if (selectedConveniences.length > 0) {
			activeButtonId = 'convenience';
		}
	});

	onMount(() => {
		logEvent('FilterButtonGroup 컴포넌트 마운트', 'lifecycle');
		// console.log('[** isFirstOpenMyLocationSheetOpenProp]', isFirstOpenMyLocationSheetOpenProp);
		isMyLocationSheetOpen = isFirstOpenMyLocationSheetOpenProp;
		if (isMyLocationSheetOpen) {
			requestMyLocation();
		}
		onStart();
	});
	// BottomSheet 이벤트 핸들러
	function handleSheetOpen() {
		// logEvent('Bottom Sheet opened', 'sheet');
		toggleBottomNav({isOpen: false});
	}

	function handleSheetClose() {
		resetAllSheets();
		activeButtonId = null;
		toggleBottomNav({isOpen: true});
	}

	function handleSheetDragStart() {
		// logEvent('Bottom Sheet drag started', 'sheet');
	}

	function handleSheetDragEnd() {
		// logEvent('Bottom Sheet drag ended', 'sheet');
	}

	// 버튼 활성화 여부 함수
	function isButtonActive(id: string) {
		if (id === 'theme') return !!selectedTheme;
		if (id === 'category') return selectedCategories.length > 0;
		if (id === 'region')
			return !!selectedRegionGroup1 && !!selectedRegionGroup2 && !isMyLocationActive;
		if (id === 'mylocation') return isMyLocationActive;
		if (id === 'convenience') return selectedConveniences.length > 0;
		return false;
	}

	// 내 위치 적용 시
	function handleApplyMyLocation(region: {
		group1: string | null;
		group2: string | null;
		group3: string | null;
		address: string;
	}) {
		isMyLocationActive = true;
		selectedRegionGroup1 = null;
		selectedRegionGroup2 = null;
		isMyLocationSheetOpen = false;
		activeButtonId = null;
		onFilterSelect('region', region);
	}
	// $inspect(isMyLocationSheetOpen);
</script>

<div class="filter-button-group">
	<div class="scrollbar-hide overflow-x-auto pb-2">
		<div class="flex w-max gap-2">
			{#each filterButtons as button}
				<button
					class="flex items-center gap-1 rounded-lg px-2 py-1 text-sm font-medium whitespace-nowrap transition-all
						{isButtonActive(button.id)
						? 'border-0 bg-indigo-600 text-white'
						: 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-200 dark:border-neutral-700 dark:bg-neutral-800 dark:text-gray-300 dark:hover:bg-neutral-700'}"
					onclick={() => handleButtonClick(button)}
				>
					{#if button.id === 'mylocation'}
						<!-- <Icon name="map-pin" class="h-4 w-4 text-blue-500" /> -->
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-locate-fixed-icon lucide-locate-fixed"><line x1="2" x2="5" y1="12" y2="12"/><line x1="19" x2="22" y1="12" y2="12"/><line x1="12" x2="12" y1="2" y2="5"/><line x1="12" x2="12" y1="19" y2="22"/><circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="3"/></svg>
					{/if}
					{button.label}
					{#if button.id === 'theme' && selectedTheme}
						<span class="h-2 w-2 rounded-full bg-green-500"></span>
					{:else if button.id === 'category' && selectedCategories.length > 0}
						<span class="rounded-full bg-rose-500 px-1 text-xs text-white">
							{selectedCategories.length}
						</span>
					{:else if button.id === 'region' && selectedRegionGroup1 && selectedRegionGroup2}
						<span class="rounded-full bg-blue-500 px-1 text-xs text-white">선택됨</span>
					{:else if button.id === 'convenience' && selectedConveniences.length > 0}
						<span class="rounded-full bg-emerald-500 px-1 text-xs text-white">
							{selectedConveniences.length}
						</span>
					{/if}
					{#if button.hasDropdown}
						<Icon name="chevron-down" class="h-4 w-4" />
					{/if}
				</button>
			{/each}
		</div>
	</div>

	<!-- 테마 선택기 -->
	<ThemeSelector
		isOpen={isThemeSelectorOpen}
		initialTheme={selectedTheme}
		onThemeSelect={(themeCode) => {
			handleThemeSelect(themeCode);
			isThemeSelectorOpen = false;
		}}
		onOpen={handleSheetOpen}
		onClose={handleSheetClose}
		onSheetDragStart={handleSheetDragStart}
		onSheetDragEnd={handleSheetDragEnd}
	/>

	<!-- 카테고리 선택기 -->
	<CategorySelector
		isOpen={isCategorySelectorOpen}
		initialCategories={selectedCategories}
		onCategoriesSelect={(categories) => {
			handleCategoriesSelect(categories);
			isCategorySelectorOpen = false;
		}}
		onOpen={handleSheetOpen}
		onClose={handleSheetClose}
		onSheetDragStart={handleSheetDragStart}
		onSheetDragEnd={handleSheetDragEnd}
	/>

	<!-- 지역 선택기 -->
	<RegionSelectorSheet
		isOpen={isRegionSelectorOpen}
		initialGroup1={selectedRegionGroup1}
		initialGroup2={selectedRegionGroup2}
		onRegionSelect={handleRegionSelect}
		onOpen={handleSheetOpen}
		onClose={handleSheetClose}
		onSheetDragStart={handleSheetDragStart}
		onSheetDragEnd={handleSheetDragEnd}
	/>

	<!-- 편의시설 선택기 -->
	<ConvenienceSelector
		isOpen={isConvenienceSelectorOpen}
		initialConveniences={selectedConveniences}
		onConveniencesSelect={(conveniences) => {
			handleConveniencesSelect(conveniences);
			isConvenienceSelectorOpen = false;
		}}
		onOpen={handleSheetOpen}
		onClose={handleSheetClose}
		onSheetDragStart={handleSheetDragStart}
		onSheetDragEnd={handleSheetDragEnd}
	/>

	<!-- 내 위치 바텀시트 -->
	<MyLocationSheet
		isOpen={isMyLocationSheetOpen}
		location={myLocationModel}
		loading={myLocationLoading}
		error={myLocationModel.status === 'error' ? myLocationModel.error : null}
		{requestMyLocation}
		onApply={handleApplyMyLocation}
		onOpen={handleSheetOpen}
		onClose={handleSheetClose}
		onSheetDragStart={handleSheetDragStart}
		onSheetDragEnd={handleSheetDragEnd}
	/>
</div>

<style>
	/* 스크롤바 숨기기 */
	.scrollbar-hide {
		-ms-overflow-style: none; /* IE, Edge */
		scrollbar-width: none; /* Firefox */
	}

	.scrollbar-hide::-webkit-scrollbar {
		display: none; /* Chrome, Safari, Opera */
	}

	.filter-button-group {
		position: relative;
		width: 100%;
		margin-bottom: 0.5rem;
	}
</style>
