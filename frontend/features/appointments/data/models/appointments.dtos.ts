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
  new_start?: string; // ISO datetime
  new_end?: string | null;
  appointment_start?: string; // ISO datetime (legacy)
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
  updated_at?: string;
  appointment_type: string | null;
  series_id: string | null;
  session_number?: number;
  total_sessions?: number;
  // Expanded fields (may be present)
  client_name?: string;
  client_phone?: string;
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

// ============================================
// ENHANCED DTOs FOR WORKFLOW
// ============================================

/** Appointment type */
export type AppointmentType = 'SINGLE' | 'MULTI';

/** Staff info in responses */
export interface StaffInfo {
  id: string;
  name: string;
  gender?: string;
  role?: string;
}

/** Room info in responses */
export interface RoomInfo {
  id: string;
  name: string;
  capacity?: number;
}

/** Enhanced appointment response with expanded fields */
export interface AppointmentWithDetails extends AppointmentResponse {
  client_phone?: string;
  staff?: StaffInfo[];
  session_number?: number;
  total_sessions?: number;
}

/** Daily summary for appointments */
export interface AppointmentSummary {
  total: number;
  scheduled: number;
  in_progress: number;
  completed: number;
  cancelled: number;
  no_show: number;
}

/** List appointments response with summary */
export interface AppointmentsListResponse {
  appointments: AppointmentWithDetails[];
  summary: AppointmentSummary;
}

/** Available slot */
export interface AvailableSlot {
  start: string;
  end: string;
  duration_minutes: number;
  available_staff: StaffInfo[];
  available_rooms: RoomInfo[];
}

/** Available slots request */
export interface AvailableSlotsRequest {
  start_date: string;
  end_date: string;
  treatment_id?: string;
  duration_minutes: number;
  client_gender?: string;
}

/** Available slots response */
export interface AvailableSlotsResponse {
  slots: AvailableSlot[];
}

/** Available therapist for multi-slot */
export interface AvailableTherapist {
  id: string;
  name: string;
  gender?: string;
  role: string;
  availability_score: number;
  available_days: number;
  unavailable_dates: string[];
  qualifications?: string[];
}

/** Validation request */
export interface ValidateAppointmentRequest {
  client_id: string;
  staff_id: string;
  room_id?: string;
  appointment_start: string;
  appointment_end: string;
}

/** Conflict info */
export interface ConflictInfo {
  conflict_id?: string;
  conflict_type: string;
  message: string;
}

/** Validation response */
export interface ValidationResponse {
  is_valid: boolean;
  errors: string[];
  warnings: string[];
  conflicts: {
    staff_conflict?: ConflictInfo;
    room_conflict?: ConflictInfo;
  } | null;
}

/** Alternative slot for conflict resolution */
export interface AlternativeSlot {
  start: string;
  end: string;
  staff_id: string;
  staff_name: string;
  room_id?: string;
  room_name?: string;
  score: number;
}

/** Session in therapy plan - matches API response */
export interface TherapyPlanSession {
  session_number: number;
  appointment_start: string;
  appointment_end: string;
  staff_id: string | null;
  room_id: string | null;
  is_conflicted: boolean;
  conflict?: {
    day_index: number;
    requested_time: string;
    conflict_type: string;
    message: string;
    alternative_slots: Array<{
      start: string;
      end: string;
      available_staff: Array<{
        staff_id: string;
        full_name: string;
        staff_type: string;
      }>;
      available_rooms: Array<{
        room_id: string;
        name: string;
        room_type: string;
      }>;
      score: number;
    }>;
  } | null;
}

/** Therapy plan request */
export interface TherapyPlanRequest {
  client_id: string;
  treatment_id: string;
  staff_ids: string[];
  start_date: string;
  duration_days: number;
  preferred_time_hour: number;
  client_gender?: string;
}

/** Therapy plan response - matches API spec */
export interface TherapyPlanResponse {
  series_id: string;
  client_id: string;
  treatment_id: string;
  start_date: string;
  duration_days: number;
  has_conflicts: boolean;
  sessions: TherapyPlanSession[];
  metadata: {
    total_sessions: number;
    conflicted_sessions: number;
    available_sessions: number;
  };
}

/** Bulk create appointment item */
export interface BulkAppointmentItem {
  client_id: string;
  staff_id: string;
  room_id?: string;
  treatment_id: string;
  appointment_start: string;
  appointment_end: string;
  status: string;
  session_number: number;
  notes?: string;
}

/** Bulk create request */
export interface BulkCreateRequest {
  series_id: string;
  appointments: BulkAppointmentItem[];
}

/** Created appointment summary */
export interface CreatedAppointmentSummary {
  id: string;
  series_id: string;
  session_number: number;
  appointment_start: string;
  status: string;
}

/** Bulk create response */
export interface BulkCreateResponse {
  created_appointments: CreatedAppointmentSummary[];
  total_created: number;
}

/** Search appointments params */
export interface SearchAppointmentsParams {
  q: string;
  date?: string;
  status?: string;
}

// ============================================
// WHATSAPP HELPERS
// ============================================

/** Get role label based on appointment type or staff role */
export const getRoleLabel = (appointmentType?: string | null, staffRole?: string | null): string => {
  // If appointment type explicitly indicates doctor consultation
  if (appointmentType?.toUpperCase() === 'DOCTOR_CONSULTATION' || 
      appointmentType?.toUpperCase() === 'CONSULTATION' ||
      appointmentType?.toUpperCase() === 'DOCTOR') {
    return 'Doctor';
  }
  
  // If appointment type explicitly indicates therapy
  if (appointmentType?.toUpperCase() === 'THERAPY' || 
      appointmentType?.toUpperCase() === 'THERAPY_SESSION' ||
      appointmentType?.toUpperCase() === 'MULTI') {
    return 'Therapist';
  }
  
  // Check staff role/type
  const role = (staffRole || '').toLowerCase();
  if (role.includes('doctor') || role.includes('vaidya') || role.includes('physician')) {
    return 'Doctor';
  }
  if (role.includes('therapist')) {
    return 'Therapist';
  }
  
  // Default fallback
  return 'Staff';
};

/** Generate WhatsApp confirmation message */
export const generateWhatsAppConfirmationMessage = (
  clientName: string,
  clinicName: string,
  date: string,
  time: string,
  staffName: string,
  treatmentName: string,
  clinicPhone: string,
  appointmentType?: string | null
): string => {
  const roleLabel = getRoleLabel(appointmentType);
  return `Hi ${clientName},

Your appointment has been confirmed! 📅

📍 Clinic: ${clinicName}
📅 Date: ${date}
🕐 Time: ${time}
👨‍⚕️ ${roleLabel}: ${staffName}
💆 Treatment: ${treatmentName}

Please arrive 10 minutes early.

For any changes, please call us at ${clinicPhone}.

Thank you!`;
};

/** Generate WhatsApp cancellation message */
export const generateWhatsAppCancellationMessage = (
  clientName: string,
  date: string,
  time: string,
  treatmentName: string,
  clinicPhone: string
): string => {
  return `Hi ${clientName},

Your appointment has been cancelled. ❌

📅 Date: ${date}
🕐 Time: ${time}
💆 Treatment: ${treatmentName}

If you'd like to reschedule, please call us at ${clinicPhone}.

Thank you!`;
};

/** Generate WhatsApp reschedule message */
export const generateWhatsAppRescheduleMessage = (
  clientName: string,
  oldDate: string,
  oldTime: string,
  newDate: string,
  newTime: string,
  staffName: string,
  treatmentName: string,
  appointmentType?: string | null
): string => {
  const roleLabel = getRoleLabel(appointmentType);
  return `Hi ${clientName},

Your appointment has been rescheduled. 📅

Previous:
📅 ${oldDate} at ${oldTime}

New:
📅 ${newDate} at ${newTime}
👨‍⚕️ ${roleLabel}: ${staffName}
💆 Treatment: ${treatmentName}

Please confirm if this works for you.

Thank you!`;
};

/** Generate WhatsApp multi-slot confirmation message */
export const generateWhatsAppSeriesMessage = (
  clientName: string,
  clinicName: string,
  treatmentName: string,
  totalSessions: number,
  firstSessionDate: string,
  firstSessionTime: string,
  clinicPhone: string
): string => {
  return `Hi ${clientName},

Your therapy plan has been scheduled! 📅

📍 Clinic: ${clinicName}
💆 Treatment: ${treatmentName}
📊 Total Sessions: ${totalSessions}

First Session:
📅 ${firstSessionDate} at ${firstSessionTime}

You will receive reminders before each session.

For any changes, please call us at ${clinicPhone}.

Thank you!`;
};

/** Open WhatsApp with pre-filled message */
export const openWhatsApp = (phone: string, message: string): string => {
  // Clean phone number - remove non-numeric except +
  const cleanPhone = phone.replace(/[^\d+]/g, '');
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
};

/** Generate WhatsApp no-show message */
export const generateWhatsAppNoShowMessage = (
  clientName: string,
  date: string,
  time: string,
  treatmentName: string,
  clinicPhone: string
): string => {
  return `Hi ${clientName},

We noticed you missed your appointment today.

📅 Date: ${date}
🕐 Time: ${time}
💆 Treatment: ${treatmentName}

We hope everything is okay! If you'd like to reschedule, please call us at ${clinicPhone}.

Thank you!`;
};

/** Generate WhatsApp appointment completed message */
export const generateWhatsAppCompletedMessage = (
  clientName: string,
  date: string,
  treatmentName: string,
  clinicPhone: string
): string => {
  return `Hi ${clientName},

Thank you for visiting us today! 🙏

💆 Treatment: ${treatmentName}
📅 Date: ${date}

We hope you had a great experience. If you have any questions or need to book your next appointment, please call us at ${clinicPhone}.

Take care and see you soon!`;
};

/** Generate WhatsApp appointment created message */
export const generateWhatsAppCreatedMessage = (
  clientName: string,
  clinicName: string,
  date: string,
  time: string,
  staffName: string,
  treatmentName: string,
  clinicPhone: string,
  appointmentType?: string | null
): string => {
  const roleLabel = getRoleLabel(appointmentType);
  return `Hi ${clientName},

Your appointment has been booked! 📅

📍 Clinic: ${clinicName}
📅 Date: ${date}
🕐 Time: ${time}
👨‍⚕️ ${roleLabel}: ${staffName}
💆 Treatment: ${treatmentName}

Please arrive 10 minutes early.

For any changes, please call us at ${clinicPhone}.

Thank you!`;
};

/** Format short date for display */
export const formatShortDate = (dateStr: string | null): string => {
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

/** Format day of week */
export const formatDayOfWeek = (dateStr: string): string => {
  try {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      weekday: 'short',
    });
  } catch {
    return '';
  }
};

/** Check if date is today */
export const isToday = (dateStr: string): boolean => {
  const today = new Date();
  const date = new Date(dateStr);
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
};

/** Generate date range for date slider */
export const generateDateRange = (centerDate: Date, daysAround: number = 7): Date[] => {
  const dates: Date[] = [];
  for (let i = -daysAround; i <= daysAround; i++) {
    const date = new Date(centerDate);
    date.setDate(centerDate.getDate() + i);
    dates.push(date);
  }
  return dates;
};

/** Format ISO date string (YYYY-MM-DD) */
export const toISODateString = (date: Date): string => {
  return date.toISOString().split('T')[0];
};
