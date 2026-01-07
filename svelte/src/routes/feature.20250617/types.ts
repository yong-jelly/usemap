import type { Place, YouTubeVideoSnippet } from "$services/types";

export interface PlaceFeatureWithPlace {
    id: string;
    place_id: string;
    platform_type: string;
    content_url: string;
    title: string;
    created_at: string;
    updated_at: string;
    published_at: string;
    is_verified: boolean;
    status: string;
    user_info: {
      user_id: string;
      username: string;
      avatar_url: string;
    };
    feature: YouTubeVideoSnippet;
    place: Place;
  }