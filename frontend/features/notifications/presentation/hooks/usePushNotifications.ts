/**
 * Push Notification Hook (Backend Integrated)
 * React hook for managing push notifications with backend API integration
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'expo-router';
import { AppState, AppStateStatus, Platform } from 'react-native';
import * as Device from 'expo-device';
import { expoPushService } from '../../data/datasources/expo-push.service';
import {
  PushPermissionStatus,
  ReceivedNotification,
  NotificationResponse,
} from '../../data/datasources/push.service.interface';
import {
  registerDeviceApi,
  unregisterDeviceApi,
  getPreferencesApi,
  updatePreferencesApi,
  NotificationPreferencesDto,
  UpdatePreferencesRequest,
} from '../../data/datasources/push-notifications.api';
import {
  PushNotificationData,
  TherapistNotificationPreferences,
  DEFAULT_NOTIFICATION_PREFERENCES,
  getNotificationDeepLink,
  shouldDeliverPushNotification,
  isInQuietHours,
} from '../../data/models/push.dtos';
import { useAuth } from '../../../auth/presentation/hooks/useAuth';

interface UsePushNotificationsReturn {
  // State
  permissionStatus: PushPermissionStatus;
  pushToken: string | null;
  isInitialized: boolean;
  isLoading: boolean;
  preferences: TherapistNotificationPreferences | null;
  recentNotifications: ReceivedNotification[];
  error: string | null;
  
  // Actions
  requestPermissions: () => Promise<PushPermissionStatus>;
  initialize: () => Promise<void>;
  updatePreferences: (updates: Partial<TherapistNotificationPreferences>) => Promise<void>;
  clearNotifications: () => Promise<void>;
  setBadgeCount: (count: number) => Promise<void>;
  scheduleScheduleSummary: () => Promise<void>;
  cancelScheduleSummary: () => Promise<void>;
  refreshPreferences: () => Promise<void>;
}

/**
 * Map backend DTO to frontend preference format
 */
function mapDtoToPreferences(dto: NotificationPreferencesDto): TherapistNotificationPreferences {
  return {
    staffId: dto.user_id,
    tenantId: dto.tenant_id,
    newAppointment: dto.appointment_new,
    appointmentUpdates: dto.appointment_updated,
    cancellationsNoShows: dto.appointment_cancelled || dto.appointment_no_show,
    dailyScheduleSummary: dto.daily_schedule_summary,
    criticalUpdates: dto.critical_updates,
    leaveUpdates: dto.leave_updates,
    scheduleSummaryTime: dto.schedule_summary_time,
    enableMiddaySummary: dto.enable_midday_summary,
    middaySummaryTime: dto.midday_summary_time,
    quietHoursEnabled: dto.quiet_hours_enabled,
    quietHoursStart: dto.quiet_hours_start,
    quietHoursEnd: dto.quiet_hours_end,
    updatedAt: dto.updated_at,
  };
}

/**
 * Map frontend preferences to backend update request format
 */
function mapPreferencesToUpdateRequest(
  updates: Partial<TherapistNotificationPreferences>
): UpdatePreferencesRequest {
  const request: UpdatePreferencesRequest = {};

  if (updates.newAppointment !== undefined) {
    request.appointment_new = updates.newAppointment;
  }
  if (updates.appointmentUpdates !== undefined) {
    request.appointment_updated = updates.appointmentUpdates;
  }
  if (updates.cancellationsNoShows !== undefined) {
    request.appointment_cancelled = updates.cancellationsNoShows;
    request.appointment_no_show = updates.cancellationsNoShows;
  }
  if (updates.dailyScheduleSummary !== undefined) {
    request.daily_schedule_summary = updates.dailyScheduleSummary;
  }
  if (updates.criticalUpdates !== undefined) {
    request.critical_updates = updates.criticalUpdates;
  }
  if (updates.leaveUpdates !== undefined) {
    request.leave_updates = updates.leaveUpdates;
  }
  if (updates.scheduleSummaryTime !== undefined) {
    request.schedule_summary_time = updates.scheduleSummaryTime;
  }
  if (updates.enableMiddaySummary !== undefined) {
    request.enable_midday_summary = updates.enableMiddaySummary;
  }
  if (updates.middaySummaryTime !== undefined) {
    request.midday_summary_time = updates.middaySummaryTime;
  }
  if (updates.quietHoursEnabled !== undefined) {
    request.quiet_hours_enabled = updates.quietHoursEnabled;
  }
  if (updates.quietHoursStart !== undefined) {
    request.quiet_hours_start = updates.quietHoursStart;
  }
  if (updates.quietHoursEnd !== undefined) {
    request.quiet_hours_end = updates.quietHoursEnd;
  }

  return request;
}

/**
 * Hook for managing push notifications with backend integration
 */
export const usePushNotifications = (): UsePushNotificationsReturn => {
  const router = useRouter();
  const { currentUser, isAuthenticated } = useAuth();
  
  const [permissionStatus, setPermissionStatus] = useState<PushPermissionStatus>('undetermined');
  const [pushToken, setPushToken] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [preferences, setPreferences] = useState<TherapistNotificationPreferences | null>(null);
  const [recentNotifications, setRecentNotifications] = useState<ReceivedNotification[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  const scheduleSummaryId = useRef<string | null>(null);
  const deviceRegistered = useRef(false);

  // Get tenant ID from auth context
  const tenantId = currentUser?.tenantId;
  const userId = currentUser?.userId;

  /**
   * Fetch preferences from backend
   */
  const fetchPreferences = useCallback(async () => {
    if (!tenantId) return null;

    try {
      setIsLoading(true);
      const dto = await getPreferencesApi(tenantId);
      const prefs = mapDtoToPreferences(dto);
      setPreferences(prefs);
      setError(null);
      return prefs;
    } catch (err: any) {
      console.error('Failed to fetch notification preferences:', err);
      // Use defaults if API fails
      const defaultPrefs: TherapistNotificationPreferences = {
        ...DEFAULT_NOTIFICATION_PREFERENCES,
        staffId: userId || '',
        tenantId: tenantId || '',
        updatedAt: new Date().toISOString(),
      };
      setPreferences(defaultPrefs);
      setError(err.message || 'Failed to load preferences');
      return defaultPrefs;
    } finally {
      setIsLoading(false);
    }
  }, [tenantId, userId]);

  /**
   * Refresh preferences from backend
   */
  const refreshPreferences = useCallback(async () => {
    await fetchPreferences();
  }, [fetchPreferences]);

  /**
   * Update preferences on backend
   */
  const updatePreferences = useCallback(
    async (updates: Partial<TherapistNotificationPreferences>) => {
      if (!tenantId || !preferences) return;

      // Optimistically update local state
      const previousPrefs = preferences;
      const optimisticPrefs: TherapistNotificationPreferences = {
        ...preferences,
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      setPreferences(optimisticPrefs);

      try {
        setIsLoading(true);
        const requestData = mapPreferencesToUpdateRequest(updates);
        const dto = await updatePreferencesApi(tenantId, requestData);
        const updatedPrefs = mapDtoToPreferences(dto);
        setPreferences(updatedPrefs);
        setError(null);

        // Re-schedule daily summary if time changed
        if (updates.scheduleSummaryTime || updates.dailyScheduleSummary !== undefined) {
          if (updatedPrefs.dailyScheduleSummary) {
            await scheduleScheduleSummary();
          } else {
            await cancelScheduleSummary();
          }
        }
      } catch (err: any) {
        console.error('Failed to update preferences:', err);
        // Revert to previous state on error
        setPreferences(previousPrefs);
        setError(err.message || 'Failed to update preferences');
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [tenantId, preferences]
  );

  /**
   * Register device with backend
   */
  const registerDevice = useCallback(async (token: string) => {
    if (!tenantId || deviceRegistered.current) return;

    try {
      await registerDeviceApi(tenantId, {
        push_token: token,
        platform: Platform.OS as 'ios' | 'android' | 'web',
        device_name: Device.deviceName || undefined,
        device_model: Device.modelName || undefined,
        app_version: '1.0.0',
      });
      deviceRegistered.current = true;
      console.log('Device registered for push notifications');
    } catch (err) {
      console.error('Failed to register device:', err);
      // Non-critical error, don't throw
    }
  }, [tenantId]);

  /**
   * Unregister device from backend
   */
  const unregisterDevice = useCallback(async (token: string) => {
    if (!tenantId) return;

    try {
      await unregisterDeviceApi(tenantId, token);
      deviceRegistered.current = false;
      console.log('Device unregistered from push notifications');
    } catch (err) {
      console.error('Failed to unregister device:', err);
      // Non-critical error, don't throw
    }
  }, [tenantId]);

  /**
   * Handle received notification
   */
  const handleNotificationReceived = useCallback((notification: ReceivedNotification) => {
    console.log('Notification received:', notification.title);
    
    // Check preferences before processing
    if (preferences) {
      const data = notification.data as PushNotificationData;
      if (!shouldDeliverPushNotification(data.trigger, preferences)) {
        console.log('Notification filtered by preferences');
        return;
      }
      if (isInQuietHours(preferences)) {
        console.log('Notification filtered by quiet hours');
        return;
      }
    }

    // Add to recent notifications
    setRecentNotifications(prev => [notification, ...prev.slice(0, 49)]);
  }, [preferences]);

  /**
   * Handle notification tap - deep link navigation
   */
  const handleNotificationResponse = useCallback((response: NotificationResponse) => {
    console.log('Notification tapped:', response.title);
    
    const data = response.data as PushNotificationData;
    const route = getNotificationDeepLink(data);
    
    // Navigate to the appropriate screen
    if (route) {
      router.push(route as any);
    }
  }, [router]);

  /**
   * Initialize push notifications
   */
  const initialize = useCallback(async () => {
    if (isInitialized || !tenantId) return;

    try {
      setIsLoading(true);

      // Initialize the Expo push service
      const status = await expoPushService.initialize();
      setPermissionStatus(status);

      if (status === 'granted') {
        // Get push token
        const token = await expoPushService.getPushToken();
        setPushToken(token);

        // Register device with backend
        if (token) {
          await registerDevice(token);
        }
      }

      // Fetch preferences from backend
      await fetchPreferences();

      // Set up notification listeners
      expoPushService.onNotificationReceived(handleNotificationReceived);
      expoPushService.onNotificationResponse(handleNotificationResponse);

      setIsInitialized(true);
      setError(null);
    } catch (err: any) {
      console.error('Failed to initialize push notifications:', err);
      setError(err.message || 'Failed to initialize notifications');
    } finally {
      setIsLoading(false);
    }
  }, [isInitialized, tenantId, registerDevice, fetchPreferences, handleNotificationReceived, handleNotificationResponse]);

  /**
   * Request permissions
   */
  const requestPermissions = useCallback(async (): Promise<PushPermissionStatus> => {
    const status = await expoPushService.requestPermissions();
    setPermissionStatus(status);

    if (status === 'granted') {
      const token = await expoPushService.getPushToken();
      setPushToken(token);

      if (token) {
        await registerDevice(token);
      }
    }

    return status;
  }, [registerDevice]);

  /**
   * Clear all notifications
   */
  const clearNotifications = useCallback(async () => {
    await expoPushService.clearAllNotifications();
    setRecentNotifications([]);
  }, []);

  /**
   * Set badge count
   */
  const setBadgeCount = useCallback(async (count: number) => {
    await expoPushService.setBadgeCount(count);
  }, []);

  /**
   * Schedule daily schedule summary notification
   */
  const scheduleScheduleSummary = useCallback(async () => {
    if (!preferences?.dailyScheduleSummary) return;

    // Cancel existing if any
    await cancelScheduleSummary();

    const [hour, minute] = preferences.scheduleSummaryTime.split(':').map(Number);

    // Schedule morning summary
    const morningId = await expoPushService.scheduleLocalNotification(
      {
        title: "Today's Schedule",
        body: 'Tap to view your appointments for today',
        data: {
          trigger: 'schedule_summary',
          summaryType: 'morning',
        } as any,
        sound: true,
        categoryIdentifier: 'schedule',
      },
      {
        type: 'daily',
        value: { hour, minute },
        repeats: true,
      }
    );

    scheduleSummaryId.current = morningId;

    // Schedule midday summary if enabled
    if (preferences.enableMiddaySummary) {
      const [middayHour, middayMinute] = preferences.middaySummaryTime.split(':').map(Number);
      
      await expoPushService.scheduleLocalNotification(
        {
          title: 'Afternoon Schedule Update',
          body: 'Tap to view your remaining appointments',
          data: {
            trigger: 'schedule_summary',
            summaryType: 'midday',
          } as any,
          sound: true,
          categoryIdentifier: 'schedule',
        },
        {
          type: 'daily',
          value: { hour: middayHour, minute: middayMinute },
          repeats: true,
        }
      );
    }
  }, [preferences]);

  /**
   * Cancel schedule summary notifications
   */
  const cancelScheduleSummary = useCallback(async () => {
    if (scheduleSummaryId.current) {
      await expoPushService.cancelScheduledNotification(scheduleSummaryId.current);
      scheduleSummaryId.current = null;
    }
    // Cancel all schedule category notifications
    await expoPushService.cancelAllScheduledNotifications();
  }, []);

  // Initialize on mount when user is authenticated
  useEffect(() => {
    if (isAuthenticated && currentUser && tenantId && !isInitialized) {
      initialize();
    }
  }, [isAuthenticated, currentUser, tenantId, isInitialized, initialize]);

  // Clean up on logout - unregister device
  useEffect(() => {
    if (!isAuthenticated && isInitialized) {
      // Unregister device from backend
      if (pushToken) {
        unregisterDevice(pushToken);
      }
      setIsInitialized(false);
      setPushToken(null);
      setPreferences(null);
      deviceRegistered.current = false;
    }
  }, [isAuthenticated, isInitialized, pushToken, unregisterDevice]);

  // Handle app state changes (refresh on foreground)
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active' && isAuthenticated && isInitialized) {
        // Refresh badge count when app becomes active
        expoPushService.getBadgeCount().then(count => {
          console.log('Badge count:', count);
        });
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [isAuthenticated, isInitialized]);

  return {
    permissionStatus,
    pushToken,
    isInitialized,
    isLoading,
    preferences,
    recentNotifications,
    error,
    requestPermissions,
    initialize,
    updatePreferences,
    clearNotifications,
    setBadgeCount,
    scheduleScheduleSummary,
    cancelScheduleSummary,
    refreshPreferences,
  };
};

export default usePushNotifications;
