<script lang="ts">
	import { ThumbsDown, ThumbsUp } from 'lucide-svelte';
	// const { isLiked, isDisliked, onLike, onDislike } = $props();
</script>

<!-- 액션 버튼 영역 (별로예요/좋아요) -->
<div class="grid grid-cols-2 gap-3 px-4 pb-4 sm:px-6 sm:pb-4">
	<button class="flex items-center justify-center gap-2 rounded-lg bg-gray-100 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200 hover:text-gray-900">
		<ThumbsDown class="w-5 h-5 text-gray-500" />
		별로예요
	</button>
	<button class="flex items-center justify-center gap-2 rounded-lg bg-gray-100 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200 hover:text-gray-900">
		<ThumbsUp class="w-5 h-5 text-gray-500" />
		좋아요
	</button>
</div> 