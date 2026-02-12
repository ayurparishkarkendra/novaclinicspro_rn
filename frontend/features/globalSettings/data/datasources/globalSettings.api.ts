/**
 * Global Settings API
 * 
 * Note: The Global Settings API endpoints do not currently exist.
 * All functions throw a GlobalSettingsApiNotAvailableError.
 */

import { apiClient } from '../../../../core/api/axiosClient';
import {
  GlobalSettingsResponse,
  UpdateGlobalSettingsRequest,
  TenantSettingsResponse,
  UpdateTenantSettingsRequest,
} from '../models/globalSettings.dtos';

export class GlobalSettingsApiNotAvailableError extends Error {
  constructor() {
    super('Global Settings API is not yet available in your environment.');
    this.name = 'GlobalSettingsApiNotAvailableError';
  }
}

/**
 * Get global settings
 * API: GET /api/v1/settings/global (NOT YET AVAILABLE)
 */
export async function getGlobalSettingsApi(): Promise<GlobalSettingsResponse> {
  throw new GlobalSettingsApiNotAvailableError();
  // When API becomes available:
  // const response = await apiClient.get<GlobalSettingsResponse>('/api/v1/settings/global');
  // return response.data;
}

/**
 * Update global settings
 * API: PATCH /api/v1/settings/global (NOT YET AVAILABLE)
 */
export async function updateGlobalSettingsApi(
  payload: UpdateGlobalSettingsRequest
): Promise<GlobalSettingsResponse> {
  throw new GlobalSettingsApiNotAvailableError();
  // When API becomes available:
  // const response = await apiClient.patch<GlobalSettingsResponse>('/api/v1/settings/global', payload);
  // return response.data;
}

/**
 * Get tenant-specific settings
 * API: GET /api/v1/tenants/{tenantId}/settings (NOT YET AVAILABLE)
 */
export async function getTenantSettingsApi(
  tenantId: string
): Promise<TenantSettingsResponse> {
  throw new GlobalSettingsApiNotAvailableError();
  // When API becomes available:
  // const response = await apiClient.get<TenantSettingsResponse>(`/api/v1/tenants/${tenantId}/settings`);
  // return response.data;
}

/**
 * Update tenant-specific settings
 * API: PATCH /api/v1/tenants/{tenantId}/settings (NOT YET AVAILABLE)
 */
export async function updateTenantSettingsApi(
  tenantId: string,
  payload: UpdateTenantSettingsRequest
): Promise<TenantSettingsResponse> {
  throw new GlobalSettingsApiNotAvailableError();
  // When API becomes available:
  // const response = await apiClient.patch<TenantSettingsResponse>(`/api/v1/tenants/${tenantId}/settings`, payload);
  // return response.data;
}
