<script lang="ts">
	import type { PlaceFeatureWithPlace } from '../types';
	import Icon from '$lib/components/Icon.svelte';
	import { formatWithCommas } from '$utils/number.util';
	import { NaverStaticMapUrlParserAndBuilder } from '$utils/NaverStaticMapUrlParserAndBuilder';

	let {
		featureItem,
		toggleLike,
		toggleBookmark,
		onClickPlace
	} = $props<{
		featureItem: PlaceFeatureWithPlace;
		toggleLike: (placeId: string, e: any) => void;
		toggleBookmark: (placeId: string, e: any) => void;
		onClickPlace: (placeId: string, e: any) => void;
	}>();

	const place = featureItem.place;
	const isYoutube = $derived(featureItem.platform_type === 'youtube');
	let videoId = $derived(isYoutube ? getYoutubeVideoId(featureItem.content_url) : null);
	let showVideo = $state(false);

	let finalMapUrl = $derived.by(() => {
		if (isYoutube || !place?.static_map_url) return null;
		const mapBuilder = new NaverStaticMapUrlParserAndBuilder(place.static_map_url);
		return mapBuilder.build();
	});

	let animateHeart = $state(false);

	function getYoutubeVideoId(url: string): string | null {
		const patterns = [
			/[?&]v=([^&]+)/,
			/youtu\.be\/([^?&]+)/
		];
		for (const pattern of patterns) {
			const match = url.match(pattern);
			if (match && match[1]) return match[1];
		}
		return null;
	}
	
	function playVideo(e: Event) {
		e.stopPropagation();
		showVideo = true;
	}

	function openContentUrl(e: Event) {
		e.stopPropagation();
		if (featureItem.content_url) {
			window.open(featureItem.content_url, '_blank', 'noopener,noreferrer');
		}
	}

	function handleLike(e: Event) {
		if (!place) return;
		
		const wasLiked = place.interaction?.is_liked;
		toggleLike(place.id, e);

		// Note: toggleLike is optimistic, so the state is already updated.
		// We trigger the animation if it's now liked.
		if (!wasLiked) {
			animateHeart = false;
			setTimeout(() => {
				animateHeart = true;
			}, 10);
		}
	}

	const contentTitle = $derived(featureItem.title || '제목 없음');
	const channelTitle = $derived(isYoutube ? featureItem.feature?.channelTitle || '채널 정보 없음' : '');
	const communityDomain = $derived(!isYoutube ? featureItem.feature?.domain || '출처 정보 없음' : '');
</script>

<article class="rounded-2xl shadow-lg overflow-hidden bg-white group transition-all duration-300 ease-in-out hover:shadow-xl flex flex-col">
	<!-- Media Area -->
	<div class="relative aspect-[4/3] bg-gray-200 cursor-pointer overflow-hidden" onclick={isYoutube ? playVideo : openContentUrl}>
		{#if isYoutube}
			{#if videoId}
				{#if showVideo}
					<iframe class="w-full h-full" src={`https://www.youtube.com/embed/${videoId}?autoplay=1&modestbranding=1&rel=0`} title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>
				{:else}
					<img src={`https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`} alt={contentTitle} class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" loading="lazy" />
					<div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
					<div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
						<Icon name="play-circle" class="w-16 h-16 text-white/80 drop-shadow-lg transition-all group-hover:scale-110 opacity-80 group-hover:opacity-100" />
					</div>
				{/if}
			{:else}
				<div class="w-full h-full flex items-center justify-center text-gray-500">비디오 없음</div>
			{/if}
		{:else}
			{#if finalMapUrl}
				<img src={finalMapUrl} alt={contentTitle} class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" loading="lazy" />
				<div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
				<div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
					<Icon name="external-link" class="w-12 h-12 text-white/80 drop-shadow-lg transition-all group-hover:scale-110 opacity-80 group-hover:opacity-100" />
				</div>
			{:else}
				<div class="w-full h-full flex items-center justify-center text-gray-500 text-center">
					<Icon name="map-off" class="w-8 h-8 mx-auto" /><p class="text-xs mt-1">지도 없음</p>
				</div>
			{/if}
		{/if}

		<!-- Overlay Info -->
		<div class="absolute bottom-0 left-0 right-0 p-4 text-white">
			<div class="flex items-center gap-3">
				<img src={featureItem.user_info?.avatar_url || 'https://placehold.co/40x40?text=C'} alt="channel/user" class="w-9 h-9 rounded-full object-cover border-2 border-white/50 flex-shrink-0">
				<div class="flex-1 min-w-0">
					<h3 class="font-bold text-base leading-tight truncate text-shadow" title={contentTitle}>{contentTitle}</h3>
					<p class="text-sm text-gray-200 truncate text-shadow-sm" title={isYoutube ? channelTitle : communityDomain}>
						{isYoutube ? channelTitle : communityDomain}
					</p>
				</div>
			</div>
		</div>
	</div>

	<!-- Bottom Section -->
	{#if place}
		<div class="p-4 flex-1 flex flex-col justify-between bg-gray-50">
			<!-- Place Info -->
			<div class="flex items-start justify-between gap-3 cursor-pointer" onclick={(e) => onClickPlace(place.id, e)}>
				<div class="flex-1 min-w-0">
					<div class="flex items-center gap-1.5">
						<span class="font-semibold text-gray-800 hover:underline">{place.name}</span>
						{#if place.visitor_reviews_score > 0}
							<div class="flex items-center gap-0.5 text-xs text-gray-500">
								<Icon name="star" class="w-3.5 h-3.5 text-yellow-500 fill-current" />
								<span class="font-semibold">{place.visitor_reviews_score.toFixed(1)}</span>
							</div>
						{/if}
					</div>
					<div class="text-xs text-gray-500 truncate">{place.category}</div>
				</div>
				<a href={`https://map.naver.com/p/entry/place/${place.id}`} target="_blank" rel="noopener noreferrer" class="flex-shrink-0" onclick={(e) => e.stopPropagation()}>
					<Icon name="map-pin" class="h-5 w-5 text-gray-400 hover:text-green-500 transition-colors" />
				</a>
			</div>
			
			<!-- Actions -->
			<div class="mt-4 flex items-center justify-end gap-2">
				<button class="action-btn" onclick={handleLike} aria-label="좋아요">
					{#key animateHeart}
						<Icon name="heart" class="w-6 h-6 transition-all {place.interaction?.is_liked ? 'text-red-500 fill-current heart-beat' : 'text-gray-500'}" />
					{/key}
					<span class="text-xs font-medium">{formatWithCommas(place.interaction?.place_liked_count)}</span>
				</button>
				<button class="action-btn" aria-label="댓글">
					<Icon name="message-square" class="w-6 h-6 text-gray-500" />
					<span class="text-xs font-medium">{formatWithCommas(place.interaction?.place_comment_count)}</span>
				</button>
				<button class="action-btn" onclick={(e) => toggleBookmark(place.id, e)} aria-label="저장">
					<Icon name="bookmark" class="w-6 h-6 transition-all {place.interaction?.is_saved ? 'text-blue-600 fill-current' : 'text-gray-500'}" />
				</button>
			</div>
		</div>
	{/if}
</article>

<style>
	.text-shadow { text-shadow: 0 1px 3px rgba(0, 0, 0, 0.4); }
	.text-shadow-sm { text-shadow: 0 1px 2px rgba(0, 0, 0, 0.4); }
	.action-btn {
		@apply flex items-center gap-1.5 text-gray-600 rounded-full transition-colors p-2 hover:bg-gray-100;
	}
	.action-btn:focus {
		@apply outline-none ring-2 ring-blue-400;
	}

	@keyframes heart-beat {
		0% { transform: scale(1); }
		50% { transform: scale(1.4); }
		100% { transform: scale(1); }
	}
	.heart-beat {
		animation: heart-beat 0.3s ease-in-out;
	}
</style> 