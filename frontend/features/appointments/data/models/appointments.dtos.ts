/**
 * Appointments DTOs
 * Data Transfer Objects matching OpenAPI schemas
 */

// ============================================
// ENUMS & TYPES
// ============================================

/** Appointment status enum */
export type AppointmentStatus =
  | 'scheduled'
  | 'confirmed'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'no_show';

// ============================================
// REQUEST DTOs
// ============================================

/** Request to create an appointment */
export interface AppointmentCreate {
  client_id: string;
  staff_id?: string | null;
  room_id?: string | null;
  treatment_id?: string | null;
  appointment_start: string; // ISO datetime
  appointment_end?: string | null; // ISO datetime
  status: string;
  notes?: string | null;
  series_id?: string | null;
  appointment_type?: string | null;
}

/** Request to update an appointment */
export interface AppointmentUpdate {
  staff_id?: string | null;
  room_id?: string | null;
  treatment_id?: string | null;
  appointment_start?: string | null;
  appointment_end?: string | null;
  status?: string | null;
  notes?: string | null;
  is_active?: boolean | null;
}

/** Request to reschedule an appointment */
export interface AppointmentReschedule {
  appointment_start: string; // ISO datetime
  appointment_end?: string | null;
  reason?: string | null;
}

/** Parameters for listing appointments */
export interface ListAppointmentsParams {
  status?: string;
  client_id?: string;
  staff_id?: string;
  start_date?: string;
  end_date?: string;
  skip?: number;
  limit?: number;
}

// ============================================
// RESPONSE DTOs
// ============================================

/** Response for an appointment */
export interface AppointmentResponse {
  id: string;
  tenant_id: string;
  client_id: string;
  staff_id: string | null;
  room_id: string | null;
  treatment_id: string | null;
  appointment_start: string;
  appointment_end: string | null;
  status: string;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  appointment_type: string | null;
  series_id: string | null;
  // Expanded fields (may be present)
  client_name?: string;
  staff_name?: string;
  treatment_name?: string;
  room_name?: string;
}

/** Paginated response for appointments */
export interface PaginatedAppointmentsResponse {
  items: AppointmentResponse[];
  total: number;
  skip: number;
  limit: number;
}

/** Reschedule response */
export interface AppointmentRescheduleResponse {
  id: string;
  original_start: string;
  new_start: string;
  new_end: string | null;
  reason: string | null;
  rescheduled_at: string;
  rescheduled_by: string | null;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/** Get display name for appointment status */
export const getStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    scheduled: 'Scheduled',
    confirmed: 'Confirmed',
    in_progress: 'In Progress',
    completed: 'Completed',
    cancelled: 'Cancelled',
    no_show: 'No Show',
  };
  return labels[status] || status;
};

/** Get color for appointment status */
export const getStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    scheduled: '#3B82F6', // Blue
    confirmed: '#10B981', // Green
    in_progress: '#F59E0B', // Amber
    completed: '#059669', // Emerald
    cancelled: '#EF4444', // Red
    no_show: '#6B7280', // Gray
  };
  return colors[status] || '#6B7280';
};

/** Format date for display */
export const formatDate = (dateStr: string | null): string => {
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

/** Format time for display */
export const formatTime = (dateStr: string | null): string => {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return dateStr;
  }
};

/** Format date and time for display */
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

/** Calculate appointment duration in minutes */
export const calculateDuration = (start: string, end: string | null): number | null => {
  if (!end) return null;
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

/** Status options for filtering */
export const APPOINTMENT_STATUSES: AppointmentStatus[] = [
  'scheduled',
  'confirmed',
  'in_progress',
  'completed',
  'cancelled',
  'no_show',
];
