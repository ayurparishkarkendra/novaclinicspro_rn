/**
 * Global Settings Repository Implementation
 * React Query hooks for global settings operations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getGlobalSettingsApi,
  updateGlobalSettingsApi,
  getTenantSettingsApi,
  updateTenantSettingsApi,
  GlobalSettingsApiNotAvailableError,
} from '../datasources/globalSettings.api';
import {
  toGlobalSettingsEntity,
  toTenantSettingsEntity,
  UpdateGlobalSettingsRequest,
  UpdateTenantSettingsRequest,
  DEFAULT_GLOBAL_SETTINGS,
} from '../models/globalSettings.dtos';
import { GlobalSettings } from '../../domain/entities/global-settings.entity';
import { TenantSettings } from '../../domain/entities/tenant-settings.entity';

const QUERY_KEYS = {
  globalSettings: ['global-settings'] as const,
  tenantSettings: (tenantId: string) => ['tenant-settings', tenantId] as const,
};

export interface GlobalSettingsResult {
  settings: GlobalSettings;
  isApiAvailable: boolean;
}

export interface TenantSettingsResult {
  settings: TenantSettings;
  isApiAvailable: boolean;
}

/**
 * Hook to fetch global settings
 */
export function useGlobalSettingsQuery(enabled: boolean = true) {
  return useQuery({
    queryKey: QUERY_KEYS.globalSettings,
    queryFn: async (): Promise<GlobalSettingsResult> => {
      try {
        const response = await getGlobalSettingsApi();
        return {
          settings: toGlobalSettingsEntity(response.settings),
          isApiAvailable: true,
        };
      } catch (error) {
        if (error instanceof GlobalSettingsApiNotAvailableError) {
          return {
            settings: toGlobalSettingsEntity(DEFAULT_GLOBAL_SETTINGS),
            isApiAvailable: false,
          };
        }
        throw error;
      }
    },
    enabled,
    staleTime: 300000, // 5 minutes
    retry: false,
  });
}

/**
 * Hook to update global settings
 */
export function useUpdateGlobalSettingsMutation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (payload: UpdateGlobalSettingsRequest) => {
      return updateGlobalSettingsApi(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.globalSettings });
    },
  });
}

/**
 * Hook to fetch tenant settings
 */
export function useTenantSettingsQuery(tenantId: string, enabled: boolean = true) {
  return useQuery({
    queryKey: QUERY_KEYS.tenantSettings(tenantId),
    queryFn: async (): Promise<TenantSettingsResult> => {
      try {
        const response = await getTenantSettingsApi(tenantId);
        return {
          settings: toTenantSettingsEntity(response.settings),
          isApiAvailable: true,
        };
      } catch (error) {
        if (error instanceof GlobalSettingsApiNotAvailableError) {
          return {
            settings: {
              tenantId,
              featureOverrides: {},
              complianceOverrides: {},
              defaultOverrides: {},
              updatedAt: new Date(),
              updatedBy: 'system',
            },
            isApiAvailable: false,
          };
        }
        throw error;
      }
    },
    enabled: enabled && !!tenantId,
    staleTime: 300000,
    retry: false,
  });
}

/**
 * Hook to update tenant settings
 */
export function useUpdateTenantSettingsMutation(tenantId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (payload: UpdateTenantSettingsRequest) => {
      return updateTenantSettingsApi(tenantId, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tenantSettings(tenantId) });
    },
  });
}
