/**
 * Prescriptions Repository Implementation
 * React Query hooks for prescriptions
 */

import { useQuery, useMutation, useQueryClient, UseQueryOptions, UseMutationOptions } from '@tanstack/react-query';
import {
  listPrescriptionsApi,
  getPrescriptionApi,
  createPrescriptionApi,
  updatePrescriptionApi,
  deletePrescriptionApi,
  sharePrescriptionApi,
  getPrescriptionPrintApi,
} from '../datasources/prescriptions.api';
import {
  PrescriptionCreateRequest,
  PrescriptionUpdateRequest,
  PrescriptionShareRequest,
  PrescriptionResponse,
  PrescriptionListResponse,
  PrescriptionShareResponse,
  PrescriptionPrintResponse,
  ListPrescriptionsParams,
} from '../models/prescriptions.dtos';

// ============================================
// QUERY KEYS
// ============================================

export const prescriptionsKeys = {
  all: ['prescriptions'] as const,
  lists: () => [...prescriptionsKeys.all, 'list'] as const,
  list: (tenantId: string, params?: ListPrescriptionsParams) =>
    [...prescriptionsKeys.lists(), tenantId, params] as const,
  details: () => [...prescriptionsKeys.all, 'detail'] as const,
  detail: (tenantId: string, prescriptionId: string) =>
    [...prescriptionsKeys.details(), tenantId, prescriptionId] as const,
};

// ============================================
// QUERY HOOKS
// ============================================

/**
 * Hook to list prescriptions (tenant-scoped, can filter by client)
 */
export const usePrescriptionsListQuery = (
  tenantId: string,
  params?: ListPrescriptionsParams,
  options?: Omit<UseQueryOptions<PrescriptionListResponse, Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<PrescriptionListResponse, Error>({
    queryKey: prescriptionsKeys.list(tenantId, params),
    queryFn: () => listPrescriptionsApi(tenantId, params),
    enabled: !!tenantId,
    staleTime: 30 * 1000, // 30 seconds
    ...options,
  });
};

/**
 * Hook to get a single prescription
 */
export const usePrescriptionDetailQuery = (
  tenantId: string,
  prescriptionId: string,
  options?: Omit<UseQueryOptions<PrescriptionResponse, Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<PrescriptionResponse, Error>({
    queryKey: prescriptionsKeys.detail(tenantId, prescriptionId),
    queryFn: () => getPrescriptionApi(tenantId, prescriptionId),
    enabled: !!tenantId && !!prescriptionId,
    staleTime: 30 * 1000,
    ...options,
  });
};

// ============================================
// MUTATION HOOKS
// ============================================

/**
 * Hook to create a new prescription
 */
export const useCreatePrescriptionMutation = (
  tenantId: string,
  options?: UseMutationOptions<PrescriptionResponse, Error, PrescriptionCreateRequest>
) => {
  const queryClient = useQueryClient();

  return useMutation<PrescriptionResponse, Error, PrescriptionCreateRequest>({
    mutationFn: (payload) => createPrescriptionApi(tenantId, payload),
    onSuccess: () => {
      // Invalidate list queries
      queryClient.invalidateQueries({ queryKey: prescriptionsKeys.lists() });
    },
    ...options,
  });
};

/**
 * Hook to update a prescription
 */
export const useUpdatePrescriptionMutation = (
  tenantId: string,
  prescriptionId: string,
  options?: UseMutationOptions<PrescriptionResponse, Error, PrescriptionUpdateRequest>
) => {
  const queryClient = useQueryClient();

  return useMutation<PrescriptionResponse, Error, PrescriptionUpdateRequest>({
    mutationFn: (payload) => updatePrescriptionApi(tenantId, prescriptionId, payload),
    onSuccess: (data) => {
      // Update the detail cache
      queryClient.setQueryData(prescriptionsKeys.detail(tenantId, prescriptionId), data);
      // Invalidate list queries
      queryClient.invalidateQueries({ queryKey: prescriptionsKeys.lists() });
    },
    ...options,
  });
};

/**
 * Hook to delete a prescription
 */
export const useDeletePrescriptionMutation = (
  tenantId: string,
  prescriptionId: string,
  options?: UseMutationOptions<void, Error, void>
) => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, void>({
    mutationFn: () => deletePrescriptionApi(tenantId, prescriptionId),
    onSuccess: () => {
      // Invalidate detail query
      queryClient.invalidateQueries({ queryKey: prescriptionsKeys.detail(tenantId, prescriptionId) });
      // Invalidate list queries
      queryClient.invalidateQueries({ queryKey: prescriptionsKeys.lists() });
    },
    ...options,
  });
};

/**
 * Hook to share a signed prescription
 */
export const useSharePrescriptionMutation = (
  tenantId: string,
  prescriptionId: string,
  options?: UseMutationOptions<PrescriptionShareResponse, Error, PrescriptionShareRequest>
) => {
  return useMutation<PrescriptionShareResponse, Error, PrescriptionShareRequest>({
    mutationFn: (payload) => sharePrescriptionApi(tenantId, prescriptionId, payload),
    ...options,
  });
};

export const usePrescriptionPrintMutation = (
  tenantId: string,
  prescriptionId: string,
  options?: UseMutationOptions<PrescriptionPrintResponse, Error, void>
) => {
  return useMutation<PrescriptionPrintResponse, Error, void>({
    mutationFn: () => getPrescriptionPrintApi(tenantId, prescriptionId),
    ...options,
  });
};
