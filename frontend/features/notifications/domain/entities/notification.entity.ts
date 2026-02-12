/**
 * Notification Entity
 * Domain entity representing a notification
 */

export type NotificationCategory = 'appointments' | 'billing' | 'clinical' | 'system' | 'general';
export type NotificationImportance = 'low' | 'medium' | 'high' | 'urgent';

export interface Notification {
  id: string;
  tenantId: string;
  userId: string;
  title: string;
  message: string;
  category: NotificationCategory;
  importance: NotificationImportance;
  createdAt: Date;
  readAt: Date | null;
  relatedResourceType?: string;
  relatedResourceId?: string;
  actionUrl?: string;
  metadata?: Record<string, unknown>;
  isRead: boolean;
}

/**
 * Check if notification is unread
 */
export function isUnread(notification: Notification): boolean {
  return !notification.isRead;
}

/**
 * Check if notification is high priority
 */
export function isHighPriority(notification: Notification): boolean {
  return notification.importance === 'high' || notification.importance === 'urgent';
}

/**
 * Get time since notification was created (human readable)
 */
export function getTimeAgo(notification: Notification): string {
  const now = new Date();
  const diff = now.getTime() - notification.createdAt.getTime();
  
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  
  return notification.createdAt.toLocaleDateString();
}
