import { apiClient } from '@/lib/api-client';
import { ICompany, ApiResponse } from '@/types';

export const companyService = {
  async getAll(): Promise<ICompany[]> {
    const { data } = await apiClient.get<ApiResponse<ICompany[]>>('/companies');
    return data.data;
  },

  async getById(id: string): Promise<ICompany> {
    const { data } = await apiClient.get<ApiResponse<ICompany>>(`/companies/${id}`);
    return data.data;
  },

  async create(payload: Partial<ICompany>): Promise<ICompany> {
    const { data } = await apiClient.post<ApiResponse<ICompany>>('/companies', payload);
    return data.data;
  },

  async update(id: string, payload: Partial<ICompany>): Promise<ICompany> {
    const { data } = await apiClient.put<ApiResponse<ICompany>>(`/companies/${id}`, payload);
    return data.data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/companies/${id}`);
  },
};
