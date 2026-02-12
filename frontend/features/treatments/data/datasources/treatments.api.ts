/**
 * Treatments API
 * Handles all HTTP calls for treatment management
 * 
 * IMPORTANT: All paths must start with /api/v1/...
 */

import { axiosClient } from '../../../../core/api/axiosClient';
import {
  TreatmentCreate,
  TreatmentUpdate,
  TreatmentResponse,
  ListTreatmentsParams,
  PaginatedTreatmentsResponse,
} from '../models/treatments.dtos';

/**
 * List treatments for a tenant
 * GET /api/v1/clinic/{tenant_id}/treatments
 */
export const listTreatmentsApi = async (
  tenantId: string,
  params?: ListTreatmentsParams
): Promise<PaginatedTreatmentsResponse> => {
  const response = await axiosClient.get(
    `/api/v1/clinic/${tenantId}/treatments`,
    { params }
  );
  return response.data;
};

/**
 * Get a single treatment
 * GET /api/v1/clinic/{tenant_id}/treatments/{treatment_id}
 */
export const getTreatmentApi = async (
  tenantId: string,
  treatmentId: string
): Promise<TreatmentResponse> => {
  const response = await axiosClient.get(
    `/api/v1/clinic/${tenantId}/treatments/${treatmentId}`
  );
  return response.data;
};

/**
 * Create a treatment
 * POST /api/v1/clinic/{tenant_id}/treatments
 */
export const createTreatmentApi = async (
  tenantId: string,
  payload: TreatmentCreate
): Promise<TreatmentResponse> => {
  const response = await axiosClient.post(
    `/api/v1/clinic/${tenantId}/treatments`,
    payload
  );
  return response.data;
};

/**
 * Update a treatment
 * PATCH /api/v1/clinic/{tenant_id}/treatments/{treatment_id}
 */
export const updateTreatmentApi = async (
  tenantId: string,
  treatmentId: string,
  payload: TreatmentUpdate
): Promise<TreatmentResponse> => {
  const response = await axiosClient.patch(
    `/api/v1/clinic/${tenantId}/treatments/${treatmentId}`,
    payload
  );
  return response.data;
};

/**
 * Delete a treatment
 * DELETE /api/v1/clinic/{tenant_id}/treatments/{treatment_id}
 */
export const deleteTreatmentApi = async (
  tenantId: string,
  treatmentId: string
): Promise<void> => {
  await axiosClient.delete(
    `/api/v1/clinic/${tenantId}/treatments/${treatmentId}`
  );
};
