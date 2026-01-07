<script lang="ts">
	import { formatWithCommas } from '$utils/number.util';
	import { goto } from '@mateothegreat/svelte5-router';
    import { authStore } from '$services/auth.store';
	import { supabase } from '$lib/supabase';
	import { Bookmark, Heart } from 'lucide-svelte';
	import type { ReviewItem,ReviewItem2 } from '$services/types';
	// 리뷰 아이템 인터페이스
	interface MediaItem {
		thumbnail: string;
	}

	// interface ReviewItem {
	// 	id: string;
	// 	business_id: string;
	// 	business_name: string;
	// 	rating: number | null;
	// 	common_address: string;
	// 	category: string;
	// 	visitor_review_score: number | null;
	// 	visitor_review_count: number;
	// 	author_nickname: string;
	// 	body: string;
	// 	media: MediaItem[] | null;
	// 	visit_count: number;
	// 	visited: string;
	// 	created: string;
	// 	is_liked: boolean;
	// 	is_saved: boolean;
	// 	like_count: number | 0;
	// 	save_count: number | 0;
	// }
// select * from mv_place_review_hidden_gem_for_10k limit 1;
	interface Props {
		// Props
		review: ReviewItem2;
		isExpanded?: boolean;
		onToggleExpand: () => void;
		onPlaceClick: () => void;
		formatDate: (date: string) => string;
	}

	let { review, isExpanded = false, onToggleExpand, onPlaceClick, formatDate }: Props = $props();

	$inspect(review)
	// $effect(() => {
	// 	// review.media = JSON.parse(review.media);
	// });

	// 컴포넌트 내부 상태: 좋아요 여부 및 개수
	let isLiked = $state(review.is_liked || false);
	let likeCount = $state(review.like_count || 0);
	// 좋아요 버튼 클릭 중 상태
	let isLiking = $state(false);

	// 컴포넌트 내부 상태: 저장 여부
	let isSaved = $state(review.is_saved || false);
	// 저장 버튼 클릭 중 상태
	let isSaving = $state(false);

	// 카테고리에 맞는 배경색 반환
	const categoryColors: Record<string, string> = {
		한식: 'bg-red-500',
		중식: 'bg-yellow-600',
		일식: 'bg-indigo-500',
		양식: 'bg-green-600',
		카페: 'bg-red-500',
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
	}

	// 로그인 필요 시 확인 및 이동 함수
	async function checkAuthAndRedirect(actionName: string): Promise<boolean> {
		if (!$authStore.isAuthenticated) {
			console.log(`${actionName} 로그인이 필요한 서비스 입니다.`);
			const ok = confirm(`로그인이 필요한 서비스 입니다. 로그인 페이지로 이동하시겠습니까?`);
			if (ok) {
				await goto('/auth/login');
			}
			return false;
		}
		return true;
	}

	// 좋아요 버튼 클릭 핸들러
	async function handleLikeClick() {
		if (isLiking) return;
		if (!await checkAuthAndRedirect('좋아요')) return;

		isLiking = true;

		try {
			const { data, error } = await supabase.rpc('v1_toggle_like', {
				p_liked_id: review.id,
				p_liked_type: 'place_review',
				ref_id:review.business_id
			});

			if (error) {
				console.error('Supabase RPC 오류 (v1_toggle_like):', error);
				const errorMessage = error.details || error.message || '알 수 없는 오류';
				throw new Error(`좋아요 처리 실패: ${errorMessage}`);
			}

			if (data && typeof data.liked === 'boolean') {
				isLiked = data.liked;
				if (isLiked) {
					likeCount++;
				} else {
					likeCount--;
					if (likeCount < 0) likeCount = 0;
				}
			} else {
				console.error('좋아요 처리 실패: 유효하지 않은 응답', data);
				alert('좋아요 상태를 업데이트하는데 실패했습니다.');
			}

		} catch (error: any) {
			console.error('좋아요 처리 중 오류 발생:', error);
			alert(error.message || '좋아요 처리에 실패했습니다. 다시 시도해주세요.');
		} finally {
			isLiking = false;
		}
	}

	// 저장 버튼 클릭 핸들러
	async function handleSaveClick() {
		if (isSaving) return;
		if (!await checkAuthAndRedirect('저장하기')) return;

		isSaving = true;

		try {
			const { data, error } = await supabase.rpc('v1_toggle_save', {
				p_saved_id: review.id,
				p_saved_type: 'place_review',
				ref_id:review.business_id
			});

			if (error) {
				console.error('Supabase RPC 오류 (v1_toggle_save):', error);
				const errorMessage = error.details || error.message || '알 수 없는 오류';
				throw new Error(`저장 처리 실패: ${errorMessage}`);
			}

			if (data && typeof data.saved === 'boolean') {
				isSaved = data.saved;
			} else {
				console.error('저장 처리 실패: 유효하지 않은 응답', data);
				alert('저장 상태를 업데이트하는데 실패했습니다.');
			}

		} catch (error: any) {
			console.error('저장 처리 중 오류 발생:', error);
			alert(error.message || '저장 처리에 실패했습니다. 다시 시도해주세요.');
		} finally {
			isSaving = false;
		}
	}
</script>

<article class="mb-1 overflow-hidden rounded-lg bg-white shadow-xs">
	<!-- 리뷰 헤더 (프로필 영역) -->
	<header class="flex items-center p-3">
		<div class="flex items-center gap-3">
			<div
				class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-500"
			>
				<span class="text-sm">{review.author_nickname?.charAt(0) || '익'}</span>
			</div>
			<div class="flex flex-col">
				<div class="flex items-center gap-1">
					<span class="text-sm font-semibold">{review.author_nickname || '익명'}</span>
					{#if review.visit_count > 1}
						<span class="text-xs text-gray-500">• {review.visit_count}번째 방문</span>
					{/if}
				</div>
				<span class="text-xs text-gray-500">방문일: {formatDate(review.visited)}</span>
				<!-- <span class="text-xs text-gray-500">작성일: {formatDate(review.created)}</span> -->
			</div>
		</div>
		<div class="ml-auto"></div>
	</header>

	<!-- 제목과 내용 -->
	<div class="cursor-pointer px-4 pt-2 pb-3 hover:bg-gray-50" onclick={onPlaceClick}>
		<h2 class="mb-2 text-lg font-bold">
			{review.business_name}
			{#if review.visitor_reviews_total}
				<span class="ml-2 text-xs font-normal text-gray-500">
					리뷰 {formatWithCommas(review.visitor_reviews_total)}
				</span>
			{/if}

			{#if review.visitor_reviews_score}
				<span class="ml-2 text-xs font-normal text-gray-500">
					별점 {review.visitor_reviews_score}
				</span>
			{/if}
		</h2>

		{#if review.body}
			<!-- <p class="mb-2 text-sm text-gray-700 {isExpanded ? '' : 'line-clamp-3'}"> -->
			<p class="mb-2 text-gray-700 {isExpanded ? '' : 'line-clamp-3'}">
				{review.body}
			</p>
			{#if review.body.length > 100 && !isExpanded}
				<button
					class="text-xs text-blue-500 hover:underline"
					onclick={(e) => {
						e.stopPropagation();
						onToggleExpand();
					}}
				>
					더 보기
				</button>
			{:else if review.body.length > 100}
				<button
					class="text-xs text-blue-500 hover:underline"
					onclick={(e) => {
						e.stopPropagation();
						onToggleExpand();
					}}
				>
					접기
				</button>
			{/if}
		{/if}
	</div>

	<!-- 이미지가 있는 경우 표시 -->
	 <!-- {review.media.length} -->
	<!-- 미디어 데이터 디버깅 -->
	<!-- {#if review.media && typeof review.media === 'string'}
		<div class="px-4 py-2 text-xs text-gray-500">
			<pre class="overflow-x-auto whitespace-pre-wrap break-words bg-gray-100 p-2 rounded">
				{JSON.stringify(JSON.parse(review.media), null, 2)}
			</pre>
		</div>
	{:else if review.media && Array.isArray(review.media)}
		<div class="px-4 py-2 text-xs text-gray-500">
			<pre class="overflow-x-auto whitespace-pre-wrap break-words bg-gray-100 p-2 rounded">
				{JSON.stringify(review.media, null, 2)}
			</pre>
		</div>
	{/if} -->
	<!-- ? {review.media.length} -->
	{#if review.media && review.media.length > 0}
		{#if review.media.length === 1}
			<!-- 단일 미디어 -->
			<!-- <div
            class="h-[300px] w-full cursor-pointer overflow-hidden"
            onclick={() => window.open(review.media[0].thumbnail, '_blank')}
        > -->
			<div class="h-[300px] w-full cursor-pointer overflow-hidden">
				<img
					src={review.media[0].thumbnail}
					alt="리뷰 이미지"
					class="h-full w-full object-cover"
					loading="lazy"
				/>
			</div>
		{:else}
			<!-- 다중 미디어 (그리드) -->
			<div class="grid grid-cols-{Math.min(review.media.length, 3)} cursor-pointer gap-1">
				{#each review.media.slice(0, 3) as mediaItem, i}
					<!-- <div 
                    class="aspect-square w-full overflow-hidden"
                    onclick={() => window.open(media.thumbnail, '_blank')}
                > -->
					<div class="aspect-square w-full overflow-hidden">
						<img
							src={mediaItem.thumbnail}
							alt={`리뷰 이미지 ${i + 1}`}
							class="h-full w-full object-cover"
							loading="lazy"
						/>
					</div>
				{/each}
			</div>
		{/if}
	{/if}

	<!-- 주소 태그 영역 -->
	<div class="flex flex-wrap gap-2 px-4 py-2">
		<!-- {#if review.category}
			<span
				class={`${getCategoryColor(review.category)} rounded-full px-2 py-1 text-xs text-white`}
			>
				{review.category}
			</span>
		{/if} -->

		<!-- {#each getAddressTags(review.address) as tag}
			<span class="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-700">
				{tag}
			</span>
		{/each} -->
		<div class="flex flex-wrap gap-2 mb-3">
            {#if review.group1}
                <span class="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-md text-xs font-medium">
                    {review.group1}
                </span>
            {/if}
            {#if review.group2}
                <span class="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-md text-xs font-medium">
                    {review.group2}
                </span>
            {/if}
            {#if review.group3}
                <span class="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-md text-xs font-medium">
                    {review.group3}
                </span>
            {/if}
        </div>
	</div>
	<!-- 플랫폼 평가 영역 (좋아요, 댓글, 저장 카운트) -->
	<div class="flex items-center justify-between border-t border-gray-100 px-4 py-2">
		<div class="flex items-center gap-6">
			<!-- 좋아요 -->
			<button
				class="flex items-center gap-1.5 rounded-full px-2.5 py-1.5 transition-colors hover:bg-gray-50 disabled:opacity-50"
				aria-label="좋아요"
				onclick={handleLikeClick}
				disabled={isLiking}
			>
				<Heart 
					class="h-5 w-5 {isLiked ? 'fill-red-500 text-red-500' : 'text-gray-500'}" 
					fill={isLiked ? 'currentColor' : 'none'} 
				/>
				<span class="text-sm font-medium {isLiked ? 'text-red-600' : 'text-gray-700'}">{likeCount}</span>
			</button>

			<!-- 저장 (북마크) -->
			<button
				class="flex items-center gap-1.5 rounded-full px-2.5 py-1.5 transition-colors hover:bg-gray-50 disabled:opacity-50"
				aria-label="저장"
				onclick={handleSaveClick}
				disabled={isSaving}
			>
				<Bookmark 
					class="h-5 w-5 {isSaved ? 'fill-blue-500 text-blue-500' : 'text-gray-500'}" 
					fill={isSaved ? 'currentColor' : 'none'} 
				/>
				<span class="text-sm font-medium {isSaved ? 'text-blue-600' : 'text-gray-700'}">저장</span>
			</button>
		</div>

		<!-- 네이버 지도 버튼 (방문 버튼 대체) -->
		<a
			href={`https://map.naver.com/p/entry/place/${review.business_id}`}
			target="_blank"
			rel="noopener noreferrer"
			class="flex items-center gap-1.5 rounded-full px-2 py-1 text-gray-500 transition-colors hover:bg-gray-50"
			aria-label="네이버 장소 보기"
		>
			<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
				></path>
			</svg>
			<span class="text-sm">네이버 지도</span>
		</a>
	</div>
</article>
