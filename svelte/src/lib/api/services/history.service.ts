// src/lib/api/services/auth.service.ts
import apiClient from '../client';
import { API_ENDPOINTS } from '../../../config/api.config';
import type { ErrorDto } from '../dto/error.dto';
import type { ListRequestDto } from '../dto/history.dt';

export const historyService = {
    getBalanceList:async (dto: ListRequestDto) => {
        return await apiClient.get(API_ENDPOINTS.HISTORY.BALANCE.LIST(dto));
    },
    getOrderList:async (dto: ListRequestDto) => {
        return await apiClient.get(API_ENDPOINTS.HISTORY.ORDER.LIST(dto));
    },
    getEventLogList:async (dto: ListRequestDto, type: string = 'all') => {
        return await apiClient.get(API_ENDPOINTS.HISTORY.EVENTLOG.LIST(dto, type));
    }
}
