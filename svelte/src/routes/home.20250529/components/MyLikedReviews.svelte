<script lang="ts">
	import { supabase } from '$lib/supabase';
	import { authStore } from '$services/auth.store';
	import ReviewCard from './ReviewCard.svelte'; // ReviewCard 경로 확인 필요
	import { formatter } from '$utils/date.util'; // formatDate 대신 formatter import
	import Indicator from '$lib/components/Indicator.svelte';

	// 리뷰 아이템 인터페이스 (ReviewCard와 동일하게)
	interface MediaItem {
		thumbnail: string;
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
		media: MediaItem[] | null;
		visit_count: number;
		visited: string;
		created: string;
		view_count: number;
		is_liked: boolean; // true 고정
		is_saved: boolean;
		like_count: number;
		save_count: number;
	}

	let reviews = $state<ReviewItem[]>([]);
	let isLoading = $state(true);
	let error = $state<string | null>(null);
	let hasMore = $state(true);
	let offset = $state(0);
	const limit = 20; // 한 번에 로드할 개수

	async function loadReviews() {
		if (!hasMore || isLoading) return; // 더 이상 없거나 로딩 중이면 실행 안 함
		if (!$authStore.isAuthenticated) {
            isLoading = false;
            error = '좋아요 목록을 보려면 로그인이 필요합니다.';
            return;
        }

		isLoading = true;
		error = null;

		try {
			const { data, error: rpcError } = await supabase.rpc('v1_get_my_liked_reviews', {
				p_limit: limit,
				p_offset: offset
			});

			if (rpcError) {
				console.error('Supabase RPC 오류 (v1_get_my_liked_reviews):', rpcError);
                const errorMessage = rpcError.details || rpcError.message || '알 수 없는 오류';
				throw new Error(`리뷰를 불러오는 데 실패했습니다: ${errorMessage}`);
			}

            if (data && Array.isArray(data)) {
                const newReviews = data as ReviewItem[];
                reviews = [...reviews, ...newReviews]; // 기존 목록에 추가
                offset += newReviews.length;
                hasMore = newReviews.length === limit; // 로드된 개수가 limit과 같으면 더 있을 수 있음

                if (reviews.length === 0 && offset === 0) {
                    // 첫 로드인데 결과가 없는 경우, 특별한 에러 메시지 대신 "없음" 상태로 처리
                }
            } else {
                // 응답 형식이 잘못된 경우
                console.error('유효하지 않은 응답 데이터:', data);
                throw new Error('리뷰 데이터를 가져오는 데 실패했습니다 (형식 오류).');
            }

		} catch (err: any) {
			console.error('리뷰 로딩 중 오류 발생:', err);
			error = err.message || '리뷰를 불러오는 중 오류가 발생했습니다.';
            // 오류 발생 시 더 이상 로드 시도하지 않음 (선택적)
            // hasMore = false;
		} finally {
			isLoading = false;
		}
	}

    // 로그인 상태 변경 감지 및 초기 로드
    $effect(() => {
        const isAuthenticated = $authStore.isAuthenticated; // 상태 값을 한 번만 읽음
        if (isAuthenticated) {
            // 로그인 상태: 리뷰가 없고, 로딩 중이 아니며, 더 로드할 게 있다면 첫 로드 실행
            if (reviews.length === 0 && !isLoading && hasMore && error !== '좋아요 목록을 보려면 로그인이 필요합니다.') {
                 // error 상태 초기화 후 로드
                error = null;
                loadReviews();
            }
        } else {
            // 로그아웃 상태: 모든 상태 초기화
            reviews = [];
            offset = 0;
            hasMore = true;
            isLoading = false;
            error = '좋아요 목록을 보려면 로그인이 필요합니다.';
        }
    });

	// 더보기 버튼 핸들러
	function handleLoadMore() {
		if (!isLoading && hasMore) {
			loadReviews();
		}
	}

    // ReviewCard 확장 상태 관리 (선택적)
    let expandedStates = $state<Record<string, boolean>>({});
    function toggleExpand(reviewId: string) {
        expandedStates[reviewId] = !expandedStates[reviewId];
    }

    // 장소 클릭 핸들러 (선택적 - 필요시 구현)
    function handlePlaceClick(businessId: string) {
        console.log('장소 클릭:', businessId);
        // 예: goto(`/place/${businessId}`);
    }

</script>

<div class="my-liked-reviews-container p-4">
    {#if !$authStore.isAuthenticated}
        <div class="text-center text-gray-500 py-8">
            <p>{error || '좋아요 목록을 보려면 로그인이 필요합니다.'}</p>
             <!-- 로그인 버튼 추가 가능 -->
            <!-- <button onclick={() => goto('/auth/login')} class="mt-4 rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600">로그인</button> -->
        </div>
    {:else if isLoading && reviews.length === 0}
		<div class="text-center py-8">
            <p>좋아요 목록을 불러오는 중...</p>
            <!-- 스피너 추가 -->
            <!-- <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mt-4"></div> -->
			<Indicator text="좋아요 목록을 불러오는 중..." />
        </div>
	{:else if error && reviews.length === 0}
		<div class="text-center text-red-500 py-8">
            <p>{error}</p>
        </div>
    {:else if reviews.length === 0}
        <div class="text-center text-gray-500 py-8">
            <p>좋아요를 누른 리뷰가 없습니다.</p>
        </div>
    {:else}
        <div class="reviews-list space-y-4">
            {#each reviews as review (review.id)}
                <ReviewCard
                    review={review}
                    isExpanded={expandedStates[review.id] || false}
                    onToggleExpand={() => toggleExpand(review.id)}
                    onPlaceClick={() => handlePlaceClick(review.business_id)}
                    formatDate={(date) => formatter({ date })}
                />
            {/each}
        </div>

        {#if hasMore}
            <div class="mt-6 text-center">
                <button
                    class="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 disabled:opacity-50"
                    onclick={handleLoadMore}
                    disabled={isLoading}
                >
                    {isLoading ? '로딩 중...' : '더 보기'}
                </button>
            </div>
        {/if}
         {#if !hasMore && reviews.length > 0}
             <div class="mt-6 text-center text-gray-500">
                 <p>더 이상 리뷰가 없습니다.</p>
             </div>
         {/if}
	{/if}
</div> 