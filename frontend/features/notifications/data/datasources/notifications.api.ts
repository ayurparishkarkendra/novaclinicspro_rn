/**
 * Notifications API
 * 
 * Note: The Notifications API endpoints do not currently exist in the backend.
 * All functions throw a NotAvailableError to indicate the feature is not yet available.
 * Once the API is implemented, these functions should be updated to make actual HTTP calls.
 */

import { apiClient } from '../../../../core/api/axiosClient';
import {
  NotificationDto,
  NotificationListResponse,
  ListNotificationsParams,
  MarkAllReadResponse,
} from '../models/notifications.dtos';

// Custom error for unavailable features
export class NotificationApiNotAvailableError extends Error {
  constructor() {
    super('Notifications API is not yet available in your environment.');
    this.name = 'NotificationApiNotAvailableError';
  }
}

/**
 * List notifications for a tenant/user
 * API: GET /api/v1/tenants/{tenant_id}/notifications (NOT YET AVAILABLE)
 */
export async function listNotificationsApi(
  tenantId: string,
  params: ListNotificationsParams = {}
): Promise<NotificationListResponse> {
  // API endpoint does not exist yet
  throw new NotificationApiNotAvailableError();
  
  // When API becomes available, uncomment:
  // const response = await apiClient.get<NotificationListResponse>(
  //   `/api/v1/tenants/${tenantId}/notifications`,
  //   { params }
  // );
  // return response.data;
}

/**
 * Get a single notification by ID
 * API: GET /api/v1/tenants/{tenant_id}/notifications/{notification_id} (NOT YET AVAILABLE)
 */
export async function getNotificationApi(
  tenantId: string,
  notificationId: string
): Promise<NotificationDto> {
  // API endpoint does not exist yet
  throw new NotificationApiNotAvailableError();
  
  // When API becomes available, uncomment:
  // const response = await apiClient.get<NotificationDto>(
  //   `/api/v1/tenants/${tenantId}/notifications/${notificationId}`
  // );
  // return response.data;
}

/**
 * Mark a notification as read
 * API: PATCH /api/v1/tenants/{tenant_id}/notifications/{notification_id}/read (NOT YET AVAILABLE)
 */
export async function markNotificationReadApi(
  tenantId: string,
  notificationId: string
): Promise<NotificationDto> {
  // API endpoint does not exist yet
  throw new NotificationApiNotAvailableError();
  
  // When API becomes available, uncomment:
  // const response = await apiClient.patch<NotificationDto>(
  //   `/api/v1/tenants/${tenantId}/notifications/${notificationId}/read`
  // );
  // return response.data;
}

/**
 * Mark all notifications as read
 * API: POST /api/v1/tenants/{tenant_id}/notifications/mark-all-read (NOT YET AVAILABLE)
 */
export async function markAllNotificationsReadApi(
  tenantId: string,
  category?: string
): Promise<MarkAllReadResponse> {
  // API endpoint does not exist yet
  throw new NotificationApiNotAvailableError();
  
  // When API becomes available, uncomment:
  // const response = await apiClient.post<MarkAllReadResponse>(
  //   `/api/v1/tenants/${tenantId}/notifications/mark-all-read`,
  //   { category }
  // );
  // return response.data;
}
