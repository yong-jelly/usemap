<script lang="ts">
	import Icon from '$lib/components/Icon.svelte';
	import { placePopupStore } from '$lib/stores/place-popup.store.svelte';
	import { saveToListStore } from '$lib/stores/save-to-list.store';
	const { place, isSaved, onSave } = $props<{
		place: { id: string; name: string };
		isSaved: boolean;
		onSave: () => void;
	}>();

	function goBack() {
		if (placePopupStore.isOpen) {
			placePopupStore.hide();
		}
	}

	function onSaveToList() {
		saveToListStore.open(place);
	}

	// $inspect(place);
</script>

<header
	class="fixed top-0 right-0 left-0 z-20 border-b border-gray-200 bg-white/90 backdrop-blur-sm"
>
	<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
		<div class="flex h-16 items-center justify-between">
			<div class="flex min-w-0 items-center">
				<button
					onclick={goBack}
					class="-ml-2 flex-shrink-0 rounded-full p-2 text-gray-600 transition-colors hover:bg-gray-100"
				>
					<Icon name="x" class="h-6 w-6" />
				</button>
				<h1 class="ml-2 truncate text-lg font-bold text-gray-900">{place?.name}</h1>
			</div>
			<!-- <div class="flex flex-shrink-0 items-center space-x-1">
				<button
					onclick={onSaveToList}
					class="rounded-full p-2 text-gray-600 transition-colors hover:bg-gray-100"
				>
					<Icon name="folder-plus" class="h-6 w-6" />
				</button>
			</div> -->
		</div>
	</div>
</header>
