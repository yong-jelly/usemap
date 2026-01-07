import type { Menu } from "$lib/components/MenuGrid.svelte";

/**
 * 숫자를 K(천), M(백만) 단위로 변환합니다
 * @param value - 변환할 숫자
 * @param defaultValue - 숫자가 유효하지 않을 때 반환할 기본값 (기본값: '-')
 * @returns 예: '1.5K', '2.3M' 등
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
 * 숫자를 천 단위 구분자(,)가 포함된 문자열로 변환합니다
 * @param value - 변환할 숫자
 * @param defaultValue - 숫자가 유효하지 않을 때 반환할 기본값 (기본값: '-')
 * @param roundToThousands - 백 미만을 000으로 처리할지 여부 (기본값: false)
 * @returns 예: '1,234,567' 또는 roundToThousands가 true일 때 '1,000'
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
 * 메뉴 가격 문자열을 숫자로 변환합니다.
 * 범위 가격인 경우 중간 가격을 계산합니다.
 * @param priceStr 가격 문자열 (예: "10000" 또는 "89000~149000")
 * @returns 변환된 숫자 가격
 */
function parsePrice(priceStr: string): number {
  // 빈 문자열이나 숫자가 아닌 경우 0 반환
  if (!priceStr || priceStr.trim() === '') return 0;

  // 범위 가격인 경우 (예: "89000~149000")
  if (priceStr.includes('~')) {
    const [minStr, maxStr] = priceStr.split('~');
    const min = parseInt(minStr.replace(/[^\d]/g, ''), 10);
    const max = parseInt(maxStr.replace(/[^\d]/g, ''), 10);

    // 중간 가격 계산
    return Math.floor((min + max) / 2);
  }

  // 단일 가격인 경우
  return parseInt(priceStr.replace(/[^\d]/g, ''), 10);
}

/**
 * 메뉴 목록에서 평균 가격을 계산합니다.
 * @param menus 메뉴 목록
 * @returns {originalPrice: number, roundedPrice: number} 원래 평균 가격과 천원 단위로 버림한 가격
 */
export function calculateAveragePrice(menus: Menu[]): {originalPrice: number, roundedPrice: number} {
  if (!menus || menus.length === 0) {
    return { originalPrice: 0, roundedPrice: 0 };
  }

  // 유효한 가격이 있는 메뉴만 필터링
  const validMenus = menus.filter(menu => menu.price && menu.price.trim() !== '');

  if (validMenus.length === 0) {
    return { originalPrice: 0, roundedPrice: 0 };
  }

  // 각 메뉴의 가격을 숫자로 변환하고 합산
  const totalPrice = validMenus.reduce((sum, menu) => sum + parsePrice(menu.price), 0);

  // 평균 가격 계산
  const avgPrice = Math.floor(totalPrice / validMenus.length);

  // 천원 단위로 버림
  const roundedPrice = Math.floor(avgPrice / 1000) * 1000;

  return { originalPrice: avgPrice, roundedPrice: roundedPrice };
}
