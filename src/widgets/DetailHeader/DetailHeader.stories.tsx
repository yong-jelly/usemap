import type { Meta, StoryObj } from "@storybook/react";
import { DetailHeader } from "./DetailHeader";
import { BrowserRouter } from "react-router";

const meta: Meta<typeof DetailHeader> = {
  title: "Widgets/DetailHeader",
  component: DetailHeader,
  decorators: [
    (Story) => (
      <BrowserRouter>
        <div className="max-w-md mx-auto border border-surface-200 min-h-[100px] bg-white dark:bg-surface-950">
          <Story />
        </div>
      </BrowserRouter>
    ),
  ],
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof DetailHeader>;

/**
 * 유튜브 피쳐 상세 헤더
 */
export const YoutubeFeature: Story = {
  args: {
    type: "feature",
    subType: "youtube",
    title: "성시경의 먹을텐데",
    subtitle: "유튜브",
    thumbnailUrl: "https://yt3.googleusercontent.com/ytc/AIdro_n_Y5q_qf8Z_mX_q_q_q_q_q_q_q_q_q_q_q_q=s176-c-k-c0x00ffffff-no-rj",
    isSubscribed: false,
    onSubscribe: () => alert("구독 클릭"),
   ㅜ onShare: () => alert("공유 클릭"),
  },
};

/**
 * 유튜브 피쳐 상세 헤더 (구독 중)
 */
export const YoutubeFeatureSubscribed: Story = {
  args: {
    ...YoutubeFeature.args,
    isSubscribed: true,
  },
};

/**
 * 폴더 상세 헤더 (내 폴더)
 */
export const MyFolder: Story = {
  args: {
    type: "folder",
    subType: "folder",
    title: "나만 알고 싶은 서울 뇨끼 맛집",
    subtitle: "젤리비",
    isOwner: true,
    thumbnailUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=jelly",
    onSettings: () => alert("설정 클릭"),
    onShare: () => alert("공유 클릭"),
  },
};

/**
 * 폴더 상세 헤더 (다른 사용자 폴더)
 */
export const OthersFolder: Story = {
  args: {
    type: "folder",
    subType: "folder",
    title: "제주도 서귀포 흑돼지 모음",
    subtitle: "제주도민",
    isOwner: false,
    isSubscribed: false,
    thumbnailUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=jeju",
    onSubscribe: () => alert("구독 클릭"),
    onShare: () => alert("공유 클릭"),
  },
};

/**
 * 아이콘 없는 피쳐 상세 헤더 (예: 폴더 피쳐 등)
 */
export const NoIconFeature: Story = {
  args: {
    type: "feature",
    title: "이번 주 핫플레이스",
    subtitle: "추천 폴더",
    onSubscribe: () => alert("구독 클릭"),
    onShare: () => alert("공유 클릭"),
  },
};
