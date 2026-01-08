export interface Place {
  id: string;
  name: string;
  normalized_name: string;
  category: string;
  address: string;
  road_address: string;
  common_address: string;
  x: number;
  y: number;
  visitor_review_count: number;
  visitor_review_score: number;
  blog_cafe_review_count: number;
  updated_at: string;
  convenience?: string[];
  direction?: string;
  website?: string;
  description?: string;
  url?: string;
  original_url?: string;
  voted_summary_text?: string;
  voted_summary_code?: string;
  image_urls?: string[];
  images?: string[];
  group1?: string;
  group2?: string;
  group3?: string;
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
