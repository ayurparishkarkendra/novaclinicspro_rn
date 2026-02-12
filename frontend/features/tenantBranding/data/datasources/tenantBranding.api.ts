/**
 * Tenant Branding API
 * 
 * Note: The Tenant Branding API endpoints do not currently exist.
 * All functions throw a TenantBrandingApiNotAvailableError.
 */

import { apiClient } from '../../../../core/api/axiosClient';
import {
  TenantBrandingResponse,
  UpdateTenantBrandingRequest,
} from '../models/tenantBranding.dtos';

export class TenantBrandingApiNotAvailableError extends Error {
  constructor() {
    super('Tenant Branding API is not yet available in your environment.');
    this.name = 'TenantBrandingApiNotAvailableError';
  }
}

/**
 * Get tenant branding configuration
 * API: GET /api/v1/tenants/{tenantId}/branding (NOT YET AVAILABLE)
 */
export async function getTenantBrandingApi(
  tenantId: string
): Promise<TenantBrandingResponse> {
  throw new TenantBrandingApiNotAvailableError();
  // When API becomes available:
  // const response = await apiClient.get<TenantBrandingResponse>(
  //   `/api/v1/tenants/${tenantId}/branding`
  // );
  // return response.data;
}

/**
 * Update tenant branding configuration
 * API: PATCH /api/v1/tenants/{tenantId}/branding (NOT YET AVAILABLE)
 */
export async function updateTenantBrandingApi(
  tenantId: string,
  payload: UpdateTenantBrandingRequest
): Promise<TenantBrandingResponse> {
  throw new TenantBrandingApiNotAvailableError();
  // When API becomes available:
  // const response = await apiClient.patch<TenantBrandingResponse>(
  //   `/api/v1/tenants/${tenantId}/branding`,
  //   payload
  // );
  // return response.data;
}
