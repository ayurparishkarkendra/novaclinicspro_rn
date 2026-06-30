/**
 * Treatment Orders API
 *
 * All endpoints return TreatmentOrderResponse.
 * All state-mutating endpoints require an If-Match: <version> header.
 *
 * On 409 VERSION_CONFLICT the caller must:
 *   1. Show a toast: "Plan updated elsewhere. Refreshing…"
 *   2. Refetch the order to get the current version.
 *   3. Let the user re-trigger the action — never auto-retry silently.
 */

import { axiosClient } from '../../../../core/api/axiosClient';
import {
  TreatmentOrderResponse,
  TreatmentOrdersListResponse,
  TreatmentOrdersListParams,
  SendToSchedulingRequest,
  ScheduleRowRequest,
  BulkScheduleRequest,
} from '../models/treatmentOrders.dtos';

// ============================================
// HELPERS
// ============================================

/** Build the If-Match header object required by all mutating endpoints.
 * The value must be a plain integer string — no quotes, no decimals. */
const ifMatch = (version: number): Record<string, string> => ({
  'If-Match': String(Math.floor(Number(version))),
});

// ============================================
// QUERIES
// ============================================

/**
 * Get a single treatment order by sheet id.
 * GET /api/v1/clinic/{tenant_id}/treatment-sheets/{sheet_id}  (returns TreatmentOrderResponse)
 */
export const getTreatmentOrderApi = async (
  sheetId: string,
  tenantId: string
): Promise<TreatmentOrderResponse> => {
  const response = await axiosClient.get(
    `/api/v1/clinic/${tenantId}/treatment-sheets/${sheetId}`
  );
  return response.data;
};

/**
 * Admin worklist — paginated list of treatment orders.
 * GET /api/v1/treatment-sheets/clinic/{tenant_id}/treatment-orders
 */
export const listTreatmentOrdersApi = async (
  tenantId: string,
  params?: TreatmentOrdersListParams
): Promise<TreatmentOrdersListResponse> => {
  const response = await axiosClient.get(
    `/api/v1/treatment-sheets/clinic/${tenantId}/treatment-orders`,
    { params }
  );
  return response.data;
};

// ============================================
// STATE-MUTATING ENDPOINTS
// ============================================

/** Body for POST /treatment-sheets/clinic/{tenant_id}/treatment-recommendations */
export interface CreateTreatmentRecommendationRequest {
  client_id: string;
  episode_id: string;
  appointment_id?: string | null;
  recommended_therapy: string;
  planned_sessions: number;
  frequency?: string | null;
  preferred_time_window?: string | null;
  order_notes?: string | null;
}

/**
 * Create a doctor's treatment recommendation as an ORDER — no rows created.
 * POST /api/v1/treatment-sheets/clinic/{tenant_id}/treatment-recommendations
 * Permission: treatment_sheet.order (DOCTOR role)
 *
 * The recommendation captures the therapy, recommended number of sessions,
 * frequency and notes. Admin scheduling creates the per-day rows later.
 */
export const createTreatmentRecommendationApi = async (
  tenantId: string,
  payload: CreateTreatmentRecommendationRequest
): Promise<TreatmentOrderResponse> => {
  const response = await axiosClient.post(
    `/api/v1/treatment-sheets/clinic/${tenantId}/treatment-recommendations`,
    payload
  );
  return response.data;
};

/**
 * Send treatment sheet to scheduling (DRAFT → ORDERED).
 * POST /api/v1/treatment-sheets/{sheet_id}/send-to-scheduling
 * Requires: If-Match: <version>
 * Permission: treatment_sheet.order (DOCTOR role)
 */
export const sendToSchedulingApi = async (
  sheetId: string,
  version: number,
  payload: SendToSchedulingRequest = {}
): Promise<TreatmentOrderResponse> => {
  const response = await axiosClient.post(
    `/api/v1/treatment-sheets/${sheetId}/send-to-scheduling`,
    payload,
    { headers: ifMatch(version) }
  );
  return response.data;
};

/**
 * Start a session row (SCHEDULED → IN_PROGRESS).
 * POST /api/v1/treatment-sheets/{sheet_id}/rows/{row_id}/start
 * Requires: If-Match: <version>
 * Permission: treatment_session.start (THERAPIST role)
 * Body: {} — identity derived from JWT
 */
export const startSheetRowApi = async (
  sheetId: string,
  rowId: string,
  version: number
): Promise<TreatmentOrderResponse> => {
  const response = await axiosClient.post(
    `/api/v1/treatment-sheets/${sheetId}/rows/${rowId}/start`,
    {},
    { headers: ifMatch(version) }
  );
  return response.data;
};

/**
 * Schedule a single row (assign staff + date/time).
 * PATCH /api/v1/treatment-sheets/{sheet_id}/rows/{row_id}/schedule
 * Requires: If-Match: <version>
 */
export const scheduleRowApi = async (
  sheetId: string,
  rowId: string,
  version: number,
  payload: ScheduleRowRequest
): Promise<TreatmentOrderResponse> => {
  const response = await axiosClient.patch(
    `/api/v1/treatment-sheets/${sheetId}/rows/${rowId}/schedule`,
    payload,
    { headers: ifMatch(version) }
  );
  return response.data;
};

/**
 * Bulk-schedule multiple rows in one call.
 * PATCH /api/v1/treatment-sheets/{sheet_id}/rows/bulk-schedule
 * Requires: If-Match: <version>
 */
export const bulkScheduleRowsApi = async (
  sheetId: string,
  version: number,
  payload: BulkScheduleRequest
): Promise<TreatmentOrderResponse> => {
  const response = await axiosClient.patch(
    `/api/v1/treatment-sheets/${sheetId}/rows/bulk-schedule`,
    payload,
    { headers: ifMatch(version) }
  );
  return response.data;
};

/** Denial reason recorded when a patient declines a recommendation. */
export interface CancelTreatmentOrderReason {
  reason_code?: string;
  reason_text?: string;
}

/**
 * Cancel a treatment order, recording the patient-decline reason for analytics.
 * POST /api/v1/treatment-sheets/{sheet_id}/cancel
 * Requires: If-Match: <version>
 */
export const cancelTreatmentOrderApi = async (
  sheetId: string,
  version: number,
  reason?: CancelTreatmentOrderReason
): Promise<TreatmentOrderResponse> => {
  const response = await axiosClient.post(
    `/api/v1/treatment-sheets/${sheetId}/cancel`,
    reason ?? {},
    { headers: ifMatch(version) }
  );
  return response.data;
};
