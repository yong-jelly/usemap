import { FolderListItem } from "./FolderListItem";
import type { Folder } from "@/entities/folder/types";

interface FolderListProps {
  folders: Folder[];
  selectedFolderIds?: string[];
  onFolderClick?: (folderId: string) => void;
  showCheckbox?: boolean;
}

export function FolderList({ 
  folders, 
  selectedFolderIds = [], 
  onFolderClick, 
  showCheckbox = false 
}: FolderListProps) {
  return (
    <div className="space-y-3">
      {folders.map(folder => (
        <FolderListItem
          key={folder.id}
          folder={folder}
          isSelected={selectedFolderIds.includes(folder.id)}
          showCheckbox={showCheckbox}
          onClick={onFolderClick}
        />
      ))}
    </div>
  );
}
