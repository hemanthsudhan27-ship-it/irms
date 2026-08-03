import { apiClient } from '@/lib/api-client';
import { IResident, ApiResponse } from '@/types';

export interface ResidentFilterParams {
  complexId?: string;
  floorId?: string;
  unitId?: string;
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export const residentService = {
  async getAll(params?: ResidentFilterParams): Promise<ApiResponse<IResident[]>> {
    const { data } = await apiClient.get<ApiResponse<IResident[]>>('/residents', { params });
    return data;
  },

  async getById(id: string): Promise<IResident> {
    const { data } = await apiClient.get<ApiResponse<IResident>>(`/residents/${id}`);
    return data.data;
  },

  async create(payload: Partial<IResident>): Promise<IResident> {
    const { data } = await apiClient.post<ApiResponse<IResident>>('/residents', payload);
    return data.data;
  },

  async update(id: string, payload: Partial<IResident>): Promise<IResident> {
    const { data } = await apiClient.put<ApiResponse<IResident>>(`/residents/${id}`, payload);
    return data.data;
  },

  async moveOut(id: string, moveOutDate?: string): Promise<IResident> {
    const { data } = await apiClient.patch<ApiResponse<IResident>>(`/residents/${id}/move-out`, { moveOutDate });
    return data.data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/residents/${id}`);
  },
};
