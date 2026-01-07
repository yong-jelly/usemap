<script lang="ts">
	import Indicator from '$lib/components/Indicator.svelte';
  import { supabase } from '$lib/supabase';
  import { authStore } from '$services/auth.store';
  import { supabasePlaceService } from '$services/supabase';
  import type { AuthUser, PlaceTag, TagMaster } from '$services/types';
/*
select * from tbl_tag_master_for_place;
*/
  // Props
  let { placeId } = $props<{ placeId: string }>();
  
  // State
  let allTags = $state<(TagMaster & { voteCount?: number })[]>([]);
  let selectedTags = $state<Set<string>>(new Set());
  let userTags = $state<Record<string, PlaceTag>>({});
  let loading = $state(true);
  let error = $state<string | null>(null);
  let currentUser = $state<AuthUser | null>(null);
  let popularTags = $state<any[]>([]);
  let showPopularTags = $state(true); // 인기 태그 보여줄지 여부
  let searchQuery = $state('');
  let filteredTags = $state<(TagMaster & { voteCount?: number })[]>([]);

  // 카테고리별 테두리 색상 설정
  const categoryColors: Record<string, string> = {
    'positive': 'border-emerald-500 text-emerald-600',
    'neutral': 'border-blue-500 text-blue-600',
    'negative': 'border-rose-500 text-rose-600',
    'hateful': 'border-red-500 text-red-600'
  };

  // 선택된 태그 스타일 (카테고리별)
  const selectedCategoryStyles: Record<string, string> = {
    'positive': 'border-2 border-emerald-500 bg-emerald-50 text-emerald-700',
    'neutral': 'border-2 border-blue-500 bg-blue-50 text-blue-700',
    'negative': 'border-2 border-rose-500 bg-rose-50 text-rose-700',
    'hateful': 'border-2 border-red-500 bg-red-50 text-red-700'
  };
  
  // 랜덤 투표수 생성
  function getRandomVoteCount() {
    return Math.floor(Math.random() * 9999) + 1;
  }
  
  // 카테고리 기반 스타일 가져오기
  function getTagStyle(tag: TagMaster, isSelected: boolean): string {
    const category = tag.category;
    const baseStyle = categoryColors[category] || 'border-gray-400 text-gray-700';
    
    if (isSelected) {
      return `${selectedCategoryStyles[category] || 'border-2 border-gray-500 bg-gray-50 text-gray-700'} font-medium shadow-sm`;
    }
    
    return `${baseStyle} border-gray-300`;
  }
  
  // 인증 상태 구독
  $effect(() => {
    const unsubscribe = authStore.subscribe((state) => {
      currentUser = state.isAuthenticated ? state : null;
    });
    return unsubscribe;
  });

  // 태그 필터링
  $effect(() => {
    if (searchQuery.trim() === '') {
      filteredTags = allTags;
    } else {
      const query = searchQuery.toLowerCase();
      filteredTags = allTags.filter(tag => 
        tag.tag_name.toLowerCase().includes(query) || 
        tag.tag_desc?.toLowerCase().includes(query)
      );
    }
  });

  // 초기 데이터 로드
  async function loadTags() {
    try {
      loading = true;
      error = null;
      
      // 태그 마스터 로드
      const { data, error: fetchError } = await supabase
        .from('tbl_tag_master_for_place')
        .select('*')
        .eq('is_active', true)
        .order('category')
        .order('tag_name');
      
      if (fetchError) {
        throw new Error(fetchError.message);
      }
      
      if (data) {
        // 모든 태그를 하나의 배열로 저장하고 랜덤 투표수 추가
        const tagsWithVotes = data.map(tag => ({
          ...tag,
          voteCount: getRandomVoteCount()
        }));
        
        allTags = tagsWithVotes;
        filteredTags = tagsWithVotes;
      }
      
      // 인기 태그 로드
      await loadPopularTags();
      
      // 현재 사용자가 이 장소에 추가한 태그 가져오기
      if (currentUser) {
        await loadUserTags();
      }
    } catch (err) {
      console.error('태그 로드 오류:', err);
      error = '태그를 불러오는 중 오류가 발생했습니다.';
    } finally {
      loading = false;
    }
  }
  
  // 인기 태그 로드
  async function loadPopularTags() {
    try {
      const { data, error: fetchError } = await supabasePlaceService.getPopularTagsForPlace(placeId, 12);
      
      if (fetchError) {
        console.error('인기 태그 로드 오류:', fetchError);
        return;
      }
      
      if (data && data.length > 0) {
        // 인기 태그 데이터에 랜덤 카운트 할당
        popularTags = data.map(tag => ({
          ...tag,
          tag_count: getRandomVoteCount()
        }));
      }
    } catch (err) {
      console.error('인기 태그 로드 오류:', err);
    }
  }
  
  // 사용자가 추가한 태그 로드
  async function loadUserTags() {
    if (!currentUser || !placeId) return;
    
    try {
      // RPC 대신 직접 테이블 접근
      const { data, error: fetchError } = await supabase
        .from('tbl_place_tag')
        .select('*')
        .eq('business_id', placeId)
        .eq('user_id', currentUser.id);
      
      if (fetchError) {
        console.error('사용자 태그 로드 오류:', fetchError);
        return;
      }
      
      if (data) {
        const tagMap: Record<string, PlaceTag> = {};
        const selectedTagIds = new Set<string>();
        
        data.forEach(tag => {
          tagMap[tag.tag_id] = tag;
          selectedTagIds.add(tag.tag_id);
        });
        
        userTags = tagMap;
        selectedTags = selectedTagIds;
      }
    } catch (err) {
      console.error('사용자 태그 로드 오류:', err);
    }
  }
  
  // 태그 선택/해제 토글
  async function toggleTag(tagId: string) {
    if (!currentUser) {
      // 로그인 필요
      authStore.login();
      return;
    }
    
    try {
      const isSelected = selectedTags.has(tagId);
      
      if (isSelected) {
        // 태그 삭제
        const tagToDelete = userTags[tagId];
        if (tagToDelete) {
          const { error: deleteError } = await supabase.from('tbl_place_tag').delete().eq('id', tagToDelete.id);
          
          if (deleteError) {
            throw new Error(deleteError.message);
          }
          
          // 로컬 상태 업데이트
          const newSelectedTags = new Set(selectedTags);
          newSelectedTags.delete(tagId);
          selectedTags = newSelectedTags;
          
          const newUserTags = { ...userTags };
          delete newUserTags[tagId];
          userTags = newUserTags;
        }
      } else {
        // 태그 추가
        const { data, error: addError } = await supabase.from('tbl_place_tag').insert({
          business_id: placeId,
          tag_id: tagId,
          user_id: currentUser.id
        }).returning('*');
        
        if (addError) {
          throw new Error(addError.message);
        }
        
        if (data) {
          // 로컬 상태 업데이트
          const newSelectedTags = new Set(selectedTags);
          newSelectedTags.add(tagId);
          selectedTags = newSelectedTags;
          
          userTags = {
            ...userTags,
            [tagId]: data[0]
          };
        }
      }
      
      // 인기 태그 갱신
      await loadPopularTags();
    } catch (err) {
      console.error('태그 토글 오류:', err);
      alert('태그 변경 중 오류가 발생했습니다.');
    }
  }
  
  // 태그 찾기
  function findTagById(tagId: string): TagMaster | undefined {
    return allTags.find(tag => tag.id === tagId);
  }
  
  // 컴포넌트 마운트 시 태그 데이터 로드
  $effect(() => {
    if (placeId) {
      loadTags();
    }
  });
</script>

<div class="mt-2 pb-6">
  {#if loading}
    <!-- <div class="flex justify-center p-8">
      <div class="h-10 w-10 animate-spin rounded-full border-4 border-b-transparent border-blue-500"></div>
    </div> -->
    <Indicator text="태그를 불러오는 중..." />
  {:else if error}
    <div class="rounded-lg bg-red-50 p-4 text-center text-red-600">
      <p>{error}</p>
      <button 
        class="mt-2 rounded-full bg-red-500 px-3 py-1 text-sm text-white"
        onclick={() => loadTags()}
      >
        다시 시도
      </button>
    </div>
  {:else}
    <!-- 인기 태그 섹션 -->
    {#if popularTags.length > 0 && showPopularTags}
      <div class="mb-6 px-4">
        <div class="mb-3 flex items-center justify-between">
          <h3 class="text-lg font-medium text-gray-800">✨ 인기 태그</h3>
          <button 
            class="rounded-full px-2 py-1 text-xs text-gray-500 hover:bg-gray-100"
            onclick={() => showPopularTags = false}
          >
            숨기기
          </button>
        </div>
        <div class="flex flex-wrap gap-2">
          {#each popularTags as tag}
            {@const tagData = findTagById(tag.tag_id)}
            {#if tagData}
              {@const isSelected = selectedTags.has(tag.tag_id)}
              {@const tagStyle = getTagStyle(tagData, isSelected)}
              <div class="flex items-stretch">
                <button
                  class="flex items-center gap-1 rounded-l-full border px-3 py-1.5 text-sm transition-all {tagStyle}"
                  onclick={() => isSelected ? null : toggleTag(tag.tag_id)}
                  title={tagData.tag_desc || ''}
                >
                  <span>#{tagData.tag_name}</span>
                  <span class="ml-1 rounded-full bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600">{tag.tag_count}</span>
                </button>
                {#if isSelected}
                  <button 
                    class="flex items-center justify-center rounded-r-full border-l-0 border-2 border-gray-300 bg-gray-50 px-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                    onclick={() => toggleTag(tag.tag_id)}
                    title="태그 제거"
                  >
                    <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                {/if}
              </div>
            {/if}
          {/each}
        </div>
      </div>
    {:else if !showPopularTags}
      <div class="mb-4 px-4">
        <button 
          class="flex items-center text-sm text-blue-500 hover:text-blue-600"
          onclick={() => showPopularTags = true}
        >
          <svg class="mr-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
          </svg>
          인기 태그 보기
        </button>
      </div>
    {/if}

    <!-- 검색 필터 -->
    <div class="mb-4 px-4">
      <div class="relative">
        <input
          type="text"
          placeholder="태그 검색..."
          bind:value={searchQuery}
          class="w-full rounded-full border border-gray-300 py-2 pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <svg class="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
        </svg>
      </div>
    </div>
    
    <!-- 모든 태그 목록 -->
    <div class="px-4">
      <div class="flex flex-wrap gap-2">
        {#each filteredTags as tag}
          {@const isSelected = selectedTags.has(tag.id)}
          {@const tagStyle = getTagStyle(tag, isSelected)}
          <div class="flex items-stretch">
            <button
              class="flex items-center gap-1 rounded-l-full border px-3 py-1.5 text-sm transition-all {tagStyle}"
              onclick={() => isSelected ? null : toggleTag(tag.id)}
              title={tag.tag_desc || ''}
            >
              <span>#{tag.tag_name}</span>
              <span class="ml-1 rounded-full bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600">{tag.voteCount}</span>
            </button>
            {#if isSelected}
              <button 
                class="flex items-center justify-center rounded-r-full border-l-0 border-2 border-gray-300 bg-gray-50 px-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                onclick={() => toggleTag(tag.id)}
                title="태그 제거"
              >
                <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            {/if}
          </div>
        {/each}
      </div>
      
      {#if filteredTags.length === 0}
        <div class="py-8 text-center text-gray-500">
          <p>검색 결과가 없습니다</p>
        </div>
      {/if}
    </div>
    
    {#if !currentUser}
      <div class="mt-6 mx-4 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 p-4 text-center shadow-sm">
        <p class="text-sm text-gray-700">태그를 추가하려면 로그인이 필요합니다</p>
        <button 
          class="mt-2 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 px-4 py-1.5 text-sm text-white transition-all hover:from-blue-600 hover:to-indigo-600 hover:shadow-md"
          onclick={() => authStore.login()}
        >
          로그인하기
        </button>
      </div>
    {/if}
  {/if}
</div> 