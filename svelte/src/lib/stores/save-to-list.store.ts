import { writable } from 'svelte/store';

interface SaveToListStore {
	isOpen: boolean;
	place?: {
		id: string;
		name: string;
	};
}

function createSaveToListStore() {
	const { subscribe, set, update } = writable<SaveToListStore>({
		isOpen: false
	});

	return {
		subscribe,
		open: (place: { id: string; name: string }) => set({ isOpen: true, place }),
		close: () => set({ isOpen: false, place: undefined }),
		toggle: () => update((state) => ({ ...state, isOpen: !state.isOpen }))
	};
}

export const saveToListStore = createSaveToListStore(); 