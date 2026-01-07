<script lang="ts">
	import { FileText, Users, Star, Folder } from 'lucide-svelte';

	// Props: 리뷰 수 및 평점 데이터
	const { visitorReviewCount, category, rating } = $props<{
		visitorReviewCount?: number;
		category?: string;
		rating?: number;
	}>();

	// Helper 함수들
	function formatScore(score: number | undefined, decimals = 1): string {
		if (score === undefined || score === null) return '-';
		return score.toFixed(decimals);
	}
	function formatCount(count: number | undefined): string {
		if (count === undefined || count === null) return '-';
		return count.toLocaleString();
	}

</script>

<!-- 리뷰 및 평점 정보 영역 -->
<div class="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
	<!-- 카테고리 -->
	<div class="flex items-center gap-1.5 text-gray-700">
		<Folder class="h-4 w-4 text-purple-600 flex-shrink-0" />
		<span> <strong class="font-semibold text-gray-900">{category || '-'}</strong></span>
	</div>
	<!-- 방문자 리뷰 -->
	<div class="flex items-center gap-1.5 text-gray-700">
		<FileText class="h-4 w-4 text-sky-600 flex-shrink-0" />
		<span>방문자 리뷰 <strong class="font-semibold text-gray-900">{formatCount(visitorReviewCount)}</strong></span>
	</div>
	<!-- 블로그 리뷰 -->
	<!-- <div class="flex items-center gap-1.5 text-gray-700">
		<Users class="h-4 w-4 text-emerald-600 flex-shrink-0" />
		<span>블로그 리뷰 <strong class="font-semibold text-gray-900">{formatCount(blogReviewCount)}</strong></span>
	</div> -->
	<!-- 평점 -->
	<div class="flex items-center gap-1.5 text-gray-700">
		<Star class="h-4 w-4 text-yellow-500 fill-yellow-500 flex-shrink-0" />
		<span>평점 <strong class="font-semibold text-gray-900">{formatScore(rating)}</strong></span>
	</div>
</div> 