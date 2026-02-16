/**
 * Feedback DTOs - Data Transfer Objects for the Feedback module
 * Matches the backend API spec exactly
 */

// ==================== Patient Feedback Form (Public) ====================

/** Response from GET /api/v1/feedback/{token} */
export interface FeedbackFormData {
  appointment_id: string;
  appointment_date: string;
  doctor?: DoctorInfo | null;
  therapists: TherapistInfo[];
  clinic_name: string;
  google_review_link?: string | null;
}

export interface DoctorInfo {
  id: string;
  name: string;
}

export interface TherapistInfo {
  id: string;
  name: string;
}

/** Doctor feedback section in submission */
export interface DoctorFeedback {
  rating: number; // 1-5
  professionalism?: number; // 1-5 optional
  communication?: number; // 1-5 optional
  treatment_effectiveness?: number; // 1-5 optional
  comments?: string;
}

/** Therapist feedback section in submission */
export interface TherapistFeedback {
  therapist_id: string;
  rating: number; // 1-5
  skill_level?: number; // 1-5 optional
  gentleness?: number; // 1-5 optional
  punctuality?: number; // 1-5 optional
  comments?: string;
}

/** Clinic feedback section in submission (always required) */
export interface ClinicFeedback {
  rating: number; // 1-5 required
  cleanliness?: number; // 1-5 optional
  comfort?: number; // 1-5 optional
  staff_professionalism?: number; // 1-5 optional
  scheduling_ease?: number; // 1-5 optional
  value_for_money?: number; // 1-5 optional
  comments?: string;
}

/** Payload for POST /api/v1/feedback/{token} */
export interface FeedbackSubmitPayload {
  doctor_feedback?: DoctorFeedback | null;
  therapist_feedback: TherapistFeedback[];
  clinic_feedback: ClinicFeedback;
  opted_for_google_review?: boolean;
}

/** Response from POST /api/v1/feedback/{token} */
export interface FeedbackSubmitResponse {
  success: boolean;
  message: string;
  google_review_link?: string | null;
}

// ==================== Staff KPIs & Feedback (Authenticated) ====================

/** Period options for KPI queries */
export type KPIPeriod = '7d' | '30d' | '90d' | 'custom';
export type StaffType = 'doctor' | 'therapist';

/** Query params for GET /api/v1/clinic/{tenant_id}/staff/{staff_id}/kpis */
export interface StaffKPIQueryParams {
  period: KPIPeriod;
  from_date?: string;
  to_date?: string;
  staff_type: StaffType;
}

/** Response from GET /api/v1/clinic/{tenant_id}/staff/{staff_id}/kpis */
export interface StaffKPIResponse {
  staff_id: string;
  staff_name: string;
  period: {
    type: KPIPeriod;
    from_date: string;
    to_date: string;
  };
  consultations: {
    total: number;
    completed: number;
    cancelled: number;
    no_show: number;
    completion_rate: number;
    no_show_rate: number;
  };
  patients: {
    unique_patients: number;
    new_patients: number;
    returning_patients: number;
    retention_rate: number;
  };
  productivity: {
    documents_created: number;
    prescriptions_issued: number;
    treatment_sheets_started: number;
  };
  time_metrics?: {
    average_consultation_duration?: number;
    total_hours_worked?: number;
  };
  patient_satisfaction: PatientSatisfactionMetrics;
}

export interface PatientSatisfactionMetrics {
  average_rating: number;
  total_responses: number;
  response_rate: number;
  rating_distribution: {
    '1': number;
    '2': number;
    '3': number;
    '4': number;
    '5': number;
  };
  question_scores: {
    [key: string]: number;
  };
  trend: 'up' | 'stable' | 'down';
  trend_percentage?: number;
}

/** Query params for GET /api/v1/feedback/clinic/{tenant_id}/staff/{staff_id}/feedback */
export interface StaffFeedbackListQueryParams {
  from_date?: string;
  to_date?: string;
  staff_type: StaffType;
  limit?: number;
  offset?: number;
}

/** Single feedback item in staff feedback list */
export interface StaffFeedbackItem {
  id: string;
  appointment_id: string;
  appointment_date: string;
  patient_name?: string; // May be anonymized
  rating: number;
  question_scores: {
    [key: string]: number;
  };
  comments?: string;
  submitted_at: string;
  needs_attention: boolean;
}

/** Response from GET /api/v1/feedback/clinic/{tenant_id}/staff/{staff_id}/feedback */
export interface StaffFeedbackListResponse {
  items: StaffFeedbackItem[];
  total: number;
  limit: number;
  offset: number;
}

// ==================== Clinic Feedback Summary (Admin) ====================

/** Query params for GET /api/v1/feedback/clinic/{tenant_id}/summary */
export interface ClinicFeedbackSummaryQueryParams {
  from_date?: string;
  to_date?: string;
}

/** Staff performance item in clinic summary */
export interface StaffPerformanceItem {
  staff_id: string;
  name: string;
  staff_type: StaffType;
  average_rating: number;
  total_responses: number;
  trend: 'up' | 'stable' | 'down';
}

/** Response from GET /api/v1/feedback/clinic/{tenant_id}/summary */
export interface ClinicFeedbackSummaryResponse {
  period: {
    from_date: string;
    to_date: string;
  };
  overall_rating: number;
  total_responses: number;
  response_rate: number;
  rating_distribution: {
    '1': number;
    '2': number;
    '3': number;
    '4': number;
    '5': number;
  };
  staff_performance: {
    doctors: StaffPerformanceItem[];
    therapists: StaffPerformanceItem[];
  };
  ambience_scores: {
    cleanliness: number;
    comfort: number;
    staff_professionalism: number;
    scheduling_ease: number;
    value_for_money: number;
  };
  google_review_stats: {
    prompted: number;
    posted: number;
    conversion_rate: number;
  };
}

// ==================== Helper Types ====================

/** Generic API error response */
export interface FeedbackApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

/** Trend indicator type */
export type TrendDirection = 'up' | 'stable' | 'down';

/** Get trend icon name */
export function getTrendIcon(trend: TrendDirection): string {
  switch (trend) {
    case 'up':
      return 'trending-up';
    case 'down':
      return 'trending-down';
    default:
      return 'remove';
  }
}

/** Get trend color */
export function getTrendColor(trend: TrendDirection): string {
  switch (trend) {
    case 'up':
      return '#10b981'; // success
    case 'down':
      return '#ef4444'; // error
    default:
      return '#6b7280'; // neutral
  }
}
