<script lang="ts">
import Icon from '$lib/components/Icon.svelte';

export interface Category {
  id: string;
  label: string;
  icon: string;
}

let {
  categories,
  activeCategoryId,
  onSelectCategory
} = $props<{
  categories: Category[];
  activeCategoryId: string | null;
  onSelectCategory: (categoryId: string | null) => void;
}>();

const handleSelect = (id: string) => {
  onSelectCategory(activeCategoryId === id ? null : id);
};
</script>

<div class="px-4 pt-3 pb-2">
  <div class="flex justify-center items-center gap-4 overflow-x-auto scrollbar-hide">
    {#each categories as category}
      <button
        class="flex flex-col items-center gap-1.5 flex-shrink-0 w-16 transition-colors duration-200"
        onclick={() => handleSelect(category.id)}
      >
        <div 
          class="w-12 h-12 flex items-center justify-center rounded-full border-2 transition-all duration-200
            {activeCategoryId === category.id 
              ? 'bg-blue-600 border-blue-700 shadow-md' 
              : 'bg-gray-100 border-transparent hover:bg-gray-200'}"
        >
          <Icon name={category.icon} class="w-6 h-6 {activeCategoryId === category.id ? 'text-white' : 'text-gray-600'}" />
        </div>
        <span 
          class="text-xs font-semibold transition-colors duration-200
            {activeCategoryId === category.id ? 'text-blue-600' : 'text-gray-500'}"
        >
          {category.label}
        </span>
      </button>
    {/each}
  </div>
</div>

<style>
.scrollbar-hide::-webkit-scrollbar { display: none; }
.scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
</style> 