<script lang="ts">
	import { onMount } from 'svelte';
	import Header from './Header.svelte';
	import Tabs from './Tabs.svelte';
	import ProfileSidebar from './ProfileSidebar.svelte';
	import { Button } from 'kampsy-ui';
	import { ScrollManager, ScrollDirection } from '$lib/utils/ScrollManager';
	import HomeCard from './components/HomeCard.svelte';
	
	let showNav = $state(true);
	let showSidebar = $state(false);
	let scrollableArea: HTMLDivElement = $state();
	let y = $state(0);
	let refreshMessage = $state('');
	let activeTab = $state(0); // 활성 탭 인덱스 추가
	
	// 탭 정보
	const tabs = [
		{ id: 'recommend', label: '추천', param: 'type=recommend' },
		{ id: 'popular', label: '인기', param: 'type=popular' },
		{ id: 'nearby', label: '주변', param: 'type=nearby' }
	];
	
	// 더미 데이터 생성 함수
	function generateMockData(type: string) {
		const count = 20;
		let items = [];
		
		for (let i = 1; i <= count; i++) {
			let prefix = '';
			let extraInfo = '';
			
			switch (type) {
				case 'recommend':
					prefix = '추천';
					extraInfo = '맞춤 추천 장소';
					break;
				case 'popular':
					prefix = '인기';
					extraInfo = '많은 사람들이 찾는 곳';
					break;
				case 'nearby':
					prefix = '근처';
					extraInfo = '현재 위치 주변 200m';
					break;
			}
			
			items.push({
				id: `${type}-${i}`,
				title: `${prefix} 장소 ${i}`,
				description: `${extraInfo}입니다. 여기에 실제 피드 데이터가 표시됩니다.`,
				hasImage: i % 5 === 0,
				imageIndex: Math.floor(i / 5) + 1
			});
		}
		
		return items;
	}
	
	// 탭별 데이터
	let recommendItems = $state(generateMockData('recommend'));
	let popularItems = $state(generateMockData('popular'));
	let nearbyItems = $state(generateMockData('nearby'));
	
	// 현재 선택된 탭의 데이터
	let currentItems = $derived(() => {
		switch (activeTab) {
			case 0:
				return recommendItems;
			case 1:
				return popularItems;
			case 2:
				return nearbyItems;
			default:
				return recommendItems;
		}
	});
	
	// 탭 변경 함수
	function handleTabChange(index: number) {
		activeTab = index;
	}
	
	// 스크롤 매니저 인스턴스 생성
	const scrollManager = new ScrollManager({
		headerThreshold: 5,
		refreshThreshold: -100,
		debug: false // 개발 중 디버그 모드 활성화
	});
	
	function toggleSidebar(): void {
		console.log('사이드바 토글');
		showSidebar = !showSidebar;
	}
	
	onMount(() => {
		console.log('onMount 실행됨');
		
		// 스크롤 매니저 초기화
		const cleanup = scrollManager.initialize();
		
		// 스크롤 컨테이너 요소 설정
		if (scrollableArea) {
			scrollManager.setContainerElement(scrollableArea);
		}
		
		// 스크롤 이벤트 구독
		const unsubscribeScroll = scrollManager.onScroll((scrollPosition) => {
			y = scrollPosition;
			// console.log('스크롤 위치:', scrollPosition);
		});
		
		// 위로 스크롤 시 헤더 표시
		const unsubscribeScrollUp = scrollManager.onDirectionChange(
			ScrollDirection.UP,
			() => {
				if (!showNav) {
					// console.log('헤더 표시');
					showNav = true;
				}
			}
		);
		
		// 아래로 스크롤 시 헤더 숨김
		const unsubscribeScrollDown = scrollManager.onDirectionChange(
			ScrollDirection.DOWN,
			() => {
				if (showNav) {
					// console.log('헤더 숨김');
					showNav = false;
				}
			}
		);
		
		// 새로고침 트리거 이벤트 구독
		const unsubscribeRefresh = scrollManager.onRefreshTriggered((position) => {
			refreshMessage = `새로고침 트리거 (${position}px)`;
			console.log('새로고침 트리거:', position);
			
			// 3초 후 메시지 지우기
			setTimeout(() => {
				refreshMessage = '';
			}, 3000);
		});
		
		// 컴포넌트 정리 함수 반환
		return () => {
			cleanup();
			unsubscribeScroll();
			unsubscribeScrollUp();
			unsubscribeScrollDown();
			unsubscribeRefresh();
		};
	});
</script>

<!-- 스크롤 가능한 컨테이너 -->
<div class="scroll-container" bind:this={scrollableArea}>
	<!-- 새로고침 메시지 -->
	{#if refreshMessage}
		<div class="fixed top-0 left-0 right-0 bg-blue-500 text-white p-2 text-center z-50">
			{refreshMessage}
		</div>
	{/if}

	<!-- 사이드바 -->
	{#if showSidebar}
		<div class="fixed inset-0 bg-black bg-opacity-50 z-40" onclick={toggleSidebar}></div>
		<div class="fixed left-0 top-0 h-full w-80 bg-white shadow-lg z-50 transition-transform duration-300 transform translate-x-0">
			<ProfileSidebar on:close={toggleSidebar} />
		</div>
	{:else}
		<div class="fixed left-0 top-0 h-full w-80 bg-white shadow-lg z-50 transition-transform duration-300 transform -translate-x-full">
			<ProfileSidebar on:close={toggleSidebar} />
		</div>
	{/if}
	
	<!-- 헤더와 탭 -->
	<div class="fixed top-0 left-0 right-0 z-30 transition-transform duration-300 ease-in-out bg-white" 
		 style="transform: translateY({showNav ? '0' : '-100%'})">
		<Header on:profileClick={toggleSidebar} />
		
		<!-- 탭 네비게이션 추가 -->
		<div class="border-b border-gray-200 bg-white">
			<div class="container mx-auto px-4">
				<div class="flex space-x-1">
					{#each tabs as tab, index}
						<button
							class="relative flex-1 whitespace-nowrap border-b-2 py-3 text-sm font-medium transition-colors
							{activeTab === index 
								? 'border-blue-500 text-blue-600' 
								: 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'}"
							onclick={() => handleTabChange(index)}
						>
							{tab.label}
						</button>
					{/each}
				</div>
			</div>
		</div>
	</div>
	
	<!-- 메인 콘텐츠 -->
	<div class="pt-32">
		<div class="container mx-auto p-4">
			<!-- 피드 콘텐츠 -->
			<div class="space-y-4">
				{#each currentItems as item}
					<HomeCard 
						title={item.title}
						description={item.description}
						hasImage={item.hasImage}
						imageIndex={item.imageIndex}
					/>
				{/each}
			</div>
		</div>
	</div>
</div>
  