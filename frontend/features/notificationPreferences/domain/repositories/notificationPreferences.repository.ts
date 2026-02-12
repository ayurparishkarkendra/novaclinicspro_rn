/**
 * Notification Preferences Repository Interface
 */

import { NotificationPreference, NotificationFrequency } from '../entities/notification-preference.entity';

export interface UpdatePreferenceParams {
  frequency?: NotificationFrequency;
  enabled?: boolean;
}

export interface BulkUpdateParams {
  preferences: Array<{
    id: string;
    frequency?: NotificationFrequency;
    enabled?: boolean;
  }>;
}

export interface INotificationPreferencesRepository {
  listPreferences(userId: string): Promise<NotificationPreference[]>;
  updatePreference(userId: string, preferenceId: string, params: UpdatePreferenceParams): Promise<NotificationPreference>;
  bulkUpdatePreferences(userId: string, params: BulkUpdateParams): Promise<NotificationPreference[]>;
}
