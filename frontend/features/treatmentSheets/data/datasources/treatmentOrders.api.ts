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

/**
 * Cancel a treatment order.
 * POST /api/v1/treatment-sheets/{sheet_id}/cancel
 * Requires: If-Match: <version>
 */
export const cancelTreatmentOrderApi = async (
  sheetId: string,
  version: number
): Promise<TreatmentOrderResponse> => {
  const response = await axiosClient.post(
    `/api/v1/treatment-sheets/${sheetId}/cancel`,
    {},
    { headers: ifMatch(version) }
  );
  return response.data;
};
