/**
 * 스크롤 이벤트 핸들러 타입
 */
export type ScrollEventHandler = (scrollY: number) => void;

/**
 * 스크롤 방향 타입
 */
export enum ScrollDirection {
  UP = 'up',
  DOWN = 'down',
  NONE = 'none',
}

/**
 * 스크롤 매니저 옵션 인터페이스
 */
export interface ScrollManagerOptions {
  /** 헤더 숨김/표시에 필요한 스크롤 임계값 */
  headerThreshold?: number;
  /** 새로고침 트리거를 위한 임계값 (음수) */
  refreshThreshold?: number;
  /** 디버그 모드 활성화 여부 */
  debug?: boolean;
}

/**
 * 스크롤 관리 클래스
 * 페이지 스크롤 감지 및 헤더 표시/숨김, 당겨서 새로고침 기능 등을 관리
 */
export class ScrollManager {
  private containerElement: HTMLElement | null = null;
  private lastScrollY: number = 0;
  private currentScrollY: number = 0;
  private scrollDirection: ScrollDirection = ScrollDirection.NONE;
  private isMobile: boolean;
  private styleElement: HTMLStyleElement | null = null;
  
  // 콜백 함수들
  private onScrollCallbacks: ScrollEventHandler[] = [];
  private onDirectionChangeCallbacks: Map<ScrollDirection, ScrollEventHandler[]> = new Map([
    [ScrollDirection.UP, []],
    [ScrollDirection.DOWN, []],
  ]);
  private onRefreshTriggeredCallbacks: ScrollEventHandler[] = [];
  
  // 설정 옵션
  private options: Required<ScrollManagerOptions> = {
    headerThreshold: 5,
    refreshThreshold: -100,
    debug: false,
  };
  
  /**
   * 스크롤 매니저 생성자
   * @param options 스크롤 매니저 설정 옵션
   */
  constructor(options?: ScrollManagerOptions) {
    // 옵션 병합
    if (options) {
      this.options = { ...this.options, ...options };
    }
    
    // 모바일 기기 감지
    this.isMobile = this.detectMobile();
    
    this.log('ScrollManager 초기화됨, 모바일 기기:', this.isMobile);
  }
  
  /**
   * 스크롤 관리 초기화
   * @returns 정리 함수 (clean-up function)
   */
  public initialize(): () => void {
    this.log('스크롤 관리 초기화 시작');
    
    // 스타일 요소 생성 및 추가
    this.styleElement = document.createElement('style');
    this.styleElement.textContent = `
      html, body {
        height: 100% !important;
        overflow: hidden !important;
        margin: 0 !important;
        padding: 0 !important;
      }
      
      .scroll-container {
        height: 100vh;
        overflow-y: auto;
        overflow-x: hidden;
        width: 100%;
        position: fixed;
        top: 0;
        left: 0;
        overscroll-behavior-y: contain;
        -webkit-overflow-scrolling: touch;
      }
      
      /* PC에서 스크롤 오버풀(음수 스크롤) 지원 */
      .enable-overscroll {
        overscroll-behavior-y: auto;
      }
    `;
    document.head.appendChild(this.styleElement);
    
    // 다음 프레임에서 스크롤 영역 높이 체크 (초기화 이후)
    requestAnimationFrame(() => {
      if (this.containerElement) {
        this.log('스크롤 영역 높이:', this.containerElement.scrollHeight);
      }
    });
    
    this.log('스크롤 컨테이너 스타일 설정 완료');
    
    // 정리 함수
    return () => {
      this.cleanup();
    };
  }
  
  /**
   * 스크롤 컨테이너 요소 설정
   * @param element 스크롤 컨테이너 요소
   */
  public setContainerElement(element: HTMLElement): void {
    this.containerElement = element;
    
    if (this.containerElement) {
      // PC 브라우저에서도 오버풀 허용 (새로고침 지원)
      if (!this.isMobile) {
        this.containerElement.classList.add('enable-overscroll');
      }
      
      // 스크롤 이벤트 리스너 추가
      this.containerElement.addEventListener('scroll', this.handleScroll.bind(this), { passive: true });
      
      this.log('스크롤 컨테이너 요소 설정됨:', this.containerElement);
    }
  }
  
  /**
   * 스크롤 이벤트 발생 시 호출될 콜백 등록
   * @param callback 콜백 함수
   * @returns 콜백 제거 함수
   */
  public onScroll(callback: ScrollEventHandler): () => void {
    this.onScrollCallbacks.push(callback);
    return () => {
      this.onScrollCallbacks = this.onScrollCallbacks.filter(cb => cb !== callback);
    };
  }
  
  /**
   * 스크롤 방향 변경 시 호출될 콜백 등록
   * @param direction 스크롤 방향
   * @param callback 콜백 함수
   * @returns 콜백 제거 함수
   */
  public onDirectionChange(direction: ScrollDirection, callback: ScrollEventHandler): () => void {
    const callbacks = this.onDirectionChangeCallbacks.get(direction) || [];
    callbacks.push(callback);
    this.onDirectionChangeCallbacks.set(direction, callbacks);
    
    return () => {
      const updatedCallbacks = (this.onDirectionChangeCallbacks.get(direction) || [])
        .filter(cb => cb !== callback);
      this.onDirectionChangeCallbacks.set(direction, updatedCallbacks);
    };
  }
  
  /**
   * 새로고침 트리거 시 호출될 콜백 등록
   * @param callback 콜백 함수
   * @returns 콜백 제거 함수
   */
  public onRefreshTriggered(callback: ScrollEventHandler): () => void {
    this.onRefreshTriggeredCallbacks.push(callback);
    return () => {
      this.onRefreshTriggeredCallbacks = this.onRefreshTriggeredCallbacks.filter(cb => cb !== callback);
    };
  }
  
  /**
   * 현재 스크롤 위치 반환
   * @returns 현재 스크롤 위치
   */
  public getScrollY(): number {
    return this.currentScrollY;
  }
  
  /**
   * 현재 스크롤 방향 반환
   * @returns 현재 스크롤 방향
   */
  public getScrollDirection(): ScrollDirection {
    return this.scrollDirection;
  }
  
  /**
   * 스크롤을 맨 위로 이동
   * @param behavior 스크롤 행동 방식 (smooth 또는 auto)
   */
  public scrollToTop(behavior: ScrollBehavior = 'auto'): void {
    if (this.containerElement) {
      this.containerElement.scrollTo({
        top: 0,
        behavior: behavior
      });
      this.log('스크롤을 맨 위로 이동:', behavior);
    }
  }
  
  /**
   * 리소스 정리
   */
  private cleanup(): void {
    // 스타일 요소 제거
    if (this.styleElement && document.head.contains(this.styleElement)) {
      document.head.removeChild(this.styleElement);
      this.styleElement = null;
    }
    
    // 이벤트 리스너 제거
    if (this.containerElement) {
      this.containerElement.removeEventListener('scroll', this.handleScroll.bind(this));
      this.containerElement = null;
    }
    
    this.log('스크롤 매니저 리소스 정리 완료');
  }
  
  /**
   * 스크롤 이벤트 핸들러
   * @param event 스크롤 이벤트
   */
  private handleScroll(event: Event): void {
    const target = event.target as HTMLElement;
    this.currentScrollY = target.scrollTop;
    
    // 스크롤 방향 결정
    this.determineScrollDirection();
    
    // 모든 스크롤 이벤트 콜백 호출
    for (const callback of this.onScrollCallbacks) {
      callback(this.currentScrollY);
    }
    
    // 새로고침 트리거 확인
    this.checkRefreshTrigger();
    
    // 스크롤 위치 업데이트
    this.lastScrollY = this.currentScrollY;
  }
  
  /**
   * 스크롤 방향 결정 및 방향 변경 시 콜백 호출
   */
  private determineScrollDirection(): void {
    const prevDirection = this.scrollDirection;
    
    if (this.currentScrollY < 0) {
      // 음수 스크롤 (당겨서 새로고침 영역)
      this.scrollDirection = ScrollDirection.UP;
    } else if (this.currentScrollY > this.lastScrollY + this.options.headerThreshold) {
      // 기준 이상으로 아래로 스크롤
      this.scrollDirection = ScrollDirection.DOWN;
    } else if (this.currentScrollY < this.lastScrollY - this.options.headerThreshold) {
      // 기준 이상으로 위로 스크롤
      this.scrollDirection = ScrollDirection.UP;
    } else {
      // 임계값 내의 스크롤은 방향 변경으로 간주하지 않음
      return;
    }
    
    // 방향이 변경된 경우에만 콜백 호출
    if (prevDirection !== this.scrollDirection) {
      this.log('스크롤 방향 변경:', prevDirection, '->', this.scrollDirection);
      
      const callbacks = this.onDirectionChangeCallbacks.get(this.scrollDirection) || [];
      for (const callback of callbacks) {
        callback(this.currentScrollY);
      }
    }
  }
  
  /**
   * 새로고침 트리거 확인
   */
  private checkRefreshTrigger(): void {
    // 음수 스크롤이 새로고침 임계값 이하인 경우
    if (this.currentScrollY <= this.options.refreshThreshold) {
      this.log('새로고침 트리거됨:', this.currentScrollY);
      
      // 새로고침 트리거 콜백 호출
      for (const callback of this.onRefreshTriggeredCallbacks) {
        callback(this.currentScrollY);
      }
    }
  }
  
  /**
   * 모바일 기기 감지
   * @returns 모바일 기기 여부
   */
  private detectMobile(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }
  
  /**
   * 디버그 로그 출력
   * @param args 로그 인자
   */
  private log(...args: any[]): void {
    if (this.options.debug) {
      console.log('[ScrollManager]', ...args);
    }
  }
} 