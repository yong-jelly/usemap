<script lang="ts">
  import { toasts, type Toast } from './toast';
  
  // 상단 여백 조정 (옵션)
  let { offset = '4rem' } = $props<{
    offset?: string; // 상단 네비게이션 막대 높이에 맞춤
  }>();
</script>

{#if $toasts.length > 0}
  <div 
    class="fixed right-0 z-50 flex max-h-screen w-full flex-col gap-2 p-4 sm:right-4 sm:top-4 sm:max-w-[420px]"
    style="top: {offset}"
  >
    {#each $toasts as toast (toast.id)}
      <div 
        class={`
          flex items-center justify-between overflow-hidden rounded-md p-4 pr-6 shadow-md transition-all
          ${toast.variant === 'destructive' ? 'bg-red-600 text-white' : 
            toast.variant === 'success' ? 'bg-green-600 text-white' : 
            'bg-white text-black dark:bg-neutral-800 dark:text-white'}
        `}
      >
        <div class="flex flex-1 items-start gap-2">
          <div class="flex-1 space-y-1">
            {#if toast.title}
              <div class="text-sm font-semibold">
                {toast.title}
              </div>
            {/if}
            {#if toast.description}
              <div class="text-sm opacity-90">
                {toast.description}
              </div>
            {/if}
          </div>
        </div>
        
        <button 
          onclick={() => toasts.remove(toast.id)}
          class="absolute right-1 top-1 rounded-md p-1 transition-opacity opacity-60 hover:opacity-100 focus:opacity-100"
        >
          <svg 
            class="h-4 w-4" 
            xmlns="http://www.w3.org/2000/svg" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    {/each}
  </div>
{/if} 