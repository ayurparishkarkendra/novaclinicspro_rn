/**
 * Treatment Sessions DTOs
 * Data Transfer Objects matching OpenAPI schemas
 */

// ============================================
// ENUMS & TYPES
// ============================================

/** Treatment session status enum */
export type SessionStatus =
  | 'scheduled'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'missed';

// ============================================
// REQUEST DTOs
// ============================================

/** Request to create a treatment session */
export interface TreatmentSessionCreate {
  appointment_id: string;
  client_id: string;
  therapist_id?: string | null;
  treatment_id?: string | null;
  room_id?: string | null;
  scheduled_start: string; // ISO datetime
  scheduled_end?: string | null;
  status?: string;
  notes?: string | null;
}

/** Request to update a treatment session */
export interface TreatmentSessionUpdate {
  therapist_id?: string | null;
  treatment_id?: string | null;
  room_id?: string | null;
  scheduled_start?: string | null;
  scheduled_end?: string | null;
  actual_start?: string | null;
  actual_end?: string | null;
  status?: string | null;
  notes?: string | null;
  observations?: string | null;
  progress_notes?: string | null;
}

/** Parameters for listing treatment sessions */
export interface ListTreatmentSessionsParams {
  status?: string;
  client_id?: string;
  therapist_id?: string;
  appointment_id?: string;
  start_date?: string;
  end_date?: string;
  skip?: number;
  limit?: number;
}

// ============================================
// RESPONSE DTOs
// ============================================

/** Response for a treatment session */
export interface TreatmentSessionResponse {
  id: string;
  tenant_id: string;
  appointment_id: string;
  client_id: string;
  therapist_id: string | null;
  treatment_id: string | null;
  room_id: string | null;
  scheduled_start: string;
  scheduled_end: string | null;
  actual_start: string | null;
  actual_end: string | null;
  status: string;
  notes: string | null;
  observations: string | null;
  progress_notes: string | null;
  created_at: string;
  updated_at: string;
  // Expanded fields (may be present)
  client_name?: string;
  therapist_name?: string;
  treatment_name?: string;
  room_name?: string;
}

/** Paginated response for treatment sessions */
export interface PaginatedTreatmentSessionsResponse {
  items: TreatmentSessionResponse[];
  total: number;
  skip: number;
  limit: number;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/** Get display name for session status */
export const getSessionStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    scheduled: 'Scheduled',
    in_progress: 'In Progress',
    completed: 'Completed',
    cancelled: 'Cancelled',
    missed: 'Missed',
  };
  return labels[status] || status;
};

/** Get color for session status */
export const getSessionStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    scheduled: '#3B82F6', // Blue
    in_progress: '#F59E0B', // Amber
    completed: '#10B981', // Green
    cancelled: '#EF4444', // Red
    missed: '#6B7280', // Gray
  };
  return colors[status] || '#6B7280';
};

/** Format datetime for display */
export const formatDateTime = (dateStr: string | null): string => {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return dateStr;
  }
};

/** 
 * Format time for display - uses centralized utility
 * @deprecated Use formatTime from core/utils/dateTimeUtils.ts instead
 */
export const formatTime = (dateStr: string | null): string => {
  // Re-export from centralized utility
  const { formatTime: centralizedFormatTime } = require('../../../../core/utils/dateTimeUtils');
  return centralizedFormatTime(dateStr);
};

/** Calculate session duration in minutes */
export const calculateSessionDuration = (
  start: string | null,
  end: string | null
): number | null => {
  if (!start || !end) return null;
  const startDate = new Date(start);
  const endDate = new Date(end);
  return Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60));
};

/** Format duration for display */
export const formatDuration = (minutes: number | null): string => {
  if (!minutes) return '—';
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) return `${hours} hr`;
  return `${hours} hr ${mins} min`;
};

/** Session status options for filtering */
export const SESSION_STATUSES: SessionStatus[] = [
  'scheduled',
  'in_progress',
  'completed',
  'cancelled',
  'missed',
];
