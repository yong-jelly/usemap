<script lang="ts">
  import { createBubbler, stopPropagation } from 'svelte/legacy';

  const bubble = createBubbler();
  import { onMount } from 'svelte';
  import Detail from '../../../routes/place/Detail.svelte';
	import { placePopupStore } from '$lib/stores/place-popup.store.svelte';
	import { uiStore } from '$lib/stores/ui.store';
  import { swipe } from '$lib/actions/swipe';
  
  // 스와이프 제스처 관련 변수
  let touchStartX = 0;
  let touchStartY = 0;
  let touchMoveX = 0;
  let swipeDirection: 'horizontal' | 'vertical' | null = null;
  let popupTranslateX = $state(0);
  let popupOpacity = $state(1);
  
  function closePopup() {
    if (history.state?.popup === 'place-detail') {
      history.back();
    } else {
      placePopupStore.hide();
    }
  }
  
  // 터치 시작 핸들러
  function handleTouchStart(e: CustomEvent<TouchEvent>) {
    const originalEvent = e.detail;
    const target = originalEvent.target as HTMLElement;
    // Hero 컴포넌트 내부에서 스와이프 시 팝업이 움직이지 않도록 처리
    if (target.closest('[data-hero-swipe-container]')) {
      touchStartX = 0;
      return;
    }
    touchStartX = originalEvent.touches[0].clientX;
    touchStartY = originalEvent.touches[0].clientY;
    touchMoveX = touchStartX;
    swipeDirection = null;
  }
  
  // 터치 이동 핸들러
  function handleTouchMove(e: CustomEvent<TouchEvent>) {
    const originalEvent = e.detail;
    if (touchStartX === 0) return;

    touchMoveX = originalEvent.touches[0].clientX;
    const touchMoveY = originalEvent.touches[0].clientY;
    const deltaX = touchMoveX - touchStartX;
    const deltaY = touchMoveY - touchStartY;

    if (swipeDirection === null) {
      // 스와이프 방향 결정
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        swipeDirection = 'horizontal';
      } else {
        swipeDirection = 'vertical';
      }
    }

    if (swipeDirection === 'horizontal') {
      // 수평 스와이프 시, 브라우저의 기본 동작(뒤로가기 등)을 막습니다.
      // 이 로직은 touch-action과 함께 이중으로 보호합니다.
      originalEvent.preventDefault();
      
      // 오른쪽으로 스와이프하는 경우에만 처리
      const newTranslateX = Math.max(0, deltaX);
      popupTranslateX = newTranslateX;
      popupOpacity = 1 - newTranslateX / 300; // 300px 이동 시 완전히 투명해짐
    }
  }
  
  // 터치 종료 핸들러
  function handleTouchEnd() {
    if (touchStartX === 0) return;

    if (swipeDirection === 'horizontal') {
      const deltaX = touchMoveX - touchStartX;
      if (deltaX > 100) { // 100px 이상 스와이프하면 닫기
        closePopup();
      } else {
        // 원래 위치로 복귀
        popupTranslateX = 0;
        popupOpacity = 1;
      }
    }

    touchStartX = 0;
    touchMoveX = 0;
    swipeDirection = null;
  }

  // ESC 키 이벤트 핸들러
  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      closePopup();
    }
  }
  
  // 팝업 열기 전에 배경 스크롤 방지
  $effect(() => {
    // 팝업의 상태에 따라 하단 네비게이션 표시 여부 업데이트
    uiStore.update(state => {
      return {
        ...state,
        isBottomNavVisible: !placePopupStore.isOpen
      };
    });

    if (placePopupStore.isOpen) {
      // 팝업이 다시 열릴 때 위치와 투명도 초기화
      popupTranslateX = 0;
      popupOpacity = 1;
      
      // 뒤로가기 제어를 위해 history state 추가
      if (history.state?.popup !== 'place-detail') {
        history.pushState({ popup: 'place-detail' }, '', window.location.href);
      }

      document.body.style.overflow = 'hidden';
      // ESC 키 이벤트 추가
      window.addEventListener('keydown', handleKeyDown);
      window.addEventListener('popstate', handlePopState);
    } else {
      document.body.style.overflow = '';
      // ESC 키 이벤트 제거
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('popstate', handlePopState);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('popstate', handlePopState);
    };
  });
  
  // 뒤로가기 버튼 이벤트 처리
  function handlePopState() {
    if (placePopupStore.isOpen) {
      placePopupStore.hide();
    }
  }
  
  // 컴포넌트 마운트 시 이벤트 리스너 추가
  onMount(() => {
    return () => {
      document.body.style.overflow = '';
    };
  });
</script>

{#if placePopupStore.isOpen && placePopupStore.placeId}
  <div 
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
    onclick={closePopup}
  >
    <div 
      class="relative flex flex-col w-full max-w-lg overflow-hidden bg-white shadow-xl transition-all duration-300 ease-in-out dark:bg-neutral-900 h-full md:h-auto md:max-h-[90vh] md:rounded-lg"
      style="transform: translateX({popupTranslateX}px); opacity: {popupOpacity}; touch-action: pan-y;"
      onclick={stopPropagation(bubble('click'))}
      use:swipe
      onswipe:start={handleTouchStart}
      onswipe:move={handleTouchMove}
      onswipe:end={handleTouchEnd}
    >
      <div class="flex-1 overflow-y-auto scrollbar-hide">
        <Detail placeId={placePopupStore.placeId} />
      </div>
    </div>
  </div>
{/if} 