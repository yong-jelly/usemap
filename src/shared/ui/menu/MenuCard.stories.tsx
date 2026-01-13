import type { Meta, StoryObj } from "@storybook/react";
import { MenuCard } from "./MenuCard";

const mockMenu = {
  name: "한우 등심 스테이크",
  price: 45000,
  image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=200",
  recommend: true,
};

const meta: Meta<typeof MenuCard> = {
  title: "Shared/MenuCard",
  component: MenuCard,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Grid: Story = {
  args: {
    menu: mockMenu,
    variant: "grid",
  },
};

export const Compact: Story = {
  args: {
    menu: mockMenu,
    variant: "compact",
  },
};

export const NoImage: Story = {
  args: {
    menu: { ...mockMenu, image: null },
    variant: "grid",
  },
};

export const LongName: Story = {
  args: {
    menu: { ...mockMenu, name: "제주산 흑돼지 오겹살과 멜젓 그리고 각종 쌈채소 세트" },
    variant: "grid",
  },
};
