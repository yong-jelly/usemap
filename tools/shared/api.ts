/**
 * API 요청 공통 모듈 (Axios 기반)
 */
import axios, { AxiosRequestConfig } from 'axios';

const DEFAULT_USER_AGENT = 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Mobile/15E148 Safari/604.1';

/**
 * 기본 헤더가 포함된 Axios 인스턴스
 */
export const apiClient = axios.create({
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json',
        'User-Agent': DEFAULT_USER_AGENT
    }
});

/**
 * 지수 백오프를 포함한 재시도 로직
 */
export async function requestWithRetry(
    config: AxiosRequestConfig,
    retries: number = 5,
    initialInterval: number = 3000
): Promise<any> {
    let interval = initialInterval;

    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            const response = await apiClient(config);
            if (response.status !== 429) return response;
            
            console.warn(`[API] 429 Too Many Requests (시도 ${attempt}/${retries}), ${interval / 1000}초 대기...`);
        } catch (error: any) {
            console.warn(`[API] 오류 발생 (시도 ${attempt}/${retries}): ${error.message}, ${interval / 1000}초 대기...`);
            if (attempt === retries) throw error;
        }

        await new Promise((resolve) => setTimeout(resolve, interval));
        interval *= 2; // 지수 백오프
    }
    
    throw new Error('최대 재시도 횟수를 초과했습니다.');
}
