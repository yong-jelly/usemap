export interface UserLocation {
  id: string;
  latitude: number;
  longitude: number;
  nearest_place_id: string;
  nearest_place_name: string;
  nearest_place_address: string;
  distance_meters: number;
  created_at: string;
}

export interface SaveLocationResponse {
  id: string;
  nearest_place_name: string;
  nearest_place_address: string;
  distance_meters: number;
}
