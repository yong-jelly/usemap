<script lang="ts">
	import { onMount } from 'svelte';
	import PlaceCardModern from './components/PlaceCardModern.svelte';
	import { Search, Filter, Share, ChevronDown, TrendingUp, Clock, Star, MapPin } from 'lucide-svelte';
	import type { Place } from '$services/types';

	// 탭 데이터
	const tabs = ['일간', '주간', '월간'];
	let activeTab = $state('일간');

	// 필터 데이터
	const platforms = [
		{ name: '전체', active: true },
		{ name: '제주', active: false },
		{ name: '서울', active: false },
		{ name: '부산', active: false },
		{ name: '대구', active: false }
	];

	// 카테고리 필터
	const categories = ['전체', '한식', '중식', '일식', '양식', '카페', '디저트'];
	let selectedCategory = $state('전체');

	// 더미 음식점 데이터
	const dummyPlaces: Place[] = [
		{
			id: '1', name: '제주 흑돼지 맛집', address: '제주시 연동', images: ['https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400'], x: '0', y: '0', road: null, menus: [], phone: '', group1: '제주', group2: '', group3: '', themes: null, category: '한식', homepage: [], created_at: '', image_urls: [], updated_at: '', conveniences: [], keyword_list: ['분위기좋음','가성비'], payment_info: null, place_images: [], road_address: '', category_code: '', static_map_url: '', street_panorama: null, category_code_list: [], visitor_review_stats: null, visitor_reviews_score: 4.8, visitor_reviews_total: 127, visitor_review_medias_total: 0,
		},
		{
			id: '2', name: '애월 카페거리', address: '제주시 애월읍', images: ['https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=400'], x: '0', y: '0', road: null, menus: [], phone: '', group1: '제주', group2: '', group3: '', themes: null, category: '카페', homepage: [], created_at: '', image_urls: [], updated_at: '', conveniences: [], keyword_list: ['뷰맛집','인스타'], payment_info: null, place_images: [], road_address: '', category_code: '', static_map_url: '', street_panorama: null, category_code_list: [], visitor_review_stats: null, visitor_reviews_score: 4.6, visitor_reviews_total: 89, visitor_review_medias_total: 0,
		},
		{
			id: '3', name: '성산일출봉 맛집', address: '서귀포시 성산읍', images: ['https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400'], x: '0', y: '0', road: null, menus: [], phone: '', group1: '제주', group2: '', group3: '', themes: null, category: '한식', homepage: [], created_at: '', image_urls: [], updated_at: '', conveniences: [], keyword_list: ['가족모임','전망좋음'], payment_info: null, place_images: [], road_address: '', category_code: '', static_map_url: '', street_panorama: null, category_code_list: [], visitor_review_stats: null, visitor_reviews_score: 4.7, visitor_reviews_total: 156, visitor_review_medias_total: 0,
		},
		{
			id: '4', name: '중문 리조트 레스토랑', address: '서귀포시 중문', images: ['https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400'], x: '0', y: '0', road: null, menus: [], phone: '', group1: '제주', group2: '', group3: '', themes: null, category: '양식', homepage: [], created_at: '', image_urls: [], updated_at: '', conveniences: [], keyword_list: ['럭셔리','데이트'], payment_info: null, place_images: [], road_address: '', category_code: '', static_map_url: '', street_panorama: null, category_code_list: [], visitor_review_stats: null, visitor_reviews_score: 4.9, visitor_reviews_total: 203, visitor_review_medias_total: 0,
		}
	];

	// 섹션 데이터
	const sections = [
		{ 
			id: 'trending', 
			title: '지금 뜨는 맛집', 
			subtitle: '실시간 인기 급상승',
			icon: TrendingUp,
			places: dummyPlaces 
		},
		{ 
			id: 'time', 
			title: '점심시간 인기', 
			subtitle: '지금 시간대 추천',
			icon: Clock,
			places: dummyPlaces.slice(0, 3) 
		},
		{ 
			id: 'review', 
			title: '리뷰 맛집', 
			subtitle: '평점 4.5 이상',
			icon: Star,
			places: dummyPlaces.slice(1, 4) 
		},
		{ 
			id: 'location', 
			title: '내 주변 맛집', 
			subtitle: '가까운 곳부터',
			icon: MapPin,
			places: dummyPlaces.slice(0, 2) 
		}
	];

	let selectedSection: string | null = null;

	function openSection(id: string) {
		selectedSection = id;
	}
	function closeSection() {
		selectedSection = null;
	}

	onMount(() => {
		setTimeout(() => {
			window.scrollTo({
				top: 0,
				behavior: 'auto',
			});
		}, 100);
	});
</script>

<!-- 상단 헤더 -->
<header class="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
	<div class="px-4 py-3">
		<div class="flex items-center justify-between mb-3">
			<h1 class="text-xl font-bold text-gray-900 flex items-center gap-2">
				트렌드
			</h1>
			<div class="flex gap-2">
				<button class="p-2 hover:bg-gray-100 rounded-lg transition-colors">
					<Share class="w-5 h-5 text-gray-600" />
				</button>
				<button class="p-2 hover:bg-gray-100 rounded-lg transition-colors">
					<Search class="w-5 h-5 text-gray-600" />
				</button>
			</div>
		</div>
		
		<!-- 탭 네비게이션 -->
		<div class="flex border-b border-gray-200 mb-3">
			{#each tabs as tab}
				<button 
					class="px-4 py-2 text-sm font-medium transition-colors relative
						{activeTab === tab ? 'text-gray-900' : 'text-gray-500 hover:text-gray-700'}"
					onclick={() => activeTab = tab}
				>
					{tab}
					{#if activeTab === tab}
						<div class="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900"></div>
					{/if}
				</button>
			{/each}
		</div>
		
		<!-- 플랫폼/지역 필터 -->
		<div class="flex gap-2 overflow-x-auto pb-2">
			{#each platforms as platform}
				<button class="px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors
					{platform.active ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}">
					{platform.name}
				</button>
			{/each}
			<button class="p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors ml-2">
				<ChevronDown class="w-4 h-4 text-gray-600" />
			</button>
		</div>
	</div>
</header>

<!-- 메인 콘텐츠 -->
<main class="bg-gray-50 min-h-screen">
	<!-- 카테고리 필터 -->
	<div class="px-4 py-3 bg-white border-b border-gray-100">
		<div class="flex gap-2 overflow-x-auto">
			{#each categories as category}
				<button 
					class="px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors
						{selectedCategory === category ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}"
					onclick={() => selectedCategory = category}
				>
					{category}
				</button>
			{/each}
		</div>
	</div>

	<!-- 섹션별 리스트 -->
	<div class="space-y-6 pb-20">
		{#each sections as section}
			<section class="bg-white">
				<div class="px-4 py-4 border-b border-gray-100">
					<div class="flex items-center justify-between">
						<div class="flex items-center gap-3">
							<div class="w-10 h-10 bg-gradient-to-r from-blue-400 to-purple-400 rounded-lg flex items-center justify-center">
								<section.icon class="w-5 h-5 text-white" />
							</div>
							<div>
								<h2 class="text-lg font-bold text-gray-900">{section.title}</h2>
								<p class="text-sm text-gray-500">{section.subtitle}</p>
							</div>
						</div>
						<button 
							class="text-sm text-blue-600 hover:text-blue-700 font-medium"
							onclick={() => openSection(section.id)}
						>
							전체보기
						</button>
					</div>
				</div>
				
				<div class="px-4 py-4">
					<div class="flex gap-4 overflow-x-auto pb-2">
						{#each section.places as place, index (place.id)}
							<div class="flex-shrink-0 w-48">
								<div class="relative group cursor-pointer">
									<img
										src={place.images?.[0] || 'https://placehold.co/400x400?text=NO+IMAGE'}
										alt={place.name}
										class="w-full h-32 object-cover rounded-lg bg-gray-100 group-hover:scale-105 transition-transform"
										loading="lazy"
									/>
									<div class="absolute top-2 left-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full">
										<span class="text-xs font-bold text-gray-900">#{index + 1}</span>
									</div>
									<div class="absolute top-2 right-2 bg-black/50 backdrop-blur-sm px-2 py-1 rounded-full">
										<div class="flex items-center gap-1">
											<Star class="w-3 h-3 text-yellow-400 fill-yellow-400" />
											<span class="text-xs font-medium text-white">{place.visitor_reviews_score.toFixed(1)}</span>
										</div>
									</div>
								</div>
								<div class="mt-2">
									<h3 class="font-semibold text-gray-900 text-sm truncate">{place.name}</h3>
									<p class="text-xs text-gray-500 truncate">{place.address}</p>
									<div class="flex items-center gap-1 mt-1">
										<span class="text-xs text-gray-400">리뷰 {place.visitor_reviews_total}</span>
										<span class="text-xs text-gray-300">•</span>
										<span class="text-xs text-gray-400">{place.category}</span>
									</div>
									<div class="flex gap-1 mt-1">
										{#each place.keyword_list.slice(0, 2) as tag}
											<span class="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] rounded-full">#{tag}</span>
										{/each}
									</div>
								</div>
							</div>
						{/each}
					</div>
				</div>
			</section>
		{/each}
	</div>
</main>

<!-- 전체보기 모달 -->
{#if selectedSection}
	<div class="fixed inset-0 z-[100] bg-white">
		<header class="sticky top-0 bg-white border-b border-gray-200 px-4 py-3">
			<div class="flex items-center justify-between">
				<div>
					<h2 class="text-lg font-bold text-gray-900">
						{sections.find(s => s.id === selectedSection)?.title}
					</h2>
					<p class="text-sm text-gray-500">
						{sections.find(s => s.id === selectedSection)?.subtitle}
					</p>
				</div>
				<button 
					class="p-2 hover:bg-gray-100 rounded-lg transition-colors"
					onclick={closeSection}
				>
					<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
					</svg>
				</button>
			</div>
		</header>
		
		<div class="p-4">
			<div class="grid grid-cols-2 gap-4">
				{#each sections.find(s => s.id === selectedSection)?.places || [] as place, index}
					<div class="bg-white rounded-lg border border-gray-200 overflow-hidden">
						<div class="relative">
							<img
								src={place.images?.[0] || 'https://placehold.co/400x400?text=NO+IMAGE'}
								alt={place.name}
								class="w-full h-32 object-cover"
								loading="lazy"
							/>
							<div class="absolute top-2 left-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full">
								<span class="text-xs font-bold text-gray-900">#{index + 1}</span>
							</div>
							<div class="absolute top-2 right-2 bg-black/50 backdrop-blur-sm px-2 py-1 rounded-full">
								<div class="flex items-center gap-1">
									<Star class="w-3 h-3 text-yellow-400 fill-yellow-400" />
									<span class="text-xs font-medium text-white">{place.visitor_reviews_score.toFixed(1)}</span>
								</div>
							</div>
						</div>
						<div class="p-3">
							<h3 class="font-semibold text-gray-900 text-sm">{place.name}</h3>
							<p class="text-xs text-gray-500 mt-1">{place.address}</p>
							<div class="flex items-center gap-1 mt-2">
								<span class="text-xs text-gray-400">리뷰 {place.visitor_reviews_total}</span>
								<span class="text-xs text-gray-300">•</span>
								<span class="text-xs text-gray-400">{place.category}</span>
							</div>
							<div class="flex gap-1 mt-2">
								{#each place.keyword_list.slice(0, 2) as tag}
									<span class="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] rounded-full">#{tag}</span>
								{/each}
							</div>
						</div>
					</div>
				{/each}
			</div>
		</div>
	</div>
{/if}