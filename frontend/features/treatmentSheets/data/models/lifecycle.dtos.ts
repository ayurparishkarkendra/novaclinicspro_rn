/**
 * Treatment Sheet Lifecycle DTOs
 * Data Transfer Objects for pause, resume, and cancel operations
 */

// ============================================
// REQUEST DTOs
// ============================================

/** Pause series request DTO */
export interface PauseSeriesDTO {
  reason: string;
  patient_consent: boolean;
  billing_acknowledged?: boolean;
}

/** Resume series request DTO */
export interface ResumeSeriesDTO {
  start_date: string;
  sessions: SessionSlot[];
}

/** Cancel series request DTO */
export interface CancelSeriesDTO {
  reason: string;
}

/** Session slot for scheduling */
export interface SessionSlot {
  date: string;
  time: string;
  therapist_id: string;
  room_id?: string;
}

// ============================================
// RESPONSE DTOs
// ============================================

/** Rule evaluation result */
export interface RuleEvaluationResult {
  allowed: boolean;
  reason?: string;
  conditions_met: Array<{
    condition: string;
    met: boolean;
  }>;
  requires_audit?: boolean;
  requires_reason?: boolean;
  audit_message?: string;
  metadata?: Record<string, any>;
}

/** Pause series response */
export interface PauseSeriesResponse {
  success: boolean;
  message: string;
  cancelled_sessions: number;
  refund_amount?: number;
}

/** Resume series response */
export interface ResumeSeriesResponse {
  success: boolean;
  message: string;
  new_session_ids: string[];
  remaining_days: number;
}

/** Cancel series response */
export interface CancelSeriesResponse {
  success: boolean;
  message: string;
  cancelled_sessions: number;
  refund_amount?: number;
}
