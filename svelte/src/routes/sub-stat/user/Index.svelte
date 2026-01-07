<script lang="ts">
	import { onMount } from 'svelte';
	import MyVisitRatioCard from './components/MyVisitRatioCard.svelte';
	import MyReviewsCard from './components/MyReviewsCard.svelte';
	import { supabase } from '$lib/supabase';
	import type { UserPlacesStatsBucket, UserReviewAnalysisData } from '$services/types';
	import { placePopupStore } from '$lib/stores/place-popup.store.svelte';
	import MyPreferencesChart from './components/MyPreferencesChart.svelte';
	import { ArrowLeft } from 'lucide-svelte';
	import { uiStore } from '$lib/stores/ui.store';
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

	let isMyReviewsLoading = $state(true);

	function clickReviewPlace(placeId: string) {
		console.log('[clickReviewPlace]', placeId);
		placePopupStore.show(placeId);
	}

	// 총 방문 장소 수
	let totalVisitedPlaces = $derived(
		bucket?.bucket_data_jsonb?.v1_aggr_user_places_region_stats?.reduce(
			(sum, stat) => sum + stat.visited,
			0,
		) ?? 0,
	);

	function handleBack() {
		window.history.back();
	}

	$effect(() => {
		// 페이지가 살아있는 동안 isBottomNavVisible을 false로 유지
		const unsubscribe = uiStore.subscribe((state) => {
			if (state.isBottomNavVisible) {
				// console.log('[uiStore] isBottomNavVisible이 true로 변경됨, false로 복원');
				uiStore.update((s) => ({
					...s,
					isBottomNavVisible: false,
				}));
			}
		});

		// 초기 설정
		uiStore.update((state) => ({
			...state,
			isBottomNavVisible: false,
		}));

		return () => {
			unsubscribe();
			// 페이지 종료 시 다시 true로 복원
			uiStore.update((state) => ({
				...state,
				isBottomNavVisible: true,
			}));
		};
	});
</script>

<div class="fixed top-0 right-0 left-0 z-50 bg-white">
	<div class="mx-auto max-w-lg border-b border-gray-200 px-4 py-3">
		<div class="flex items-center gap-3">
			<button
				onclick={handleBack}
				class="flex h-9 w-9 items-center justify-center rounded-full bg-gray-50 transition-colors hover:bg-gray-100 active:bg-gray-200"
				aria-label="뒤로가기"
			>
				<ArrowLeft class="h-5 w-5 text-gray-700" />
			</button>
			<h1 class="text-lg font-semibold text-gray-900">내 활동 분석</h1>
		</div>
	</div>
</div>

<article class="min-h-screen bg-gray-50 pt-16">
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
					placeId: r.place_id,
					restaurantName: r.place_name,
					category: r.category,
					rating: r.score,
					feelings: r.tags,
					content: r.review_content,
					date: r.created_date,
					group1: r.group1,
					group2: r.group2,
					group3: r.group3,
				})) ?? [],

			insights: [],
			timestamp: new Date(Date.now() - 9 * 60 * 60 * 1000).toISOString(),
		}}
	/>
</article>
