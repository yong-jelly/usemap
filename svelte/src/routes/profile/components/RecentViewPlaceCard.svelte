<script lang="ts">
import type { Place } from '$services/types';
import { convertToNaverResizeImageUrl } from '$utils/naver.util';

  interface Props {
    place: Place;
    onClick?: (id: string, e: Event) => void;
  }

  let { place, onClick = () => {} }: Props = $props();

function handleImageError(event: Event) {
  const imgElement = event.target as HTMLImageElement;
  if (imgElement && imgElement.src) {
    imgElement.src = 'https://placehold.co/400x400?text=NO+IMAGE';
  }
}
</script>

<div
  class="relative aspect-[3/4] h-45 w-full overflow-hidden cursor-pointer group border"
  onclick={(e) => onClick(place.id, e)}
>
  <img
    src={convertToNaverResizeImageUrl(place.images?.[0])}
    alt={place.name}
    class="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
    onerror={handleImageError}
    loading="lazy"
  />
  <div class="absolute bottom-0 left-0 right-0 backdrop-blur-[2px] px-2 py-1 md:px-3 md:py-2">
    <div class="text-white text-xs font-semibold truncate" style="max-width: 100%;">{place.address}</div>
    <div class="text-white text-xs md:text-sm font-bold truncate leading-tight line-clamp-2" style="max-width: 100%;">{place.name}</div>
  </div>
</div>

<style>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  word-break: break-all;
}
</style> 