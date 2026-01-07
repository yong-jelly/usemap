<script lang="ts">
	import { route } from '@mateothegreat/svelte5-router';
	import { authStore } from '$services/auth.store';
	import { uiStore } from '$lib/stores/ui.store';
	import { House, Copy, User, TvMinimalPlay } from 'lucide-svelte';
	// import { trackBottomNavClick, trackMenuAction } from '../utils/analytics';

	// 현재 활성화된 경로 확인
	let currentPath = $state('/home');
	let isAuthenticated = $state(false);
	let isBottomNavVisible = $state(true);

	// 인증 상태 구독
	authStore.subscribe((userInfo) => {
		isAuthenticated = userInfo.isAuthenticated;
		// console.log('[BottomNav] 인증 상태 변경:', isAuthenticated);
	});

	// UI 상태 구독 (필터 팝업 및 하단 네비게이션 상태)
	uiStore.subscribe((state) => {
		// console.log('[BottomNav] UI 상태 변경:', state);
		isBottomNavVisible = state.isBottomNavVisible;
		currentPath = state.path;
	});

	function scrollToTop() {
		window.scrollTo({
			top: 0,
			behavior: 'smooth',
		});
	}

	// 홈 메뉴 클릭 함수
	function handleHomeClick() {
		// trackBottomNavClick('홈', '/home');
		// trackMenuAction('홈', '페이지_상단_스크롤', { 이전경로: currentPath });
		scrollToTop();
	}

	// 둘러보기 메뉴 클릭 함수
	function handleExploreClick() {
		// trackBottomNavClick('둘러보기', '/explore');
		// trackMenuAction('둘러보기', '장소_탐색_시작', { 이전경로: currentPath });
		scrollToTop();
	}

	// 피쳐 메뉴 클릭 함수
	function handleFeatureClick() {
		// trackBottomNavClick('피쳐', '/feature');
		// trackMenuAction('피쳐', '특별_콘텐츠_보기', { 이전경로: currentPath });
		scrollToTop();
	}

	// 프로필 메뉴 클릭 함수
	function handleProfileClick() {
		const menuName = isAuthenticated ? '프로필' : '로그인';
		const path = isAuthenticated ? '/profile' : '/auth/login';
		const action = isAuthenticated ? '프로필_페이지_접근' : '로그인_시도';

		// trackBottomNavClick(menuName, path);
		// trackMenuAction(menuName, action, {
		// 	이전경로: currentPath,
		// 	인증상태: isAuthenticated ? '로그인됨' : '비로그인',
		// });
		scrollToTop();
	}
</script>

{#if isBottomNavVisible}
	<!-- <nav classX="fixed bottom-0 inset-x-0 z-50 border-t border-gray-100 bg-gray-50 dark:bg-neutral-900 transition-transform duration-300"> -->
	<nav
		class="fixed inset-x-0 bottom-0 z-50 border-t border-gray-100 bg-white transition-transform duration-300 dark:bg-neutral-900"
	>
		<!-- 2025.05.30 max-w-2xl -> max-w-lg 사이즈 조절 -->
		<!-- <div class="flex items-center justify-around h-16 mx-auto max-w-2xl p-0 relative"> -->
		<div class="relative mx-auto flex h-14 max-w-lg items-center justify-around p-0">
			<a
				use:route
				href="/home"
				onclick={handleHomeClick}
				class="flex h-full flex-1 flex-col items-center justify-center {currentPath == '/home' ||
				currentPath == '/'
					? 'text-indigo-600 dark:text-indigo-400'
					: 'text-gray-600 dark:text-neutral-400'} hover:text-indigo-600 dark:hover:text-indigo-400"
			>
				<div class="relative">
					<House class="h-6 w-6" />
					{#if currentPath == '/home'}
						<div class="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-red-500"></div>
					{/if}
				</div>
				<!-- <span class="text-xs mt-1">홈</span> -->
			</a>

			<a
				use:route
				onclick={handleExploreClick}
				href="/explore"
				class="flex h-full flex-1 flex-col items-center justify-center {currentPath == '/explore'
					? 'text-indigo-600 dark:text-indigo-400'
					: 'text-gray-600 dark:text-neutral-400'} hover:text-indigo-600 dark:hover:text-indigo-400"
			>
				<!-- <Copy class="h-6 w-6" /> -->
				<div class="relative">
					<Copy class="h-6 w-6" />
					{#if currentPath == '/explore'}
						<div class="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-red-500"></div>
					{/if}
				</div>
				<!-- <span class="text-xs mt-1">둘러보기</span> -->
			</a>
			<!-- <a
			use:route
			onclick={scrollToTop}
			href="#"
			class="flex flex-col items-center justify-center flex-1 h-full hover:text-indigo-600 dark:hover:text-indigo-400"
		>	 -->
			<!-- <div class="flex flex-col items-center justify-center flex-1 h-full">
			<SquarePlus class="w-8 h-8" />
		</div> -->
			<!-- </a> -->

			<a
				use:route
				onclick={handleFeatureClick}
				href="/feature"
				class="flex h-full flex-1 flex-col items-center justify-center {currentPath == '/feature'
					? 'text-indigo-600 dark:text-indigo-400'
					: 'text-gray-600 dark:text-neutral-400'} hover:text-indigo-600 dark:hover:text-indigo-400"
			>
				<div class="relative">
					<TvMinimalPlay class="h-6 w-6" />
					{#if currentPath == '/feature'}
						<div class="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-red-500"></div>
					{/if}
				</div>
				<!-- <span class="text-xs mt-1">트랜드</span> -->
			</a>

			<!-- <a
			use:route
			onclick={scrollToTop}
			href="/trend"
			class="flex flex-col items-center justify-center flex-1 h-full {currentPath=='/trend' ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-600 dark:text-neutral-400'} hover:text-indigo-600 dark:hover:text-indigo-400"
		>
			<div class="relative">
				<Grid class="w-6 h-6" />
				{#if currentPath=='/trend'}
					<div class="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></div>
				{/if}
			</div>
		</a> -->
			<!-- <button>
			<Telescope class="h-6 w-6" />
			<span class="text-xs mt-1">둘러보기</span>
		</button> -->

			<!-- <a
			use:route
			href="/group"
			class="flex flex-col items-center justify-center flex-1 h-full {isActive('/group') ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-600 dark:text-neutral-400'} hover:text-indigo-600 dark:hover:text-indigo-400"
		>
			<GroupIcon className="h-6 w-6" />
			<span class="text-xs mt-1">그룹</span>
		</a>

		<a
			use:route
			href="/content"
			class="flex flex-col items-center justify-center flex-1 h-full {isActive('/content') ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-600 dark:text-neutral-400'} hover:text-indigo-600 dark:hover:text-indigo-400"
		>
			<svg
				class="w-6 h-6"
				xmlns="http://www.w3.org/2000/svg"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
				/>
			</svg>
			<span class="text-xs mt-1">커뮤니티</span>
		</a>

		<a
			use:route
			href="/review"
			class="flex flex-col items-center justify-center flex-1 h-full {isActive('/review') ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-600 dark:text-neutral-400'} hover:text-indigo-600 dark:hover:text-indigo-400"
		>
			<svg
				class="w-6 h-6"
				xmlns="http://www.w3.org/2000/svg"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
				/>
			</svg>
			<span class="text-xs mt-1">리뷰</span>
		</a> -->
			<!--
		<a
			use:route
			onclick={scrollToTop}
			href={isAuthenticated ? "/profile" : "/auth/login"}
			class="flex flex-col items-center justify-center flex-1 h-full {currentPath=='/profile' || currentPath=='/auth/login' ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-600 dark:text-neutral-400'} hover:text-indigo-600 dark:hover:text-indigo-400"
		>
			{#if isAuthenticated}
				<div class="relative">
					<User class="w-6 h-6" />
					{#if currentPath=='/profile'}
						<div class="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></div>
					{/if}
				</div>
			{:else}
				<div class="relative">
					<User class="w-6 h-6" />
					{#if currentPath=='/auth/login'}
						<div class="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></div>
					{/if}
				</div>
			{/if}
		</a> -->

			<a
				use:route
				onclick={handleProfileClick}
				href="/profile"
				class="flex h-full flex-1 flex-col items-center justify-center {currentPath == '/profile'
					? 'text-indigo-600 dark:text-indigo-400'
					: 'text-gray-600 dark:text-neutral-400'} hover:text-indigo-600 dark:hover:text-indigo-400"
			>
				<div class="relative">
					<User class="h-6 w-6" />
					{#if currentPath == '/profile'}
						<div class="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-red-500"></div>
					{/if}
				</div>
			</a>
		</div>
	</nav>
{/if}
