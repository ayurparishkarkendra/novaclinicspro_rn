/**
 * Notifications Repository Interface
 * Domain interface for notification operations
 */

import { Notification, NotificationCategory } from '../entities/notification.entity';

export interface NotificationListResult {
  notifications: Notification[];
  total: number;
  page: number;
  pageSize: number;
  unreadCount: number;
}

export interface ListNotificationsParams {
  page?: number;
  pageSize?: number;
  unreadOnly?: boolean;
  category?: NotificationCategory;
}

export interface INotificationsRepository {
  listNotifications(tenantId: string, params?: ListNotificationsParams): Promise<NotificationListResult>;
  getNotification(tenantId: string, notificationId: string): Promise<Notification | null>;
  markAsRead(tenantId: string, notificationId: string): Promise<Notification>;
  markAllAsRead(tenantId: string, category?: NotificationCategory): Promise<{ markedCount: number }>;
}
