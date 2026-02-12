/**
 * Treatment Sessions Repository Implementation
 * React Query hooks for treatment session management
 */

import { useQuery, useMutation, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import {
  listTreatmentSessionsApi,
  getTreatmentSessionApi,
  createTreatmentSessionApi,
  updateTreatmentSessionApi,
  deleteTreatmentSessionApi,
  startTreatmentSessionApi,
  completeTreatmentSessionApi,
} from '../datasources/treatmentSessions.api';
import {
  TreatmentSessionCreate,
  TreatmentSessionUpdate,
  TreatmentSessionResponse,
  ListTreatmentSessionsParams,
  PaginatedTreatmentSessionsResponse,
} from '../models/treatmentSessions.dtos';

// ============================================
// QUERY KEYS
// ============================================

export const treatmentSessionsKeys = {
  all: ['treatmentSessions'] as const,
  lists: () => [...treatmentSessionsKeys.all, 'list'] as const,
  list: (tenantId: string, params?: ListTreatmentSessionsParams) =>
    [...treatmentSessionsKeys.lists(), tenantId, params] as const,
  details: () => [...treatmentSessionsKeys.all, 'detail'] as const,
  detail: (tenantId: string, sessionId: string) =>
    [...treatmentSessionsKeys.details(), tenantId, sessionId] as const,
};

// ============================================
// QUERY HOOKS
// ============================================

/**
 * Hook to list treatment sessions for a tenant
 */
export const useTreatmentSessionsListQuery = (
  tenantId: string,
  params?: ListTreatmentSessionsParams,
  options?: Omit<UseQueryOptions<PaginatedTreatmentSessionsResponse, Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<PaginatedTreatmentSessionsResponse, Error>({
    queryKey: treatmentSessionsKeys.list(tenantId, params),
    queryFn: () => listTreatmentSessionsApi(tenantId, params),
    enabled: !!tenantId,
    ...options,
  });
};

/**
 * Hook to get a single treatment session
 */
export const useTreatmentSessionDetailQuery = (
  tenantId: string,
  sessionId: string,
  options?: Omit<UseQueryOptions<TreatmentSessionResponse, Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<TreatmentSessionResponse, Error>({
    queryKey: treatmentSessionsKeys.detail(tenantId, sessionId),
    queryFn: () => getTreatmentSessionApi(tenantId, sessionId),
    enabled: !!tenantId && !!sessionId,
    ...options,
  });
};

// ============================================
// MUTATION HOOKS
// ============================================

/**
 * Hook to create a treatment session
 */
export const useCreateTreatmentSessionMutation = (tenantId: string) => {
  const queryClient = useQueryClient();

  return useMutation<TreatmentSessionResponse, Error, TreatmentSessionCreate>({
    mutationFn: (payload) => createTreatmentSessionApi(tenantId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: treatmentSessionsKeys.lists() });
    },
  });
};

/**
 * Hook to update a treatment session
 */
export const useUpdateTreatmentSessionMutation = (tenantId: string, sessionId: string) => {
  const queryClient = useQueryClient();

  return useMutation<TreatmentSessionResponse, Error, TreatmentSessionUpdate>({
    mutationFn: (payload) => updateTreatmentSessionApi(tenantId, sessionId, payload),
    onSuccess: (data) => {
      queryClient.setQueryData(treatmentSessionsKeys.detail(tenantId, sessionId), data);
      queryClient.invalidateQueries({ queryKey: treatmentSessionsKeys.lists() });
    },
  });
};

/**
 * Hook to delete a treatment session
 */
export const useDeleteTreatmentSessionMutation = (tenantId: string) => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: (sessionId) => deleteTreatmentSessionApi(tenantId, sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: treatmentSessionsKeys.lists() });
    },
  });
};

/**
 * Hook to start a treatment session
 */
export const useStartTreatmentSessionMutation = (tenantId: string) => {
  const queryClient = useQueryClient();

  return useMutation<TreatmentSessionResponse, Error, string>({
    mutationFn: (sessionId) => startTreatmentSessionApi(tenantId, sessionId),
    onSuccess: (data) => {
      queryClient.setQueryData(treatmentSessionsKeys.detail(tenantId, data.id), data);
      queryClient.invalidateQueries({ queryKey: treatmentSessionsKeys.lists() });
    },
  });
};

/**
 * Hook to complete a treatment session
 */
export const useCompleteTreatmentSessionMutation = (tenantId: string, sessionId: string) => {
  const queryClient = useQueryClient();

  return useMutation<
    TreatmentSessionResponse,
    Error,
    { observations?: string; progress_notes?: string } | undefined
  >({
    mutationFn: (payload) => completeTreatmentSessionApi(tenantId, sessionId, payload),
    onSuccess: (data) => {
      queryClient.setQueryData(treatmentSessionsKeys.detail(tenantId, sessionId), data);
      queryClient.invalidateQueries({ queryKey: treatmentSessionsKeys.lists() });
    },
  });
};
