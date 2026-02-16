/**
 * Push Notification Service Interface
 * Abstract interface for push notification providers
 * 
 * This abstraction allows swapping Expo Push Notifications for Firebase Cloud Messaging (FCM)
 * or other providers in the future without changing the consuming code.
 */

import { PushNotificationData, TherapistNotificationPreferences } from '../models/push.dtos';

// ============================================
// SERVICE INTERFACE
// ============================================

/**
 * Abstract interface for push notification providers
 * Implement this interface to support different providers (Expo, FCM, OneSignal, etc.)
 */
export interface IPushNotificationService {
  /**
   * Initialize the push notification service
   * @returns Promise resolving to permission status
   */
  initialize(): Promise<PushPermissionStatus>;

  /**
   * Request push notification permissions from the user
   * @returns Promise resolving to permission status
   */
  requestPermissions(): Promise<PushPermissionStatus>;

  /**
   * Get the current permission status
   */
  getPermissionStatus(): Promise<PushPermissionStatus>;

  /**
   * Get the push token for this device
   * @returns Promise resolving to token or null if unavailable
   */
  getPushToken(): Promise<string | null>;

  /**
   * Register device token with backend
   * @param token Push token
   * @param staffId Staff/user ID
   * @param tenantId Tenant ID
   */
  registerDevice(token: string, staffId: string, tenantId: string): Promise<void>;

  /**
   * Unregister device (e.g., on logout)
   * @param token Push token
   * @param staffId Staff/user ID
   */
  unregisterDevice(token: string, staffId: string): Promise<void>;

  /**
   * Set up notification received handler
   * @param handler Callback for received notifications
   */
  onNotificationReceived(handler: NotificationReceivedHandler): () => void;

  /**
   * Set up notification response handler (when user taps)
   * @param handler Callback for notification responses
   */
  onNotificationResponse(handler: NotificationResponseHandler): () => void;

  /**
   * Schedule a local notification
   * @param notification Notification content
   * @param trigger When to show the notification
   */
  scheduleLocalNotification(
    notification: LocalNotificationContent,
    trigger: NotificationTriggerConfig
  ): Promise<string>;

  /**
   * Cancel a scheduled notification
   * @param notificationId ID of notification to cancel
   */
  cancelScheduledNotification(notificationId: string): Promise<void>;

  /**
   * Cancel all scheduled notifications
   */
  cancelAllScheduledNotifications(): Promise<void>;

  /**
   * Get badge count
   */
  getBadgeCount(): Promise<number>;

  /**
   * Set badge count
   * @param count Badge count
   */
  setBadgeCount(count: number): Promise<void>;

  /**
   * Clear all delivered notifications
   */
  clearAllNotifications(): Promise<void>;
}

// ============================================
// SUPPORTING TYPES
// ============================================

/** Permission status */
export type PushPermissionStatus = 'granted' | 'denied' | 'undetermined';

/** Notification content for local scheduling */
export interface LocalNotificationContent {
  title: string;
  body: string;
  data?: Record<string, unknown>;
  sound?: boolean | string;
  badge?: number;
  categoryIdentifier?: string;
  subtitle?: string;
}

/** Trigger configuration for scheduled notifications */
export interface NotificationTriggerConfig {
  type: 'date' | 'daily' | 'interval';
  value: Date | { hour: number; minute: number } | number;
  repeats?: boolean;
}

/** Received notification event */
export interface ReceivedNotification {
  notificationId: string;
  title: string;
  body: string;
  data: PushNotificationData;
  receivedAt: Date;
}

/** Notification response event (when user taps) */
export interface NotificationResponse {
  notificationId: string;
  title: string;
  body: string;
  data: PushNotificationData;
  actionIdentifier: string;
}

/** Handler for received notifications */
export type NotificationReceivedHandler = (notification: ReceivedNotification) => void;

/** Handler for notification responses */
export type NotificationResponseHandler = (response: NotificationResponse) => void;

// ============================================
// PROVIDER ENUM
// ============================================

/** Available push notification providers */
export enum PushNotificationProvider {
  EXPO = 'expo',
  FCM = 'fcm',
  APNS = 'apns',
  ONE_SIGNAL = 'one_signal',
}

// ============================================
// SERVICE FACTORY
// ============================================

/**
 * Factory function type for creating push notification services
 */
export type PushNotificationServiceFactory = () => IPushNotificationService;
