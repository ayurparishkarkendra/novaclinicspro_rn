/**
 * Notifications Repository Implementation
 * React Query hooks for notification operations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  listNotificationsApi,
  getNotificationApi,
  markNotificationReadApi,
  markAllNotificationsReadApi,
  NotificationApiNotAvailableError,
} from '../datasources/notifications.api';
import {
  ListNotificationsParams,
  toNotificationEntity,
} from '../models/notifications.dtos';
import { Notification } from '../../domain/entities/notification.entity';

const QUERY_KEYS = {
  notifications: (tenantId: string) => ['notifications', tenantId] as const,
  notificationDetail: (tenantId: string, id: string) => ['notifications', tenantId, id] as const,
  unreadCount: (tenantId: string) => ['notifications', tenantId, 'unread-count'] as const,
};

export interface NotificationsListResult {
  notifications: Notification[];
  total: number;
  page: number;
  pageSize: number;
  unreadCount: number;
}

/**
 * Hook to fetch notifications list
 */
export function useNotificationsListQuery(
  tenantId: string,
  params: ListNotificationsParams = {},
  enabled: boolean = true
) {
  return useQuery({
    queryKey: [...QUERY_KEYS.notifications(tenantId), params],
    queryFn: async (): Promise<NotificationsListResult> => {
      try {
        const response = await listNotificationsApi(tenantId, params);
        return {
          notifications: response.items.map(toNotificationEntity),
          total: response.total,
          page: response.page,
          pageSize: response.page_size,
          unreadCount: response.unread_count,
        };
      } catch (error) {
        if (error instanceof NotificationApiNotAvailableError) {
          // Return empty result when API is not available
          return {
            notifications: [],
            total: 0,
            page: 1,
            pageSize: 20,
            unreadCount: 0,
          };
        }
        throw error;
      }
    },
    enabled: enabled && !!tenantId,
    staleTime: 30000, // 30 seconds
    retry: false, // Don't retry if API doesn't exist
  });
}

/**
 * Hook to fetch a single notification
 */
export function useNotificationDetailQuery(
  tenantId: string,
  notificationId: string,
  enabled: boolean = true
) {
  return useQuery({
    queryKey: QUERY_KEYS.notificationDetail(tenantId, notificationId),
    queryFn: async (): Promise<Notification | null> => {
      try {
        const response = await getNotificationApi(tenantId, notificationId);
        return toNotificationEntity(response);
      } catch (error) {
        if (error instanceof NotificationApiNotAvailableError) {
          return null;
        }
        throw error;
      }
    },
    enabled: enabled && !!tenantId && !!notificationId,
    retry: false,
  });
}

/**
 * Hook to mark a notification as read
 */
export function useMarkNotificationReadMutation(tenantId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (notificationId: string) => {
      return markNotificationReadApi(tenantId, notificationId);
    },
    onSuccess: () => {
      // Invalidate notifications list to refresh unread count
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.notifications(tenantId) });
    },
  });
}

/**
 * Hook to mark all notifications as read
 */
export function useMarkAllNotificationsReadMutation(tenantId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (category?: string) => {
      return markAllNotificationsReadApi(tenantId, category);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.notifications(tenantId) });
    },
  });
}

/**
 * Hook to get unread notification count
 * Used for badge display on dashboards
 */
export function useUnreadNotificationCount(tenantId: string) {
  const { data } = useNotificationsListQuery(tenantId, { unread_only: true, page_size: 1 });
  return data?.unreadCount ?? 0;
}
