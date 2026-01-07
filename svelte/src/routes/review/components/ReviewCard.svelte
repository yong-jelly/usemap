<script lang="ts">
	import { formatWithCommas } from '$utils/number.util';

	// 리뷰 아이템 인터페이스
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

	interface Props {
		// Props
		review: ReviewItem;
		isExpanded?: boolean;
		onToggleExpand: () => void;
		onPlaceClick: () => void;
		formatDate: (date: string) => string;
	}

	let { review, isExpanded = false, onToggleExpand, onPlaceClick, formatDate }: Props = $props();

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
	}
</script>

<article class="mb-4 overflow-hidden rounded-lg bg-white shadow-xs">
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
			{#if review.visitor_review_count}
				<span class="ml-2 text-xs font-normal text-gray-500">
					리뷰 {formatWithCommas(review.visitor_review_count)}
				</span>
			{/if}

			{#if review.visitor_review_score}
				<span class="ml-2 text-xs font-normal text-gray-500">
					별점 {review.visitor_review_score}
				</span>
			{/if}
		</h2>

		{#if review.body}
			<!--
		 <p class="mb-2 text-sm text-gray-700 {isExpanded ? '' : 'line-clamp-3'}"> 
			 -->
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
				{#each review.media.slice(0, 3) as media, i}
					<!-- <div 
                    class="aspect-square w-full overflow-hidden"
                    onclick={() => window.open(media.thumbnail, '_blank')}
                > -->
					<div class="aspect-square w-full overflow-hidden">
						<img
							src={media.thumbnail}
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
		{#if review.category}
			<span
				class={`${getCategoryColor(review.category)} rounded-full px-2 py-1 text-xs text-white`}
			>
				{review.category}
			</span>
		{/if}

		{#each getAddressTags(review.common_address) as tag}
			<span class="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-700">
				{tag}
			</span>
		{/each}
	</div>

	<!-- 플랫폼 평가 영역 (좋아요, 댓글, 저장 카운트) -->
	<div class="flex items-center justify-between border-t border-gray-100 px-4 py-2">
		<div class="flex items-center gap-6">
			<!-- 좋아요 -->
			<button
				class="flex items-center gap-1.5 rounded-full px-2.5 py-1.5 transition-colors hover:bg-gray-50"
				aria-label="좋아요"
			>
				<svg class="h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
					/>
				</svg>
				<span class="text-sm font-medium">0</span>
			</button>

			<!-- 저장 (북마크) -->
			<button
				class="flex items-center gap-1.5 rounded-full px-2.5 py-1.5 transition-colors hover:bg-gray-50"
				aria-label="저장"
			>
				<svg class="h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
					/>
				</svg>
				<span class="text-sm font-medium">저장</span>
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
