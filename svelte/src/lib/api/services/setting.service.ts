// src/lib/api/services/auth.service.ts
import apiClient from '../client';
import { API_ENDPOINTS } from '../../../config/api.config';
import type { SettingCreateRequestDto, SettingFindRequestDto } from '../dto/setting.dto';
import type { ErrorDto } from '../dto/error.dto';

export const settingService = {
    find:async (dto: SettingFindRequestDto) => {
        try {
            return await apiClient.post(API_ENDPOINTS.SETTING.FIND, dto);
        } catch (error) {
            return error as ErrorDto;
        }
    },
    get:async (id: string) => {
        try {
            return await apiClient.get(API_ENDPOINTS.SETTING.GET(id));
        } catch (error) {
            return error as ErrorDto;
        }
    },
    create:async (dto: SettingCreateRequestDto) => {
        try {
            return await apiClient.post(API_ENDPOINTS.SETTING.CREATE(), dto);
        } catch (error) {
            return error as ErrorDto;
        }
    },
    update:async (id: string, dto: SettingCreateRequestDto) => {
        try {
            return await apiClient.put(API_ENDPOINTS.SETTING.UPDATE(id), dto);
        } catch (error) {
            return error as ErrorDto;
        }
    },
    delete:async (id: string) => {
        try {
            return await apiClient.delete(API_ENDPOINTS.SETTING.DELETE(id));
        } catch (error) {
            return error as ErrorDto;
        }
    },
    setProcess:async (id: string, active: boolean) => {
        try {
            return await apiClient.post(API_ENDPOINTS.SETTING.SET_PROCESS(), {setting_id: Number(id), active});
        } catch (error) {
            return error as ErrorDto;
        }
    }
//   login: async (email: string, password: string) => {
//     return await apiClient.post(API_ENDPOINTS.AUTH.LOGIN, { email, password });
//   },
//   logout: async () => {
//     return await apiClient.post(API_ENDPOINTS.AUTH.LOGOUT);
//   }
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
