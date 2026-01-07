export interface PlaceExperienceOption {
  type: 'visited' | 'like' | 'dislike' | 'bookmark';
  label: string;
  icon: string;
  selected?: boolean;
  enabled?: boolean; // 활성화 여부
} 