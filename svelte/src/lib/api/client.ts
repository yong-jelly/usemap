import axios from 'axios';
import { API_CONFIG } from '../../config/api.config';
import { ENV_CONFIG } from '../../config/env.config';

const apiClient = axios.create(API_CONFIG);

// 요청 인터셉터
apiClient.interceptors.request.use(
  (config) => {
    // const token = localStorage.getItem(ENV_CONFIG.AUTH_TOKEN_KEY);
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 응답 인터셉터
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;    
    return Promise.reject(error);
  }
);

export default apiClient;
