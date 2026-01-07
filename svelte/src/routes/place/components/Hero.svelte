<script lang="ts">
	import { slide } from 'svelte/transition';
	import type { Place } from '$services/types';
	import { convertToNaverResizeImageUrl } from '$utils/naver.util';
	import Icon from '$lib/components/Icon.svelte';

	const { place, allImages } = $props<{
		place: Place;
		allImages: string[];
	}>();

	let selectedImage = $state(allImages[0]);
	let showAllPhotos = $state(false);

	function selectImage(image: string) {
		selectedImage = image;
	}

	function toggleAllPhotos() {
		showAllPhotos = !showAllPhotos;
	}

	function stopPropagation(event: Event) {
		event.stopPropagation();
	}
</script>

<div
	class="relative w-full h-[450px] overflow-hidden bg-gray-200"
	data-hero-swipe-container
>
	<!-- Background Image -->
	<img
		src={convertToNaverResizeImageUrl(selectedImage)}
		alt={place.name}
		class="absolute inset-0 w-full h-full object-cover transition-all duration-300"
	/>

	<!-- Gradient Overlay -->
	<div class="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>

	<!-- Content Overlay -->
	<div class="relative h-full flex flex-col justify-end text-white p-6 md:p-8">
		<div class="flex-1"></div>

		<!-- Place Info -->
		<div class="mb-4">
			<h1 class="text-3xl md:text-4xl font-extrabold tracking-tight mb-2 text-shadow-lg">
				{place.name}
			</h1>
			<p class="text-lg md:text-xl text-gray-200 text-shadow-md">{place.category_specific}</p>
			{#if place.road_address}
				<div class="mt-4 flex items-center space-x-2 text-gray-200">
					<Icon name="map-pin" class="w-5 h-5" />
					<span>{place.road_address}</span>
				</div>
			{/if}
		</div>

		<!-- Thumbnails -->
		<div class="relative">
			<div class="flex items-center space-x-2 overflow-x-auto pb-2 -mx-1 px-1">
				{#each allImages.slice(0, 10) as image, i}
					<button
						onclick={() => selectImage(image)}
						class="flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden transition-all duration-200 border-2 {selectedImage ===
						image
							? 'border-white'
							: 'border-transparent'}"
					>
						<img
							src={convertToNaverResizeImageUrl(image)}
							alt={`${place.name} thumbnail ${i + 1}`}
							class="w-full h-full object-cover"
						/>
					</button>
				{/each}

				<!-- {#if allImages.length > 7}
					<button
						onclick={toggleAllPhotos}
						class="flex-shrink-0 w-20 h-20 rounded-lg bg-black/50 flex flex-col items-center justify-center text-white hover:bg-black/70 transition-colors"
					>
						<Icon name="grid" class="w-6 h-6 mb-1" />
						<span class="text-xs font-medium">{showAllPhotos ? '닫기' : '전체보기'}</span>
					</button>
				{/if} -->
			</div>
		</div>
	</div>
</div>

{#if showAllPhotos}
	<div class="w-full overflow-x-auto py-4">
		<div class="flex items-center space-x-2 px-1">
			{#each allImages as image, i}
				<button
					onclick={() => selectImage(image)}
					class="flex-shrink-0 w-28 h-28 rounded-lg overflow-hidden transition-all duration-200 border-2 {selectedImage === image ? 'border-white' : 'border-transparent'}"
				>
					<img
						src={convertToNaverResizeImageUrl(image)}
						alt={`${place.name} 전체 썸네일 ${i + 1}`}
						class="w-full h-full object-cover"
					/>
				</button>
			{/each}
		</div>
	</div>
{/if} 