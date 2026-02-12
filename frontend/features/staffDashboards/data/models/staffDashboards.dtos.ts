/**
 * Staff Dashboards DTOs
 * Data Transfer Objects matching OpenAPI schemas for role-specific dashboards
 */

// ============================================
// DOCTOR DASHBOARD
// ============================================

/** Doctor appointment item */
export interface DoctorAppointmentItem {
  id: string;
  client_id: string;
  client_name: string | null;
  appointment_start: string;
  appointment_end: string | null;
  status: string;
  notes: string | null;
  treatment_name: string | null;
  room_name: string | null;
}

/** Doctor dashboard response */
export interface DoctorDashboardResponse {
  on_leave_today: boolean;
  appointments: DoctorAppointmentItem[];
  total_count: number;
}

// ============================================
// THERAPIST DASHBOARD
// ============================================

/** Therapist session item */
export interface TherapistSessionItem {
  id: string;
  treatment_sheet_id: string;
  client_id: string;
  client_name: string | null;
  session_date: string;
  session_number: number;
  treatment_name: string | null;
  status: string;
  completed_at: string | null;
}

/** Therapist dashboard response */
export interface TherapistDashboardResponse {
  on_leave_today: boolean;
  sessions: TherapistSessionItem[];
  total_count: number;
}

// ============================================
// FRONTDESK DASHBOARD
// ============================================

/** Frontdesk appointment item */
export interface FrontdeskAppointmentItem {
  id: string;
  client_id: string;
  client_name: string | null;
  staff_id: string | null;
  staff_name: string | null;
  room_id: string | null;
  room_name: string | null;
  treatment_name: string | null;
  appointment_start: string;
  appointment_end: string | null;
  status: string;
  notes: string | null;
}

/** Frontdesk dashboard filters */
export interface FrontdeskDashboardFilters {
  doctor_id: string | null;
  room_id: string | null;
  status: string | null;
}

/** Frontdesk dashboard response */
export interface FrontdeskDashboardResponse {
  on_leave_today: boolean;
  appointments: FrontdeskAppointmentItem[];
  total_count: number;
  filters_applied: FrontdeskDashboardFilters;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

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

/** Format date for display */
export const formatDate = (dateStr: string | null): string => {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
    });
  } catch {
    return dateStr;
  }
};

/** Get status color */
export const getStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    scheduled: '#3B82F6',
    confirmed: '#10B981',
    in_progress: '#F59E0B',
    completed: '#059669',
    cancelled: '#EF4444',
    no_show: '#6B7280',
    pending: '#F59E0B',
  };
  return colors[status?.toLowerCase()] || '#6B7280';
};

/** Get status label */
export const getStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    scheduled: 'Scheduled',
    confirmed: 'Confirmed',
    in_progress: 'In Progress',
    completed: 'Completed',
    cancelled: 'Cancelled',
    no_show: 'No Show',
    pending: 'Pending',
  };
  return labels[status?.toLowerCase()] || status;
};

/** Calculate duration in minutes */
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
  return `${hours}h ${mins}m`;
};
