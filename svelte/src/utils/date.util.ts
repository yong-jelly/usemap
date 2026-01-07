import dayjs from 'dayjs';

interface DateFormatOptions {
  date: string | Date | number;
  format?: string;
}

/**
 * 날짜를 원하는 포맷으로 변환합니다
 * @param options.date - 변환할 날짜
 * @param options.format - 출력 포맷 (기본값: 'YYYY-MM-DD HH:mm:ss')
 */
export function formatter({ date, format = 'YYYY-MM-DD HH:mm:ss' }: DateFormatOptions): string {
  if (!date) return '';
  return dayjs(date).format(format);
}

export function agoSeconds(seconds: number, defaultValue: string = '-'): string {
  if (seconds < 60) {
    return '방금';
  } else if (seconds < 3600) {
    return `${Math.floor(seconds / 60)}분 전`;
  } else if (seconds < 86400) {
    return `${Math.floor(seconds / 3600)}시간 전`;
  } else if (seconds < 604800) {
    return `${Math.floor(seconds / 86400)}일 전`;
  } else if (seconds < 2629746) {
    return `${Math.floor(seconds / 2629746)}개월 전`;
  } else {
    return `${Math.floor(seconds / 31556952)}년 전`;
  }
}
/**
 * 날짜를 '~전' 형식으로 변환합니다
 * @param date - 변환할 날짜
 * @param defaultValue - 날짜가 유효하지 않을 때 반환할 기본값 (기본값: '')
 * @returns 예: '3분 전', '2시간 전', '1일 전' 등
 */
export function ago(date: string | Date | number, defaultValue: string = '-'): string {
  if (!date) return defaultValue;

  const target = dayjs(date);
  if (!target.isValid()) return defaultValue;

  const now = dayjs();
  const diffMinutes = now.diff(target, 'minute');
  const diffHours = now.diff(target, 'hour');
  const diffDays = now.diff(target, 'day');
  const diffMonths = now.diff(target, 'month');
  const diffYears = now.diff(target, 'year');
  if (diffMinutes < 1) {
    return '방금';
  } else if (diffMinutes < 60) {
    return `${diffMinutes}분 전`;
  } else if (diffHours < 24) {
    return `${diffHours}시간 전`;
  } else if (diffDays < 30) {
    return `${diffDays}일 전`;
  } else if (diffMonths < 12) {
    return `${diffMonths}개월 전`;
  } else {
    return `${diffYears}년 전`;
  }
}

/**
 * 날짜를 모바일 호환 형식으로 안전하게 파싱합니다
 * @param date - 파싱할 날짜 문자열
 * @param options - 로케일 옵션
 * @param defaultValue - 날짜가 유효하지 않을 때 반환할 기본값
 * @returns 포맷된 날짜 문자열 또는 기본값
 */
export function safeFormatDate(
  date: string | Date | number,
  options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' },
  defaultValue: string = '-'
): string {
  if (!date) return defaultValue;

  try {
    const target = dayjs(date);
    if (!target.isValid()) return defaultValue;

    // dayjs를 사용하여 안전하게 파싱
    return target.toDate().toLocaleDateString('ko-KR', options);
  } catch (error) {
    console.warn('날짜 파싱 실패:', date, error);
    return defaultValue;
  }
}
