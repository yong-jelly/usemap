<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  
  // 탭 인터페이스 정의
  interface Tab {
    id: string;
    name: string;
  }
  
  // props 대신 state 사용
  const tabs = $state([
    { id: 'all', name: '전체' },
    { id: 'auto', name: '추천 그룹' },
    { id: 'popular', name: '인기 그룹' },
    { id: 'my', name: '내 그룹' },
    { id: 'region', name: '지역별' }
  ]);
  
  let activeTabId = $state('all');
  
  // 이벤트 디스패처 생성
  const dispatch = createEventDispatcher<{
    tabChange: { tabId: string }
  }>();
  
  // 탭 변경 핸들러
  function handleTabChange(tabId: string) {
    activeTabId = tabId;
    dispatch('tabChange', { tabId });
  }
  
  // 텍스트 엘리먼트 참조
  let textElements: Record<string, HTMLSpanElement | null> = $state({});
  
  // 외부에서 활성 탭 설정할 수 있도록 export
  export function setActiveTab(tabId: string) {
    activeTabId = tabId;
  }
</script>

<div class="bg-white border-b border-gray-200">
  <div class="container mx-auto overflow-x-auto">
    <div class="flex whitespace-nowrap">
      {#each tabs as tab}
        <div 
          class="tab-button relative px-4 py-3 font-medium cursor-pointer"
          onclick={() => handleTabChange(tab.id)}
        >
          <span
            bind:this={textElements[tab.id]}
            class={activeTabId === tab.id ? 'text-blue-600 font-medium' : 'text-gray-500 hover:text-gray-700'}
          >
            {tab.name}
          </span>
          
          {#if activeTabId === tab.id}
            <div
              class="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500"
            ></div>
          {/if}
        </div>
      {/each}
    </div>
  </div>
</div>

<style>
  .tab-button {
    position: relative;
    text-align: center;
    flex-shrink: 0;
  }
  
  /* 가로 스크롤 시 스크롤바 숨김 */
  .overflow-x-auto {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  
  .overflow-x-auto::-webkit-scrollbar {
    display: none;
  }
</style> 