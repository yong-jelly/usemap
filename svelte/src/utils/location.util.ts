interface GeolocationResult {
  latitude: number;
  longitude: number;
}

interface GeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
}

/**
 * 브라우저의 Geolocation API를 사용하여 위치 정보를 가져오는 함수
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
 * ipapi.co 서비스를 통해 위치 정보를 가져오는 함수
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
 * 위치 정보를 가져오는 통합 함수
 * 1. 브라우저 Geolocation API 시도
 * 2. 실패 시 IP 기반 위치 정보 시도
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
 * 좌표를 캐시 키로 변환하는 유틸리티 함수
 */
export const getLocationCacheKey = (latitude: number, longitude: number): string => {
  return `${longitude.toFixed(4)},${latitude.toFixed(4)}`;
};

export const splitToRegionAddress = (address: string): { group1: string, group2: string, group3: string } => {
  const [group1, group2, group3] = address.split(' ').filter(Boolean);
  // if (region.group1 == '서울특별시') {
  //   region.group1 = '서울'
  // }
  return { 
    group1: group1?.substring(0, 2),
    group2, 
    group3 
  };
  // return { 
  //   group1: group1 === '서울특별시' ? '서울' : 
  //          group1 === '대전광역시' ? '대전' : 
  //          group1, 
  //   group2, 
  //   group3 
  // };
};
