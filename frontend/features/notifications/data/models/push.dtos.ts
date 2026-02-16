/**
 * Push Notification Types & DTOs
 * Extended types for push notification support
 */

// ============================================
// PUSH NOTIFICATION TRIGGERS (Therapist-specific)
// ============================================

export type PushNotificationTrigger =
  | 'appointment_new'           // New appointment booked for therapist
  | 'appointment_updated'       // Appointment rescheduled/modified
  | 'appointment_cancelled'     // Appointment cancelled
  | 'appointment_no_show'       // Patient no-show
  | 'schedule_summary'          // Daily schedule summary
  | 'schedule_batch_update'     // Multiple schedule changes
  | 'critical_update'           // System alerts, emergencies
  | 'leave_approved'            // Leave request approved
  | 'leave_rejected'            // Leave request rejected
  | 'salary_credited';          // Salary credited (future)

// ============================================
// PUSH NOTIFICATION PAYLOADS
// ============================================

/** Base push notification data */
export interface BasePushData {
  notificationId: string;
  trigger: PushNotificationTrigger;
  timestamp: string;
  tenantId: string;
  recipientStaffId: string;
}

/** New appointment push data */
export interface NewAppointmentPushData extends BasePushData {
  trigger: 'appointment_new';
  appointmentId: string;
  patientFirstName: string;
  appointmentDate: string;
  appointmentTime: string;
  clinicName: string;
  branchName?: string;
  visitType: 'online' | 'offline';
  treatmentName?: string;
}

/** Appointment updated push data */
export interface AppointmentUpdatedPushData extends BasePushData {
  trigger: 'appointment_updated';
  appointmentId: string;
  patientFirstName: string;
  oldDate?: string;
  oldTime?: string;
  newDate: string;
  newTime: string;
  clinicName: string;
  roomName?: string;
  changeType: 'rescheduled' | 'room_changed' | 'details_updated';
}

/** Appointment cancelled push data */
export interface AppointmentCancelledPushData extends BasePushData {
  trigger: 'appointment_cancelled' | 'appointment_no_show';
  appointmentId: string;
  patientFirstName: string;
  originalDate: string;
  originalTime: string;
  reason?: string;
  status: 'cancelled' | 'no_show';
}

/** Schedule summary push data */
export interface ScheduleSummaryPushData extends BasePushData {
  trigger: 'schedule_summary';
  date: string;
  appointmentCount: number;
  firstSlotTime?: string;
  lastSlotTime?: string;
  summaryType: 'morning' | 'midday';
}

/** Batch schedule update push data */
export interface ScheduleBatchUpdatePushData extends BasePushData {
  trigger: 'schedule_batch_update';
  updateCount: number;
  updateTypes: string[];
  message: string;
}

/** Critical update push data */
export interface CriticalUpdatePushData extends BasePushData {
  trigger: 'critical_update';
  updateType: 'system_downtime' | 'clinic_closed' | 'schedule_change' | 'task_assigned' | 'general';
  message: string;
  severity: 'info' | 'warning' | 'critical';
  actionUrl?: string;
}

/** Leave status push data */
export interface LeaveStatusPushData extends BasePushData {
  trigger: 'leave_approved' | 'leave_rejected';
  leaveId: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  status: 'approved' | 'rejected';
  approverName?: string;
  rejectionReason?: string;
}

/** Union type for all push data */
export type PushNotificationData =
  | NewAppointmentPushData
  | AppointmentUpdatedPushData
  | AppointmentCancelledPushData
  | ScheduleSummaryPushData
  | ScheduleBatchUpdatePushData
  | CriticalUpdatePushData
  | LeaveStatusPushData;

// ============================================
// NOTIFICATION PREFERENCES
// ============================================

/** Per-therapist notification preferences */
export interface TherapistNotificationPreferences {
  staffId: string;
  tenantId: string;
  
  // Per-trigger toggles
  newAppointment: boolean;
  appointmentUpdates: boolean;
  cancellationsNoShows: boolean;
  dailyScheduleSummary: boolean;
  criticalUpdates: boolean;  // Recommended always on
  leaveUpdates: boolean;
  
  // Schedule summary settings
  scheduleSummaryTime: string;  // HH:mm format
  enableMiddaySummary: boolean;
  middaySummaryTime: string;
  
  // Quiet hours
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
  
  updatedAt: string;
}

/** Default notification preferences */
export const DEFAULT_NOTIFICATION_PREFERENCES: Omit<TherapistNotificationPreferences, 'staffId' | 'tenantId' | 'updatedAt'> = {
  newAppointment: true,
  appointmentUpdates: true,
  cancellationsNoShows: true,
  dailyScheduleSummary: false,  // Off by default per requirement
  criticalUpdates: true,        // Always recommended
  leaveUpdates: true,
  
  scheduleSummaryTime: '07:00',
  enableMiddaySummary: false,
  middaySummaryTime: '12:00',
  
  quietHoursEnabled: false,
  quietHoursStart: '22:00',
  quietHoursEnd: '07:00',
};

// ============================================
// DEVICE REGISTRATION
// ============================================

/** Device token registration */
export interface PushDeviceToken {
  token: string;
  platform: 'ios' | 'android' | 'web';
  deviceId: string;
  staffId: string;
  tenantId: string;
  isActive: boolean;
  createdAt: string;
  lastUsedAt: string;
}

/** Device registration request */
export interface RegisterDeviceRequest {
  token: string;
  platform: 'ios' | 'android' | 'web';
  deviceId: string;
}

/** Device registration response */
export interface RegisterDeviceResponse {
  success: boolean;
  deviceId: string;
  message?: string;
}

// ============================================
// NOTIFICATION HISTORY (for local storage)
// ============================================

/** Stored notification for history */
export interface StoredNotification {
  id: string;
  trigger: PushNotificationTrigger;
  title: string;
  body: string;
  data: PushNotificationData;
  receivedAt: string;
  readAt: string | null;
  tappedAt: string | null;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/** Get notification title based on trigger */
export const getPushNotificationTitle = (trigger: PushNotificationTrigger): string => {
  const titles: Record<PushNotificationTrigger, string> = {
    appointment_new: 'New Appointment',
    appointment_updated: 'Appointment Updated',
    appointment_cancelled: 'Appointment Cancelled',
    appointment_no_show: 'Patient No-Show',
    schedule_summary: "Today's Schedule",
    schedule_batch_update: 'Schedule Updates',
    critical_update: 'Important Update',
    leave_approved: 'Leave Approved',
    leave_rejected: 'Leave Rejected',
    salary_credited: 'Salary Credited',
  };
  return titles[trigger] || 'Notification';
};

/** Format push notification body */
export const formatPushNotificationBody = (data: PushNotificationData): string => {
  switch (data.trigger) {
    case 'appointment_new':
      return `${data.patientFirstName} - ${data.appointmentDate} at ${data.appointmentTime}`;
    
    case 'appointment_updated':
      if (data.changeType === 'rescheduled') {
        return `${data.patientFirstName}'s appointment moved to ${data.newDate} at ${data.newTime}`;
      }
      return `${data.patientFirstName}'s appointment has been updated`;
    
    case 'appointment_cancelled':
    case 'appointment_no_show':
      return `${data.patientFirstName} - ${data.originalDate} at ${data.originalTime}`;
    
    case 'schedule_summary':
      if (data.appointmentCount === 0) {
        return 'No appointments scheduled for today';
      }
      return `${data.appointmentCount} appointment${data.appointmentCount > 1 ? 's' : ''} from ${data.firstSlotTime} to ${data.lastSlotTime}`;
    
    case 'schedule_batch_update':
      return data.message;
    
    case 'critical_update':
      return data.message;
    
    case 'leave_approved':
      return `Your ${data.leaveType} leave from ${data.startDate} to ${data.endDate} has been approved`;
    
    case 'leave_rejected':
      return `Your ${data.leaveType} leave request has been rejected${data.rejectionReason ? `: ${data.rejectionReason}` : ''}`;
    
    default:
      return 'You have a new notification';
  }
};

/** Get deep link route for notification tap */
export const getNotificationDeepLink = (data: PushNotificationData): string => {
  switch (data.trigger) {
    case 'appointment_new':
    case 'appointment_updated':
    case 'appointment_cancelled':
    case 'appointment_no_show':
      return `/clinic-admin/appointments/${data.appointmentId}`;
    
    case 'schedule_summary':
    case 'schedule_batch_update':
      return '/therapist';
    
    case 'critical_update':
      return data.actionUrl || '/notifications';
    
    case 'leave_approved':
    case 'leave_rejected':
      return '/therapist';
    
    default:
      return '/notifications';
  }
};

/** Check if notification should be delivered based on preferences */
export const shouldDeliverPushNotification = (
  trigger: PushNotificationTrigger,
  preferences: TherapistNotificationPreferences
): boolean => {
  const triggerMap: Record<PushNotificationTrigger, keyof TherapistNotificationPreferences> = {
    appointment_new: 'newAppointment',
    appointment_updated: 'appointmentUpdates',
    appointment_cancelled: 'cancellationsNoShows',
    appointment_no_show: 'cancellationsNoShows',
    schedule_summary: 'dailyScheduleSummary',
    schedule_batch_update: 'appointmentUpdates',
    critical_update: 'criticalUpdates',
    leave_approved: 'leaveUpdates',
    leave_rejected: 'leaveUpdates',
    salary_credited: 'newAppointment',
  };
  
  return preferences[triggerMap[trigger]] as boolean;
};

/** Check if currently in quiet hours */
export const isInQuietHours = (preferences: TherapistNotificationPreferences): boolean => {
  if (!preferences.quietHoursEnabled) return false;
  
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  
  const [startH, startM] = preferences.quietHoursStart.split(':').map(Number);
  const [endH, endM] = preferences.quietHoursEnd.split(':').map(Number);
  
  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;
  
  // Handle overnight quiet hours (e.g., 22:00 - 07:00)
  if (startMinutes > endMinutes) {
    return currentMinutes >= startMinutes || currentMinutes <= endMinutes;
  }
  
  return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
};
