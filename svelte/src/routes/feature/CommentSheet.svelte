<script lang="ts">
	import BottomSheet from '$lib/BottomSheet';
	import { Heart } from 'lucide-svelte';
	import { authStore, type UserInfo } from '$services/auth.store';
	import type { SupabaseComment } from '../../services/types';

	const {
		isOpen = false,
		comments = [],
		isLoggedIn = false,
		input = '',
		onInput = (e: Event) => {},
		onSubmit = () => {},
		onClose = () => {},
		onLike = (id: string) => {},
		onReply = (c: SupabaseComment) => {},
		onEdit = (id: string, content: string) => {},
		onDelete = (id: string) => {},
		replyTo = null,
		isLoading = false,
	} = $props<{
		isOpen?: boolean;
		comments?: SupabaseComment[];
		isLoggedIn?: boolean;
		input?: string;
		onInput?: (e: Event) => void;
		onSubmit?: () => void;
		onClose?: () => void;
		onLike?: (id: string) => void;
		onReply?: (c: SupabaseComment) => void;
		onEdit?: (id: string, content: string) => void;
		onDelete?: (id: string) => void;
		replyTo?: SupabaseComment | null;
		isLoading?: boolean;
	}>();

	let isSheetOpen = $state(isOpen);
	$effect(() => {
		isSheetOpen = isOpen;
	});

	let currentUser = $state<UserInfo | null>(null);

	// UserInfo
	// let isAuthenticated = $state(false);
	authStore.subscribe((userInfo) => {
		// isAuthenticated = userInfo.isAuthenticated;
		currentUser = userInfo;
		// console.log('[CommentSheet] 인증 상태 변경:', isAuthenticated);
	});

	// $inspect(currentUser);
	// $effect(() => { currentUser = authStore.getUser(); });
	let editingId: string | null = $state(null);
	let editContent: string = $state('');

	const handleInput = (e: Event) => onInput(e);
	const handleSubmit = () => onSubmit();
	const handleClose = () => onClose();

	function startEdit(comment: SupabaseComment) {
		editingId = comment.id;
		editContent = comment.content;
	}
	function cancelEdit() {
		editingId = null;
		editContent = '';
	}
	function submitEdit(comment: SupabaseComment) {
		if (editContent.trim()) {
			onEdit(comment.id, editContent.trim());
		}
		editingId = null;
		editContent = '';
	}
	function deleteComment(comment: SupabaseComment) {
		if (confirm('댓글을 삭제하시겠습니까?')) {
			onDelete(comment.id);
		}
	}

	// $inspect(currentUser);
	// 댓글 트리 변환
	function buildCommentTree(comments: SupabaseComment[]) {
		const map = new Map<string, SupabaseComment & { replies: SupabaseComment[] }>();
		comments.forEach((c) => map.set(c.id, { ...c, replies: [] }));
		const roots: (SupabaseComment & { replies: SupabaseComment[] })[] = [];
		map.forEach((c) => {
			if (c.parent_comment_id && map.has(c.parent_comment_id)) {
				map.get(c.parent_comment_id)!.replies.push(c);
			} else if (!c.parent_comment_id) {
				roots.push(c);
			}
		});
		return roots;
	}

	let expanded: Record<string, boolean> = $state({});
	$effect(() => {
		expanded = {};
	}); // 시트 열릴 때마다 초기화

	const commentTree = $derived(buildCommentTree(comments));
</script>

<BottomSheet
	bind:isSheetOpen
	settings={{ maxHeight: 0.9, snapPoints: [0.3, 0.9], startingSnapPoint: 0.9 }}
	onopen={() => {}}
	onclose={handleClose}
>
	<BottomSheet.Overlay>
		<BottomSheet.Sheet
			style="max-width: 510px; margin: 0 auto; height: 100%; display: flex; flex-direction: column; min-height: 0;"
		>
			<BottomSheet.Handle>
				<BottomSheet.Grip />
				<div
					class="flex items-center justify-between border-b border-gray-100 px-4 py-3 dark:border-neutral-800"
				>
					<span class="text-base font-semibold">댓글</span>
					<button class="p-1" onclick={handleClose} aria-label="닫기">
						<svg
							class="h-6 w-6 text-gray-400"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M6 18L18 6M6 6l12 12"
							/>
						</svg>
					</button>
				</div>
			</BottomSheet.Handle>
			<BottomSheet.Content
				style="display: flex; flex-direction: column; flex: 1 1 0; min-height: 0;"
			>
				<div class="flex-1 space-y-4 overflow-y-auto px-4 py-2">
					{#if isLoading}
						<div class="py-8 text-center text-gray-400">불러오는 중...</div>
					{:else if !comments || comments.length === 0}
						<div
							class="flex h-40 flex-col items-center justify-center text-sm text-gray-400 select-none"
						>
							아직 댓글이 없습니다.
							<br />
							댓글을 남겨보세요.
						</div>
					{:else}
						{#each commentTree as comment (comment.id)}
							<div class="flex flex-col gap-1">
								<!-- 원본 댓글 -->
								<div class="group relative flex items-start gap-3 py-2">
									<img
										src={comment.avatar_url || '/default-avatar.png'}
										alt="avatar"
										class="h-9 w-9 rounded-full bg-gray-200 object-cover dark:bg-neutral-700"
									/>
									<div class="min-w-0 flex-1">
										<div class="flex items-center gap-2">
											<span class="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
												{comment.username || '익명'}
											</span>
											<span class="text-xs text-gray-400">{comment.created_at.slice(0, 10)}</span>
										</div>
										{#if editingId === comment.id}
											<div class="mt-1 flex gap-2">
												<input
													class="w-full bg-gray-100 dark:bg-neutral-700 dark:text-gray-200 rounded-full py-2 pl-9 pr-4 text-base focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white dark:focus:bg-neutral-600 transition-colors"
													bind:value={editContent}
												/>
												<button
													class="text-xs text-blue-600 whitespace-nowrap"
													onclick={(e) => {
														e.stopPropagation();
														submitEdit(comment);
													}}
												>
													저장
												</button>
												<button
													class="text-xs text-gray-400 whitespace-nowrap"
													onclick={(e) => {
														e.stopPropagation();
														cancelEdit();
													}}
												>취소</button>
											</div>
										{:else}
											<div class="mt-0.5 text-sm break-words text-gray-800 dark:text-gray-200">
												{comment.content}
											</div>
										{/if}
										<div class="mt-1 flex items-center gap-3">
											{#if !editingId && !replyTo && isLoggedIn}
												<button
													class="text-xs text-gray-400 hover:text-indigo-600 whitespace-nowrap"
													onclick={(e) => {
														e.stopPropagation();
														onReply(comment);
													}}
												>
													답글
												</button>
											{/if}
											{#if comment.user_id === currentUser?.id && !editingId && isLoggedIn}
												<div class="absolute top-2 right-12 flex gap-1">
													<button
														class="text-xs text-gray-400 whitespace-nowrap"
														onclick={(e) => {
															e.stopPropagation();
															startEdit(comment);
														}}
													>
														수정
													</button>
													<button
														class="text-xs text-gray-400 whitespace-nowrap"
														onclick={(e) => {
															e.stopPropagation();
															deleteComment(comment);
														}}
													>
														삭제
													</button>
												</div>
											{/if}
										</div>
									</div>
									<div class="ml-auto flex flex-col items-center">
										<button
											class="p-1"
											onclick={(e) => {
												e.stopPropagation();
												if (isLoggedIn) {
													onLike(comment.id);
												}
											}}
											aria-label="좋아요"
										>
											<Heart
												class="h-5 w-5 {comment.is_liked
													? 'fill-red-500 text-red-500'
													: 'text-gray-400'}"
												fill={comment.is_liked ? 'currentColor' : 'none'}
											/>
										</button>
										{#if (comment.likes ?? 0) > 0}
											<span class="text-xs text-gray-500">{comment.likes ?? 0}</span>
										{/if}
									</div>
								</div>
								<!-- 답글 목록 (펼침) -->
								{#if expanded[comment.id] && comment.replies.length > 0}
									<div class="ml-10 border-l border-gray-100 pl-4">
										{#each comment.replies as reply (reply.id)}
											<div class="relative flex items-start gap-3 py-2">
												<img
													src={reply.avatar_url || '/default-avatar.png'}
													alt="avatar"
													class="h-8 w-8 rounded-full bg-gray-200 object-cover dark:bg-neutral-700"
												/>
												<div class="min-w-0 flex-1">
													<div class="flex items-center gap-2">
														<span
															class="truncate text-sm font-medium text-gray-900 dark:text-gray-100"
														>
															{reply.username || '익명'}
														</span>
														<span class="text-xs text-gray-400">
															{reply.created_at.slice(0, 10)}
														</span>
													</div>
													{#if editingId === reply.id}
														<div class="mt-1 flex gap-2">
															<input
																class="w-full bg-gray-100 dark:bg-neutral-700 dark:text-gray-200 rounded-full py-2 pl-9 pr-4 text-base focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white dark:focus:bg-neutral-600 transition-colors"
																bind:value={editContent}
															/>
															<button
																class="text-xs text-blue-600 whitespace-nowrap"
																onclick={(e) => {
																	e.stopPropagation();
																	submitEdit(reply);
																}}
															>
																저장
															</button>
															<button
																class="text-xs text-gray-400 whitespace-nowrap"
																onclick={(e) => {
																	e.stopPropagation();
																	cancelEdit();
																}}
															>
																취소
															</button>
														</div>
													{:else}
														<div
															class="mt-0.5 text-sm break-words text-gray-800 dark:text-gray-200"
														>
															{reply.content}
														</div>
													{/if}
												</div>
												<div class="ml-auto flex flex-col items-center">
													<button
														class="p-1"
														onclick={(e) => {
															e.stopPropagation();
															if (isLoggedIn) {
																onLike(reply.id);
															}
														}}
														aria-label="좋아요"
													>
														<Heart
															class="h-5 w-5 {reply.is_liked
																? 'fill-red-500 text-red-500'
																: 'text-gray-400'}"
															fill={reply.is_liked ? 'currentColor' : 'none'}
														/>
													</button>
													{#if (reply.likes ?? 0) > 0}
														<span class="text-xs text-gray-500">{reply.likes ?? 0}</span>
													{/if}
												</div>
												{#if reply.user_id === currentUser?.id && !editingId && isLoggedIn}
													<div class="absolute top-2 right-12 flex gap-1">
														<button
															class="text-xs text-gray-400 whitespace-nowrap"
															onclick={(e) => {
																e.stopPropagation();
																startEdit(reply);
															}}
														>
															수정
														</button>
														<button
															class="text-xs text-gray-400 whitespace-nowrap"
															onclick={(e) => {
																e.stopPropagation();
																deleteComment(reply);
															}}
														>
															삭제
														</button>
													</div>
												{/if}
											</div>
										{/each}
									</div>
								{/if}
								{#if comment.replies.length > 0 && !expanded[comment.id]}
									<button
										class="ml-2 text-xs text-gray-400 hover:text-indigo-600 whitespace-nowrap"
										onclick={(e) => {
											e.stopPropagation();
											expanded[comment.id] = true;
										}}
									>
										댓글 {comment.replies.length}개 보기
									</button>
								{/if}
							</div>
						{/each}
					{/if}
				</div>
				<!-- 댓글 입력창 (로그인 시에만) -->
				{#if isLoggedIn}
					<div
						class="border-t border-gray-100 bg-white px-4 py-2 dark:border-neutral-800 dark:bg-neutral-900"
					>
						{#if replyTo}
							<div class="mb-2 flex items-center gap-2 text-xs text-gray-500">
								<span class="font-semibold text-indigo-600">@{replyTo.username || '익명'}</span>
								님에게 답글 남기는 중
								<button
									class="ml-2 text-xs text-gray-400 hover:text-red-500"
									onclick={(e) => {
										e.stopPropagation();
										onReply(null);
									}}
								>
									취소
								</button>
							</div>
						{/if}
						<div class="flex items-center gap-2">
							<input
								class="w-full bg-gray-100 dark:bg-neutral-700 dark:text-gray-200 rounded-full py-2 pl-9 pr-4 text-base focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white dark:focus:bg-neutral-600 transition-colors"
								placeholder={replyTo ? '답글을 입력하세요...' : '댓글을 입력하세요...'}
								value={input}
								oninput={handleInput}
								onkeydown={(e) => e.key === 'Enter' && handleSubmit()}
							/>
							<button
								class="ml-2 rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 whitespace-nowrap"
								onclick={(e) => {
									e.stopPropagation();
									handleSubmit();
								}}
								disabled={!input.trim()}
							>
								등록
							</button>
						</div>
						<!-- <div class="mt-1 text-xs text-gray-400">댓글 달기</div> -->
					</div>
				{:else}
					<div
						class="sticky bottom-0 left-0 w-full border-t border-gray-100 bg-white px-4 py-3 text-center text-sm text-gray-500 dark:border-neutral-800 dark:bg-neutral-900"
					>
						댓글을 작성하려면 <span class="font-semibold text-indigo-600">로그인</span>
						이 필요합니다.
					</div>
				{/if}
			</BottomSheet.Content>
		</BottomSheet.Sheet>
	</BottomSheet.Overlay>
</BottomSheet>

<style>
	:global(.dark) .bg-gray-100 {
		background-color: #262626;
	}
</style>
