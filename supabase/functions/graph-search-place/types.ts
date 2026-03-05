export interface SearchRequest {
  query: string;
  /** place_id가 주어지면 네이버 검색 대신 DB에서 직접 조회 */
  place_id?: string;
  start?: number;
  display?: number;
}

export interface NaverRestaurantItem {
  id: string;
  name: string;
  category: string;
  businessCategory: string;
  commonAddress: string;
  address: string;
  __typename: string;
}

export interface SearchResponse {
  code: number;
  count: number;
  queued_count?: number;
  crawl_result?: any;
  rows: NaverRestaurantItem[] | null;
  param: {
    query: string;
    start: number;
    display: number;
  } | null;
}
