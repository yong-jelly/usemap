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
	import FeatureSelector from '../FeatureSelector.svelte';
	import YoutubeChannelSelector from '../YoutubeChannelSelector.svelte';
	import NaverFolderChannelSelector from '../NaverFolderChannelSelector.svelte';
	// 필터 버튼 타입 정의
	interface FilterButton {
		id: string;
		label: string;
		hasDropdown: boolean;
	}

	// 필터 버튼 데이터
	const filterButtons: FilterButton[] = [
		{ id: 'region', label: '지역', hasDropdown: true },
		// { id: 'category', label: '최신순', hasDropdown: true },
		{ id: 'feature', label: '콘텐츠 유형', hasDropdown: true },
		{ id: 'youtube_channel', label: '유튜브 채널', hasDropdown: true },
		{ id: 'naver_folder', label: '네이버 폴더', hasDropdown: true },
		// { id: 'clear', label: '초기화', hasDropdown: false },
	];

	// 활성화된 버튼 ID
	let activeButtonId = $state<string | null>(null);

	// 지역 선택기 상태
	let isRegionSelectorOpen = $state(false);
	let selectedRegionGroup1 = $state<string | null>(null);
	let selectedRegionGroup2 = $state<string | null>(null);

	// 콘텐츠 유형 선택기 상태
	const featureOptions = [
		{ code: 'damoang.net', name: '다모앙' },
		{ code: 'clien.net', name: '클리앙' },
		{ code: 'bobaedream.co.kr', name: '보배드림' },
		{ code: 'youtube', name: '유튜브' },
		{ code: 'folder', name: '네이버 폴더' },
	];
	const allFeatureCodes = featureOptions.map((opt) => opt.code);
	let isFeatureSelectorOpen = $state(false);
	let selectedFeatures = $state<string[]>(allFeatureCodes);

	// 유튜브 채널 선택기 상태
	let isYoutubeChannelSelectorOpen = $state(false);
	let selectedYoutubeChannels = $state<string[]>([]);

	// 네이버 폴더 선택기 상태
	let isNaverFolderChannelSelectorOpen = $state(false);
	let selectedNaverFolderChannels = $state<string[]>([]);

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
		isRegionSelectorOpen = false;
		isMyLocationSheetOpen = false;
		isFeatureSelectorOpen = false;
		isYoutubeChannelSelectorOpen = false;
		isNaverFolderChannelSelectorOpen = false;
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
			case 'feature':
				isFeatureSelectorOpen = true;
				logEvent('콘텐츠 유형 선택기 열림', 'sheet');
				break;
			case 'youtube_channel':
				isYoutubeChannelSelectorOpen = true;
				logEvent('유튜브 채널 선택기 열림', 'sheet');
				break;
			case 'naver_folder':
				isNaverFolderChannelSelectorOpen = true;
				logEvent('네이버 폴더 선택기 열림', 'sheet');
				break;
			case 'region':
				// 지역 선택기 표시
				isRegionSelectorOpen = true;
				logEvent('지역 선택기 열림', 'sheet');
				break;
		}
	}

	function handleFeaturesSelect(features: string[]) {
		selectedFeatures = features;
		onFilterSelect('features', features);
		isFeatureSelectorOpen = false;
		activeButtonId = null;
	}

	// 유튜브 채널 선택 핸들러
	function handleYoutubeChannelsSelect(channels: string[]) {
		selectedYoutubeChannels = channels;
		onFilterSelect('youtube_channels', channels);
		isYoutubeChannelSelectorOpen = false;
		activeButtonId = null;
	}

	// 네이버 폴더 선택 핸들러
	function handleNaverFolderChannelsSelect(channels: string[]) {
		selectedNaverFolderChannels = channels;
		onFilterSelect('naver_folder', channels);
		isNaverFolderChannelSelectorOpen = false;
		activeButtonId = null;
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
	$effect(() => {
		console.log('[***** isMyLocationSheetOpen]', isMyLocationSheetOpen);
	});
	$effect(() => {
		if (selectedFeatures.length > 0) {
			// 테마가 선택되면 테마 버튼을 활성화 상태로 유지
			activeButtonId = 'feature';
		}
	});

	// 선택된 지역 표시
	$effect(() => {
		if (selectedRegionGroup1 && selectedRegionGroup2) {
			activeButtonId = 'region';
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
		toggleBottomNav({ isOpen: false });
	}

	function handleSheetClose() {
		resetAllSheets();
		activeButtonId = null;
		toggleBottomNav({ isOpen: true });
	}

	function handleSheetDragStart() {
		// logEvent('Bottom Sheet drag started', 'sheet');
	}

	function handleSheetDragEnd() {
		// logEvent('Bottom Sheet drag ended', 'sheet');
	}

	// 버튼 활성화 여부 함수
	function isButtonActive(id: string) {
		if (id === 'feature') return selectedFeatures.length > 0;
		if (id === 'youtube_channel') return selectedYoutubeChannels.length > 0;
		if (id === 'naver_folder') return selectedNaverFolderChannels.length > 0;
		if (id === 'region')
			return !!selectedRegionGroup1 && !!selectedRegionGroup2 && !isMyLocationActive;
		if (id === 'mylocation') return isMyLocationActive;
		return false;
	}

	// 유튜브 채널 버튼 비활성화 여부 (콘텐츠 유형에 유튜브가 없으면 비활성화)
	function isYoutubeChannelButtonDisabled() {
		return !selectedFeatures.includes('youtube');
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
	<div class="scrollbar-hide overflow-x-auto">
		<div class="flex w-max gap-2">
			{#each filterButtons as button}
				<button
					class="flex items-center gap-1 rounded-lg {button.id === 'clear'
						? 'px-1'
						: 'px-2'} py-1 text-sm font-medium whitespace-nowrap transition-all"
					class:bg-indigo-600={isButtonActive(button.id)}
					class:text-white={isButtonActive(button.id)}
					class:border-0={isButtonActive(button.id)}
					class:text-blue-500={button.id === 'clear' && !isButtonActive(button.id)}
					class:border={!isButtonActive(button.id) && button.id !== 'clear'}
					class:border-gray-300={!isButtonActive(button.id) && button.id !== 'clear'}
					class:bg-white={!isButtonActive(button.id) && button.id !== 'clear'}
					class:text-gray-700={!isButtonActive(button.id) && button.id !== 'clear'}
					class:hover:bg-gray-200={!isButtonActive(button.id) && button.id !== 'clear'}
					class:dark:border-neutral-700={!isButtonActive(button.id) && button.id !== 'clear'}
					class:dark:bg-neutral-800={!isButtonActive(button.id) && button.id !== 'clear'}
					class:dark:text-gray-300={!isButtonActive(button.id) && button.id !== 'clear'}
					class:dark:hover:bg-neutral-700={!isButtonActive(button.id) && button.id !== 'clear'}
					class:opacity-50={button.id === 'youtube_channel' && isYoutubeChannelButtonDisabled()}
					class:cursor-not-allowed={button.id === 'youtube_channel' &&
						isYoutubeChannelButtonDisabled()}
					disabled={button.id === 'youtube_channel' && isYoutubeChannelButtonDisabled()}
					onclick={() => handleButtonClick(button)}
				>
					<!-- {#if button.id === 'mylocation'}
						<MapPin class="h-4 w-4 text-blue-500" />
					{/if} -->
					{button.label}

					{#if button.id === 'region' && selectedRegionGroup1 && selectedRegionGroup2}
						<span class="rounded-full bg-blue-500 px-1 text-xs text-white">선택됨</span>
					{/if}
					{#if button.id === 'feature' && selectedFeatures.length > 0}
						<span class="rounded-full bg-blue-500 px-1 text-xs text-white">
							{selectedFeatures.length}
						</span>
					{/if}
					{#if button.id === 'youtube_channel' && selectedYoutubeChannels.length > 0}
						<span class="rounded-full bg-blue-500 px-1 text-xs text-white">
							{selectedYoutubeChannels.length}
						</span>
					{/if}
					{#if button.id === 'naver_folder' && selectedNaverFolderChannels.length > 0}
						<span class="rounded-full bg-blue-500 px-1 text-xs text-white">
							{selectedNaverFolderChannels.length}
						</span>
					{/if}
					{#if button.id === 'clear'}
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
							<path d="M18 6 6 18M6 6l12 12" />
						</svg>
					{/if}
					{#if button.hasDropdown}
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
							<path d="m6 9 6 6 6-6" />
						</svg>
					{/if}
				</button>
			{/each}
		</div>
	</div>

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

	<!-- 콘텐츠 유형 선택기 -->
	<FeatureSelector
		isOpen={isFeatureSelectorOpen}
		options={featureOptions}
		initialSelection={selectedFeatures}
		onSelect={handleFeaturesSelect}
		onOpen={handleSheetOpen}
		onClose={handleSheetClose}
		onSheetDragStart={handleSheetDragStart}
		onSheetDragEnd={handleSheetDragEnd}
	/>

	<!-- 유튜브 채널 선택기 -->
	<YoutubeChannelSelector
		isOpen={isYoutubeChannelSelectorOpen}
		initialChannels={selectedYoutubeChannels}
		onChannelSelect={handleYoutubeChannelsSelect}
		onOpen={handleSheetOpen}
		onClose={handleSheetClose}
		onSheetDragStart={handleSheetDragStart}
		onSheetDragEnd={handleSheetDragEnd}
	/>

	<!-- 네이버 폴더 선택기 -->
	<NaverFolderChannelSelector
		isOpen={isNaverFolderChannelSelectorOpen}
		initialChannels={selectedNaverFolderChannels}
		onChannelSelect={handleNaverFolderChannelsSelect}
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
