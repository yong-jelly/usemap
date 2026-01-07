<script lang="ts">
	import { preventDefault } from 'svelte/legacy';

	import { onMount } from 'svelte';
	import { goto, route } from '@mateothegreat/svelte5-router';
	import { authService } from '$services/auth.service';
	import { authStore } from '$services/auth.store';
	import Indicator from '$lib/components/Indicator.svelte';

	// 상태 변수
	let email = $state('');
	let loading = $state(false);
	let error = $state('');
	let success = $state('');

	// 이메일 전송 처리
	async function handleSubmit() {
		error = '';
		success = '';
		
		if (!email) {
			error = '이메일을 입력해주세요.';
			return;
		}
		
		loading = true;
		
		try {
			console.log('[ResetPassword] 비밀번호 재설정 요청:', email);
			await authService.resetPassword(email);
			success = '비밀번호 재설정 링크가 이메일로 전송되었습니다. 이메일을 확인해주세요.';
		} catch (err: any) {
			console.error('[ResetPassword] 비밀번호 재설정 요청 실패:', err.message);
			error = err.message || '비밀번호 재설정 요청 중 오류가 발생했습니다.';
		} finally {
			loading = false;
		}
	}

	// 이미 로그인한 경우 리다이렉트
	onMount(() => {
		const unsubscribe = authStore.subscribe((userInfo) => {
			if (userInfo.isAuthenticated) {
				console.log('[ResetPassword] 이미 로그인됨, 리다이렉트...');
				goto('/profile');
			}
		});
		
		return unsubscribe;
	});
</script>

<div class="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
	<div class="sm:mx-auto sm:w-full sm:max-w-md">
		<h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
			비밀번호 재설정
		</h2>
		<p class="mt-2 text-center text-sm text-gray-600">
			또는
			<a use:route href="/auth/login" class="font-medium text-indigo-600 hover:text-indigo-500">
				로그인 페이지로 돌아가기
			</a>
		</p>
	</div>

	<div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
		<div class="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
			<!-- 안내 메시지 -->
			<div class="mb-6">
				<p class="text-sm text-gray-700">
					계정에 등록된 이메일 주소를 입력하시면, 비밀번호 재설정 링크를 보내드립니다.
				</p>
			</div>

			<!-- 에러 또는 성공 메시지 -->
			{#if error}
				<div class="rounded-md bg-red-50 p-4 mb-6">
					<div class="flex">
						<div class="flex-shrink-0">
							<svg
								class="h-5 w-5 text-red-400"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
								/>
							</svg>
						</div>
						<div class="ml-3">
							<h3 class="text-sm font-medium text-red-800">{error}</h3>
						</div>
					</div>
				</div>
			{:else if success}
				<div class="rounded-md bg-green-50 p-4 mb-6">
					<div class="flex">
						<div class="flex-shrink-0">
							<svg
								class="h-5 w-5 text-green-400"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M5 13l4 4L19 7"
								/>
							</svg>
						</div>
						<div class="ml-3">
							<h3 class="text-sm font-medium text-green-800">{success}</h3>
						</div>
					</div>
				</div>
			{/if}

			<!-- 이메일 입력 폼 -->
			<form class="space-y-6" onsubmit={preventDefault(handleSubmit)}>
				<div>
					<label for="email" class="block text-sm font-medium text-gray-700">
						이메일 주소
					</label>
					<div class="mt-1">
						<input
							id="email"
							name="email"
							type="email"
							autocomplete="email"
							required
							bind:value={email}
							class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
							placeholder="example@example.com"
						/>
					</div>
				</div>

				<div>
					<button
						type="submit"
						class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
						disabled={loading}
					>
						{#if loading}
							<!-- <svg
								class="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
								fill="none"
								viewBox="0 0 24 24"
							>
								<circle
									class="opacity-25"
									cx="12"
									cy="12"
									r="10"
									stroke="currentColor"
									stroke-width="4"
								/>
								<path
									class="opacity-75"
									fill="currentColor"
									d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
								/>
							</svg>
							처리 중... -->
							<Indicator text="처리 중..." />
						{:else}
							재설정 링크 전송
						{/if}
					</button>
				</div>
			</form>

			<!-- 하단 링크 -->
			<div class="mt-6">
				<div class="relative">
					<div class="absolute inset-0 flex items-center">
						<div class="w-full border-t border-gray-300"></div>
					</div>
					<div class="relative flex justify-center text-sm">
						<span class="px-2 bg-white text-gray-500">또는</span>
					</div>
				</div>

				<div class="mt-6 grid grid-cols-2 gap-3">
					<div>
						<a use:route
							href="/auth/login"
							class="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
						>
							로그인
						</a>
					</div>
					<div>
						<a use:route
							href="/auth/signup"
							class="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
						>
							회원가입
						</a>
					</div>
				</div>
			</div>
		</div>
	</div>
</div> 