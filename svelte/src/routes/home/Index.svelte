<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '@mateothegreat/svelte5-router';
	import { route } from '@mateothegreat/svelte5-router';
	import { authStore } from '$services/auth.store';
	import { authService } from '$services/auth.service';
	import { profileService } from '$services/profile.service';
	import type { Place, UserProfile } from '$services/types';
	import Tabs from '$lib/components/ui/Tabs.svelte';
	import { Bookmark, MessageCircle } from 'lucide-svelte';
	import { feedService } from '$services/supabase/feed.service';
	import PlaceCard from './components/PlaceCard.svelte';
	import { placePopupStore } from '$lib/stores/place-popup.store.svelte';
	import { supabase } from '$lib/supabase';
	import { createQuery, fail, succeed } from 'svelte-tiny-query';
	import FeedHeader from './components/FeedHeader.svelte';

	// 사용자 및 프로필 정보 상태
	let profile = $state<UserProfile | null>(null);
	let loading = $state(true);
	let error = $state('');

	// 한번에 요청될 갯수
	const pageSize = 20;

	// 탭 정의 (lucide 아이콘 기반)
	const tabs = [
		{
			id: 'local',
			label: '로컬',
			description:
				'지역 주민들의 검증된 추천과 커뮤니티 기반 정보를 우선으로 하는 신뢰할 수 있는 현지 맛집',
		},
		{
			id: 'popular',
			label: '인기',
			description: '좋아요, 리뷰 수, 별점 등 정량적 지표로 검증된 대중적으로 인기 있는 음식점',
		},
		{
			id: 'discovery',
			label: '새로운 발견',
			description:
				'네이버 리뷰 200개 이하의 상대적으로 덜 알려졌지만 높은 품질을 가진 숨겨진 보석 같은 음식점',
		},
	];

	let activeTab = $state(tabs[0].id);
	let isAuthenticated = $state(false);

	// 내부 상태 관리 (북마크, 조회수, 좋아요, 댓글)
	let bookmarkedPlaces = $state<Record<string, boolean>>({});
	let likeCounts = $state<Record<string, number>>({});
	let commentCounts = $state<Record<string, number>>({});

	// svelte-tiny-query를 사용한 Places 쿼리
	const placesQuery = createQuery(
		({ tabId, page }: { tabId: string; page: number }) => ['home_places', tabId, String(page)],
		async ({ tabId, page }: { tabId: string; page: number }) => {
			// v1_list_places_by_tab RPC 함수 호출
			const { data, error: rpcError } = await supabase.rpc('v1_list_places_by_tab', {
				p_tab_name: tabId,
				p_group1: null,
				p_offset: (page - 1) * pageSize,
				p_limit: pageSize,
				p_order_by: 'rank_in_region',
			});

			if (rpcError) {
				console.error(`${tabId} 탭 데이터 조회 실패:`, rpcError);
				return fail(rpcError);
			}

			console.log(`[${tabId}] RPC 응답 데이터:`, data);

			// 반환 데이터 타입 정의 (간단하게)
			interface RpcResponseItem {
				place_data: Place;
			}

			// data는 place_data 필드를 가진 객체의 배열로 반환됨
			const newPlaces =
				(data as RpcResponseItem[])?.map((item) => item.place_data as unknown as Place) || [];

			return succeed(newPlaces);
		},
		{ staleTime: 60 * 1000 }, // 1분
	);

	let pageNumbers = $state([1]);

	// When activeTab changes, reset pagination
	$effect(() => {
		// $inspect(activeTab);
		pageNumbers = [1];
	});

	const pageQueries = $derived(
		pageNumbers.map((page) => {
			const { query } = placesQuery({ tabId: activeTab, page });
			return query;
		}),
	);

	const places: Place[] = $derived(pageQueries.flatMap((q) => q.data || []));
	// $inspect(places);

	const isInitialLoading = $derived(pageQueries.length === 1 && pageQueries[0].loading);
	const isMoreLoading = $derived(
		pageQueries.length > 1 && pageQueries[pageQueries.length - 1].loading,
	);

	const lastPageQuery = $derived(pageQueries.at(-1));
	const isNoMoreData = $derived(
		lastPageQuery?.data != null && lastPageQuery.data.length < pageSize,
	);

	// 컴포넌트 마운트 시 초기화
	$effect(() => {
		try {
			// 인증 상태 확인
			if (isAuthenticated) {
				console.log('[Profile] 인증되지 않은 사용자, 로그인 화면 표시');
				loading = false;
				return;
			} else {
				authStore.subscribe((userInfo) => {
					isAuthenticated = userInfo.isAuthenticated;
					return;
				});
			}

			// 프로필 정보 로드
			profileService.getCurrentUserProfile().then((row) => {
				profile = row;
			});
		} catch (err: any) {
			console.error('[Profile] 프로필 로드 오류:', err);
			error = '프로필 정보를 불러오는 중 오류가 발생했습니다.';
		} finally {
			loading = false;
		}
	});

	// 로그아웃 처리
	async function handleLogout() {
		try {
			console.log('[Profile] 로그아웃 시도...');
			loading = true;
			await authService.logout();
			goto('/profile');
		} catch (err: any) {
			console.error('[Profile] 로그아웃 오류:', err);
			error = '로그아웃 중 오류가 발생했습니다.';
		} finally {
			loading = false;
		}
	}

	// 프로필 편집 페이지로 이동
	function goToEditProfile() {
		goto('/profile/edit');
	}

	// 탭 변경 핸들러
	function handleTabChange(index: number) {
		activeTab = tabs[index].id;
	}

	// 더 보기
	async function next() {
		if (isMoreLoading || isNoMoreData) return;
		pageNumbers = [...pageNumbers, pageNumbers.length + 1];
	}

	onMount(() => {
		setTimeout(() => {
			window.scrollTo({
				top: 0,
				behavior: 'auto',
			});
		}, 100);
	});

	function goToPlaceDetail(placeId: string, e: Event) {
		e.stopPropagation();
		placePopupStore.show(placeId);
	}
	function toggleLike(placeId: string, e: Event) {
		e.stopPropagation();
		// toggleLike(placeId);
	}
	function commentClick(placeId: string, e: Event) {
		e.stopPropagation();
		// commentClick(placeId);
	}
	function toggleBookmark(placeId: string, e: Event) {
		e.stopPropagation();
		// toggleBookmark(placeId);
	}

	function handleTabChange2(tabId: string) {
		activeTab = tabId;
	}
</script>

<div class="flex min-h-screen flex-col">
	<!-- 헤더 -->
	<FeedHeader />

	<!-- 피드 콘텐츠 -->
	<main class="flex-1 overflow-auto bg-gray-50 dark:bg-neutral-900">
		<!-- Tabs 컴포넌트로 탭 UI 교체 -->
		<div class="bg-white dark:bg-neutral-900">
			<Tabs
				{tabs}
				activeTab={tabs.findIndex((t) => t.id === activeTab)}
				onChange={handleTabChange}
			/>
			<div class="mx-auto min-h-screen max-w-2xl bg-gray-50 dark:bg-neutral-900">
				<!-- 탭별 안내문 -->
				{#if activeTab}
					{@const currentTab = tabs.find((t) => t.id === activeTab)}
					{#if currentTab}
						<div class="mx-4 mt-3 mb-3 rounded-md bg-gray-100 px-3 py-2 dark:bg-neutral-800">
							<p class="text-center text-xs text-gray-600 dark:text-gray-400">
								{currentTab.description}
							</p>
						</div>
					{/if}
				{/if}

				{#if isInitialLoading && places.length === 0}
					<!-- 스켈레톤 UI 표시 -->
					<div class="px-4 pt-4">
						{#each Array(5) as _}
							<div class="mb-4 animate-pulse">
								<div class="h-48 rounded-lg bg-gray-200 dark:bg-neutral-700"></div>
								<div class="mt-2 space-y-2">
									<div class="h-4 rounded bg-gray-200 dark:bg-neutral-700"></div>
									<div class="h-4 w-3/4 rounded bg-gray-200 dark:bg-neutral-700"></div>
								</div>
							</div>
						{/each}
					</div>
				{:else if places.length === 0}
					<div class="py-8 text-center text-gray-500 dark:text-gray-400">
						<Bookmark class="mx-auto mb-4 h-16 w-16 text-gray-300 dark:text-gray-600" />
						<p>표시할 장소가 없습니다.</p>
					</div>
				{:else}
					<!-- 장소 카드 목록 -->
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
					{:else if isMoreLoading}
						<div class="flex justify-center py-4">
							<div
								class="h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900 dark:border-white"
							></div>
						</div>
					{:else if isNoMoreData && places.length > 0}
						<div class="flex justify-center py-4">
							<span class="text-sm text-gray-400 dark:text-gray-500">
								더 이상 표시할 항목이 없습니다.
							</span>
						</div>
					{/if}
				{/if}
			</div>
		</div>
	</main>
</div>
