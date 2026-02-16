/**
 * Push Notification Hook
 * React hook for managing push notifications in the app
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'expo-router';
import { AppState, AppStateStatus, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { expoPushService } from '../../data/datasources/expo-push.service';
import {
  PushPermissionStatus,
  ReceivedNotification,
  NotificationResponse,
} from '../../data/datasources/push.service.interface';
import {
  PushNotificationData,
  TherapistNotificationPreferences,
  DEFAULT_NOTIFICATION_PREFERENCES,
  getNotificationDeepLink,
  shouldDeliverPushNotification,
  isInQuietHours,
} from '../../data/models/push.dtos';
import { useAuth } from '../../../auth/presentation/hooks/useAuth';

// Storage key for preferences
const PREFERENCES_KEY = '@NovaClinicsPro:notificationPreferences';

interface UsePushNotificationsReturn {
  // State
  permissionStatus: PushPermissionStatus;
  pushToken: string | null;
  isInitialized: boolean;
  preferences: TherapistNotificationPreferences | null;
  recentNotifications: ReceivedNotification[];
  
  // Actions
  requestPermissions: () => Promise<PushPermissionStatus>;
  initialize: () => Promise<void>;
  updatePreferences: (updates: Partial<TherapistNotificationPreferences>) => Promise<void>;
  clearNotifications: () => Promise<void>;
  setBadgeCount: (count: number) => Promise<void>;
  scheduleScheduleSummary: () => Promise<void>;
  cancelScheduleSummary: () => Promise<void>;
}

/**
 * Hook for managing push notifications
 */
export const usePushNotifications = (): UsePushNotificationsReturn => {
  const router = useRouter();
  const { currentUser, isAuthenticated } = useAuth();
  
  const [permissionStatus, setPermissionStatus] = useState<PushPermissionStatus>('undetermined');
  const [pushToken, setPushToken] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [preferences, setPreferences] = useState<TherapistNotificationPreferences | null>(null);
  const [recentNotifications, setRecentNotifications] = useState<ReceivedNotification[]>([]);
  
  const scheduleSummaryId = useRef<string | null>(null);

  // Load preferences from storage
  const loadPreferences = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(PREFERENCES_KEY);
      if (stored) {
        setPreferences(JSON.parse(stored));
      } else if (currentUser) {
        // Set defaults
        const defaultPrefs: TherapistNotificationPreferences = {
          ...DEFAULT_NOTIFICATION_PREFERENCES,
          staffId: currentUser.userId || '',
          tenantId: currentUser.tenantId || '',
          updatedAt: new Date().toISOString(),
        };
        await AsyncStorage.setItem(PREFERENCES_KEY, JSON.stringify(defaultPrefs));
        setPreferences(defaultPrefs);
      }
    } catch (error) {
      console.error('Failed to load notification preferences:', error);
    }
  }, [currentUser]);

  // Update preferences
  const updatePreferences = useCallback(async (
    updates: Partial<TherapistNotificationPreferences>
  ) => {
    if (!preferences) return;
    
    const updated: TherapistNotificationPreferences = {
      ...preferences,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    
    await AsyncStorage.setItem(PREFERENCES_KEY, JSON.stringify(updated));
    setPreferences(updated);

    // Re-schedule daily summary if time changed
    if (updates.scheduleSummaryTime || updates.dailyScheduleSummary !== undefined) {
      if (updated.dailyScheduleSummary) {
        await scheduleScheduleSummary();
      } else {
        await cancelScheduleSummary();
      }
    }
  }, [preferences]);

  // Handle received notification
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

  // Handle notification tap
  const handleNotificationResponse = useCallback((response: NotificationResponse) => {
    console.log('Notification tapped:', response.title);
    
    const data = response.data as PushNotificationData;
    const route = getNotificationDeepLink(data);
    
    // Navigate to the appropriate screen
    if (route) {
      router.push(route as any);
    }
  }, [router]);

  // Initialize push notifications
  const initialize = useCallback(async () => {
    if (isInitialized) return;

    try {
      // Initialize the service
      const status = await expoPushService.initialize();
      setPermissionStatus(status);

      if (status === 'granted') {
        // Get push token
        const token = await expoPushService.getPushToken();
        setPushToken(token);

        // Register device if user is authenticated
        if (token && currentUser?.userId && currentUser?.tenantId) {
          await expoPushService.registerDevice(
            token,
            currentUser.userId,
            currentUser.tenantId
          );
        }
      }

      // Load preferences
      await loadPreferences();

      // Set up listeners
      expoPushService.onNotificationReceived(handleNotificationReceived);
      expoPushService.onNotificationResponse(handleNotificationResponse);

      setIsInitialized(true);
    } catch (error) {
      console.error('Failed to initialize push notifications:', error);
    }
  }, [isInitialized, currentUser, loadPreferences, handleNotificationReceived, handleNotificationResponse]);

  // Request permissions
  const requestPermissions = useCallback(async (): Promise<PushPermissionStatus> => {
    const status = await expoPushService.requestPermissions();
    setPermissionStatus(status);

    if (status === 'granted') {
      const token = await expoPushService.getPushToken();
      setPushToken(token);

      if (token && currentUser?.userId && currentUser?.tenantId) {
        await expoPushService.registerDevice(
          token,
          currentUser.userId,
          currentUser.tenantId
        );
      }
    }

    return status;
  }, [currentUser]);

  // Clear all notifications
  const clearNotifications = useCallback(async () => {
    await expoPushService.clearAllNotifications();
    setRecentNotifications([]);
  }, []);

  // Set badge count
  const setBadgeCount = useCallback(async (count: number) => {
    await expoPushService.setBadgeCount(count);
  }, []);

  // Schedule daily schedule summary notification
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

  // Cancel schedule summary notifications
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
    if (isAuthenticated && currentUser && !isInitialized) {
      initialize();
    }
  }, [isAuthenticated, currentUser, isInitialized, initialize]);

  // Clean up on logout
  useEffect(() => {
    if (!isAuthenticated && isInitialized) {
      // Unregister device
      if (pushToken && currentUser?.userId) {
        expoPushService.unregisterDevice(pushToken, currentUser.userId);
      }
      setIsInitialized(false);
      setPushToken(null);
      setPreferences(null);
    }
  }, [isAuthenticated, isInitialized, pushToken, currentUser]);

  // Handle app state changes (refresh token on foreground)
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active' && isAuthenticated) {
        // Refresh badge count when app becomes active
        expoPushService.getBadgeCount().then(count => {
          console.log('Badge count:', count);
        });
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [isAuthenticated]);

  return {
    permissionStatus,
    pushToken,
    isInitialized,
    preferences,
    recentNotifications,
    requestPermissions,
    initialize,
    updatePreferences,
    clearNotifications,
    setBadgeCount,
    scheduleScheduleSummary,
    cancelScheduleSummary,
  };
};

export default usePushNotifications;
