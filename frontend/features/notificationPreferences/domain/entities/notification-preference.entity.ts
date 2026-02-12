/**
 * Notification Preference Entity
 * Domain entity representing a user's notification preference
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

export interface NotificationPreference {
  id: string;
  userId: string;
  eventType: NotificationEventType;
  channel: NotificationChannel;
  frequency: NotificationFrequency;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Check if preference is enabled
 */
export function isPreferenceEnabled(preference: NotificationPreference): boolean {
  return preference.enabled && preference.frequency !== 'off';
}

/**
 * Get preferences by channel
 */
export function filterByChannel(
  preferences: NotificationPreference[],
  channel: NotificationChannel
): NotificationPreference[] {
  return preferences.filter(p => p.channel === channel);
}

/**
 * Get preferences by event type
 */
export function filterByEventType(
  preferences: NotificationPreference[],
  eventType: NotificationEventType
): NotificationPreference[] {
  return preferences.filter(p => p.eventType === eventType);
}
