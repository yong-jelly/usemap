<script lang="ts">
	import { Play, Heart, Bookmark, Clock, Youtube, MapPin, Eye } from 'lucide-svelte';

	interface YoutubeRecommendation {
		id: string;
		video: {
			title: string;
			thumbnail: string;
			duration: string;
			channelName: string;
			channelAvatar: string;
			viewCount: string;
			publishedAt: string;
			url: string;
		};
		relatedRestaurants: {
			name: string;
			address: string;
			category: string;
		}[];
		summary: string;
		timestamp: string;
		isLiked: boolean;
		isBookmarked: boolean;
	}

	const { card } = $props<{ card: YoutubeRecommendation }>();

	let isLiked = $state(card.isLiked);
	let isBookmarked = $state(card.isBookmarked);

	function toggleLike() {
		isLiked = !isLiked;
	}

	function toggleBookmark() {
		isBookmarked = !isBookmarked;
	}

	function formatTimeAgo(dateString: string) {
		const now = new Date();
		const date = new Date(dateString);
		const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
		
		if (diffInMinutes < 1) return '방금 전';
		if (diffInMinutes < 60) return `${diffInMinutes}분 전`;
		if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}시간 전`;
		return `${Math.floor(diffInMinutes / 1440)}일 전`;
	}

	function openVideo() {
		window.open(card.video.url, '_blank');
	}
</script>

<article class="bg-white rounded-lg shadow-sm mb-3 overflow-hidden border border-gray-100">
	<!-- 헤더 -->
	<header class="p-4 pb-3">
		<div class="flex items-center justify-between">
			<div class="flex items-center gap-2">
				<div class="flex items-center gap-1 px-2 py-1 bg-red-50 rounded-full">
					<Youtube class="w-3 h-3 text-red-600" />
					<span class="text-xs font-medium text-red-700">유튜브 추천</span>
				</div>
				{#if card.relatedRestaurants.length > 0}
					<div class="px-2 py-1 bg-green-50 rounded-full">
						<span class="text-xs font-medium text-green-700">{card.relatedRestaurants.length}곳 소개</span>
					</div>
				{/if}
			</div>
			<div class="flex items-center gap-1 text-xs text-gray-500">
				<Clock class="w-3 h-3" />
				<span>{formatTimeAgo(card.timestamp)}</span>
			</div>
		</div>
	</header>

	<!-- 유튜브 썸네일 -->
	<div class="relative group cursor-pointer" onclick={openVideo}>
		<img 
			src={card.video.thumbnail} 
			alt={card.video.title}
			class="w-full h-52 object-cover"
			loading="lazy"
		/>
		<!-- 재생 버튼 오버레이 -->
		<div class="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors flex items-center justify-center">
			<div class="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
				<Play class="w-6 h-6 text-white ml-1 fill-white" />
			</div>
		</div>
		<!-- 재생 시간 -->
		<div class="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
			{card.video.duration}
		</div>
	</div>

	<!-- 영상 정보 -->
	<div class="p-4">
		<!-- 채널 정보 -->
		<div class="flex items-center gap-3 mb-3">
			<img 
				src={card.video.channelAvatar} 
				alt={card.video.channelName}
				class="w-8 h-8 rounded-full object-cover"
			/>
			<div class="flex-1">
				<p class="text-sm font-medium text-gray-900">{card.video.channelName}</p>
				<div class="flex items-center gap-2 text-xs text-gray-500">
					<div class="flex items-center gap-1">
						<Eye class="w-3 h-3" />
						<span>{card.video.viewCount}</span>
					</div>
					<span>•</span>
					<span>{card.video.publishedAt}</span>
				</div>
			</div>
		</div>

		<!-- 영상 제목 -->
		<h3 class="font-semibold text-gray-900 text-base mb-3 leading-snug cursor-pointer hover:text-blue-600 transition-colors" 
			onclick={openVideo}>
			{card.video.title}
		</h3>

		<!-- AI 요약 -->
		{#if card.summary}
			<div class="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-100 p-3 mb-3">
				<div class="flex items-start gap-2">
					<Youtube class="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
					<div>
						<p class="text-xs text-orange-700 font-medium mb-1">영상 요약</p>
						<p class="text-sm text-gray-700 leading-relaxed">{card.summary}</p>
					</div>
				</div>
			</div>
		{/if}

		<!-- 관련 음식점 -->
		{#if card.relatedRestaurants.length > 0}
			<div class="mb-4">
				<p class="text-sm font-medium text-gray-900 mb-2">영상에서 소개된 맛집</p>
				<div class="space-y-2">
					{#each card.relatedRestaurants as restaurant}
						<div class="flex items-center gap-2 p-2 bg-gray-50 rounded-lg border cursor-pointer hover:bg-gray-100 transition-colors">
							<MapPin class="w-4 h-4 text-gray-600 flex-shrink-0" />
							<div class="flex-1">
								<p class="text-sm font-medium text-gray-900">{restaurant.name}</p>
								<div class="flex items-center gap-2 text-xs text-gray-500">
									<span>{restaurant.category}</span>
									<span>•</span>
									<span>{restaurant.address}</span>
								</div>
							</div>
						</div>
					{/each}
				</div>
			</div>
		{/if}

		<!-- 액션 버튼 -->
		<div class="flex items-center justify-between">
			<div class="flex items-center gap-4">
				<button 
					class="flex items-center gap-2 text-gray-500 hover:text-red-500 transition-colors"
					onclick={toggleLike}
				>
					<Heart class={`w-5 h-5 ${isLiked ? 'text-red-500 fill-red-500' : ''}`} />
					<span class="text-sm font-medium">좋아요</span>
				</button>
			</div>
			
			<div class="flex items-center gap-2">
				<button 
					class="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
					onclick={openVideo}
				>
					영상 보기
				</button>
				<button 
					class="p-2 text-gray-500 hover:text-yellow-500 transition-colors"
					onclick={toggleBookmark}
				>
					<Bookmark class={`w-5 h-5 ${isBookmarked ? 'text-yellow-500 fill-yellow-500' : ''}`} />
				</button>
			</div>
		</div>
	</div>
</article> 