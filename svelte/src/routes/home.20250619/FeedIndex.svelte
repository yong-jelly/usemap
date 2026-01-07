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
	let feedItems = $state<FeedItem[]>([]);
	let filteredItems = $state<FeedItem[]>([]);
	let currentTab = $state('all');

	// 하드코딩된 피드 데이터
	const mockFeedData: FeedItem[] = [
		{
			id: '1',
			type: 'restaurant',
			timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
			data: {
				id: 'rest_1',
				restaurant: {
					name: '이태원 맛집골목',
					address: '서울시 용산구 이태원로 123',
					category: '한식',
					rating: 4.5,
					reviewCount: 234,
					priceRange: '₩₩',
					images: ['https://picsum.photos/800/600?random=1'],
				},
				recommendation: {
					reason:
						'당신이 좋아한 한식당과 비슷한 분위기의 맛집이에요. 특히 불고기와 된장찌개가 유명하며, 현지인들이 자주 찾는 숨은 명소입니다.',
					type: 'ai',
					score: 89,
					tags: ['한식', '현지맛집', '불고기', '가성비'],
				},
				timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
				isLiked: false,
				isBookmarked: false,
			},
		},
		{
			id: '2',
			type: 'youtube',
			timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
			data: {
				id: 'yt_1',
				video: {
					title: '부산 서면 맛집 투어! 현지인 추천 BEST 5',
					thumbnail: 'https://picsum.photos/800/450?random=2',
					duration: '12:34',
					channelName: '맛집탐방TV',
					channelAvatar: 'https://picsum.photos/100/100?random=10',
					viewCount: '2.3만회',
					publishedAt: '1일 전',
					url: 'https://youtube.com/watch?v=example',
				},
				relatedRestaurants: [
					{
						name: '서면 할매 국밥',
						address: '부산시 부산진구 서면로',
						category: '국밥',
					},
					{
						name: '해운대 횟집',
						address: '부산시 해운대구 해운대해변로',
						category: '회/해산물',
					},
				],
				summary:
					'부산 서면에서 현지인들이 진짜 자주 가는 맛집 5곳을 소개합니다. 특히 할매 국밥과 해운대 횟집이 매우 인상적이었어요.',
				timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
				isLiked: true,
				isBookmarked: false,
			},
		},
		{
			id: '3',
			type: 'challenge',
			timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
			data: {
				id: 'ch_1',
				title: '이번 주 5곳 이상 방문하기',
				description:
					'새로운 맛집을 발견하고 경험을 쌓아보세요. 다양한 음식 카테고리를 경험할수록 더 정확한 추천을 받을 수 있어요!',
				type: 'weekly',
				difficulty: 'medium',
				progress: {
					current: 3,
					target: 5,
					unit: '곳',
				},
				rewards: {
					exp: 500,
					badge: '탐험가',
					special: '프리미엄 추천 1주일',
				},
				deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
				status: 'active',
				timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
			},
		},
		{
			id: '5',
			type: 'restaurant',
			timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
			data: {
				id: 'rest_2',
				restaurant: {
					name: '제주 흑돼지 맛집',
					address: '제주시 제주대학로 456',
					category: '고기구이',
					rating: 4.8,
					reviewCount: 456,
					priceRange: '₩₩₩',
					images: [
						'https://picsum.photos/800/600?random=3',
						'https://picsum.photos/800/600?random=4',
					],
				},
				recommendation: {
					reason:
						'제주도 여행 계획이 있으시군요! 제주 흑돼지의 진짜 맛을 느낄 수 있는 곳으로, 관광객보다 현지인들이 더 많이 찾는 진짜 맛집입니다.',
					type: 'trending',
					score: 95,
					tags: ['제주도', '흑돼지', '현지맛집', '여행'],
				},
				timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
				isLiked: false,
				isBookmarked: true,
			},
		},
		{
			id: '6',
			type: 'stats',
			timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
			data: {
				id: 'st_2',
				type: 'ranking',
				title: '서울 강남구 탐험 순위',
				period: '이번 달',
				stats: {
					visited: 23,
					liked: 45,
					saved: 12,
					rank: 7,
					totalUsers: 2847,
					region: '서울 강남구',
				},
				achievements: [],
				comparison: {
					previousPeriod: 30,
					percentChange: 15,
				},
				timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
			},
		},
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
			id: '8',
			type: 'my_restaurants',
			timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
			data: {
				id: 'my_rest_1',
				title: '내가 추천한 음식점들',
				period: '전체',
				restaurants: [
					{
						placeId: 'rest_001',
						placeName: '강남 맛집 골목',
						category: '한식',
						address: '서울시 강남구 테헤란로 123',
						group1: '서울',
						weeklyStats: {
							views: 45,
							likes: 8,
							saves: 12,
							visits: 3,
						},
						totalStats: {
							views: 267,
							likes: 34,
							saves: 18,
							visits: 12,
						},
						myContributions: {
							features: 2,
							reviews: 1,
						},
						createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
					},
					{
						placeId: 'rest_002',
						placeName: '제주도 해산물 맛집',
						category: '해산물',
						address: '제주시 애월읍 해안로 456',
						group1: '제주',
						weeklyStats: {
							views: 28,
							likes: 5,
							saves: 7,
							visits: 2,
						},
						totalStats: {
							views: 189,
							likes: 23,
							saves: 31,
							visits: 8,
						},
						myContributions: {
							features: 1,
							reviews: 2,
						},
						createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
					},
					{
						placeId: 'rest_003',
						placeName: '부산 국밥집',
						category: '국밥',
						address: '부산시 부산진구 서면로 789',
						group1: '부산',
						weeklyStats: {
							views: 15,
							likes: 3,
							saves: 4,
							visits: 1,
						},
						totalStats: {
							views: 134,
							likes: 19,
							saves: 22,
							visits: 6,
						},
						myContributions: {
							features: 1,
							reviews: 0,
						},
						createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
					},
				],
				summary: {
					totalRestaurants: 3,
					totalFeatures: 4,
					totalViews: 590,
					totalEngagements: 173,
				},
				timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
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
			id: '10',
			type: 'national_stats',
			timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
			data: {
				id: 'national-1',
				title: '전국 추천 음식점 통계',
				period: '2024년 12월',
				totalRestaurants: 45280,
				totalRecommendations: 127350,
				totalUsers: 8940,
				myContribution: {
					restaurants: 23,
					recommendations: 67,
					rank: 156,
				},
				topCategories: [
					{ name: '한식', count: 18520, percentage: 85 },
					{ name: '카페', count: 12840, percentage: 70 },
					{ name: '일식', count: 8960, percentage: 55 },
					{ name: '양식', count: 6720, percentage: 42 },
					{ name: '중식', count: 4580, percentage: 35 },
					{ name: '분식', count: 3240, percentage: 28 },
					{ name: '치킨', count: 2890, percentage: 25 },
				],
				topRegions: [
					{ name: '서울', count: 15680, rank: 1 },
					{ name: '경기', count: 8940, rank: 2 },
					{ name: '부산', count: 4520, rank: 3 },
					{ name: '대구', count: 3280, rank: 4 },
					{ name: '인천', count: 2890, rank: 5 },
					{ name: '광주', count: 2340, rank: 6 },
					{ name: '대전', count: 2120, rank: 7 },
				],
				platformStats: {
					youtube: {
						totalRestaurants: 12450,
						totalRecommendations: 34820,
						totalUsers: 2340,
						topCategories: [
							{ name: '한식', count: 5240, percentage: 88 },
							{ name: '일식', count: 3890, percentage: 75 },
							{ name: '디저트', count: 2340, percentage: 62 },
							{ name: '카페', count: 1890, percentage: 55 },
							{ name: '양식', count: 1560, percentage: 48 },
						],
						topRegions: [
							{ name: '서울', count: 6780, rank: 1 },
							{ name: '부산', count: 2340, rank: 2 },
							{ name: '제주', count: 1890, rank: 3 },
							{ name: '경기', count: 1560, rank: 4 },
							{ name: '대구', count: 890, rank: 5 },
						],
					},
					community: {
						totalRestaurants: 32830,
						totalRecommendations: 92530,
						totalUsers: 6600,
						topCategories: [
							{ name: '한식', count: 13280, percentage: 82 },
							{ name: '카페', count: 10950, percentage: 68 },
							{ name: '일식', count: 5070, percentage: 51 },
							{ name: '양식', count: 5160, percentage: 44 },
							{ name: '중식', count: 4020, percentage: 38 },
						],
						topRegions: [
							{ name: '서울', count: 8900, rank: 1 },
							{ name: '경기', count: 7380, rank: 2 },
							{ name: '부산', count: 2180, rank: 3 },
							{ name: '대구', count: 2390, rank: 4 },
							{ name: '인천', count: 2000, rank: 5 },
						],
					},
				},
				timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
			},
		},
		{
			id: '11',
			type: 'visit_ratio',
			timestamp: new Date(Date.now() - 7 * 60 * 60 * 1000).toISOString(),
			data: {
				id: 'ratio-1',
				title: '내 방문 실행력 분석?',
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

			<!-- 피드 아이템들 -->
			{#each filteredItems as item (item.id)}
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
			{/each}

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
