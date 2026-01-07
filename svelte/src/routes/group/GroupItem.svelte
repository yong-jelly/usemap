<!-- @migration-task Error while migrating Svelte code: Cannot use `export let` in runes mode — use `$props()` instead
https://svelte.dev/e/legacy_export_invalid -->
<!-- @migration-task Error while migrating Svelte code: Cannot use `export let` in runes mode — use `$props()` instead
https://svelte.dev/e/legacy_export_invalid -->
<!-- @migration-task Error while migrating Svelte code: Cannot use `export let` in runes mode — use `$props()` instead
https://svelte.dev/e/legacy_export_invalid -->
<!-- @migration-task Error while migrating Svelte code: Cannot use `export let` in runes mode — use `$props()` instead
https://svelte.dev/e/legacy_export_invalid -->
<!-- @migration-task Error while migrating Svelte code: Cannot use `export let` in runes mode — use `$props()` instead
https://svelte.dev/e/legacy_export_invalid -->
<!-- @migration-task Error while migrating Svelte code: Cannot use `export let` in runes mode — use `$props()` instead
https://svelte.dev/e/legacy_export_invalid -->
<!-- @migration-task Error while migrating Svelte code: Cannot use `export let` in runes mode — use `$props()` instead
https://svelte.dev/e/legacy_export_invalid -->
<!-- @migration-task Error while migrating Svelte code: Cannot use `export let` in runes mode — use `$props()` instead
https://svelte.dev/e/legacy_export_invalid -->
<!-- @migration-task Error while migrating Svelte code: Cannot use `export let` in runes mode — use `$props()` instead
https://svelte.dev/e/legacy_export_invalid -->
<!-- @migration-task Error while migrating Svelte code: Cannot use `export let` in runes mode — use `$props()` instead
https://svelte.dev/e/legacy_export_invalid -->
<script lang="ts">
	// 속성
	export let place: any;
	export let groupId: string;
	
	// 인터페이스
	interface Comment {
		id: string;
		userId: string;
		userName: string;
		userAvatar: string;
		text: string;
		createdAt: string;
		liked: boolean;
		likeCount: number;
	}
	
	// 상태
	let showComments = $state(false);
	let commentText = $state('');
	let comments = $state<Comment[]>([
		{
			id: 'comment-1',
			userId: 'user-1',
			userName: '김맛집',
			userAvatar: 'https://placehold.co/100x100?text=김맛집',
			text: '이 곳 고기 정말 맛있어요! 특히 삼겹살이 두껍고 육즙이 풍부합니다. 여러 번 방문했는데 맛이 일정해서 더 좋아요.',
			createdAt: '2023-06-12T14:32:00',
			liked: false,
			likeCount: 5
		},
		{
			id: 'comment-2',
			userId: 'user-3',
			userName: '정미식',
			userAvatar: 'https://placehold.co/100x100?text=정미식',
			text: '가격이 조금 있는 편이지만 그만큼 품질이 좋아서 가성비 괜찮습니다. 소주와 함께 먹으면 더 맛있어요!',
			createdAt: '2023-06-15T18:45:00',
			liked: true,
			likeCount: 3
		}
	]);
	
	// 투표 옵션
	let voteOptions = $state([
		{ id: 'vote-1', text: '맛있어요', count: 8, voted: false },
		{ id: 'vote-2', text: '가성비 좋아요', count: 5, voted: false },
		{ id: 'vote-3', text: '분위기 좋아요', count: 4, voted: true },
		{ id: 'vote-4', text: '서비스 좋아요', count: 3, voted: false }
	]);
	
	// 좋아요 상태
	let liked = $state(false);
	let saved = $state(false);
	
	// 댓글창 토글
	function toggleComments() {
		showComments = !showComments;
	}
	
	// 좋아요 토글
	function toggleLike() {
		liked = !liked;
		if (liked) {
			place.likeCount += 1;
		} else {
			place.likeCount -= 1;
		}
	}
	
	// 저장 토글
	function toggleSave() {
		saved = !saved;
		if (saved) {
			place.saveCount += 1;
		} else {
			place.saveCount -= 1;
		}
	}
	
	// 댓글 좋아요 토글
	function toggleCommentLike(commentId: string) {
		comments = comments.map(comment => {
			if (comment.id === commentId) {
				const newLiked = !comment.liked;
				return {
					...comment,
					liked: newLiked,
					likeCount: comment.likeCount + (newLiked ? 1 : -1)
				};
			}
			return comment;
		});
	}
	
	// 투표 토글
	function toggleVote(optionId: string) {
		// 먼저 이전에 투표한 옵션이 있으면 찾아서 취소
		const previousVote = voteOptions.find(option => option.voted);
		
		voteOptions = voteOptions.map(option => {
			if (option.id === optionId) {
				// 이미 투표했던 옵션 클릭 시 투표 취소
				if (option.voted) {
					return { ...option, voted: false, count: option.count - 1 };
				}
				// 새 옵션에 투표
				return { ...option, voted: true, count: option.count + 1 };
			} 
			// 이전에 투표했던 다른 옵션은 취소
			else if (previousVote && option.id === previousVote.id) {
				return { ...option, voted: false, count: option.count - 1 };
			}
			return option;
		});
	}
	
	// 댓글 추가
	function addComment() {
		if (!commentText.trim()) return;
		
		const newComment: Comment = {
			id: `comment-${Date.now()}`,
			userId: 'current-user',
			userName: '나',
			userAvatar: 'https://placehold.co/100x100?text=나',
			text: commentText,
			createdAt: new Date().toISOString(),
			liked: false,
			likeCount: 0
		};
		
		comments = [newComment, ...comments];
		commentText = '';
	}
	
	// 날짜 포맷팅
	function formatDate(dateString: string): string {
		const date = new Date(dateString);
		const now = new Date();
		const diffTime = Math.abs(now.getTime() - date.getTime());
		const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
		
		if (diffDays === 0) {
			const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
			if (diffHours === 0) {
				const diffMinutes = Math.floor(diffTime / (1000 * 60));
				return `${diffMinutes}분 전`;
			}
			return `${diffHours}시간 전`;
		} else if (diffDays < 7) {
			return `${diffDays}일 전`;
		} else {
			return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
		}
	}
	
	// 숫자 포맷팅
	function formatNumber(num: number): string {
		return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
	}
</script>

<div class="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm mb-4">
	<!-- 음식점 정보 헤더 -->
	<div class="flex">
		<!-- 음식점 썸네일 -->
		<div class="w-24 h-24 overflow-hidden">
			<img src={place.thumbnail} alt={place.name} class="w-full h-full object-cover" />
		</div>
		
		<!-- 음식점 정보 -->
		<div class="flex-1 p-3">
			<div class="flex justify-between items-start">
				<div>
					<h3 class="font-medium text-gray-900">{place.name}</h3>
					<p class="text-xs text-gray-500 mt-1">{place.address}</p>
					<div class="flex items-center gap-2 mt-1">
						<span class="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">{place.category}</span>
						<div class="flex items-center gap-1">
							<svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
								<path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
							</svg>
							<span class="text-xs font-medium">{place.rating}</span>
							<span class="text-xs text-gray-500">({formatNumber(place.reviewCount)})</span>
						</div>
					</div>
				</div>
				<div class="flex flex-col items-end gap-2">
					<button 
						class="text-gray-500 hover:text-gray-700"
						on:click={toggleLike}
					>
						<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 {liked ? 'text-red-500 fill-red-500' : ''}" viewBox="0 0 24 24" stroke="currentColor" fill="none">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
						</svg>
					</button>
					<button 
						class="text-gray-500 hover:text-gray-700"
						on:click={toggleSave}
					>
						<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 {saved ? 'text-blue-500 fill-blue-500' : ''}" viewBox="0 0 24 24" stroke="currentColor" fill="none">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
						</svg>
					</button>
				</div>
			</div>
			
			<!-- 통계 -->
			<div class="flex items-center gap-4 mt-2 text-xs text-gray-500">
				<div class="flex items-center gap-1">
					<svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
					</svg>
					<span>{formatNumber(place.likeCount)}</span>
				</div>
				<div class="flex items-center gap-1">
					<svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
					</svg>
					<span>{formatNumber(place.saveCount)}</span>
				</div>
				<div class="flex items-center gap-1">
					<svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
					</svg>
					<span>{formatNumber(comments.length)}</span>
				</div>
			</div>
		</div>
	</div>
	
	<!-- 투표 섹션 -->
	<div class="px-4 py-3 border-t border-gray-100">
		<h4 class="text-sm font-medium text-gray-700 mb-2">이 음식점의 특징은?</h4>
		<div class="flex flex-wrap gap-2">
			{#each voteOptions as option}
				<button 
					class="py-1 px-3 rounded-full text-xs font-medium border transition-colors {option.voted ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'}"
					on:click={() => toggleVote(option.id)}
				>
					{option.text} <span class="text-gray-500">({option.count})</span>
				</button>
			{/each}
		</div>
	</div>
	
	<!-- 액션 버튼 -->
	<div class="flex border-t border-gray-100">
		<button 
			class="flex-1 flex justify-center items-center gap-1 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
			on:click={toggleLike}
		>
			<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 {liked ? 'text-red-500 fill-red-500' : ''}" viewBox="0 0 24 24" stroke="currentColor" fill="none">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
			</svg>
			좋아요
		</button>
		<div class="w-px bg-gray-100"></div>
		<button 
			class="flex-1 flex justify-center items-center gap-1 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
			on:click={toggleComments}
		>
			<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
			</svg>
			댓글 {comments.length > 0 ? comments.length : ''}
		</button>
		<div class="w-px bg-gray-100"></div>
		<button 
			class="flex-1 flex justify-center items-center gap-1 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
			on:click={toggleSave}
		>
			<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 {saved ? 'text-blue-500 fill-blue-500' : ''}" viewBox="0 0 24 24" stroke="currentColor" fill="none">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
			</svg>
			저장
		</button>
	</div>
	
	<!-- 댓글 섹션 -->
	{#if showComments}
		<div class="p-4 bg-gray-50 border-t border-gray-100">
			<!-- 댓글 입력 폼 -->
			<div class="flex gap-2 mb-4">
				<div class="w-8 h-8 rounded-full overflow-hidden">
					<img src="https://placehold.co/100x100?text=나" alt="사용자" class="w-full h-full object-cover" />
				</div>
				<div class="flex-1 relative">
					<input 
						type="text" 
						bind:value={commentText} 
						placeholder="댓글을 입력하세요..." 
						class="w-full py-2 px-3 pr-12 bg-white border border-gray-300 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
						on:keydown={(e) => e.key === 'Enter' && addComment()}
					/>
					<button 
						class="absolute right-3 top-1/2 -translate-y-1/2 text-blue-500 {!commentText.trim() ? 'opacity-50 cursor-not-allowed' : 'hover:text-blue-600'}"
						disabled={!commentText.trim()}
						on:click={addComment}
					>
						<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
							<path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11h4a1 1 0 00.943-1.332l-3-7z" />
						</svg>
					</button>
				</div>
			</div>
			
			<!-- 댓글 목록 -->
			{#if comments.length > 0}
				<div class="space-y-4">
					{#each comments as comment}
						<div class="flex gap-2">
							<div class="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
								<img src={comment.userAvatar} alt={comment.userName} class="w-full h-full object-cover" />
							</div>
							<div class="flex-1">
								<div class="bg-white p-3 rounded-lg shadow-sm">
									<div class="flex justify-between items-start">
										<div class="flex items-center gap-2">
											<span class="font-medium text-gray-900">{comment.userName}</span>
											<span class="text-xs text-gray-500">{formatDate(comment.createdAt)}</span>
										</div>
										<button 
											class="text-gray-400 hover:text-gray-600"
											on:click={() => toggleCommentLike(comment.id)}
										>
											<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 {comment.liked ? 'text-red-500 fill-red-500' : ''}" viewBox="0 0 24 24" stroke="currentColor" fill="none">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
											</svg>
										</button>
									</div>
									<p class="text-sm text-gray-700 mt-1">{comment.text}</p>
								</div>
								<div class="flex items-center gap-3 mt-1 ml-1">
									<button class="text-xs text-gray-500 hover:text-gray-700">답글</button>
									{#if comment.likeCount > 0}
										<div class="flex items-center text-xs text-gray-500">
											<svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 text-red-500 mr-0.5" viewBox="0 0 20 20" fill="currentColor">
												<path fill-rule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clip-rule="evenodd" />
											</svg>
											<span>{comment.likeCount}</span>
										</div>
									{/if}
								</div>
							</div>
						</div>
					{/each}
				</div>
			{:else}
				<div class="text-center py-4">
					<p class="text-gray-500 text-sm">첫 번째 댓글을 남겨보세요!</p>
				</div>
			{/if}
		</div>
	{/if}
</div> 