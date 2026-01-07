export interface HotelInfo {
	id: string;
	type: 'Hotel' | 'Apartment';
	name: string;
	price: number;
	rating: string;
	position: { lat: number; lng: number };
	imageUrl?: string;
	guests: number;
	nights: number;
}
