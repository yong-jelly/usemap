<script lang="ts">
	import { onMount } from 'svelte';
	import { supabasePlaceService } from '$services/supabase';
	import type { Place } from '$services/types';
	import { slide } from 'svelte/transition';

	import HeaderNavigation from './components/HeaderNavigation.svelte';
	import Hero from './components/Hero.svelte';
	import PlaceConveniences from './components/PlaceConveniences.svelte';
	import MenuGrid from '$lib/components/MenuGrid.svelte';
	import PlaceUserReview from './components/PlaceUserReview.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import { calculateAveragePrice, formatWithCommas } from '$utils/number.util';
	import PlaceExperienceButtons from './components/PlaceExperienceButtons.svelte';
	import type { PlaceExperienceOption } from './types';
	import { placeService } from '$services/place.service';
	import { setToggleLike, setToggleSave } from '$services/supabase/interactions.service';
	import { authStore } from '$services/auth.store';
	// --- Props ---
	const { placeId } = $props<{ placeId?: string }>();

	// --- State ---
	let place = $state<Place | null>(null);
	let showAllMenus = $state(false);
	let showShareDialog = $state(false);
	let isAuthenticated = $state(false);

	let reviewsContainer = $state<HTMLElement | null>(null);

	let allImages = $derived.by(() => {
		if (!place) return [];
		const combined = [
			...(place.images || []),
			...(place.image_urls || []),
			...(place.place_images || []),
		];
		return [...new Set(combined)]; // 중복 제거
	});

	// 평가 버튼
	let experienceOptions: PlaceExperienceOption[] = $state([
		{ type: 'visited', label: '가봤어요', icon: 'check-circle', selected: false, enabled: true },
		{ type: 'like', label: '좋아요', icon: 'heart', selected: false, enabled: true },
		// { type: 'dislike', label: '줄서는식당', icon: 'sunset', selected: false, enabled: false },
		{ type: 'bookmark', label: '저장', icon: 'bookmark', selected: false, enabled: true },
	]);

	// 평가 상태
	let experienceState = $state<PlaceExperienceOption>();

	// --- Lifecycle ---
	onMount(async () => {
		if (placeId) {
			const { result } = await supabasePlaceService.getPlaceDetail(placeId);
			place = result.row;
		}
		// 상태 갱신
		const visitedOption = experienceOptions.find((opt) => opt.type === 'visited');
		if (visitedOption) {
			visitedOption.selected = place?.experience?.is_visited ?? false;
		}
		const likeOption = experienceOptions.find((opt) => opt.type === 'like');
		if (likeOption) {
			likeOption.selected = place?.interaction?.is_liked ?? false;
		}
		const bookmarkOption = experienceOptions.find((opt) => opt.type === 'bookmark');
		if (bookmarkOption) {
			bookmarkOption.selected = place?.interaction?.is_saved ?? false;
		}
		experienceOptions = [...experienceOptions];
		authStore.subscribe((userInfo) => {
			isAuthenticated = userInfo.isAuthenticated;
			console.log('[PlaceDetail] 인증 상태 변경:', isAuthenticated);
		});
	});

	function handleShare() {
		showShareDialog = true;
	}

	function handleSave() {
		if (!place?.interaction) return;
		place.interaction.is_saved = !place.interaction.is_saved;
		// TODO: API call to update saved state
	}

	function stopPropagation(event: Event) {
		event.stopPropagation();
	}

	function scrollToReviews() {
		reviewsContainer?.scrollIntoView({ behavior: 'smooth' });
	}

	let avgPrice = $derived(calculateAveragePrice(place?.menus || []));

	// 평가 상태 로딩 중복 방지
	let isExperienceLoading = $state(false);

	/**
	 * 평가 상태 변경 핸들러
	 * @param option
	 */
	async function handleExperienceToggle(option: PlaceExperienceOption) {
		if (isExperienceLoading) return;
		isExperienceLoading = true;
		try {
			const toggleFunctions: Record<string, () => Promise<{ type: string; selected: boolean }>> = {
				like: async () => {
					const isLiked = await setToggleLike(placeId, 'place', placeId);
					return { type: 'like', selected: isLiked };
				},
				visited: async () => {
					const is_cancel = option.selected;
					await placeService.togglePlaceExperience(placeId, undefined, is_cancel);
					return { type: 'visited', selected: !option.selected };
				},
				bookmark: async () => {
					const isSaved = await setToggleSave(placeId, 'place', placeId);
					return { type: 'bookmark', selected: isSaved };
				},
			};
			if (option.type in toggleFunctions) {
				const { type, selected } =
					await toggleFunctions[option.type as keyof typeof toggleFunctions]();
				const experienceOption = experienceOptions.find((opt) => opt.type === type);
				if (experienceOption) {
					experienceOption.selected = selected;
				}
			}
			experienceOptions = [...experienceOptions];
		} catch (error) {
			console.error('Error updating visited status:', error);
		} finally {
			isExperienceLoading = false;
		}
	}
</script>

<div class="min-h-screen bg-gray-50">
	{#if place}
		<HeaderNavigation
			place={{ id: place.id, name: place.name }}
			isSaved={place.interaction?.is_saved ?? false}
			onSave={handleSave}
		/>

		<div class="pt-16 pb-28">
			{#if allImages.length > 0}
				<Hero {place} {allImages} />
			{/if}

			<PlaceExperienceButtons
				{isAuthenticated}
				options={experienceOptions}
				onToggle={handleExperienceToggle}
			/>

			<main class="px-4 py-8 sm:px-6 lg:px-8">
				<div class="mx-auto max-w-4xl space-y-8">
					{#if place.road}
						<div>
							<h2 class="mb-4 text-xl font-bold tracking-tight text-gray-900">장소 소개</h2>
							<p class="text-base whitespace-pre-line text-gray-700">{place.road}</p>
						</div>
					{/if}

					{#if place.features && place.features.length > 0}
						<div>
							<!-- <h2 class="mb-4 text-xl font-bold tracking-tight text-gray-900">추천 출처</h2> -->
							<div class="flex flex-wrap gap-2">
								{#each place.features as feature}
									{#if feature.platform_type === 'folder'}
										<span
											class="inline-flex items-center gap-1 rounded-md bg-green-100 px-3 py-1.5 text-sm font-medium text-green-700"
										>
											<span>#{feature.title || '제목 없음'}</span>
										</span>
									{/if}
								{/each}
							</div>
						</div>
					{/if}
					<!-- {#if place.conveniences && place.conveniences.length > 0}
						<div class="h-px bg-gray-200"></div>
						<PlaceConveniences conveniences={place.conveniences} />
					{/if} -->

					{#if place.menus && place.menus.length > 0}
						<div class="h-px bg-gray-200"></div>
						<div>
							<h2 class="mb-4 text-xl font-bold tracking-tight text-gray-900">메뉴</h2>
							<MenuGrid
								menus={place.menus}
								showAll={showAllMenus}
								onShowAll={() => (showAllMenus = true)}
							/>
						</div>
					{/if}

					<div class="h-px bg-gray-200"></div>

					<div bind:this={reviewsContainer}>
						<PlaceUserReview {isAuthenticated} {place} />
					</div>
				</div>
			</main>
		</div>

		<!-- 하단 고정 영역 -->
		<div
			class="fixed inset-x-0 bottom-0 z-20 border-t border-gray-200 bg-white/90 backdrop-blur-sm"
		>
			<div class="mx-auto flex max-w-4xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
				<div class="text-sm">
					<p class="font-bold text-gray-800">₩{formatWithCommas(avgPrice.roundedPrice)}원대</p>
					<!-- <div class="flex items-center gap-x-1.5 text-xs text-gray-600">
						<span>⭐ 4.95</span>
						<span class="text-gray-300">·</span>
						<a
							href="#reviews"
							class="underline"
							onclick={(e) => {
								e.preventDefault();
								scrollToReviews();
							}}
						>
							후기 23개
						</a>
					</div> -->
				</div>
				<div class="flex items-center gap-2">
					<!-- <button
						onclick={scrollToReviews}
						class="rounded-lg bg-pink-600 px-4 py-2 text-sm font-bold text-white shadow-md transition-colors hover:bg-pink-700"
					>
						리뷰 보기
					</button> -->

					<a
						href={`https://map.naver.com/p/entry/place/${place.id}`}
						target="_blank"
						rel="noopener noreferrer"
						class="flex items-center gap-1.5 rounded-full px-2 py-1 font-medium transition-colors hover:bg-green-500"
						aria-label="네이버 장소 보기"
					>
						<Icon name="map-pinned" class="h-5 w-5" />
						<span class="text-sm">지도</span>
					</a>
				</div>
			</div>
		</div>

		<!-- Share Dialog -->
		{#if showShareDialog}
			<div
				class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
				transition:slide
				onclick={() => (showShareDialog = false)}
			>
				<div class="w-full max-w-sm rounded-xl bg-white p-6" onclick={stopPropagation}>
					<h3 class="mb-4 text-center text-lg font-semibold">공유하기</h3>
					<p class="mb-6 text-center text-gray-600">
						이 장소의 링크를 복사하여 친구들과 공유해보세요.
					</p>
					<div class="flex items-center rounded-lg border border-gray-300 p-2">
						<input
							type="text"
							value={window.location.href}
							readonly
							class="flex-1 border-0 bg-transparent text-sm text-gray-800 outline-none"
						/>
						<button
							class="rounded-md bg-pink-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-pink-700"
							onclick={() => navigator.clipboard.writeText(window.location.href)}
						>
							복사
						</button>
					</div>
				</div>
			</div>
		{/if}
	{:else}
		<div class="flex h-screen items-center justify-center">
			<p class="text-gray-500">장소 정보를 불러오는 중...</p>
		</div>
	{/if}
</div>
