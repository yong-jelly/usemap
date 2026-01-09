import type { Meta, StoryObj } from '@storybook/react';
import { FolderList } from './FolderList';
import type { Folder } from '@/entities/folder/types';

const mockFolders: Folder[] = [
  {
    id: '1',
    owner_id: 'user1',
    title: '나의 첫 번째 맛집 폴더',
    description: '서울의 맛집들',
    permission: 'public',
    permission_write_type: 0,
    subscriber_count: 10,
    place_count: 5,
    is_hidden: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '2',
    owner_id: 'user1',
    title: '함께 만드는 맛집 폴더',
    description: '친구들과 공유하는 맛집',
    permission: 'invite',
    permission_write_type: 1,
    subscriber_count: 3,
    place_count: 12,
    is_hidden: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '3',
    owner_id: 'user1',
    title: '비공개 비밀 맛집',
    description: '나만 알고 싶은 곳',
    permission: 'private',
    permission_write_type: 0,
    subscriber_count: 0,
    place_count: 8,
    is_hidden: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
];

const meta: Meta<typeof FolderList> = {
  title: 'Features/Folder/FolderList',
  component: FolderList,
  tags: ['autodocs'],
  argTypes: {
    onFolderClick: { action: 'clicked' },
  },
};

export default meta;
type Story = StoryObj<typeof FolderList>;

export const Default: Story = {
  args: {
    folders: mockFolders,
    showCheckbox: false,
  },
};

export const SelectionMode: Story = {
  args: {
    folders: mockFolders,
    showCheckbox: true,
    selectedFolderIds: ['1'],
  },
};

export const Empty: Story = {
  args: {
    folders: [],
  },
};
