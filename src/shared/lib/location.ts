/**
 * 지리적 위치 정보 인터페이스
 */
interface GeolocationResult {
  latitude: number;
  longitude: number;
}

/**
 * 위치 정보 조회를 위한 옵션 인터페이스
 */
interface GeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
}

/**
 * 브라우저 내장 Geolocation API를 사용하여 현재 위치를 가져옵니다.
 */
const getBrowserLocation = async (options: GeolocationOptions = {}): Promise<GeolocationResult> => {
  const defaultOptions: GeolocationOptions = {
    enableHighAccuracy: true,
    timeout: 5000,
    maximumAge: 0,
    ...options
  };

  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('이 브라우저는 위치 정보를 지원하지 않습니다.'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
      },
      (error) => {
        let errorMessage = '위치 정보를 가져올 수 없습니다.';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = '위치 정보 접근이 거부되었습니다.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = '위치 정보를 사용할 수 없습니다.';
            break;
          case error.TIMEOUT:
            errorMessage = '위치 정보 요청 시간이 초과되었습니다.';
            break;
        }
        reject(new Error(errorMessage));
      },
      defaultOptions
    );
  });
};

/**
 * IP 주소를 기반으로 대략적인 위치 정보를 가져옵니다. (Fallback 용도)
 */
const getIpBasedLocation = async (): Promise<GeolocationResult> => {
  const response = await fetch('https://ipapi.co/json/');
  if (!response.ok) {
    throw new Error('IP 기반 위치 정보를 가져올 수 없습니다.');
  }
  
  const data = await response.json();
  if (!data.latitude || !data.longitude) {
    throw new Error('IP 기반 위치 정보가 유효하지 않습니다.');
  }

  return {
    latitude: data.latitude,
    longitude: data.longitude
  };
};

/**
 * 현재 사용자의 위치 정보를 가져옵니다.
 * 먼저 브라우저 API를 시도하고, 실패할 경우 IP 기반 위치 정보를 시도합니다.
 */
export const getCurrentLocation = async (options?: GeolocationOptions): Promise<GeolocationResult> => {
  try {
    return await getBrowserLocation(options);
  } catch (error) {
    console.warn('브라우저 위치 정보 실패:', error);
    try {
      return await getIpBasedLocation();
    } catch (ipapiError) {
      console.error('IP 기반 위치 정보 실패:', ipapiError);
      throw new Error('위치 정보를 가져올 수 없습니다. 위치 서비스를 활성화하거나 나중에 다시 시도해주세요.');
    }
  }
};

/**
 * 위치 정보를 캐시 키로 사용하기 위한 문자열을 생성합니다.
 */
export const getLocationCacheKey = (latitude: number, longitude: number): string => {
  return `${longitude.toFixed(4)},${latitude.toFixed(4)}`;
};

/**
 * 전체 주소 문자열을 시/도, 시/군/구, 읍/면/동 단위로 분리합니다.
 */
export const splitToRegionAddress = (address: string): { group1: string, group2: string, group3: string } => {
  const parts = address.split(' ').filter(Boolean);
  const group1 = parts[0] || '';
  const group2 = parts[1] || '';
  const group3 = parts[2] || '';
  
  return { 
    group1: group1.substring(0, 2), // '서울특별시' -> '서울' 형식으로 통일
    group2, 
    group3 
  };
};
