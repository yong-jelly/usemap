export type UserRole = 'user' | 'admin';

export interface UserProfile {
  auth_user_id: string;
  public_profile_id: string;
  nickname: string;
  role?: UserRole;
  bio?: string;
  profile_image_url?: string;
  gender_code?: 'M' | 'F' | null;
  age_group_code?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Subscriber {
  subscriber_id: string;
  nickname: string;
  profile_image_url?: string;
  folder_names: string[];
  total_folders: number;
  created_at: string;
}

// ============================================
// v2_aggr_review_user_places 반환 타입
// ============================================

export interface ReviewSummary {
  total_reviews: number;
  average_rating: number;
  satisfaction_score: number;
}

export interface RatingDistribution {
  rating: number;
  count: number;
  percentage: number;
}

export interface ReviewTagAnalysis {
  tag_code: string;
  count: number;
  percentage: number;
}

export interface CategoryAnalysis {
  category: string;
  average_rating: number;
  count: number;
}

export interface RecentReview {
  is_private: boolean;
  group1: string;
  group2: string;
  group3: string;
  place_id: string;
  score: number;
  category: string;
  place_name: string;
  created_date: string;
  tags: string[];
  review_content: string;
}

export interface UserReviewAnalysisData {
  review_summary: ReviewSummary;
  rating_distribution: RatingDistribution[];
  tag_analysis: ReviewTagAnalysis[];
  category_analysis: CategoryAnalysis[];
  recent_reviews: RecentReview[];
}

// ============================================
// v1_aggr_combine_user_places 반환 타입
// ============================================

export interface UserPlaceRegionStats {
  all: number;
  liked: number;
  saved: number;
  visited: number;
  agg_group: string;
}

export interface UserPlaceCategorizedStats {
  all: number;
  liked: number;
  saved: number;
  visited: number;
  agg_group: string;
}

export interface UserPlacesStatsData {
  v1_aggr_user_places_region_stats: UserPlaceRegionStats[];
  v1_aggr_user_places_categorized_stats: UserPlaceCategorizedStats[];
  total_features_count: number;
  total_liked_places_visited: number;
  total_saved_places_visited: number;
  total_visited_places_liked: number;
  total_visited_places_saved: number;
  total_featured_place_visited: number;
}

export interface UserPlacesStatsBucket {
  bucket_key: string;
  bucket_name: string;
  bucket_data_jsonb: UserPlacesStatsData;
  bucket_created_at: string;
}
