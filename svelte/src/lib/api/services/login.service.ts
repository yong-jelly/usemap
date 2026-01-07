// src/lib/api/services/auth.service.ts
import apiClient from '../client';
import { API_ENDPOINTS } from '../../../config/api.config';

export const loginService = {
  login: async (login_id: string, passwd: string) => {
    return await apiClient.post(API_ENDPOINTS.AUTH.LOGIN, { login_id, passwd });
  },
  logout: async () => {
    return await apiClient.post(API_ENDPOINTS.AUTH.LOGOUT);
  }
};

// src/lib/api/services/user.service.ts
// import apiClient from '../client';
// import { API_ENDPOINTS } from '../../../config/api.config';
// import type { SettingFindRequestDto } from '../dto/setting.dto';

// export const userService = {
//   getUsers: async (params?: any) => {
//     return await apiClient.get(API_ENDPOINTS.USER.LIST, { params });
//   },
//   getUserById: async (id: string) => {
//     return await apiClient.get(API_ENDPOINTS.USER.DETAIL(id));
//   },
//   createUser: async (userData: any) => {
//     return await apiClient.post(API_ENDPOINTS.USER.CREATE, userData);
//   }
// };
