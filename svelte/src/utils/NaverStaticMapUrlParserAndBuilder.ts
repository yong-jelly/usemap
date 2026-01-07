
/**
 * https://www.perplexity.ai/search/error-errorcode-100-message-ba-tb9GStZ7TGy1qZafuzsvPA
 * NaverStaticMapUrlParserAndBuilder
 * 
 * - 주어진 네이버 Static Map URL에서 파라미터를 추출하여, 타입스크립트 객체로 변환합니다.
 * - 누락된 값은 기본값으로 채우고, 최종적으로 올바른 URL을 생성합니다.
 * - 모든 주요 처리 단계에 로그를 남깁니다.
 * 
 * 사용 예시:
 * const parser = new NaverStaticMapUrlParserAndBuilder(url);
 * const options = parser.getOptions(); // 파싱된 옵션 객체
 * const newUrl = parser.build(); // 완성된 URL
 */

type MapType = 'basic' | 'traffic' | 'satellite' | 'terrain';
type ImageFormat = 'png' | 'jpg' | 'jpeg' | 'png8';
type Language = 'ko' | 'en' | 'ja' | 'zh';
type CRS = 'EPSG:4326';

interface MarkerOptions {
  lng: number;
  lat: number;
  type?: 'c' | 'd';
  color?: string;
  label?: string;
  size?: 'mid' | 'small' | 'large';
  icon?: string;
  anchor?: string;
  viewSizeRatio?: number;
}

interface NaverStaticMapOptions {
  center: { lng: number; lat: number };
  level?: number;
  w?: number;
  h?: number;
  maptype?: MapType;
  format?: ImageFormat;
  scale?: 1 | 2;
  markers?: MarkerOptions[];
  lang?: Language;
  dataversion?: string;
  crs?: CRS;
  caller?: string;
}

export class NaverStaticMapUrlParserAndBuilder {
  private static readonly BASE_URL = 'https://simg.pstatic.net/static.map/v2/map/staticmap.bin';
  private options: NaverStaticMapOptions;

  /**
   * 생성자: URL을 받아 파라미터를 파싱하고, 누락된 값은 기본값으로 채웁니다.
   * @param url 네이버 Static Map 요청 URL
   */
  constructor(url: string) {
    console.log('[파싱 시작] 입력 URL:', url);

    // 1. URL 파라미터 파싱
    const urlObj = new URL(url);
    const params = urlObj.searchParams;

    // 2. center 파싱
    let centerParam = params.get('center');
    let center = { lng: 127.0, lat: 37.5 }; // 기본값: 서울
    if (centerParam) {
      const [lng, lat] = centerParam.split(',').map(Number);
      if (!isNaN(lng) && !isNaN(lat)) {
        center = { lng, lat };
      }
      console.log('[파싱] center:', center);
    } else {
      console.log('[기본값] center:', center);
    }

    // 3. level 파싱
    const level = 15//params.get('level') ? Number(params.get('level')) : 6;
    console.log('[파싱] level:', level);

    // 4. w, h 파싱 및 기본값
    const w = params.get('w') ? Number(params.get('w')) : 800;
    const h = params.get('h') ? Number(params.get('h')) : 600;
    console.log('[파싱] w:', w, 'h:', h);

    // 5. maptype, format, scale, lang, dataversion, crs, caller
    const maptype = (params.get('maptype') as MapType) || 'basic';
    const format = (params.get('format') as ImageFormat) || 'png';
    const scale = params.get('scale') ? Number(params.get('scale')) as 1 | 2 : 1;
    const lang = (params.get('lang') as Language) || 'ko';
    const dataversion = params.get('dataversion') || undefined;
    const crs = (params.get('crs') as CRS) || undefined;
    const caller = params.get('caller') || 'naver_mstore';

    console.log('[파싱] maptype:', maptype, 'format:', format, 'scale:', scale, 'lang:', lang, 'dataversion:', dataversion, 'crs:', crs, 'caller:', caller);

    // 6. markers 파싱
    let markers: MarkerOptions[] = [];
    const markersParam = params.getAll('markers');
    if (markersParam.length > 0) {
      markers = markersParam.map(markerStr => {
        // 예시: pos:126.2495208 33.400232|type:c|color:blue|label:restaurant
        const parts = markerStr.split('|');
        let marker: MarkerOptions = { lng: 127.0, lat: 37.5 };
        for (const part of parts) {
          const [key, value] = part.split(':');
          switch (key) {
            case 'pos':
              const [lng, lat] = value.split(' ').map(Number);
              marker.lng = lng;
              marker.lat = lat;
              break;
            case 'type':
              marker.type = value as 'c' | 'd';
              break;
            case 'color':
              marker.color = value;
              break;
            case 'label':
              marker.label = decodeURIComponent(value);
              break;
            case 'size':
              marker.size = value as 'mid' | 'small' | 'large';
              break;
            case 'icon':
              marker.icon = decodeURIComponent(value);
              break;
            case 'anchor':
              marker.anchor = value;
              break;
            case 'viewSizeRatio':
              marker.viewSizeRatio = Number(value);
              break;
            default:
              break;
          }
        }
        return marker;
      });
      console.log('[파싱] markers:', markers);
    } else {
      console.log('[기본값] markers: 없음');
    }

    // 7. 옵션 객체 구성
    this.options = {
      center,
      level,
      w,
      h,
      maptype,
      format,
      scale,
      markers,
      lang,
      dataversion,
      crs,
      caller,
    };
    console.log('[최종 옵션]', this.options);
  }

  /**
   * 마커 파라미터를 네이버 API 형식의 문자열로 변환합니다.
   */
  private buildMarkers(): string[] {
    if (!this.options.markers || this.options.markers.length === 0) return [];
    return this.options.markers.map(marker => {
      const parts: string[] = [];
      parts.push(`pos:${marker.lng} ${marker.lat}`);
      if (marker.type) parts.push(`type:${marker.type}`);
      if (marker.color) parts.push(`color:${marker.color}`);
      if (marker.label) parts.push(`label:${encodeURIComponent(marker.label)}`);
      if (marker.size) parts.push(`size:${marker.size}`);
      if (marker.icon) parts.push(`icon:${encodeURIComponent(marker.icon)}`);
      if (marker.anchor) parts.push(`anchor:${marker.anchor}`);
      if (marker.viewSizeRatio) parts.push(`viewSizeRatio:${marker.viewSizeRatio}`);
      return parts.join('|');
    });
  }

  /**
   * 옵션 객체를 반환합니다.
   */
  public getOptions(): NaverStaticMapOptions {
    return this.options;
  }

  /**
   * 네이버 Static Map API 요청 URL을 생성합니다.
   * @returns 완성된 URL 문자열
   */
  public build(): string {
    const params: string[] = [];

    params.push(`center=${this.options.center.lng},${this.options.center.lat}`);
    params.push(`level=${this.options.level}`);
    params.push(`w=${this.options.w}`);
    params.push(`h=${this.options.h}`);
    params.push(`maptype=${this.options.maptype}`);
    params.push(`format=${this.options.format}`);
    params.push(`scale=${this.options.scale}`);
    params.push(`lang=${this.options.lang}`);
    if (this.options.dataversion) params.push(`dataversion=${this.options.dataversion}`);
    if (this.options.crs) params.push(`crs=${this.options.crs}`);
    if (this.options.caller) params.push(`caller=${this.options.caller}`);

    // 마커
    const markerParams = this.buildMarkers();
    markerParams.forEach(markerStr => {
      params.push(`markers=${markerStr}`);
    });

    const url = `${NaverStaticMapUrlParserAndBuilder.BASE_URL}?${params.join('&')}`;
    console.log('[URL 생성] 최종 URL:', url);
    return url;
  }
}

// ===== 사용 예시 =====
// const url = 'https://simg.pstatic.net/static.map/v2/map/staticmap.bin?center=126.2495208%2C33.400232&level=16&dataversion=174.14&caller=naver_mstore&markers=pos%3A126.2495208%2033.400232%7Ctype%3Ac%7Ccolor%3Ablue%7Clabel%3Arestaurant';

// const parser = new NaverStaticMapUrlParserAndBuilder(url);
// const options = parser.getOptions(); // 파싱된 옵션 객체
// const newUrl = parser.build(); // 완성된 URL

// console.log('[결과] 옵션:', options);
// console.log('[결과] 최종 URL:', newUrl);
