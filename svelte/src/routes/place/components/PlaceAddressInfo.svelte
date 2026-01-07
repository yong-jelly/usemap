<script lang="ts">
	import { MapPin, Copy, ExternalLink, Check } from 'lucide-svelte';
	import { NaverStaticMapUrlParserAndBuilder } from '$utils/NaverStaticMapUrlParserAndBuilder';

	// Props: 주소 정보 및 네이버 플레이스 ID
	const { roadAddress, staticMapUrl } = $props<{
		roadAddress: string | null;
		staticMapUrl: string | null;
	}>();

	let finalMapUrl = $derived.by(() => {
		if (!staticMapUrl) return null;
		const mapBuilder = new NaverStaticMapUrlParserAndBuilder(staticMapUrl);
		return mapBuilder.build();
	});

	function handleFindRoute() {
		// TODO: Implement cross-platform route finding functionality
		alert('길찾기 기능 구현 필요');
	}
</script>

<div>
	<h2 class="text-xl font-bold text-gray-900 mb-4">위치</h2>
	<div class="rounded-lg overflow-hidden border border-gray-200">
		{#if finalMapUrl}
			<a href={`https://map.naver.com/p/search/${roadAddress}`} target="_blank" rel="noopener noreferrer">
				<img
					src={finalMapUrl}
					alt="지도 이미지"
					class="w-full h-56 object-cover transition-transform duration-300 hover:scale-105"
				/>
			</a>
		{/if}
		<div class="p-4 bg-white">
			<div class="flex items-start">
				<svg
					class="h-5 w-5 text-pink-500 mt-0.5 mr-3 flex-shrink-0"
					viewBox="0 0 20 20"
					fill="currentColor"
				>
					<path
						fill-rule="evenodd"
						d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
						clip-rule="evenodd"
					/>
				</svg>
				<p class="text-gray-800 leading-snug">{roadAddress || '주소 정보가 없습니다'}</p>
			</div>
			<button
				class="mt-4 w-full py-2.5 border border-gray-300 rounded-lg text-sm font-semibold text-gray-800 hover:bg-gray-100 transition-colors duration-200"
				onclick={handleFindRoute}
			>
				길찾기
			</button>
		</div>
	</div>
</div> 