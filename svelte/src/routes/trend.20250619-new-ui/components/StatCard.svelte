<script lang="ts">
	import { BarChart2 } from 'lucide-svelte';

	type StatData = {
		user: number;
		total: number;
	};

	let {
		title,
		category,
		userStat,
		totalStat,
		format = 'percentage'
	}: {
		title: string;
		category: string;
		userStat: StatData;
		totalStat: StatData;
		format?: 'percentage' | 'count';
	} = $props();

	let isExpanded = $state(false);

	const userPercentage = $derived((userStat.user / userStat.total) * 100);
	const totalPercentage = $derived((totalStat.user / totalStat.total) * 100);

	function formatValue(value: number, type: 'user' | 'total') {
		if (format === 'percentage') {
			return `${value.toFixed(1)}%`;
		}
		const rawValue = type === 'user' ? userStat.user : totalStat.user;
		return `${rawValue.toLocaleString()}회`;
	}
</script>

<div class="bg-white rounded-lg border border-gray-200 p-4 transition-all hover:border-indigo-300">
	<button
		type="button"
		class="w-full text-left"
		onclick={() => (isExpanded = !isExpanded)}
		aria-expanded={isExpanded}
	>
		<div class="flex items-center justify-between">
			<div class="flex items-center gap-3">
				<div class="p-2 bg-gray-100 rounded-lg">
					<BarChart2 class="w-5 h-5 text-gray-600" />
				</div>
				<div>
					<h4 class="font-semibold text-gray-800">{title}</h4>
					<p class="text-sm text-gray-500">{category}</p>
				</div>
			</div>
			<div class="flex items-center gap-2">
				<span class="text-indigo-600 font-bold text-lg">{formatValue(userPercentage, 'user')}</span>
				<svg
					class="w-5 h-5 text-gray-400 transition-transform duration-200"
					class:rotate-180={isExpanded}
					xmlns="http://www.w3.org/2000/svg"
					width="24"
					height="24"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				>
					<path d="m6 9 6 6 6-6" />
				</svg>
			</div>
		</div>
	</button>

	{#if isExpanded}
		<div class="mt-4 pt-4 border-t border-gray-100 space-y-3">
			<div class="text-sm">
				<div class="flex justify-between items-center mb-1">
					<p>나의 활동</p>
					<p class="font-medium text-gray-700">
						{userStat.user.toLocaleString()} / {userStat.total.toLocaleString()}
					</p>
				</div>
				<div class="w-full bg-gray-200 rounded-full h-1.5">
					<div class="bg-indigo-500 h-1.5 rounded-full" style="width: {userPercentage}%"></div>
				</div>
			</div>
			<div class="text-sm">
				<div class="flex justify-between items-center mb-1">
					<p>전체 평균</p>
					<p class="font-medium text-gray-700">
						{totalStat.user.toLocaleString()} / {totalStat.total.toLocaleString()}
					</p>
				</div>
				<div class="w-full bg-gray-200 rounded-full h-1.5">
					<div class="bg-gray-400 h-1.5 rounded-full" style="width: {totalPercentage}%"></div>
				</div>
			</div>
			<p class="text-xs text-gray-500 text-center pt-2">
				'{category}' 카테고리에서 당신은 상위
				{Math.max(1, 100 - (userPercentage / totalPercentage) * 50).toFixed(0)}% 이내의 활동을 보이고 있어요!
			</p>
		</div>
	{/if}
</div> 