<script lang="ts">
	import Icon from '$lib/components/Icon.svelte';
	import type { Place, Menu, CommunityMetaInfo, YouTubeVideoSnippet } from '$services/types';
	import { convertToNaverResizeImageUrl } from '$utils/naver.util';
	import { calculateAveragePrice, formatWithCommas } from '$utils/number.util';
	import { MapPinned } from 'lucide-svelte';

	interface Props {
		// props 정의
		place: Place;
		goToPlaceDetail: (id: string, e: Event) => void;
		toggleLike: (placeId: string, e: Event) => void;
		commentClick: (placeId: string, e: Event) => void;
		toggleBookmark: (placeId: string, e: Event) => void;
		commentCounts?: Record<string, number>;
		bookmarkedPlaces?: Record<string, boolean>;
		onTagClick?: (type: 'category' | 'group1' | 'group2' | 'group3' | 'tag', value: string) => void;
	}

	let {
		place,
		goToPlaceDetail,
		toggleLike,
		commentClick,
		toggleBookmark,
		commentCounts = {},
		bookmarkedPlaces = {},
		onTagClick = () => {},
	}: Props = $props();

	// 이미지 오류 처리
	function handleImageError(event: Event) {
		const imgElement = event.target as HTMLImageElement;
		if (imgElement && imgElement.src) {
			imgElement.src = 'https://placehold.co/600x400?text=ERROR';
		}
	}

	// 이벤트 전파 중지
	function stopPropagation(event: Event) {
		event.stopPropagation();
	}

	// 평균 가격 계산 (카드 렌더 시)
	const allTags = $derived([...(place.keyword_list || []), ...(place.themes || [])]);

	const hasYoutubeFeature = $derived(place.features?.some((f) => f.platform_type === 'youtube'));
	const hasCommunityFeature = $derived(
		place.features?.some((f) => f.platform_type === 'community'),
	);

	function translatePlatformNames(name: string): string {
		return name == 'damoang.net'
			? '다모앙'
			: name == 'clien.net'
				? '클리앙'
				: name == 'bobaedream.co.kr'
					? '보배드림'
					: name;
	}

	// 추천 출처 3개 초과시 +n 버튼 및 토글 상태 추가
	let showAllFeatures = $state(false);
</script>

<article
	class="mb-1 cursor-pointer overflow-hidden rounded bg-white shadow-sm"
	onclick={(e) => goToPlaceDetail(place.id, e)}
	onkeydown={(e) => e.key === 'Enter' && goToPlaceDetail(place.id, e)}
	tabindex="0"
	role="button"
>
	<header class="flex items-center border-b border-gray-100 p-2">
		<div class="flex items-center gap-3">
			<div
				class="flex cursor-pointer flex-col"
				onclick={(e) => goToPlaceDetail(place.id, e)}
				onkeydown={(e) => e.key === 'Enter' && goToPlaceDetail(place.id, e)}
				tabindex="0"
				role="button"
			>
				<div class="flex items-center gap-1">
					<span class="text-base font-semibold">{place.name}</span>
					{#if place.experience?.is_visited}
						<span class="text-xs text-gray-500">•</span>
						<Icon name="check-circle" class="h-4 w-4 font-bold text-red-600" />
					{/if}
					{#if place.features && place.features.length > 0}
						<span class="text-xs text-gray-500">•</span>
						<Icon name="tv-minimal-play" class="h-4 w-4 font-bold text-red-600" />
					{/if}
					<span class="text-xs text-gray-500">•</span>
					<div class="flex items-center gap-1">
						<span class="text-yellow-500">★</span>
						<span
							class="cursor-pointer text-xs font-semibold"
							onclick={(e) => {
								e.stopPropagation();
								onTagClick('category', place.category);
							}}
						>
							{place.visitor_reviews_score}
						</span>
						<span class="text-xs text-gray-500">
							({formatWithCommas(place.visitor_reviews_total)})
						</span>
					</div>
				</div>
				<div class="mt-1 flex items-baseline gap-2">
					<span
						class={`cursor-pointer text-xs font-semibold text-blue-600`}
						onclick={(e) => {
							e.stopPropagation();
							onTagClick('category', place.category);
						}}
					>
						{place.category}
					</span>
					<span class="text-sm text-gray-500">{place.address}</span>
				</div>
			</div>
		</div>
	</header>

	<!-- 이미지 갤러리 (최대 3개) -->
	{#if place.images && place.images.length > 0}
		{@const imageCount = place.images.length}
		<div
			class="grid {imageCount === 1
				? 'grid-cols-1'
				: imageCount === 2
					? 'grid-cols-2'
					: 'grid-cols-3'}"
		>
			{#each place.images.slice(0, 3) as img, i}
				<div class="relative aspect-[4/3] border">
					<img
						src={convertToNaverResizeImageUrl(img)}
						alt={`${place.name} ${i + 1}`}
						class="h-full w-full object-cover"
						loading="lazy"
						onerror={handleImageError}
					/>
				</div>
			{/each}
		</div>
	{/if}

	<!-- 추천 출처 -->
	{#if place.features && place.features.length > 0}
		<div class="my-1 space-y-2 px-2">
			{#each showAllFeatures ? place.features : place.features.slice(0, 3) as feature}
				<div class="flex items-center justify-between gap-1 rounded-md bg-gray-50 px-2 text-sm">
					<a
						href={feature.content_url}
						target="_blank"
						rel="noopener noreferrer"
						class="flex w-full items-center justify-between text-gray-400 hover:text-gray-600"
						onclick={(e) => e.stopPropagation()}
						aria-label="콘텐츠 보기"
					>
						<div class="0 flex flex-col gap-1 overflow-hidden bg-gray-50 p-1">
							{#if feature.platform_type === 'youtube'}
								<div class="flex items-center justify-between">
									<div class="flex flex-col items-start">
										<span class="truncate text-sm font-medium text-gray-700">
											{feature.feature?.title}
										</span>
										<span class="text-xs text-gray-600">
											@{(feature.feature as YouTubeVideoSnippet)?.channelTitle}(youtube)
										</span>
									</div>
								</div>
							{:else if feature.platform_type === 'community'}
								<div class="flex items-center justify-between">
									<div class="flex flex-col items-start">
										<span class="truncate text-sm font-medium text-gray-700">
											{feature.feature?.title}
										</span>
										<span class="text-xs text-gray-600">
											@{translatePlatformNames(
												(feature.feature as CommunityMetaInfo)?.domain || '',
											)}
											({(feature.feature as CommunityMetaInfo)?.domain})
										</span>
									</div>
								</div>
							{/if}
						</div>
						<Icon name="external-link" class="ml-2 h-4 w-4 flex-shrink-0" />
					</a>
				</div>
			{/each}
			{#if !showAllFeatures && place.features.length > 3}
				<button
					class="mt-2 block w-full rounded bg-gray-100 py-1 text-center text-xs text-gray-500 transition-colors hover:bg-gray-200"
					onclick={(e) => {
						e.stopPropagation();
						showAllFeatures = true;
					}}
					aria-label="추천 출처 더보기"
				>
					+{place.features.length - 3}개 더보기
				</button>
			{/if}
		</div>
	{/if}

	<!-- 태그 -->
	<!-- {#if allTags.length > 0}
		<div class="mb-3 flex flex-wrap gap-2 px-4">
			{#each allTags.slice(0, 5) as tag}
				<span
					class="cursor-pointer rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700"
					onclick={(e) => {
						e.stopPropagation();
						onTagClick('tag', tag);
					}}
				>
					#{tag}
				</span>
			{/each}
		</div>
	{/if} -->

	<!-- 액션 버튼 -->
	<div class="flex items-center justify-between border-t border-gray-100 py-2">
		<div class="flex items-center gap-1">
			<!-- 저장 (북마크) -->
			<button
				class="flex items-center gap-1.5 rounded-full px-2.5 py-1.5 transition-colors hover:bg-gray-50"
				aria-label="저장"
			></button>
		</div>

		<a
			href={`https://map.naver.com/p/entry/place/${place.id}`}
			target="_blank"
			rel="noopener noreferrer"
			class="flex items-center gap-1.5 rounded-full px-2 py-1 font-medium transition-colors hover:bg-green-500"
			onclick={stopPropagation}
			aria-label="네이버 장소 보기"
		>
			<MapPinned class="h-4 w-4 text-gray-500" />
			<span class="text-sm text-gray-500">지도</span>
		</a>
	</div>
</article>
