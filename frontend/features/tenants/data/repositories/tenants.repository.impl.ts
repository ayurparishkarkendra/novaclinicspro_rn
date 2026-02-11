/**
 * Tenants Repository Implementation
 * React Query hooks for tenant management
 */

import { useQuery, useMutation, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import {
  listTenantsApi,
  getTenantApi,
  createTenantApi,
  updateTenantApi,
  deactivateTenantApi,
} from '../datasources/tenants.api';
import {
  OrgTenantResponse,
  OrgTenantCreate,
  OrgTenantUpdate,
  ListTenantsParams,
} from '../models/tenants.dtos';

// Query Keys
export const tenantsKeys = {
  all: ['tenants'] as const,
  lists: () => [...tenantsKeys.all, 'list'] as const,
  list: (params?: ListTenantsParams) => [...tenantsKeys.lists(), params] as const,
  details: () => [...tenantsKeys.all, 'detail'] as const,
  detail: (id: string) => [...tenantsKeys.details(), id] as const,
};

/**
 * Hook to list tenants with optional filters
 */
export const useTenantsListQuery = (
  params?: ListTenantsParams,
  options?: Omit<UseQueryOptions<OrgTenantResponse[], Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<OrgTenantResponse[], Error>({
    queryKey: tenantsKeys.list(params),
    queryFn: () => listTenantsApi(params),
    ...options,
  });
};

/**
 * Hook to get a single tenant by ID
 */
export const useTenantQuery = (
  id: string,
  options?: Omit<UseQueryOptions<OrgTenantResponse, Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<OrgTenantResponse, Error>({
    queryKey: tenantsKeys.detail(id),
    queryFn: () => getTenantApi(id),
    enabled: !!id,
    ...options,
  });
};

/**
 * Hook to create a new tenant
 */
export const useCreateTenantMutation = () => {
  const queryClient = useQueryClient();

  return useMutation<OrgTenantResponse, Error, OrgTenantCreate>({
    mutationFn: createTenantApi,
    onSuccess: () => {
      // Invalidate tenant lists to refetch
      queryClient.invalidateQueries({ queryKey: tenantsKeys.lists() });
    },
  });
};

/**
 * Hook to update a tenant
 */
export const useUpdateTenantMutation = (id: string) => {
  const queryClient = useQueryClient();

  return useMutation<OrgTenantResponse, Error, OrgTenantUpdate>({
    mutationFn: (payload) => updateTenantApi(id, payload),
    onSuccess: (data) => {
      // Update the specific tenant in cache
      queryClient.setQueryData(tenantsKeys.detail(id), data);
      // Invalidate lists to reflect changes
      queryClient.invalidateQueries({ queryKey: tenantsKeys.lists() });
    },
  });
};

/**
 * Hook to deactivate a tenant (soft delete)
 */
export const useDeactivateTenantMutation = (id: string) => {
  const queryClient = useQueryClient();

  return useMutation<OrgTenantResponse, Error, void>({
    mutationFn: () => deactivateTenantApi(id),
    onSuccess: (data) => {
      // Update the specific tenant in cache
      queryClient.setQueryData(tenantsKeys.detail(id), data);
      // Invalidate lists to reflect changes
      queryClient.invalidateQueries({ queryKey: tenantsKeys.lists() });
    },
  });
};
