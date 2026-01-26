export interface PlaceRow {
  id: string;
  name: string;
  road: string | null;
  category: string | null;
  category_code: string | null;
  category_code_list: string | null; // JSON string
  road_address: string | null;
  payment_info: string | null; // JSON string
  conveniences: string | null; // JSON string
  address: string | null;
  group1: string | null;
  group2: string | null;
  group3: string | null;
  phone: string | null;
  visitor_reviews_total: number;
  visitor_reviews_score: number;
  x: string | null;
  y: string | null;
  homepage: string | null; // JSON string
  keyword_list: string | null; // JSON string
  images: string | null; // JSON string
  static_map_url: string | null;
  themes: string | null; // JSON string
  visitor_review_medias_total: number;
  visitor_review_stats: string | null; // JSON string
  menus: string | null; // JSON string
  street_panorama: string | null; // JSON string
  place_images: string | null; // JSON string
  updated_at: string;
  created_at: string;
}

export interface PlaceInfoRow {
  business_id: string;
  business_name: string;
  address: string | null;
  convenience: string | null;
  direction: string | null;
  payment_methods: string | null;
  website: string | null;
  description: string | null;
  url: string | null;
  updated_at: string;
  created_at: string;
}

export interface PlaceReviewRow {
  id: string;
  rating: number;
  author_id: string;
  author_nickname: string;
  author_from: string | null;
  author_object_id: string | null;
  author_url: string | null;
  body: string | null;
  media: string | null; // JSON string
  visit_count: number;
  view_count: number;
  visited: string | null;
  created: string | null;
  business_name: string;
  business_id: string;
  updated_at: string;
}

export interface PlaceAnalysisRow {
  business_id: string;
  review_avg_rating: number;
  total_reviews: number;
  themes: string | null; // JSON string
  menus: string | null; // JSON string
  voted: string | null; // JSON string
  voted_sum_count: number;
  voted_user_count: number;
  updated_at: string;
  created_at: string;
}
