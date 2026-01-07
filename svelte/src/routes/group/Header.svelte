<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  
  const dispatch = createEventDispatcher<{
    profileClick: void;
    searchClick: void;
    createGroupClick: void;
  }>();
  
  // 검색 관련 상태
  let showSearchModal = $state(false);
  let searchQuery = $state('');
  let recentSearches = $state([
    { query: '서울 맛집', date: '2023-06-15T14:32:00' },
    { query: '가성비 맛집', date: '2023-06-10T09:15:00' },
    { query: '홍대 카페', date: '2023-06-05T18:45:00' },
    { query: '한강 피크닉', date: '2023-05-28T12:20:00' },
  ]);
  
  // 이벤트 핸들러
  function handleProfileClick() {
    dispatch('profileClick');
  }
  
  function handleSearchClick() {
    showSearchModal = true;
    dispatch('searchClick');
  }
  
  function handleCreateGroupClick() {
    dispatch('createGroupClick');
  }
  
  function closeSearchModal() {
    showSearchModal = false;
    searchQuery = '';
  }
  
  function handleSearch(event: KeyboardEvent) {
    if (event.key === 'Enter' && searchQuery.trim()) {
      addToRecentSearches(searchQuery);
      // 검색 실행 로직
      closeSearchModal();
    }
  }
  
  function addToRecentSearches(query: string) {
    // 중복된 검색어가 있다면 제거
    recentSearches = recentSearches.filter(item => item.query !== query);
    
    // 새 검색어 추가
    recentSearches = [
      { query, date: new Date().toISOString() },
      ...recentSearches
    ].slice(0, 10); // 최대 10개만 유지
  }
  
  function removeFromRecentSearches(query: string) {
    recentSearches = recentSearches.filter(item => item.query !== query);
  }
  
  function clearAllRecentSearches() {
    recentSearches = [];
  }
  
  // 날짜 포맷팅
  function formatDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
      if (diffHours === 0) {
        const diffMinutes = Math.floor(diffTime / (1000 * 60));
        return `${diffMinutes}분 전`;
      }
      return `${diffHours}시간 전`;
    } else if (diffDays < 7) {
      return `${diffDays}일 전`;
    } else {
      return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
    }
  }
</script>

<header class="bg-white shadow-md">
  <div class="container mx-auto px-4 py-3 flex items-center justify-between">
    <!-- 좌측: 프로필 버튼 -->
    <button 
      class="p-2 rounded-full hover:bg-gray-100 transition-colors duration-200" 
      onclick={handleProfileClick}
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    </button>
    
    <!-- 가운데: 검색 버튼 -->
    <button 
      class="flex-1 mx-4 px-4 py-2 bg-gray-100 rounded-full text-left text-gray-500 hover:bg-gray-200 transition-colors duration-200 text-sm"
      onclick={handleSearchClick}
    >
      <div class="flex items-center">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <span>그룹 검색</span>
      </div>
    </button>
    
    <!-- 우측: 그룹 생성 버튼 -->
    <button 
      class="p-2 rounded-full hover:bg-gray-100 transition-colors duration-200"
      onclick={handleCreateGroupClick}
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
      </svg>
    </button>
  </div>
</header>

<!-- 검색 모달 -->
{#if showSearchModal}
  <div class="fixed inset-0 bg-white z-50 flex flex-col">
    <!-- 검색 헤더 -->
    <div class="container mx-auto px-4 py-3 flex items-center gap-3 border-b border-gray-200">
      <button 
        class="text-gray-500"
        onclick={closeSearchModal}
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
      
      <div class="flex-1 relative">
        <input 
          type="text" 
          placeholder="그룹 검색"
          class="w-full py-2 pl-8 pr-4 rounded-full bg-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
          bind:value={searchQuery}
          onkeydown={handleSearch}
          autofocus
        />
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        
        {#if searchQuery}
          <button 
            class="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            onclick={() => searchQuery = ''}
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        {/if}
      </div>
    </div>
    
    <!-- 최근 검색어 -->
    <div class="flex-1 overflow-y-auto">
      <div class="container mx-auto px-4 py-3">
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-sm font-medium text-gray-700">최근 검색어</h3>
          {#if recentSearches.length > 0}
            <button 
              class="text-xs text-blue-600 hover:text-blue-700"
              onclick={clearAllRecentSearches}
            >
              모두 지우기
            </button>
          {/if}
        </div>
        
        {#if recentSearches.length === 0}
          <div class="py-6 text-center text-gray-500 text-sm">
            최근 검색 내역이 없습니다
          </div>
        {:else}
          <div class="space-y-2">
            {#each recentSearches as search}
              <div class="flex items-center justify-between py-2">
                <div class="flex items-center gap-3">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span class="text-gray-700">{search.query}</span>
                </div>
                
                <div class="flex items-center gap-3">
                  <span class="text-xs text-gray-500">{formatDate(search.date)}</span>
                  <button 
                    class="text-gray-400 hover:text-gray-600"
                    onclick={() => removeFromRecentSearches(search.query)}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            {/each}
          </div>
        {/if}
      </div>
    </div>
  </div>
{/if} 