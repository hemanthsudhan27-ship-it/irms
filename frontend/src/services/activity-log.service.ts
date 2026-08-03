import { apiClient } from '@/lib/api-client';
import { IActivityLog, ApiResponse } from '@/types';

export interface ActivityLogFilterParams {
  companyId?: string;
  complexId?: string;
  userId?: string;
  entityType?: string;
  page?: number;
  limit?: number;
}

export const activityLogService = {
  async getLogs(params?: ActivityLogFilterParams): Promise<ApiResponse<IActivityLog[]>> {
    const { data } = await apiClient.get<ApiResponse<IActivityLog[]>>('/activity-logs', { params });
    return data;
  },
};
