/**
 * Bulk Upload API
 * Handles all HTTP calls for bulk upload operations
 *
 * IMPORTANT: Bulk upload endpoints are under /api/v1/bulk/...
 */

import { axiosClient } from '../../../../core/api/axiosClient';
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
// UPLOAD
// ============================================

/**
 * Upload a file for bulk processing
 * POST /api/v1/bulk/{entity_type}/upload
 */
export const bulkUploadFileApi = async (
  entityType: BulkEntityType,
  file: File | Blob,
  filename?: string
): Promise<BulkUploadResponse> => {
  const formData = new FormData();
  formData.append('file', file, filename || 'upload.csv');

  const response = await axiosClient.post(
    `/api/v1/bulk/${entityType}/upload`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );
  return response.data;
};

/**
 * Download the backend-defined CSV template for an entity type
 * GET /api/v1/bulk/{entity_type}/template
 */
export const getBulkTemplateApi = async (
  entityType: BulkEntityType
): Promise<BulkTemplateResponse> => {
  const response = await axiosClient.get(`/api/v1/bulk/${entityType}/template`);
  return response.data;
};

// ============================================
// JOB MANAGEMENT
// ============================================

/**
 * Get job details with rows
 * GET /api/v1/bulk/{job_id}
 */
export const getJobApi = async (
  jobId: string,
  params?: { skip?: number; limit?: number; status?: string }
): Promise<JobWithRowsResponse> => {
  const response = await axiosClient.get(`/api/v1/bulk/${jobId}`, { params });
  return response.data;
};

/**
 * Apply column mapping to job
 * POST /api/v1/bulk/{job_id}/mapping
 */
export const applyMappingApi = async (
  jobId: string,
  mapping: ColumnMappingRequest
): Promise<JobSummary> => {
  const response = await axiosClient.post(`/api/v1/bulk/${jobId}/mapping`, mapping);
  return response.data;
};

/**
 * Validate job data
 * POST /api/v1/bulk/{job_id}/validate
 */
export const validateJobApi = async (jobId: string): Promise<ValidationSummary> => {
  const response = await axiosClient.post(`/api/v1/bulk/${jobId}/validate`);
  return response.data;
};

/**
 * Update a staging row
 * PATCH /api/v1/bulk/{job_id}/rows/{row_id}
 */
export const updateRowApi = async (
  jobId: string,
  rowId: string,
  data: StagingRowUpdateRequest
): Promise<StagingRow> => {
  const response = await axiosClient.patch(`/api/v1/bulk/${jobId}/rows/${rowId}`, data);
  return response.data;
};

/**
 * Commit validated data
 * POST /api/v1/bulk/{job_id}/commit
 */
export const commitJobApi = async (jobId: string): Promise<CommitResult> => {
  const response = await axiosClient.post(`/api/v1/bulk/${jobId}/commit`);
  return response.data;
};
