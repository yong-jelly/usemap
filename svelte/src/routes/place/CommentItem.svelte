<script lang="ts">
	import ProfileCircle from '$lib/components/ProfileCircle.svelte';

	// 타입을 types.ts 에서 가져오도록 수정
	import type { SupabaseComment, AuthUser } from '$services/types';
	import { getTimeAgo as timeAgo } from '$utils/time.util'; // timeAgo 유틸리티 경로 확인 필요

	// Props 정의: 댓글 데이터, 현재 사용자, 핸들러 함수들
	let {
		comment,
		currentUser,
		onReply,
		onDelete,
		onToggleLike,
		onEdit, // Detail의 handleStartEdit 호출
	} = $props<{
		comment: SupabaseComment;
		currentUser: AuthUser | null;
		onReply: (commentId: string, username: string) => void; // 답글 시작
		onDelete: (commentId: string) => void; // 삭제 요청
		onToggleLike: (commentId: string) => void; // 좋아요 토글 요청
		onEdit: (commentId: string) => void; // 수정 모드 진입 (Detail에서 처리)
	}>();

	// 자신이 작성한 댓글인지 확인
	const isOwnComment = $derived(currentUser?.id === comment.user_id);
    
    // 삭제된 댓글인지 확인
    const isDeleted = $derived(comment.is_active === false);

	// // 기본 아바타 URL
	// const defaultAvatar = 'https://via.placeholder.com/150/cccccc/808080?text=User';

	// 더보기 메뉴 표시 상태 (로컬 UI 상태)
	let showOptionsMenu = $state(false);

	function toggleOptionsMenu() {
		showOptionsMenu = !showOptionsMenu;
	}
	function hideOptionsMenu() {
		setTimeout(() => { showOptionsMenu = false; }, 150);
	}

</script>

<div class="flex gap-3 {isDeleted ? 'opacity-60' : ''}">
	<ProfileCircle mr="" profile_image_url={comment.avatar_url} nickname={comment.username || '익명'} height="h-12" width="w-12" />
	<!-- <img
		src={comment.avatar_url || defaultAvatar}
		alt={comment.username || '익명'}
		class="h-10 w-10 shrink-0 rounded-full {isDeleted ? 'grayscale' : ''}"
		loading="lazy"
	/> -->
	<div class="flex-1">
		<div class="flex items-center justify-between">
			<div>
				<span class="font-bold">{comment.username || '탈퇴한 사용자'}</span>
				<span class="ml-2 text-xs text-gray-500">
					{timeAgo(comment.created_at)}
					{#if comment.updated_at && comment.created_at !== comment.updated_at && !isDeleted}
						(수정됨)
					{/if}
				</span>
			</div>
			<!-- 더보기 메뉴 버튼 - 삭제된 댓글은 표시하지 않음 -->
			{#if isOwnComment && !isDeleted /* || currentUser?.metadata?.is_admin */}
				<div class="relative">
					<button
						class="text-gray-400 hover:text-gray-600 p-1"
						aria-label="댓글 옵션"
						onclick={toggleOptionsMenu}
						onblur={hideOptionsMenu} 
					>
						<svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20"> <path d="M10 6a2 2 0 110-4 2 2 0 010 4zm0 6a2 2 0 110-4 2 2 0 010 4zm0 6a2 2 0 110-4 2 2 0 010 4z"></path> </svg>
					</button>
					<!-- 드롭다운 메뉴 -->
					{#if showOptionsMenu}
						<div
							class="absolute right-0 z-10 mt-1 w-24 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
							role="menu" aria-orientation="vertical" tabindex="-1"
						>
							{#if isOwnComment}
								<button
									role="menuitem" tabindex="-1"
									class="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50"
									onclick={() => { onEdit(comment.id); hideOptionsMenu(); }}
								>
									수정
								</button>
								<button
									role="menuitem" tabindex="-1"
									class="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-100"
									onclick={() => { onDelete(comment.id); hideOptionsMenu(); }}
								>
									삭제
								</button>
							{/if}
						</div>
					{/if}
				</div>
			{/if}
		</div>

		<!-- 삭제된 댓글은 다른 스타일로 표시 -->
        {#if isDeleted}
            <p class="mt-1 text-sm italic text-gray-500">삭제된 댓글입니다.</p>
        {:else}
		    <p class="mt-1 whitespace-pre-line text-sm text-gray-800">{comment.content}</p>
        {/if}

		<div class="mt-2 flex gap-4">
            <!-- 삭제된 댓글은 좋아요 버튼 비활성화 -->
			{#if !isDeleted}
                <button
                    class="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-60"
                    onclick={() => onToggleLike(comment.id)}
                    disabled={!currentUser}
                    aria-label="좋아요 {comment.likes ?? 0}"
                    aria-pressed={comment.isLiked}
                >
                    <svg
                        class="h-4 w-4 {comment.isLiked ? 'fill-red-500 text-red-500' : 'text-gray-400'}"
                        fill={comment.isLiked ? 'currentColor' : 'none'}
                        stroke="currentColor"
                        stroke-width="2"
                        viewBox="0 0 24 24"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                        ></path>
                    </svg>
                    <span>{comment.likes ?? 0}</span>
                </button>
            {:else}
                <!-- 삭제된 댓글에서는 좋아요 수만 표시 -->
                {#if (comment.likes ?? 0) > 0}
                    <div class="flex items-center gap-1 text-xs text-gray-400">
                        <svg
                            class="h-4 w-4 text-gray-300"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                            viewBox="0 0 24 24"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                            ></path>
                        </svg>
                        <span>{comment.likes}</span>
                    </div>
                {/if}
            {/if}
            
			{#if comment.comment_level === 0 && !isDeleted}
				<button
					class="text-xs text-gray-500 hover:text-gray-700 disabled:cursor-not-allowed"
					onclick={() => onReply(comment.id, comment.username || '익명')}
                    disabled={!currentUser}
				>
					답글 {#if (comment.reply_count ?? 0) > 0}({comment.reply_count}){/if}
				</button>
			{:else if comment.comment_level === 0 && (comment.reply_count ?? 0) > 0}
                <!-- 삭제된 댓글이지만 답글이 있는 경우 답글 수만 표시 -->
                <span class="text-xs text-gray-400">
                    답글 ({comment.reply_count})
                </span>
            {/if}
		</div>
	</div>
</div>
