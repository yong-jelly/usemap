<script lang="ts">
	import { Info, Users, Package, Dog, UtensilsCrossed, Baby, Wifi, CreditCard, ParkingCircle } from 'lucide-svelte';
	import type { ComponentType, SvelteComponent } from 'svelte';

	// Props: 편의시설 목록
	let { conveniences = [] } = $props<{
		conveniences: string[] | undefined;
	}>();

	// 편의시설 아이콘 매핑
	const convenienceIconMap: Record<string, ComponentType<SvelteComponent>> = {
		'단체 이용 가능': Users,
		'포장': Package,
		'반려동물 동반': Dog,
		'남/녀 화장실 구분': UtensilsCrossed, // 예시, 필요시 적절한 아이콘으로 변경
		'유아의자': Baby,
		'간편결제': CreditCard,
		'주차': ParkingCircle,
		'무선 인터넷': Wifi,
		// 필요에 따라 더 추가
	};

	let showAllAmenities = $state(false);

	const amenitiesToShow = $derived(
		showAllAmenities ? conveniences : conveniences.slice(0, 8)
	);
</script>

<div>
	<h2 class="text-xl font-bold text-gray-900 mb-4">편의 시설</h2>
	<div class="grid grid-cols-2 gap-y-3 gap-x-6">
		{#each amenitiesToShow as amenity}
			<div class="flex items-center">
				<svg
					class="h-5 w-5 mr-2.5 text-green-500 flex-shrink-0"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
				>
					<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
				</svg>
				<span class="text-sm text-gray-700">{amenity}</span>
			</div>
		{/each}
	</div>
	{#if conveniences.length > 8 && !showAllAmenities}
		<button
			onclick={() => (showAllAmenities = true)}
			class="mt-6 w-full py-2.5 border border-gray-300 rounded-lg text-sm font-semibold text-gray-800 hover:bg-gray-100 transition-colors duration-200"
		>
			모든 편의시설 보기
		</button>
	{/if}
</div> 