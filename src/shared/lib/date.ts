/**
 * 날짜 관련 유틸리티 함수
 */

/**
 * 날짜를 '~전' 형식으로 변환합니다
 * @param date - 변환할 날짜
 * @param defaultValue - 날짜가 유효하지 않을 때 반환할 기본값 (기본값: '-')
 * @returns 예: '3분 전', '2시간 전', '1일 전' 등
 */
export function ago(date: string | Date | number, defaultValue: string = '-'): string {
  if (!date) return defaultValue;
  const target = new Date(date);
  if (isNaN(target.getTime())) return defaultValue;

  const now = new Date();
  const diffMs = now.getTime() - target.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffMonths = Math.floor(diffMs / (1000 * 60 * 60 * 24 * 30.44)); // 평균 한 달
  const diffYears = Math.floor(diffMs / (1000 * 60 * 60 * 24 * 365.25)); // 평균 한 해

  if (diffMinutes < 1) return '방금';
  if (diffMinutes < 60) return `${diffMinutes}분 전`;
  if (diffHours < 24) return `${diffHours}시간 전`;
  if (diffDays < 30) return `${diffDays}일 전`;
  if (diffMonths < 12) return `${diffMonths}개월 전`;
  return `${diffYears}년 전`;
}

/**
 * 날짜를 안전하게 포맷팅합니다
 * @param date - 포맷팅할 날짜
 * @param options - Intl.DateTimeFormat 옵션
 * @param defaultValue - 날짜가 유효하지 않을 때 반환할 기본값
 * @returns 포맷팅된 날짜 문자열
 */
export function safeFormatDate(
  date: string | Date | number,
  options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' },
  defaultValue: string = '-'
): string {
  if (!date) return defaultValue;
  try {
    const target = new Date(date);
    if (isNaN(target.getTime())) return defaultValue;
    return target.toLocaleDateString('ko-KR', options);
  } catch (error) {
    console.warn('Date parsing failed:', date, error);
    return defaultValue;
  }
}
