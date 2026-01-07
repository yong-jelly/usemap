// types.ts
export interface Coordinate {
  x: number | null;
  y: number | null;
  mapZoomLevel?: number;
}

export interface PlaceMenu {
  name: string;
  price?: string | number;
  recommend?: boolean;
  description?: string;
  images?: string[];
  id?: string;
  index?: number;
}

export interface PlaceBase {
  id: string;
  name: string;
  road?: string;
  category?: string;
  categoryCode?: string;
  categoryCodeList?: string[];
  roadAddress?: string;
  paymentInfo?: string;
  conveniences?: string[];
  address?: string;
  phone?: string;
  visitorReviewsTotal?: number;
  visitorReviewsScore?: number;
  menus?: PlaceMenu[];
  streetPanorama?: any;
  coordinate: Coordinate;
  homepage?: string[];
  keyword_list?: string[];
  images?: string[];
  static_map_url?: string;
  themes?: any;
  visitor_review_medias_total?: number;
  visitor_review_stats?: any;
  place_images?: string[];
  group1?: string;
  group2?: string;
  group3?: string;
}

export interface PlaceDetail {
  base: PlaceBase;
  shopWindow?: any;
  informationTab?: any;
  paiUpperImage?: any;
  staticMapUrl?: string;
  themes?: any;
  visitorReviewMediasTotal?: number;
  visitorReviewStats?: any;
  images?: any;
  error?: string;
  place_id?: string;
}

// 네이버 폴더 관련 타입
export interface Bookmark {
  type: string;
  sid: string;
}

export interface FolderInfo {
  folderId: number;
  name: string;
  memo?: string;
  lastUseTime?: number;
  creationTime?: number;
}

export interface FolderApiResponse {
  folder: FolderInfo;
  bookmarkList: Bookmark[];
}

export interface FolderResult {
  data: FolderApiResponse;
  url: string;
}

// 데이터베이스 upsert용 타입들
export interface BucketData {
  key: string;
  name: string;
  value: string;
  updated_at?: string;
}

export interface PlaceData {
  id: string;
  name: string | null;
  road: string | null;
  category: string | null;
  category_code: string | null;
  category_code_list: string[] | null;
  road_address: string | null;
  payment_info: string[] | null;
  conveniences: string[] | null;
  address: string | null;
  phone: string | null;
  visitor_reviews_total: number;
  visitor_reviews_score: number;
  x: number | null;
  y: number | null;
  homepage: string[] | null;
  keyword_list: string[] | null;
  images: string[] | null;
  static_map_url: string | null;
  themes: any[] | null;
  visitor_review_medias_total: number;
  visitor_review_stats: any | null;
  menus: any | null;
  street_panorama: any | null;
  place_images: string[] | null;
  group1: string | null;
  group2: string | null;
  group3: string | null;
  updated_at?: string;
}

export interface BookmarkData {
  id: number;
  name: string;
  memo: string | null;
  last_use_time: string | null;
  creation_time: string | null;
  place_id: string;
  url: string;
  updated_at?: string;
}
