<script lang="ts">
	import { goto } from '@mateothegreat/svelte5-router';
	import { onMount } from 'svelte';
	
	// props를 통해 ID 파라미터 가져오기
	const props = $props<{ route: { result: { path: { params: { id: string } } } } }>();
	const postId = props.route?.result?.path?.params?.id || window.location.pathname.split('/content/')[1] || 'post1';

	// 임시 데이터 (실제로는 API에서 가져올 것)
	const posts = [
		{
			id: 'post1',
			username: 'me',
			userAvatar: 'https://i.pravatar.cc/150?img=6',
			postImage: [
				'https://picsum.photos/800/800?random=10',
				'https://picsum.photos/800/800?random=11'
			],
			likes: 127,
			caption: '오늘 새로운 프로젝트 시작했어요! #개발 #프로그래밍',
			comments: 12,
			timestamp: '10분 전',
			communityName: '개발자 모임',
			communityAvatar: 'https://i.pravatar.cc/150?img=15',
			title: '새 프로젝트 시작',
			content: '오늘부터 신규 프로젝트를 시작했습니다. 열심히 개발해서 좋은 결과물을 만들어보겠습니다! 많은 응원 부탁드려요. #개발 #프로그래밍',
			link: {
				url: 'https://github.com/myproject',
				title: '내 프로젝트 GitHub 저장소'
			},
			isMyPost: true,
			userBio: '개발자 | UI/UX 디자이너 | 오픈소스 기여자',
			commentList: [
				{ 
					id: 'c1', 
					username: 'user2', 
					userAvatar: 'https://i.pravatar.cc/150?img=2',
					content: '멋진 프로젝트네요! 응원합니다.',
					timestamp: '5분 전',
					likes: 3,
					replies: [
						{
							id: 'r1',
							username: 'me',
							userAvatar: 'https://i.pravatar.cc/150?img=6',
							content: '감사합니다! 열심히 해볼게요 😊',
							timestamp: '3분 전',
							likes: 1
						}
					]
				},
				{ 
					id: 'c2', 
					username: 'user3', 
					userAvatar: 'https://i.pravatar.cc/150?img=3',
					content: '어떤 기술 스택으로 개발하실 예정인가요?',
					timestamp: '8분 전',
					likes: 1,
					replies: []
				}
			]
		},
		{
			id: 'post2',
			username: 'user1',
			userAvatar: 'https://i.pravatar.cc/150?img=1',
			postImage: [
				'https://picsum.photos/800/800?random=1',
				'https://picsum.photos/800/800?random=2',
				'https://picsum.photos/800/800?random=3'
			],
			likes: 1234,
			caption: '오늘의 일상 #일상 #데일리',
			comments: 89,
			timestamp: '2시간 전',
			communityName: '일상의 순간',
			communityAvatar: 'https://i.pravatar.cc/150?img=10',
			title: '오늘의 일상 공유',
			content: '오늘은 정말 좋은 날씨네요. 산책도 다녀오고 맛있는 점심도 먹었습니다. 오후에는 카페에서 책도 읽고 정말 여유로운 하루를 보냈어요. 여러분의 하루는 어땠나요? #일상 #데일리',
			link: {
				url: 'https://example.com/blog-post',
				title: '블로그 포스트: 오늘의 일상'
			},
			userBio: '여행 좋아하는 사진가 | 일상 공유',
			commentList: [
				{ 
					id: 'c3', 
					username: 'user5', 
					userAvatar: 'https://i.pravatar.cc/150?img=5',
					content: '날씨가 정말 좋았죠! 저도 산책 다녀왔어요.',
					timestamp: '1시간 전',
					likes: 12,
					replies: []
				},
				{ 
					id: 'c4', 
					username: 'user6', 
					userAvatar: 'https://i.pravatar.cc/150?img=6',
					content: '어떤 책 읽으셨나요? 추천해주세요!',
					timestamp: '1시간 30분 전',
					likes: 5,
					replies: [
						{
							id: 'r2',
							username: 'user1',
							userAvatar: 'https://i.pravatar.cc/150?img=1',
							content: '"소설가의 일"이라는 책인데 정말 좋았어요! 추천합니다~',
							timestamp: '1시간 전',
							likes: 2
						}
					]
				}
			]
		}
	];
	
	// ID와 일치하는 게시물 찾기
	const post = posts.find(p => p.id === postId) || posts[0];

	// 이미지 배열 처리
	const images = post.postImage 
		? Array.isArray(post.postImage) 
			? post.postImage
			: [post.postImage]
		: [];

	// 댓글 상태 관리
	let newComment = '';
	let replyingTo = $state({ commentId: '', username: '' });
	let replyContent = $state('');

	// 좋아요 상태 (실제로는 API와 연동 필요)
	let isLiked = $state(false);
	let likeCount = $state(post.likes);
	
	// 스크롤 요소 참조
	let contentElement: HTMLElement;

	// 페이지 마운트 시 스크롤을 맨 위로 이동
	$effect(() => {
		if (contentElement) {
			// console.log(contentElement.scrollHeight)
			contentElement.scrollIntoView();
		}
	});

	function toggleLike(): void {
		isLiked = !isLiked;
		likeCount = isLiked ? likeCount + 1 : likeCount - 1;
	}

	function submitComment(): void {
		if (!newComment.trim()) return;
		// 실제로는 API 호출
		alert('댓글이 추가되었습니다: ' + newComment);
		newComment = '';
	}

	function startReply(commentId: string, username: string): void {
		replyingTo = { commentId, username };
		// 댓글 입력란으로 스크롤
		setTimeout(() => {
			document.getElementById('replyInput')?.focus();
		}, 100);
	}

	function cancelReply(): void {
		replyingTo = { commentId: '', username: '' };
		replyContent = '';
	}

	function submitReply(): void {
		if (!replyContent.trim() || !replyingTo.commentId) return;
		// 실제로는 API 호출
		alert(`${replyingTo.username}님에게 답글이 추가되었습니다: ${replyContent}`);
		replyContent = '';
		replyingTo = { commentId: '', username: '' };
	}

	// 피드 페이지로 돌아갈 때 스크롤 위치 유지 - 최적화된 버전
	function goBack(): void {
		// 먼저 네비게이션 실행
		goto('/content');
		
		// 비동기적으로 스크롤 위치 저장
		// requestAnimationFrame(() => {
		// 	try {
		// 		if (typeof sessionStorage !== 'undefined') {
		// 			const scrollPosition = window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0;
		// 			sessionStorage.setItem('feed_scroll_position', scrollPosition.toString());
		// 		}
		// 	} catch (e) {
		// 		console.warn('스크롤 위치 저장 실패:', e);
		// 	}
		// });
	}

	// 뒤로가기 스와이프 구현
	let startX: number;
	let startTime: number;

	function handleTouchStart(e: TouchEvent): void {
		startX = e.touches[0].clientX;
		startTime = new Date().getTime();
	}

	function handleTouchEnd(e: TouchEvent): void {
		const endX = e.changedTouches[0].clientX;
		const endTime = new Date().getTime();
		const diffX = endX - startX;
		const diffTime = endTime - startTime;

		// 왼쪽 가장자리에서 시작해서 오른쪽으로 스와이프하는 경우 (뒤로가기)
		if (startX < 50 && diffX > 100 && diffTime < 300) {
			goBack();
		}
	}

</script>

<!-- 상단 앱바 (헤더) - 고정 위치 -->
<header class="fixed top-0 left-0 right-0 bg-white p-3 border-b border-gray-200 z-50 flex items-center shadow-xs">
	<button class="p-2 rounded-full hover:bg-gray-100" onclick={goBack}>
		<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
		</svg>
	</button>
	<h1 class="ml-4 text-lg font-bold">게시물</h1>
	<div class="ml-auto flex gap-4">
		<button class="p-2 rounded-full hover:bg-gray-100">
			<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
			</svg>
		</button>
		{#if post.isMyPost}
			<button class="p-2 rounded-full hover:bg-gray-100">
				<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
				</svg>
			</button>
		{/if}
	</div>
</header>

<!-- 댓글 입력 영역 (하단 고정) -->
<footer class="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-md z-50">
	{#if replyingTo.commentId}
		<!-- 대댓글 입력 -->
		<div class="p-3">
			<div class="flex items-center mb-2">
				<span class="text-xs text-gray-500">
					<strong>{replyingTo.username}</strong>님에게 답글 남기는 중
				</span>
				<button class="ml-2 text-xs text-red-500" onclick={cancelReply}>취소</button>
			</div>
			<div class="flex items-center gap-2">
				<img src={post.isMyPost ? post.userAvatar : "https://i.pravatar.cc/150?img=6"} alt="프로필" class="w-8 h-8 rounded-full" />
				<div class="flex-1 relative">
					<input 
						id="replyInput"
						type="text" 
						bind:value={replyContent}
						placeholder="답글 작성..." 
						class="w-full rounded-full pl-3 pr-12 py-2 bg-gray-100 focus:outline-hidden focus:ring-1 focus:ring-blue-500" 
					/>
					<button 
						class="absolute right-2 top-1/2 -translate-y-1/2 text-blue-500 p-1 {!replyContent.trim() ? 'opacity-50' : ''}"
						disabled={!replyContent.trim()}
						onclick={submitReply}
					>
						<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
							<path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
						</svg>
					</button>
				</div>
			</div>
		</div>
	{:else}
		<!-- 일반 댓글 입력 -->
		<div class="p-3">
			<div class="flex items-center gap-2">
				<img src={post.isMyPost ? post.userAvatar : "https://i.pravatar.cc/150?img=6"} alt="프로필" class="w-8 h-8 rounded-full" />
				<div class="flex-1 relative">
					<input 
						type="text" 
						bind:value={newComment}
						placeholder="댓글 작성..." 
						class="w-full rounded-full pl-3 pr-12 py-2 bg-gray-100 focus:outline-hidden focus:ring-1 focus:ring-blue-500" 
					/>
					<button 
						class="absolute right-2 top-1/2 -translate-y-1/2 text-blue-500 p-1 {!newComment.trim() ? 'opacity-50' : ''}"
						disabled={!newComment.trim()}
						onclick={submitComment}
					>
						<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
							<path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
						</svg>
					</button>
				</div>
			</div>
		</div>
	{/if}
</footer>

<!-- 메인 컨텐츠 -->
<div 
	bind:this={contentElement}
	class="bg-gray-100 pt-16 pb-24 min-h-screen overflow-y-auto" 
	ontouchstart={handleTouchStart} 
	ontouchend={handleTouchEnd}
>
	<div class="max-w-lg mx-auto bg-white shadow-xs">
		<!-- 작성자 프로필 (강조) -->
		<div class="p-4 border-b border-gray-200">
			<div class="flex items-center">
				<img src={post.userAvatar} alt={post.username} class="w-14 h-14 rounded-full border border-gray-200" />
				<div class="ml-3 flex-1">
					<div class="flex items-center">
						<div>
							<div class="font-bold text-base">{post.isMyPost ? '나' : post.username}</div>
							<div class="text-xs text-gray-500">{post.userBio || ''}</div>
						</div>
						{#if !post.isMyPost}
							<button class="ml-auto px-3 py-1 rounded-full bg-blue-500 text-white text-sm font-medium">팔로우</button>
						{/if}
					</div>
				</div>
			</div>
			
			<div class="mt-3 flex justify-between">
				<div class="flex items-center text-xs text-gray-500">
					<span>{post.communityName}</span>
					<span class="mx-1">•</span>
					<span>{post.timestamp}</span>
				</div>
				{#if post.isMyPost}
					<div class="flex gap-2">
						<button class="text-blue-600 px-3 py-1 text-sm rounded-full border border-blue-600 hover:bg-blue-50">
							수정
						</button>
						<button class="text-red-500 px-3 py-1 text-sm rounded-full border border-red-500 hover:bg-red-50">
							삭제
						</button>
					</div>
				{/if}
			</div>
		</div>

		<!-- 게시물 내용 (트위터 스타일) -->
		<div class="px-4 py-3">
			{#if post.title}
				<h2 class="text-xl font-bold mb-2">{post.title}</h2>
			{/if}
			
			<p class="text-gray-800 whitespace-pre-line mb-3">{post.content}</p>
			
			<!-- 해시태그 -->
			{#if post.caption.includes('#')}
				<div class="flex flex-wrap gap-2 mb-3">
					{#each post.caption.split(' ').filter(word => word.startsWith('#')) as tag}
						<span class="text-blue-500 font-medium text-sm">{tag}</span>
					{/each}
				</div>
			{/if}
			
			<!-- 링크 -->
			{#if post.link}
				<a href={post.link.url} target="_blank" rel="noopener noreferrer" 
					class="block p-3 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors mt-2 mb-3">
					<div class="flex items-center gap-3">
						<div class="shrink-0 bg-blue-500 text-white p-2 rounded-full">
							<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
							</svg>
						</div>
						<div class="flex-1 min-w-0">
							<p class="text-sm font-medium text-gray-800 truncate">{post.link.title}</p>
							<p class="text-xs text-gray-500 truncate">{post.link.url}</p>
						</div>
					</div>
				</a>
			{/if}
		</div>

		<!-- 이미지 (있는 경우) -->
		{#if images.length > 0}
			<div class="mb-3">
				{#each images as image, i}
					<div class="mb-1">
						<img src={image} alt={`${post.title} 이미지 ${i + 1}`} class="w-full object-contain max-h-[600px]" />
					</div>
				{/each}
			</div>
		{/if}

		<!-- 액션 버튼 -->
		<div class="px-4 py-3 border-t border-b border-gray-200">
			<div class="flex items-center gap-6">
				<!-- 좋아요 버튼 -->
				<button class="flex items-center gap-1.5 hover:bg-gray-50 px-3 py-1.5 rounded-full transition-colors" onclick={toggleLike}>
					<svg 
						class="w-6 h-6 {isLiked ? 'text-red-500 fill-red-500' : 'text-gray-500'}" 
						fill={isLiked ? 'currentColor' : 'none'} 
						stroke="currentColor" 
						viewBox="0 0 24 24"
					>
						<path 
							stroke-linecap="round" 
							stroke-linejoin="round" 
							stroke-width="2" 
							d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
						/>
					</svg>
					<span class="text-sm font-medium">{likeCount.toLocaleString()}</span>
				</button>

				<!-- 댓글 버튼 -->
				<button class="flex items-center gap-1.5 hover:bg-gray-50 px-3 py-1.5 rounded-full transition-colors">
					<svg class="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path 
							stroke-linecap="round" 
							stroke-linejoin="round" 
							stroke-width="2" 
							d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
						/>
					</svg>
					<span class="text-sm font-medium">{post.comments.toLocaleString()}</span>
				</button>

				<!-- 북마크 버튼 -->
				<button class="flex items-center gap-1.5 hover:bg-gray-50 px-3 py-1.5 rounded-full transition-colors ml-auto">
					<svg class="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"></path>
					</svg>
				</button>
			</div>
		</div>

		<!-- 댓글 섹션 -->
		<div class="px-4 py-3 border-b border-gray-200">
			<h3 class="font-bold text-lg">댓글 {post.comments}개</h3>
		</div>

		<!-- 댓글 목록 -->
		{#if post.commentList && post.commentList.length > 0}
			{#each post.commentList as comment}
				<div class="p-4 border-b border-gray-100">
					<div class="flex items-start gap-3">
						<img src={comment.userAvatar} alt={comment.username} class="w-9 h-9 rounded-full" />
						<div class="flex-1">
							<div class="flex items-center gap-2 flex-wrap">
								<span class="font-semibold">{comment.username}</span>
								<span class="text-xs text-gray-500">{comment.timestamp}</span>
							</div>
							<p class="text-gray-800 mt-1">{comment.content}</p>
							<div class="flex items-center gap-4 mt-2">
								<button class="text-xs text-gray-500 hover:text-gray-700">좋아요 {comment.likes}</button>
								<button class="text-xs text-gray-500 hover:text-gray-700" onclick={() => startReply(comment.id, comment.username)}>답글</button>
							</div>
							
							<!-- 대댓글 영역 -->
							{#if comment.replies && comment.replies.length > 0}
								<div class="pl-5 mt-2 border-l-2 border-gray-100">
									{#each comment.replies as reply}
										<div class="py-2">
											<div class="flex items-start gap-2">
												<img src={reply.userAvatar} alt={reply.username} class="w-7 h-7 rounded-full" />
												<div class="flex-1">
													<div class="flex items-center gap-2 flex-wrap">
														<span class="font-semibold">{reply.username}</span>
														<span class="text-xs text-gray-500">{reply.timestamp}</span>
													</div>
													<p class="text-gray-800 text-sm mt-1">{reply.content}</p>
													<div class="flex items-center gap-4 mt-1">
														<button class="text-xs text-gray-500 hover:text-gray-700">좋아요 {reply.likes}</button>
													</div>
												</div>
											</div>
										</div>
									{/each}
								</div>
							{/if}
						</div>
					</div>
				</div>
			{/each}
		{:else}
			<div class="p-6 text-center text-gray-500">
				<p>아직 댓글이 없습니다. 첫 댓글을 남겨보세요!</p>
			</div>
		{/if}
	</div>
</div> 