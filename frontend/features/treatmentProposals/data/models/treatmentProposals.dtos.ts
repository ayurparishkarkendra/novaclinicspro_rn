/**
 * Treatment Proposals DTOs
 * Data Transfer Objects for multi-day therapy workflow
 * Matches backend schema from design.md Section 3.2
 */

// ============================================
// ENUMS
// ============================================

/** Treatment proposal status */
export enum ProposalStatus {
  PROPOSED = 'PROPOSED',
  ACCEPTED = 'ACCEPTED',
  DECLINED = 'DECLINED',
  EXPIRED = 'EXPIRED',
}

/** Treatment sheet status (enhanced with multi-day workflow statuses) */
export enum TreatmentSheetStatus {
  DRAFT = 'DRAFT',
  SCHEDULED = 'SCHEDULED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  PAUSED = 'PAUSED',
  SIGNED = 'SIGNED',
}

/** Treatment sheet row status */
export enum RowStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

// ============================================
// DOMAIN MODELS
// ============================================

/** Treatment Proposal model (Section 3.2.1) */
export interface TreatmentProposal {
  id: string;
  tenant_id?: string;
  episode_id: string;
  client_id?: string;
  
  // Proposal details (backend field names)
  treatment_type: string; // Backend uses this instead of 'name'
  proposed_duration_days: number; // Backend uses this instead of 'duration_days'
  clinical_notes?: string; // Backend uses this instead of 'contraindications'
  expected_outcomes?: string; // Backend uses this instead of 'goals'
  
  // Legacy/alias fields for backward compatibility
  name?: string; // Alias for treatment_type
  duration_days?: number; // Alias for proposed_duration_days
  modalities?: string[];
  modalities_notes?: string;
  goals?: string;
  contraindications?: string;
  
  // Cost estimation
  estimated_cost_min?: number;
  estimated_cost_max?: number;
  currency: string;
  
  // Status tracking
  status: ProposalStatus;
  status_notes?: string; // Backend field
  decline_reason?: string;
  
  // Audit fields (backend field names)
  proposed_by_staff_name?: string;
  proposed_at: string; // Backend uses this instead of 'created_at'
  status_changed_at?: string;
  status_changed_by_name?: string;
  
  // Legacy/alias fields
  created_by_staff_id?: string;
  created_at?: string; // Alias for proposed_at
  updated_at?: string;
  version?: number;
  
  // Linked entities
  appointment_series_id?: string | null;
  treatment_sheet_id?: string | null;
  treatment_id?: string | null;
}

/** Enhanced Treatment Sheet model (Section 3.2.2) */
export interface TreatmentSheet {
  id: string;
  tenant_id: string;
  episode_id: string;
  proposal_id?: string;
  case_sheet_id?: string;
  client_id: string;
  
  duration_days: number;
  status: TreatmentSheetStatus;
  agreed_package_cost?: number;
  
  recorded_at: string;
  recorded_by_staff_id?: string;
  signed_by_staff_id?: string;
  signed_at?: string;
  
  rows: TreatmentSheetRow[];
  
  // Computed properties
  is_legacy?: boolean;
  completed_days?: number;
  progress_percentage?: number;
}

/** Enhanced Treatment Sheet Row model (Section 3.2.3) */
export interface TreatmentSheetRow {
  id: string;
  treatment_sheet_id: string;
  day_number: number;
  
  // Session linking
  session_id?: string;
  session_date?: string;
  
  // Treatment details (renamed fields for backend alignment)
  treatment_name?: string;
  medicines_text?: string;
  instructions_text?: string;
  
  status: RowStatus;
  
  created_at: string;
  updated_at: string;
  
  // Computed properties from linked session
  scheduled_time?: string;
  therapist_id?: string;
  days_since_session?: number;
}

// ============================================
// REQUEST DTOs
// ============================================

/** Create proposal request DTO */
export interface ProposalCreateDTO {
  episode_id: string;
  name: string;
  duration_days: number;
  modalities?: string[];
  modalities_notes?: string;
  goals?: string;
  contraindications?: string;
  estimated_cost_min?: number;
  estimated_cost_max?: number;
  currency?: string;
}

/** Update proposal request DTO */
export interface ProposalUpdateDTO {
  version: number;
  name?: string;
  duration_days?: number;
  modalities?: string[];
  modalities_notes?: string;
  goals?: string;
  contraindications?: string;
  estimated_cost_min?: number;
  estimated_cost_max?: number;
}

/** Decline proposal request DTO */
export interface ProposalDeclineDTO {
  decline_reason: string;
}

/** Session slot for scheduling */
export interface SessionSlot {
  date: string;
  time: string;
  therapist_id: string;
  room_id?: string;
}

/** Schedule treatment series request DTO */
export interface ScheduleDTO {
  start_date: string;
  sessions: SessionSlot[];
  agreed_package_cost: number;
}

/** Update treatment sheet row request DTO */
export interface RowUpdateDTO {
  treatment_name?: string;
  medicines_text?: string;
  instructions_text?: string;
  edit_reason?: string;
}

/** Pause series request DTO */
export interface PauseSeriesDTO {
  reason: string;
  patient_consent: boolean;
  billing_acknowledged: boolean;
}

/** Resume series request DTO */
export interface ResumeSeriesDTO {
  start_date: string;
  sessions: SessionSlot[];
}

/** Cancel series request DTO */
export interface CancelSeriesDTO {
  cancel_reason: string;
}

// ============================================
// RESPONSE DTOs
// ============================================

/** Schedule validation conflict */
export interface SchedulingConflict {
  session_index: number;
  type: 'therapist_double_booked' | 'room_double_booked' | 'client_conflict';
  severity: 'ERROR' | 'WARNING';
  message: string;
  can_override: boolean;
  requires_role?: string[];
  alternative_slots?: Array<{ time: string; available: boolean }>;
}

/** Schedule validation response */
export interface ScheduleValidationResponse {
  valid: boolean;
  conflicts: SchedulingConflict[];
}

/** Schedule creation response */
export interface ScheduleCreationResponse {
  treatment_sheet_id: string;
  session_ids: string[];
  proposal_status: ProposalStatus;
  message: string;
}

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

// ============================================
// HELPER FUNCTIONS
// ============================================

/** Get proposal status display label */
export const getProposalStatusLabel = (status: ProposalStatus): string => {
  const labels: Record<ProposalStatus, string> = {
    [ProposalStatus.PROPOSED]: 'Pending',
    [ProposalStatus.ACCEPTED]: 'Accepted & Scheduled',
    [ProposalStatus.DECLINED]: 'Declined',
    [ProposalStatus.EXPIRED]: 'Expired',
  };
  return labels[status] || status;
};

/** Get proposal status color */
export const getProposalStatusColor = (status: ProposalStatus): string => {
  const colors: Record<ProposalStatus, string> = {
    [ProposalStatus.PROPOSED]: '#F59E0B',   // Orange/Amber
    [ProposalStatus.ACCEPTED]: '#10B981',   // Green
    [ProposalStatus.DECLINED]: '#6B7280',   // Gray
    [ProposalStatus.EXPIRED]: '#EF4444',    // Red
  };
  return colors[status] || '#6B7280';
};

/** Get treatment sheet status display label */
export const getTreatmentSheetStatusLabel = (status: TreatmentSheetStatus): string => {
  const labels: Record<TreatmentSheetStatus, string> = {
    [TreatmentSheetStatus.DRAFT]: 'Draft',
    [TreatmentSheetStatus.SCHEDULED]: 'Scheduled',
    [TreatmentSheetStatus.IN_PROGRESS]: 'In Progress',
    [TreatmentSheetStatus.COMPLETED]: 'Completed',
    [TreatmentSheetStatus.CANCELLED]: 'Cancelled',
    [TreatmentSheetStatus.PAUSED]: 'Paused',
    [TreatmentSheetStatus.SIGNED]: 'Signed',
  };
  return labels[status] || status;
};

/** Get treatment sheet status color */
export const getTreatmentSheetStatusColor = (status: TreatmentSheetStatus): string => {
  const colors: Record<TreatmentSheetStatus, string> = {
    [TreatmentSheetStatus.DRAFT]: '#6B7280',      // Gray
    [TreatmentSheetStatus.SCHEDULED]: '#3B82F6',  // Blue
    [TreatmentSheetStatus.IN_PROGRESS]: '#8B5CF6', // Purple
    [TreatmentSheetStatus.COMPLETED]: '#10B981',  // Green
    [TreatmentSheetStatus.CANCELLED]: '#EF4444',  // Red
    [TreatmentSheetStatus.PAUSED]: '#F59E0B',     // Yellow
    [TreatmentSheetStatus.SIGNED]: '#10B981',     // Green
  };
  return colors[status] || '#6B7280';
};

/** Get row status display label */
export const getRowStatusLabel = (status: RowStatus): string => {
  const labels: Record<RowStatus, string> = {
    [RowStatus.PENDING]: 'Pending',
    [RowStatus.IN_PROGRESS]: 'In Progress',
    [RowStatus.COMPLETED]: 'Completed',
    [RowStatus.CANCELLED]: 'Cancelled',
  };
  return labels[status] || status;
};

/** Get row status color */
export const getRowStatusColor = (status: RowStatus): string => {
  const colors: Record<RowStatus, string> = {
    [RowStatus.PENDING]: '#6B7280',      // Gray
    [RowStatus.IN_PROGRESS]: '#F59E0B',  // Yellow
    [RowStatus.COMPLETED]: '#10B981',    // Green
    [RowStatus.CANCELLED]: '#EF4444',    // Red
  };
  return colors[status] || '#6B7280';
};

/** Check if proposal is editable */
export const isProposalEditable = (status: ProposalStatus): boolean => {
  return status === ProposalStatus.PROPOSED;
};

/** Check if proposal can be scheduled */
export const canScheduleProposal = (status: ProposalStatus): boolean => {
  return status === ProposalStatus.PROPOSED;
};

/** Check if treatment sheet is legacy (no proposal) */
export const isLegacySheet = (sheet: TreatmentSheet): boolean => {
  return !sheet.proposal_id;
};

/** Calculate treatment sheet progress */
export const calculateSheetProgress = (rows: TreatmentSheetRow[]): number => {
  if (!rows || rows.length === 0) return 0;
  const completed = rows.filter(r => r.status === RowStatus.COMPLETED).length;
  return Math.round((completed / rows.length) * 100);
};

/** Format cost range for display */
export const formatCostRange = (
  min?: number,
  max?: number,
  currency: string = 'INR'
): string => {
  if (!min && !max) return 'Cost to be determined';
  
  const symbol = currency === 'INR' ? '₹' : currency;
  
  if (min && max && min !== max) {
    return `${symbol}${min.toLocaleString()} - ${symbol}${max.toLocaleString()}`;
  }
  
  const amount = min || max || 0;
  return `${symbol}${amount.toLocaleString()}`;
};

/** Format date for display */
export const formatDate = (dateStr?: string): string => {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
};

/** Format date and time for display */
export const formatDateTime = (dateStr?: string): string => {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
};

/** Calculate days since session */
export const calculateDaysSinceSession = (sessionDate?: string): number | undefined => {
  if (!sessionDate) return undefined;
  try {
    const session = new Date(sessionDate);
    const today = new Date();
    const diffTime = today.getTime() - session.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  } catch {
    return undefined;
  }
};

/** Get date range display for treatment series */
export const getDateRangeDisplay = (
  startDate?: string,
  durationDays?: number
): string => {
  if (!startDate || !durationDays) return '—';
  try {
    const start = new Date(startDate);
    const end = new Date(start);
    end.setDate(end.getDate() + durationDays - 1);
    
    return `${formatDate(start.toISOString())} to ${formatDate(end.toISOString())}`;
  } catch {
    return '—';
  }
};
