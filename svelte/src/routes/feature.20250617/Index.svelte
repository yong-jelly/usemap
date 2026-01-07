<script lang="ts">
import { onMount } from 'svelte';
import { supabase } from '$lib/supabase';
import type { PlaceFeatureWithPlace } from './types';
import FeatureCarousel from './components/FeatureCarousel.svelte';
import Header from './components/Header.svelte';
import Tabs from '$lib/components/ui/Tabs.svelte';
import RegionSelectorSheet from '$lib/components/explore/RegionSelectorSheet.svelte';
import CategoryFilter, { type Category } from './components/CategoryFilter.svelte';
import { placePopupStore } from '$lib/stores/place-popup.store.svelte';
import Icon from '$lib/components/Icon.svelte';
import { toast } from '$lib/components/ui/toast';
import Toast from '$lib/components/ui/Toast.svelte';

// 상태
let features: PlaceFeatureWithPlace[] = $state([]);
let isLoading = $state(true);
let errorLoading = $state(false);

// UI 상태
let activeTab = $state(0);
let showRegionSheet = $state(false);
let regionFilter = $state<{ group1: string | null; group2: string | null }>({ group1: null, group2: null });
let showLikedOnly = $state(false);
let activeCategoryId = $state<string | null>(null);

const TABS = [{ id: 'youtube', label: '유튜브' }, { id: 'community', label: '커뮤니티' }];
const CATEGORIES: Category[] = [
  { id: '한식', label: '한식', icon: 'utensils' },
  { id: '일식', label: '일식', icon: 'sushi' },
  { id: '중식', label: '중식', icon: 'utensils-crossed' },
  { id: '양식', label: '양식', icon: 'pizza' },
  { id: '카페', label: '카페', icon: 'coffee' },
  { id: '고기', label: '고기', icon: 'beef' },
];

onMount(() => fetchPlaceFeatures());

async function fetchPlaceFeatures() {
  isLoading = true;
  errorLoading = false;
  const { data, error } = await supabase.rpc('v1_list_place_features', { p_limit: 100, p_offset: 0 });
  if (error) {
    console.error('Error fetching place features:', error);
    errorLoading = true;
    features = [];
  } else {
    features = data.map((f) => ({ ...f, place: { ...f.place, interaction: f.place.interaction || {} } }));
  }
  isLoading = false;
}
// select v1_list_place_features(limit: 10, offset: 0);

async function toggleLike(placeId: string, e: Event) {
  e.stopPropagation();
  const feature = features.find((f: PlaceFeatureWithPlace) => f.place_id === placeId);
  const interaction = feature?.place?.interaction;
  if (!interaction) return;

  const originalLiked = interaction.is_liked;
  const originalCount = interaction.place_liked_count;
  interaction.is_liked = !originalLiked;
  interaction.place_liked_count = (interaction.place_liked_count ?? 0) + (originalLiked ? -1 : 1);

  toast({
    title: interaction.is_liked ? '❤️ 좋아요' : '🤍 좋아요 취소',
    description: `'${feature?.place.name}'을(를) ${interaction.is_liked ? '좋아요 목록에 추가했습니다.' : '좋아요 목록에서 제거했습니다.'}`,
    duration: 3000,
  });

  const { error } = await supabase.rpc('toggle_like_place', { p_place_id: placeId });

  if (error) {
    console.error('Error toggling like:', error);
    interaction.is_liked = originalLiked;
    interaction.place_liked_count = originalCount;
  }
}

async function toggleBookmark(placeId: string, e: Event) {
  e.stopPropagation();
  const feature = features.find((f: PlaceFeatureWithPlace) => f.place_id === placeId);
  const interaction = feature?.place?.interaction;
  if (!interaction) return;

  const originalSaved = interaction.is_saved;
  interaction.is_saved = !originalSaved;
  
  toast({
    title: interaction.is_saved ? '🔖 북마크 저장' : '북마크 취소',
    description: `'${feature?.place.name}'을(를) ${interaction.is_saved ? '북마크에 저장했습니다.' : '북마크에서 제거했습니다.'}`,
    duration: 3000,
  });

  const { error } = await supabase.rpc('toggle_save_place', { p_place_id: placeId });

  if (error) {
    console.error('Error toggling bookmark:', error);
    interaction.is_saved = originalSaved;
  }
}

function onClickPlace(placeId: string, e: Event) {
  e.stopPropagation();
  placePopupStore.show(placeId);
}

function getFilteredFeatures(): PlaceFeatureWithPlace[] {
  const platform = TABS[activeTab].id;
  return features.filter((f: PlaceFeatureWithPlace) => {
    if (f.platform_type !== platform) return false;
    if (activeCategoryId && !f.place.category?.includes(activeCategoryId)) return false;
    if (regionFilter.group1 && f.place.group1 !== regionFilter.group1) return false;
    if (regionFilter.group2 && regionFilter.group2 !== '전체' && f.place.group2 !== regionFilter.group2) return false;
    if (showLikedOnly && !f.place.interaction?.is_liked) return false;
    return true;
  });
}

function getTrendingFeatures(): PlaceFeatureWithPlace[] {
  return [...getFilteredFeatures()].sort((a, b) => (b.place.interaction?.place_liked_count ?? 0) - (a.place.interaction?.place_liked_count ?? 0)).slice(0, 10);
}

function getNewFeatures(): PlaceFeatureWithPlace[] {
  return [...getFilteredFeatures()].sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime()).slice(0, 10);
}

function getRegionalFeatures(): { region: string; items: PlaceFeatureWithPlace[] }[] {
    const popularRegions = ['강남구', '성수동', '홍대'];
    return popularRegions.map(region => ({
        region,
        items: getFilteredFeatures().filter((f: PlaceFeatureWithPlace) => f.place.group2 === region || f.place.group3 === region).slice(0,10)
    })).filter(group => group.items.length > 2);
}

</script>

<div class="bg-white min-h-screen">
  <Header />
  <Toast offset="1rem" />
  
  <div class="sticky top-0 bg-white/95 backdrop-blur-sm z-10 border-b border-gray-100">
    <div class="max-w-3xl mx-auto">
      <CategoryFilter categories={CATEGORIES} {activeCategoryId} onSelectCategory={(id: string | null) => activeCategoryId = id} />
      <div class="border-t border-gray-200">
        <Tabs tabs={TABS} {activeTab} onChange={(i: number) => (activeTab = i)} />
      </div>
    </div>
  </div>

  <main class="max-w-3xl mx-auto py-4">
    <div class="px-4 mb-4">
      <div class="flex items-center justify-between gap-2">
        <button
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-800 hover:bg-gray-100 text-sm font-medium shadow-sm transition-colors"
          onclick={() => (showRegionSheet = true)}
        >
          <Icon name="map-pin" class="w-4 h-4 text-gray-500"/>
          <span>{regionFilter.group1 ? `${regionFilter.group1} ${regionFilter.group2 && regionFilter.group2 !== '전체' ? regionFilter.group2 : ''}`.trim() : '전체 지역'}</span>
        </button>
        <button
          class="flex items-center gap-1 px-3 py-1.5 rounded-lg border text-sm font-medium shadow-sm transition-colors
            {showLikedOnly 
              ? 'bg-pink-50 border-pink-200 text-pink-600' 
              : 'border-gray-200 bg-white text-gray-800 hover:bg-gray-100'}"
          aria-pressed={showLikedOnly}
          onclick={() => (showLikedOnly = !showLikedOnly)}
        >
          <Icon name="heart" class="w-4 h-4 {showLikedOnly ? 'text-pink-500 fill-current' : 'text-gray-500'}" />
          <span>좋아요</span>
        </button>
      </div>
    </div>

    {#if showRegionSheet}
      <RegionSelectorSheet
        isOpen={showRegionSheet}
        initialGroup1={regionFilter.group1}
        initialGroup2={regionFilter.group2}
        onRegionSelect={(region) => {
          regionFilter = region;
          showRegionSheet = false;
        }}
        onClose={() => (showRegionSheet = false)}
      />
    {/if}

    {#if isLoading}
      <div class="text-center py-20 text-gray-500">콘텐츠를 불러오는 중...</div>
    {:else if errorLoading}
      <div class="text-center py-20">
        <p class="text-red-500">데이터를 불러오는데 실패했습니다.</p>
        <button onclick={() => fetchPlaceFeatures()} class="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600">다시 시도</button>
      </div>
    {:else if getFilteredFeatures().length === 0}
      <div class="text-center py-20 text-gray-500">표시할 콘텐츠가 없습니다.</div>
    {:else}
      {@const trending = getTrendingFeatures()}
      {@const newItems = getNewFeatures()}
      {@const regional = getRegionalFeatures()}
      <div class="space-y-8">
        {#if trending.length > 0}
          <FeatureCarousel title="🔥 지금 뜨는 추천" items={trending} {toggleLike} {toggleBookmark} {onClickPlace} />
        {/if}
        {#if newItems.length > 0}
          <FeatureCarousel title="✨ 새로운 추천" items={newItems} {toggleLike} {toggleBookmark} {onClickPlace} />
        {/if}
        {#each regional as { region, items }}
          <FeatureCarousel title={`📍 ${region} 추천`} {items} {toggleLike} {toggleBookmark} {onClickPlace} />
        {/each}
      </div>
    {/if}
  </main>
</div> 