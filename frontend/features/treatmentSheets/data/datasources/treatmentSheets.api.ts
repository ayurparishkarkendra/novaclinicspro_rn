/**
 * Treatment Sheets API
 * Handles all HTTP calls for treatment sheets
 *
 * IMPORTANT: Treatment sheets are created FROM casesheets
 * No standalone list endpoint - access via casesheet or by ID
 */

import { axiosClient } from '../../../../core/api/axiosClient';
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

/**
 * Create treatment sheet from a casesheet
 * POST /api/v1/clinic/casesheets/{case_sheet_id}/treatment-sheets
 */
export const createTreatmentSheetApi = async (
  casesheetId: string,
  payload: TreatmentSheetCreateRequest
): Promise<TreatmentSheetResponse> => {
  const response = await axiosClient.post(
    `/api/v1/clinic/casesheets/${casesheetId}/treatment-sheets`,
    payload
  );
  return response.data;
};

/**
 * Create treatment sheet (simplified, tenant-scoped)
 * POST /api/v1/clinic/tenants/{tenant_id}/treatment-sheets
 */
export const createSimpleTreatmentSheetApi = async (
  tenantId: string,
  payload: TreatmentSheetSimpleCreateRequest
): Promise<TreatmentSheetResponse> => {
  const response = await axiosClient.post(
    `/api/v1/clinic/tenants/${tenantId}/treatment-sheets`,
    payload
  );
  return response.data;
};

/**
 * Get a treatment sheet by ID
 * GET /api/v1/clinic/treatment-sheets/{treatment_sheet_id}?tenant_id={tenant_id}
 * 
 * BUG FIX #9: Backend requires tenant_id as a query parameter
 */
export const getTreatmentSheetApi = async (
  treatmentSheetId: string,
  tenantId?: string
): Promise<TreatmentSheetResponse> => {
  const params: Record<string, string> = {};
  if (tenantId) {
    params.tenant_id = tenantId;
  }
  const response = await axiosClient.get(
    `/api/v1/clinic/treatment-sheets/${treatmentSheetId}`,
    { params }
  );
  return response.data;
};

/**
 * Get treatment sheets by episode ID
 * GET /api/v1/clinic/{tenant_id}/treatment-sheets?episode_id={episode_id}
 */
export const getTreatmentSheetsByEpisodeApi = async (
  tenantId: string,
  episodeId: string
): Promise<{ treatment_sheets: TreatmentSheetResponse[]; total: number }> => {
  const response = await axiosClient.get(
    `/api/v1/clinic/${tenantId}/treatment-sheets`,
    { params: { episode_id: episodeId } }
  );
  return response.data;
};

/**
 * Transition treatment sheet status (DRAFT → FINAL → SIGNED)
 * PATCH /api/v1/clinic/treatment-sheets/{treatment_sheet_id}/status
 */
export const transitionTreatmentSheetStatusApi = async (
  treatmentSheetId: string,
  payload: TreatmentSheetStatusTransitionRequest
): Promise<TreatmentSheetResponse> => {
  const response = await axiosClient.patch(
    `/api/v1/clinic/treatment-sheets/${treatmentSheetId}/status`,
    payload
  );
  return response.data;
};

/**
 * Sync treatment sheet with treatment sessions
 * POST /api/v1/clinic/{tenant_id}/treatment-sheets/{sheet_id}/sync?series_id={series_id}
 */
export const syncTreatmentSheetApi = async (
  tenantId: string,
  treatmentSheetId: string,
  seriesId: string
): Promise<TreatmentSheetSyncResponse> => {
  const response = await axiosClient.post(
    `/api/v1/clinic/${tenantId}/treatment-sheets/${treatmentSheetId}/sync`,
    null,
    { params: { series_id: seriesId } }
  );
  return response.data;
};

/**
 * Print treatment sheet
 * GET /api/v1/clinic/treatment-sheets/{treatment_sheet_id}/print
 */
export const printTreatmentSheetApi = async (
  treatmentSheetId: string
): Promise<TreatmentSheetPrintResponse> => {
  const response = await axiosClient.get(
    `/api/v1/clinic/treatment-sheets/${treatmentSheetId}/print`
  );
  return response.data;
};

/**
 * Archive (soft delete) a treatment sheet
 * DELETE /api/v1/clinic/treatment-sheets/{treatment_sheet_id}
 */
export const archiveTreatmentSheetApi = async (
  treatmentSheetId: string
): Promise<void> => {
  await axiosClient.delete(
    `/api/v1/clinic/treatment-sheets/${treatmentSheetId}`
  );
};

/**
 * Update all treatment sheet rows (bulk update)
 * PATCH /api/v1/clinic/treatment-sheets/{treatment_sheet_id}/rows
 */
export const updateAllTreatmentSheetRowsApi = async (
  treatmentSheetId: string,
  rows: Array<{ id: string } & TreatmentSheetRowUpdateRequest>
): Promise<TreatmentSheetResponse> => {
  const response = await axiosClient.patch(
    `/api/v1/clinic/treatment-sheets/${treatmentSheetId}/rows`,
    { rows }
  );
  return response.data;
};

/**
 * Update a single treatment sheet row
 * PATCH /api/v1/clinic/treatment-sheets/rows/{row_id}
 */
export const updateTreatmentSheetRowApi = async (
  rowId: string,
  payload: TreatmentSheetRowUpdateRequest
): Promise<TreatmentSheetResponse> => {
  const response = await axiosClient.patch(
    `/api/v1/clinic/treatment-sheets/rows/${rowId}`,
    payload
  );
  return response.data;
};

/**
 * Complete a treatment sheet row
 * POST /api/v1/clinic/treatment-sheets/rows/{row_id}/complete
 */
export const completeTreatmentSheetRowApi = async (
  rowId: string,
  payload: TreatmentSheetRowCompleteRequest
): Promise<TreatmentSheetResponse> => {
  const response = await axiosClient.post(
    `/api/v1/clinic/treatment-sheets/rows/${rowId}/complete`,
    payload
  );
  return response.data;
};
