import type { Meta, StoryObj } from "@storybook/react";
import { PlaceActionRow } from "./PlaceActionRow";

const meta: Meta<typeof PlaceActionRow> = {
  title: "Shared/Place/PlaceActionRow",
  component: PlaceActionRow,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
  argTypes: {
    onReviewClick: { action: "clicked" },
  },
};

export default meta;
type Story = StoryObj<typeof PlaceActionRow>;

/**
 * 기본 상태 (콘텐츠 개수 숨김)
 */
export const Default: Story = {
  args: {
    placeId: "12345678",
    reviewsCount: 42,
  },
};

/**
 * 플랫폼별 콘텐츠 개수 표시
 */
export const WithStats: Story = {
  args: {
    ...Default.args,
    youtubeCount: 5,
    placeCount: 12,
    detectiveCount: 3,
    communityCount: 8,
    showStats: true,
  },
};

/**
 * 0개인 경우도 표시 (showStats만 true인 경우)
 */
export const WithZeroCounts: Story = {
  args: {
    ...Default.args,
    showStats: true,
  },
};
