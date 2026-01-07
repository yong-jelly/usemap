<script lang="ts">
	import { route } from '@mateothegreat/svelte5-router';
	import Logo from '$lib/components/Logo.svelte';
</script>

<header class="fixed top-0 inset-x-0 z-50 bg-white border-b border-gray-200 dark:bg-neutral-800 dark:border-neutral-700">
	<div class="flex items-center justify-between h-14 px-4">
		<div class="flex items-center">
			<Logo />
		</div>
		<div class="flex items-center gap-4">
			<button
				type="button"
				class="inline-flex items-center justify-center size-8 rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-hidden focus:bg-gray-100 dark:text-neutral-400 dark:hover:text-neutral-300 dark:hover:bg-neutral-700 dark:focus:bg-neutral-700"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="size-6"
					width="24"
					height="24"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				>
					<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
				</svg>
			</button>
			<button
				type="button"
				class="inline-flex items-center justify-center size-8 rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-hidden focus:bg-gray-100 dark:text-neutral-400 dark:hover:text-neutral-300 dark:hover:bg-neutral-700 dark:focus:bg-neutral-700"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="size-6"
					width="24"
					height="24"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				>
					<path d="M12 2a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2 2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z" />
					<path d="M12 8v8" />
					<path d="M5 3.6a1.5 1.5 0 0 1 3 0v2.8a1.5 1.5 0 0 1-3 0V3.6z" />
					<path d="M19 3.6a1.5 1.5 0 0 0-3 0v2.8a1.5 1.5 0 0 0 3 0V3.6z" />
				</svg>
			</button>
		</div>
	</div>
</header> 