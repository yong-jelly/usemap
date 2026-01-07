<script lang="ts">
	// props를 통해 ID 파라미터 가져오기
	const props = $props<{ route: { result: { path: { params: { id: string } } } } }>();
	const placeId = props.route?.result?.path?.params?.id || '';
</script>

<div class="flex-1 overflow-auto bg-gray-50 dark:bg-neutral-900">
	<div class="mx-auto max-w-lg pt-2">
		<div class="px-4">
			<h1 class="text-2xl font-bold">SUB - PLACE</h1>
			{#if placeId}
				<div class="mt-4 rounded-lg bg-white p-4 shadow dark:bg-neutral-800">
					<h2 class="mb-2 text-lg font-semibold">장소 ID</h2>
					<p class="font-mono text-blue-600 dark:text-blue-400">{placeId}</p>
				</div>
			{/if}
		</div>
	</div>
</div>
