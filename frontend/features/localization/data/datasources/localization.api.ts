/**
 * Localization API
 * 
 * Note: The Localization API endpoints do not currently exist in the backend.
 * All functions throw a LocalizationApiNotAvailableError.
 */

import { apiClient } from '../../../../core/api/axiosClient';
import {
  SupportedLocalesResponse,
  UserLocaleResponse,
  UpdateUserLocaleRequest,
  TenantLocaleResponse,
  UpdateTenantLocaleRequest,
} from '../models/localization.dtos';

// Custom error for unavailable features
export class LocalizationApiNotAvailableError extends Error {
  constructor() {
    super('Localization API is not yet available in your environment.');
    this.name = 'LocalizationApiNotAvailableError';
  }
}

/**
 * List supported locales
 * API: GET /api/v1/localization/locales (NOT YET AVAILABLE)
 */
export async function listSupportedLocalesApi(): Promise<SupportedLocalesResponse> {
  throw new LocalizationApiNotAvailableError();
  // When API becomes available:
  // const response = await apiClient.get<SupportedLocalesResponse>('/api/v1/localization/locales');
  // return response.data;
}

/**
 * Get user's locale preference
 * API: GET /api/v1/users/{userId}/locale (NOT YET AVAILABLE)
 */
export async function getUserLocaleApi(userId: string): Promise<UserLocaleResponse> {
  throw new LocalizationApiNotAvailableError();
  // When API becomes available:
  // const response = await apiClient.get<UserLocaleResponse>(`/api/v1/users/${userId}/locale`);
  // return response.data;
}

/**
 * Update user's locale preference
 * API: PATCH /api/v1/users/{userId}/locale (NOT YET AVAILABLE)
 */
export async function updateUserLocaleApi(
  userId: string,
  payload: UpdateUserLocaleRequest
): Promise<UserLocaleResponse> {
  throw new LocalizationApiNotAvailableError();
  // When API becomes available:
  // const response = await apiClient.patch<UserLocaleResponse>(`/api/v1/users/${userId}/locale`, payload);
  // return response.data;
}

/**
 * Get tenant's default locale
 * API: GET /api/v1/tenants/{tenantId}/locale (NOT YET AVAILABLE)
 */
export async function getTenantDefaultLocaleApi(tenantId: string): Promise<TenantLocaleResponse> {
  throw new LocalizationApiNotAvailableError();
  // When API becomes available:
  // const response = await apiClient.get<TenantLocaleResponse>(`/api/v1/tenants/${tenantId}/locale`);
  // return response.data;
}

/**
 * Update tenant's default locale
 * API: PATCH /api/v1/tenants/{tenantId}/locale (NOT YET AVAILABLE)
 */
export async function updateTenantDefaultLocaleApi(
  tenantId: string,
  payload: UpdateTenantLocaleRequest
): Promise<TenantLocaleResponse> {
  throw new LocalizationApiNotAvailableError();
  // When API becomes available:
  // const response = await apiClient.patch<TenantLocaleResponse>(`/api/v1/tenants/${tenantId}/locale`, payload);
  // return response.data;
}
