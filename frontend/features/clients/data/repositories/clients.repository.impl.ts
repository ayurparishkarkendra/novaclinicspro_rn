/**
 * Clients Repository Implementation
 * React Query hooks for client management
 */

import { useQuery, useMutation, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import {
  listClientsApi,
  getClientApi,
  createClientApi,
  updateClientApi,
  deleteClientApi,
  searchClientsApi,
} from '../datasources/clients.api';
import {
  ClientCreate,
  ClientUpdate,
  ClientResponse,
  ListClientsParams,
  PaginatedClientsResponse,
} from '../models/clients.dtos';

// ============================================
// QUERY KEYS
// ============================================

export const clientsKeys = {
  all: ['clients'] as const,
  lists: () => [...clientsKeys.all, 'list'] as const,
  list: (tenantId: string, params?: ListClientsParams) =>
    [...clientsKeys.lists(), tenantId, params] as const,
  details: () => [...clientsKeys.all, 'detail'] as const,
  detail: (tenantId: string, clientId: string) =>
    [...clientsKeys.details(), tenantId, clientId] as const,
  search: (tenantId: string, query: string) =>
    [...clientsKeys.all, 'search', tenantId, query] as const,
};

// ============================================
// QUERY HOOKS
// ============================================

/**
 * Hook to list clients for a tenant
 */
export const useClientsListQuery = (
  tenantId: string,
  params?: ListClientsParams,
  options?: Omit<UseQueryOptions<PaginatedClientsResponse, Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<PaginatedClientsResponse, Error>({
    queryKey: clientsKeys.list(tenantId, params),
    queryFn: () => listClientsApi(tenantId, params),
    enabled: !!tenantId,
    ...options,
  });
};

/**
 * Hook to get a single client
 */
export const useClientDetailQuery = (
  tenantId: string,
  clientId: string,
  options?: Omit<UseQueryOptions<ClientResponse, Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<ClientResponse, Error>({
    queryKey: clientsKeys.detail(tenantId, clientId),
    queryFn: () => getClientApi(tenantId, clientId),
    enabled: !!tenantId && !!clientId,
    ...options,
  });
};

// ============================================
// MUTATION HOOKS
// ============================================

/**
 * Hook to create a client
 */
export const useCreateClientMutation = (tenantId: string) => {
  const queryClient = useQueryClient();

  return useMutation<ClientResponse, Error, ClientCreate>({
    mutationFn: (payload) => createClientApi(tenantId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: clientsKeys.lists() });
    },
  });
};

/**
 * Hook to update a client
 */
export const useUpdateClientMutation = (tenantId: string, clientId: string) => {
  const queryClient = useQueryClient();

  return useMutation<ClientResponse, Error, ClientUpdate>({
    mutationFn: (payload) => updateClientApi(tenantId, clientId, payload),
    onSuccess: (data) => {
      queryClient.setQueryData(clientsKeys.detail(tenantId, clientId), data);
      queryClient.invalidateQueries({ queryKey: clientsKeys.lists() });
    },
  });
};

/**
 * Hook to delete a client
 */
export const useDeleteClientMutation = (tenantId: string) => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: (clientId) => deleteClientApi(tenantId, clientId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: clientsKeys.lists() });
    },
  });
};

// ============================================
// SEARCH HOOKS
// ============================================

/**
 * Hook to search clients by phone, email, or name
 * Uses the dedicated search endpoint: GET /api/v1/clinic/{tenant_id}/clients/search
 * 
 * @param tenantId - Clinic tenant ID
 * @param query - Search query (min 3 characters to trigger API call)
 * @param limit - Optional limit for results
 */
export const useSearchClientsQuery = (
  tenantId: string,
  query: string,
  limit?: number,
  options?: Omit<UseQueryOptions<PaginatedClientsResponse, Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<PaginatedClientsResponse, Error>({
    queryKey: clientsKeys.search(tenantId, query),
    queryFn: () => searchClientsApi(tenantId, query, limit),
    // Only enable when tenantId exists and query has at least 3 characters
    enabled: !!tenantId && query.length >= 3,
    // Keep stale data while fetching new results
    staleTime: 30000, // 30 seconds
    ...options,
  });
};
