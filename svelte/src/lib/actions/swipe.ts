import type { Action } from 'svelte/action';

interface SwipeEvents {
  'on:swipe:start': (e: CustomEvent<TouchEvent>) => void;
  'on:swipe:move': (e: CustomEvent<TouchEvent>) => void;
  'on:swipe:end': (e: CustomEvent<TouchEvent>) => void;
}

export const swipe: Action<HTMLElement, void, SwipeEvents> = (node) => {
  const handleTouchStart = (e: TouchEvent) => {
    node.dispatchEvent(new CustomEvent('swipe:start', { detail: e }));
  };

  const handleTouchMove = (e: TouchEvent) => {
    node.dispatchEvent(new CustomEvent('swipe:move', { detail: e }));
  };

  const handleTouchEnd = (e: TouchEvent) => {
    node.dispatchEvent(new CustomEvent('swipe:end', { detail: e }));
  };

  node.addEventListener('touchstart', handleTouchStart);
  node.addEventListener('touchmove', handleTouchMove, { passive: false });
  node.addEventListener('touchend', handleTouchEnd);

  return {
    destroy() {
      node.removeEventListener('touchstart', handleTouchStart);
      node.removeEventListener('touchmove', handleTouchMove);
      node.removeEventListener('touchend', handleTouchEnd);
    }
  };
}; 