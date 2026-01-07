<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '@mateothegreat/svelte5-router';
	import { authService } from '$services/auth.service';

	let isLoading = $state(false);
	let error = $state('');

	async function handleGoogleLogin() {
		try {
			isLoading = true;
			error = '';
			console.log('[로그인 화면] 구글 로그인 시도...');
			
			await authService.loginWithSocial('google');
		} catch (err: any) {
			console.error('[로그인 화면] 구글 로그인 오류:', err);
			error = '로그인 중 오류가 발생했습니다. 다시 시도해주세요.';
		} finally {
			isLoading = false;
		}
	}
</script>

<div class="min-h-screen bg-white flex flex-col justify-center px-4">
	<div class="w-full max-w-sm mx-auto">
		<!-- 로고/아이콘 영역 -->
		<div class="text-center mb-8">
			<div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
				<svg class="w-8 h-8 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
				</svg>
			</div>
			<h2 class="text-xl font-bold text-gray-900 mb-2">환영합니다!</h2>
			<p class="text-gray-600 text-sm leading-relaxed">
				나만의 특별한 장소를 기록하고<br />
				다른 사람들과 공유해보세요
			</p>
		</div>

		<!-- 오류 메시지 -->
		{#if error}
			<div class="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
				<p class="text-sm text-red-600">{error}</p>
			</div>
		{/if}

		<!-- 구글 로그인 버튼 -->
		<button
			onclick={handleGoogleLogin}
			disabled={isLoading}
			class="w-full flex items-center justify-center gap-3 px-4 py-3.5 bg-white border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mb-6"
		>
			{#if isLoading}
				<div class="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
				<span>로그인 중...</span>
			{:else}
				<svg class="w-5 h-5" viewBox="0 0 24 24">
					<path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
					<path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
					<path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
					<path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
				</svg>
				<span>Google로 시작하기</span>
			{/if}
		</button>

		<!-- 안내 텍스트 -->
		<p class="text-xs text-gray-500 text-center leading-relaxed mb-8">
			로그인하면 서비스 이용약관 및 개인정보 처리방침에<br />
			동의하는 것으로 간주됩니다.
		</p>

		<!-- 간단한 기능 소개 -->
		<div class="space-y-3">
			<div class="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
				<div class="w-6 h-6 bg-white rounded-full flex items-center justify-center flex-shrink-0">
					<svg class="w-3 h-3 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
					</svg>
				</div>
				<div>
					<h4 class="font-medium text-gray-900 text-sm">장소 탐색</h4>
					<p class="text-xs text-gray-600">특별한 장소들을 발견해보세요</p>
				</div>
			</div>
			<div class="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
				<div class="w-6 h-6 bg-white rounded-full flex items-center justify-center flex-shrink-0">
					<svg class="w-3 h-3 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
					</svg>
				</div>
				<div>
					<h4 class="font-medium text-gray-900 text-sm">개인 컬렉션</h4>
					<p class="text-xs text-gray-600">나만의 리스트로 관리하세요</p>
				</div>
			</div>
			<div class="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
				<div class="w-6 h-6 bg-white rounded-full flex items-center justify-center flex-shrink-0">
					<svg class="w-3 h-3 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
					</svg>
				</div>
				<div>
					<h4 class="font-medium text-gray-900 text-sm">리뷰 공유</h4>
					<p class="text-xs text-gray-600">경험을 공유하고 들어보세요</p>
				</div>
			</div>
		</div>
	</div>
</div> 