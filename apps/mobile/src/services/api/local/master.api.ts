import apiClient from '../client';
import {
  MasterCategory,
  MasterItem,
  MasterDestination,
} from '../../../types/local.types';

export const localMasterApi = {
  getCategories: () =>
    apiClient.get<{ success: boolean; data: MasterCategory[] }>(
      '/master/categories',
    ),

  getCategoryItems: (slug: string) =>
    apiClient.get<{ success: boolean; data: MasterItem[] }>(
      `/master/categories/${slug}/items`,
    ),

  getAmenities: (category?: string) =>
    apiClient.get<{ success: boolean; data: MasterItem[] }>(
      '/master/amenities',
      {
        params: { category },
      },
    ),

  getDestinations: () =>
    apiClient.get<{ success: boolean; data: MasterDestination[] }>(
      '/master/destinations',
    ),
};

export const localServicesApi = {
  getServiceTypes: (category: string) =>
    apiClient.get<{ success: boolean; data: string[] }>('/services/types', {
      params: { category },
    }),
};
