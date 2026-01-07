<script lang="ts">
	import { formatWithCommas } from '$utils/number.util';

	// 리뷰 아이템 인터페이스
	interface MediaItem {
		thumbnail: string;
	}

	interface ReviewItemForDetail {
		id: string;
		body: string;
		media: MediaItem[] | null;
		rating: number | null;
		created: string | null;
		visited: string;
		author_nickname: string;
		visit_count: number;
	}

	interface Props {
		review: ReviewItemForDetail;
		isExpanded?: boolean;
		onToggleExpand?: () => void; // 옵션으로 변경
		formatDate: (date: string) => string;
	}

	let { review, isExpanded = false, onToggleExpand, formatDate }: Props = $props();

	// 카테고리에 맞는 배경색 반환 (본문에서는 사용하지 않지만 미래 확장성을 위해 유지)
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

	function getCategoryColor(category: string): string {
		return categoryColors[category] || 'bg-gray-500';
	}
</script>

<article class="w-full overflow-hidden rounded-xl bg-white shadow-sm flex flex-col border border-gray-100 hover:shadow-md transition-shadow duration-200">
	<!-- 리뷰 헤더 (프로필 영역) -->
	<header class="flex items-center p-3 border-b border-gray-50">
		<div class="flex items-center gap-3">
			<div
				class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-500"
			>
				<span class="text-sm">{review.author_nickname?.charAt(0) || '익'}</span>
			</div>
			<div class="flex flex-col">
				<div class="flex items-center gap-1">
					<span class="text-sm font-semibold">{review.author_nickname || '익명'}</span>
				</div>
				<div class="flex items-center gap-2">
					<span class="text-xs text-gray-500">방문일: {formatDate(review.visited)}</span>
					{#if review.visit_count > 0}
						<span class="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-600">{review.visit_count}회 방문</span>
					{/if}
				</div>
			</div>
		</div>
	</header>

	<!-- 리뷰 내용 -->
	<div class="px-4 pt-3 pb-3">
		{#if review.body}
			<p class="mb-2 text-gray-700 line-clamp-3 h-[72px]">
				{review.body}
			</p>
		{:else}
			<p class="mb-2 text-gray-500 italic h-[72px]">내용 없음</p>
		{/if}
	</div>

	<!-- 이미지 영역: 1개로 고정 -->
	<div class="h-[200px] w-full px-3 pb-3">
		<div class="h-full w-full overflow-hidden rounded-lg">
			{#if review.media && review.media.length > 0}
				<img
					src={review.media[0].thumbnail}
					alt="리뷰 이미지"
					class="h-full w-full object-cover"
					loading="lazy"
				/>
			{:else}
				<!-- 이미지가 없는 경우 플레이스홀더 -->
				<div class="h-full w-full flex items-center justify-center bg-gray-100 rounded-lg">
					<span class="text-gray-400">이미지 없음</span>
				</div>
			{/if}
		</div>
	</div>
</article> 