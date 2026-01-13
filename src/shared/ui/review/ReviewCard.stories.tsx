import type { Meta, StoryObj } from "@storybook/react";
import { ReviewCard } from "./ReviewCard";
import type { PlaceUserReview } from "@/entities/place/types";

const mockReview: PlaceUserReview = {
  id: "1",
  user_id: "user1",
  place_id: "place1",
  review_content: "정말 맛있는 곳이에요! 분위기도 좋고 직원분들도 친절하십니다. 다음에 또 방문하고 싶네요.",
  score: 5,
  media_urls: [],
  images: [
    { id: "img1", image_path: "path1" },
    { id: "img2", image_path: "path2" },
    { id: "img3", image_path: "path3" },
    { id: "img4", image_path: "path4" },
  ],
  gender_code: "M",
  age_group_code: "30s",
  is_private: false,
  is_active: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  is_my_review: false,
  tags: [
    { code: "good_taste", label: "맛 최고", is_positive: true, group: "맛" },
    { code: "good_atmosphere", label: "분위기 최고", is_positive: true, group: "분위기" },
  ],
  user_profile: {
    nickname: "미식가",
    profile_image_url: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=100",
  },
};

const meta: Meta<typeof ReviewCard> = {
  title: "Shared/ReviewCard",
  component: ReviewCard,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    review: mockReview,
    variant: "full",
  },
};

export const Compact: Story = {
  args: {
    review: mockReview,
    variant: "compact",
  },
};

export const MyReview: Story = {
  args: {
    review: { ...mockReview, is_my_review: true },
    isMyReview: true,
    variant: "full",
  },
};

export const Private: Story = {
  args: {
    review: { ...mockReview, is_private: true },
    variant: "full",
  },
};

export const NoImages: Story = {
  args: {
    review: { ...mockReview, images: [] },
    variant: "full",
  },
};
