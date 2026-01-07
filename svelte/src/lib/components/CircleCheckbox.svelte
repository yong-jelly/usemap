<script lang="ts">
	import Icon from "./Icon.svelte";

	let { checked = false } = $props<{
		checked?: boolean;
	}>();
</script>

<div
	class="w-6 h-6 rounded-full border flex items-center justify-center transition-all check-box"
	class:selected={checked}
>
	{#if checked}
		<Icon name="check" class="w-4 h-4 text-white" />
	{/if}
</div>

<style>
	.check-box {
		border-color: #d1d5db;
	}

	.check-box.selected {
		background-color: #6366f1;
		border-color: #6366f1;
	}

	:global(.dark) .check-box {
		border-color: #525252;
	}

	:global(.dark) .check-box.selected {
		background-color: #6366f1;
		border-color: #6366f1;
	}
</style> 