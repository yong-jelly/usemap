<script lang="ts">
	import { goto } from '@mateothegreat/svelte5-router';
	import { onMount } from 'svelte';

	interface Props {
		id: string;
		username: string;
		userAvatar: string;
		postImage?: string | string[] | null;
		likes: number;
		caption: string;
		comments: number;
		timestamp: string;
		communityName: string;
		communityAvatar: string;
		title: string;
		content: string;
		link?: { url: string; title: string } | null;
		isMyPost?: boolean;
	}

	let {
		id,
		username,
		userAvatar,
		postImage = null,
		likes,
		caption,
		comments,
		timestamp,
		communityName,
		communityAvatar,
		title,
		content,
		link = null,
		isMyPost = false
	}: Props = $props();

	// 이미지 배열 처리 (최대 3개로 제한)
	let images = $derived(postImage 
		? Array.isArray(postImage) 
			? postImage.slice(0, 3) 
			: [postImage]
		: []);

	// 이미지 개수에 따른 그리드 클래스 결정
	let gridClass = $derived(images.length === 0 
		? '' 
		: images.length === 1 
			? '' 
			: images.length === 2 
				? 'grid grid-cols-2' 
				: 'grid grid-cols-3');
	
	// 이미지 크기 클래스 결정
	let imageClass = $derived(images.length === 1 
		? 'max-h-[500px] w-full' 
		: 'aspect-square w-full');

	// 이미지 대체 텍스트 생성
	const getAltText = (index: number) => `${title} 이미지 ${index + 1}`;
	
	// 좋아요 상태 (실제로는 API와 연동 필요)
	let isLiked = $state(false);
	
	// 좋아요 개수 계산
	let likeCount = $state(likes);
	
	// 좋아요 토글 함수
	function toggleLike(event: Event) {
		event.stopPropagation();
		isLiked = !isLiked;
		likeCount = isLiked ? likeCount + 1 : likeCount - 1;
	}

	// 상세 페이지로 이동 (고정 URL로 변경)
	function goToDetail(): void {
		goto(`/content/${id}`);
	}

	// 이벤트 전파 중지용 핸들러
	function stopPropagation(event: Event) {
		event.stopPropagation();
	}
</script>

<article class="{isMyPost ? 'bg-blue-50 border-l-4 border-blue-500' : 'bg-white'} rounded-lg shadow-xs mb-4 overflow-hidden">
	<!-- 헤더 -->
	<header class="flex items-center p-3">
		<div class="flex items-center gap-3">
			<div class="relative">
				<img src={communityAvatar} alt={communityName} class="w-10 h-10 rounded-full border border-gray-200" />
				<div class="absolute -left-1 top-1/2 -translate-y-1/2 h-8 border-l border-dotted border-gray-300"></div>
			</div>
			<div class="flex flex-col">
				<div class="flex items-center gap-1">
					<span class="font-semibold text-sm">{communityName}</span>
					<span class="text-xs text-gray-500">•</span>
					<span class="text-xs text-gray-500">{timestamp}</span>
				</div>
				<span class="text-xs text-gray-500">
					Posted by 
					{#if isMyPost}
						<span class="text-blue-600 font-semibold">나</span>
					{:else}
						<span class="text-blue-500">@{username}</span>
					{/if}
				</span>
			</div>
		</div>
		<div class="ml-auto flex items-center gap-1">
			{#if isMyPost}
				<button class="p-1.5 text-blue-600 hover:bg-blue-100 rounded-full" aria-label="수정" onclick={stopPropagation}>
					<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
					</svg>
				</button>
				<button class="p-1.5 text-red-500 hover:bg-red-50 rounded-full" aria-label="삭제" onclick={stopPropagation}>
					<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
					</svg>
				</button>
			{/if}
			<button class="p-1 text-gray-500 hover:bg-gray-100 rounded-full" onclick={stopPropagation}>
				<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
				</svg>
			</button>
		</div>
	</header>

	<!-- 제목과 내용 -->
	<div class="px-4 pt-2 pb-3 cursor-pointer hover:bg-gray-50" onclick={goToDetail}>
		<h2 class="text-lg font-bold mb-2">{title}</h2>
		{#if content}
			<p class="text-gray-700 text-sm mb-2 line-clamp-3">{content}</p>
		{/if}
	</div>

	<!-- 링크 (있는 경우) -->
	{#if link}
		<a href={link.url} target="_blank" rel="noopener noreferrer" 
			class="mx-4 mb-3 block p-3 bg-gray-50 border border-gray-100 rounded-lg hover:bg-gray-100 transition-colors"
			onclick={stopPropagation}>
			<div class="flex items-center gap-2">
				<div class="shrink-0 bg-blue-500 text-white p-2 rounded-full">
					<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
					</svg>
				</div>
				<div class="flex-1 min-w-0">
					<p class="text-sm font-medium text-gray-800 truncate">{link.title}</p>
					<p class="text-xs text-gray-500 truncate">{link.url}</p>
				</div>
			</div>
		</a>
	{/if}

	<!-- 이미지 (있는 경우) -->
	{#if images.length > 0}
		{#if images.length === 1}
			<!-- 단일 이미지 -->
			<div class="{imageClass} cursor-pointer" onclick={goToDetail}>
				<img src={images[0]} alt={getAltText(0)} class="w-full h-full object-cover" loading="lazy" />
			</div>
		{:else}
			<!-- 다중 이미지 (그리드 레이아웃) -->
			<div class="{gridClass} gap-1 cursor-pointer" onclick={goToDetail}>
				{#each images as image, i}
					<div class="{imageClass} overflow-hidden">
						<img src={image} alt={getAltText(i)} class="w-full h-full object-cover" loading="lazy" />
					</div>
				{/each}
			</div>
		{/if}
	{/if}

	<!-- 액션 버튼 -->
	<div class="px-4 py-2 border-t border-gray-100">
		<div class="flex items-center gap-6">
			<!-- 좋아요 버튼 -->
			<button 
				class="flex items-center gap-1.5 hover:bg-gray-50 px-2 py-1 rounded-full transition-colors"
				onclick={toggleLike}
				aria-label="좋아요"
			>
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
			<button 
				class="flex items-center gap-1.5 hover:bg-gray-50 px-2 py-1 rounded-full transition-colors"
				aria-label="댓글"
				onclick={goToDetail}
			>
				<svg class="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path 
						stroke-linecap="round" 
						stroke-linejoin="round" 
						stroke-width="2" 
						d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
					/>
				</svg>
				<span class="text-sm font-medium">{comments.toLocaleString()}</span>
			</button>

			<!-- 공유 버튼 -->
			<button 
				class="flex items-center gap-1.5 hover:bg-gray-50 px-2 py-1 rounded-full transition-colors ml-auto"
				aria-label="공유"
				onclick={stopPropagation}
			>
				<svg class="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path 
						stroke-linecap="round" 
						stroke-linejoin="round" 
						stroke-width="2" 
						d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
					/>
				</svg>
				<span class="text-sm">공유</span>
			</button>
		</div>
	</div>

	<!-- 캡션 및 댓글 미리보기 -->
	{#if caption}
		<div class="px-4 py-3 text-sm border-t border-gray-100">
			<p class="text-gray-800">
				<span class="font-semibold">{isMyPost ? '나' : username}</span> 
				<span class="ml-1">{caption}</span>
			</p>
			{#if comments > 0}
				<button class="text-gray-500 text-xs mt-1" onclick={goToDetail}>댓글 {comments}개 모두 보기</button>
			{/if}
		</div>
	{/if}

	{#if isMyPost}
		<div class="px-4 py-2 bg-blue-50 text-xs text-blue-700 flex justify-between items-center border-t border-blue-100">
			<div>
				<span class="font-medium">내 게시물</span>
				<span class="ml-1 text-blue-600/70">• 조회 {Math.floor(Math.random() * 100) + 50}회</span>
			</div>
			<button class="text-xs text-blue-700 hover:underline" onclick={stopPropagation}>인사이트 보기</button>
		</div>
	{/if}
</article> 