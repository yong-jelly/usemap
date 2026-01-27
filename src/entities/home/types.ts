import type { Folder } from "../folder/types";
import type { NaverFolder, YoutubeChannel, CommunityRegion } from "../place/types";

export interface HomeUser {
  id: string;
  nickname: string;
  avatar_url?: string;
  folder_count?: number;
  follower_count?: number;
}

export interface PopularPlace {
  id: string;
  name: string;
  category: string;
  thumbnail: string;
  popularity_score: number;
}

export interface HomeDiscoverData {
  users: HomeUser[];
  popularPlaces?: PopularPlace[];
  naverFolders?: NaverFolder[];
  youtubeChannels?: YoutubeChannel[];
  communityRegions: CommunityRegion[];
  publicFolders: Folder[];
}
