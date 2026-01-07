import type { UserProfile } from '$services/types';

type Investigation = {
	id: string;
	internal_id?: string;
	first_name: string;
	middle_name?: string;
	last_name: string;
	date_of_birth: string;
	namus_id?: string;
	missing_since: string;
	synopsis: string;
	created: string;
};

type User = {
	id: string;
	display_name: string;
	email: string;
	enabled: 'enabled' | 'disabled';
	auth_date: string;
};

export type { Investigation, User };

// export interface PlaceSearchResponse {
// 	meta: {
// 		total: number;
// 	};
// 	result: {
// 		rows: Place[];
// 	};
// }

export interface PlaceSearchRequestDto {
	page: number;
	size: number;
	sort: string;
	keyword?: string;
}

export interface ReviewSearchRequestDto {
	page: number;
	size: number;
	type: string;
}
