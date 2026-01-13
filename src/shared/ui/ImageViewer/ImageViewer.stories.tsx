import type { Meta, StoryObj } from "@storybook/react";
import { ImageViewer } from "./ImageViewer";
import { useState } from "react";
import { Button } from "../Button";

const meta: Meta<typeof ImageViewer> = {
  title: "Shared/ImageViewer",
  component: ImageViewer,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

const mockImages = [
  "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=1000",
  "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&q=80&w=1000",
  "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&q=80&w=1000",
  "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&q=80&w=1000",
  "https://images.unsplash.com/photo-1564501049412-61c2a3083791?auto=format&fit=crop&q=80&w=1000",
];

export const Default: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);
    return (
      <div className="p-4">
        <Button onClick={() => setIsOpen(true)}>이미지 갤러리 열기</Button>
        <ImageViewer
          images={mockImages}
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
        />
      </div>
    );
  },
};

export const SingleImage: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);
    return (
      <div className="p-4">
        <Button onClick={() => setIsOpen(true)}>단일 이미지 열기</Button>
        <ImageViewer
          images={[mockImages[0]]}
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
        />
      </div>
    );
  },
};

export const WithInitialIndex: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);
    return (
      <div className="p-4">
        <Button onClick={() => setIsOpen(true)}>3번째 이미지부터 열기</Button>
        <ImageViewer
          images={mockImages}
          initialIndex={2}
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
        />
      </div>
    );
  },
};
