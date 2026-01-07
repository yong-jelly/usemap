<script lang="ts">
  import type { Place } from '$services/types';
  import { convertToNaverResizeImageUrl } from '$utils/naver.util';
  import { formatWithCommas } from '$utils/number.util';
  import { Bookmark, MapPinned, Star } from 'lucide-svelte';
  // import { setToggleSave } from '$services/supabase/interactions.service';
  
  const { place, onClick = () => {} } = $props<{ place: Place; onClick?: (id: string, e: Event) => void }>();
  
  let isSaved = $state(place.isSaved || place.interaction?.is_saved || false);
  let isLoadingSave = $state(false);
  
  async function toggleSave(event: Event) {
    event.stopPropagation();
    if (isLoadingSave) return;
  
    isLoadingSave = true;
    try {
      // TODO: 실제 Supabase API를 호출하여 저장 상태를 업데이트합니다.
      // const newSaveState = await setToggleSave(place.id, 'place');
      // isSaved = newSaveState;
      isSaved = !isSaved;
      console.log('Toggled save for place:', place.id, 'New state:', isSaved);
      // dispatch('saveToggled', { placeId: place.id, newSavedState: isSaved });
    } catch (error) {
      console.error('Failed to toggle save:', error);
      // 사용자에게 오류 알림 (예: toast 메시지)
    } finally {
      isLoadingSave = false;
    }
  }
  
  function handleImageError(event: Event) {
    const imgElement = event.target as HTMLImageElement;
    if (imgElement && imgElement.src) {
      imgElement.src = 'https://placehold.co/400x400?text=NO+IMAGE';
      imgElement.parentElement?.classList.add('bg-muted');
    }
  }
  
  function stopPropagation(event: Event) {
    event.stopPropagation();
  }
  </script>
  
<article
class="mb-1 cursor-pointer bg-white"
onclick={(e) => onClick(place.id, e)}
onkeydown={(e) => e.key === 'Enter' && onClick(place.id, e)}
tabindex="0"
role="button"
>
<!-- 상단 정보: 이름, 카테고리, 평점 -->
<div class="px-2 mt-2 flex items-start justify-between">
  <div class="flex flex-col">
    <h3 class="font-semibold text-base">{place.name}
      <span class="text-xs text-gray-500"> 
    </h3>
    <div class="flex flex-wrap items-baseline gap-x-2 gap-y-1">
      {#if place.category}
        <span class="cursor-pointer text-xs font-semibold text-blue-600">{place.category}</span>
      {/if}
      <span class="text-sm text-gray-500">{place.address}</span>
    </div>
  </div>
</div>

<!-- 이미지 갤러리 (최대 3개) -->
{#if place.images && place.images.length > 0}
  {@const imageCount = place.images.length}
  <div
    class="my-2 grid {imageCount === 1
      ? 'grid-cols-1'
      : imageCount === 2
        ? 'grid-cols-2'
        : 'grid-cols-3'}"
  >
    {#each place.images.slice(0, 3) as img, i}
      <div class="relative aspect-[4/3] mx-0">
        <img
          src={convertToNaverResizeImageUrl(img)}
          alt={`${place.name} ${i + 1}`}
          class="h-full w-full object-cover border"
          loading="lazy"
          onerror={handleImageError}
        />
      </div>
    {/each}
  </div>
{:else}
  <div class="my-2 grid grid-cols-3">
    {#each Array(3) as _, i}
      <div class="relative aspect-[4/3] mx-0 bg-muted">
        <img
          src="https://placehold.co/400x400?text=NO+IMAGE"
          alt="No image"
          class="h-full w-full object-cover border opacity-60"
          loading="lazy"
        />
      </div>
    {/each}
  </div>
{/if}

</article>

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