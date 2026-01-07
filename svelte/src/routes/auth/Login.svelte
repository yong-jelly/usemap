<script lang="ts">
	import { preventDefault } from 'svelte/legacy';

	import { onMount } from 'svelte';
	import { goto, route } from '@mateothegreat/svelte5-router';
	import { authService } from '$services/auth.service';
	import { authStore } from '$services/auth.store';
	import Indicator from '$lib/components/Indicator.svelte';

	// 로그인 폼 상태
	let email = $state('');
	let password = $state('');
	let loading = $state(false);
	let error = $state('');
	let showPassword = $state(false);

	// 폼 제출 처리
	async function handleSubmit() {
		error = '';
		loading = true;
		
		try {
			console.log('[Login] 이메일/비밀번호 로그인 시도...');
			// authService.loginWithEmail은 성공 시 { user, session, ... } 객체를 반환
			const loginResult = await authService.loginWithEmail(email, password);
			console.log('[Login] 로그인 성공!', loginResult?.user);
			
			// 리다이렉션 (홈 또는 이전 페이지)
			goto('/profile');
		} catch (err: any) {
			console.error('[Login] 로그인 실패:', err.message);
			error = err.message || '로그인 중 오류가 발생했습니다.';
		} finally {
			loading = false;
		}
	}

	// 소셜 로그인 처리
	async function handleSocialLogin(provider: 'google' | 'github' | 'facebook') {
		error = '';
		loading = true;
		
		try {
			console.log(`[Login] ${provider} 로그인 시도...`);
			await authService.loginWithSocial(provider);
			// 리다이렉션은 OAuth 콜백에서 처리됨
		} catch (err: any) {
			console.error(`[Login] ${provider} 로그인 실패:`, err.message);
			error = err.message || '소셜 로그인 중 오류가 발생했습니다.';
			loading = false;
		}
	}

	// 이미 로그인한 경우 리다이렉트
	$effect(() => {
		// 스토어 값 직접 참조
		if ($authStore.isAuthenticated) {
			console.log('[Login] 이미 로그인됨, 리다이렉트...');
			goto('/profile');
		}
	});
</script>

<div class="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
	<div class="sm:mx-auto sm:w-full sm:max-w-md">
		<h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
			로그인
		</h2>
		<p class="mt-2 text-center text-sm text-gray-600">
			또는
			<a use:route href="/auth/signup" class="font-medium text-indigo-600 hover:text-indigo-500">
				계정 만들기
			</a>
		</p>
	</div>

	<div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
		<div class="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
			<!-- 소셜 로그인 버튼 -->
			<div class="space-y-3">
				<button
					onclick={() => handleSocialLogin('google')}
					type="button"
					class="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
					disabled={loading}
				>
					<svg
						class="h-5 w-5 mr-2"
						viewBox="0 0 24 24"
						width="24"
						height="24"
						xmlns="http://www.w3.org/2000/svg"
					>
						<g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
							<path
								fill="#4285F4"
								d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z"
							/>
							<path
								fill="#34A853"
								d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z"
							/>
							<path
								fill="#FBBC05"
								d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z"
							/>
							<path
								fill="#EA4335"
								d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z"
							/>
						</g>
					</svg>
					Google로 계속하기
				</button>

				<!-- <button
					onclick={() => handleSocialLogin('github')}
					type="button"
					class="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
					disabled={loading}
				>
					<svg
						class="h-5 w-5 mr-2"
						viewBox="0 0 24 24"
						fill="currentColor"
						aria-hidden="true"
					>
						<path
							fill-rule="evenodd"
							d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
							clip-rule="evenodd"
						/>
					</svg>
					GitHub로 계속하기
				</button> -->
			</div>

			<div class="mt-6">
				<div class="relative">
					<div class="absolute inset-0 flex items-center">
						<div class="w-full border-t border-gray-300"></div>
					</div>
					<div class="relative flex justify-center text-sm">
						<span class="px-2 bg-white text-gray-500">이메일로 계속하기</span>
					</div>
				</div>

				<!-- 이메일/비밀번호 로그인 폼 -->
				<form class="mt-6 space-y-6" onsubmit={preventDefault(handleSubmit)}>
					<!-- 에러 메시지 표시 -->
					{#if error}
						<div class="rounded-md bg-red-50 p-4">
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
					{/if}

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
							/>
						</div>
					</div>

					<div>
						<label for="password" class="block text-sm font-medium text-gray-700">
							비밀번호
						</label>
						<div class="mt-1 relative">
							<input
								id="password"
								name="password"
								type={showPassword ? 'text' : 'password'}
								autocomplete="current-password"
								required
								bind:value={password}
								class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
							/>
							<button
								type="button"
								class="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-500"
								onclick={() => (showPassword = !showPassword)}
							>
								{#if showPassword}
									<svg
										class="h-5 w-5"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18"
										/>
									</svg>
								{:else}
									<svg
										class="h-5 w-5"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
										/>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
										/>
									</svg>
								{/if}
							</button>
						</div>
					</div>

					<div class="flex items-center justify-between">
						<div class="flex items-center">
							<input
								id="remember_me"
								name="remember_me"
								type="checkbox"
								class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
							/>
							<label for="remember_me" class="ml-2 block text-sm text-gray-900">
								로그인 상태 유지
							</label>
						</div>

						<div class="text-sm">
							<a use:route href="/auth/reset-password" class="font-medium text-indigo-600 hover:text-indigo-500">
								비밀번호를 잊으셨나요?
							</a>
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
								로그인 중... -->
								<Indicator text="로그인 중..." />
							{:else}
								로그인
							{/if}
						</button>
					</div>
				</form>
			</div>
		</div>
	</div>
</div> 