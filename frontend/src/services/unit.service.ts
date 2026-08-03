import { apiClient } from '@/lib/api-client';
import { IApartmentUnit, ApiResponse } from '@/types';

export const unitService = {
  async getByFloor(floorId: string): Promise<IApartmentUnit[]> {
    const { data } = await apiClient.get<ApiResponse<IApartmentUnit[]>>(`/units/floor/${floorId}`);
    return data.data;
  },

  async getByComplex(complexId: string): Promise<IApartmentUnit[]> {
    const { data } = await apiClient.get<ApiResponse<IApartmentUnit[]>>(`/units/complex/${complexId}`);
    return data.data;
  },

  async getById(id: string): Promise<IApartmentUnit> {
    const { data } = await apiClient.get<ApiResponse<IApartmentUnit>>(`/units/${id}`);
    return data.data;
  },

  async create(payload: Partial<IApartmentUnit>): Promise<IApartmentUnit> {
    const { data } = await apiClient.post<ApiResponse<IApartmentUnit>>('/units', payload);
    return data.data;
  },

  async update(id: string, payload: Partial<IApartmentUnit>): Promise<IApartmentUnit> {
    const { data } = await apiClient.put<ApiResponse<IApartmentUnit>>(`/units/${id}`, payload);
    return data.data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/units/${id}`);
  },
};
