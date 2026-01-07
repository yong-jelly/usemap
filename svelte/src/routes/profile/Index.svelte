<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '@mateothegreat/svelte5-router';
	import { route } from '@mateothegreat/svelte5-router';
	import { authStore } from '$services/auth.store';
	import { authService } from '$services/auth.service';
	import { profileService } from '$services/profile.service';
	import type { Place, UserProfile } from '$services/types';
	import ProfileCircle from '$lib/components/ProfileCircle.svelte';
	import Indicator from '$lib/components/Indicator.svelte';
	import Tabs from '$lib/components/ui/Tabs.svelte';
	import { Bookmark, Heart, ThumbsUp, MessageCircle, Clock, NotebookPen } from 'lucide-svelte';
	import { supabaseProfileService } from '$services/supabase/profile.service';
	import SavedPlaceCard from './components/SavedPlaceCard.svelte';
	import RecentViewPlaceCard from './components/RecentViewPlaceCard.svelte';
	import LikedPlaceCard from './components/LikedPlaceCard.svelte';
	import { placePopupStore } from '$lib/stores/place-popup.store.svelte';
	import VisitedPlaceCard from './components/VisitedPlaceCard.svelte';
	import LoginScreen from '$lib/components/LoginScreen.svelte';
	import Icon from '$lib/components/Icon.svelte';

	// 사용자 및 프로필 정보 상태
	let user = $state($authStore);
	let profile = $state<UserProfile | null>(null);
	let loading = $state(true);
	let loadingPlaceList = $state(false);
	let error = $state('');

	// 탭 정의 (lucide 아이콘 기반)
	const tabs = [
		// { id: 'recent_view', label: '', icon: Clock },
		// { id: 'saved', label: '', icon: Bookmark },
		// { id: 'liked_places', label: '', icon: Heart },
		// { id: 'visited_places', label: '', icon: NotebookPen },
		{ id: 'recent_view', label: '최근' },
		{ id: 'saved', label: '저장' },
		{ id: 'liked_places', label: '좋아요' },
		{ id: 'visited_places', label: '방문' },
		// { id: 'liked_reviews', label: '', icon: ThumbsUp },
		// { id: 'comments', label: '', icon: MessageCircle },
	];

	let activeTab = $state(tabs[0].id);

	// 더미 데이터 상태 (실제 API 연동으로 대체 필요)
	// userStore의 해당 함수들을 구현해야 함
	let savedPlaces = $state<Place[]>([]);
	let visitedPlaces = $state<Place[]>([]);
	let recentViewPlaces = $state<Place[]>([]);
	let likedPlaces = $state<Place[]>([]);
	let likedReviews = $state<[]>([]);
	let comments = $state<[]>([]);
	let isAuthenticated = $state(false);

	// 컴포넌트 마운트 시 초기화
	// onMount(async () => {
	$effect(() => {
		try {
			// 인증 상태 확인
			if (isAuthenticated) {
				// console.log('[Profile] 인증되지 않은 사용자, 로그인 화면 표시');
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
				loadTabData(activeTab);
			});

			// if (!profile) {
			// 	console.log('[Profile] 프로필 정보가 없습니다.');
			// 	// 필요시 프로필 생성 페이지로 리다이렉트 또는 기본 프로필 생성
			// 	// goto('/profile/create');
			// }

			// // 탭 데이터 로드
			// // 실제 구현에서는 이 부분을 각 탭에 맞는 API 호출로 대체
			// loadTabData(activeTab);
		} catch (err: any) {
			// console.error('[Profile] 프로필 로드 오류:', err);
			error = '프로필 정보를 불러오는 중 오류가 발생했습니다.';
		} finally {
			loading = false;
		}
	});

	// 로그아웃 처리
	async function handleLogout() {
		try {
			// console.log('[Profile] 로그아웃 시도...');
			loading = true;
			await authService.logout();
			goto('/profile');
		} catch (err: any) {
			// console.error('[Profile] 로그아웃 오류:', err);
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
		loadTabData(activeTab);
	}

	let currentTabId = $state(tabs[0].id);
	let page = $state(1);
	let pageSize = $state(100);

	async function next() {
		// page++;
		loadTabData(currentTabId, page + 1);
	}
	// 탭 데이터 로드 함수
	async function loadTabData(tabId: string, page: number = 1) {
		loadingPlaceList = true;
		// 실제 구현에서는 각 탭별 API 호출 (userStore 대신 RPC 호출)
		currentTabId = tabId;
		// page = 1;
		try {
			switch (tabId) {
				case 'saved':
					savedPlaces = await supabaseProfileService.getMyBookmarkedPlaces(pageSize, page - 1);
					break;
				case 'recent_view':
					recentViewPlaces = await supabaseProfileService.getMyRecentViewPlaces(pageSize, page - 1);
					break;
				case 'liked_places':
					likedPlaces = await supabaseProfileService.getMyLikedPlaces(pageSize, page - 1);
					break;
				case 'visited_places':
					visitedPlaces = await supabaseProfileService.getMyVisitedPlaces(pageSize, page - 1);
					break;
				case 'comments':
					// comments = await someService.getUserComments();
					break;
			}
		} catch (err) {
			// console.error(`[Profile] ${tabId} 데이터 로드 오류:`, err);
		} finally {
			loadingPlaceList = false;
		}
	}
	onMount(() => {
		setTimeout(() => {
			window.scrollTo({
				top: 0,
				behavior: 'auto',
			});
		}, 100);
	});

	function handlePlaceClick(placeId: string, e: Event) {
		e.stopPropagation();
		placePopupStore.show(placeId);
	}
</script>

<!-- 로딩 상태 -->
{#if loading}
	<Indicator text="프로필 정보를 불러오는 중..." />
{:else if !isAuthenticated}
	<LoginScreen />
{:else if isAuthenticated}
	<div class="min-h-screen bg-white text-black dark:bg-neutral-900 dark:text-white">
		<!-- 상단 프로필 헤더 -->
		<div class="border-b border-gray-100 bg-white dark:border-neutral-800 dark:bg-neutral-900">
			<div class="mx-auto flex max-w-2xl items-center justify-between px-4 py-4">
				<div class="flex items-center">
					<!-- <h1 class="text-lg font-semibold text-gray-900 dark:text-white">{profile?.nickname}</h1> -->
					<h1 class="text-lg font-semibold text-gray-900 dark:text-white">프로필</h1>
				</div>

				<div class="flex items-center space-x-2">
					<!-- <button
						onclick={goToEditProfile}
						class="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-neutral-800"
						aria-label="프로필 편집"
					>
						<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
							/>
						</svg>
					</button> -->
					<button
						onclick={handleLogout}
						class="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-neutral-800 dark:hover:text-gray-200"
						aria-label="로그아웃"
					>
						<Icon name="log-out" class="h-5 w-5" />
						<!-- <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
							/>
						</svg> -->
					</button>
				</div>
			</div>
		</div>

		<!-- 프로필 정보 -->
		<div class="mx-auto max-w-2xl bg-white px-4 py-6 dark:bg-neutral-900">
			<div class="mb-6 flex items-start gap-4">
				<!-- 프로필 이미지 -->
				<ProfileCircle
					profile_image_url={profile?.profile_image_url || ''}
					nickname={profile?.nickname || ''}
				/>

				<!-- 사용자 정보 -->
				<div class="flex-1">
					<div class="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
						{profile?.nickname}
					</div>
					{#if profile?.bio}
						<p class="text-sm leading-relaxed text-gray-600 dark:text-gray-300">{profile?.bio}</p>
					{:else}
						<p class="text-sm text-gray-500 dark:text-gray-400">소개 정보가 없습니다.</p>
					{/if}
				</div>
			</div>

			<!-- 프로필 버튼 -->
			<div class="mb-2 flex gap-2">
				<button
					onclick={goToEditProfile}
					class="flex-1 rounded-lg bg-gray-100 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200 dark:bg-neutral-800 dark:text-gray-300 dark:hover:bg-neutral-700"
				>
					프로필 편집
				</button>
				<button
					onclick={() => {
						goto('/sub-stat/user/me');
					}}
					class="w-[25%] rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 px-4 py-2.5 text-sm font-medium text-white transition-all duration-200 hover:from-blue-600 hover:to-purple-600 hover:shadow-md dark:from-blue-600 dark:to-purple-600 dark:hover:from-blue-700 dark:hover:to-purple-700"
				>
					분석
				</button>
			</div>
		</div>

		<!-- Tabs 컴포넌트로 탭 UI 교체 -->
		<div class="bg-white dark:bg-neutral-900">
			<Tabs
				{tabs}
				activeTab={tabs.findIndex((t) => t.id === activeTab)}
				onChange={handleTabChange}
			/>
			<div class="mx-auto min-h-screen max-w-2xl bg-gray-50 dark:bg-neutral-900">
				{#if activeTab === 'saved'}
					<!-- 저장한 음식점 탭 -->
					{#if savedPlaces.length > 0}
						<div class="grid">
							{#each savedPlaces as place}
								<SavedPlaceCard {place} onClick={handlePlaceClick} />
							{/each}
						</div>
					{:else if loadingPlaceList}
						<div class="py-8 text-center text-gray-500 dark:text-gray-400">
							<Indicator text="저장한 음식점을 불러오는 중..." />
						</div>
					{:else}
						<div class="py-8 text-center text-gray-500 dark:text-gray-400">
							<Bookmark class="mx-auto mb-4 h-16 w-16 text-gray-300 dark:text-gray-600" />
							<p>저장한 음식점이 없습니다.</p>
						</div>
					{/if}
				{:else if activeTab === 'visited_places'}
					<!-- 방문한 음식점 탭 -->
					{#if visitedPlaces.length > 0}
						<div class="grid">
							{#each visitedPlaces as place}
								<VisitedPlaceCard {place} onClick={handlePlaceClick} />
							{/each}
						</div>
					{:else if loadingPlaceList}
						<div class="py-8 text-center text-gray-500 dark:text-gray-400">
							<Indicator text="방문한 음식점을 불러오는 중..." />
						</div>
					{:else}
						<div class="py-8 text-center text-gray-500 dark:text-gray-400">
							<Bookmark class="mx-auto mb-4 h-16 w-16 text-gray-300 dark:text-gray-600" />
							<p>방문한 음식점이 없습니다.</p>
						</div>
					{/if}
				{:else if activeTab === 'recent_view'}
					<!-- 최근 본 음식점 탭 -->
					{#if recentViewPlaces.length > 0}
						<div class="grid grid-cols-3">
							{#each recentViewPlaces as place}
								<RecentViewPlaceCard {place} onClick={handlePlaceClick} />
							{/each}
						</div>
					{:else if loadingPlaceList}
						<div class="py-8 text-center text-gray-500 dark:text-gray-400">
							<Indicator text="최근 본 음식점을 불러오는 중..." />
						</div>
					{:else}
						<div class="py-8 text-center text-gray-500 dark:text-gray-400">
							<Clock class="mx-auto mb-4 h-16 w-16 text-gray-300 dark:text-gray-600" />
							<p>최근 본 음식점이 없습니다.</p>
						</div>
					{/if}
				{:else if activeTab === 'liked_places'}
					<!-- 좋아요 음식점 탭 -->
					{#if likedPlaces.length > 0}
						<div class="grid grid-cols-3">
							{#each likedPlaces as place}
								<div class="relative aspect-square bg-gray-100 dark:bg-neutral-800">
									<!-- 좋아요한 음식점 썸네일 및 내용 -->
									<LikedPlaceCard {place} onClick={handlePlaceClick} />
								</div>
							{/each}
						</div>
					{:else if loadingPlaceList}
						<div class="py-8 text-center text-gray-500 dark:text-gray-400">
							<Indicator text="좋아요한 음식점을 불러오는 중..." />
						</div>
					{:else}
						<div class="py-8 text-center text-gray-500 dark:text-gray-400">
							<Heart class="mx-auto mb-4 h-16 w-16 text-gray-300 dark:text-gray-600" />
							<p>좋아요한 음식점이 없습니다.</p>
						</div>
					{/if}
				{:else if activeTab === 'liked_reviews'}
					<!-- 좋아요 리뷰 탭 -->
					{#if likedReviews.length > 0}
						<div class="grid grid-cols-3 gap-1">
							{#each likedReviews as review}
								<div class="relative aspect-square bg-gray-100 dark:bg-neutral-800">
									<!-- 좋아요한 리뷰 썸네일 및 내용 -->
								</div>
							{/each}
						</div>
					{:else if loadingPlaceList}
						<div class="py-8 text-center text-gray-500 dark:text-gray-400">
							<Indicator text="좋아요한 리뷰를 불러오는 중..." />
						</div>
					{:else}
						<div class="py-8 text-center text-gray-500 dark:text-gray-400">
							<ThumbsUp class="mx-auto mb-4 h-16 w-16 text-gray-300 dark:text-gray-600" />
							<p>좋아요한 리뷰가 없습니다.</p>
						</div>
					{/if}
				{:else if activeTab === 'comments'}
					<!-- 내 댓글 탭 -->
					{#if comments.length > 0}
						<div class="space-y-4">
							{#each comments as comment}
								<div class="rounded-lg border border-gray-200 p-3 dark:border-neutral-800">
									<!-- 댓글 내용 -->
								</div>
							{/each}
						</div>
					{:else if loadingPlaceList}
						<div class="py-8 text-center text-gray-500 dark:text-gray-400">
							<Indicator text="작성한 댓글을 불러오는 중..." />
						</div>
					{:else}
						<div class="py-8 text-center text-gray-500 dark:text-gray-400">
							<MessageCircle class="mx-auto mb-4 h-16 w-16 text-gray-300 dark:text-gray-600" />
							<p>작성한 댓글이 없습니다.</p>
						</div>
					{/if}
				{/if}
			</div>
		</div>
	</div>
{:else}
	<!-- 오류 상태 또는 프로필 없음
	<div class="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
		<svg class="mb-4 h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-width="2"
				d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
			/>
		</svg>

		<h2 class="mb-2 text-xl font-semibold text-gray-900">
			{error || '프로필 정보가 없습니다.'}
		</h2>

		<p class="mb-4 text-center text-gray-600">
			프로필 정보가 없거나 오류가 발생했습니다. 다시 시도하거나 새 프로필을 생성해주세요.
		</p>

		<div class="flex space-x-4">
			<button
				onclick={() => window.location.reload()}
				class="rounded-md bg-gray-200 px-4 py-2 font-medium text-gray-800 hover:bg-gray-300"
			>
				새로고침
			</button>

			<button
				onclick={goToEditProfile}
				class="rounded-md bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700"
			>
				프로필 생성
			</button>
		</div>
	</div>-->
{/if}
