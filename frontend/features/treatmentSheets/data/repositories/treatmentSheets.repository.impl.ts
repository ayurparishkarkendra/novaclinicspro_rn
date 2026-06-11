/**
 * Treatment Sheets Repository Implementation
 * React Query hooks for treatment sheets
 */

import { useQuery, useMutation, useQueryClient, UseQueryOptions, UseMutationOptions } from '@tanstack/react-query';
import {
  createTreatmentSheetApi,
  createSimpleTreatmentSheetApi,
  getTreatmentSheetApi,
  getTreatmentSheetsByEpisodeApi,
  transitionTreatmentSheetStatusApi,
  syncTreatmentSheetApi,
  printTreatmentSheetApi,
  archiveTreatmentSheetApi,
  updateTreatmentSheetRowApi,
  completeTreatmentSheetRowApi,
} from '../datasources/treatmentSheets.api';
import {
  TreatmentSheetCreateRequest,
  TreatmentSheetSimpleCreateRequest,
  TreatmentSheetRowUpdateRequest,
  TreatmentSheetRowCompleteRequest,
  TreatmentSheetStatusTransitionRequest,
  TreatmentSheetResponse,
  TreatmentSheetSyncResponse,
  TreatmentSheetPrintResponse,
} from '../models/treatmentSheets.dtos';

// ============================================
// QUERY KEYS
// ============================================

export const treatmentSheetsKeys = {
  all: ['treatmentSheets'] as const,
  details: () => [...treatmentSheetsKeys.all, 'detail'] as const,
  detail: (treatmentSheetId: string) =>
    [...treatmentSheetsKeys.details(), treatmentSheetId] as const,
  byEpisode: (episodeId: string) =>
    [...treatmentSheetsKeys.all, 'episode', episodeId] as const,
};

// ============================================
// QUERY HOOKS
// ============================================

/**
 * Hook to get a treatment sheet by ID
 */
export const useTreatmentSheetDetailQuery = (
  treatmentSheetId: string,
  tenantId: string,
  options?: Omit<UseQueryOptions<TreatmentSheetResponse, Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<TreatmentSheetResponse, Error>({
    queryKey: treatmentSheetsKeys.detail(treatmentSheetId),
    queryFn: () => getTreatmentSheetApi(treatmentSheetId, tenantId),
    enabled: !!treatmentSheetId && !!tenantId,
    staleTime: 30 * 1000,
    ...options,
  });
};

/**
 * Hook to get treatment sheets by episode ID
 */
export const useTreatmentSheetsByEpisodeQuery = (
  tenantId: string,
  episodeId: string,
  options?: Omit<UseQueryOptions<{ treatment_sheets: TreatmentSheetResponse[]; total: number }, Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<{ treatment_sheets: TreatmentSheetResponse[]; total: number }, Error>({
    queryKey: treatmentSheetsKeys.byEpisode(episodeId),
    queryFn: () => getTreatmentSheetsByEpisodeApi(tenantId, episodeId),
    enabled: !!tenantId && !!episodeId,
    staleTime: 30 * 1000, // 30 seconds
    ...options,
  });
};

// ============================================
// MUTATION HOOKS
// ============================================

/**
 * Hook to create a treatment sheet from a casesheet
 */
export const useCreateTreatmentSheetMutation = (
  casesheetId: string,
  options?: UseMutationOptions<TreatmentSheetResponse, Error, TreatmentSheetCreateRequest>
) => {
  const queryClient = useQueryClient();

  return useMutation<TreatmentSheetResponse, Error, TreatmentSheetCreateRequest>({
    mutationFn: (payload) => createTreatmentSheetApi(casesheetId, payload),
    onSuccess: () => {
      // Invalidate all treatment sheet queries
      queryClient.invalidateQueries({ queryKey: treatmentSheetsKeys.all });
    },
    ...options,
  });
};

/**
 * Hook to create a treatment sheet (simplified, without casesheet)
 */
export const useCreateSimpleTreatmentSheetMutation = (
  tenantId: string,
  options?: UseMutationOptions<TreatmentSheetResponse, Error, TreatmentSheetSimpleCreateRequest>
) => {
  const queryClient = useQueryClient();

  return useMutation<TreatmentSheetResponse, Error, TreatmentSheetSimpleCreateRequest>({
    mutationFn: (payload) => createSimpleTreatmentSheetApi(tenantId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: treatmentSheetsKeys.all });
    },
    ...options,
  });
};

/**
 * Hook to transition treatment sheet status
 */
export const useTransitionTreatmentSheetStatusMutation = (
  tenantId: string,
  treatmentSheetId: string,
  options?: UseMutationOptions<TreatmentSheetResponse, Error, TreatmentSheetStatusTransitionRequest>
) => {
  const queryClient = useQueryClient();

  return useMutation<TreatmentSheetResponse, Error, TreatmentSheetStatusTransitionRequest>({
    mutationFn: (payload) => transitionTreatmentSheetStatusApi(tenantId, treatmentSheetId, payload),
    onSuccess: (data) => {
      queryClient.setQueryData(treatmentSheetsKeys.detail(treatmentSheetId), data);
    },
    ...options,
  });
};

/**
 * Hook to sync treatment sheet with sessions
 */
export const useSyncTreatmentSheetMutation = (
  tenantId: string,
  treatmentSheetId: string,
  options?: UseMutationOptions<TreatmentSheetSyncResponse, Error, string>
) => {
  const queryClient = useQueryClient();

  return useMutation<TreatmentSheetSyncResponse, Error, string>({
    mutationFn: (seriesId: string) => syncTreatmentSheetApi(tenantId, treatmentSheetId, seriesId),
    onSuccess: () => {
      // Refetch the treatment sheet to get updated rows
      queryClient.invalidateQueries({ queryKey: treatmentSheetsKeys.detail(treatmentSheetId) });
    },
    ...options,
  });
};

/**
 * Hook to print a treatment sheet
 */
export const usePrintTreatmentSheetMutation = (
  tenantId: string,
  treatmentSheetId: string,
  options?: UseMutationOptions<TreatmentSheetPrintResponse, Error, void>
) => {
  return useMutation<TreatmentSheetPrintResponse, Error, void>({
    mutationFn: () => printTreatmentSheetApi(tenantId, treatmentSheetId),
    ...options,
  });
};

/**
 * Hook to archive a treatment sheet
 */
export const useArchiveTreatmentSheetMutation = (
  tenantId: string,
  treatmentSheetId: string,
  options?: UseMutationOptions<void, Error, void>
) => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, void>({
    mutationFn: () => archiveTreatmentSheetApi(tenantId, treatmentSheetId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: treatmentSheetsKeys.detail(treatmentSheetId) });
      queryClient.invalidateQueries({ queryKey: treatmentSheetsKeys.all });
    },
    ...options,
  });
};

/**
 * Hook to update a treatment sheet row
 */
export const useUpdateTreatmentSheetRowMutation = (
  tenantId: string,
  rowId: string,
  treatmentSheetId: string,
  options?: UseMutationOptions<TreatmentSheetResponse, Error, TreatmentSheetRowUpdateRequest>
) => {
  const queryClient = useQueryClient();

  return useMutation<TreatmentSheetResponse, Error, TreatmentSheetRowUpdateRequest>({
    mutationFn: (payload) => updateTreatmentSheetRowApi(tenantId, rowId, payload),
    onSuccess: (data) => {
      queryClient.setQueryData(treatmentSheetsKeys.detail(treatmentSheetId), data);
    },
    ...options,
  });
};

/**
 * Hook to complete a treatment sheet row
 */
export const useCompleteTreatmentSheetRowMutation = (
  rowId: string,
  treatmentSheetId: string,
  options?: UseMutationOptions<TreatmentSheetResponse, Error, TreatmentSheetRowCompleteRequest>
) => {
  const queryClient = useQueryClient();

  return useMutation<TreatmentSheetResponse, Error, TreatmentSheetRowCompleteRequest>({
    mutationFn: (payload) => completeTreatmentSheetRowApi(rowId, payload),
    onSuccess: (data) => {
      queryClient.setQueryData(treatmentSheetsKeys.detail(treatmentSheetId), data);
    },
    ...options,
  });
};
