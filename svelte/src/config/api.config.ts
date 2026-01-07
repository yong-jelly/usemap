// src/config/api.config.ts
import type { ListRequestDto } from '../lib/api/dto/history.dt';
import type { VoteListRequest } from './types';
import { ENV_CONFIG } from './env.config';
const getBaseURL = (apiUrl: string) => {
    console.log(`
getBaseURL: ${apiUrl}, 
hostname ${window.location.hostname},
FORCE_API_PROD_URL ${ENV_CONFIG.FORCE_API_PROD_URL},
PROD_URL ${ENV_CONFIG.PROD_URL}
API_PROD_URL ${ENV_CONFIG.API_PROD_URL}
          `);
    if (ENV_CONFIG.FORCE_API_PROD_URL == 'true') {
        return `${window.location.protocol}//${ENV_CONFIG.API_PROD_URL}`;
    }
    // 프로덕션 도메인인 경우 API 서버 URL로 변경
    if (window.location.hostname === ENV_CONFIG.PROD_URL ||
        window.location.hostname === `www.${ENV_CONFIG.PROD_URL}`) {
        return `${window.location.protocol}//${ENV_CONFIG.API_PROD_URL}`;
    }
    // alert(apiUrl)
    // URL이 ':' 로 시작하는 경우 (포트만 있는 경우)
    if (apiUrl && apiUrl.startsWith(':')) {
        return `${window.location.protocol}//${window.location.hostname}${apiUrl}`;
    }
    // 전체 URL이 제공된 경우 (https://abcd.com:1234)
    return apiUrl;
    return 'http://api.dearfarm.finance'
};

export const API_CONFIG = {
    //   baseURL: `${ENV_CONFIG.API_URL}/api/${ENV_CONFIG.API_VERSION}`,
    baseURL: getBaseURL(ENV_CONFIG.API_URL),
    timeout: Number(ENV_CONFIG.API_TIMEOUT),
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
};
// `http://43.201.6.117:3003/search/place/${currentPage}?size=${pageSize}`,
// API 엔드포인트 상수
export const API_ENDPOINTS = {
    SEARCH: {
        PLACE: (page: number, size: number) => `/search/place/${page}?size=${size}`
    },
    TAG: {
        LIST: '/public/tag/list',
    },
    BADGE: {
        LIST: '/public/badge/list',
        OVERVIEW: '/public/badge/overview'
    },
    VOTE: {
        LIST: (dto: VoteListRequest) => `/public/vote/list?provider=${dto.provider}&interval=${dto.interval}&order=${dto.order}&limit=${dto.limit}`
    },
    USER: {
        LIST: '/public/user/list'
    },
    MEMO: {
        LIST: '/public/memo/list'
    },
    HISTORY: {
        BALANCE: {
            LIST: (dto: ListRequestDto) => `/history/${dto.exchange}/balance/${dto.page}?size=${dto.size}`
        },
        ORDER: {
            LIST: (dto: ListRequestDto) => `/history/${dto.exchange}/order/${dto.page}?size=${dto.size}`
        },
        EVENTLOG: {
            LIST: (dto: ListRequestDto, type: string = 'all') => `/history/${dto.exchange}/event/${dto.page}?size=${dto.size}&type=${type}`
        }
    },
    AUTH: {
        LOGIN: '/authentication/generate-session',
        REFRESH: '/authentication/refresh-session',
        LOGOUT: '/authentication/logout-session'
    },
    ADMIN: {
        EXCHANGE: {
            LIST: (page: number, query: string) => `/admin/exchange/list/${page}?${query}`,
            GET: (id: string) => `/admin/exchange/${id}`,
            CREATE: '/admin/exchange',
            UPDATE: (id: string) => `/admin/exchange/${id}`,
            // DELETE: '/admin/exchange/delete'
        }
    },
    //   USER: {
    //     LIST: '/users',
    //     DETAIL: (id: string) => `/users/${id}`,
    //     CREATE: '/users',
    //     UPDATE: (id: string) => `/users/${id}`,
    //     DELETE: (id: string) => `/users/${id}`
    //   },
    //   POSTS: {
    //     LIST: '/posts',
    //     DETAIL: (id: string) => `/posts/${id}`,
    //     CREATE: '/posts'
    //   }
    PLACE: {
        SEARCH: (page: number, size: number, sort: string) => `/place/list/${page}?size=${size}&sort=${sort}`,
        SEARCH_BY_KEYWORD: (keyword: string) => `/search/text?keyword=${keyword}`,
        DETAIL: (placeId: string) => `/place/${placeId}`
    },
    REVIEW: {
        // http://43.201.6.117:3003/upvote/place/review/${currentPage}?size=${pageSize}&${tabParam}`,
        LIST: (page: number, size: number, type: string) => `/review/list/${page}?size=${size}&type=${type}`
    }
};
