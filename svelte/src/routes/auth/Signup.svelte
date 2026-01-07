<script lang="ts">
	import { preventDefault } from 'svelte/legacy';

	import { onMount } from 'svelte';
	import { goto, route } from '@mateothegreat/svelte5-router';
	import { authService } from '$services/auth.service';
	import { authStore } from '$services/auth.store';
	import Indicator from '$lib/components/Indicator.svelte';

	// 회원가입 폼 상태
	let email = $state('');
	let password = $state('');
	let confirmPassword = $state('');
	let name = $state('');
	let loading = $state(false);
	let error = $state('');
	let success = $state('');
	let showPassword = $state(false);

	// 폼 유효성 검사
	let isPasswordValid = $derived(password.length >= 8);
	let doPasswordsMatch = $derived(password === confirmPassword);
	let isFormValid = $derived(
		email &&
			password &&
			confirmPassword &&
			name &&
			isPasswordValid &&
			doPasswordsMatch
	);

	// 폼 제출 처리
	async function handleSubmit() {
		error = '';
		success = '';
		
		if (!isFormValid) {
			error = '모든 필드를 올바르게 입력해주세요.';
			return;
		}
		
		loading = true;
		
		try {
			console.log('[Signup] 회원가입 시도...');
			
			// 메타데이터 추가
			const metadata = {
				name: name,
				full_name: name
			};
			
			// 회원가입 요청
			const { data, error: signupError } = await authService.signupWithEmail(
				email,
				password,
				metadata
			);
			
			if (signupError) throw signupError;
			
			console.log('[Signup] 회원가입 성공:', data);
			
			// 이메일 확인이 필요한 경우
			if (data?.user && !data.user.email_confirmed_at) {
				success =
					'회원가입이 완료되었습니다. 이메일로 전송된 확인 링크를 통해 계정을 활성화해주세요.';
			} else {
				// 회원가입과 동시에 로그인된 경우
				success = '회원가입이 완료되었습니다.';
				setTimeout(() => goto('/profile'), 2000);
			}
		} catch (err: any) {
			console.error('[Signup] 회원가입 실패:', err.message);
			error = err.message || '회원가입 중 오류가 발생했습니다.';
		} finally {
			loading = false;
		}
	}

	// 이미 로그인한 경우 리다이렉트
	onMount(() => {
		const unsubscribe = authStore.subscribe((userInfo) => {
			if (userInfo.isAuthenticated) {
				console.log('[Signup] 이미 로그인됨, 리다이렉트...');
				goto('/profile');
			}
		});
		
		return unsubscribe;
	});
</script>

<div class="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
	<div class="sm:mx-auto sm:w-full sm:max-w-md">
		<h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
			계정 만들기
		</h2>
		<p class="mt-2 text-center text-sm text-gray-600">
			또는
			<a use:route href="/auth/login" class="font-medium text-indigo-600 hover:text-indigo-500">
				로그인하기
			</a>
		</p>
	</div>

	<div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
		<div class="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
			<!-- 에러 또는 성공 메시지 표시 -->
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

			<!-- 회원가입 폼 -->
			<form class="space-y-6" onsubmit={preventDefault(handleSubmit)}>
				<div>
					<label for="name" class="block text-sm font-medium text-gray-700">
						이름
					</label>
					<div class="mt-1">
						<input
							id="name"
							name="name"
							type="text"
							required
							bind:value={name}
							class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
							placeholder="홍길동"
						/>
					</div>
				</div>

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
					<label for="password" class="block text-sm font-medium text-gray-700">
						비밀번호
					</label>
					<div class="mt-1 relative">
						<input
							id="password"
							name="password"
							type={showPassword ? 'text' : 'password'}
							required
							bind:value={password}
							class="appearance-none block w-full px-3 py-2 border {isPasswordValid || !password ? 'border-gray-300' : 'border-red-300'} rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
							placeholder="8자 이상 입력해주세요"
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
					{#if password && !isPasswordValid}
						<p class="mt-1 text-sm text-red-600">비밀번호는 8자 이상이어야 합니다.</p>
					{/if}
				</div>

				<div>
					<label for="confirm-password" class="block text-sm font-medium text-gray-700">
						비밀번호 확인
					</label>
					<div class="mt-1">
						<input
							id="confirm-password"
							name="confirm-password"
							type={showPassword ? 'text' : 'password'}
							required
							bind:value={confirmPassword}
							class="appearance-none block w-full px-3 py-2 border {doPasswordsMatch || !confirmPassword ? 'border-gray-300' : 'border-red-300'} rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
							placeholder="비밀번호를 다시 입력해주세요"
						/>
					</div>
					{#if confirmPassword && !doPasswordsMatch}
						<p class="mt-1 text-sm text-red-600">비밀번호가 일치하지 않습니다.</p>
					{/if}
				</div>

				<div class="flex items-center justify-between">
					<div class="text-sm">
						<a use:route href="/auth/login" class="font-medium text-indigo-600 hover:text-indigo-500">
							이미 계정이 있으신가요?
						</a>
					</div>
				</div>

				<div>
					<button
						type="submit"
						class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white {isFormValid ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-indigo-400 cursor-not-allowed'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
						disabled={!isFormValid || loading}
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
							회원가입
						{/if}
					</button>
				</div>
			</form>
		</div>
	</div>
</div> 