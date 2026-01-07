<script lang="ts">
	import { Bell, Settings2, MapPin, TrendingUp } from 'lucide-svelte';

</script>

<header class="sticky top-0 z-50 bg-white">
	<!-- 상단 바 -->
	<div class="flex items-center justify-between px-4 py-3">
		<div class="flex items-center gap-3">
			<h1 class="text-xl font-bold text-gray-900">피드</h1>
			<!-- <div class="flex items-center gap-1 text-xs text-gray-500">
				<MapPin class="w-3 h-3" />
				<span>서울 강남구</span>
				<span>-</span>
			</div> -->
		</div>

		<div class="flex items-center gap-2">
			<!-- 알림 버튼
			<button
				class="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
			>
				<Bell class="w-5 h-5 text-gray-600" />
				{#if true}
					<div class="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></div>
				{/if}
			</button>-->

			<!-- 설정 버튼 -->
			<!-- <button
				class="p-2 hover:bg-gray-100 rounded-lg transition-colors"
			>
				<Settings2 class="w-5 h-5 text-gray-600" />
			</button> -->
		</div>
	</div>

	<!-- 사용자 상태 미니 위젯
	<div class="px-4 pb-3">
		<div class="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-3 border border-blue-100">
			<div class="flex items-center justify-between">
				<div class="flex items-center gap-3">
					<div class="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
						<span class="text-white text-xs font-bold">L1</span>
					</div>
					<div>
						<p class="text-sm font-medium text-gray-900">안녕하세요, 홍길동님!</p>
						<p class="text-xs text-gray-500">100곳 방문 • 100일 연속 활동</p>
					</div>
				</div>
				<div class="text-right">
					<div class="flex items-center gap-1 text-xs text-gray-500 mb-1">
						<TrendingUp class="w-3 h-3" />
						<span>레벨업까지</span>
					</div>
					<div class="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
						<div
							class="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-300"
							style="width: 100%"
						></div>
					</div>
				</div>
			</div>
		</div>
	</div>
	-->

</header>

<style>
	.scrollbar-hide {
		-ms-overflow-style: none;
		scrollbar-width: none;
	}
	.scrollbar-hide::-webkit-scrollbar {
		display: none;
	}
</style>
