/**
 * Localization Repository Implementation
 * React Query hooks for localization operations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  listSupportedLocalesApi,
  getUserLocaleApi,
  updateUserLocaleApi,
  getTenantDefaultLocaleApi,
  updateTenantDefaultLocaleApi,
  LocalizationApiNotAvailableError,
} from '../datasources/localization.api';
import {
  toLocaleEntity,
  UpdateUserLocaleRequest,
  UpdateTenantLocaleRequest,
  DEFAULT_SUPPORTED_LOCALES,
} from '../models/localization.dtos';
import { Locale } from '../../domain/entities/locale.entity';

const QUERY_KEYS = {
  supportedLocales: ['localization', 'supported-locales'] as const,
  userLocale: (userId: string) => ['localization', 'user', userId] as const,
  tenantLocale: (tenantId: string) => ['localization', 'tenant', tenantId] as const,
};

export interface SupportedLocalesResult {
  locales: Locale[];
  defaultLocale: string;
  isApiAvailable: boolean;
}

/**
 * Hook to fetch supported locales
 */
export function useSupportedLocalesQuery() {
  return useQuery({
    queryKey: QUERY_KEYS.supportedLocales,
    queryFn: async (): Promise<SupportedLocalesResult> => {
      try {
        const response = await listSupportedLocalesApi();
        return {
          locales: response.locales.map(toLocaleEntity),
          defaultLocale: response.defaultLocale,
          isApiAvailable: true,
        };
      } catch (error) {
        if (error instanceof LocalizationApiNotAvailableError) {
          // Return default locales when API is not available
          return {
            locales: DEFAULT_SUPPORTED_LOCALES.map(toLocaleEntity),
            defaultLocale: 'en-US',
            isApiAvailable: false,
          };
        }
        throw error;
      }
    },
    staleTime: 300000, // 5 minutes
    retry: false,
  });
}

/**
 * Hook to fetch user's locale preference
 */
export function useUserLocaleQuery(userId: string, enabled: boolean = true) {
  return useQuery({
    queryKey: QUERY_KEYS.userLocale(userId),
    queryFn: async () => {
      try {
        return await getUserLocaleApi(userId);
      } catch (error) {
        if (error instanceof LocalizationApiNotAvailableError) {
          return { userId, localeCode: 'en-US', updatedAt: new Date().toISOString() };
        }
        throw error;
      }
    },
    enabled: enabled && !!userId,
    retry: false,
  });
}

/**
 * Hook to update user's locale preference
 */
export function useUpdateUserLocaleMutation(userId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (payload: UpdateUserLocaleRequest) => {
      return updateUserLocaleApi(userId, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.userLocale(userId) });
    },
  });
}

/**
 * Hook to fetch tenant's default locale
 */
export function useTenantDefaultLocaleQuery(tenantId: string, enabled: boolean = true) {
  return useQuery({
    queryKey: QUERY_KEYS.tenantLocale(tenantId),
    queryFn: async () => {
      try {
        return await getTenantDefaultLocaleApi(tenantId);
      } catch (error) {
        if (error instanceof LocalizationApiNotAvailableError) {
          return {
            tenantId,
            defaultLocaleCode: 'en-US',
            supportedLocales: ['en-US', 'en-IN', 'hi-IN'],
            updatedAt: new Date().toISOString(),
          };
        }
        throw error;
      }
    },
    enabled: enabled && !!tenantId,
    retry: false,
  });
}

/**
 * Hook to update tenant's default locale
 */
export function useUpdateTenantDefaultLocaleMutation(tenantId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (payload: UpdateTenantLocaleRequest) => {
      return updateTenantDefaultLocaleApi(tenantId, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tenantLocale(tenantId) });
    },
  });
}
