<script lang="ts">
	interface Props {
		type: 'timeout' | 'network' | 'no-results' | 'unknown';
		searchQuery?: string;
		onRetry?: () => void;
		onClearFilters?: () => void;
	}

	let { type, searchQuery, onRetry, onClearFilters }: Props = $props();

	const messages = {
		timeout: {
			icon: 'M12 6v6l4 2',
			title: '조회 시간이 초과되었습니다',
			description: '서버 응답이 지연되고 있습니다. 잠시 후 다시 시도하거나 검색 조건을 좁혀보세요.',
			suggestions: [
				'지역을 시/군/구 단위로 좁혀보세요',
				'카테고리 필터를 적용해보세요',
				'잠시 후 다시 시도해보세요'
			]
		},
		network: {
			icon: 'M1 1l22 22M16.72 11.06A10.94 10.94 0 0 1 19 12.55a11 11 0 0 1-7 4M5 12.55a10.94 10.94 0 0 1 5.17-2.39',
			title: '네트워크 연결을 확인해주세요',
			description: '인터넷 연결에 문제가 있는 것 같습니다.',
			suggestions: [
				'인터넷 연결을 확인해주세요',
				'Wi-Fi 또는 모바일 데이터를 확인해주세요',
				'잠시 후 다시 시도해주세요'
			]
		},
		'no-results': {
			icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10',
			title: '검색된 음식점이 없습니다',
			description: searchQuery ? `'${searchQuery}' 검색 결과가 없습니다.` : '조건에 맞는 음식점을 찾을 수 없습니다.',
			suggestions: [
				// '다른 검색어를 시도해보세요',
				// '필터 조건을 완화해보세요',
				// '지역을 넓혀보세요'
			]
		},
		unknown: {
			icon: 'M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z',
			title: '문제가 발생했습니다',
			description: '알 수 없는 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
			suggestions: [
				// '페이지를 새로고침해보세요',
				// '잠시 후 다시 시도해보세요',
				// '문제가 지속되면 고객센터에 문의해주세요'
			]
		}
	};

	const currentMessage = $derived(messages[type]);
</script>

<div class="mx-4 rounded-lg bg-white p-8 text-center shadow-xs dark:bg-neutral-800">
	<!-- 아이콘 -->
	<div class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full {type === 'timeout' ? 'bg-amber-100 dark:bg-amber-900/30' : type === 'network' ? 'bg-red-100 dark:bg-red-900/30' : 'bg-gray-100 dark:bg-gray-800'}">
		<svg
			class="h-8 w-8 {type === 'timeout' ? 'text-amber-600 dark:text-amber-400' : type === 'network' ? 'text-red-600 dark:text-red-400' : 'text-gray-400 dark:text-gray-500'}"
			fill="none"
			stroke="currentColor"
			viewBox="0 0 24 24"
			xmlns="http://www.w3.org/2000/svg"
		>
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-width="2"
				d={currentMessage.icon}
			/>
		</svg>
	</div>

	<!-- 제목 -->
	<h3 class="mb-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
		{currentMessage.title}
	</h3>

	<!-- 설명 -->
	<p class="mb-6 text-gray-500 dark:text-gray-400">
		{currentMessage.description}
	</p>

	<!-- 제안사항 -->
	<!-- {#if currentMessage.suggestions.length > 0}
		<div class="mb-6 text-left">
			<h4 class="mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">
				해결 방법:
			</h4>
			<ul class="space-y-2">
				{#each currentMessage.suggestions as suggestion}
					<li class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
						<div class="h-1.5 w-1.5 rounded-full bg-gray-400 dark:bg-gray-500"></div>
						{suggestion}
					</li>
				{/each}
			</ul>
		</div>
	{/if} -->

	<!-- 액션 버튼들 -->
	<!-- <div class="flex flex-col gap-2 sm:flex-row sm:justify-center">
		{#if onRetry}
			<button
				class="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-neutral-800"
				onclick={onRetry}
			>
				<svg
					class="h-4 w-4"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
					/>
				</svg>
				다시 시도
			</button>
		{/if}

		{#if onClearFilters && (type === 'timeout' || type === 'no-results')}
			<button
				class="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-gray-600 dark:bg-neutral-700 dark:text-gray-300 dark:hover:bg-neutral-600 dark:focus:ring-offset-neutral-800"
				onclick={onClearFilters}
			>
				<svg
					class="h-4 w-4"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
					/>
				</svg>
				필터 초기화
			</button>
		{/if}
	</div> -->
</div>
