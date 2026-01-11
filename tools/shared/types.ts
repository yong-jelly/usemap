/**
 * 공통 타입 정의
 */

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
    id: string;
    name: string;
    error?: string;
    place_id?: string;
    [key: string]: any;
}

export interface Bookmark {
    type: string;
    sid: string;
    name?: string;
}

export interface FolderInfo {
    folderId: number;
    shareId: string;
    name: string;
    memo?: string;
    lastUseTime?: number;
    creationTime?: number;
    followCount?: number;
    viewCount?: number;
}
