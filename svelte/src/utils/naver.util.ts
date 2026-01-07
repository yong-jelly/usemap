
/**
 * 원본 이미지 URL을 네이버 이미지 리사이징 URL 형식으로 변환합니다.
 * @param originalUrl 원본 이미지 URL
 * @param width 리사이징할 너비 (기본값: 278)
 * @param altText 이미지 대체 텍스트 (기본값: '이미지')
 * @returns 네이버 리사이징 형식의 HTML img 태그
 */
export function convertToNaverResizeImageUrl(
  originalUrl: string,
  width: number = 560, // 278, w1500_60
  altText: string = '이미지'
): string {
  // URL 인코딩 (2번 인코딩 필요 - 네이버 리사이징 URL 형식에 맞춤)
  const encodedUrl = encodeURIComponent(originalUrl);

  // 네이버 리사이징 URL 형식 생성
  const resizeBaseUrl = `https://search.pstatic.net/common/?autoRotate=true&type=w${width}_sharpen&src=`;
  //   console.log(`${resizeBaseUrl}${encodedUrl}`);
  return `${resizeBaseUrl}${encodedUrl}`;
}
/**
 * 원본 이미지 URL을 네이버 이미지 리사이징 URL 형식으로 변환합니다.
 * @param originalUrl 원본 이미지 URL
 * @param width 리사이징할 너비 (기본값: 560)
 * @param altText 이미지 대체 텍스트 (기본값: '이미지')
 * @param quality 품질 (기본값: 95)
 * https://search.pstatic.net/common/?autoRotate=true&amp;quality=95&amp;type=f320_320&amp;src=https%3A%2F%2Fnaverbooking-phinf.pstatic.net%2F20250521_283%2F1747813209245eLMR0_JPEG%2F1747799712985.jpg
 * @returns 네이버 리사이징 형식의 URL
 */
export function convertToNaverResizeImageUrlWithQuality(
  originalUrl: string,
  width: number = 320, // 278, w1500_60
  quality: number = 320,
): string {
  // URL 인코딩
  const encodedUrl = encodeURIComponent(originalUrl);

  // 네이버 리사이징 URL 형식 생성 (품질 95 포함)
  const resizeBaseUrl = `https://search.pstatic.net/common/?autoRotate=true&quality=${quality}&type=f${width}_${width}&src=`;
  // console.log(`${resizeBaseUrl}${encodedUrl}`);
  return `${resizeBaseUrl}${encodedUrl}`;
}

/**
 * 원본 이미지 URL을 네이버 이미지 URL 형식으로 변환합니다. (일반 이미지용)
 * @param originalUrl 원본 이미지 URL
 * @returns 네이버 이미지 URL
 */
// <img src="https://search.pstatic.net/common/?src=https%3A%2F%2Fldb-phinf.pstatic.net%2F20250503_1%2F17462477673230OB5u_JPEG%2F1745906418785.jpg" alt="" loading="lazy">
export function convertToNaverUrl(
  originalUrl: string
): string {
  // URL 인코딩
  const encodedUrl = encodeURIComponent(originalUrl);
  // 네이버 리사이징 URL 형식 생성 (품질 95 포함)
  const resizeBaseUrl = `https://search.pstatic.net/common/?src=`;
  return `${resizeBaseUrl}${encodedUrl}`;
}
