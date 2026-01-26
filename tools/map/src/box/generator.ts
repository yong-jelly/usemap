/**
 * 지리적 영역(Bounding Box) 생성 및 관리 모듈
 */
export class BoxGenerator {
  /**
   * 주어진 사각형 영역(box)을 지정된 km 단위의 격자로 분할합니다.
   * 
   * [알고리즘: 격자 분할(Grid Splitting)]
   * 1. 위도/경도 1km당 변화량을 상수로 계산 (근사치: 경도 88km, 위도 111km)
   * 2. 전체 영역의 가로(경도), 세로(위도) 길이를 km 단위 변화량으로 나누어 격자 수 계산
   * 3. 이중 반복문을 통해 각 격자의 시작점과 끝점 좌표를 생성
   * 4. 각 격자 간 미세한 중첩(0.0001)을 허용하여 경계면 데이터 누락 방지
   * 
   * @param box "시작경도;시작위도;끝경도;끝위도" 형식의 문자열
   * @param km 분할할 격자의 한 변의 길이 (단위: km)
   * @returns 분할된 박스 좌표 문자열 배열
   */
  static generate(box: string, km: number): string[] {
    const [startLon, startLat, endLon, endLat] = box.split(";").map(Number);
    if ([startLon, startLat, endLon, endLat].some((v) => Number.isNaN(v))) {
      throw new Error(`Invalid box format: ${box}`);
    }
    const PRECISION = 6; // 좌표 소수점 정밀도 (약 11cm 오차)

    // 지구 곡률을 고려한 km당 위경도 변화량 계산
    const LONGITUDE_PER_DISTANCE = parseFloat((km / 88).toFixed(PRECISION));
    const LATITUDE_PER_DISTANCE = parseFloat((km / 111).toFixed(PRECISION));

    const boxes: string[] = [];
    // 가로/세로 단계 수 계산
    const lonSteps = Math.ceil((endLon - startLon) / LONGITUDE_PER_DISTANCE);
    const latSteps = Math.ceil((endLat - startLat) / LATITUDE_PER_DISTANCE);

    for (let i = 0; i < lonSteps; i++) {
      const lon = parseFloat((startLon + (i * LONGITUDE_PER_DISTANCE)).toFixed(PRECISION));
      for (let j = 0; j < latSteps; j++) {
        const lat = parseFloat((startLat + (j * LATITUDE_PER_DISTANCE)).toFixed(PRECISION));
        
        // 끝점 계산 (경계면 데이터 유실 방지를 위해 0.0001 중첩 추가)
        let boxEndLon = parseFloat((lon + LONGITUDE_PER_DISTANCE + 0.0001).toFixed(PRECISION));
        let boxEndLat = parseFloat((lat + LATITUDE_PER_DISTANCE + 0.0001).toFixed(PRECISION));

        // 전체 영역의 경계를 벗어나지 않도록 조정
        if (boxEndLon > endLon) boxEndLon = endLon;
        if (boxEndLat > endLat) boxEndLat = endLat;

        boxes.push(`${lon.toFixed(PRECISION)};${lat.toFixed(PRECISION)};${boxEndLon.toFixed(PRECISION)};${boxEndLat.toFixed(PRECISION)}`);
      }
    }
    return boxes;
  }
}
