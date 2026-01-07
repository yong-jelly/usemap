<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '@mateothegreat/svelte5-router';
	import apiClient from '../../services/client.fetch';
	import { formatWithCommas } from '$utils/number.util';
	import { reviewService } from '$services/review.service';
	import ReviewCard from './components/ReviewCard.svelte';
	import Indicator from '$lib/components/Indicator.svelte';

	// 리뷰 데이터 인터페이스
	interface ReviewResponse {
		epoch: number;
		meta: {
			page: number;
			size: number;
			max_limit_days: number;
			max_limit_date: string;
			total: number;
		};
		result: {
			rows: ReviewItem[];
		};
	}

	interface ReviewItem {
		id: string;
		business_id: string;
		business_name: string;
		rating: number | null;
		common_address: string;
		category: string;
		visitor_review_score: number | null;
		visitor_review_count: number;
		author_nickname: string;
		body: string;
		media: string[] | null;
		visit_count: number;
		visited: string;
		created: string;
	}

	// 수정: API 응답에 대한 타입 가드 함수 추가
	function isValidReviewResponse(response: any): response is ReviewResponse {
		return (
			response &&
			typeof response === 'object' &&
			response.result &&
			typeof response.result === 'object' &&
			'rows' in response.result &&
			Array.isArray(response.result.rows)
		);
	}

	// 상태 관리
	let loading = $state(true);
	let reviews: ReviewItem[] = $state([]);
	let page = $state(1);
	let size = $state(20);
	let totalReviews = $state(0);
	let expandedTexts = $state<Record<string, boolean>>({});
	let activeTab = $state(0); // 활성 탭 인덱스 추가

	// 탭 정보
	const tabs = [
		{ id: 'all', label: '모든 리뷰', param: 'type=all' },
		{ id: 'popular', label: '인기 리뷰', param: 'type=popular' },
		{ id: 'nearby', label: '근처 리뷰', param: 'type=nearby' },
	];

	// 탭 변경 함수
	function changeTab(tabIndex: number): void {
		if (activeTab === tabIndex) return;

		activeTab = tabIndex;
		page = 1;
		reviews = [];
		loadReviews(page, size);
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
	function truncateText(text: string, maxLength: number = 100): string {
		if (!text) return '';
		if (text.length <= maxLength) return text;

		return text.slice(0, maxLength) + '...';
	}

	// 텍스트 확장/축소 토글
	function toggleExpandText(reviewId: string): void {
		expandedTexts[reviewId] = !expandedTexts[reviewId];
		expandedTexts = { ...expandedTexts };
	}

	// 리뷰 데이터 로드
	async function loadReviews(currentPage: number = 1, pageSize: number = 20): Promise<void> {
		try {
			loading = true;
			const tabParam = tabs[activeTab].param; // 선택된 탭의 파라미터 가져오기
			const response = await reviewService.getReviewList({
				page: currentPage,
				size: pageSize,
				// params: tabParam,
			});
			// await apiClient.get<any>(
			// 	`http://43.201.6.117:3003/upvote/place/review/${currentPage}?size=${pageSize}&${tabParam}`,
			// 	{},
			// 	true, // 외부 API URL 사용
			// );

			if (isValidReviewResponse(response)) {
				reviews = response.result.rows;
				totalReviews = response.meta.total;

				// 초기 expandedTexts 세팅
				const initialExpandedState: Record<string, boolean> = {};
				reviews.forEach((review: ReviewItem) => {
					initialExpandedState[review.id] = false;
				});
				expandedTexts = initialExpandedState;
			}
		} catch (error) {
			console.error('리뷰 데이터 로드 실패:', error);
		} finally {
			loading = false;
		}
	}

	// 카테고리에 맞는 배경색 반환
	const categoryColors: Record<string, string> = {
		한식: 'bg-red-500',
		중식: 'bg-yellow-600',
		일식: 'bg-indigo-500',
		양식: 'bg-green-600',
		카페: 'bg-brown-500',
		분식: 'bg-orange-500',
		고기: 'bg-red-600',
		'찌개,전골': 'bg-rose-600',
		국수: 'bg-cyan-600',
		해산물: 'bg-blue-600',
		돼지고기구이: 'bg-rose-600',
		소고기구이: 'bg-red-700',
		치킨: 'bg-yellow-500',
		피자: 'bg-orange-600',
		패스트푸드: 'bg-red-500',
		디저트: 'bg-pink-500',
		베이커리: 'bg-amber-600',
		아시안: 'bg-green-500',
		기타: 'bg-gray-500',
	};

	// 주소를 태그로 변환
	function getAddressTags(address: string): string[] {
		if (!address) return [];
		return address.split(' ').filter((tag) => tag.trim() !== '');
	}

	function getCategoryColor(category: string): string {
		return categoryColors[category] || 'bg-gray-500';
		// if (!category) return 'bg-gray-500';

		// for (const key in categoryColors) {
		// 	if (category.includes(key)) {
		// 		return categoryColors[key];
		// 	}
		// }
		// return 'bg-gray-500';
	}

	// 장소 상세 페이지로 이동
	function goToPlaceDetail(businessId: string): void {
		goto(`/place/${businessId}`);
	}

	// 네이버 장소 링크로 이동
	function goToNaverPlace(businessId: string): void {
		// window.open(`https://pcmap.place.naver.com/restaurant/1490720990/home/${businessId}`, '_blank');
		window.open(`https://map.naver.com/p/entry/place/${businessId}`, '_blank');
	}

	// 추가 리뷰 데이터 로드
	async function loadMoreReviewsData(): Promise<void> {
		try {
			loading = true;
			const tabParam = tabs[activeTab].param; // 선택된 탭의 파라미터 가져오기
			const response = await reviewService.getReviewList({
				page: page,
				size: size,
				params: tabParam,
			});

			if (isValidReviewResponse(response)) {
				const newReviews = response.result.rows;

				// 새 리뷰에 대한 expandedTexts 세팅
				const newExpandedState: Record<string, boolean> = { ...expandedTexts };
				newReviews.forEach((review: ReviewItem) => {
					newExpandedState[review.id] = false;
				});
				expandedTexts = newExpandedState;

				// 리뷰 데이터 병합
				reviews = [...reviews, ...newReviews];
			}
		} catch (error) {
			console.error('추가 리뷰 데이터 로드 실패:', error);
		} finally {
			loading = false;
		}
	}

	// 더 많은 리뷰 로드
	function loadMoreReviews(): void {
		if (loading || reviews.length >= totalReviews) return;

		page += 1;
		loadMoreReviewsData();
	}

	// 스크롤 이벤트 핸들러
	let isScrollListenerAdded = false;
	let scrollContainer: HTMLElement;

	function handleScroll(): void {
		if (loading || reviews.length >= totalReviews) return;

		const { scrollTop, scrollHeight, clientHeight } = scrollContainer;

		// 스크롤이 하단에 가까워지면 추가 데이터 로드
		if (scrollTop + clientHeight >= scrollHeight - 300) {
			loadMoreReviews();
		}
	}

	$effect(() => {
		if (scrollContainer && !isScrollListenerAdded) {
			scrollContainer.addEventListener('scroll', handleScroll);
			isScrollListenerAdded = true;
		}
	});

	// 컴포넌트 마운트 시 리뷰 데이터 가져오기
	onMount(() => {
		loadReviews(page, size);
	});
</script>

<!-- 상단 고정 헤더 -->
<header class="fixed top-0 right-0 left-0 z-50 border-b border-gray-200 bg-white shadow-xs">
	<div class="mx-auto max-w-lg px-4 py-3">
		<div class="flex items-center justify-between">
			<h1 class="text-lg font-bold text-gray-900">맛집 리뷰</h1>
		</div>
	</div>

	<!-- 탭 네비게이션 추가 -->
	<div class="border-b border-gray-200 bg-white">
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
	</div>
</header>

<!-- 메인 콘텐츠 영역 -->
<div class="min-h-screen bg-gray-100" bind:this={scrollContainer}>
	<div class="mx-auto max-w-lg px-0 py-4 pt-28 sm:px-4">
		<!-- 상단 여백 조정 -->
		{#if loading && reviews.length === 0}
			<!-- <div class="flex justify-center p-16">
				<div
					class="h-12 w-12 animate-spin rounded-full border-t-4 border-b-4 border-blue-500"
				></div>
			</div> -->
			<Indicator text="리뷰를 불러오는 중..." />
		{:else if reviews.length === 0}
			<div class="py-16 text-center">
				<p class="text-lg text-gray-500">리뷰가 없습니다.</p>
			</div>
		{:else}
			<div>
				{#each reviews as review}
					<ReviewCard
						{review}
						isExpanded={expandedTexts[review.id] || false}
						onToggleExpand={() => toggleExpandText(review.id)}
						onPlaceClick={() => goToPlaceDetail(review.business_id)}
						{formatDate}
					/>
				{/each}
			</div>

			<!-- 로딩 인디케이터 (더 로드 중일 때) -->
			{#if loading && reviews.length > 0}
				<Indicator text="리뷰를 불러오는 중..." />
				<!-- <div class="flex justify-center py-6">
					<div
						class="h-8 w-8 animate-spin rounded-full border-t-2 border-b-2 border-blue-500"
					></div>
				</div> -->
			{/if}

			<!-- 모든 리뷰를 로드했을 때 표시 -->
			{#if !loading && reviews.length >= totalReviews && reviews.length > 0}
				<div class="py-6 text-center">
					<p class="text-gray-500">모든 리뷰를 불러왔습니다.</p>
				</div>
			{/if}

			<!-- 더 보기 버튼 -->
			{#if !loading && reviews.length > 0 && reviews.length < totalReviews}
				<div class="flex justify-center py-4">
					<button
						class="flex items-center gap-2 rounded-full bg-white px-6 py-2 text-gray-700 shadow-xs transition-shadow hover:text-gray-900 hover:shadow-md"
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
				<div class="flex justify-center py-4">
					<button
						class="flex cursor-not-allowed items-center gap-2 rounded-full bg-white px-6 py-2 text-gray-400 shadow-xs"
						disabled
					>
						<span>로딩 중...</span>
						<div
							class="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-transparent"
						></div>
					</button>
				</div>
			{:else if reviews.length >= totalReviews && reviews.length > 0}
				<div class="flex justify-center py-4">
					<span class="text-sm text-gray-400">더 이상 표시할 항목이 없습니다.</span>
				</div>
			{/if}
		{/if}
	</div>
</div>

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
