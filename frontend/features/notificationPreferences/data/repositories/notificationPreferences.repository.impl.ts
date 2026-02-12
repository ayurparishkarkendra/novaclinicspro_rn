/**
 * Notification Preferences Repository Implementation
 * React Query hooks for notification preference operations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  listNotificationPreferencesApi,
  updateNotificationPreferenceApi,
  bulkUpdateNotificationPreferencesApi,
  NotificationPreferencesApiNotAvailableError,
} from '../datasources/notificationPreferences.api';
import {
  toPreferenceEntity,
  UpdateNotificationPreferenceRequest,
  BulkUpdateNotificationPreferencesRequest,
} from '../models/notificationPreferences.dtos';
import { NotificationPreference } from '../../domain/entities/notification-preference.entity';

const QUERY_KEYS = {
  preferences: (userId: string) => ['notification-preferences', userId] as const,
};

/**
 * Hook to fetch notification preferences
 */
export function useNotificationPreferencesQuery(userId: string, enabled: boolean = true) {
  return useQuery({
    queryKey: QUERY_KEYS.preferences(userId),
    queryFn: async (): Promise<NotificationPreference[]> => {
      try {
        const response = await listNotificationPreferencesApi(userId);
        return response.items.map(toPreferenceEntity);
      } catch (error) {
        if (error instanceof NotificationPreferencesApiNotAvailableError) {
          // Return empty array when API is not available
          return [];
        }
        throw error;
      }
    },
    enabled: enabled && !!userId,
    staleTime: 60000, // 1 minute
    retry: false,
  });
}

/**
 * Hook to update a single preference
 */
export function useUpdateNotificationPreferenceMutation(userId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({
      preferenceId,
      payload,
    }: {
      preferenceId: string;
      payload: UpdateNotificationPreferenceRequest;
    }) => {
      return updateNotificationPreferenceApi(userId, preferenceId, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.preferences(userId) });
    },
  });
}

/**
 * Hook to bulk update preferences
 */
export function useBulkUpdateNotificationPreferencesMutation(userId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (payload: BulkUpdateNotificationPreferencesRequest) => {
      return bulkUpdateNotificationPreferencesApi(userId, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.preferences(userId) });
    },
  });
}
