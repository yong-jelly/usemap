export interface Place {
  id: string;
  name: string;
  normalized_name?: string;
  category: string;
  category_code?: string;
  category_code_list?: string[];
  address: string;
  road_address: string;
  common_address?: string;
  x: number;
  y: number;
  visitor_reviews_total?: number;
  visitor_reviews_score: number;
  blog_cafe_review_count?: number;
  updated_at: string;
  created_at?: string;
  conveniences?: string[];
  payment_info?: string[];
  phone?: string;
  homepage?: string;
  keyword_list?: string[];
  images?: string[];
  image_urls?: string[];
  static_map_url?: string;
  themes?: string[];
  visitor_review_medias_total?: number;
  visitor_review_stats?: any;
  menus?: any[];
  street_panorama?: any;
  place_images?: string[];
  interaction?: {
    place_liked_count: number;
    place_saved_count: number;
    is_liked: boolean;
    is_saved: boolean;
    place_comment_count: number;
    is_commented: boolean;
  };
  features?: Feature[];
  experience?: {
    is_visited: boolean;
  } | null;
  group1?: string;
  group2?: string;
  group3?: string;
  road?: string; // 장소 설명/소개
}

export interface ReviewTag {
  code: string;
  label: string;
  is_positive: boolean;
  group: string;
}

export interface PlaceUserReview {
  id: string;
  user_id: string;
  place_id: string;
  review_content: string;
  score: number;
  media_urls: string[] | null;
  gender_code: 'M' | 'F' | null;
  age_group_code: '10s' | '20s' | '30s' | '40s' | '50s+' | null;
  is_private: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  is_my_review: boolean;
  tags: ReviewTag[];
  user_profile: {
    nickname: string;
    profile_image_url?: string;
    gender_code?: 'M' | 'F' | null;
    age_group_code?: string | null;
  } | null;
}

export interface Feature {
  id: string;
  user_id: string;
  platform_type: 'youtube' | 'community' | 'folder';
  content_url: string;
  title: string;
  metadata: any;
  created_at: string;
}

export interface PlaceDetails {
  place_review_liked_count: number;
  place_review_saved_count: number;
  place_liked_count: number;
  place_saved_count: number;
  is_liked: boolean;
  is_saved: boolean;
  place_comment_count: number;
  is_commented: boolean;
  comments: PlaceComment[];
  place_tag_count: number;
  is_place_tagged: boolean;
  tags: PlaceTag[];
}

export interface PlaceComment {
  id: string;
  user_id: string;
  title?: string;
  content: string;
  image_paths?: string[];
  parent_comment_id?: string;
  comment_level: number;
  created_at: string;
  updated_at: string;
  user_profile: {
    nickname: string;
    profile_image_url?: string;
  };
}

export interface PlaceTag {
  tag_id: string;
  tag_group: string;
  tag_group_ko: string;
  tag_name: string;
  count: number;
}

export interface NaverFolder {
  folder_id: string;
  name: string;
  memo: string;
  place_count: number;
  preview_places: (Partial<Place> & { thumbnail?: string; score?: number; review_count?: number })[];
}

export interface YoutubeChannel {
  channel_id: string;
  channel_title: string;
  channel_thumbnail: string;
  description: string;
  place_count: number;
  preview_places: (Partial<Place> & { thumbnail?: string; score?: number; review_count?: number })[];
}

export interface CommunityContent {
  id: string;
  place_id: string;
  place_name: string;
  category: string;
  thumbnail: string;
  score: number;
  review_count: number;
  group1: string;
  group2: string;
  title: string;
  content_url: string;
  domain: string;
  published_at: string;
}

export interface CommunityRegion {
  region_name: string;
  place_count: number;
  preview_contents: CommunityContent[];
}
