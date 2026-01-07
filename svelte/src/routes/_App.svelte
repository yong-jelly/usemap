<script lang="ts">
	import { Router } from '@mateothegreat/svelte5-router';
	import type { RouteConfig, RouteResult } from '@mateothegreat/svelte5-router';

	// 기본 페이지
	import Home from './home/Index.svelte';
	import Explore from './explore/Index.svelte';
	import Trend from './trend/Index.svelte';
	// import Like from './like/Index.svelte'; // Like 페이지 임포트 제거
	import Profile from './profile/Index.svelte';

	// 인증 페이지
	import Login from './auth/Login.svelte';
	import Signup from './auth/Signup.svelte';
	import Callback from './auth/Callback.svelte';
	import ResetPassword from './auth/ResetPassword.svelte';

	import BottomNav from '../components/BottomNav.svelte'; // 상대 경로로 수정

	let currentUrl = $state(window.location.pathname);
	$inspect(currentUrl);
	$effect(() => {
		// URL이 변경될 때마다 현재 URL을 콘솔에 기록합니다.
		// 이 $effect는 window.location.href가 변경될 때마다 실행됩니다.
		// 하지만 Svelte 5 룬의 특성상 명시적으로 의존성을 선언해주는 것이 좋습니다.
		// 여기서는 간단하게 href를 직접 사용합니다.
		console.log('Current URL:', window.location.href);
	});

	// 라우트 설정
	const routes: RouteConfig[] = [
		{ path: '/', component: Home },
		{ path: '/home', component: Home },
		{ path: '/explore', component: Explore },
		{ path: '/trend', component: Trend },
		// { path: "/like", component: Like }, // Like 라우트 제거
		{ path: '/profile', component: Profile },
		{ path: '/auth/login', component: Login },
		{ path: '/auth/signup', component: Signup },
		{ path: '/auth/callback', component: Callback },
		{ path: '/auth/reset-password', component: ResetPassword },
	];
</script>

<Router
	{routes}
	hooks={{
		pre: async (route: RouteResult): Promise<boolean> => {
			// console.log(route);
			console.log('Pre-route hook:');
			return true;
		},
		post: async (route: RouteResult): Promise<void> => {
			// console.log('Post-route hook:', route);
		},
	}}
/>

<BottomNav />
