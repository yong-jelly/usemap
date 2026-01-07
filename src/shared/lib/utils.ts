import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Tailwind 클래스를 병합하고 충돌을 해결합니다.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * 날짜를 상대적 시간으로 포맷합니다.
 */
export function formatRelativeTime(date: Date | string): string {
  const now = new Date();
  const target = typeof date === "string" ? new Date(date) : date;
  const diffMs = now.getTime() - target.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return "방금 전";
  if (diffMin < 60) return `${diffMin}분 전`;
  if (diffHour < 24) return `${diffHour}시간 전`;
  if (diffDay < 7) return `${diffDay}일 전`;
  
  return target.toLocaleDateString("ko-KR");
}

/**
 * 날짜를 D-n 형식으로 포맷합니다.
 */
export function formatDueDate(date: Date | string): string {
  const now = new Date();
  const target = typeof date === "string" ? new Date(date) : date;
  const nowDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const targetDate = new Date(target.getFullYear(), target.getMonth(), target.getDate());
  const diffMs = targetDate.getTime() - nowDate.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return "D-0";
  if (diffDays > 0) return `D-${diffDays}`;
  return `D+${Math.abs(diffDays)}`;
}

/**
 * 로딩 지연 설정 인터페이스
 */
export interface MinLoadingDelay {
  min: number;
  max: number;
}

/**
 * 기본 로딩 지연 시간 (ms)
 */
export const DEFAULT_MIN_LOADING_DELAY: MinLoadingDelay = {
  min: 300,
  max: 1000,
};

/**
 * 지정된 범위 내의 랜덤한 지연 시간을 반환합니다.
 */
export function getRandomDelay(min: number, max: number): number {
  if (min > max) throw new Error(`getRandomDelay: min (${min}) must be less than or equal to max (${max})`);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * 최소 로딩 지연 시간을 보장합니다.
 * UX를 위해 너무 빨리 로딩되는 것을 방지합니다.
 */
export async function ensureMinDelay(
  startTime: number,
  minDelay: MinLoadingDelay | null | undefined
): Promise<void> {
  if (!minDelay) return;
  const elapsed = Date.now() - startTime;
  const delay = getRandomDelay(minDelay.min, minDelay.max);
  if (elapsed < delay) {
    await new Promise((resolve) => setTimeout(resolve, delay - elapsed));
  }
}
