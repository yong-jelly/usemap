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
