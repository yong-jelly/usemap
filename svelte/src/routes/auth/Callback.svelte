<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '@mateothegreat/svelte5-router';
	import { authStore } from '$services/auth.store';
	import Indicator from '$lib/components/Indicator.svelte';

	let message = $state('인증 처리 중...');
	let error = $state('');

	// 컴포넌트 마운트 시 인증 처리
	onMount(() => {
		// 현재 URL에서 해시 처리
		console.log('[Auth Callback] 콜백 URL 처리 시작');
		
		// 인증 스토어 구독
		const unsubscribe = authStore.subscribe((userInfo) => {
			if (userInfo && userInfo.isAuthenticated) {
				console.log('[Auth Callback] 인증 성공, 사용자 정보:', userInfo);
				message = '인증 성공!';
				
				// 프로필 페이지로 리디렉션
				setTimeout(() => goto('/profile'), 1000);
			}
		});
		
		return unsubscribe;
	});
</script>

<div class="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
	<div class="sm:mx-auto sm:w-full sm:max-w-md">
		<div class="text-center">
			{#if error}
				<svg
					class="mx-auto h-12 w-12 text-red-500"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
					aria-hidden="true"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
					/>
				</svg>
				<h2 class="mt-2 text-center text-2xl font-bold text-gray-900">인증 오류</h2>
				<p class="mt-2 text-center text-sm text-gray-600">{error}</p>
			{:else}
				<!-- <div role="status" class="flex flex-col items-center justify-center">
					<svg
						aria-hidden="true"
						class="w-12 h-12 text-gray-200 animate-spin fill-indigo-600"
						viewBox="0 0 100 101"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
					>
						<path
							d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
							fill="currentColor"
						/>
						<path
							d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
							fill="currentFill"
						/>
					</svg>
					<h2 class="mt-4 text-xl font-medium text-gray-900">{message}</h2>
					<p class="mt-2 text-sm text-gray-500">잠시만 기다려 주세요...</p>
				</div> -->
				<Indicator text="인증 처리 중..." />
			{/if}

			<div class="mt-8">
				{#if error}
					<button
						type="button"
						class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
						onclick={() => goto('/auth/login')}
					>
						로그인 페이지로 돌아가기
					</button>
				{/if}
			</div>
		</div>
	</div>
</div> 