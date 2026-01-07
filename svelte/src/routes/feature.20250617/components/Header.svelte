<script lang="ts">
	import { Share, Search } from 'lucide-svelte';
	import Icon from '$lib/components/Icon.svelte';
</script>

<header class="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b border-gray-100">
	<div class="max-w-3xl mx-auto px-4">
		<div class="flex items-center justify-between h-16">
			<h1 class="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
				유튜브
			</h1>
			<!-- <h1 class="text-2xl font-bold text-gray-900 flex items-center gap-2">
				<Icon name="youtube" class="text-red-500 w-7 h-7" />
				<span>추천 영상</span>
			</h1> -->
			<!-- <div class="flex gap-1">
				<button
					class="p-2 rounded-full text-gray-600 hover:bg-gray-100 transition-colors"
					aria-label="Search"
				>
					<Icon name="search" class="w-6 h-6" />
				</button>
			</div> -->
		</div>
	</div>
</header>