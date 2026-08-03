import { apiClient } from '@/lib/api-client';
import { ApiResponse } from '@/types';

export interface UserSummary {
  id: string;
  fullName: string;
  email: string;
  roleName: string;
  roleSlug: string;
  complexId: string | null;
}

export const authService = {
  async getUsers(): Promise<UserSummary[]> {
    const { data } = await apiClient.get<ApiResponse<UserSummary[]>>('/auth/users');
    return data.data;
  },
};
