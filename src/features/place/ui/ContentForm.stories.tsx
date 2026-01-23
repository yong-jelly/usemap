import type { Meta, StoryObj } from "@storybook/react";
import { ContentForm } from "./ContentForm";

const meta: Meta<typeof ContentForm> = {
  title: "Features/Place/ContentForm",
  component: ContentForm,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    onSubmit: async (url) => {
      console.log("Submit URL:", url);
      await new Promise(resolve => setTimeout(resolve, 1000));
    },
    onCancel: () => console.log("Cancel"),
  },
  decorators: [
    (Story) => (
      <div className="w-[400px]">
        <Story />
      </div>
    ),
  ],
};

export const Processing: Story = {
  args: {
    initialUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    isProcessing: true,
    onSubmit: async () => {},
    onCancel: () => {},
  },
  decorators: [
    (Story) => (
      <div className="w-[400px]">
        <Story />
      </div>
    ),
  ],
};

export const Error: Story = {
  args: {
    initialUrl: "invalid-url",
    error: "유효한 YouTube URL이 아닙니다.",
    onSubmit: async () => {},
    onCancel: () => {},
  },
  decorators: [
    (Story) => (
      <div className="w-[400px]">
        <Story />
      </div>
    ),
  ],
};

