export interface UserProfile {
  auth_user_id: string;
  public_profile_id: string;
  nickname: string;
  bio?: string;
  profile_image_url?: string;
  gender_code?: 'M' | 'F' | null;
  age_group_code?: string | null;
  created_at: string;
  updated_at: string;
}
