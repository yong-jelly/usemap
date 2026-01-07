<script lang="ts">
import type { PlaceFeatureWithPlace } from '../types';
import FeatureCard from './FeatureCard.svelte';

let {
  title,
  subtitle,
  items,
  toggleLike,
  toggleBookmark,
  onClickPlace
} = $props<{
  title: string;
  subtitle?: string;
  items: PlaceFeatureWithPlace[];
  toggleLike: (placeId: string, e: any) => void;
  toggleBookmark: (placeId: string, e: any) => void;
  onClickPlace: (placeId: string, e: any) => void;
}>();
</script>

<section class="mb-8">
  <div class="flex items-center justify-between mb-3 px-1">
    <div>
      <h2 class="font-bold text-xl text-gray-900">{title}</h2>
      {#if subtitle}
        <p class="text-sm text-gray-500">{subtitle}</p>
      {/if}
    </div>
    <button class="text-sm font-semibold text-blue-600 hover:underline">
      모두 보기
    </button>
  </div>
  <div class="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide">
    {#each items as featureItem (featureItem.id)}
      <div class="flex-shrink-0 w-80">
        <FeatureCard {featureItem} {toggleLike} {toggleBookmark} {onClickPlace} />
      </div>
    {/each}
  </div>
</section>

<style>
.scrollbar-hide::-webkit-scrollbar { display: none; }
.scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
</style> 