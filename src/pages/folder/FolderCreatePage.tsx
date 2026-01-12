import { useNavigate } from "react-router";
import { FolderCreateModal } from "@/features/folder/ui/FolderCreate.modal";

export function FolderCreatePage() {
  const navigate = useNavigate();

  return (
    <FolderCreateModal 
      onClose={() => navigate(-1)} 
    />
  );
}
