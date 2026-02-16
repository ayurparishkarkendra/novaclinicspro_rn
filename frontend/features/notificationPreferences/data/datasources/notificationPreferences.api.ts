/**
 * Notification Preferences API
 * 
 * Note: The Notification Preferences API endpoints do not currently exist.
 * All functions throw an error to indicate the feature is not yet available.
 */

import { axiosClient } from '../../../../core/api/axiosClient';
import {
  NotificationPreferenceDto,
  NotificationPreferencesListResponse,
  UpdateNotificationPreferenceRequest,
  BulkUpdateNotificationPreferencesRequest,
} from '../models/notificationPreferences.dtos';

// Custom error for unavailable features
export class NotificationPreferencesApiNotAvailableError extends Error {
  constructor() {
    super('Notification Preferences API is not yet available in your environment.');
    this.name = 'NotificationPreferencesApiNotAvailableError';
  }
}

/**
 * List notification preferences for a user
 * API: GET /api/v1/users/{user_id}/notification-preferences (NOT YET AVAILABLE)
 */
export async function listNotificationPreferencesApi(
  userId: string
): Promise<NotificationPreferencesListResponse> {
  // API endpoint does not exist yet
  throw new NotificationPreferencesApiNotAvailableError();
  
  // When API becomes available, uncomment:
  // const response = await apiClient.get<NotificationPreferencesListResponse>(
  //   `/api/v1/users/${userId}/notification-preferences`
  // );
  // return response.data;
}

/**
 * Update a single notification preference
 * API: PATCH /api/v1/users/{user_id}/notification-preferences/{preference_id} (NOT YET AVAILABLE)
 */
export async function updateNotificationPreferenceApi(
  userId: string,
  preferenceId: string,
  payload: UpdateNotificationPreferenceRequest
): Promise<NotificationPreferenceDto> {
  // API endpoint does not exist yet
  throw new NotificationPreferencesApiNotAvailableError();
  
  // When API becomes available, uncomment:
  // const response = await apiClient.patch<NotificationPreferenceDto>(
  //   `/api/v1/users/${userId}/notification-preferences/${preferenceId}`,
  //   payload
  // );
  // return response.data;
}

/**
 * Bulk update notification preferences
 * API: PUT /api/v1/users/{user_id}/notification-preferences/bulk (NOT YET AVAILABLE)
 */
export async function bulkUpdateNotificationPreferencesApi(
  userId: string,
  payload: BulkUpdateNotificationPreferencesRequest
): Promise<NotificationPreferencesListResponse> {
  // API endpoint does not exist yet
  throw new NotificationPreferencesApiNotAvailableError();
  
  // When API becomes available, uncomment:
  // const response = await apiClient.put<NotificationPreferencesListResponse>(
  //   `/api/v1/users/${userId}/notification-preferences/bulk`,
  //   payload
  // );
  // return response.data;
}
