import type { Meta, StoryObj } from "@storybook/react";
import { FeatureCard } from "./FeatureCard";
import type { Feature } from "@/entities/place/types";

const mockYoutubeFeature: Feature = {
  id: "1",
  user_id: "user1",
  platform_type: "youtube",
  content_url: "https://youtube.com/watch?v=123",
  title: "[성시경의 먹을텐데] 여수 특집 1탄 - 여기 안가면 손해",
  metadata: {
    thumbnails: {
      medium: {
        url: "https://images.unsplash.com/photo-1534536281715-e28d76689b4d?auto=format&fit=crop&q=80&w=400",
      },
    },
    channelTitle: "성시경 SUNG SI KYUNG",
  },
  created_at: new Date().toISOString(),
};

const mockCommunityFeature: Feature = {
  id: "2",
  user_id: "user1",
  platform_type: "community",
  content_url: "https://damoang.net/123",
  title: "여수 여행가서 진짜 맛있게 먹은 한우 맛집 공유합니다",
  metadata: {
    domain: "damoang.net",
  },
  created_at: new Date().toISOString(),
};

const meta: Meta<typeof FeatureCard> = {
  title: "Shared/FeatureCard",
  component: FeatureCard,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Youtube: Story = {
  args: {
    feature: mockYoutubeFeature,
  },
};

export const Community: Story = {
  args: {
    feature: mockCommunityFeature,
    getPlatformName: (domain) => (domain === "damoang.net" ? "다모앙" : domain),
  },
};
