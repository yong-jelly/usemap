import { useNavigate } from "react-router";
import { User, Plus } from "lucide-react";
import { getAvatarUrl } from "@/shared/lib/utils";
import { convertToNaverResizeImageUrl } from "@/shared/lib/naver";

interface HeroCardProps {
  folder: any;
  onClick: () => void;
}

export function HeroCard({ folder, onClick }: HeroCardProps) {
  // folder 객체 구조 확인 및 이미지 추출 로직 개선
  const places = folder.preview_places || [];
  const images = places.map((p: any) => p.thumbnail || p.images?.[0] || p.image_urls?.[0]).filter(Boolean);
  const mainImage = images[0] || folder.thumbnail || folder.folder_thumbnail;

  return (
    <div onClick={onClick} className="relative rounded-3xl overflow-hidden cursor-pointer group h-[480px]">
      {/* Main Image */}
      {mainImage ? (
        <img
          src={convertToNaverResizeImageUrl(mainImage)}
          alt={folder.title}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-rose-200 via-fuchsia-200 to-amber-200" />
      )}

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

      {/* Bookmark Icon (Top Right) */}
      <div className="absolute top-4 right-4">
        <div className="p-1.5 rounded-lg bg-black/20 backdrop-blur-md border border-white/10">
          <Plus className="size-4 text-white" />
        </div>
      </div>

      {/* Content */}
      <div className="absolute inset-x-0 bottom-0 p-4">
        <h2 className="text-lg font-medium text-white leading-tight mb-3 tracking-tight line-clamp-2">
          {folder.title}
        </h2>

        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg overflow-hidden border border-white/20 shadow-sm">
            {folder.owner_avatar_url ? (
              <img src={getAvatarUrl(folder.owner_avatar_url)} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-surface-200 flex items-center justify-center">
                <User className="size-4 text-surface-400" />
              </div>
            )}
          </div>
          <div className="flex flex-col">
            <span className="text-white text-xs font-medium leading-none mb-1">{folder.owner_nickname || '익명'}</span>
            <span className="text-white/60 text-[10px] leading-none">{folder.place_count} 장소</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function HeroSection({ publicFolders }: { publicFolders: any[] }) {
  const navigate = useNavigate();
  
  if (!publicFolders || publicFolders.length === 0) return null;

  return (
    <section className="mb-8 overflow-hidden">
      <div className="flex gap-4 px-4 overflow-x-auto no-scrollbar" style={{ WebkitOverflowScrolling: 'touch' }}>
        {publicFolders.slice(0, 5).map((folder: any) => (
          <div key={folder.id} className="flex-shrink-0 w-[320px]">
            <HeroCard folder={folder} onClick={() => navigate(`/folder/${folder.id}`)} />
          </div>
        ))}
      </div>
    </section>
  );
}
