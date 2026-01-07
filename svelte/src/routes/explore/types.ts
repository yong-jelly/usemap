import type { icons } from "./icons";

// 카테고리 정의
export interface Category {
    id: keyof typeof icons;  // icons 객체의 키 타입으로 변경
    name: string;
    sort?: string;
}

export interface City {
    id: string;
    name: string;
    group1?: string;
    group2?: string;
    group3?: string;
}
// 장소 상세 정보를 위한 인터페이스
export interface PlaceDetailResponse {
    id: string;
    name: string;
    road?: string;
    menus?: any[];
    phone?: string;
    group1?: string;
    group2?: string;
    group3?: string;
    category?: string[];
    visitor_reviews_score?: number;
    visitor_reviews_total?: number;
    visitor_reviews_count?: number;
    // 기타 필요한 속성들
    [key: string]: any;
}

interface PlaceDetail {
    id: string;
    url: string;
    liked: boolean;
    website: string[];
    category: string;
    convenience: string[];
    description: string | null;
    liked_count: number;
    road_address: string;
    normalized_name: string;
    visitor_review_count: number;
    visitor_review_score: number;
    blog_cafe_review_count: number;
}

interface VoteItem {
    text: string;
    count: number;
    icon_code: string;
}