<script lang="ts">
  import Icon from '$lib/components/Icon.svelte';
  import { cn } from '$lib/utils';
  import type { PlaceExperienceOption } from '../types';
    let { 
    options,
    onToggle,
    isAuthenticated,
  } = $props<{
    options: PlaceExperienceOption[];
    onToggle: (option: PlaceExperienceOption) => void;
    isAuthenticated: boolean;
  }>();

  function handleToggle(option: PlaceExperienceOption) {
    onToggle(option);
  }

  $inspect(options);
</script>
<div class="flex justify-center gap-2 my-4">
  {#each options as opt}
    <button
      class={cn(
        "flex items-center gap-1 px-4 py-2 rounded-full border text-sm font-medium transition-colors",
        !isAuthenticated
          ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
          : opt.selected ?? false
            ? "bg-pink-600 text-white border-pink-600 cursor-pointer" 
            : !opt.enabled
              ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
              : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100 cursor-pointer"
      )}
      aria-pressed={opt.selected ?? false}
      onclick={(e) => {
        e.stopPropagation(); 
        if (isAuthenticated) {
          handleToggle(opt);
        }
      }}
      type="button"
      disabled={!isAuthenticated || !opt.enabled}
      title={!isAuthenticated ? "로그인이 필요합니다" : ""}
    >
      <Icon name={opt.icon} class="w-4 h-4" />
      {opt.label}
    </button>
  {/each}
</div>