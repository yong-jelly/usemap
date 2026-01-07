<script lang="ts">
	import { onMount } from 'svelte';
	import FeedHeader from './components/FeedHeader.svelte';
	import RestaurantRecommendCard from './components/feed-cards/RestaurantRecommendCard.svelte';
	import YoutubeRecommendCard from './components/feed-cards/YoutubeRecommendCard.svelte';
	import StatsCard from './components/feed-cards/StatsCard.svelte';
	import ChallengeCard from './components/feed-cards/ChallengeCard.svelte';
	import MyActivityStatsCard from './components/feed-cards/MyActivityStatsCard.svelte';
	import MyRestaurantList from './components/feed-cards/MyRestaurantList.svelte';
	import MyPreferencesChart from './components/feed-cards/MyPreferencesChart.svelte';
	import NationalStatsCard from './components/feed-cards/NationalStatsCard.svelte';
	import MyVisitRatioCard from './components/feed-cards/MyVisitRatioCard.svelte';
	import MyVisitAnalysisCard from './components/feed-cards/MyVisitAnalysisCard.svelte';
	import MyReviewsCard from './components/feed-cards/MyReviewsCard.svelte';
	import { supabase } from '$lib/supabase';
	import type { UserPlacesStatsBucket, UserReviewAnalysisData } from '$services/types';
	import { placePopupStore } from '$lib/stores/place-popup.store.svelte';
	// import type { RecommendationStatsBucket } from '$services/types';
	onMount(async () => {
		const { data, error: rpcError } = await supabase.rpc('v1_aggr_combine_user_places', {
			recreation: false,
			// p_user_id: 'dfb418b6-9afb-4aa7-8346-512c4d42acb7',
		});
		bucket = data[0] as unknown as UserPlacesStatsBucket;
		const { data: reviewData, error: reviewError } = await supabase.rpc(
			'v1_aggr_review_user_places',
		);
		reviewBucket = reviewData as UserReviewAnalysisData;
		isMyReviewsLoading = false;
		// console.log(reviewBucket);
		// console.log(bucket);
		// console.log(data.bucket_data_jsonb);
	});
	let bucket = $state<UserPlacesStatsBucket>();
	let reviewBucket = $state<UserReviewAnalysisData>();
	// $inspect(reviewBucket);
	// $inspect(bucket);
	// 피드 아이템 타입 정의
	interface FeedItem {
		id: string;
		type:
			| 'restaurant'
			| 'youtube'
			| 'stats'
			| 'challenge'
			| 'community'
			| 'my_activity'
			| 'my_restaurants'
			| 'my_preferences'
			| 'national_stats'
			| 'visit_ratio'
			| 'visit_analysis'
			| 'my_reviews';
		timestamp: string;
		data: any;
	}

	let isLoading = $state(false);
	let isMyReviewsLoading = $state(true);
	let feedItems = $state<FeedItem[]>([]);
	let filteredItems = $state<FeedItem[]>([]);
	let currentTab = $state('all');

	function clickReviewPlace(placeId: string) {
		console.log('[clickReviewPlace]', placeId);
		placePopupStore.show(placeId);
	}

	// 하드코딩된 피드 데이터
	const mockFeedData: FeedItem[] = [
		{
			id: '7',
			type: 'my_activity',
			timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
			data: {
				id: 'my_act_1',
				period: '지난 7일',
				weeklyStats: {
					likes: 15,
					visits: 8,
					saves: 12,
					recommendations: 3,
					reviews: 5,
					views: 24,
				},
				previousWeekStats: {
					likes: 12,
					visits: 6,
					saves: 9,
					recommendations: 2,
					reviews: 3,
					views: 18,
				},
				totalStats: {
					likes: 156,
					visits: 89,
					saves: 134,
					recommendations: 23,
					reviews: 45,
					views: 267,
				},
				timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
			},
		},
		{
			id: '9',
			type: 'my_preferences',
			timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
			data: {
				id: 'my_pref_1',
				title: '내 음식 취향 분석',
				period: '최근 30일',
				regionPreferences: [
					{ name: '서울', likes: 15, saves: 8, visits: 12, total: 35 },
					{ name: '제주', likes: 8, saves: 12, visits: 5, total: 25 },
					{ name: '부산', likes: 6, saves: 4, visits: 8, total: 18 },
					{ name: '대전', likes: 3, saves: 2, visits: 3, total: 8 },
					{ name: '광주', likes: 1, saves: 1, visits: 2, total: 4 },
					{ name: '대구', likes: 2, saves: 1, visits: 1, total: 4 },
				],
				categoryPreferences: [
					{ name: '한식', likes: 12, saves: 8, visits: 10, total: 30 },
					{ name: '일식', likes: 8, saves: 6, visits: 7, total: 21 },
					{ name: '중식', likes: 5, saves: 4, visits: 6, total: 15 },
					{ name: '양식', likes: 4, saves: 3, visits: 5, total: 12 },
					{ name: '해산물', likes: 3, saves: 5, visits: 2, total: 10 },
					{ name: '카페', likes: 2, saves: 2, visits: 1, total: 5 },
					{ name: '분식', likes: 1, saves: 1, visits: 2, total: 4 },
				],
				summary: {
					totalActivities: 97,
					topRegion: '서울',
					topCategory: '한식',
					mostLikedRegion: '서울',
					mostVisitedCategory: '한식',
				},
				timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
			},
		},
		{
			id: '11',
			type: 'visit_ratio',
			timestamp: new Date(Date.now() - 7 * 60 * 60 * 1000).toISOString(),
			data: {
				id: 'ratio-1',
				title: '내 방문 실행력 분석??',
				period: '전체 기간',
				totalRecommendedRestaurants: 1240,
				myLikedRestaurants: 89,
				mySavedRestaurants: 67,
				myVisitedRestaurants: 45,
				visitedFromLiked: 52,
				visitedFromSaved: 41,
				visitedFromRecommended: 45,
				insights: [
					'북마크한 곳을 더 잘 방문하는 편 (61.2%)',
					'좋아요한 곳 방문률은 58.4%로 평균적',
					'전체 추천 대비 방문률 3.6%는 낮은 편',
					'실행력 점수 59.8점으로 개선 여지 있음',
				],
				timestamp: new Date(Date.now() - 7 * 60 * 60 * 1000).toISOString(),
			},
		},
		{
			id: '12',
			type: 'visit_analysis',
			timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
			data: {
				id: 'analysis-1',
				title: '방문 후 만족도 분석',
				period: '전체 기간',
				myVisitedRestaurants: 45,
				likedFromVisited: 32,
				savedFromVisited: 28,
				totalRecommendedRestaurants: 1240,
				visitedFromTotal: 45,
				averageUserVisitRate: 4.2,
				insights: [
					'방문 후 좋아요 비율 71.1%로 만족도 높음',
					'방문 후 저장 비율 62.2%로 재방문 의향 높음',
					'전체 추천 대비 방문률 3.6%는 평균 이하',
					'방문한 곳은 대부분 만족하지만 도전 정신 부족',
					'새로운 곳 방문을 늘리면 더 많은 발견 가능',
				],
				timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
			},
		},
		{
			id: '13',
			type: 'my_reviews',
			timestamp: new Date(Date.now() - 9 * 60 * 60 * 1000).toISOString(),
			data: {
				id: 'reviews-1',
				title: '내가 작성한 리뷰 분석',
				period: '전체 기간',
				stats: {
					totalReviews: 23,
					averageRating: 4.2,
					ratingDistribution: {
						5: 8,
						4: 9,
						3: 4,
						2: 2,
						1: 0,
					},
					topFeelings: [
						{ id: '1', name: '맛 최고', count: 12, percentage: 52 },
						{ id: '2', name: '또 오고싶음', count: 10, percentage: 43 },
						{ id: '3', name: '분위기 최고', count: 8, percentage: 35 },
						{ id: '4', name: '가족과', count: 6, percentage: 26 },
						{ id: '5', name: '지역 주민 추천', count: 5, percentage: 22 },
						{ id: '6', name: '자주 방문', count: 4, percentage: 17 },
						{ id: '7', name: '여자친구랑', count: 3, percentage: 13 },
						{ id: '8', name: '혼밥', count: 2, percentage: 9 },
						{ id: '9', name: '분위기 별로', count: 1, percentage: 4 },
					],
					categoryBreakdown: [
						{ category: '한식', count: 8, averageRating: 4.5 },
						{ category: '일식', count: 5, averageRating: 4.2 },
						{ category: '카페', count: 4, averageRating: 4.0 },
						{ category: '양식', count: 3, averageRating: 3.8 },
						{ category: '중식', count: 2, averageRating: 4.3 },
						{ category: '치킨', count: 1, averageRating: 3.0 },
					],
					monthlyTrend: [],
				},
				recentReviews: [
					{
						restaurantName: '강남 한정식집',
						category: '한식',
						rating: 5,
						feelings: ['맛 최고', '가족과', '또 오고싶음'],
						content:
							'가족과 함께 방문했는데 정말 맛있었어요. 특히 갈비찜이 부드럽고 양념이 잘 배어있어서 최고였습니다. 다음에 또 올게요!',
						date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
					},
					{
						restaurantName: '이태원 스시야',
						category: '일식',
						rating: 4,
						feelings: ['분위기 최고', '여자친구랑'],
						content:
							'분위기가 정말 좋고 스시도 신선했어요. 가격은 좀 비싸지만 특별한 날에 가기 좋은 곳입니다.',
						date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
					},
					{
						restaurantName: '홍대 파스타집',
						category: '양식',
						rating: 3,
						feelings: ['혼밥'],
						content: '혼자 가기 좋은 곳이에요. 파스타는 평범했지만 분위기는 괜찮았습니다.',
						date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
					},
					{
						restaurantName: '신촌 카페',
						category: '카페',
						rating: 4,
						feelings: ['분위기 최고', '자주 방문'],
						content: '커피맛도 좋고 공부하기 좋은 환경이에요. 자주 올 것 같습니다.',
						date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
					},
					{
						restaurantName: '종로 중식당',
						category: '중식',
						rating: 5,
						feelings: ['맛 최고', '지역 주민 추천', '또 오고싶음'],
						content: '현지인이 추천해준 곳인데 정말 맛있었어요! 짜장면이 진짜 최고입니다.',
						date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
					},
				],
				insights: [
					'평균 별점 4.2점으로 대체로 만족스러운 리뷰 작성',
					'맛 최고(52%)와 또 오고싶음(43%)을 가장 많이 선택',
					'한식에 대한 평가가 가장 높음 (평균 4.5점)',
					'부정적 느낌 선택은 4%로 매우 낮음',
					'가족과 함께하는 식사를 선호하는 편',
				],
				timestamp: new Date(Date.now() - 9 * 60 * 60 * 1000).toISOString(),
			},
		},
	];

	// 탭 변경 핸들러
	function handleTabChange(tabId: string) {
		currentTab = tabId;
		applyFilter();
	}

	// 필터 적용
	function applyFilter() {
		if (currentTab === 'all') {
			filteredItems = [...feedItems];
		} else if (currentTab === 'recommended') {
			filteredItems = feedItems.filter(
				(item) => item.type === 'restaurant' || item.type === 'youtube',
			);
		} else if (currentTab === 'trending') {
			filteredItems = feedItems.filter(
				(item) => item.type === 'restaurant' && item.data.recommendation?.type === 'trending',
			);
		} else if (currentTab === 'stats') {
			filteredItems = feedItems.filter(
				(item) =>
					item.type === 'stats' ||
					item.type === 'my_activity' ||
					item.type === 'my_restaurants' ||
					item.type === 'my_preferences' ||
					item.type === 'national_stats' ||
					item.type === 'visit_ratio' ||
					item.type === 'visit_analysis' ||
					item.type === 'my_reviews',
			);
		} else if (currentTab === 'challenges') {
			filteredItems = feedItems.filter((item) => item.type === 'challenge');
		}
	}

	// 무한 스크롤 시뮬레이션
	function loadMoreItems() {
		return;
		if (isLoading) return;

		isLoading = true;

		// 실제로는 API 호출
		setTimeout(() => {
			const newItems = mockFeedData.slice(0, 2).map((item, index) => ({
				...item,
				id: item.id + '_' + Date.now() + '_' + index,
				timestamp: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString(),
			}));

			feedItems = [...feedItems, ...newItems];
			applyFilter();
			isLoading = false;
		}, 1000);
	}

	// 스크롤 이벤트 처리
	function handleScroll() {
		if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 1000) {
			loadMoreItems();
		}
	}

	onMount(() => {
		// 초기 데이터 로드
		feedItems = [...mockFeedData];
		applyFilter();

		// 스크롤 이벤트 리스너 등록
		window.addEventListener('scroll', handleScroll);

		// 페이지 상단으로 스크롤
		setTimeout(() => {
			window.scrollTo({
				top: 0,
				behavior: 'auto',
			});
		}, 100);

		return () => {
			window.removeEventListener('scroll', handleScroll);
		};
	});
	// 총 방문 장소 수
	let totalVisitedPlaces = $derived(
		bucket?.bucket_data_jsonb?.v1_aggr_user_places_region_stats?.reduce(
			(sum, stat) => sum + stat.visited,
			0,
		) ?? 0,
	);
</script>

<div class="flex min-h-screen flex-col">
	<!-- 헤더 -->
	<FeedHeader onTabChange={handleTabChange} />

	<!-- 피드 콘텐츠 -->
	<main class="flex-1 overflow-auto bg-gray-50 dark:bg-neutral-900">
		<div class="mx-auto max-w-lg px-4 py-4">
			<!-- 필터 결과 표시 -->
			{#if currentTab !== 'all'}
				<div class="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-3">
					<p class="text-sm font-medium text-blue-700">
						{#if currentTab === 'recommended'}
							🎯 맞춤 추천 피드
						{:else if currentTab === 'trending'}
							🔥 트렌딩 맛집
						{:else if currentTab === 'stats'}
							📊 내 활동 통계
						{:else if currentTab === 'challenges'}
							🎮 도전 과제
						{/if}
						<span class="font-normal">({filteredItems.length}개)</span>
					</p>
				</div>
			{/if}

			<MyPreferencesChart {bucket} />
			<MyVisitRatioCard
				card={{
					id: 'ratio-1',
					title: '내 방문 실행력 분석',
					period: '전체 기간',
					// 총 추천 장소 수
					totalRecommendedRestaurants: bucket?.bucket_data_jsonb?.total_features_count ?? 0,
					// 좋아요한 장소 수
					myLikedRestaurants:
						bucket?.bucket_data_jsonb?.v1_aggr_user_places_region_stats?.reduce(
							(sum, stat) => sum + stat.liked,
							0,
						) ?? 0,
					// 저장한 장소 수
					mySavedRestaurants:
						bucket?.bucket_data_jsonb?.v1_aggr_user_places_region_stats?.reduce(
							(sum, stat) => sum + stat.saved,
							0,
						) ?? 0,
					// 방문한 장소 수
					myVisitedRestaurants: totalVisitedPlaces,
					// 방문후 좋아요
					visitedFromLiked: bucket?.bucket_data_jsonb?.total_liked_places_visited ?? 0,
					// 방문후 저장
					visitedFromSaved: bucket?.bucket_data_jsonb?.total_saved_places_visited ?? 0,
					// 추천 장소 수 중 방문한 장소 수
					visitedFromRecommended: bucket?.bucket_data_jsonb?.total_featured_place_visited ?? 0,
					insights: [],
					timestamp: new Date(Date.now() - 7 * 60 * 60 * 1000).toISOString(),
				}}
			/>
			<MyReviewsCard
				{clickReviewPlace}
				isLoading={isMyReviewsLoading}
				card={{
					id: 'reviews-1',
					title: '내가 작성한 리뷰 분석',
					period: '전체 기간',
					stats: {
						totalReviews: reviewBucket?.review_summary?.total_reviews ?? 0,
						averageRating: reviewBucket?.review_summary?.average_rating ?? 0,
						ratingDistribution: {
							5: reviewBucket?.rating_distribution?.find((r) => r.rating === 5)?.count ?? 0,
							4: reviewBucket?.rating_distribution?.find((r) => r.rating === 4)?.count ?? 0,
							3: reviewBucket?.rating_distribution?.find((r) => r.rating === 3)?.count ?? 0,
							2: reviewBucket?.rating_distribution?.find((r) => r.rating === 2)?.count ?? 0,
							1: reviewBucket?.rating_distribution?.find((r) => r.rating === 1)?.count ?? 0,
						},
						topFeelings:
							reviewBucket?.tag_analysis?.map((t) => ({
								id: t.tag_code,
								name: t.tag_code,
								count: t.count,
								percentage: t.percentage,
							})) ?? [],
						categoryBreakdown:
							reviewBucket?.category_analysis?.map((c) => ({
								category: c.category,
								count: c.count,
								averageRating: c.average_rating,
							})) ?? [],
						monthlyTrend: [],
					},
					recentReviews:
						reviewBucket?.recent_reviews?.map((r) => ({
							restaurantName: r.place_name,
							category: r.category,
							rating: r.score,
							feelings: r.tags,
							content: r.review_content,
							date: r.created_date,
							place_id: r.place_id,
							group1: r.group1,
							group2: r.group2,
							group3: r.group3,
							is_private: r.is_private,
						})) ?? [],

					insights: [],
					timestamp: new Date(Date.now() - 9 * 60 * 60 * 1000).toISOString(),
				}}
			/>

			<!-- 피드 아이템들 -->
			<!-- {#each filteredItems as item (item.id)}
				{#if item.type === 'restaurant'}
					<RestaurantRecommendCard card={item.data} />
				{:else if item.type === 'youtube'}
					<YoutubeRecommendCard card={item.data} />
				{:else if item.type === 'challenge'}
					<ChallengeCard card={item.data} />
				{:else if item.type === 'my_activity'}
					<MyActivityStatsCard card={item.data} />
				{:else if item.type === 'my_restaurants'}
					<MyRestaurantList card={item.data} />
				{:else if item.type === 'my_preferences'}
					<MyPreferencesChart card={item.data} />
				{:else if item.type === 'national_stats'}
					<NationalStatsCard card={item.data} />
				{:else if item.type === 'visit_ratio'}
					<MyVisitRatioCard card={item.data} />
				{:else if item.type === 'visit_analysis'}
					<MyVisitAnalysisCard card={item.data} />
				{:else if item.type === 'my_reviews'}
					<MyReviewsCard card={item.data} />
				{/if}
			{/each} -->

			<!-- 결과 없음 -->
			{#if filteredItems.length === 0}
				<div class="py-12 text-center">
					<div class="mb-4 text-6xl">🍽️</div>
					<p class="mb-2 text-lg text-gray-500">아직 표시할 콘텐츠가 없습니다</p>
					<p class="text-sm text-gray-400">
						조금만 기다려 주세요. 새로운 추천이 곧 업데이트됩니다!
					</p>
				</div>
			{/if}

			<!-- 로딩 인디케이터 -->
			{#if isLoading}
				<div class="flex justify-center py-8">
					<div class="flex items-center gap-2 text-gray-500">
						<div class="h-5 w-5 animate-spin rounded-full border-b-2 border-blue-500"></div>
						<span class="text-sm">새로운 추천을 불러오는 중...</span>
					</div>
				</div>
			{/if}

			<!-- 더 이상 로드할 콘텐츠가 없을 때 -->
			{#if filteredItems.length >= 12 && !isLoading}
				<div class="py-8 text-center">
					<div class="mb-2 text-4xl">✨</div>
					<p class="text-sm text-gray-500">모든 추천을 확인했습니다</p>
					<p class="mt-1 text-xs text-gray-400">새로운 콘텐츠는 정기적으로 업데이트됩니다</p>
				</div>
			{/if}
		</div>
	</main>
</div>
