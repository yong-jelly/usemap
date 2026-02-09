import type { Meta, StoryObj } from "@storybook/react";
import { DetectiveListHeader } from "./DetectiveListHeader";
import { BrowserRouter } from "react-router";

const meta: Meta<typeof DetectiveListHeader> = {
  title: "Features/Folder/DetectiveListHeader",
  component: DetectiveListHeader,
  decorators: [
    (Story) => (
      <BrowserRouter>
        <div className="p-4 bg-white dark:bg-surface-950 min-h-[200px]">
          <Story />
        </div>
      </BrowserRouter>
    ),
  ],
  tags: ["autodocs"],
  argTypes: {
    title: { control: "text" },
    description: { control: "text" },
    showCreateButton: { control: "boolean" },
    showManageButton: { control: "boolean" },
  },
};

export default meta;
type Story = StoryObj<typeof DetectiveListHeader>;

/**
 * 기본 상태 (버튼 숨김)
 */
export const Default: Story = {
  args: {
    showCreateButton: false,
    showManageButton: false,
  },
};

/**
 * 모든 버튼 표시
 */
export const WithButtons: Story = {
  args: {
    showCreateButton: true,
    showManageButton: true,
  },
};

/**
 * 생성 버튼만 표시
 */
export const OnlyCreate: Story = {
  args: {
    showCreateButton: true,
    showManageButton: false,
  },
};

/**
 * 관리 버튼만 표시
 */
export const OnlyManage: Story = {
  args: {
    showCreateButton: false,
    showManageButton: true,
  },
};

/**
 * 커스텀 텍스트
 */
export const CustomText: Story = {
  args: {
    title: "나만의 맛집 리스트",
    description: "내가 저장한 소중한 장소들을 확인해보세요.",
    showCreateButton: true,
  },
};
