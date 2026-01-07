<script lang="ts">
	import Icon from '$lib/components/Icon.svelte';
	import type { CommunityMetaInfo, Place, YouTubeVideoSnippet } from '$services/types';
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

	// 카테고리에 맞는 배경색 반환
	const categoryColors: Record<string, string> = {
		한식: 'bg-red-500',
		중식: 'bg-yellow-600',
		일식: 'bg-indigo-500',
		양식: 'bg-green-600',
		카페: 'bg-orange-500',
		분식: 'bg-orange-500',
		고기: 'bg-red-600',
		돼지고기구이: 'bg-rose-600',
		소고기구이: 'bg-red-700',
		치킨: 'bg-yellow-500',
		피자: 'bg-orange-600',
		해산물: 'bg-blue-600',
		패스트푸드: 'bg-red-500',
		디저트: 'bg-pink-500',
		베이커리: 'bg-amber-600',
		아시안: 'bg-green-500',
		기타: 'bg-gray-500',
	};

	function getCategoryColor(category: string): string {
		for (const key in categoryColors) {
			if (category.includes(key)) {
				return categoryColors[key];
			}
		}
		return 'bg-blue-500'; // 기본값
	}

	// 이미지 오류 처리
	function handleImageError(event: Event) {
		const imgElement = event.target as HTMLImageElement;
		if (imgElement && imgElement.src) {
			imgElement.src = 'https://placehold.co/600x400?text=ERROR';
		}
	}

	function translatePlatformNames(name: string): string {
		return name == 'damoang.net'
			? '다모앙'
			: name == 'clien.net'
				? '클리앙'
				: name == 'bobaedream.co.kr'
					? '보배드림'
					: name;
	}

	// 이벤트 전파 중지
	function stopPropagation(event: Event) {
		event.stopPropagation();
	}
	// $inspect(place)

	// 평균 가격 계산 (카드 렌더 시)
	let avgPrice = calculateAveragePrice(place.menus);

	// 추천 출처 3개 초과시 +n 버튼 및 토글 상태 추가
	let showAllFeatures = $state(false);
</script>

<!-- <article class={`bg-white rounded-lg shadow-xs mb-1 overflow-hidden m-1 ${place.experience?.is_visited ? 'ring-2 ring-blue-500' : ''}`}> -->
<article class={`mb-1 overflow-hidden rounded-lg bg-white shadow-xs`}>
	<!-- 헤더 - FeedPost 스타일 -->
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
					{#if place.naver_folder && place.naver_folder.folders && place.naver_folder.folders.length > 0}
						<span class="text-xs text-gray-500">•</span>
						<Icon name="folder-check" class="h-4 w-4 font-bold text-red-600" />
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

	<!-- 음식점 이미지 (있는 경우) -->
	{#if place.images.length > 0}
		{#if place.images.length === 1}
			<div
				class="relative h-80 w-full cursor-pointer"
				onclick={(e) => goToPlaceDetail(place.id, e)}
				onkeydown={(e) => e.key === 'Enter' && goToPlaceDetail(place.id, e)}
				tabindex="0"
				role="button"
			>
				<img
					src={convertToNaverResizeImageUrl(place.images[0])}
					alt={place.name}
					class="h-full w-full object-cover"
					onerror={handleImageError}
					loading="lazy"
				/>
			</div>
		{:else if place.images.length === 2}
			<div
				class="grid h-80 w-full cursor-pointer grid-cols-2 gap-1"
				onclick={(e) => goToPlaceDetail(place.id, e)}
				onkeydown={(e) => e.key === 'Enter' && goToPlaceDetail(place.id, e)}
				tabindex="0"
				role="button"
			>
				<img
					src={convertToNaverResizeImageUrl(place.images[0])}
					alt={place.name}
					class="h-full w-full object-cover"
					onerror={handleImageError}
					loading="lazy"
				/>
				<img
					src={convertToNaverResizeImageUrl(place.images[1])}
					alt={place.name}
					class="h-full w-full object-cover"
					onerror={handleImageError}
					loading="lazy"
				/>
			</div>
		{:else if place.images.length >= 3}
			<div
				class="grid h-55 w-full cursor-pointer grid-cols-3"
				onclick={(e) => goToPlaceDetail(place.id, e)}
				onkeydown={(e) => e.key === 'Enter' && goToPlaceDetail(place.id, e)}
				tabindex="0"
				role="button"
			>
				<img
					src={convertToNaverResizeImageUrl(place.images[0])}
					alt={place.name}
					class="col-span-2 h-55 w-full border object-cover"
					onerror={handleImageError}
					loading="lazy"
				/>
				<div class="grid h-55 grid-rows-2">
					<img
						src={convertToNaverResizeImageUrl(place.images[1])}
						alt={place.name}
						class="h-full w-full border object-cover"
						onerror={handleImageError}
						loading="lazy"
					/>
					<div class="relative">
						<img
							src={convertToNaverResizeImageUrl(place.images[2])}
							alt={place.name}
							class="h-full w-full border object-cover"
							onerror={handleImageError}
							loading="lazy"
						/>
					</div>
				</div>
			</div>
		{/if}
	{/if}

	<!-- 음식점 정보 영역 -->
	<div class="px-2 pt-2 pb-3">
		<!-- 그룹 태그 (해시태그 스타일) -->
		<div class="mb-3 flex flex-wrap gap-2">
			{#if place.group1}
				<span
					class="cursor-pointer rounded-md bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700"
					onclick={(e) => {
						e.stopPropagation();
						onTagClick('group1', place.group1);
					}}
				>
					{place.group1}
				</span>
			{/if}
			{#if place.group2}
				<span
					class="cursor-pointer rounded-md bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700"
					onclick={(e) => {
						e.stopPropagation();
						onTagClick('group2', place.group2);
					}}
				>
					{place.group2}
				</span>
			{/if}
			{#if place.group3}
				<span
					class="cursor-pointer rounded-md bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700"
					onclick={(e) => {
						e.stopPropagation();
						onTagClick('group3', place.group3);
					}}
				>
					{place.group3}
				</span>
			{/if}
		</div>
		<!-- 평균 가격 표시 -->
		{#if place.avg_price > 0}
			<div class="mb-2 flex items-center gap-1">
				<span class="text-xs text-gray-500">가격</span>
				<span class="text-sm font-semibold text-gray-800">
					{formatWithCommas(place.avg_price, '-', true)}원대
				</span>
			</div>
		{/if}
		<!-- 투표 요약 (해시태그 형태로) -->
		{#if (place.keyword_list && place.keyword_list.length > 0) || (place.themes && place.themes.length > 0)}
			{@const allTags = [...(place.keyword_list || []), ...(place.themes || [])]}
			<div class="mt-2 flex flex-wrap gap-1.5">
				{#each allTags as tag}
					<span
						class="cursor-pointer text-xs font-medium text-blue-600"
						onclick={(e) => {
							e.stopPropagation();
							onTagClick('tag', tag);
						}}
					>
						#{tag}
					</span>
				{/each}
			</div>
			<!-- 추천 출처 -->
			{#if place.features && place.features.length > 0}
				<div class="mt-2 flex flex-wrap gap-1.5">
					{#each place.features as feature}
						{#if feature.platform_type === 'folder'}
							<span
								class="inline-flex items-center gap-1 rounded-md bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700"
							>
								<span>#{feature.title || '제목 없음'}</span>
							</span>
						{/if}
					{/each}
				</div>
			{/if}

			<!-- <div class="mt-2 flex flex-wrap gap-1.5">
				{#each allTags.slice(0, 4) as tag}
					<span
						class="cursor-pointer text-xs font-medium text-blue-600"
						onclick={(e) => {
							e.stopPropagation();
							onTagClick('tag', tag);
						}}
					>
						#{tag}
					</span>
				{/each}
				{#if allTags.length > 4}
					<span class="text-xs text-gray-400">+{allTags.length - 4}개</span>
				{/if}
			</div> -->
		{/if}
	</div>

	<!-- 플랫폼 평가 영역 (좋아요, 댓글, 저장 카운트) -->
	<div class="flex items-center justify-between border-t border-gray-100 px-2 py-2">
		<div class="flex items-center gap-2">
			<!-- 좋아요 -->
			<button
				class="flex items-center gap-1.5 rounded-full px-2.5 py-1.5 transition-colors hover:bg-gray-50"
				onclick={(e) => toggleLike(place.id, e)}
				aria-label="좋아요"
			>
				<Icon
					name="heart"
					class="h-4 w-4 {place.interaction?.is_liked
						? 'fill-red-500 text-red-500'
						: 'text-gray-500'}"
				/>
				<span class="text-sm font-medium">{place.interaction?.place_liked_count || 0}</span>
			</button>

			<!-- 댓글 -->
			<button
				class="flex items-center gap-1.5 rounded-full px-2.5 py-1.5 transition-colors hover:bg-gray-50"
				onclick={(e) => commentClick(place.id, e)}
				aria-label="댓글"
			>
				<Icon
					name="message-circle"
					class="h-4 w-4 {place.interaction?.is_commented
						? 'fill-red-500 text-red-500'
						: 'text-gray-500'}"
				/>
				<span class="text-sm font-medium">{place.interaction?.place_comment_count || 0}</span>
			</button>

			<!-- 저장 (북마크) -->
			<button
				class="flex items-center gap-1.5 rounded-full px-2.5 py-1.5 transition-colors hover:bg-gray-50"
				onclick={(e) => toggleBookmark(place.id, e)}
				aria-label="저장"
			>
				<Icon
					name="bookmark"
					class="h-4 w-4 {place.interaction?.is_saved
						? 'fill-blue-600 text-blue-600'
						: 'text-gray-500'}"
				/>
				<span class="text-sm font-medium">저장</span>
			</button>
		</div>

		<!-- 네이버 지도 버튼 (방문 버튼 대체) -->
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
