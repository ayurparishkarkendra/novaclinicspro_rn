/**
 * Clients API
 * Handles all HTTP calls for client management
 *
 * IMPORTANT: All paths must start with /api/v1/...
 */

import { axiosClient } from '../../../../core/api/axiosClient';
import {
  ClientCreate,
  ClientUpdate,
  ClientResponse,
  ListClientsParams,
  PaginatedClientsResponse,
} from '../models/clients.dtos';

/**
 * List clients for a tenant
 * GET /api/v1/clinic/{tenant_id}/clients
 */
export const listClientsApi = async (
  tenantId: string,
  params?: ListClientsParams
): Promise<PaginatedClientsResponse> => {
  const response = await axiosClient.get(
    `/api/v1/clinic/${tenantId}/clients`,
    { params }
  );
  return response.data;
};

/**
 * Get a single client
 * GET /api/v1/clinic/{tenant_id}/clients/{client_id}
 */
export const getClientApi = async (
  tenantId: string,
  clientId: string
): Promise<ClientResponse> => {
  const response = await axiosClient.get(
    `/api/v1/clinic/${tenantId}/clients/${clientId}`
  );
  return response.data;
};

/**
 * Create a client
 * POST /api/v1/clinic/{tenant_id}/clients
 */
export const createClientApi = async (
  tenantId: string,
  payload: ClientCreate
): Promise<ClientResponse> => {
  const response = await axiosClient.post(
    `/api/v1/clinic/${tenantId}/clients`,
    payload
  );
  return response.data;
};

/**
 * Update a client
 * PATCH /api/v1/clinic/{tenant_id}/clients/{client_id}
 */
export const updateClientApi = async (
  tenantId: string,
  clientId: string,
  payload: ClientUpdate
): Promise<ClientResponse> => {
  const response = await axiosClient.patch(
    `/api/v1/clinic/${tenantId}/clients/${clientId}`,
    payload
  );
  return response.data;
};

/**
 * Delete a client
 * DELETE /api/v1/clinic/{tenant_id}/clients/{client_id}
 */
export const deleteClientApi = async (
  tenantId: string,
  clientId: string
): Promise<void> => {
  await axiosClient.delete(
    `/api/v1/clinic/${tenantId}/clients/${clientId}`
  );
};

// ============================================
// SEARCH
// ============================================

/**
 * Search clients by phone, email, or name
 * GET /api/v1/clinic/{tenant_id}/clients/search
 * 
 * @param tenantId - Clinic tenant ID
 * @param query - Search query (phone, email, or name)
 * @param limit - Optional limit for results
 */
export const searchClientsApi = async (
  tenantId: string,
  query: string,
  limit?: number
): Promise<PaginatedClientsResponse> => {
  const response = await axiosClient.get(
    `/api/v1/clinic/${tenantId}/clients/search`,
    { params: { q: query, limit } }  // FIX: Use 'q' instead of 'query' as per backend API
  );
  return response.data;
};
