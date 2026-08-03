import { apiClient } from '@/lib/api-client';
import { IComplex, ApiResponse } from '@/types';

export const complexService = {
  async getAll(companyId?: string): Promise<IComplex[]> {
    const { data } = await apiClient.get<ApiResponse<IComplex[]>>('/complexes', {
      params: { companyId },
    });
    return data.data;
  },

  async getMyComplex(): Promise<IComplex> {
    const { data } = await apiClient.get<ApiResponse<IComplex>>('/complexes/my-complex');
    return data.data;
  },

  async getById(id: string): Promise<IComplex> {
    const { data } = await apiClient.get<ApiResponse<IComplex>>(`/complexes/${id}`);
    return data.data;
  },

  async create(payload: Partial<IComplex>): Promise<IComplex> {
    const { data } = await apiClient.post<ApiResponse<IComplex>>('/complexes', payload);
    return data.data;
  },

  async update(id: string, payload: Partial<IComplex>): Promise<IComplex> {
    const { data } = await apiClient.put<ApiResponse<IComplex>>(`/complexes/${id}`, payload);
    return data.data;
  },

  async updateMyComplex(payload: Partial<IComplex>): Promise<IComplex> {
    const { data } = await apiClient.put<ApiResponse<IComplex>>('/complexes/my-complex', payload);
    return data.data;
  },

  async rename(id: string, name: string): Promise<IComplex> {
    const { data } = await apiClient.patch<ApiResponse<IComplex>>(`/complexes/${id}/rename`, { name });
    return data.data;
  },

  async assignAdmin(id: string, adminUserId: string): Promise<IComplex> {
    const { data } = await apiClient.post<ApiResponse<IComplex>>(`/complexes/${id}/assign-admin`, { adminUserId });
    return data.data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/complexes/${id}`);
  },
};
