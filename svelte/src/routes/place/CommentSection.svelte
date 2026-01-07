<script lang="ts">
	import ProfileCircle from '$lib/components/ProfileCircle.svelte';
	import type { SupabaseComment, AuthUser } from '$services/types';
	import CommentItem from './CommentItem.svelte';

	// Props 정의: 데이터 및 상태, 핸들러 함수들
	let {
		comments = $bindable([]), // 구조화된 댓글 목록 (Detail에서 바인딩)
		currentUser,
		totalComments = 0,
		loading = true,
		error = null,
		loadingMore = false,
		replyingTo = $bindable(null), // 답글 대상 상태 (Detail에서 바인딩)
		// --- 입력 상태 바인딩 ---
		newCommentContent = $bindable(''),
		replyContent = $bindable(''),
		// --- 수정 상태 ---
		editingCommentId = null, // 수정 중인 댓글 ID (Detail에서 전달, 기본값 null)
		editContent = $bindable(''), // 수정 내용 (Detail과 양방향 바인딩)
		// --- 핸들러 함수들 ---
		onLoadMore,
		onSubmitComment,
		onSubmitReply,
		onDeleteComment,
		onToggleLike,
		// onUpdateComment, // 수정 로직 변경으로 일단 제거 (Detail에서 직접 상태 변경)
		onStartReply,
		onStartEdit,
		onCancelEdit, // 수정 취소 핸들러 추가
		onSubmitEdit, // 수정 제출 핸들러 추가
		onCancelReply,
		onLoginRequest, // 로그인 요청 핸들러
	} = $props<{
		comments: SupabaseComment[];
		currentUser: AuthUser | null;
		totalComments: number;
		loading: boolean;
		error: string | null;
		loadingMore: boolean;
		replyingTo: { commentId: string; username: string } | null;
		newCommentContent: string;
		replyContent: string;
		// --- 수정 관련 props 추가 ---
		editingCommentId: string | null;
		editContent: string;
		// --- 핸들러 함수 타입 ---
		onLoadMore: () => Promise<void>;
		onSubmitComment: () => Promise<void>;
		onSubmitReply: () => Promise<void>;
		onDeleteComment: (commentId: string) => Promise<void>;
		onToggleLike: (commentId: string) => Promise<void>;
		onStartReply: (commentId: string, username: string) => void;
		onStartEdit: (commentId: string) => void;
		onCancelEdit: () => void; // 추가
		onSubmitEdit: () => Promise<void>; // 추가
		onCancelReply: () => void;
		onLoginRequest: () => void;
	}>();

	// $inspect(currentUser);

	// 입력 상태 변경을 알리기 위한 디스패처 (Svelte 5 $bindable 사용 시 불필요)
	// const dispatch = createEventDispatcher();

	// 로컬 상태: 제출 중 상태 (UI 피드백용)
	let isSubmittingComment = $state(false);
	let isSubmittingReply = $state(false);
	let isSubmittingEdit = $state(false); // 수정 제출 중 상태 추가

	// 댓글 제출 핸들러
	async function handleSubmitComment() {
		if (!newCommentContent.trim() || isSubmittingComment) return;
		isSubmittingComment = true;
		await onSubmitComment(); // Detail의 핸들러 호출
		isSubmittingComment = false;
	}

	// 답글 제출 핸들러
	async function handleSubmitReply() {
		if (!replyContent.trim() || isSubmittingReply) return;
		isSubmittingReply = true;
		await onSubmitReply(); // Detail의 핸들러 호출
		isSubmittingReply = false;
	}

	// 수정 제출 핸들러
	async function handleSubmitEdit() {
		if (!editContent.trim() || isSubmittingEdit) return;
		isSubmittingEdit = true;
		await onSubmitEdit(); // Detail의 핸들러 호출
		isSubmittingEdit = false;
	}

	// 댓글 삭제 핸들러 (CommentItem에서 직접 호출하도록 변경 가능)
	// async function handleDelete(commentId: string) {
	//     await onDeleteComment(commentId);
	// }

	// 좋아요 토글 핸들러 (CommentItem에서 직접 호출하도록 변경 가능)
	// async function handleToggleLike(commentId: string) {
	//     await onToggleLike(commentId);
	// }

	// 기본 아바타 URL
	// const defaultAvatar = 'https://via.placeholder.com/150/cccccc/808080?text=User';
	const defaultAvatar = 'https://placehold.co/150x150?text=User';

	// 현재 로드된 댓글 수 계산 (UI 표시용)
	const loadedCommentCount = $derived(() => {
		return comments.reduce((count: number, comment: SupabaseComment) => {
			return count + 1 + (comment.replies?.length ?? 0);
		}, 0);
	});
</script>

<div class="p-4">
	<!-- 댓글 작성 영역 -->
	{#if currentUser}
		<div class="mb-5 rounded-lg bg-gray-50 p-3">
			<div class="flex gap-3">
				<ProfileCircle
					mr=""
					profile_image_url={currentUser.profile.profile_image_url}
					nickname={currentUser.profile.nickname || '익명'}
					height="h-10"
					width="w-10"
				/>
				<!-- <img
					src={currentUser.metadata.avatar_url || defaultAvatar}
					alt="내 프로필"
					class="h-10 w-10 shrink-0 rounded-full"
				/> -->
				<div class="flex-1">
					<textarea
						bind:value={newCommentContent}
						placeholder="이 장소에 대한 의견을 남겨보세요..."
						class="w-full resize-none rounded-lg border border-gray-200 p-3 focus:ring-1 focus:ring-blue-500 focus:outline-none"
						rows="2"
						disabled={isSubmittingComment}
						aria-label="새 댓글 작성"
					></textarea>
					<div class="mt-2 flex justify-end">
						<button
							class="rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
							disabled={!newCommentContent.trim() || isSubmittingComment}
							onclick={handleSubmitComment}
						>
							{isSubmittingComment ? '등록 중...' : '댓글 달기'}
						</button>
					</div>
				</div>
			</div>
		</div>
	{:else}
		<div class="mb-5 rounded-lg bg-gray-50 p-4 text-center text-sm text-gray-600">
			댓글을 작성하려면 <button
				class="font-medium text-blue-600 hover:underline"
				onclick={onLoginRequest}
			>
				로그인
			</button>
			이 필요합니다.
		</div>
	{/if}

	<!-- 댓글 목록 -->
	{#if loading}
		<div class="py-6 text-center text-gray-500">댓글을 불러오는 중...</div>
	{:else if error}
		<div class="py-6 text-center text-red-500">{error}</div>
	{:else if comments.length === 0 && totalComments === 0}
		<div class="py-6 text-center">
			<p class="text-gray-500">아직 댓글이 없습니다. 첫 댓글을 작성해보세요!</p>
		</div>
	{:else}
		<div class="space-y-4">
			{#each comments as comment (comment.id)}
				<div class="rounded-lg border border-gray-100 bg-white p-3">
					<CommentItem
						{comment}
						{currentUser}
						onReply={onStartReply}
						onDelete={onDeleteComment}
						{onToggleLike}
						onEdit={onStartEdit}
					/>
					<!-- 수정 입력 필드 -->
					{#if editingCommentId === comment.id}
						<div class="mt-3 border-t border-gray-100 pt-3">
							<textarea
								id="edit-input-{comment.id}"
								bind:value={editContent}
								placeholder="댓글 내용 수정..."
								class="w-full resize-none rounded-lg border border-gray-200 p-3 focus:ring-1 focus:ring-blue-500 focus:outline-none"
								rows="2"
								disabled={isSubmittingEdit}
								aria-label="댓글 수정 내용 입력"
							></textarea>
							<div class="mt-2 flex justify-end gap-2">
								<button
									class="rounded-lg bg-gray-200 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-300"
									onclick={onCancelEdit}
								>
									취소
								</button>
								<button
									class="rounded-lg bg-blue-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
									disabled={!editContent.trim() || isSubmittingEdit}
									onclick={handleSubmitEdit}
								>
									{isSubmittingEdit ? '수정 중...' : '수정 완료'}
								</button>
							</div>
						</div>
					{/if}
					<!-- 답글 목록 -->
					{#if comment.replies && comment.replies.length > 0}
						<div class="mt-3 space-y-3 border-l-2 border-gray-100 pt-3 pl-4">
							{#each comment.replies as reply (reply.id)}
								<CommentItem
									comment={reply}
									{currentUser}
									onReply={() => {}}
									onDelete={onDeleteComment}
									{onToggleLike}
									onEdit={onStartEdit}
								/>
								<!-- 답글 수정 입력 필드 -->
								{#if editingCommentId === reply.id}
									<div class="mt-3 border-t border-gray-100 pt-3">
										<textarea
											id="edit-input-{reply.id}"
											bind:value={editContent}
											placeholder="답글 내용 수정..."
											class="w-full resize-none rounded-lg border border-gray-200 p-3 focus:ring-1 focus:ring-blue-500 focus:outline-none"
											rows="2"
											disabled={isSubmittingEdit}
											aria-label="답글 수정 내용 입력"
										></textarea>
										<div class="mt-2 flex justify-end gap-2">
											<button
												class="rounded-lg bg-gray-200 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-300"
												onclick={onCancelEdit}
											>
												취소
											</button>
											<button
												class="rounded-lg bg-blue-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
												disabled={!editContent.trim() || isSubmittingEdit}
												onclick={handleSubmitEdit}
											>
												{isSubmittingEdit ? '수정 중...' : '수정 완료'}
											</button>
										</div>
									</div>
								{/if}
							{/each}
						</div>
					{/if}
				</div>
			{/each}

			<!-- 댓글 더보기 버튼 -->
			{#if loadedCommentCount < totalComments}
				<div class="pt-4 text-center">
					<button
						class="rounded-full bg-gray-100 px-4 py-2 text-sm text-gray-700 hover:bg-gray-200 disabled:opacity-50"
						onclick={onLoadMore}
						disabled={loadingMore}
					>
						{loadingMore ? '불러오는 중...' : '댓글 더 보기'}
					</button>
				</div>
			{/if}
		</div>
	{/if}
</div>

<!-- 답글 입력 모달 (하단 고정) -->
{#if replyingTo && currentUser}
	<div class="fixed right-0 bottom-0 left-0 z-50 border-t border-gray-200 bg-white p-4 shadow-lg">
		<div class="mx-auto max-w-lg">
			<div class="mb-2 flex items-center justify-between">
				<span class="text-sm text-gray-600">
					<strong>{replyingTo.username}</strong>
					님에게 답글 작성 중
				</span>
				<button
					class="p-1 text-gray-500 hover:text-gray-700"
					onclick={onCancelReply}
					aria-label="답글 취소"
				>
					<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M6 18L18 6M6 6l12 12"
						></path>
					</svg>
				</button>
			</div>
			<div class="flex gap-3">
				<img
					src={currentUser?.metadata.avatar_url || defaultAvatar}
					alt="내 프로필"
					class="h-10 w-10 shrink-0 rounded-full"
				/>
				<div class="flex-1">
					<textarea
						id="replyInput"
						bind:value={replyContent}
						placeholder="답글을 입력하세요..."
						class="w-full resize-none rounded-lg border border-gray-200 p-3 focus:ring-1 focus:ring-blue-500 focus:outline-none"
						rows="2"
						disabled={isSubmittingReply}
						aria-label="답글 내용 입력"
					></textarea>
					<div class="mt-2 flex justify-end">
						<button
							class="rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
							disabled={!replyContent.trim() || isSubmittingReply}
							onclick={handleSubmitReply}
						>
							{isSubmittingReply ? '등록 중...' : '답글 달기'}
						</button>
					</div>
				</div>
			</div>
		</div>
	</div>
{/if}
