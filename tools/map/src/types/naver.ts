export interface PlaceBase {
  id: string;
  name: string;
  road?: string;
  category?: string;
  categoryCode?: string;
  categoryCodeList?: string[];
  roadAddress?: string;
  paymentInfo?: string[];
  conveniences?: string[];
  address?: string;
  phone?: string;
  visitorReviewsTotal?: number;
  visitorReviewsScore?: number;
  coordinate: {
    x: string;
    y: string;
    mapZoomLevel?: number;
  };
  menus?: any[];
  streetPanorama?: {
    id: string;
    pan: number;
    tilt: number;
    lon: number;
    lat: number;
    fov: number;
  };
}

export interface PlaceDetailResponse {
  placeDetail: {
    shopWindow: {
      homepages: {
        etc?: { url: string }[];
        repr?: { url: string };
      };
    };
    informationTab?: {
      keywordList?: string[];
    };
    paiUpperImage?: {
      images?: string[];
    };
    themes?: string[];
    staticMapUrl?: string;
    visitorReviewMediasTotal?: number;
    visitorReviewStats?: any;
    base: PlaceBase;
    images?: {
      images: { origin: string }[];
      totalImages: number;
    };
  };
}

export interface PlacesListItem {
  id: string;
  name: string;
  normalizedName: string;
  category: string;
  categoryCodeList: string[];
  roadAddress: string;
  address: string;
  fullAddress: string;
  commonAddress: string;
  phone: string;
  x: string;
  y: string;
  visitorReviewScore: number;
  blogCafeReviewCount: number;
  bookingReviewCount: number;
}

export interface PlacesListResponse {
  businesses: {
    total: number;
    items: PlacesListItem[];
  };
}
