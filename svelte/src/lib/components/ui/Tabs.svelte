<script lang="ts">
  import type { SvelteComponent } from 'svelte';
  interface TabProps {
    tabs: Array<{
      id: string;
      label: string;
      icon?: typeof SvelteComponent;
      emoji?: string;
      desc?: string;
    }>;
    activeTab: number;
    onChange: (index: number) => void;
  }

  let { tabs, activeTab, onChange } = $props();

  function handleTabChange(index: number) {
    onChange(index);
  }
</script>

<div class="border-b border-gray-200 bg-white dark:bg-neutral-900">
  <div class="container max-w-2xl mx-auto px-4">
    <div class="flex">
      {#each tabs as tab, index}
        <button
          class="relative flex-1 whitespace-nowrap py-4 text-sm font-medium transition-all duration-200
          {activeTab === index 
            ? 'text-gray-900 border-b-2 border-gray-900' 
            : 'text-gray-500 hover:text-gray-700 border-b-2 border-transparent'}"
          onclick={() => handleTabChange(index)}
        >
          <div class="flex items-center justify-center gap-2">
            {#if tab.icon}
              {@const Icon = tab.icon}
              <Icon class="w-4 h-4" />
            {:else if tab.emoji}
              <span class="text-base">{tab.emoji}</span>
            {/if}
            <span>{tab.label}</span>
          </div>
          
          <!-- 활성 탭 배경 -->
          {#if activeTab === index}
            <div class="absolute inset-0 bg-gray-50 rounded-t-lg -z-10"></div>
          {/if}
        </button>
      {/each}
    </div>
  </div>
</div> 