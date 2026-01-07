<script lang="ts">
import type { Place } from '$services/types';
import { convertToNaverResizeImageUrl } from '$utils/naver.util';
import { Heart } from 'lucide-svelte';
import { setToggleLike } from '$services/supabase/interactions.service';

const { place, onClick = () => {} } = $props<{ place: Place; onClick?: (id: string, e: Event) => void }>();
let isLiked = $state(true);
let isLoadingLike = $state(false);

async function toggleLike(event: Event) {
	event.stopPropagation(); // 카드 전체 클릭 방지
	if (isLoadingLike) return;

	isLoadingLike = true;
	try {
		// 실제 좋아요 상태를 서버에 업데이트하고, 반환된 최신 상태로 isLiked를 업데이트
		isLiked = await setToggleLike(place.id, 'place', place.id);
		// 부모 컴포넌트에 이벤트 전달 (필요한 경우)
		// dispatch('likeToggled', { placeId: place.id, newLikedState: isLiked });
	} catch (error) {
		console.error('Failed to toggle like:', error);
		// 사용자에게 오류 알림 (예: toast 메시지)
	} finally {
		isLoadingLike = false;
	}
}

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
  <!-- <div class="absolute top-2 right-2 z-10">
    <button
      onclick={toggleLike}
      disabled={isLoadingLike}
      class="p-1.5 rounded-full bg-black bg-opacity-30 hover:bg-opacity-50 transition-colors"
      aria-label={isLiked ? '좋아요 취소' : '좋아요'}
    >
      <Heart class={`w-4 h-4 md:w-5 md:h-5 ${isLiked ? 'text-red-500 fill-red-500' : 'text-white'}`} />
    </button>
  </div> -->
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