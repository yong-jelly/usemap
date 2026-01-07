<script lang="ts">
  // 로딩 텍스트와 크기, 색상, 컨테이너 스타일 등을 props로 받을 수 있도록 개선
  let { children,
    text = '로딩 중...',
    size = 'md',
    color = 'indigo',
    fullscreen = false,
    containerClass = '',
    speed = 'normal',
    showText = true,
    thickness = 'normal'
  } = $props<{
    text?: string;
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    color?: 'indigo' | 'blue' | 'rose' | 'amber' | 'green' | 'gray' | 'white';
    fullscreen?: boolean;
    containerClass?: string;
    speed?: 'slow' | 'normal' | 'fast';
    showText?: boolean;
    thickness?: 'thin' | 'normal' | 'thick';
  }>();
  
  // 크기별 스타일 매핑
  const sizeMap: Record<string, string> = {
    xs: 'h-4 w-4',
    sm: 'h-8 w-8',
    md: 'h-12 w-12',
    lg: 'h-16 w-16',
    xl: 'h-20 w-20'
  };
  
  // 색상별 스타일 매핑
  const colorMap: Record<string, string> = {
    indigo: 'text-indigo-500',
    blue: 'text-blue-500',
    rose: 'text-rose-500',
    amber: 'text-amber-500',
    green: 'text-green-500',
    gray: 'text-gray-400',
    white: 'text-white'
  };
  
  // 속도별 애니메이션 매핑
  const speedMap: Record<string, string> = {
    slow: 'animate-spin-slow',
    normal: 'animate-spin',
    fast: 'animate-spin-fast'
  };
  
  // 두께별 테두리 매핑
  const thicknessMap: Record<string, string> = {
    thin: 'border-[2px] md:border-[2px]',
    normal: 'border-[3px] md:border-4',
    thick: 'border-[4px] md:border-[6px]'
  };
  
  // 실제 적용할 스타일 계산
  const spinnerSize = sizeMap[size];
  const spinnerColor = colorMap[color];
  const spinnerSpeed = speedMap[speed];
  const spinnerThickness = thicknessMap[thickness];
  
  // 컨테이너 클래스 계산
  const containerStyle = `flex items-center justify-center ${fullscreen ? 'fixed inset-0 z-50 bg-white/80 dark:bg-gray-900/80' : 'py-4'} ${containerClass}`;
</script>

<div class={containerStyle}>
  <div class="text-center">
    <!-- 최적화된 스피너 디자인 -->
    <div class={`${spinnerSize} mx-auto relative`}>
      <!-- 배경 원 -->
      <div class={`absolute inset-0 rounded-full ${spinnerColor} opacity-20 ${spinnerThickness} border-solid border-current`}></div>
      <!-- 회전하는 원 -->
      <div class={`absolute inset-0 rounded-full ${spinnerColor} ${spinnerSpeed} ${spinnerThickness} border-solid border-current border-t-transparent shadow-sm`}></div>
    </div>
    
    {#if showText}
    <h2 class="mt-4 text-sm md:text-base font-medium text-gray-800 dark:text-gray-200">{text}</h2>
    <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
      {@render children?.()}
    </p>
    {/if}
  </div>
</div>

<style>
  /* 스피너 애니메이션 부드럽게 최적화 */
  .animate-spin {
    animation: spin 1s linear infinite;
  }
  
  .animate-spin-slow {
    animation: spin 1.5s linear infinite;
  }
  
  .animate-spin-fast {
    animation: spin 0.6s linear infinite;
  }
  
  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
</style>
