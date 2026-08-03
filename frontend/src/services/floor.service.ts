import { apiClient } from '@/lib/api-client';
import { IFloor, ApiResponse } from '@/types';

export const floorService = {
  async getByComplex(complexId: string): Promise<IFloor[]> {
    const { data } = await apiClient.get<ApiResponse<IFloor[]>>(`/floors/complex/${complexId}`);
    return data.data;
  },

  async getById(id: string): Promise<IFloor> {
    const { data } = await apiClient.get<ApiResponse<IFloor>>(`/floors/${id}`);
    return data.data;
  },

  async create(payload: { complexId: string; floorNumber: number; floorLabel: string; description?: string }): Promise<IFloor> {
    const { data } = await apiClient.post<ApiResponse<IFloor>>('/floors', payload);
    return data.data;
  },

  async update(id: string, payload: Partial<IFloor>): Promise<IFloor> {
    const { data } = await apiClient.put<ApiResponse<IFloor>>(`/floors/${id}`, payload);
    return data.data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/floors/${id}`);
  },
};
