import type { Meta, StoryObj } from '@storybook/react';
import { PlaceSliderCard } from './PlaceSliderCard';

const meta: Meta<typeof PlaceSliderCard> = {
  title: 'Shared/Place/PlaceSliderCard',
  component: PlaceSliderCard,
  tags: ['autodocs'],
  argTypes: {
    onClick: { action: 'clicked' },
  },
};

export default meta;
type Story = StoryObj<typeof PlaceSliderCard>;

export const Default: Story = {
  args: {
    placeId: '1',
    name: '맛있는 식당',
    thumbnail: 'https://search.pstatic.net/common/?src=http%3A%2F%2Fblogfiles.naver.net%2FMjAyNDA0MDJfMTE4%2FMDAxNzExOTkzODc5OTI4.X_v6N2L6u1V1Z0_X9Z_Y7W3Y_W_W_W_W_W_W_W_W.JPEG%2FIMG_0001.JPG&type=f600_400',
    group2: '강남구',
    category: '한식',
    score: 4.5,
    reviewCount: 120,
  },
};

export const NoImage: Story = {
  args: {
    placeId: '2',
    name: '이미지 없는 식당',
    group2: '서초구',
    category: '일식',
    score: 4.0,
    reviewCount: 50,
  },
};
