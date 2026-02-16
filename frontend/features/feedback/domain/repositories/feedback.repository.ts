/**
 * Feedback Repository Interface
 * Defines the contract for feedback data operations
 */

import type {
  FeedbackFormData,
  FeedbackSubmitPayload,
  FeedbackSubmitResponse,
  StaffKPIResponse,
  StaffFeedbackListResponse,
  ClinicFeedbackSummaryResponse,
  KPIPeriod,
  StaffType,
} from '../../data/models/feedback.dtos';

export interface IFeedbackRepository {
  // Patient Feedback (Public)
  getFeedbackForm(token: string): Promise<FeedbackFormData>;
  submitFeedback(token: string, payload: FeedbackSubmitPayload): Promise<FeedbackSubmitResponse>;

  // Staff KPIs (Authenticated)
  getStaffKpis(
    tenantId: string,
    staffId: string,
    params: {
      period: KPIPeriod;
      staffType: StaffType;
      fromDate?: string;
      toDate?: string;
    }
  ): Promise<StaffKPIResponse>;

  getStaffFeedbackList(
    tenantId: string,
    staffId: string,
    params: {
      staffType: StaffType;
      fromDate?: string;
      toDate?: string;
      limit?: number;
      offset?: number;
    }
  ): Promise<StaffFeedbackListResponse>;

  // Clinic Summary (Admin)
  getClinicFeedbackSummary(
    tenantId: string,
    params?: {
      fromDate?: string;
      toDate?: string;
    }
  ): Promise<ClinicFeedbackSummaryResponse>;
}
