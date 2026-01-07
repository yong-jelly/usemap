class PlacePopupStore {
	isOpen = $state(false);
	placeId = $state<string | null>(null);

	show = (placeId: string) => {
		this.placeId = placeId;
		this.isOpen = true;
	};

	hide = () => {
		this.isOpen = false;
		this.placeId = null;
	};
}

export const placePopupStore = new PlacePopupStore();
