/**
 * Casesheets Repository Implementation
 * React Query hooks for clinical case sheets
 */

import { useQuery, useMutation, useQueryClient, UseQueryOptions, UseMutationOptions } from '@tanstack/react-query';
import {
  listCasesheetsApi,
  getCasesheetApi,
  createCasesheetApi,
  updateCasesheetApi,
  transitionCasesheetStatusApi,
  printCasesheetApi,
  archiveCasesheetApi,
} from '../datasources/casesheets.api';
import {
  CasesheetCreateRequest,
  CasesheetUpdateRequest,
  CasesheetStatusTransitionRequest,
  CasesheetResponse,
  CasesheetListResponse,
  CasesheetPrintResponse,
  ListCasesheetsParams,
} from '../models/casesheets.dtos';

// ============================================
// QUERY KEYS
// ============================================

export const casesheetsKeys = {
  all: ['casesheets'] as const,
  lists: () => [...casesheetsKeys.all, 'list'] as const,
  list: (tenantId: string, clientId: string, params?: ListCasesheetsParams) =>
    [...casesheetsKeys.lists(), tenantId, clientId, params] as const,
  details: () => [...casesheetsKeys.all, 'detail'] as const,
  detail: (tenantId: string, casesheetId: string) =>
    [...casesheetsKeys.details(), tenantId, casesheetId] as const,
};

// ============================================
// QUERY HOOKS
// ============================================

/**
 * Hook to list casesheets for a client
 */
export const useCasesheetsListQuery = (
  tenantId: string,
  clientId: string,
  params?: ListCasesheetsParams,
  options?: Omit<UseQueryOptions<CasesheetListResponse, Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<CasesheetListResponse, Error>({
    queryKey: casesheetsKeys.list(tenantId, clientId, params),
    queryFn: () => listCasesheetsApi(tenantId, clientId, params),
    enabled: !!tenantId && !!clientId,
    staleTime: 30 * 1000, // 30 seconds
    ...options,
  });
};

/**
 * Hook to get a single casesheet
 */
export const useCasesheetDetailQuery = (
  tenantId: string,
  casesheetId: string,
  options?: Omit<UseQueryOptions<CasesheetResponse, Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<CasesheetResponse, Error>({
    queryKey: casesheetsKeys.detail(tenantId, casesheetId),
    queryFn: () => getCasesheetApi(tenantId, casesheetId),
    enabled: !!tenantId && !!casesheetId,
    staleTime: 30 * 1000,
    ...options,
  });
};

// ============================================
// MUTATION HOOKS
// ============================================

/**
 * Hook to create a new casesheet
 */
export const useCreateCasesheetMutation = (
  tenantId: string,
  clientId: string,
  options?: UseMutationOptions<CasesheetResponse, Error, CasesheetCreateRequest>
) => {
  const queryClient = useQueryClient();

  return useMutation<CasesheetResponse, Error, CasesheetCreateRequest>({
    mutationFn: (payload) => createCasesheetApi(tenantId, clientId, payload),
    onSuccess: () => {
      // Invalidate list queries for this client
      queryClient.invalidateQueries({ queryKey: casesheetsKeys.list(tenantId, clientId) });
    },
    ...options,
  });
};

/**
 * Hook to update a casesheet
 */
export const useUpdateCasesheetMutation = (
  tenantId: string,
  casesheetId: string,
  options?: UseMutationOptions<CasesheetResponse, Error, CasesheetUpdateRequest>
) => {
  const queryClient = useQueryClient();

  return useMutation<CasesheetResponse, Error, CasesheetUpdateRequest>({
    mutationFn: (payload) => updateCasesheetApi(tenantId, casesheetId, payload),
    onSuccess: (data) => {
      // Update the detail cache
      queryClient.setQueryData(casesheetsKeys.detail(tenantId, casesheetId), data);
      // Invalidate list queries
      queryClient.invalidateQueries({ queryKey: casesheetsKeys.lists() });
    },
    ...options,
  });
};

/**
 * Hook to transition casesheet status
 */
export const useTransitionCasesheetStatusMutation = (
  tenantId: string,
  casesheetId: string,
  options?: UseMutationOptions<CasesheetResponse, Error, CasesheetStatusTransitionRequest>
) => {
  const queryClient = useQueryClient();

  return useMutation<CasesheetResponse, Error, CasesheetStatusTransitionRequest>({
    mutationFn: (payload) => transitionCasesheetStatusApi(tenantId, casesheetId, payload),
    onSuccess: (data) => {
      // Update the detail cache
      queryClient.setQueryData(casesheetsKeys.detail(tenantId, casesheetId), data);
      // Invalidate list queries
      queryClient.invalidateQueries({ queryKey: casesheetsKeys.lists() });
    },
    ...options,
  });
};

/**
 * Hook to print a casesheet
 */
export const usePrintCasesheetMutation = (
  tenantId: string,
  casesheetId: string,
  options?: UseMutationOptions<CasesheetPrintResponse, Error, void>
) => {
  return useMutation<CasesheetPrintResponse, Error, void>({
    mutationFn: () => printCasesheetApi(tenantId, casesheetId),
    ...options,
  });
};

/**
 * Hook to archive a casesheet
 */
export const useArchiveCasesheetMutation = (
  tenantId: string,
  casesheetId: string,
  clientId: string,
  options?: UseMutationOptions<void, Error, void>
) => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, void>({
    mutationFn: () => archiveCasesheetApi(tenantId, casesheetId),
    onSuccess: () => {
      // Invalidate detail query
      queryClient.invalidateQueries({ queryKey: casesheetsKeys.detail(tenantId, casesheetId) });
      // Invalidate list queries for this client
      queryClient.invalidateQueries({ queryKey: casesheetsKeys.list(tenantId, clientId) });
    },
    ...options,
  });
};
