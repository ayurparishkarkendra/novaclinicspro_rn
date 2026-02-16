/**
 * Notifications Feature
 * 
 * Provides in-app notification center functionality.
 * Note: API endpoints are not yet available - UI will show placeholder state.
 */

// Data layer - explicitly export DTOs
export {
  type NotificationDto,
  type NotificationListResponse,
  type ListNotificationsParams,
  type MarkNotificationReadRequest,
  type MarkAllNotificationsReadRequest,
  type MarkAllReadResponse,
  toNotificationEntity,
  getCategoryLabel,
  getImportanceLabel,
} from './data/models/notifications.dtos';
export * from './data/datasources/notifications.api';
export * from './data/repositories/notifications.repository.impl';

// Domain layer - export entity types
export {
  type NotificationCategory,
  type NotificationImportance,
  type Notification,
  isUnread,
  isHighPriority,
  getTimeAgo,
} from './domain/entities/notification.entity';
export * from './domain/repositories/notifications.repository';

// Presentation layer
export { NotificationsListScreen } from './presentation/pages/NotificationsListScreen';
export { NotificationDetailScreen } from './presentation/pages/NotificationDetailScreen';
export { NotificationListItem } from './presentation/components/NotificationListItem';
export { NotificationCategoryBadge } from './presentation/components/NotificationCategoryBadge';
export { NotificationsIconWithBadge } from './presentation/components/NotificationsIconWithBadge';
export { useNotificationBadgeCount } from './presentation/hooks/useNotificationBadgeCount';
