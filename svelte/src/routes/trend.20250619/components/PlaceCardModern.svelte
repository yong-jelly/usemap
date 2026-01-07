<script lang="ts">
import type { Place } from '$services/types';
import { Heart, Star, Bookmark } from 'lucide-svelte';

const { place, onClick = () => {} } = $props<{ place: Place; onClick?: (id: string, e: Event) => void }>();
let isLiked = $state(false);
let isSaved = $state(false);

function toggleLike(e: Event) {
  e.stopPropagation();
  isLiked = !isLiked;
}
function toggleSave(e: Event) {
  e.stopPropagation();
  isSaved = !isSaved;
}
</script>

<div class="group relative rounded-lg overflow-hidden shadow-sm bg-white border border-gray-100 transition-all hover:shadow-md cursor-pointer min-w-[160px] max-w-[200px] flex flex-col" onclick={(e) => onClick(place.id, e)}>
  <div class="relative">
    <img
      src={place.images?.[0] || 'https://placehold.co/400x400?text=NO+IMAGE'}
      alt={place.name}
      class="w-full h-32 object-cover bg-gray-50 transition-all group-hover:brightness-95"
      loading="lazy"
    />
    <div class="absolute top-2 right-2 flex gap-1 z-10">
      <button class="p-1.5 rounded-full bg-white/90 hover:bg-white transition-colors shadow-sm" aria-label="좋아요" onclick={toggleLike}>
        <Heart class={`w-3.5 h-3.5 ${isLiked ? 'text-red-500 fill-red-500' : 'text-gray-600'}`} />
      </button>
      <button class="p-1.5 rounded-full bg-white/90 hover:bg-white transition-colors shadow-sm" aria-label="저장" onclick={toggleSave}>
        <Bookmark class={`w-3.5 h-3.5 ${isSaved ? 'text-blue-500 fill-blue-500' : 'text-gray-600'}`} />
      </button>
    </div>
    <div class="absolute top-2 left-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full">
      <div class="flex items-center gap-1">
        <Star class="w-3 h-3 text-yellow-500 fill-yellow-500" />
        <span class="text-xs font-semibold text-gray-900">{place.visitor_reviews_score.toFixed(1)}</span>
      </div>
    </div>
  </div>
  
  <div class="flex-1 flex flex-col p-3 gap-1">
    <div class="text-sm font-semibold text-gray-900 truncate">{place.name}</div>
    <div class="text-xs text-gray-500 truncate">{place.address}</div>
    <div class="text-xs text-gray-400 mt-1">
      리뷰 {place.visitor_reviews_total} • {place.category}
    </div>
    <div class="flex flex-wrap gap-1 mt-2">
      {#each place.keyword_list.slice(0,2) as tag}
        <span class="px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 text-[10px] font-medium border border-blue-100">#{tag}</span>
      {/each}
    </div>
  </div>
</div> 