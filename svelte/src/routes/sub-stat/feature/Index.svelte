<script lang="ts">
	import { supabase } from '$services/supabase';
	import type { RecommendationStatsBucket } from '$services/types';
	import { onMount } from 'svelte';
	import NationalStatsCard from './components/NationalStatsCard.svelte';
	import { uiStore } from '$lib/stores/ui.store';

	// feature 페이지 - latest 경로 처리
	const currentUrl = $derived(() => {
		if (typeof window !== 'undefined') {
			return window.location.pathname;
		}
		return '';
	});

	const isLatestPath = $derived(currentUrl().includes('/latest'));
	$effect(() => {
		uiStore.update((state) => {
			return {
				...state,
				isBottomNavVisible: false,
			};
		});
		return () => {
			uiStore.update((state) => {
				return {
					...state,
					isBottomNavVisible: true,
				};
			});
		};
	});
	onMount(async () => {
		const { data, error: rpcError } = await supabase.rpc('v1_aggr_combine_place_features', {
			recreation: false,
		});
		bucket = data[0] as unknown as RecommendationStatsBucket;
		// console.log(bucket);
		// console.log(data.bucket_data_jsonb);
	});
	let bucket = $state<RecommendationStatsBucket>();
</script>

<div class="flex-1 overflow-auto bg-gray-50 dark:bg-neutral-900">
	<NationalStatsCard {bucket} />
</div>
