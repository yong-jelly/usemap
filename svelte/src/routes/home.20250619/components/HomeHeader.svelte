<script lang="ts">
import { Settings2 } from 'lucide-svelte';
import BottomSheet from '$lib/BottomSheet';

interface FilterState {
  sort: 'latest' | 'revisit' | 'popular';
  region: 'all' | 'jeju' | 'seoul' | 'busan' | 'daegu' | 'gwangju';
  myContent: 'all' | 'liked' | 'saved';
}

let filterState = $state<FilterState>({
  sort: 'latest',
  region: 'all',
  myContent: 'all'
});

let activeTab = $state(0);
let isSheetOpen = $state(false);

const { onFilterChange } = $props<{
  onFilterChange: (filters: FilterState) => void;
}>();

// 탭 구성 (트위터 스타일)
const tabs = [
  { id: 'all', label: '전체' },
  { id: 'liked', label: '좋아요' },
  { id: 'saved', label: '저장' }
];

// 필터 옵션들
const sortOptions = [
  { value: 'latest', label: '최신순' },
  { value: 'revisit', label: '재방문순' },
  { value: 'popular', label: '인기순' }
];

const regionOptions = [
  { value: 'all', label: '전체 지역' },
  { value: 'jeju', label: '제주' },
  { value: 'seoul', label: '서울' },
  { value: 'busan', label: '부산' },
  { value: 'daegu', label: '대구' },
  { value: 'gwangju', label: '광주' }
];

function handleTabChange(index: number) {
  activeTab = index;
  const tabValues = ['all', 'liked', 'saved'];
  filterState.myContent = tabValues[index] as FilterState['myContent'];
  onFilterChange(filterState);
}

function updateSort(value: string) {
  filterState.sort = value as FilterState['sort'];
  onFilterChange(filterState);
}

function updateRegion(value: string) {
  filterState.region = value as FilterState['region'];
  onFilterChange(filterState);
}

function openFilterSheet() {
  isSheetOpen = true;
}

function closeFilterSheet() {
  isSheetOpen = false;
}
</script>

<header class="sticky top-0 z-50 bg-white border-b border-gray-200">
  <!-- 로고 & 필터 버튼 -->
  <div class="flex items-center justify-between px-4 py-3">
    <h1 class="text-lg font-bold text-gray-900 flex items-center gap-2">
      Home
    </h1>
    
    <button 
      class="p-2 hover:bg-gray-100 rounded-lg transition-colors"
      onclick={openFilterSheet}
    >
      <Settings2 class="w-5 h-5 text-gray-600" />
    </button>
  </div>

  <!-- 트위터 스타일 탭 -->
  <div class="flex border-b border-gray-200">
    {#each tabs as tab, index}
      <button
        class="flex-1 relative py-4 text-center font-medium transition-colors duration-200 hover:bg-gray-50
        {activeTab === index 
          ? 'text-gray-900' 
          : 'text-gray-500 hover:text-gray-700'}"
        onclick={() => handleTabChange(index)}
      >
        <span class="text-[15px]">{tab.label}</span>
        {#if activeTab === index}
          <div class="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-12 h-1 bg-blue-500 rounded-full"></div>
        {/if}
      </button>
    {/each}
  </div>
</header>

<!-- 필터 BottomSheet -->
<BottomSheet
  bind:isSheetOpen
  settings={{ maxHeight: 0.8, snapPoints: [0.5, 0.8], startingSnapPoint: 0.8 }}
  onopen={() => {}}
  onclose={closeFilterSheet}
>
  <BottomSheet.Overlay>
    <BottomSheet.Sheet style="max-width: 600px; margin: 0 auto;">
      <BottomSheet.Handle>
        <BottomSheet.Grip />
        <div class="flex items-center justify-between border-b border-gray-100 px-4 py-3">
          <span class="text-lg font-semibold text-gray-900">필터</span>
          <button class="p-1" onclick={closeFilterSheet} aria-label="닫기">
            <svg class="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </BottomSheet.Handle>
      
      <BottomSheet.Content>
        <div class="p-6 space-y-6">
          <!-- 정렬 -->
          <div class="space-y-3">
            <h3 class="text-sm font-medium text-gray-700">정렬</h3>
            <div class="grid grid-cols-3 gap-2">
              {#each sortOptions as option}
                <button
                  class={`p-3 text-sm font-medium rounded-lg border transition-colors ${
                    filterState.sort === option.value
                      ? 'bg-blue-50 border-blue-200 text-blue-700'
                      : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                  onclick={() => updateSort(option.value)}
                >
                  {option.label}
                </button>
              {/each}
            </div>
          </div>

          <!-- 지역 -->
          <div class="space-y-3">
            <h3 class="text-sm font-medium text-gray-700">지역</h3>
            <div class="grid grid-cols-2 gap-2">
              {#each regionOptions as option}
                <button
                  class={`p-3 text-sm font-medium rounded-lg border transition-colors ${
                    filterState.region === option.value
                      ? 'bg-green-50 border-green-200 text-green-700'
                      : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                  onclick={() => updateRegion(option.value)}
                >
                  {option.label}
                </button>
              {/each}
            </div>
          </div>

          <!-- 적용 버튼 -->
          <button 
            class="w-full bg-blue-500 text-white py-3 rounded-lg font-medium hover:bg-blue-600 transition-colors"
            onclick={closeFilterSheet}
          >
            적용
          </button>
        </div>
      </BottomSheet.Content>
    </BottomSheet.Sheet>
  </BottomSheet.Overlay>
</BottomSheet> 