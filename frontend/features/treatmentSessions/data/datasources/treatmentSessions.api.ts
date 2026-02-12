/**
 * Treatment Sessions API
 * Handles all HTTP calls for treatment session management
 *
 * IMPORTANT: All paths must start with /api/v1/...
 */

import { axiosClient } from '../../../../core/api/axiosClient';
import {
  TreatmentSessionCreate,
  TreatmentSessionUpdate,
  TreatmentSessionResponse,
  ListTreatmentSessionsParams,
  PaginatedTreatmentSessionsResponse,
} from '../models/treatmentSessions.dtos';

/**
 * List treatment sessions for a tenant
 * GET /api/v1/clinic/{tenant_id}/treatment-sessions
 */
export const listTreatmentSessionsApi = async (
  tenantId: string,
  params?: ListTreatmentSessionsParams
): Promise<PaginatedTreatmentSessionsResponse> => {
  const response = await axiosClient.get(
    `/api/v1/clinic/${tenantId}/treatment-sessions`,
    { params }
  );
  return response.data;
};

/**
 * Get a single treatment session
 * GET /api/v1/clinic/{tenant_id}/treatment-sessions/{session_id}
 */
export const getTreatmentSessionApi = async (
  tenantId: string,
  sessionId: string
): Promise<TreatmentSessionResponse> => {
  const response = await axiosClient.get(
    `/api/v1/clinic/${tenantId}/treatment-sessions/${sessionId}`
  );
  return response.data;
};

/**
 * Create a treatment session
 * POST /api/v1/clinic/{tenant_id}/treatment-sessions
 */
export const createTreatmentSessionApi = async (
  tenantId: string,
  payload: TreatmentSessionCreate
): Promise<TreatmentSessionResponse> => {
  const response = await axiosClient.post(
    `/api/v1/clinic/${tenantId}/treatment-sessions`,
    payload
  );
  return response.data;
};

/**
 * Update a treatment session
 * PATCH /api/v1/clinic/{tenant_id}/treatment-sessions/{session_id}
 */
export const updateTreatmentSessionApi = async (
  tenantId: string,
  sessionId: string,
  payload: TreatmentSessionUpdate
): Promise<TreatmentSessionResponse> => {
  const response = await axiosClient.patch(
    `/api/v1/clinic/${tenantId}/treatment-sessions/${sessionId}`,
    payload
  );
  return response.data;
};

/**
 * Delete a treatment session
 * DELETE /api/v1/clinic/{tenant_id}/treatment-sessions/{session_id}
 */
export const deleteTreatmentSessionApi = async (
  tenantId: string,
  sessionId: string
): Promise<void> => {
  await axiosClient.delete(
    `/api/v1/clinic/${tenantId}/treatment-sessions/${sessionId}`
  );
};

/**
 * Start a treatment session (set status to in_progress)
 * PATCH /api/v1/clinic/{tenant_id}/treatment-sessions/{session_id}/start
 */
export const startTreatmentSessionApi = async (
  tenantId: string,
  sessionId: string
): Promise<TreatmentSessionResponse> => {
  const response = await axiosClient.patch(
    `/api/v1/clinic/${tenantId}/treatment-sessions/${sessionId}/start`
  );
  return response.data;
};

/**
 * Complete a treatment session
 * PATCH /api/v1/clinic/{tenant_id}/treatment-sessions/{session_id}/complete
 */
export const completeTreatmentSessionApi = async (
  tenantId: string,
  sessionId: string,
  payload?: { observations?: string; progress_notes?: string }
): Promise<TreatmentSessionResponse> => {
  const response = await axiosClient.patch(
    `/api/v1/clinic/${tenantId}/treatment-sessions/${sessionId}/complete`,
    payload || {}
  );
  return response.data;
};
