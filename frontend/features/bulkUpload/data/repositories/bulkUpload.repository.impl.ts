/**
 * Bulk Upload Repository Implementation
 * React Query hooks for bulk upload operations
 */

import { useQuery, useMutation, useQueryClient, UseQueryOptions, UseMutationOptions } from '@tanstack/react-query';
import {
  bulkUploadFileApi,
  getBulkTemplateApi,
  getJobApi,
  applyMappingApi,
  validateJobApi,
  updateRowApi,
  commitJobApi,
} from '../datasources/bulkUpload.api';
import {
  BulkEntityType,
  BulkUploadResponse,
  BulkTemplateResponse,
  JobSummary,
  ValidationSummary,
  CommitResult,
  JobWithRowsResponse,
  ColumnMappingRequest,
  StagingRowUpdateRequest,
  StagingRow,
} from '../models/bulkUpload.dtos';

// ============================================
// QUERY KEYS
// ============================================

export const bulkUploadKeys = {
  all: ['bulkUpload'] as const,
  jobs: () => [...bulkUploadKeys.all, 'job'] as const,
  job: (jobId: string, params?: { skip?: number; limit?: number; status?: string }) =>
    [...bulkUploadKeys.jobs(), jobId, params] as const,
};

export const useBulkTemplateMutation = (
  options?: UseMutationOptions<BulkTemplateResponse, Error, BulkEntityType>
) => {
  return useMutation<BulkTemplateResponse, Error, BulkEntityType>({
    mutationFn: (entityType) => getBulkTemplateApi(entityType),
    ...options,
  });
};

// ============================================
// QUERY HOOKS
// ============================================

/**
 * Hook to get job details with rows
 */
export const useJobQuery = (
  jobId: string,
  params?: { skip?: number; limit?: number; status?: string },
  options?: Omit<UseQueryOptions<JobWithRowsResponse, Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<JobWithRowsResponse, Error>({
    queryKey: bulkUploadKeys.job(jobId, params),
    queryFn: () => getJobApi(jobId, params),
    enabled: !!jobId,
    staleTime: 10 * 1000, // 10 seconds - job data changes frequently
    refetchInterval: (query) => {
      // Auto-refetch while job is in progress
      const status = query.state.data?.job.status;
      if (status && ['validating', 'committing'].includes(status)) {
        return 2000; // Poll every 2 seconds
      }
      return false;
    },
    ...options,
  });
};

// ============================================
// MUTATION HOOKS
// ============================================

/**
 * Hook to upload a file for bulk processing
 */
export const useBulkUploadMutation = (
  options?: UseMutationOptions<
    BulkUploadResponse,
    Error,
    { entityType: BulkEntityType; file: File | Blob; filename?: string }
  >
) => {
  return useMutation<
    BulkUploadResponse,
    Error,
    { entityType: BulkEntityType; file: File | Blob; filename?: string }
  >({
    mutationFn: ({ entityType, file, filename }) =>
      bulkUploadFileApi(entityType, file, filename),
    ...options,
  });
};

/**
 * Hook to apply column mapping
 */
export const useApplyMappingMutation = (
  jobId: string,
  options?: UseMutationOptions<JobSummary, Error, ColumnMappingRequest>
) => {
  const queryClient = useQueryClient();

  return useMutation<JobSummary, Error, ColumnMappingRequest>({
    mutationFn: (mapping) => applyMappingApi(jobId, mapping),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bulkUploadKeys.job(jobId) });
    },
    ...options,
  });
};

/**
 * Hook to validate job
 */
export const useValidateJobMutation = (
  jobId: string,
  options?: UseMutationOptions<ValidationSummary, Error, void>
) => {
  const queryClient = useQueryClient();

  return useMutation<ValidationSummary, Error, void>({
    mutationFn: () => validateJobApi(jobId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bulkUploadKeys.job(jobId) });
    },
    ...options,
  });
};

/**
 * Hook to update a staging row
 */
export const useUpdateRowMutation = (
  jobId: string,
  rowId: string,
  options?: UseMutationOptions<StagingRow, Error, StagingRowUpdateRequest>
) => {
  const queryClient = useQueryClient();

  return useMutation<StagingRow, Error, StagingRowUpdateRequest>({
    mutationFn: (data) => updateRowApi(jobId, rowId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bulkUploadKeys.job(jobId) });
    },
    ...options,
  });
};

/**
 * Hook to commit validated data
 */
export const useCommitJobMutation = (
  jobId: string,
  options?: UseMutationOptions<CommitResult, Error, void>
) => {
  const queryClient = useQueryClient();

  return useMutation<CommitResult, Error, void>({
    mutationFn: () => commitJobApi(jobId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bulkUploadKeys.job(jobId) });
    },
    ...options,
  });
};
