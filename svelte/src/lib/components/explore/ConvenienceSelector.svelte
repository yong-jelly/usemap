<script lang="ts">
import BottomSheet from '$lib/BottomSheet';
import { onMount } from 'svelte';

const conveniences = [
  '단체 이용 가능',
  '무선 인터넷',
  '남/녀 화장실 구분',
  '유아의자',
  '반려동물 동반',
  '포장',
  '배달',
  '유아시설 (놀이방)',
  '대기공간',
  '방문접수/출장',
  '예약',
  '노키즈존',
  '간편결제',
  '주차',
  '발렛파킹'
];

const {
  isOpen = false,
  initialConveniences = [],
  onConveniencesSelect = (selected: string[]) => {},
  onOpen = () => {},
  onClose = () => {},
  onSheetDragStart = () => {},
  onSheetDragEnd = () => {}
} = $props<{
  isOpen?: boolean;
  initialConveniences?: string[];
  onConveniencesSelect?: (selected: string[]) => void;
  onOpen?: () => void;
  onClose?: () => void;
  onSheetDragStart?: () => void;
  onSheetDragEnd?: () => void;
}>();

let isSheetOpen = $state(isOpen);
let selected = $state<string[]>(initialConveniences);

$effect(() => { isSheetOpen = isOpen; });
$effect(() => { selected = initialConveniences; });

function toggleConvenience(item: string) {
  if (selected.includes(item)) {
    selected = selected.filter(c => c !== item);
  } else {
    selected = [...selected, item];
  }
}

function handleApply() {
  onConveniencesSelect(selected);
  isSheetOpen = false;
}

function handleReset() {
  selected = [];
}

function selectedCount() {
  return selected.length;
}
</script>

<div class="convenience-selector">
  <BottomSheet
    bind:isSheetOpen
    settings={{ maxHeight: 0.9, snapPoints: [0.5, 0.9], startingSnapPoint: 0.5 }}
    onopen={onOpen}
    onclose={onClose}
    onsheetdragstart={onSheetDragStart}
    onsheetdragend={onSheetDragEnd}
  >
    <BottomSheet.Overlay>
      <BottomSheet.Sheet style="max-width: 600px; margin: 0 auto; height: 100%; display: flex; flex-direction: column; min-height: 0;">
        <BottomSheet.Handle>
          <BottomSheet.Grip />
          <div class="px-4 py-3 border-b border-gray-200 dark:border-neutral-700">
            <h3 class="text-lg font-medium text-center">편의시설 선택</h3>
            <p class="text-sm text-gray-500 dark:text-gray-400 text-center mt-1">여러 개의 편의시설을 선택할 수 있습니다</p>
          </div>
        </BottomSheet.Handle>
        <BottomSheet.Content style="flex: 1 1 0; display: flex; flex-direction: column; min-height: 0;">
          <div class="flex flex-col gap-2 flex-1 min-h-0 p-2">
            <div class="flex flex-wrap gap-2">
              {#each conveniences as item}
                <button
                  class="rounded-full px-3 py-2 text-sm transition-colors flex items-center border font-medium {selected.includes(item) ? 'bg-indigo-100 text-indigo-700 border-indigo-400 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-700' : 'bg-gray-100 text-gray-700 border-transparent hover:bg-gray-200 dark:bg-neutral-800 dark:text-gray-300 dark:hover:bg-neutral-700'}"
                  onclick={() => toggleConvenience(item)}
                >
                  {item}
                  {#if selected.includes(item)}
                    <svg xmlns="http://www.w3.org/2000/svg" class="ml-1 h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
                  {/if}
                </button>
              {/each}
            </div>
          </div>
          <div class="pt-2 pb-0 flex flex-col gap-2">
            <div class="flex gap-2">
              <button
                class="flex-1 py-2.5 rounded-lg border border-gray-300 dark:border-neutral-700 text-gray-700 dark:text-gray-200 font-medium text-sm transition-colors active:bg-gray-100 dark:active:bg-neutral-800"
                onclick={handleReset}
              >
                초기화
              </button>
              <button
                class="flex-1 py-2.5 rounded-lg bg-indigo-600 text-white font-medium text-sm transition-colors hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                onclick={handleApply}
                disabled={selected.length === 0}
              >
                적용{selectedCount() > 0 ? ` (${selectedCount()})` : ''}
              </button>
            </div>
          </div>
        </BottomSheet.Content>
      </BottomSheet.Sheet>
    </BottomSheet.Overlay>
  </BottomSheet>
</div>

<style>
  .min-h-0 { min-height: 0 !important; }
</style> 