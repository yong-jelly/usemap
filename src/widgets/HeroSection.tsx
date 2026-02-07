import { useNavigate } from "react-router";
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
        <div className="w-full h-full bg-surface-100 dark:bg-surface-800" />
      )}

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

      {/* Content */}
      <div className="absolute inset-x-0 bottom-0 p-6">
        <div className="mb-3">
          <span className="text-[10px] text-white/80 font-medium uppercase tracking-widest bg-white/10 backdrop-blur-md px-2 py-1 rounded">Archive</span>
        </div>
        <h2 className="text-xl font-medium text-white leading-tight mb-4 tracking-tight line-clamp-2">
          {folder.title}
        </h2>

        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full overflow-hidden border border-white/20">
            {folder.owner_avatar_url ? (
              <img src={getAvatarUrl(folder.owner_avatar_url)} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-white/20" />
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-white text-xs font-medium">{folder.owner_nickname || '익명'}</span>
            <span className="w-0.5 h-0.5 rounded-full bg-white/40" />
            <span className="text-white/60 text-[10px]">{folder.place_count} 장소</span>
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
    <section className="mb-6 overflow-hidden">
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
