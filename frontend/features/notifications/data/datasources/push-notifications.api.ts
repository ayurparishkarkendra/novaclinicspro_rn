/**
 * Push Notifications API
 * Backend API integration for push notification management
 * 
 * Base URL: https://api.novaclinicspro.com/api/v1
 * All endpoints require tenant_id from JWT auth context
 */

import { axiosClient } from '../../../../core/api/axiosClient';

// ============================================
// REQUEST/RESPONSE TYPES
// ============================================

/** Device registration request */
export interface RegisterDeviceRequest {
  push_token: string;
  platform: 'ios' | 'android' | 'web';
  device_name?: string;
  device_model?: string;
  app_version?: string;
}

/** Device registration response */
export interface RegisterDeviceResponse {
  id: string;
  push_token: string;
  platform: string;
  device_name?: string;
  device_model?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/** Notification preferences from backend */
export interface NotificationPreferencesDto {
  id: string;
  user_id: string;
  tenant_id: string;
  
  // Notification type toggles
  appointment_new: boolean;
  appointment_updated: boolean;
  appointment_cancelled: boolean;
  appointment_no_show: boolean;
  daily_schedule_summary: boolean;
  critical_updates: boolean;
  leave_updates: boolean;
  
  // Schedule summary settings
  schedule_summary_time: string;
  enable_midday_summary: boolean;
  midday_summary_time: string;
  
  // Quiet hours
  quiet_hours_enabled: boolean;
  quiet_hours_start: string;
  quiet_hours_end: string;
  
  created_at: string;
  updated_at: string;
}

/** Update preferences request */
export interface UpdatePreferencesRequest {
  appointment_new?: boolean;
  appointment_updated?: boolean;
  appointment_cancelled?: boolean;
  appointment_no_show?: boolean;
  daily_schedule_summary?: boolean;
  critical_updates?: boolean;
  leave_updates?: boolean;
  schedule_summary_time?: string;
  enable_midday_summary?: boolean;
  midday_summary_time?: string;
  quiet_hours_enabled?: boolean;
  quiet_hours_start?: string;
  quiet_hours_end?: string;
}

/** Notification history item */
export interface NotificationHistoryItem {
  id: string;
  tenant_id: string;
  user_id: string;
  title: string;
  body: string;
  notification_type: string;
  data?: Record<string, unknown>;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
  deep_link?: string;
}

/** Notification history response with pagination */
export interface NotificationHistoryResponse {
  items: NotificationHistoryItem[];
  total: number;
  page: number;
  page_size: number;
  has_next: boolean;
  has_prev: boolean;
  unread_count: number;
}

/** History query params */
export interface NotificationHistoryParams {
  page?: number;
  page_size?: number;
  unread_only?: boolean;
  notification_type?: string;
}

/** Mark all read response */
export interface MarkAllReadResponse {
  marked_count: number;
  success: boolean;
}

/** Test notification request */
export interface TestNotificationRequest {
  notification_type: string;
  title?: string;
  body?: string;
}

// ============================================
// API FUNCTIONS
// ============================================

const BASE_PATH = '/api/v1/notifications';

/**
 * Register device for push notifications
 * POST /notifications/{tenant_id}/register-device
 */
export async function registerDeviceApi(
  tenantId: string,
  data: RegisterDeviceRequest
): Promise<RegisterDeviceResponse> {
  const response = await axiosClient.post<RegisterDeviceResponse>(
    `${BASE_PATH}/${tenantId}/register-device`,
    data
  );
  return response.data;
}

/**
 * Unregister device from push notifications
 * DELETE /notifications/{tenant_id}/unregister-device
 */
export async function unregisterDeviceApi(
  tenantId: string,
  pushToken: string
): Promise<void> {
  await axiosClient.delete(
    `${BASE_PATH}/${tenantId}/unregister-device`,
    { data: { push_token: pushToken } }
  );
}

/**
 * Get notification preferences
 * GET /notifications/{tenant_id}/preferences
 */
export async function getPreferencesApi(
  tenantId: string
): Promise<NotificationPreferencesDto> {
  const response = await axiosClient.get<NotificationPreferencesDto>(
    `${BASE_PATH}/${tenantId}/preferences`
  );
  return response.data;
}

/**
 * Update notification preferences
 * PUT /notifications/{tenant_id}/preferences
 */
export async function updatePreferencesApi(
  tenantId: string,
  data: UpdatePreferencesRequest
): Promise<NotificationPreferencesDto> {
  const response = await axiosClient.put<NotificationPreferencesDto>(
    `${BASE_PATH}/${tenantId}/preferences`,
    data
  );
  return response.data;
}

/**
 * Reset notification preferences to defaults
 * POST /notifications/{tenant_id}/preferences/reset
 */
export async function resetPreferencesApi(
  tenantId: string
): Promise<NotificationPreferencesDto> {
  const response = await axiosClient.post<NotificationPreferencesDto>(
    `${BASE_PATH}/${tenantId}/preferences/reset`
  );
  return response.data;
}

/**
 * Get notification history
 * GET /notifications/{tenant_id}/history
 */
export async function getNotificationHistoryApi(
  tenantId: string,
  params?: NotificationHistoryParams
): Promise<NotificationHistoryResponse> {
  const response = await axiosClient.get<NotificationHistoryResponse>(
    `${BASE_PATH}/${tenantId}/history`,
    { params }
  );
  return response.data;
}

/**
 * Mark single notification as read
 * PATCH /notifications/{tenant_id}/history/{notification_id}/mark-read
 */
export async function markNotificationReadApi(
  tenantId: string,
  notificationId: string
): Promise<NotificationHistoryItem> {
  const response = await axiosClient.patch<NotificationHistoryItem>(
    `${BASE_PATH}/${tenantId}/history/${notificationId}/mark-read`
  );
  return response.data;
}

/**
 * Mark all notifications as read
 * POST /notifications/{tenant_id}/history/mark-all-read
 */
export async function markAllNotificationsReadApi(
  tenantId: string
): Promise<MarkAllReadResponse> {
  const response = await axiosClient.post<MarkAllReadResponse>(
    `${BASE_PATH}/${tenantId}/history/mark-all-read`
  );
  return response.data;
}

/**
 * Delete a notification
 * DELETE /notifications/{tenant_id}/history/{notification_id}
 */
export async function deleteNotificationApi(
  tenantId: string,
  notificationId: string
): Promise<void> {
  await axiosClient.delete(
    `${BASE_PATH}/${tenantId}/history/${notificationId}`
  );
}

/**
 * Send test notification
 * POST /notifications/{tenant_id}/test
 */
export async function sendTestNotificationApi(
  tenantId: string,
  data: TestNotificationRequest
): Promise<{ success: boolean; message: string }> {
  const response = await axiosClient.post<{ success: boolean; message: string }>(
    `${BASE_PATH}/${tenantId}/test`,
    data
  );
  return response.data;
}
