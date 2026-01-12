import type { Meta, StoryObj } from "@storybook/react";
import { PlaceThumbnail } from "./PlaceThumbnail";

const meta: Meta<typeof PlaceThumbnail> = {
  title: "Shared/Place/PlaceThumbnail",
  component: PlaceThumbnail,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof PlaceThumbnail>;

export const Default: Story = {
  args: {
    placeId: "1",
    name: "맛있는 음식점",
    thumbnail: "https://ldb-phinf.pstatic.net/20230519_123/1684472000000_xxxxx_JPEG/xxxxx.jpg",
    group2: "강남구",
    category: "한식",
  },
};

export const WithFolders: Story = {
  args: {
    ...Default.args,
    features: [
      { platform_type: "folder" },
      { platform_type: "folder" },
      { platform_type: "folder" },
    ],
  },
};

export const Popular: Story = {
  args: {
    ...WithFolders.args,
    features: Array(15).fill({ platform_type: "folder" }),
    interaction: {
      place_liked_count: 120,
      place_reviews_count: 45,
    },
  },
};

export const NoImage: Story = {
  args: {
    placeId: "2",
    name: "이미지 없는 곳",
    group2: "서초구",
    category: "카페",
  },
};

export const Square: Story = {
  args: {
    ...Default.args,
    aspectRatio: "aspect-square",
    rounded: true,
  },
};
