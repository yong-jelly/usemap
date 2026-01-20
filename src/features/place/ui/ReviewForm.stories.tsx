import type { Meta, StoryObj } from "@storybook/react";
import { ReviewForm } from "./ReviewForm";
import type { ReviewTag } from "@/entities/place/types";

const mockTags: ReviewTag[] = [
  { code: 'local', label: '지역 주민 추천', is_positive: true, group: '추천' },
  { code: 'frequent', label: '자주 방문', is_positive: true, group: '추천' },
  { code: 'good_taste', label: '맛 최고', is_positive: true, group: '맛' },
  { code: 'good_atmosphere', label: '분위기 최고', is_positive: true, group: '분위기' },
];

const meta: Meta<typeof ReviewForm> = {
  title: "Features/Place/ReviewForm",
  component: ReviewForm,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Create: Story = {
  args: {
    availableTags: mockTags,
    onSubmit: async (data) => {
      console.log("Submit Create:", data);
      await new Promise(resolve => setTimeout(resolve, 1000));
    },
    onCancel: () => console.log("Cancel"),
  },
};

export const Edit: Story = {
  args: {
    initialRating: 4,
    initialComment: "정말 맛있게 먹고 왔습니다. 다시 가고 싶네요!",
    initialTagCodes: ["good_taste", "local"],
    initialDate: "2024-01-20",
    availableTags: mockTags,
    initialImages: [
      { id: "1", image_path: "path1" },
      { id: "2", image_path: "path2" },
    ],
    onSubmit: async (data) => {
      console.log("Submit Edit:", data);
      await new Promise(resolve => setTimeout(resolve, 1000));
    },
    onCancel: () => console.log("Cancel"),
  },
};

export const Uploading: Story = {
  args: {
    availableTags: mockTags,
    isUploading: true,
    onSubmit: async () => {},
    onCancel: () => {},
  },
};
