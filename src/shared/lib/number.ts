/**
 * 숫자를 K(천), M(백만) 단위로 변환하여 축약 표시합니다.
 * 예: 1200 -> "1.2K", 1500000 -> "1.5M"
 */
export function formatNumber(value: number, defaultValue: string = '-'): string {
  if (!value && value !== 0) return defaultValue;

  const abs = Math.abs(value);

  if (abs >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  } else if (abs >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }

  return formatWithCommas(value);
}

/**
 * 숫자를 한국식 축약 형태로 포맷합니다.
 * 예: 1234 -> "1.2천", 12345 -> "1.2만"
 */
export function formatNumberKo(num: number): string {
  if (num >= 100000000) {
    return `${(num / 100000000).toFixed(1)}억`;
  }
  if (num >= 10000) {
    return `${(num / 10000).toFixed(1)}만`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}천`;
  }
  return num.toLocaleString("ko-KR");
}

/**
 * 좋아요 수를 k 단위로 포맷합니다.
 * 예: 1000 -> "1k", 1300 -> "1.3k"
 */
export function formatLikesCount(count: number): string {
  if (count === 0) return "0";
  if (count < 1000) return count.toString();
  const k = count / 1000;
  if (k % 1 === 0) return `${k}k`;
  return `${k.toFixed(1)}k`;
}

/**
 * 금액을 원화 형식으로 포맷합니다.
 * 예: 10000 -> "₩10,000"
 */
export function formatCurrency(amount: number): string {
  return `₩${amount.toLocaleString("ko-KR")}`;
}

/**
 * 숫자를 천 단위 구분자(,)가 포함된 문자열로 변환합니다.
 * roundToThousands가 true인 경우 1,000원 단위로 내림 처리합니다.
 */
export function formatWithCommas(value: number, defaultValue: string = '-', roundToThousands: boolean = false): string {
  if (!value && value !== 0) return defaultValue;

  let processedValue = value;

  if (roundToThousands && Math.abs(value) >= 100) {
    processedValue = Math.floor(value / 1000) * 1000;
  }

  return processedValue.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * 메뉴 가격 문자열(예: "15,000", "10,000~20,000")을 숫자로 변환합니다.
 * 범위 형태의 경우 평균값을 반환합니다.
 */
export function parsePrice(priceStr: string): number {
  if (!priceStr || priceStr.trim() === '') return 0;

  if (priceStr.includes('~')) {
    const [minStr, maxStr] = priceStr.split('~');
    const min = parseInt(minStr.replace(/[^\d]/g, ''), 10);
    const max = parseInt(maxStr.replace(/[^\d]/g, ''), 10);
    return Math.floor((min + max) / 2);
  }

  return parseInt(priceStr.replace(/[^\d]/g, ''), 10);
}

/**
 * 메뉴 목록에서 평균 가격을 계산하여 원본 평균가와 1,000원 단위 반올림가를 반환합니다.
 */
export function calculateAveragePrice(menus: any[]): {originalPrice: number, roundedPrice: number} {
  if (!menus || menus.length === 0) {
    return { originalPrice: 0, roundedPrice: 0 };
  }

  const validMenus = menus.filter(menu => menu.price && typeof menu.price === 'string' && menu.price.trim() !== '');

  if (validMenus.length === 0) {
    return { originalPrice: 0, roundedPrice: 0 };
  }

  const totalPrice = validMenus.reduce((sum, menu) => sum + parsePrice(menu.price), 0);
  const avgPrice = Math.floor(totalPrice / validMenus.length);
  const roundedPrice = Math.floor(avgPrice / 1000) * 1000;

  return { originalPrice: avgPrice, roundedPrice: roundedPrice };
}
