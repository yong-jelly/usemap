<script lang="ts">
	import { convertToNaverResizeImageUrlWithQuality } from '$utils/naver.util';
	// 메뉴 타입 정의 (PlaceMenu)
	export interface Menu {
		name: string;
		price: string;
		images?: string[];
		recommend?: boolean; // 추천 메뉴 여부
	}

	// props 정의
	const {
		menus,
		showAll = false,
		onShowAll,
	} = $props<{
		menus: Menu[];
		showAll?: boolean;
		onShowAll?: () => void;
	}>();

	// 최대 노출 개수
	const MAX = 6;
	// visibleMenus를 일반 변수로 선언
	let visibleMenus: Menu[] = $state([]);
	// showMore도 일반 변수로 선언
	let showMore = $state(false);

	$effect(() => {
		visibleMenus = menus && menus.length > 0 ? (showAll ? menus : menus.slice(0, MAX)) : [];
		showMore = !showAll && menus && menus.length > MAX;
		// $inspect({ menus, showAll, visibleMenus, showMore });
	});

	// 음식 이름 5자 초과시 개행
	function formatName(name: string) {
		return /*name.length > 5 ? name.slice(0, 5) + '\n' + name.slice(5) : */ name;
	}
</script>

<div class="grid grid-cols-3 gap-4">
	{#each visibleMenus as menu}
		<div
			class="relative flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-white p-0"
		>
			<div class="relative h-24 w-full flex-shrink-0 bg-gray-100">
				{#if menu.images}
					{#if menu.images[0]}
						<img
							src={convertToNaverResizeImageUrlWithQuality(menu.images[0])}
							alt={menu.name}
							class="h-full w-full object-cover object-center"
							loading="lazy"
						/>
					{:else}
						<div class="flex h-full w-full items-center justify-center text-gray-400">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="24"
								height="24"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
								class="lucide lucide-cooking-pot-icon lucide-cooking-pot"
							>
								<path d="M2 12h20" />
								<path d="M20 12v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8" />
								<path d="m4 8 16-4" />
								<path
									d="m8.86 6.78-.45-1.81a2 2 0 0 1 1.45-2.43l1.94-.48a2 2 0 0 1 2.43 1.46l.45 1.8"
								/>
							</svg>
						</div>
					{/if}
				{/if}
				{#if menu.recommend}
					<div
						class="absolute top-2 left-2 flex items-center rounded bg-yellow-400 px-2 py-0.5 text-xs font-bold text-white shadow"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="mr-1 h-3 w-3 text-white"
							viewBox="0 0 20 20"
							fill="currentColor"
						>
							<path
								d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.967a1 1 0 00.95.69h4.175c.969 0 1.371 1.24.588 1.81l-3.38 2.455a1 1 0 00-.364 1.118l1.287 3.966c.3.922-.755 1.688-1.54 1.118l-3.38-2.454a1 1 0 00-1.175 0l-3.38 2.454c-.785.57-1.84-.196-1.54-1.118l1.287-3.966a1 1 0 00-.364-1.118L2.05 9.394c-.783-.57-.38-1.81.588-1.81h4.175a1 1 0 00.95-.69l1.286-3.967z"
							/>
						</svg>
						대표
					</div>
				{/if}
			</div>
			<div class="flex flex-1 flex-col items-center justify-center p-2">
				<h3 class="mb-1 text-center text-xs whitespace-pre-line">{formatName(menu.name)}</h3>
				{#if menu.price && menu.price !== ''}
					<p class="text-xs text-gray-900">{menu.price.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}원</p>
				{/if}
			</div>
		</div>
	{/each}
</div>

{#if showMore}
	<button
		class="mt-4 w-full rounded-md border border-gray-800 py-2 text-sm font-medium"
		onclick={onShowAll}
	>
		모든 메뉴 보기 ({menus?.length}개)
	</button>
{/if}
