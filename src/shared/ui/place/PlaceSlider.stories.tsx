import type { Meta, StoryObj } from '@storybook/react';
import { PlaceSlider } from './PlaceSlider';

const meta: Meta<typeof PlaceSlider> = {
  title: 'Shared/Place/PlaceSlider',
  component: PlaceSlider,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof PlaceSlider>;

const mockItems = [
  {
    id: '1',
    name: '강남 맛집 1',
    thumbnail: 'https://search.pstatic.net/common/?src=http%3A%2F%2Fblogfiles.naver.net%2FMjAyNDA0MDJfMTE4%2FMDAxNzExOTkzODc5OTI4.X_v6N2L6u1V1Z0_X9Z_Y7W3Y_W_W_W_W_W_W_W_W.JPEG%2FIMG_0001.JPG&type=f600_400',
    group2: '강남구',
    category: '한식',
    score: 4.8,
    review_count: 230,
  },
  {
    id: '2',
    name: '강남 맛집 2',
    thumbnail: 'https://search.pstatic.net/common/?src=http%3A%2F%2Fblogfiles.naver.net%2FMjAyNDA0MDJfMTE4%2FMDAxNzExOTkzODc5OTI4.X_v6N2L6u1V1Z0_X9Z_Y7W3Y_W_W_W_W_W_W_W_W.JPEG%2FIMG_0001.JPG&type=f600_400',
    group2: '강남구',
    category: '카페',
    score: 4.5,
    review_count: 150,
  },
  {
    id: '3',
    name: '강남 맛집 3',
    group2: '강남구',
    category: '일식',
    score: 4.2,
    review_count: 80,
  },
];

export const Default: Story = {
  args: {
    title: '강남의 맛집',
    countLabel: '428개 매장',
    items: mockItems,
  },
};

export const WithMoreButton: Story = {
  args: {
    title: '전체 목록',
    countLabel: '100개 매장',
    items: [...mockItems, ...mockItems, ...mockItems, ...mockItems].slice(0, 11),
    onMoreClick: () => alert('더보기 클릭'),
  },
};
