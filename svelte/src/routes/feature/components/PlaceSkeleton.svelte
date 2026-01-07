<script lang="ts">
  // 표시할 스켈레톤 아이템 개수, 기본값은 3개
  let { count = 3, includeActions = true } = $props<{ 
    count?: number;
    includeActions?: boolean;
  }>();
  
  // 랜덤 너비를 생성하는 함수 - 다양한 크기의 스켈레톤 요소 생성
  function randomWidth() {
    const widths = ['w-1/2', 'w-2/3', 'w-3/4', 'w-4/5', 'w-full'];
    return widths[Math.floor(Math.random() * widths.length)];
  }
</script>

{#each Array(count) as _, i}
  <div class="bg-white dark:bg-neutral-800 rounded-lg shadow-sm mb-4 p-4 animate-pulse">
    <div class="flex space-x-4">
      <!-- 이미지 스켈레톤 - 다양한 종횡비 적용 -->
      <div class="rounded-md bg-slate-200 dark:bg-neutral-700 h-24 w-24 flex-shrink-0 overflow-hidden">
        <!-- 이미지 내부에 그림자 효과로 더 자연스럽게 보이도록 함 -->
        <div class="h-full w-full relative">
          <div class="absolute inset-0 bg-gradient-to-br from-slate-100 to-transparent opacity-40 dark:from-neutral-600 dark:to-transparent"></div>
        </div>
      </div>
      
      <div class="flex-1 space-y-3 py-1">
        <!-- 제목 스켈레톤 - 랜덤 너비 적용 -->
        <div class={`h-5 bg-slate-200 dark:bg-neutral-700 rounded-md ${i % 3 === 0 ? 'w-3/4' : i % 3 === 1 ? 'w-2/3' : 'w-4/5'}`}></div>
        
        <!-- 별점 스켈레톤 - 별 아이콘과 비슷한 모양으로 표현 -->
        <div class="flex items-center space-x-1">
          <div class="flex space-x-1">
            {#each Array(5) as _, j}
              <div class="h-3 w-3 bg-slate-200 dark:bg-neutral-700 rounded-sm"></div>
            {/each}
          </div>
          <div class="h-3 w-12 bg-slate-200 dark:bg-neutral-700 rounded ml-2"></div>
        </div>
        
        <!-- 주소 스켈레톤 - 두 줄로 표현 -->
        <div class="space-y-1.5">
          <div class="h-3 bg-slate-200 dark:bg-neutral-700 rounded w-full"></div>
          <div class={`h-3 bg-slate-200 dark:bg-neutral-700 rounded ${i % 2 === 0 ? 'w-1/2' : 'w-2/3'}`}></div>
        </div>
        
        <!-- 태그 스켈레톤 - 다양한 길이로 표현 -->
        <div class="flex flex-wrap gap-2 mt-1">
          <div class="h-6 bg-slate-200 dark:bg-neutral-700 rounded-full w-16"></div>
          <div class="h-6 bg-slate-200 dark:bg-neutral-700 rounded-full w-20"></div>
          {#if i % 2 === 0}
            <div class="h-6 bg-slate-200 dark:bg-neutral-700 rounded-full w-14"></div>
          {/if}
        </div>
      </div>
    </div>
    
    <!-- 하단 액션 버튼 스켈레톤 -->
    {#if includeActions}
    <div class="flex justify-between mt-4 pt-2 border-t dark:border-neutral-700">
      <div class="h-6 bg-slate-200 dark:bg-neutral-700 rounded w-20"></div>
      <div class="h-6 bg-slate-200 dark:bg-neutral-700 rounded w-20"></div>
      <div class="h-6 bg-slate-200 dark:bg-neutral-700 rounded w-20"></div>
    </div>
    {/if}
  </div>
{/each} 