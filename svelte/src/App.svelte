<script lang="ts">
	import './app.css';
	import type { RouteConfig, RouteResult } from '@mateothegreat/svelte5-router';
	import {
		getStatusByValue,
		goto,
		logging,
		Router,
		StatusCode,
		type RouterInstance,
	} from '@mateothegreat/svelte5-router';
	// import Setting from './routes/private/setting/exchange/Index.svelte';
	import { authStore } from './lib/stores/auth.svelte';
	// import Login from './routes/private/Login.svelte';
	import NotFound from './routes/NotFound.svelte';
	import Welcome from './routes/Welcome.svelte';
	import BottomNav from './components/BottomNav.svelte';
	import TopHeader from './components/TopHeader.svelte';
	import Home from './routes/home/Index.svelte';
	import Home2 from './routes/home.20250619/Index.svelte';
	import Home3 from './routes/home.3/Index.svelte';
	import Content from './routes/content/Index.svelte';
	import Detail from './routes/content/Detail.svelte';
	import Feature from './routes/feature/Index.svelte';
	import Explore from './routes/explore/Index.svelte';
	import PlaceDetail from './routes/place/Detail.svelte';
	import Review from './routes/review/Index.svelte';
	import Profile from './routes/profile/Index.svelte';
	import ProfileEdit from './routes/profile/Edit.svelte';
	import Group from './routes/group/Index.svelte';
	import Login from './routes/auth/Login.svelte';
	import Signup from './routes/auth/Signup.svelte';
	import Callback from './routes/auth/Callback.svelte';
	import ResetPassword from './routes/auth/ResetPassword.svelte';
	import Toast from './lib/components/ui/Toast.svelte';
	import Trend from './routes/trend/Index.svelte';
	import Map from './routes/map/Index.svelte';
	import { setPath } from './lib/stores/ui.store';
	import PlaceDetailPopup from './lib/components/popup/PlaceDetailPopup.svelte';
	import SaveToListSheet from './routes/place/components/SaveToListSheet.svelte';
	import LoginModal from './lib/components/LoginModal.svelte';
	import { trackPageView } from './utils/analytics';
	import SubStat from './routes/sub-stat/Index.svelte';
	// import { requestCommunityMetaService } from '$lib/api/community-meta.service';
	let router: RouterInstance | undefined = $state();

	// 네비게이션 상태를 관리하는 통합된 derived 상태
	let navigationState = $derived.by(() => {
		const originalPath = router?.current?.result?.path?.original;
		let currentPathWithoutHash = '';
		if (originalPath) {
			const hashIndex = originalPath.indexOf('#');
			currentPathWithoutHash =
				hashIndex === -1 ? originalPath : originalPath.substring(0, hashIndex);
		}

		const isDetailPage =
			currentPathWithoutHash.startsWith('/content/') ||
			currentPathWithoutHash.startsWith('/place/');
		const isProfileEditPage = currentPathWithoutHash === '/profile/edit';
		const isProfilePage = currentPathWithoutHash === '/profile';

		const hideNavigation = isDetailPage || isProfileEditPage;
		const hideTopHeader = hideNavigation || isProfilePage;

		return {
			isDetailPage,
			isProfileEditPage,
			isProfilePage,
			hideNavigation,
			hideTopHeader,
			currentPathWithoutHash, // 필요한 경우 경로도 반환
		};
	});

	const routes: RouteConfig[] = [
		{
			path: '^/$',
			component: Welcome,
		},
		{
			path: '/',
			component: Home,
		},
		{
			path: '/sub-stat/(.*)',
			component: SubStat,
		},
		{
			path: '/home',
			component: Home,
			hooks: {
				pre: () => {
					// 홈 페이지 접근 방식에 관한 컨텍스트 정보 처리
					console.log('홈 페이지 접근: pre 훅 실행');

					// 이전 페이지 확인을 위한 referrer 검사
					const referrer = document.referrer;
					const isFromContentDetail = referrer.includes('/content/');
					console.log('이전 페이지 정보:', referrer || '없음');
					console.log('상세 페이지에서 접근:', isFromContentDetail);

					// 저장된 홈 상태 확인
					const homeState = sessionStorage.getItem('homeUIState');
					if (homeState) {
						try {
							// 메타데이터 확인 (상태 유효성 검증)
							const stateData = JSON.parse(homeState);
							console.log('저장된 홈 상태 정보:', {
								source: stateData.source || '불명',
								timestamp: new Date(stateData.timestamp || 0).toISOString(),
								dataSize: JSON.stringify(stateData.data || {}).length,
							});

							// 뒤로가기 플래그 확인
							const isBackNav = sessionStorage.getItem('isBackNavigation') === 'true';
							console.log('뒤로가기 플래그:', isBackNav ? '설정됨' : '설정안됨');

							// 뒤로가기가 아닌 경우 (메뉴 네비게이션 등) 저장된 상태 제거 여부 결정
							if (!isBackNav && !isFromContentDetail) {
								console.log('일반 네비게이션 접근: 저장된 상태는 보존하지 않음');
								// sessionStorage.removeItem('homeUIState');
								// 홈 컴포넌트에서 처리하므로 여기서는 로그만 남김
							}
						} catch (err) {
							console.error('홈 상태 메타데이터 분석 오류:', err);
						}
					} else {
						console.log('저장된 홈 상태 없음');
					}

					return true; // 네비게이션 허용
				},
			},
		},
		{
			path: '/home2',
			component: Home2,
		},
		{
			path: '/home3',
			component: Home3,
		},
		{
			path: '/map',
			component: Map,
		},
		{
			path: '/content',
			component: Content,
		},
		{
			path: '/feature',
			component: Feature,
		},
		{
			path: '/trend',
			component: Trend,
		},
		{
			path: '/content/(?<id>[^/]+)',
			component: Detail,
		},

		{
			path: '/explore',
			component: Explore,
		},
		// {
		// 	path: '/place/(?<id>[^/]+)',
		// 	component: PlaceDetail,
		// },
		{
			path: '/review',
			component: Review,
		},
		{
			path: '/group',
			component: Group,
		},
		{
			path: '/profile',
			component: Profile,
		},
		{
			path: '/profile/edit',
			component: ProfileEdit,
		},
		{ path: '/auth/login', component: Login },
		{ path: '/auth/signup', component: Signup },
		{ path: '/auth/callback(#.*)?', component: Callback },
		{ path: '/auth/reset-password', component: ResetPassword },
		// {
		// 	path: '/liquidity/(.*)',
		// 	component: Liquidity,
		// },
		// {
		// 	path: '/login',
		// 	component: Login,
		// },
		// {
		// 	path: '/private/setting/exchange',
		// 	component: Setting,
		// },
	];

	// const globalAuthGuardHook = async (route: RouteResult): Promise<void> => {
	// 	console.log('###globalAuthGuardHook:', route);
	// 	// Welcome 컴포넌트는 인증 검사에서 제외
	// 	if (!route.route || route.route.component === Welcome || route.route.component === Login) {
	// 		return;
	// 	}

	// 	// 다른 모든 페이지는 인증 확인
	// 	if (!authStore.isAuthenticated()) {
	// 		// 실제 URL 경로 가져오기 (path와 params가 아닌 전체 URL)
	// 		const currentUrl = window.location.href;
	// 		console.log('현재 접근 URL:', currentUrl);
	// 		// URL에서 호스트와 포트를 제외한 경로만 추출
	// 		const urlObj = new URL(currentUrl);
	// 		const originalPath = urlObj.pathname + urlObj.search;
	// 		goto('/login', { redirectTo: originalPath });
	// 	}
	// };

	// requestCommunityMetaService('https://www.nㅁㅇㄹ2aver.com').then((res) => {
	// 	console.log(res);
	// });
	$effect(() => {
		if (router?.current) {
			// 로그에는 원본 경로(해시 포함 가능)를 그대로 사용해도 좋습니다.
			logging.info(
				`🚀 I'm an $effect in app.svelte and i'm running because the current route is now ${router.current.result.path.original}!`,
			);

			// Google Analytics 페이지뷰 추적
			trackPageView(router.current.result.path.original);
		}
	});
</script>

<!-- <div class="fixed inset-0 flex flex-col bg-gray-50 dark:bg-neutral-900"> -->
<!-- <div class="relative min-w-[320px] max-w-[700px] mx-auto overflow-hidden" -->
<div
	class="relative mx-auto max-w-lg min-w-[320px] overflow-hidden border-x border-gray-200/50 dark:border-neutral-800/50"
	style="
    min-height: calc(100vh - env(safe-area-inset-bottom) - 56px);
    padding-bottom: calc(env(safe-area-inset-bottom) + 56px);
    -webkit-overflow-scrolling: touch;"
>
	{#if !navigationState.hideTopHeader}
		<!-- <div class="flex-none">
			<TopHeader />
		</div> -->
	{/if}

	<!-- <main class={!navigationState.hideTopHeader ? "flex-1 overflow-y-auto pb-[60px] pt-[60px]" : !navigationState.hideNavigation ? "flex-1 overflow-y-auto pb-[60px]" : "flex-1 overflow-y-auto"}> -->
	<!-- <main class={!navigationState.hideTopHeader ? "flex-1 overflow-y-auto pb-[60px] pt-[60px]" : !navigationState.hideNavigation ? "flex-1 overflow-y-auto pb-[60px]" : "flex-1 overflow-y-auto"}> -->
	<!-- <main class={!navigationState.hideNavigation ? "flex-1 overflow-y-auto pb-[60px]" : "flex-1 overflow-y-auto"}> -->
	<main
		class={!navigationState.hideNavigation ? 'flex-1 overflow-y-auto ' : 'flex-1 overflow-y-auto'}
	>
		<!-- <main class={!navigationState.hideTopHeader ? "contents flex-1 overflow-y-auto pb-[60px] pt-[60px]" : !navigationState.hideNavigation ? "contents flex-1 overflow-y-auto pb-[60px]" : "contents flex-1 overflow-y-auto"}> -->
		<div>
			<Router
				bind:instance={router}
				{routes}
				statuses={{
					[StatusCode.NotFound]: (route: RouteResult) => {
						// NotFound 핸들러 로그에서도 원본 경로를 사용합니다.
						console.warn(
							`Route "${route.result.path.original}" could not be found :(`,
							{
								statusName: getStatusByValue(route.result.status),
								statusValue: route.result.status,
							},
							route,
						);
						return {
							component: NotFound,
							props: {
								somethingExtra: new Date().toISOString(),
							},
						};
					},
				}}
				hooks={{
					pre: async (route: RouteResult): Promise<boolean> => {
						// console.log('Pre-route hook:', route.route.path);
						setPath(route.route?.path?.toString() || '');
						return true;
					},
					// post: async (route: RouteResult): Promise<void> => {
					// 	console.log('Post-route hook:', route);
					// },
				}}
			/>
		</div>
	</main>

	<!-- Toast 컴포넌트 추가 -->
	<Toast />

	<!-- 전역 장소 상세 팝업 -->
	<PlaceDetailPopup />

	<!-- 전역 로그인 모달 -->
	<LoginModal />

	{#if !navigationState.hideNavigation}
		<BottomNav />
	{/if}
</div>
<SaveToListSheet />
