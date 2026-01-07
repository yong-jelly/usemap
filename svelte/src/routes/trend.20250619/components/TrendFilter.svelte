<script lang="ts">
	// 지역 필터 데이터
	const regions = [
		{ id: 'all', name: '전체', selected: true },
		{ id: 'jeju', name: '제주', selected: false },
		{ id: 'seoul', name: '서울', selected: false },
		{ id: 'busan', name: '부산', selected: false },
		{ id: 'daegu', name: '대구', selected: false },
		{ id: 'gwangju', name: '광주', selected: false },
	];

	let selectedRegions = $state(regions);

	function toggleRegion(id: string) {
		if (id === 'all') {
			// 전체 선택 시 다른 모든 지역 해제
			selectedRegions = selectedRegions.map(region => ({
				...region,
				selected: region.id === 'all'
			}));
		} else {
			// 개별 지역 선택 시
			selectedRegions = selectedRegions.map(region => {
				if (region.id === id) {
					return { ...region, selected: !region.selected };
				} else if (region.id === 'all') {
					return { ...region, selected: false };
				}
				return region;
			});
		}
	}
</script>

<div class="space-y-4">
	<div>
		<h3 class="text-lg font-bold text-gray-900 mb-3">지역 선택</h3>
		<div class="grid grid-cols-3 gap-2">
			{#each selectedRegions as region}
				<button
					class="px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 border
						{region.selected 
							? 'bg-blue-500 text-white border-blue-500 shadow-md' 
							: 'bg-white text-gray-700 border-gray-200 hover:border-gray-300 hover:bg-gray-50'}"
					onclick={() => toggleRegion(region.id)}
				>
					{region.name}
				</button>
			{/each}
		</div>
	</div>

	<div class="pt-4 border-t border-gray-100">
		<h4 class="text-sm font-semibold text-gray-700 mb-2">선택된 지역</h4>
		<div class="flex flex-wrap gap-2">
			{#each selectedRegions.filter(r => r.selected) as region}
				<span class="px-3 py-1 bg-blue-50 text-blue-700 text-xs rounded-full border border-blue-200">
					{region.name}
				</span>
			{/each}
		</div>
	</div>
</div> 