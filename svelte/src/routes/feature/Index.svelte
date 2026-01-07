<script lang="ts">
	import { onMount } from 'svelte';
	import PlaceCard from './components/PlaceCard.svelte';
	import PlaceSkeleton from './components/PlaceSkeleton.svelte';
	import { placePopupStore } from '$lib/stores/place-popup.store.svelte';
	import { uiStore, toggleFilter, toggleBottomNav, toggleLoginModal } from '$lib/stores/ui.store';
	import ExploreHeader from './components/ExploreHeader.svelte';
	import FilterButtonGroupForChannel from '$lib/components/explore/FilterButtonGroupForChannel.svelte';
	import CommentSheet from './CommentSheet.svelte';

	import { supabase } from '$lib/supabase';
	import type { ExplorerFilterState, Place } from '$services/types';
	import { setToggleLike, setToggleSave } from '$services/supabase/interactions.service';
	import { supabaseCommentService } from '../../services/supabase/comment.service';
	import type { SupabaseComment } from '../../services/types';
	import { authStore } from '$services/auth.store';
	import { createQuery, fail, succeed } from 'svelte-tiny-query';
	import { goto } from '@mateothegreat/svelte5-router';

	// 한번에 요청될 갯수
	const pageSize = 20;
	// 총 아이템 수

	// 필터 팝업 상태 (스토어로 관리)
	let isFilterOpen = $state(false);
	// 최초 진입 시 현재 위치 시트 오픈
	let isFirstOpenMyLocationSheetOpen = $state(false);

	// 내부 상태 관리 (북마크, 조회수, 좋아요, 댓글, 길찾기 폴딩)
	let bookmarkedPlaces = $state<Record<string, boolean>>({});
	let likeCounts = $state<Record<string, number>>({});
	let commentCounts = $state<Record<string, number>>({});

	// 댓글 Sheet 상태 및 더미 데이터
	let isCommentSheetOpen = $state(false);
	let commentSheetPlaceId = $state<string | null>(null);
	let commentInput = $state('');
	let isLoggedIn = $state(true); // 실제 로그인 연동 전까지 false로 고정

	// UI 스토어 구독
	uiStore.subscribe((state) => {
		isFilterOpen = state.isFilterOpen;
	});

	authStore.subscribe((state) => {
		isLoggedIn = state.isAuthenticated;
	});

	// 필터 관련 상태
	let filters = $state<ExplorerFilterState>({
		rating: null,
		categories: [],
		features: [],
		group1: '인기',
		group2: '전체',
		group3: '전체',
		themes: null,
		nearMe: false,
		radius: 5,
		currentLocation: '',
		channels: [], // 검색 필터 (유튜브,네이버폴더)
	});

	let searchPlaces = $state<Place[]>([]);
	let isSearchLoading = $state(false);

	// 필터 토글 함수
	function toggleFilterOption(type: keyof typeof filters, value: string | number | boolean) {
		// console.log('[toggleFilterOption]', type, value);
		if (type === 'rating') {
			filters.rating = filters.rating === value ? null : (value as number);
		} else if (type === 'group1') {
			filters.group1 = filters.group1 === value ? null : (value as string);
		} else if (type === 'group2') {
			filters.group2 = filters.group2 === value ? null : (value as string);
		} else if (type === 'categories') {
			const valueStr = value as string;
			if (filters.categories && filters.categories.includes(valueStr)) {
				filters.categories = filters.categories.filter((item) => item !== valueStr);
			} else {
				filters.categories = [...(filters.categories || []), valueStr];
			}
		} else if (type === 'features') {
			const valueStr = value as string;
			if (filters.features && filters.features.includes(valueStr)) {
				filters.features = filters.features.filter((item) => item !== valueStr);
			} else {
				filters.features = [...(filters.features || []), valueStr];
			}
		} else if (type === 'nearMe') {
			filters.nearMe = value as boolean;
		} else if (type === 'radius') {
			filters.radius = value as number;
		} else if (type === 'currentLocation') {
			filters.currentLocation = value as string;
		}
	}

	// 필터 초기화
	function resetFilters() {
		filters = {
			rating: null,
			categories: [],
			features: [],
			group1: '인기',
			group2: '전체',
			group3: '전체',
			themes: null,
			nearMe: false,
			radius: 5,
			currentLocation: '',
			channels: [],
		};
	}

	// 필터 팝업 열기/닫기
	function toggleFilterPopup() {
		toggleFilter({ isOpen: true }); // 스토어의 토글 함수 사용
	}

	// 필터 요청 함수

	// 필터 적용
	async function applyFilters() {
		console.log('필터 적용:', filters);
	}

	const placesQuery = createQuery(
		({ filters, page }: { filters: ExplorerFilterState; page: number }) => [
			'v1_list_place_features',
			JSON.stringify(filters),
			String(page),
		],
		async ({ filters, page }: { filters: ExplorerFilterState; page: number }) => {
			console.log('filters', filters);
			const check = (group: string | null | undefined) => {
				if (group === '전체' || group === null || group === undefined || group === '') {
					return null;
				}
				return group;
			};
			const { data, error: rpcError } = await supabase.rpc('v1_list_place_features', {
				p_group1: check(filters.group1),
				p_group2: check(filters.group2),
				p_group3: check(filters.group3),
				p_limit: pageSize,
				p_offset: (page - 1) * pageSize,
				p_platform_type: filters.features && filters.features.length > 0 ? filters.features : null,
				p_channel_ids:
					// filters.features &&
					// filters.features.includes('youtube') &&
					filters.channels && filters.channels.length > 0 ? filters.channels : null,
			});

			if (rpcError) {
				console.error('음식점 목록 조회 실패:', rpcError);
				return fail(rpcError);
			}

			// 반환 데이터 타입 정의 (간단하게)
			interface RpcResponseItem {
				place_data: Place;
			}

			// data는 place_data 필드를 가진 객체의 배열로 반환됨
			const newPlaces = (data as RpcResponseItem[]).map(
				(item) => item.place_data as unknown as Place,
			);

			return succeed(newPlaces);
		},
		{ staleTime: 60 * 1000 }, // 1분
	);

	let pageNumbers = $state([1]);

	// When filters change, reset pagination
	$effect(() => {
		// This effect runs when filters change.
		// By using $inspect, you can see the changes in the Svelte DevTools.
		// $inspect(filters);
		pageNumbers = [1];
	});

	const pageQueries = $derived(
		pageNumbers.map((page) => {
			const { query } = placesQuery({ filters, page });
			return query;
		}),
	);

	const places: Place[] = $derived(pageQueries.flatMap((q) => q.data || []));

	const isInitialLoading = $derived(pageQueries.length === 1 && pageQueries[0].loading);
	const isMoreLoading = $derived(
		pageQueries.length > 1 && pageQueries[pageQueries.length - 1].loading,
	);

	const lastPageQuery = $derived(pageQueries.at(-1));
	const isNoMoreData = $derived(
		lastPageQuery?.data != null && lastPageQuery.data.length < pageSize,
	);
	let isToggleSaveProcessing = $state(false);
	// 북마크 토글 함수
	async function toggleBookmark(placeId: string, event: Event) {
		event.stopPropagation();
		if (!isLoggedIn) {
			toggleLoginModal({ isOpen: true });
			return;
		}
		if (isToggleSaveProcessing) return;
		isToggleSaveProcessing = true;
		try {
			const isSaved = await setToggleSave(placeId, 'place', placeId);
			// 북마크 상태 업데이트
			const placeIndex = places.findIndex((place) => place.id === placeId);
			if (placeIndex !== -1 && places[placeIndex]?.interaction) {
				const interaction = places[placeIndex].interaction;
				interaction.is_saved = isSaved;
				interaction.place_saved_count = isSaved
					? (interaction.place_saved_count || 0) + 1
					: Math.max((interaction.place_saved_count || 0) - 1, 0);
			}
			// bookmarkedPlaces[placeId] = isSaved;
		} catch (error) {
			console.error('북마크 처리 실패:', error);
		} finally {
			isToggleSaveProcessing = false;
		}
	}

	// 좋아요 처리 진행상태
	let isToggleLikeProcessing = $state(false);
	// 좋아요 토글 함수
	async function toggleLike(placeId: string, event: Event) {
		event.stopPropagation();

		// 로그인 확인
		if (!isLoggedIn) {
			toggleLoginModal({ isOpen: true });
			return;
		}
		if (isToggleLikeProcessing) return;
		isToggleLikeProcessing = true;
		try {
			const isLiked = await setToggleLike(placeId, 'place', placeId);
			// console.log('[toggleLike]', isLiked);
			// 좋아요 상태 업데이트
			const placeIndex = places.findIndex((place) => place.id === placeId);
			if (placeIndex !== -1 && places[placeIndex]?.interaction) {
				const interaction = places[placeIndex].interaction;
				interaction.is_liked = isLiked;
				interaction.place_liked_count = isLiked
					? (interaction.place_liked_count || 0) + 1
					: Math.max((interaction.place_liked_count || 0) - 1, 0);
			}
		} catch (error) {
			console.error('좋아요 처리 실패:', error);
		} finally {
			isToggleLikeProcessing = false;
		}
	}

	// 댓글 버튼 클릭 함수
	function commentClick(placeId: string, event: Event) {
		event.stopPropagation();
		openCommentSheet(placeId);
	}

	// 외부 링크 클릭 시 이벤트 전파 중지

	// 장소 상세 페이지로 이동 및 조회수 증가
	function goToPlaceDetail(placeId: string, event: Event) {
		console.log('[goToPlaceDetail]', placeId);
		event.preventDefault();
		// increaseViewCount(placeId);

		// 공통 팝업 서비스 사용
		placePopupStore.show(placeId);
	}

	// 더 보기
	async function next() {
		if (isMoreLoading || isNoMoreData) return;
		pageNumbers = [...pageNumbers, pageNumbers.length + 1];
	}

	/**
	 * 현재 내 위치 정보를 기반으로 조회
	 */
	async function fetchPlacesByCurrentLocation() {
		Object.assign(filters, { group1: null, group2: null, group3: null });
	}

	onMount(() => {
		// supabase.rpc('v1_get_youtube_channels').then(({data, error}) => {
		// 	console.log('[v1_get_youtube_channels]', data, error);
		// });
		fetchPlacesByCurrentLocation();
	});
	// select v1_list_places_by_ids(ARRAY['16870210','16870210'])

	// 댓글 Sheet 오픈 핸들러
	function openCommentSheet(placeId: string) {
		commentSheetPlaceId = placeId;
		isCommentSheetOpen = true;
		toggleBottomNav({ isOpen: false });
	}
	function closeCommentSheet() {
		isCommentSheetOpen = false;
		commentSheetPlaceId = null;
		commentInput = '';
		toggleBottomNav({ isOpen: true });
	}

	// 댓글 입력 핸들러 (실제 저장X, UI만)
	function handleCommentInput(e: Event) {
		commentInput = (e.target as HTMLInputElement).value;
	}

	let comments = $state<SupabaseComment[]>([]);
	let isCommentsLoading = $state(false);
	let replyTo = $state<SupabaseComment | null>(null);

	// 댓글 목록 fetch 함수
	async function fetchComments(placeId: string) {
		isCommentsLoading = true;
		const { data, error } = await supabaseCommentService.getCommentsForPlace(placeId);
		comments = data || [];
		isCommentsLoading = false;
	}

	// 댓글 시트 오픈 시 댓글 목록 fetch
	$effect(() => {
		if (isCommentSheetOpen && commentSheetPlaceId) {
			fetchComments(commentSheetPlaceId);
			replyTo = null;
		}
	});

	// 댓글 좋아요 토글 핸들러
	async function handleCommentLike(commentId: string) {
		const liked = await supabaseCommentService.toggleCommentLikeForPlace(commentId);
		comments = comments.map((comment) =>
			comment.id === commentId ? { ...comment, is_liked: !comment.is_liked } : comment,
		);
	}

	// 답글 상태 핸들러
	function handleReply(comment: SupabaseComment) {
		replyTo = comment;
	}
	function cancelReply() {
		replyTo = null;
	}

	// 댓글 등록 핸들러 (답글 포함)
	async function handleCommentSubmit() {
		if (!commentInput.trim() || !commentSheetPlaceId) return;
		await supabaseCommentService.createCommentForPlace({
			business_id: commentSheetPlaceId,
			content: commentInput,
			parent_comment_id: replyTo?.id || undefined,
		});
		commentInput = '';
		replyTo = null;
		fetchComments(commentSheetPlaceId);
	}
</script>

<!-- 헤더 flex 필터 할려면 pt 필요 -->
<div class="flex min-h-screen flex-col">
	<ExploreHeader />
	<div
		class="border-b border-gray-100 bg-white px-4 py-1 dark:border-neutral-800 dark:bg-neutral-900"
	>
		<!-- <div
		class="border-b border-gray-100 bg-white px-4 py-1 dark:border-neutral-800 dark:bg-neutral-900"
	> -->
		<FilterButtonGroupForChannel
			onFilterSelect={(filterId, value) => {
				console.log(`필터 선택: ${filterId}`, value);
				if (filterId === 'mylocation') {
					console.log('[내 위치] 버튼 클릭됨:', value);
					return;
				}
				if (filterId === 'region') {
					filters.group1 = value.group1;
					filters.group2 = value.group2;
					filters.group3 = value.group3;
				} else if (filterId === 'features') {
					filters.features = value;
					console.log(filters);
					// onFilterSelect
				} else if (filterId === 'youtube_channels' || filterId === 'naver_folder') {
					filters.channels = value;
					console.log('채널 필터:', value);
					// } else if (filterId === 'naver_folder') {
					// 	filters.youtubeChannels = value;
					// 	console.log('네이버 폴더 필터:', value);
				} else if (filterId === 'fe') {
					filters.rating = value;
				}
				// fetchPlaces();
			}}
			onEvent={(event) => {
				console.log('FilterButtonGroup 이벤트:', event);
			}}
			onStart={() => {
				isFirstOpenMyLocationSheetOpen = false;
			}}
			{isFirstOpenMyLocationSheetOpen}
		/>
	</div>
	<!-- 메인 콘텐츠 -->
	<div class="flex-1 overflow-auto bg-gray-50 dark:bg-neutral-900">
		<div class="mx-auto max-w-lg pt-2">
			<!-- {@const isLoading = viewMode === 'search' ? isSearchLoading : isInitialLoading} -->
			{#if isInitialLoading && places.length === 0}
				<!-- 스켈레톤 UI 표시 (자연스러운 로딩 경험) -->
				<div class="px-4">
					<PlaceSkeleton count={5} />
				</div>
			{:else if places.length === 0}
				<div class="rounded-lg bg-white p-8 text-center shadow-xs dark:bg-neutral-800">
					<svg
						class="mx-auto mb-4 h-16 w-16 text-gray-400 dark:text-gray-500"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
						></path>
					</svg>
					<p class="text-lg text-gray-500 dark:text-gray-400">검색된 음식점이 없습니다.</p>
				</div>
			{:else}
				<!-- 추천 링크 통계 알람 박스 -->
				<div class="mb-4 px-2">
					<div
						class="w-full rounded border border-gray-200 bg-white p-3 dark:border-neutral-700 dark:bg-neutral-800"
					>
						<div class="flex items-center justify-between">
							<div class="flex flex-col gap-1">
								<div class="flex items-center gap-1 text-sm">
									<span class="text-gray-500 dark:text-gray-400">😋</span>
									<span class="font-medium text-gray-700 dark:text-gray-300">
										다양한 커뮤니티에서 추천한 음식점을 만나보세요.
									</span>
								</div>
							</div>
							<button
								class="rounded bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-600 transition-all duration-200 hover:bg-indigo-100 active:scale-95 dark:bg-indigo-900/30 dark:text-indigo-400 dark:hover:bg-indigo-900/50"
								onclick={() => {
									goto('/sub-stat/feature/latest');
								}}
							>
								통계 보기
							</button>
						</div>
					</div>
				</div>
				<!-- 음식점 카드 목록 -->
				{#each places as place}
					<PlaceCard
						{place}
						{goToPlaceDetail}
						{toggleLike}
						{commentClick}
						{toggleBookmark}
						{commentCounts}
						{bookmarkedPlaces}
						onTagClick={(type, value) => {
							console.log('[태그/카테고리/그룹 클릭]', type, value);
							// 태그/카테고리/그룹 클릭 시 필터 버튼 그룹에 이벤트 전달
							if (type === 'category') {
								filters.categories = [value];
							} else if (type === 'group1') {
								filters.group1 = value;
								filters.group2 = null;
								filters.group3 = null;
							} else if (type === 'group2') {
								filters.group2 = value;
								filters.group3 = null;
							} else if (type === 'group3') {
								filters.group3 = value;
							} else if (type === 'tag') {
								return;
							}
							// fetchPlaces();
						}}
					/>
				{/each}

				<!-- 더 보기 버튼 -->
				{#if !isMoreLoading && places.length > 0 && !isNoMoreData}
					<div class="flex justify-center py-4">
						<button
							class="flex items-center gap-2 rounded-full bg-white px-6 py-2 text-gray-700 shadow-xs transition-shadow hover:text-gray-900 hover:shadow-md dark:bg-neutral-800 dark:text-gray-300 dark:hover:text-gray-100"
							onclick={next}
						>
							<span>더 보기</span>
							<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M19 9l-7 7-7-7"
								/>
							</svg>
						</button>
					</div>
				{:else if isNoMoreData}
					<div class="flex justify-center py-4">
						<span class="text-sm text-gray-400 dark:text-gray-500">
							더 이상 표시할 항목이 없습니다.
						</span>
					</div>
				{/if}
			{/if}
		</div>
	</div>
</div>

<!-- 댓글 Sheet (BottomSheet 컴포넌트 기반) -->
<CommentSheet
	isOpen={isCommentSheetOpen}
	{comments}
	{isLoggedIn}
	input={commentInput}
	onInput={handleCommentInput}
	onSubmit={handleCommentSubmit}
	onClose={closeCommentSheet}
	onLike={handleCommentLike}
	onReply={handleReply}
	{replyTo}
	isLoading={isCommentsLoading}
/>

<style>
	/* 스크롤바 숨기기 */
	.scrollbar-hide {
		-ms-overflow-style: none; /* IE and Edge */
		scrollbar-width: none; /* Firefox */
	}
	.scrollbar-hide::-webkit-scrollbar {
		display: none; /* Chrome, Safari, Opera */
	}

	/* SVG 아이콘 스타일 */
	.svg-icon {
		width: 20px;
		height: 20px;
		display: inline-flex;
		align-items: center;
		justify-content: center;
	}

	/* 버튼 비활성화 스타일 */
	button:disabled {
		opacity: 0.7;
		cursor: not-allowed;
	}
</style>
