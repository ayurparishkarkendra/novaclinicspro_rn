/**
 * Notifications DTOs
 * Data Transfer Objects for notification operations
 * 
 * Note: These DTOs are prepared for when the Notifications API becomes available.
 * Currently, the API endpoints do not exist, so all operations return mock/placeholder data.
 */

export type NotificationCategory = 'appointments' | 'billing' | 'clinical' | 'system' | 'general';
export type NotificationImportance = 'low' | 'medium' | 'high' | 'urgent';

export interface NotificationDto {
  id: string;
  tenant_id: string;
  user_id: string;
  title: string;
  message: string;
  category: NotificationCategory;
  importance: NotificationImportance;
  created_at: string;
  read_at: string | null;
  related_resource_type?: string;
  related_resource_id?: string;
  action_url?: string;
  metadata?: Record<string, unknown>;
}

export interface NotificationListResponse {
  items: NotificationDto[];
  total: number;
  page: number;
  page_size: number;
  unread_count: number;
}

export interface ListNotificationsParams {
  page?: number;
  page_size?: number;
  unread_only?: boolean;
  category?: NotificationCategory;
}

export interface MarkNotificationReadRequest {
  notification_id: string;
}

export interface MarkAllNotificationsReadRequest {
  category?: NotificationCategory;
}

export interface MarkAllReadResponse {
  marked_count: number;
  success: boolean;
}

// Entity conversion helpers
export function toNotificationEntity(dto: NotificationDto): import('../../domain/entities/notification.entity').Notification {
  return {
    id: dto.id,
    tenantId: dto.tenant_id,
    userId: dto.user_id,
    title: dto.title,
    message: dto.message,
    category: dto.category,
    importance: dto.importance,
    createdAt: new Date(dto.created_at),
    readAt: dto.read_at ? new Date(dto.read_at) : null,
    relatedResourceType: dto.related_resource_type,
    relatedResourceId: dto.related_resource_id,
    actionUrl: dto.action_url,
    metadata: dto.metadata,
    isRead: !!dto.read_at,
  };
}

export function getCategoryLabel(category: NotificationCategory): string {
  const labels: Record<NotificationCategory, string> = {
    appointments: 'Appointments',
    billing: 'Billing & Finance',
    clinical: 'Clinical',
    system: 'System',
    general: 'General',
  };
  return labels[category] || category;
}

export function getImportanceLabel(importance: NotificationImportance): string {
  const labels: Record<NotificationImportance, string> = {
    low: 'Low',
    medium: 'Medium',
    high: 'High',
    urgent: 'Urgent',
  };
  return labels[importance] || importance;
}
