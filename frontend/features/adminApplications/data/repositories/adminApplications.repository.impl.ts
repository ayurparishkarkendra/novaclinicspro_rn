/**
 * Admin Applications Repository Implementation
 * React Query hooks for tenant applications management
 */

import { useQuery, useMutation, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import {
  listTenantApplicationsApi,
  getTenantApplicationApi,
  reviewTenantApplicationApi,
  activateApplicationApi,
  suspendApplicationApi,
  reactivateApplicationApi,
} from '../datasources/adminApplications.api';
import {
  TenantApplicationListItemResponse,
  TenantApplicationDetailResponse,
  ListApplicationsParams,
  ReviewApplicationRequest,
} from '../models/adminApplications.dtos';

// Query Keys
export const applicationsKeys = {
  all: ['applications'] as const,
  lists: () => [...applicationsKeys.all, 'list'] as const,
  list: (params?: ListApplicationsParams) => [...applicationsKeys.lists(), params] as const,
  details: () => [...applicationsKeys.all, 'detail'] as const,
  detail: (id: string) => [...applicationsKeys.details(), id] as const,
};

/**
 * Hook to list applications with optional filters
 */
export const useApplicationsListQuery = (
  params?: ListApplicationsParams,
  options?: Omit<UseQueryOptions<TenantApplicationListItemResponse[], Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<TenantApplicationListItemResponse[], Error>({
    queryKey: applicationsKeys.list(params),
    queryFn: () => listTenantApplicationsApi(params),
    ...options,
  });
};

/**
 * Hook to get a single application by ID
 */
export const useApplicationQuery = (
  id: string,
  options?: Omit<UseQueryOptions<TenantApplicationDetailResponse, Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<TenantApplicationDetailResponse, Error>({
    queryKey: applicationsKeys.detail(id),
    queryFn: () => getTenantApplicationApi(id),
    enabled: !!id,
    ...options,
  });
};

/**
 * Hook to review application (approve/reject)
 */
export const useReviewApplicationMutation = (id: string) => {
  const queryClient = useQueryClient();

  return useMutation<TenantApplicationDetailResponse, Error, ReviewApplicationRequest>({
    mutationFn: (payload) => reviewTenantApplicationApi(id, payload),
    onSuccess: (data) => {
      queryClient.setQueryData(applicationsKeys.detail(id), data);
      queryClient.invalidateQueries({ queryKey: applicationsKeys.lists() });
    },
  });
};

/**
 * Hook to activate application (go-live)
 */
export const useActivateApplicationMutation = (id: string) => {
  const queryClient = useQueryClient();

  return useMutation<TenantApplicationDetailResponse, Error, void>({
    mutationFn: () => activateApplicationApi(id),
    onSuccess: (data) => {
      queryClient.setQueryData(applicationsKeys.detail(id), data);
      queryClient.invalidateQueries({ queryKey: applicationsKeys.lists() });
    },
  });
};

/**
 * Hook to suspend application
 */
export const useSuspendApplicationMutation = (id: string) => {
  const queryClient = useQueryClient();

  return useMutation<TenantApplicationDetailResponse, Error, void>({
    mutationFn: () => suspendApplicationApi(id),
    onSuccess: (data) => {
      queryClient.setQueryData(applicationsKeys.detail(id), data);
      queryClient.invalidateQueries({ queryKey: applicationsKeys.lists() });
    },
  });
};

/**
 * Hook to reactivate application
 */
export const useReactivateApplicationMutation = (id: string) => {
  const queryClient = useQueryClient();

  return useMutation<TenantApplicationDetailResponse, Error, void>({
    mutationFn: () => reactivateApplicationApi(id),
    onSuccess: (data) => {
      queryClient.setQueryData(applicationsKeys.detail(id), data);
      queryClient.invalidateQueries({ queryKey: applicationsKeys.lists() });
    },
  });
};
