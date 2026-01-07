<script lang="ts">
	import { Heart, Bookmark, MessageCircle, Share2, Map } from 'lucide-svelte';
	
	const { 
		liked = false, 
		saved = false,
		commentsCount = 0,
		onLike, 
		onSave, 
		onComment, 
		onShare,
		onDirection
	} = $props<{
		liked?: boolean;
		saved?: boolean;
		commentsCount?: number;
		onLike?: () => void;
		onSave?: () => void;
		onComment?: () => void;
		onShare?: () => void;
		onDirection?: () => void;
	}>();
</script>

<!-- 하단 고정 액션 바 -->
<div class="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-30 px-4 py-3 sm:px-6">
	<div class="max-w-2xl mx-auto">
		<!-- 상단 액션 버튼 (인스타그램 스타일) -->
		<div class="flex items-center justify-between mb-3">
			<div class="flex items-center space-x-4">
				<!-- 좋아요 버튼 -->
				<button 
					onclick={onLike} 
					class="p-1 rounded-full hover:bg-gray-100 transition-colors"
					aria-label={liked ? '좋아요 취소' : '좋아요'}
				>
					<Heart class="w-7 h-7" fill={liked ? '#f43f5e' : 'none'} color={liked ? '#f43f5e' : 'currentColor'} />
				</button>
				
				<!-- 댓글 버튼 -->
				<button 
					onclick={onComment} 
					class="p-1 rounded-full hover:bg-gray-100 transition-colors"
					aria-label="댓글 달기"
				>
					<MessageCircle class="w-7 h-7" />
				</button>
				
				<!-- 공유 버튼 -->
				<button 
					onclick={onShare} 
					class="p-1 rounded-full hover:bg-gray-100 transition-colors"
					aria-label="공유하기"
				>
					<Share2 class="w-7 h-7" />
				</button>
			</div>
			
			<!-- 저장 버튼 -->
			<button 
				onclick={onSave} 
				class="p-1 rounded-full hover:bg-gray-100 transition-colors"
				aria-label={saved ? '저장 취소' : '저장하기'}
			>
				<Bookmark class="w-7 h-7" fill={saved ? 'currentColor' : 'none'} />
			</button>
		</div>
		
		<!-- 댓글 정보 -->
		{#if commentsCount > 0}
			<button 
				onclick={onComment}
				class="text-sm text-gray-600 mb-3 hover:text-gray-900 transition-colors"
			>
				댓글 {commentsCount}개 모두 보기
			</button>
		{/if}
		
		<!-- 하단 메인 액션 버튼 (에어비앤비 스타일) -->
		<div class="flex justify-between items-center">
			<div class="flex items-baseline">
				<span class="text-lg font-semibold text-gray-900">무료</span>
				<span class="text-sm text-gray-500 ml-1">정보 제공</span>
			</div>
			
			<button 
				onclick={onDirection}
				class="inline-flex items-center px-6 py-3 rounded-lg bg-pink-600 text-white font-medium hover:bg-pink-700 transition-colors"
			>
				<Map class="w-5 h-5 mr-2" />
				길찾기
			</button>
		</div>
	</div>
</div>

<!-- 하단 액션바 공간 확보를 위한 여백 -->
<div class="h-24"></div> 