/**
 * Notification Preferences DTOs
 * Data Transfer Objects for notification preference operations
 * 
 * Note: These DTOs are prepared for when the Notification Preferences API becomes available.
 */

export type NotificationChannel = 'in_app' | 'email' | 'sms';
export type NotificationFrequency = 'immediate' | 'daily' | 'weekly' | 'off';
export type NotificationEventType = 
  | 'appointment_reminder'
  | 'appointment_cancelled'
  | 'appointment_rescheduled'
  | 'payment_received'
  | 'invoice_generated'
  | 'payment_due'
  | 'clinical_document_ready'
  | 'prescription_ready'
  | 'system_maintenance'
  | 'security_alert';

export interface NotificationPreferenceDto {
  id: string;
  user_id: string;
  event_type: NotificationEventType;
  channel: NotificationChannel;
  frequency: NotificationFrequency;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface NotificationPreferencesListResponse {
  items: NotificationPreferenceDto[];
  total: number;
}

export interface UpdateNotificationPreferenceRequest {
  frequency?: NotificationFrequency;
  enabled?: boolean;
}

export interface BulkUpdateNotificationPreferencesRequest {
  preferences: Array<{
    id: string;
    frequency?: NotificationFrequency;
    enabled?: boolean;
  }>;
}

// Entity conversion
export function toPreferenceEntity(
  dto: NotificationPreferenceDto
): import('../../domain/entities/notification-preference.entity').NotificationPreference {
  return {
    id: dto.id,
    userId: dto.user_id,
    eventType: dto.event_type,
    channel: dto.channel,
    frequency: dto.frequency,
    enabled: dto.enabled,
    createdAt: new Date(dto.created_at),
    updatedAt: new Date(dto.updated_at),
  };
}

// Helper labels
export function getChannelLabel(channel: NotificationChannel): string {
  const labels: Record<NotificationChannel, string> = {
    in_app: 'In-App',
    email: 'Email',
    sms: 'SMS',
  };
  return labels[channel] || channel;
}

export function getFrequencyLabel(frequency: NotificationFrequency): string {
  const labels: Record<NotificationFrequency, string> = {
    immediate: 'Immediate',
    daily: 'Daily Digest',
    weekly: 'Weekly Summary',
    off: 'Off',
  };
  return labels[frequency] || frequency;
}

export function getEventTypeLabel(eventType: NotificationEventType): string {
  const labels: Record<NotificationEventType, string> = {
    appointment_reminder: 'Appointment Reminders',
    appointment_cancelled: 'Appointment Cancellations',
    appointment_rescheduled: 'Appointment Reschedules',
    payment_received: 'Payment Received',
    invoice_generated: 'New Invoices',
    payment_due: 'Payment Due Reminders',
    clinical_document_ready: 'Clinical Documents Ready',
    prescription_ready: 'Prescriptions Ready',
    system_maintenance: 'System Maintenance',
    security_alert: 'Security Alerts',
  };
  return labels[eventType] || eventType;
}

export function getEventTypeDescription(eventType: NotificationEventType): string {
  const descriptions: Record<NotificationEventType, string> = {
    appointment_reminder: 'Get notified before your upcoming appointments',
    appointment_cancelled: 'Know when an appointment is cancelled',
    appointment_rescheduled: 'Stay updated on appointment time changes',
    payment_received: 'Confirmation when a payment is received',
    invoice_generated: 'Alerts for new invoices requiring attention',
    payment_due: 'Reminders before payment due dates',
    clinical_document_ready: 'Notifications when clinical documents are available',
    prescription_ready: 'Alerts when prescriptions are ready',
    system_maintenance: 'Updates about scheduled maintenance',
    security_alert: 'Important security-related notifications',
  };
  return descriptions[eventType] || '';
}

// Group event types by category for UI organization
export interface EventTypeCategory {
  id: string;
  label: string;
  eventTypes: NotificationEventType[];
}

export const eventTypeCategories: EventTypeCategory[] = [
  {
    id: 'appointments',
    label: 'Appointments',
    eventTypes: ['appointment_reminder', 'appointment_cancelled', 'appointment_rescheduled'],
  },
  {
    id: 'billing',
    label: 'Billing & Finance',
    eventTypes: ['payment_received', 'invoice_generated', 'payment_due'],
  },
  {
    id: 'clinical',
    label: 'Clinical',
    eventTypes: ['clinical_document_ready', 'prescription_ready'],
  },
  {
    id: 'system',
    label: 'System',
    eventTypes: ['system_maintenance', 'security_alert'],
  },
];
