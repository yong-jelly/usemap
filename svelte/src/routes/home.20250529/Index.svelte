<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '@mateothegreat/svelte5-router';
	import { ScrollManager, ScrollDirection } from '$lib/utils/ScrollManager';
	import Header from './Header.svelte';
	import ReviewCard from './components/ReviewCard.svelte';
	import { reviewService } from '$services/review.service';
	import Indicator from '$lib/components/Indicator.svelte';
	import Tabs from '$lib/components/ui/Tabs.svelte';
	import type { ReviewItem } from '$services/types';
	// import { countParquetRows } from '$lib/utils/duckdb';
	// import { duckDBStore } from '$lib/stores/duckdb.store.svelte';
	// import { PopularReviewsRepository } from '$lib/repositories/popular-reviews.repository';
	import { AdvancedStatsPlacesRepository } from '../../lib/repositories/advanced-stats-places.repository';
	import type { AdvancedStatsPlace } from '$lib/repositories/advanced-stats-types';
	import AdvancedStatsPlacesCard from './components/AdvancedStatsPlacesCard.svelte';
	// import type { PopularReview } from '$lib/types/parquet';

	// 브라우저 환경에서만 초기화되는 로컬 상태 변수들
	let wasNavigatingBack = false;
	let lastContentDetailId: string | null = null;

	let repository: AdvancedStatsPlacesRepository | null = $state(null);
	
	// 브라우저 환경에서만 실행되는 초기화 (SSR 고려)
	if (typeof window !== 'undefined') {
		// 세션스토리지에서 상태 체크 (localStorage 접근 최소화)
		try {
			wasNavigatingBack = sessionStorage.getItem('wasNavigatingBack') === 'true';
			lastContentDetailId = sessionStorage.getItem('currentViewingContentId');
			
			// 사용 후 초기화
			sessionStorage.removeItem('wasNavigatingBack');
			
			if (wasNavigatingBack) {
				console.log('브라우저 뒤로가기 감지: 세션스토리지 플래그 확인됨');
				
				// 마지막으로 본 컨텐츠 ID가 있는지 확인
				if (lastContentDetailId) {
					console.log('마지막으로 본 컨텐츠 ID:', lastContentDetailId);
				}
			}
		} catch (e) {
			console.error('로컬 상태 초기화 오류:', e);
		}
	}

	// 홈 페이지 상태 저장을 위한 객체
	let homeState = $state({
		reviews: [] as ReviewItem[],
		page: 1,
		scrollPosition: 0,
		activeTab: 0,
		type: 'popularity',
		expandedTexts: {} as Record<string, boolean>
	});

	let showNav = $state(true);
	let showSidebar = $state(false);
	let scrollableArea: HTMLDivElement | undefined = $state();
	let y = $state(0);
	let refreshMessage = $state('');
	let hasNextReview = $state(false);
	// latest,popularity
	let type = $state('popularity');
	
	// 이전 페이지 추적 변수

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
	
	// $effect(() => {
	// 	console.log('onMount 실행됨');
		
	// 	// 스크롤 매니저 초기화
	// 	const cleanup = scrollManager.initialize();
		
	// 	// 스크롤 컨테이너 요소 설정
	// 	if (scrollableArea) {
	// 		scrollManager.setContainerElement(scrollableArea);
	// 	}
		
	// 	// 스크롤 이벤트 구독
	// 	const unsubscribeScroll = scrollManager.onScroll((scrollPosition) => {
	// 		y = scrollPosition;
	// 		// 스크롤 위치 homeState에 저장
	// 		homeState.scrollPosition = scrollPosition;
	// 	});
		
	// 	// 위로 스크롤 시 헤더 표시
	// 	const unsubscribeScrollUp = scrollManager.onDirectionChange(
	// 		ScrollDirection.UP,
	// 		() => {
	// 			if (!showNav) {
	// 				showNav = true;
	// 			}
	// 		}
	// 	);
		
	// 	// 아래로 스크롤 시 헤더 숨김
	// 	const unsubscribeScrollDown = scrollManager.onDirectionChange(
	// 		ScrollDirection.DOWN,
	// 		() => {
	// 			if (showNav) {
	// 				showNav = false;
	// 			}
	// 		}
	// 	);
		
	// 	// 새로고침 트리거 이벤트 구독
	// 	const unsubscribeRefresh = scrollManager.onRefreshTriggered((position) => {
	// 		refreshMessage = `새로고침 트리거 (${position}px)`;
	// 		console.log('새로고침 트리거:', position);
			
	// 		// 3초 후 메시지 지우기
	// 		setTimeout(() => {
	// 			refreshMessage = '';
	// 		}, 3000);
	// 	});
		
	// 	// 컴포넌트 정리 함수 반환
	// 	return () => {
	// 		// 컴포넌트가 언마운트될 때 상태 저장
	// 		saveHomeState();
			
	// 		cleanup();
	// 		unsubscribeScroll();
	// 		unsubscribeScrollUp();
	// 		unsubscribeScrollDown();
	// 		unsubscribeRefresh();
	// 	};
	// });

	// 상태 관리
	let loading = $state(true);
	let reviews: ReviewItem[] = $state([]);
	let page = $state(1);
	let size = $state(20);
	let expandedTexts = $state<Record<string, boolean>>({});
	let activeTab = $state(0); // 활성 탭 인덱스 추가

	// 탭 정보
	const tabs = [
  { id: 'popularity', label: '인기', desc: '최근 3개월 동안 많은 사람들의 관심을 받은 리뷰를 모아 보여드려요.', emoji: '', view:'mv_place_review_popularity_for_3m_10k' },
  { id: 'hidden_gem', label: '발견', desc: '아직 많이 알려지지 않았지만, 품질 좋은 리뷰로 뽑힌 맛집을 찾아드려요.', emoji: '', view:'mv_place_review_hidden_gem_for_10k' },
//   { id: 'seasonal', label: '시즌', desc: '지금 계절에 딱 어울리는, 최근 2년간 계절별 인기 리뷰를 소개합니다.', emoji: '', view:'mv_place_review_seasonal_for_2y_10k' },
  { id: 'visit_count', label: '단골', desc: '여러 번 방문한 단골들이 남긴 신뢰도 높은 리뷰만 모아서 보여드려요.', emoji: '', view:'mv_place_review_regular_customer_for_10k' },
  { id: 'latest', label: '최신', desc: '가장 최근에 등록된 따끈한 리뷰들을 모았어요. 최신 트렌드를 놓치지 마세요.', emoji: '', view:'mv_place_review_popularity_for_3m_10k' },
  { id: 'my_liked', label: '좋아요', desc: '내가 "좋아요"를 누른 리뷰만 모아서 한 번에 볼 수 있도록 보여드려요.', emoji: '', view:'mv_place_review_my_liked_for_10k' },
]

	// 홈 페이지 상태 저장 함수
	function saveHomeState() {
		// homeState = {
		// 	reviews,
		// 	page,
		// 	scrollPosition: y,
		// 	activeTab,
		// 	type,
		// 	expandedTexts
		// };
		
		// console.log('홈 페이지 상태 저장');
		
		// try {
		// 	// 상태 저장 시 타임스탬프와 함께 저장 (나중에 상태의 신선도 확인용)
		// 	const stateWithMeta = {
		// 		data: homeState,
		// 		timestamp: new Date().getTime(),
		// 		source: 'homePageState'
		// 	};
			
		// 	// 세션스토리지만 사용 (모바일 성능 최적화)
		// 	sessionStorage.setItem('homeUIState', JSON.stringify(stateWithMeta));
			
		// 	console.log('홈 상태 저장 완료');
		// } catch (error) {
		// 	console.error('상태 저장 실패:', error);
		// }
	}
	
	// 홈 페이지 상태 복원 함수
	function restoreHomeState() {
		// try {
		// 	// 세션스토리지에서만 시도 (localStorage 접근 제거)
		// 	const savedStateJson = sessionStorage.getItem('homeUIState');
			
		// 	if (!savedStateJson) {
		// 		console.log('저장된 상태 없음: 새로운 데이터 로드 필요');
		// 		return false;
		// 	}
			
		// 	console.log('저장된 상태 발견');
			
		// 	const savedStateMeta = JSON.parse(savedStateJson);
		// 	const parsedState = savedStateMeta.data;
		// 	const timestamp = savedStateMeta.timestamp;
			
		// 	// 타임스탬프 확인 (5분 이상 지난 데이터는 신선하지 않은 것으로 간주 - 시간 단축)
		// 	const now = new Date().getTime();
		// 	const isStale = now - timestamp > 5 * 60 * 1000; // 5분
			
		// 	if (isStale) {
		// 		console.log('저장된 상태가 오래됨 (5분 초과)');
		// 		sessionStorage.removeItem('homeUIState');
		// 		return false;
		// 	}
			
		// 	console.log('저장된 상태 복원 중');
			
		// 	// 필요한 상태들 복원
		// 	reviews = parsedState.reviews || [];
		// 	page = parsedState.page || 1;
		// 	activeTab = parsedState.activeTab ?? 0;
		// 	type = parsedState.type || 'popularity';
		// 	expandedTexts = parsedState.expandedTexts || {};
			
		// 	// 스크롤 위치 복원
		// 	if (scrollableArea && parsedState.scrollPosition) {
		// 		console.log('스크롤 위치 복원 예정:', parsedState.scrollPosition);
		// 		// RAF를 사용하여 DOM 업데이트 후 스크롤 적용 (setTimeout 추가로 안정성 향상)
		// 		setTimeout(() => {
		// 			requestAnimationFrame(() => {
		// 				if (scrollableArea) {
		// 					console.log('스크롤 위치 복원 실행');
		// 					scrollableArea.scrollTop = parsedState.scrollPosition;
		// 				}
		// 			});
		// 		}, 0);
		// 	}
			
		// 	// 복원 후 상태 제거 (중요: 일회성 사용 보장)
		// 	sessionStorage.removeItem('homeUIState');
		// 	console.log('저장된 상태 복원 및 삭제 완료');
			
		// 	return true;
		// } catch (error) {
		// 	console.error('상태 복원 실패:', error);
		// 	sessionStorage.removeItem('homeUIState');
		// }
		
		// return false;
	}

	// 탭 변경 함수
	function handleTabChange(index: number) {
		activeTab = index;
		type = tabs[activeTab].id;
		page = 1;
		reviews = [];
		hasNextReview = false;
		loadReviews(page, size, type);
		
		// 스크롤을 맨 위로 이동
		scrollManager.scrollToTop('auto');
	}

	// 날짜 포맷팅 함수
	function formatDate(dateString: string): string {
		if (!dateString) return '';

		const year = dateString.substring(0, 4);
		const month = dateString.substring(4, 6);
		const day = dateString.substring(6, 8);

		return `${year}.${month}.${day}`;
	}

	// 텍스트 자르기 함수

	// 텍스트 확장/축소 토글
	function toggleExpandText(reviewId: string): void {
		expandedTexts[reviewId] = !expandedTexts[reviewId];
		expandedTexts = { ...expandedTexts };
	}

	let reviewTotalCount = $state(-1);
	interface Pagination {
		page: number;
		size: number;
		type: string;
	}
	
	// 페이지네이션 객체 생성
	let pagination: Pagination = {
		page: page || 1,
		size: size || 20,
		type: type || 'latest'
	};
	// 리뷰 데이터 로드
	async function loadReviews(item: Pagination): Promise<void> {
		try {
			loading = true;
			// Supabase 서비스를 사용하여 리뷰 데이터 가져오기
			// const response = await reviewService.getReviewList2({
			// 	page: currentPage,
			// 	size: pageSize,
			// 	type: type,
			// });
			const response: AdvancedStatsPlace[] = await repository?.getRecommendedPlaces(item.page, item.size) ?? [];
			hasNextReview = response?.length === item.size;

			console.log(hasNextReview,response?.length,item.size);
			console.log('리뷰 샘플:', response[0]);
			// reviews = response as ReviewItem[];
			if (item.page === 1) {
				reviews = response as ReviewItem[];
			} else {
				reviews = [...reviews, ...response] as ReviewItem[];
			}

			if (hasNextReview) {
				pagination.page += 1;
			}

			// reviews = [...reviews, ...newReviews];

			// if (reviewTotalCount === -1) {
			// 	reviewTotalCount = await repository?.getTableRowCount() ?? -99;
			// }
			
			// if (response && response.result && Array.isArray(response.result.rows)) {
			// 	reviews = response.result.rows as PopularReview[];
			// 	hasNextReview = response.result.rows.length !== size;
			// 	console.log(`hasNextReview: ${hasNextReview}`);

			// 	// 초기 expandedTexts 세팅
			// 	const initialExpandedState: Record<string, boolean> = {};
			// 	reviews.forEach((review: PopularReview) => {
			// 		initialExpandedState[review.id] = false;
			// 	});
			// 	expandedTexts = initialExpandedState;
			// }
		} catch (error) {
			console.error('리뷰 데이터 로드 실패:', error);
		} finally {
			loading = false;
		}
	}

	// 카테고리에 맞는 배경색 반환

	// 주소를 태그로 변환


	// 장소 상세 페이지로 이동 (팝업 사용 대신 URL 이동 방식으로 변경)
	function goToPlaceDetail(businessId: string): void {
		console.log('장소 상세 페이지로 이동:', businessId);
		
		// 현재 홈 페이지 상태 저장 (상세 페이지로 이동 전)
		saveHomeState();
		
		// 현재 보고 있는 컨텐츠 ID 저장
		try {
			localStorage.setItem('currentViewingContentId', businessId);
			console.log('현재 보는 컨텐츠 ID 저장:', businessId);
		} catch (e) {
			console.error('ID 저장 오류:', e);
		}
		
		// 상태 정보 준비
		const state = { 
			fromHome: true, 
			hasHomeState: true,
			businessId,
			savedAt: new Date().getTime()
		};
		
		// SPA 라우터 사용하여 이동 (state 옵션 사용)
		try {
			goto(`/place/${businessId}`, { state });
			console.log('라우터로 이동 완료, 상태 정보:', state);
		} catch (e) {
			// 오류 발생 시 대체 방법으로 이동
			console.error('라우터 사용 오류:', e);
			location.href = `/place/${businessId}`;
		}
	}

	// 네이버 장소 링크로 이동

	// 추가 리뷰 데이터 로드
	async function loadMoreReviewsData(): Promise<void> {
		try {
			loading = true;
			const response = await reviewService.getReviewList2({
				page: page,
				size: size,
				type: type,
			});

			if (response && response.result && Array.isArray(response.result.rows)) {
				const newReviews = response.result.rows as ReviewItem[];

				// 새 리뷰에 대한 expandedTexts 세팅
				const newExpandedState: Record<string, boolean> = { ...expandedTexts };
				newReviews.forEach((review: ReviewItem) => {
					newExpandedState[review.id] = false;
				});
				expandedTexts = newExpandedState;

				// 리뷰 데이터 병합
				reviews = [...reviews, ...newReviews];
				hasNextReview = newReviews.length !== size;
			}
		} catch (error) {
			console.error('추가 리뷰 데이터 로드 실패:', error);
		} finally {
			loading = false;
		}
	}

	// 더 많은 리뷰 로드
	function loadMoreReviews(): void {
		if (loading || hasNextReview === false) return;

		// page += 1;
		loadReviews(pagination);
	}

	// 스크롤 이벤트 핸들러
	let isScrollListenerAdded = false;

	function handleScroll(): void {
		// if (loading || hasNextReview) return;

		// if (!scrollableArea) return;

		// const { scrollTop, scrollHeight, clientHeight } = scrollableArea;

		// // 스크롤이 하단에 가까워지면 추가 데이터 로드
		// if (scrollTop + clientHeight >= scrollHeight - 300) {
		// 	loadMoreReviews();
		// }
	}

	$effect(() => {
		// if (scrollableArea && !isScrollListenerAdded) {
		// 	scrollableArea.addEventListener('scroll', handleScroll);
		// 	isScrollListenerAdded = true;
		// }
	});

	// 네비게이션 타입 감지 함수
	function detectNavigationType(): { isBackNavigation: boolean; source: string; isDirectNavigation: boolean } {
		return { isBackNavigation: false, source: 'unknown', isDirectNavigation: true };
	}

	// 컴포넌트 마운트 시 실행
	onMount(async () => {
		console.log('onMount: 홈 페이지 로드 시작');
		
		try {
			// 리포지토리 초기화 및 데이터 로드
			repository = await AdvancedStatsPlacesRepository.getInstance();
			// const count = await repository.getTableRowCount();
			// console.log('전체 리뷰 수:', count);
			// const reviews = await repository.getTableSample(10);
			// console.log('리뷰 샘플:', reviews[0]);
			
			// 리뷰 데이터 로드
			loadReviews({page:1, size:20, type:'latest'});
		} catch (error) {
			console.error('데이터 로드 실패:', error);
		}
	});

	$inspect(hasNextReview)

	// 컨텐츠 아이템 클릭 핸들러
	function handleContentClick(id: string) {
		console.log('content clicked:', id);
		
		// 클릭한 아이템의 ID 저장 (뒤로가기 감지 시 사용)
		try {
			// 세션스토리지만 사용 (모바일 최적화)
			sessionStorage.setItem('lastClickedContentId', id);
		} catch (e) {
			console.error('ID 저장 오류:', e);
		}

		// 상태 저장 (모바일에서 성능 최적화를 위해 필수 정보만)
		saveHomeState();

		// 라우터로 페이지 이동
		goto(`/place/${id}`, {
			state: {
				fromHome: true,
				hasHomeState: true,
				timestamp: new Date().getTime()
			}
		});
	}
</script>

<!-- 상단 고정 헤더 -->
<!-- <header class="fixed top-0 right-0 left-0 z-50 border-b border-gray-200 bg-white shadow-xs">
	<div class="mx-auto max-w-lg px-4 py-3">
		<div class="flex items-center justify-between">
			<h1 class="text-lg font-bold text-gray-900">맛집 리뷰</h1>
		</div>
	</div> -->

	<!-- 탭 네비게이션 추가 -->
	<!-- <div class="border-b border-gray-200 bg-white">
		<div class="mx-auto max-w-lg px-4">
			<div class="flex space-x-1">
				{#each tabs as tab, index}
					<button
						class="relative flex-1 border-b-2 py-3 text-sm font-medium whitespace-nowrap transition-colors
						{activeTab === index
							? 'border-blue-500 text-blue-600'
							: 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'}"
						onclick={() => changeTab(index)}
					>
						{tab.label}
					</button>
				{/each}
			</div>
		</div>
	</div> -->
<!-- </header> -->

<!-- 메인 콘텐츠 영역 -->
<div class="scroll-container" bind:this={scrollableArea}>
	<!-- <div class=""></div> -->
	<!-- 새로고침 메시지 -->
	<!-- {#if refreshMessage}
		<div class="fixed top-0 left-0 right-0 bg-blue-500 text-white p-2 text-center z-50">
			{refreshMessage}
		</div>
	{/if} -->

	<!-- 사이드바 -->
	<!-- {#if showSidebar}
		<div class="fixed inset-0 bg-black bg-opacity-50 z-40" onclick={toggleSidebar}></div>
		<div class="fixed left-0 top-0 h-full w-80 bg-white shadow-lg z-50 transition-transform duration-300 transform translate-x-0">
			<ProfileSidebar on:close={toggleSidebar} />
		</div>
	{:else}
		<div class="fixed left-0 top-0 h-full w-80 bg-white shadow-lg z-50 transition-transform duration-300 transform -translate-x-full">
			<ProfileSidebar on:close={toggleSidebar} />
		</div>
	{/if}
	 -->
	<!--     display: flex;
    max-width: 700px;
    margin: 0 auto;
    padding: 0;
    position: relative; -->
	<!-- 헤더와 탭 -->
	<div class="fixed top-0 left-0 right-0 z-30 transition-transform duration-300 ease-in-out bg-white mx-auto max-w-2xl" 
		 style="transform: translateY({showNav ? '0' : '-100%'})">
		<Header on:profileClick={toggleSidebar} />
		<Tabs tabs={tabs} activeTab={activeTab} onChange={handleTabChange} />
	</div>

	<div class="mx-auto max-w-lg px-0 py-4 pt-30 pb-45 sm:px-4">
	<!-- <div class="mx-auto max-w-lg px-0 py-4 pt-30 pb-[65px] sm:px-4"> -->
		<!-- 상단 여백 조정 -->
		 <!-- 탭 설명 박스 -->
		 <div class="mb-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
			<div class="flex items-center gap-2 text-gray-700">
				<span class="text-lg">💡</span>
				<p class="text-sm font-medium">{tabs[activeTab].desc}</p>
			</div>
		</div>
		
		{#if loading && reviews.length === 0}
			<Indicator text="" />
			<!-- <div class="flex justify-center p-16">
				<div
					class="h-12 w-12 animate-spin rounded-full border-t-4 border-b-4 border-blue-500"
				></div>
			</div> -->
		{:else if reviews.length === 0}
			<div class="py-16 text-center">
				<p class="text-lg text-gray-500">리뷰가 없습니다.</p>
			</div>
		{:else}
			<div class="smx-auto max-w-2xl">
				{#each reviews as review}
					<AdvancedStatsPlacesCard place={review} />
					<!-- <ReviewCard
						{review}
						isExpanded={expandedTexts[review.id] || false}
						onToggleExpand={() => toggleExpandText(review.id)}
						onPlaceClick={() => goToPlaceDetail(review.business_id)}
						{formatDate}
					/> -->
				{/each}
			</div>

			<!-- 로딩 인디케이터 (더 로드 중일 때) -->
			{#if loading && reviews.length > 0}
				<div class="flex justify-center py-6">
					<div
						class="h-8 w-8 animate-spin rounded-full border-t-2 border-b-2 border-blue-500"
					></div>
				</div>
			{/if}

			<!-- 모든 리뷰를 로드했을 때 표시 -->
			{#if !loading && reviews.length > 0 && hasNextReview === false}
				<div class="py-6 text-center">
					<p class="text-gray-500">모든 리뷰를 불러왔습니다.</p>
				</div>
			{/if}

			<!-- 더 보기 버튼 -->
			{#if !loading && reviews.length > 0 && hasNextReview}
				<div class="flex justify-center py-4">
					<button
						class="cursor-pointer flex items-center gap-2 rounded-full bg-white px-6 py-2 text-gray-700 shadow-xs transition-shadow hover:text-gray-900 hover:shadow-md"
						onclick={loadMoreReviews}
					>
						<span>더 보기</span>
						<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M19 9l-7 7-7-7"
							/>
						</svg>
					</button>
				</div>
			{:else if loading && reviews.length > 0}
				<!-- <div class="flex justify-center py-4">
					<button
						class="flex cursor-not-allowed items-center gap-2 rounded-full bg-white px-6 py-2 text-gray-400 shadow-xs"
						disabled
					>
						<span>로딩 중...</span>
						<div
							class="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-transparent"
						></div>
					</button>
				</div> -->
				<Indicator text="리뷰를 불러오는 중..." />
			{:else if hasNextReview}
				<div class="flex justify-center py-4">
					<span class="text-sm text-gray-400">더 이상 표시할 항목이 없습니다.</span>
				</div>
			{/if}
		{/if}
	</div>
</div>

<!-- 장소 상세 팝업 컴포넌트 추가 -->
<!-- <PlaceDetailPopup 
	showPopup={detailPopupService.showDetailPopup} 
	placeId={detailPopupService.selectedPlaceId}
	onClose={() => detailPopupService.closeDetailPopup()}
>
	{#snippet children()}
	
			{#if detailPopupService.selectedPlaceId}
				<Detail 
					placeId={detailPopupService.selectedPlaceId} 
					onClose={() => detailPopupService.closeDetailPopup()} 
				/>
			{/if}
		
	{/snippet}
</PlaceDetailPopup> -->

<style>
	/* 스크롤바 숨기기 */
	.scrollbar-hide {
		-ms-overflow-style: none; /* IE and Edge */
		scrollbar-width: none; /* Firefox */
	}
	.scrollbar-hide::-webkit-scrollbar {
		display: none; /* Chrome, Safari, Opera */
	}
</style>
