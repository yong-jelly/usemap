<script lang="ts">
	import type { UserProfile } from '$services/types';
	import { supabase } from '$lib/supabase';

	let {
		profile_image_url = '',
		nickname = '',
		height = 'h-20',
		width = 'w-20',
		mr = 'mr-4',
	} = $props<{
		profile_image_url?: string;
		nickname: string;
		height?: string;
		width?: string;
		mr?: string;
	}>();

	// 이미지 사이즈 추출 (h-20, w-20 형태에서 숫자만 추출)
	const imageSize = 500; //$derived(parseInt(height.replace(/[^\d]/g, '')) || 80);

	// Supabase URL 감지 및 변환
	const imageUrl = $derived(getResizedImageUrl(profile_image_url, imageSize));

	// $inspect(imageUrl);

	// 리사이징된 이미지 URL 생성 함수
	function getResizedImageUrl(url: string, size: number): string {
		if (!url) return '';

		// Supabase Storage URL인지 확인
		if (url.includes('.supabase.co/storage')) {
			try {
				const urlObj = new URL(url);
				// pathParts: ["", "storage", "v1", "object", "public", "public-profile-avatars", "b75408a1-...", ...]
				const pathParts = urlObj.pathname.split('/');

				// public 다음에 버킷명 등장 (예: 'public-profile-avatars')
				const publicIndex = pathParts.indexOf('public');
				if (publicIndex === -1) return url; // public이 없으면 원본 반환

				const bucket = pathParts[publicIndex + 1];
				if (!bucket) return url; // 버킷명이 없으면 원본 반환

				// 버킷명 이후부터 끝까지가 파일 경로
				const filePath = pathParts.slice(publicIndex + 2).join('/');

				// Supabase 변환 파라미터로 썸네일 URL 생성
				const { data } = supabase.storage.from(bucket).getPublicUrl(filePath, {
					transform: {
						width: size,
						height: size,
						resize: 'cover',
					},
				});

				return data.publicUrl;
			} catch (error) {
				console.error('이미지 URL 변환 오류:', error);
				return url;
			}
		}

		// Supabase Storage URL이 아니면 원본 반환
		return url;
	}
</script>

<!-- <div class="relative mr-4"> -->
<div class="relative {mr}">
	<div class={`relative ${height} ${width}`}>
		{#if profile_image_url}
			<img
				src={imageUrl}
				alt="프로필 이미지"
				class="h-full w-full rounded-full border border-gray-200 object-cover dark:border-neutral-800"
			/>
		{:else}
			<div
				class="flex h-full w-full items-center justify-center rounded-full bg-gray-200 text-xl dark:bg-neutral-700"
			>
				{nickname.charAt(0)}
			</div>
		{/if}
	</div>
</div>
