import { apiClient } from '@/lib/api-client';
import { ISuperAdminDashboardStats, IComplexAdminDashboardStats, ApiResponse } from '@/types';

export const dashboardService = {
  async getSuperAdminStats(): Promise<ISuperAdminDashboardStats> {
    const { data } = await apiClient.get<ApiResponse<ISuperAdminDashboardStats>>('/dashboard/super-admin');
    return data.data;
  },

  async getComplexAdminStats(): Promise<IComplexAdminDashboardStats> {
    const { data } = await apiClient.get<ApiResponse<IComplexAdminDashboardStats>>('/dashboard/complex-admin');
    return data.data;
  },
};
