import type { Meta, StoryObj } from "@storybook/react";
import { LocationGuideBox } from "./LocationGuideBox";

const meta: Meta<typeof LocationGuideBox> = {
  title: "Features/Location/LocationGuideBox",
  component: LocationGuideBox,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
  argTypes: {
    onButtonClick: { action: "clicked" },
  },
};

export default meta;
type Story = StoryObj<typeof LocationGuideBox>;

/**
 * 기본 상태 (버튼 없음)
 * LocationSettingSheet 등에서 안내 문구만 표시할 때 사용합니다.
 */
export const Default: Story = {
  args: {
    title: "위치 정보 수집 안내",
    description: [
      "• 브라우저의 위치 권한 요청이 뜨면 '허용'을 눌러주세요.",
      "• 거리순 정렬은 저장된 위치 정보를 기반으로 계산됩니다."
    ],
    showButton: false,
  },
};

/**
 * 버튼 포함 상태
 * 검색 페이지 등에서 위치 설정을 유도할 때 사용합니다.
 */
export const WithButton: Story = {
  args: {
    title: "위치 설정이 필요해요",
    description: "위치를 설정하면 내 주변 맛집을 찾을 수 있어요.",
    buttonText: "위치 설정하기",
    showButton: true,
  },
};

/**
 * 로딩 상태
 * 버튼 클릭 후 처리 중일 때 사용합니다.
 */
export const Loading: Story = {
  args: {
    ...WithButton.args,
    isLoading: true,
  },
};

/**
 * 커스텀 내용
 * 상황에 맞는 안내 메시지를 표시할 수 있습니다.
 */
export const CustomContent: Story = {
  args: {
    title: "검색 결과가 없나요?",
    description: "위치를 변경하거나 검색 범위를 넓혀보세요.",
    buttonText: "검색 필터 초기화",
    showButton: true,
  },
};
