<script lang="ts">
	import { Target, Clock, Gift, ChevronRight, Medal, Zap } from 'lucide-svelte';

	interface Challenge {
		id: string;
		title: string;
		description: string;
		type: 'daily' | 'weekly' | 'monthly' | 'special';
		difficulty: 'easy' | 'medium' | 'hard';
		progress: {
			current: number;
			target: number;
			unit: string;
		};
		rewards: {
			exp: number;
			badge?: string;
			special?: string;
		};
		deadline: string;
		status: 'active' | 'completed' | 'expired';
		timestamp: string;
	}

	const { card } = $props<{ card: Challenge }>();

	function getChallengeIcon(type: string) {
		switch (type) {
			case 'daily': return Target;
			case 'weekly': return Medal;
			case 'monthly': return Gift;
			case 'special': return Zap;
			default: return Target;
		}
	}

	function getChallengeLabel(type: string) {
		switch (type) {
			case 'daily': return '일일 도전';
			case 'weekly': return '주간 도전';
			case 'monthly': return '월간 도전';
			case 'special': return '특별 도전';
			default: return '도전';
		}
	}

	function getDifficultyColor(difficulty: string) {
		switch (difficulty) {
			case 'easy': return 'bg-green-50 text-green-700 border-green-200';
			case 'medium': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
			case 'hard': return 'bg-red-50 text-red-700 border-red-200';
			default: return 'bg-gray-50 text-gray-700 border-gray-200';
		}
	}

	function getDifficultyLabel(difficulty: string) {
		switch (difficulty) {
			case 'easy': return '쉬움';
			case 'medium': return '보통';
			case 'hard': return '어려움';
			default: return '보통';
		}
	}

	function getProgressPercentage() {
		return Math.min((card.progress.current / card.progress.target) * 100, 100);
	}

	function getTimeRemaining() {
		const now = new Date();
		const deadline = new Date(card.deadline);
		const diffInHours = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60));
		
		if (diffInHours < 24) {
			return `${diffInHours}시간 남음`;
		}
		const diffInDays = Math.ceil(diffInHours / 24);
		return `${diffInDays}일 남음`;
	}

	function isCompleted() {
		return card.progress.current >= card.progress.target || card.status === 'completed';
	}

	function handleChallengeClick() {
		// 도전 과제 상세 페이지로 이동하는 로직
		console.log('Challenge clicked:', card.id);
	}

	const SvelteComponent = $derived(getChallengeIcon(card.type));
</script>

<article class="bg-white rounded-lg shadow-sm mb-3 overflow-hidden border border-gray-100">
	<!-- 헤더 -->
	<header class="p-4 pb-3">
		<div class="flex items-center justify-between">
			<div class="flex items-center gap-2">
				<div class="flex items-center gap-1 px-2 py-1 bg-indigo-50 rounded-full">
					<SvelteComponent class="w-3 h-3 text-indigo-600" />
					<span class="text-xs font-medium text-indigo-700">{getChallengeLabel(card.type)}</span>
				</div>
				<div class="px-2 py-1 rounded-full border {getDifficultyColor(card.difficulty)}">
					<span class="text-xs font-medium">{getDifficultyLabel(card.difficulty)}</span>
				</div>
			</div>
			<div class="flex items-center gap-1 text-xs text-gray-500">
				<Clock class="w-3 h-3" />
				<span>{getTimeRemaining()}</span>
			</div>
		</div>
	</header>

	<div class="px-4 pb-4">
		<!-- 도전 과제 제목 및 설명 -->
		<div class="mb-4">
			<h3 class="font-semibold text-gray-900 text-lg mb-2 flex items-center gap-2">
				{card.title}
				{#if isCompleted()}
					<span class="text-lg">🎉</span>
				{/if}
			</h3>
			<p class="text-sm text-gray-600 leading-relaxed">{card.description}</p>
		</div>

		<!-- 진행률 -->
		<div class="mb-4">
			<div class="flex items-center justify-between mb-2">
				<span class="text-sm font-medium text-gray-700">진행률</span>
				<span class="text-sm font-bold text-gray-900">
					{card.progress.current}/{card.progress.target} {card.progress.unit}
				</span>
			</div>
			
			<!-- 진행률 바 -->
			<div class="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
				<div 
					class="h-full rounded-full transition-all duration-500 {isCompleted() ? 'bg-gradient-to-r from-green-500 to-emerald-500' : 'bg-gradient-to-r from-blue-500 to-purple-500'}"
					style="width: {getProgressPercentage()}%"
				></div>
			</div>
			
			<div class="flex justify-between items-center mt-1">
				<span class="text-xs text-gray-500">{getProgressPercentage().toFixed(0)}% 완료</span>
				{#if !isCompleted()}
					<span class="text-xs text-gray-500">
						{card.progress.target - card.progress.current} {card.progress.unit} 더 필요
					</span>
				{/if}
			</div>
		</div>

		<!-- 보상 -->
		<div class="bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border border-amber-100 p-3 mb-4">
			<div class="flex items-start gap-2">
				<Gift class="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
				<div class="flex-1">
					<p class="text-xs text-amber-700 font-medium mb-1">보상</p>
					<div class="space-y-1">
						<p class="text-sm text-gray-700">
							<span class="font-medium">+{card.rewards.exp} EXP</span>
						</p>
						{#if card.rewards.badge}
							<p class="text-sm text-gray-700">
								🏆 <span class="font-medium">{card.rewards.badge}</span> 뱃지
							</p>
						{/if}
						{#if card.rewards.special}
							<p class="text-sm text-gray-700">
								✨ <span class="font-medium">{card.rewards.special}</span>
							</p>
						{/if}
					</div>
				</div>
			</div>
		</div>

		<!-- 액션 버튼 -->
		<div class="flex items-center justify-between">
			{#if isCompleted()}
				<div class="flex items-center gap-2 text-green-600">
					<Medal class="w-4 h-4" />
					<span class="text-sm font-medium">완료됨</span>
				</div>
				<button class="px-4 py-2 bg-green-500 text-white text-sm font-medium rounded-lg hover:bg-green-600 transition-colors">
					보상 받기
				</button>
			{:else if card.status === 'active'}
				<div class="flex items-center gap-2 text-blue-600">
					<Target class="w-4 h-4" />
					<span class="text-sm font-medium">진행 중</span>
				</div>
				<button 
					class="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 transition-colors"
					onclick={handleChallengeClick}
				>
					참여하기
					<ChevronRight class="w-4 h-4" />
				</button>
			{:else}
				<div class="flex items-center gap-2 text-gray-500">
					<Clock class="w-4 h-4" />
					<span class="text-sm font-medium">만료됨</span>
				</div>
				<button class="px-4 py-2 bg-gray-300 text-gray-500 text-sm font-medium rounded-lg cursor-not-allowed" disabled>
					기간 만료
				</button>
			{/if}
		</div>
	</div>
</article> 