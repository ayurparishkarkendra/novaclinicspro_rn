/**
 * Casesheets API
 * Handles all HTTP calls for clinical case sheets
 *
 * IMPORTANT: All paths must start with /api/v1/...
 * Casesheets are CLIENT-SCOPED - list/create requires client_id in path
 */

import { axiosClient } from '../../../../core/api/axiosClient';
import {
  CasesheetCreateRequest,
  CasesheetUpdateRequest,
  CasesheetStatusTransitionRequest,
  CasesheetResponse,
  CasesheetListResponse,
  CasesheetPrintResponse,
  ListCasesheetsParams,
} from '../models/casesheets.dtos';

/**
 * List casesheets for a client
 * GET /api/v1/clinic/{tenant_id}/clients/{client_id}/casesheets
 */
export const listCasesheetsApi = async (
  tenantId: string,
  clientId: string,
  params?: ListCasesheetsParams
): Promise<CasesheetListResponse> => {
  const response = await axiosClient.get(
    `/api/v1/clinic/${tenantId}/clients/${clientId}/casesheets`,
    { params }
  );
  return response.data;
};

/**
 * Get a single casesheet by ID
 * GET /api/v1/clinic/{tenant_id}/casesheets/{casesheet_id}
 */
export const getCasesheetApi = async (
  tenantId: string,
  casesheetId: string
): Promise<CasesheetResponse> => {
  const response = await axiosClient.get(
    `/api/v1/clinic/${tenantId}/casesheets/${casesheetId}`
  );
  return response.data;
};

/**
 * Create a new casesheet for a client
 * POST /api/v1/clinic/{tenant_id}/clients/{client_id}/casesheets
 */
export const createCasesheetApi = async (
  tenantId: string,
  clientId: string,
  payload: CasesheetCreateRequest
): Promise<CasesheetResponse> => {
  const response = await axiosClient.post(
    `/api/v1/clinic/${tenantId}/clients/${clientId}/casesheets`,
    payload
  );
  return response.data;
};

/**
 * Update an existing casesheet
 * PATCH /api/v1/clinic/{tenant_id}/casesheets/{casesheet_id}
 */
export const updateCasesheetApi = async (
  tenantId: string,
  casesheetId: string,
  payload: CasesheetUpdateRequest
): Promise<CasesheetResponse> => {
  const response = await axiosClient.patch(
    `/api/v1/clinic/${tenantId}/casesheets/${casesheetId}`,
    payload
  );
  return response.data;
};

/**
 * Transition casesheet status (DRAFT → FINAL → SIGNED)
 * PATCH /api/v1/clinic/{tenant_id}/casesheets/{casesheet_id}/status
 */
export const transitionCasesheetStatusApi = async (
  tenantId: string,
  casesheetId: string,
  payload: CasesheetStatusTransitionRequest
): Promise<CasesheetResponse> => {
  const response = await axiosClient.patch(
    `/api/v1/clinic/${tenantId}/casesheets/${casesheetId}/status`,
    payload
  );
  return response.data;
};

/**
 * Print casesheet (returns HTML/PDF content)
 * GET /api/v1/clinic/{tenant_id}/casesheets/{casesheet_id}/print
 */
export const printCasesheetApi = async (
  tenantId: string,
  casesheetId: string
): Promise<CasesheetPrintResponse> => {
  const response = await axiosClient.get(
    `/api/v1/clinic/${tenantId}/casesheets/${casesheetId}/print`
  );
  return response.data;
};

/**
 * Archive (soft delete) a casesheet
 * DELETE /api/v1/clinic/{tenant_id}/casesheets/{casesheet_id}
 */
export const archiveCasesheetApi = async (
  tenantId: string,
  casesheetId: string
): Promise<void> => {
  await axiosClient.delete(
    `/api/v1/clinic/${tenantId}/casesheets/${casesheetId}`
  );
};
