import type { Place } from "../place/types";

export type FolderPermission = 'public' | 'private' | 'hidden' | 'invite' | 'default';

export type FolderAccessType = 
  | 'ALLOWED' 
  | 'NOT_FOUND' 
  | 'INVITE_CODE_REQUIRED';

export interface Folder {
  id: string;
  owner_id: string;
  title: string;
  description: string;
  permission: FolderPermission;
  permission_write_type: number;
  invite_code?: string;
  invite_code_expires_at?: string;
  subscriber_count: number;
  place_count: number;
  is_hidden: boolean;
  created_at: string;
  updated_at: string;
  owner_nickname?: string;
  owner_avatar_url?: string;
  is_place_in_folder?: boolean;
  preview_places?: (Partial<Place> & { thumbnail?: string; score?: number; review_count?: number })[];
}

export interface FolderPlace {
  place_id: string;
  place_data: Place;
  added_at: string;
  comment?: string;
}

export interface FolderAccess {
  access: FolderAccessType;
  can_view: boolean;
  can_edit?: boolean;
  is_owner?: boolean;
  is_subscribed?: boolean;
  is_unlisted?: boolean;
  is_default?: boolean;
}

export interface InviteHistory {
  id: string;
  invite_code: string;
  invited_user_nickname?: string;
  status: 'pending' | 'accepted' | 'expired';
  created_at: string;
  accepted_at?: string;
  expires_at: string;
}

export interface FolderReview {
  id: string;
  user_id: string;
  user_nickname?: string;
  user_avatar?: string;
  place_id: string;
  review_content: string;
  score: number;
  created_at: string;
  is_my_review: boolean;
}

export interface CreateFolderResult {
  id: string;
  title: string;
  permission: FolderPermission;
  invite_code?: string;
  invite_code_expires_at?: string;
}
