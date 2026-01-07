/**
 * 전역 window 인터페이스 확장 (GTM dataLayer 대응)
 */
declare global {
  interface Window {
    dataLayer: Array<Record<string, unknown>>;
  }
}

/**
 * Google Tag Manager의 dataLayer에 이벤트를 전송합니다.
 */
export function pushToDataLayer(
  eventName: string,
  data?: Record<string, unknown>
): void {
  if (typeof window === 'undefined' || !window.dataLayer) {
    if (import.meta.env.DEV) {
      console.warn('[GTM] dataLayer is not available');
    }
    return;
  }

  const eventData: Record<string, unknown> = {
    event: eventName,
    ...data,
  };

  window.dataLayer.push(eventData);

  // 개발 환경에서 로그 출력
  if (import.meta.env.DEV) {
    console.log('[GTM] Event pushed:', eventData);
  }
}

/**
 * 페이지 뷰 이벤트를 전송합니다. (SPA 라우팅 시 수동 호출)
 */
export function trackPageView(path: string, title?: string): void {
  pushToDataLayer('page_view', {
    page_path: path,
    page_title: title || document.title,
    page_location: window.location.href,
  });
}

/**
 * 사용자 정의 상호작용 이벤트를 전송합니다.
 */
export function trackEvent(
  eventName: string,
  eventData?: Record<string, unknown>
): void {
  pushToDataLayer(eventName, eventData);
}
