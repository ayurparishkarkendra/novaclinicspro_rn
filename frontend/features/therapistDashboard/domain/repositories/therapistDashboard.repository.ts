/**
 * Therapist Dashboard Domain Repository Interface
 * Defines the contract for dashboard data operations
 */

import {
  TherapistDashboardResponse,
  WorklistSession,
  TherapistKpiSummary,
  WorklistParams,
  WorklistPeriod,
  LeaveSummary,
  TherapistDocument,
  BankDetails,
  Payslip,
  LearningItem,
} from '../../data/models/therapistDashboard.dtos';
import { StaffLeaveResponse, StaffLeaveCreate, PaginatedLeaveResponse } from '../../../staff/data/models/staff.dtos';

/**
 * Repository interface for therapist dashboard
 */
export interface ITherapistDashboardRepository {
  // ============================================
  // WORKLIST / SCHEDULE
  // ============================================
  
  /**
   * Get therapist worklist/schedule
   * @returns Dashboard response with sessions
   */
  getWorklist(tenantId: string, params?: WorklistParams): Promise<TherapistDashboardResponse>;
  
  /**
   * Get filtered worklist by period
   */
  getFilteredWorklist(tenantId: string, period: WorklistPeriod): Promise<WorklistSession[]>;

  // ============================================
  // KPIs
  // ============================================
  
  /**
   * Get KPI summary for a period
   */
  getKpiSummary(tenantId: string, period: WorklistPeriod): Promise<TherapistKpiSummary>;

  // ============================================
  // LEAVE MANAGEMENT
  // ============================================
  
  /**
   * Get leave requests
   */
  getLeaveRequests(
    tenantId: string,
    staffId: string,
    params?: { status?: string; skip?: number; limit?: number }
  ): Promise<PaginatedLeaveResponse>;
  
  /**
   * Create a leave request
   */
  createLeaveRequest(
    tenantId: string,
    staffId: string,
    payload: StaffLeaveCreate
  ): Promise<StaffLeaveResponse>;
  
  /**
   * Cancel a leave request
   */
  cancelLeaveRequest(tenantId: string, leaveId: string): Promise<StaffLeaveResponse>;
  
  /**
   * Get leave summary (balances not supported)
   */
  getLeaveSummary(tenantId: string, staffId: string): Promise<LeaveSummary>;

  // ============================================
  // HR SELF-SERVICE (NOT SUPPORTED)
  // ============================================
  
  /**
   * Get documents - NOT SUPPORTED
   * @throws ApiNotImplementedError
   */
  getDocuments(tenantId: string, staffId: string): Promise<TherapistDocument[]>;
  
  /**
   * Upload document - NOT SUPPORTED
   * @throws ApiNotImplementedError
   */
  uploadDocument(tenantId: string, staffId: string, file: File): Promise<TherapistDocument>;
  
  /**
   * Get bank details - NOT SUPPORTED
   * @throws ApiNotImplementedError
   */
  getBankDetails(tenantId: string, staffId: string): Promise<BankDetails>;
  
  /**
   * Update bank details - NOT SUPPORTED
   * @throws ApiNotImplementedError
   */
  updateBankDetails(
    tenantId: string,
    staffId: string,
    payload: Partial<BankDetails>
  ): Promise<BankDetails>;
  
  /**
   * Get payslips - NOT SUPPORTED
   * @throws ApiNotImplementedError
   */
  getPayslips(tenantId: string, staffId: string, year?: number): Promise<Payslip[]>;

  // ============================================
  // LEARNING (NOT SUPPORTED)
  // ============================================
  
  /**
   * Get learning items - NOT SUPPORTED
   * @throws ApiNotImplementedError
   */
  getLearningItems(tenantId: string, staffId: string): Promise<LearningItem[]>;
}
