/**
 * Therapist Dashboard API
 * Handles all HTTP calls for the therapist dashboard
 * 
 * API Support Status:
 * - Dashboard/Worklist: SUPPORTED via /staff/me/dashboard/therapist
 * - Leave Management: SUPPORTED via /staff/{staff_id}/leave
 * - Documents: NOT SUPPORTED - throws NotImplementedError
 * - Bank Details: NOT SUPPORTED - throws NotImplementedError
 * - Payslips/Salary: NOT SUPPORTED - throws NotImplementedError
 * - Learning: NOT SUPPORTED - throws NotImplementedError
 */

import { axiosClient } from '../../../../core/api/axiosClient';
import { TherapistDashboardResponse } from '../../../staffDashboards/data/models/staffDashboards.dtos';
import {
  StaffLeaveResponse,
  StaffLeaveCreate,
  PaginatedLeaveResponse,
} from '../../../staff/data/models/staff.dtos';
import { WorklistParams } from '../models/therapistDashboard.dtos';

// ============================================
// CUSTOM ERROR FOR UNSUPPORTED APIs
// ============================================

export class ApiNotImplementedError extends Error {
  constructor(feature: string) {
    super(`${feature} is not available in this environment - no backend API support`);
    this.name = 'ApiNotImplementedError';
  }
}

// ============================================
// DASHBOARD / WORKLIST APIs (SUPPORTED)
// ============================================

/**
 * Get therapist dashboard/worklist data
 * GET /api/v1/clinic/{tenant_id}/staff/me/dashboard/therapist
 * 
 * @param tenantId - Clinic tenant ID
 * @param params - Optional filter parameters (not yet supported by backend)
 */
export const getTherapistWorklistApi = async (
  tenantId: string,
  _params?: WorklistParams
): Promise<TherapistDashboardResponse> => {
  // Note: Backend doesn't support params yet, filtering done client-side
  const response = await axiosClient.get(
    `/api/v1/clinic/${tenantId}/staff/me/dashboard/therapist`
  );
  return response.data;
};

// ============================================
// KPI APIs (DERIVED FROM DASHBOARD DATA)
// ============================================

/**
 * Get therapist KPIs
 * Note: KPIs are derived from dashboard data, no separate endpoint
 * This function is a pass-through to dashboard API
 */
export const getTherapistKpisApi = async (
  tenantId: string,
  _params?: { period?: string }
): Promise<TherapistDashboardResponse> => {
  // KPIs are calculated client-side from dashboard response
  return getTherapistWorklistApi(tenantId);
};

// ============================================
// LEAVE MANAGEMENT APIs (SUPPORTED)
// ============================================

/**
 * List therapist's leave requests
 * GET /api/v1/clinic/{tenant_id}/staff/{staff_id}/leave
 */
export const getTherapistLeaveRequestsApi = async (
  tenantId: string,
  staffId: string,
  params?: { status?: string; skip?: number; limit?: number }
): Promise<PaginatedLeaveResponse> => {
  const response = await axiosClient.get(
    `/api/v1/clinic/${tenantId}/staff/${staffId}/leave`,
    { params }
  );
  return response.data;
};

/**
 * Create a leave request
 * POST /api/v1/clinic/{tenant_id}/staff/{staff_id}/leave
 */
export const createTherapistLeaveRequestApi = async (
  tenantId: string,
  staffId: string,
  payload: StaffLeaveCreate
): Promise<StaffLeaveResponse> => {
  const response = await axiosClient.post(
    `/api/v1/clinic/${tenantId}/staff/${staffId}/leave`,
    payload
  );
  return response.data;
};

/**
 * Cancel a leave request
 * PATCH /api/v1/clinic/{tenant_id}/leave/{leave_id}/cancel
 */
export const cancelTherapistLeaveRequestApi = async (
  tenantId: string,
  leaveId: string
): Promise<StaffLeaveResponse> => {
  const response = await axiosClient.patch(
    `/api/v1/clinic/${tenantId}/leave/${leaveId}/cancel`
  );
  return response.data;
};

// ============================================
// LEAVE SUMMARY (NOT SUPPORTED - STUB)
// ============================================

/**
 * Get leave balance summary
 * Note: No dedicated API - would need backend support
 * For now, throws NotImplementedError
 */
export const getTherapistLeaveSummaryApi = async (
  _tenantId: string,
  _staffId: string
): Promise<never> => {
  throw new ApiNotImplementedError('Leave balance summary');
};

// ============================================
// DOCUMENTS APIs (NOT SUPPORTED)
// ============================================

/**
 * Get therapist's documents
 * NOT SUPPORTED - No backend API for staff documents
 */
export const getTherapistDocumentsApi = async (
  _tenantId: string,
  _staffId: string
): Promise<never> => {
  throw new ApiNotImplementedError('Employment documents');
};

/**
 * Upload a document
 * NOT SUPPORTED - No backend API for staff document upload
 */
export const uploadTherapistDocumentApi = async (
  _tenantId: string,
  _staffId: string,
  _file: File
): Promise<never> => {
  throw new ApiNotImplementedError('Document upload');
};

// ============================================
// BANK DETAILS APIs (NOT SUPPORTED)
// ============================================

/**
 * Get therapist's bank details
 * NOT SUPPORTED - No backend API for bank details
 */
export const getTherapistBankDetailsApi = async (
  _tenantId: string,
  _staffId: string
): Promise<never> => {
  throw new ApiNotImplementedError('Bank details');
};

/**
 * Update bank details
 * NOT SUPPORTED - No backend API for bank details
 */
export const updateTherapistBankDetailsApi = async (
  _tenantId: string,
  _staffId: string,
  _payload: { accountNumber: string; bankName: string; ifscCode: string }
): Promise<never> => {
  throw new ApiNotImplementedError('Bank details update');
};

// ============================================
// PAYSLIPS / SALARY APIs (NOT SUPPORTED)
// ============================================

/**
 * Get therapist's payslips
 * NOT SUPPORTED - No backend API for payroll
 */
export const getTherapistPayslipsApi = async (
  _tenantId: string,
  _staffId: string,
  _params?: { year?: number }
): Promise<never> => {
  throw new ApiNotImplementedError('Salary slips');
};

/**
 * Get incentives breakdown
 * NOT SUPPORTED - No backend API for incentives
 */
export const getTherapistIncentivesApi = async (
  _tenantId: string,
  _staffId: string,
  _params?: { period?: string }
): Promise<never> => {
  throw new ApiNotImplementedError('Incentives');
};

// ============================================
// LEARNING APIs (NOT SUPPORTED)
// ============================================

/**
 * Get learning items
 * NOT SUPPORTED - No backend LMS API
 */
export const getTherapistLearningItemsApi = async (
  _tenantId: string,
  _staffId: string
): Promise<never> => {
  throw new ApiNotImplementedError('Learning content');
};
