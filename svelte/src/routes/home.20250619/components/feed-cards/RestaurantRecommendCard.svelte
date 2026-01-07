<script lang="ts">
	import { Heart, Bookmark, MapPin, Star, Clock, Sparkles, Users } from 'lucide-svelte';

	interface RestaurantRecommendation {
		id: string;
		restaurant: {
			name: string;
			address: string;
			category: string;
			rating: number;
			reviewCount: number;
			priceRange: string;
			images: string[];
		};
		recommendation: {
			reason: string;
			type: 'ai' | 'trending' | 'nearby' | 'similar';
			score: number;
			tags: string[];
		};
		timestamp: string;
		isLiked: boolean;
		isBookmarked: boolean;
	}

	const { card } = $props<{ card: RestaurantRecommendation }>();

	let isLiked = $state(card.isLiked);
	let isBookmarked = $state(card.isBookmarked);

	function toggleLike() {
		isLiked = !isLiked;
	}

	function toggleBookmark() {
		isBookmarked = !isBookmarked;
	}

	function getRecommendationIcon(type: string) {
		switch (type) {
			case 'ai': return Sparkles;
			case 'trending': return Users;
			case 'nearby': return MapPin;
			default: return Sparkles;
		}
	}

	function getRecommendationLabel(type: string) {
		switch (type) {
			case 'ai': return 'AI 추천';
			case 'trending': return '인기 급상승';
			case 'nearby': return '근처 맛집';
			case 'similar': return '비슷한 취향';
			default: return 'AI 추천';
		}
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

	const SvelteComponent = $derived(getRecommendationIcon(card.recommendation.type));
</script>

<article class="bg-white rounded-lg shadow-sm mb-3 overflow-hidden border border-gray-100">
	<!-- 헤더 -->
	<header class="p-4 pb-3">
		<div class="flex items-center justify-between">
			<div class="flex items-center gap-2">
				<div class="flex items-center gap-1 px-2 py-1 bg-blue-50 rounded-full">
					<SvelteComponent class="w-3 h-3 text-blue-600" />
					<span class="text-xs font-medium text-blue-700">{getRecommendationLabel(card.recommendation.type)}</span>
				</div>
				<div class="px-2 py-1 bg-amber-50 rounded-full">
					<span class="text-xs font-medium text-amber-700">{card.recommendation.score}% 매치</span>
				</div>
			</div>
			<div class="flex items-center gap-1 text-xs text-gray-500">
				<Clock class="w-3 h-3" />
				<span>{formatTimeAgo(card.timestamp)}</span>
			</div>
		</div>
	</header>

	<!-- 음식점 이미지 -->
	{#if card.restaurant.images.length > 0}
		<div class="relative">
			<img 
				src={card.restaurant.images[0]} 
				alt={card.restaurant.name}
				class="w-full h-48 object-cover"
				loading="lazy"
			/>
			{#if card.restaurant.images.length > 1}
				<div class="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
					+{card.restaurant.images.length - 1}
				</div>
			{/if}
		</div>
	{/if}

	<!-- 음식점 정보 -->
	<div class="p-4">
		<div class="mb-3">
			<h3 class="font-semibold text-gray-900 text-lg mb-1">{card.restaurant.name}</h3>
			<div class="flex items-center gap-2 text-sm text-gray-600 mb-2">
				<span>{card.restaurant.category}</span>
				<span>•</span>
				<span>{card.restaurant.priceRange}</span>
			</div>
			<div class="flex items-center gap-2 text-sm text-gray-500">
				<MapPin class="w-4 h-4" />
				<span>{card.restaurant.address}</span>
			</div>
		</div>

		<!-- 평점 및 리뷰 -->
		<div class="flex items-center gap-3 mb-3">
			<div class="flex items-center gap-1">
				{#each Array(5) as _, i}
					<Star class={`w-4 h-4 ${i < Math.floor(card.restaurant.rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
				{/each}
				<span class="text-sm font-medium text-gray-900 ml-1">{card.restaurant.rating}</span>
			</div>
			<span class="text-sm text-gray-500">({card.restaurant.reviewCount}개 리뷰)</span>
		</div>

		<!-- AI 추천 이유 -->
		<div class="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-100 p-3 mb-3">
			<div class="flex items-start gap-2">
				<Sparkles class="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
				<p class="text-sm text-gray-700 leading-relaxed">{card.recommendation.reason}</p>
			</div>
		</div>

		<!-- 태그 -->
		{#if card.recommendation.tags.length > 0}
			<div class="flex flex-wrap gap-1 mb-4">
				{#each card.recommendation.tags as tag}
					<span class="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">#{tag}</span>
				{/each}
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
					<span class="text-sm font-medium">관심있어요</span>
				</button>
			</div>
			
			<div class="flex items-center gap-2">
				<button 
					class="px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 transition-colors"
				>
					자세히 보기
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