/**
 * Notifications Feature
 * 
 * Provides in-app notification center and push notification functionality.
 * 
 * Push Notifications Architecture:
 * - Abstracted service interface (IPushNotificationService) allows provider swapping
 * - Expo Push Notifications is the default provider
 * - Can be swapped for FCM in the future without changing consuming code
 */

// ============================================
// IN-APP NOTIFICATIONS (API-based)
// ============================================

// Data layer - DTOs
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

// Domain layer - entities
export {
  type NotificationCategory,
  type NotificationImportance,
  type Notification,
  isUnread,
  isHighPriority,
  getTimeAgo,
} from './domain/entities/notification.entity';
export * from './domain/repositories/notifications.repository';

// Presentation - In-app notification screens
export { NotificationsListScreen } from './presentation/pages/NotificationsListScreen';
export { NotificationDetailScreen } from './presentation/pages/NotificationDetailScreen';
export { NotificationListItem } from './presentation/components/NotificationListItem';
export { NotificationCategoryBadge } from './presentation/components/NotificationCategoryBadge';
export { NotificationsIconWithBadge } from './presentation/components/NotificationsIconWithBadge';
export { useNotificationBadgeCount } from './presentation/hooks/useNotificationBadgeCount';

// ============================================
// PUSH NOTIFICATIONS (Expo/Device-based)
// ============================================

// Push DTOs & Types
export {
  type PushNotificationTrigger,
  type PushNotificationData,
  type NewAppointmentPushData,
  type AppointmentUpdatedPushData,
  type AppointmentCancelledPushData,
  type ScheduleSummaryPushData,
  type ScheduleBatchUpdatePushData,
  type CriticalUpdatePushData,
  type LeaveStatusPushData,
  type TherapistNotificationPreferences,
  type PushDeviceToken,
  type RegisterDeviceRequest,
  type RegisterDeviceResponse,
  type StoredNotification,
  DEFAULT_NOTIFICATION_PREFERENCES,
  getPushNotificationTitle,
  formatPushNotificationBody,
  getNotificationDeepLink,
  shouldDeliverPushNotification,
  isInQuietHours,
} from './data/models/push.dtos';

// Push Service Interface (for abstraction)
export {
  type IPushNotificationService,
  type PushPermissionStatus,
  type LocalNotificationContent,
  type NotificationTriggerConfig,
  type ReceivedNotification,
  type NotificationResponse,
  type NotificationReceivedHandler,
  type NotificationResponseHandler,
  PushNotificationProvider,
} from './data/datasources/push.service.interface';

// Expo Push Service (default implementation)
export { ExpoPushNotificationService, expoPushService } from './data/datasources/expo-push.service';

// Push Notification Hook
export { usePushNotifications } from './presentation/hooks/usePushNotifications';

// Notification Preferences Screen
export { NotificationPreferencesScreen } from './presentation/pages/NotificationPreferencesScreen';
