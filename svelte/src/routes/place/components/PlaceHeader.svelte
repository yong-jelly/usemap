<script lang="ts">
	// lucide 아이콘 직접 import 불필요 (하위 컴포넌트에서 처리)
	// import { Info, Star, ExternalLink, ... } from 'lucide-svelte'; 
	import type { ComponentType, SvelteComponent } from 'svelte';
	import type { Place } from '$services/types';

	// 하위 컴포넌트 import
	// import HeaderNavigation from './HeaderNavigation.svelte';
	import PlaceRatingSummary from './PlaceRatingSummary.svelte';
	import PlaceWebsiteLink from './PlaceWebsiteLink.svelte';
	import PlaceConveniences from './PlaceConveniences.svelte';
	import ImageGalleryPreview from './ImageGalleryPreview.svelte';
	import PlaceActionButtons from './PlaceActionButtons.svelte';
	import PlaceActionBar from './PlaceActionBar.svelte';
	import PlaceAddressInfo from './PlaceAddressInfo.svelte';
	import ExternalLink from 'lucide-svelte/icons/external-link';

	// --- Props 정의 (주소, ID 추가) ---
	const { place } = $props<{ place: Place }>();

	const defaultPoster = 'https://placehold.co/300x450/dddddd/999999?text=Poster';

	// --- 스크롤 상태 관리 ---
	let isScrolled = $state(false);
	const scrollThreshold = 10; // 스크롤 감지 임계값 약간 줄임

	$effect(() => {
		const handleScroll = () => {
			isScrolled = window.scrollY > scrollThreshold;
		};

		window.addEventListener('scroll', handleScroll, { passive: true });
		// 초기 스크롤 위치 확인
		handleScroll();

		return () => {
			window.removeEventListener('scroll', handleScroll);
		};
	});

</script>
<!-- 메인 컨테이너: 배경 흰색, 스크롤 시 상단 그림자 -->
<div class="relative w-full mx-auto max-w-2xl text-gray-800 bg-white mb-4" style="padding-top: env(safe-area-inset-top);">	
	<!-- 컨텐츠 영역: 좌우 분할 레이아웃 (스크롤 시 상단 패딩 적용) -->
	<div class="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 sm:p-6 {isScrolled ? 'pt-16' : 'pt-4'}">
		<!-- 왼쪽 정보 영역 -->
		<div class="md:col-span-2 space-y-4">
			<!-- 제목 및 부제목 (스크롤 시 숨김) -->
			<div class={isScrolled ? 'opacity-0 h-0 overflow-hidden' : 'opacity-100 transition-opacity'}>
				<div class="flex justify-between items-start">
					<h1 class="text-2xl font-bold text-gray-900 {place.name && place.name.length > 13 ? 'text-xl' : 'text-2xl'}">{place.name}</h1>
					<PlaceWebsiteLink website={place.url} text={place.name && place.name.length > 13 ? " " : "네이버"} bg_color="#e6f7e6" />
				</div>
				<!-- <p class="text-base text-gray-600">{props.commonAddress} · {props.subtitle}</p> -->
				<p class="text-base text-gray-600">{place.commonAddress}</p>
				
			</div>
			<!-- 주소 정보: 컴포넌트 사용 -->
			<!-- <PlaceAddressInfo 
				commonAddress={props.commonAddress}
				roadAddress={props.roadAddress}
				naverPlaceId={props.naverPlaceId}
			/> -->

			<!-- 평점 요약: 컴포넌트 사용 -->
			<div class="mt-4 flex items-center gap-4">
				<div class="flex items-center gap-1">
					<svg class="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
						<path
							fill-rule="evenodd"
							d="M10.868 2.884c.321-.662 1.215-.662 1.536 0l1.681 3.434 3.982.578c.731.106 1.022.996.47 1.517l-2.882 2.78.68 3.965c.124.723-.635 1.282-1.28.944L10 15.343l-3.545 1.864c-.645.338-1.404-.22-1.28-.944l.68-3.965-2.882-2.78c-.552-.52-.26-.1.47-1.517l3.982-.578 1.681-3.434z"
							clip-rule="evenodd"
						/>
					</svg>
					<span class="text-gray-800 font-semibold">{place.visitor_reviews_score.toFixed(1)}</span>
				</div>
				<span class="text-gray-300">|</span>
				<p class="text-sm text-gray-600">
					방문자 리뷰 <span class="font-semibold">{place.visitor_reviews_total}</span>개
				</p>
			</div>

			<!-- 웹사이트 링크: 컴포넌트 사용 -->
			<div class="flex flex-wrap gap-2">
				{#each place.website as site}
					<PlaceWebsiteLink website={site} />
				{/each}
			</div>

			<!-- 편의 시설: 컴포넌트 사용 -->
			<PlaceConveniences conveniences={place.conveniences} />
		</div>

		<!-- 오른쪽 이미지 영역: 컴포넌트 사용 -->
		<div class="md:col-span-1 flex flex-col items-center md:items-end mt-4 md:mt-0">
			<ImageGalleryPreview 
				posterImageUrl={place.posterImageUrl || defaultPoster}
				galleryImageUrls={place.galleryImageUrls}
				onShowGallery={place.onShowGallery}
			/>
		</div>
	</div>

	<!-- 액션 버튼 (좋아요/싫어요): 컴포넌트 사용 -->
	<PlaceActionButtons 
		
	/> 

	<!-- 하단 액션 바: 컴포넌트 사용 -->
	<PlaceActionBar 
		
	/>

</div> 