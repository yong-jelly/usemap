<script lang="ts">
	import { TrendingUp, Award, MapPin, Calendar, Users, Crown, Target } from 'lucide-svelte';

	interface StatsData {
		id: string;
		type: 'personal' | 'ranking' | 'achievement';
		title: string;
		period: string;
		stats: {
			visited: number;
			liked: number;
			saved: number;
			rank?: number;
			totalUsers?: number;
			region?: string;
		};
		achievements: {
			icon: string;
			title: string;
			description: string;
			isNew?: boolean;
		}[];
		comparison: {
			previousPeriod: number;
			percentChange: number;
		};
		timestamp: string;
	}

	const { card } = $props<{ card: StatsData }>();

	function getStatIcon(type: string) {
		switch (type) {
			case 'personal': return Target;
			case 'ranking': return Crown;
			case 'achievement': return Award;
			default: return TrendingUp;
		}
	}

	function getStatTitle(type: string) {
		switch (type) {
			case 'personal': return '내 활동 통계';
			case 'ranking': return '순위 현황';
			case 'achievement': return '달성 현황';
			default: return '통계';
		}
	}

	function getRankColor(rank: number) {
		if (rank <= 3) return 'text-amber-600';
		if (rank <= 10) return 'text-blue-600';
		if (rank <= 50) return 'text-green-600';
		return 'text-gray-600';
	}

	function formatNumber(num: number) {
		if (num >= 1000) {
			return `${(num / 1000).toFixed(1)}K`;
		}
		return num.toString();
	}

	const SvelteComponent = $derived(getStatIcon(card.type));
</script>

<article class="bg-white rounded-lg shadow-sm mb-3 overflow-hidden border border-gray-100">
	<!-- 헤더 -->
	<header class="p-4 pb-3">
		<div class="flex items-center justify-between">
			<div class="flex items-center gap-2">
				<div class="flex items-center gap-1 px-2 py-1 bg-purple-50 rounded-full">
					<SvelteComponent class="w-3 h-3 text-purple-600" />
					<span class="text-xs font-medium text-purple-700">{getStatTitle(card.type)}</span>
				</div>
				<div class="px-2 py-1 bg-gray-50 rounded-full">
					<span class="text-xs font-medium text-gray-600">{card.period}</span>
				</div>
			</div>
			<Calendar class="w-4 h-4 text-gray-400" />
		</div>
	</header>

	<div class="p-4 pt-0">
		<!-- 타이틀 -->
		<h3 class="font-semibold text-gray-900 text-lg mb-4">{card.title}</h3>

		{#if card.type === 'personal'}
			<!-- 개인 통계 -->
			<div class="grid grid-cols-3 gap-4 mb-4">
				<div class="text-center p-3 bg-blue-50 rounded-lg">
					<div class="flex items-center justify-center mb-1">
						<MapPin class="w-4 h-4 text-blue-600" />
					</div>
					<p class="text-xl font-bold text-blue-600">{card.stats.visited}</p>
					<p class="text-xs text-blue-700">방문</p>
				</div>
				
				<div class="text-center p-3 bg-red-50 rounded-lg">
					<div class="flex items-center justify-center mb-1">
						<span class="w-4 h-4 text-red-600">❤️</span>
					</div>
					<p class="text-xl font-bold text-red-600">{card.stats.liked}</p>
					<p class="text-xs text-red-700">좋아요</p>
				</div>
				
				<div class="text-center p-3 bg-yellow-50 rounded-lg">
					<div class="flex items-center justify-center mb-1">
						<span class="w-4 h-4 text-yellow-600">⭐</span>
					</div>
					<p class="text-xl font-bold text-yellow-600">{card.stats.saved}</p>
					<p class="text-xs text-yellow-700">저장</p>
				</div>
			</div>

			<!-- 증감률 -->
			<div class="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-100 p-3 mb-4">
				<div class="flex items-center gap-2">
					<TrendingUp class="w-4 h-4 text-green-600" />
					<div>
						<p class="text-sm text-gray-700">
							지난 {card.comparison.previousPeriod}일 대비 
							<span class="font-bold text-green-600">
								{card.comparison.percentChange > 0 ? '+' : ''}{card.comparison.percentChange}%
							</span>
						</p>
						<p class="text-xs text-gray-500">계속 이런 활동을 유지해보세요! 🎉</p>
					</div>
				</div>
			</div>

		{:else if card.type === 'ranking'}
			<!-- 순위 현황 -->
			<div class="mb-4">
				<div class="text-center p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-100 mb-3">
					<div class="flex items-center justify-center mb-2">
						<Crown class="w-6 h-6 text-purple-600" />
					</div>
					<p class="text-2xl font-bold {getRankColor(card.stats.rank || 0)}">{card.stats.rank}위</p>
					<p class="text-sm text-gray-600">{card.stats.region} 지역 중</p>
					<p class="text-xs text-gray-500">전체 {formatNumber(card.stats.totalUsers || 0)}명</p>
				</div>

				<div class="bg-gray-50 rounded-lg p-3">
					<div class="flex items-center gap-2 text-sm text-gray-600">
						<Users class="w-4 h-4" />
						<span>상위 {Math.round(((card.stats.rank || 0) / (card.stats.totalUsers || 1)) * 100)}%에 위치</span>
					</div>
				</div>
			</div>

		{:else if card.type === 'achievement'}
			<!-- 달성 현황 -->
			<div class="space-y-3">
				{#each card.achievements as achievement}
					<div class="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border relative">
						{#if achievement.isNew}
							<div class="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></div>
						{/if}
						<div class="text-2xl">{achievement.icon}</div>
						<div class="flex-1">
							<p class="text-sm font-medium text-gray-900">
								{achievement.title}
								{#if achievement.isNew}
									<span class="text-xs bg-red-500 text-white px-1 py-0.5 rounded ml-1">NEW</span>
								{/if}
							</p>
							<p class="text-xs text-gray-500">{achievement.description}</p>
						</div>
					</div>
				{/each}
			</div>
		{/if}

		<!-- 더보기 버튼 -->
		<div class="mt-4 pt-3 border-t border-gray-100">
			<button class="w-full text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors">
				자세한 통계 보기
			</button>
		</div>
	</div>
</article> 