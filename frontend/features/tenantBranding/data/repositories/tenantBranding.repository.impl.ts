/**
 * Tenant Branding Repository Implementation
 * React Query hooks for tenant branding operations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getTenantBrandingApi,
  updateTenantBrandingApi,
  TenantBrandingApiNotAvailableError,
} from '../datasources/tenantBranding.api';
import {
  toBrandingEntity,
  UpdateTenantBrandingRequest,
  DEFAULT_BRANDING,
} from '../models/tenantBranding.dtos';
import { TenantBranding } from '../../domain/entities/tenant-branding.entity';

const QUERY_KEYS = {
  branding: (tenantId: string) => ['tenant-branding', tenantId] as const,
};

export interface TenantBrandingResult {
  branding: TenantBranding;
  isApiAvailable: boolean;
}

/**
 * Hook to fetch tenant branding
 */
export function useTenantBrandingQuery(tenantId: string, enabled: boolean = true) {
  return useQuery({
    queryKey: QUERY_KEYS.branding(tenantId),
    queryFn: async (): Promise<TenantBrandingResult> => {
      try {
        const response = await getTenantBrandingApi(tenantId);
        return {
          branding: toBrandingEntity(response.branding),
          isApiAvailable: true,
        };
      } catch (error) {
        if (error instanceof TenantBrandingApiNotAvailableError) {
          // Return default branding when API is not available
          return {
            branding: toBrandingEntity({ ...DEFAULT_BRANDING, tenantId }),
            isApiAvailable: false,
          };
        }
        throw error;
      }
    },
    enabled: enabled && !!tenantId,
    staleTime: 300000, // 5 minutes
    retry: false,
  });
}

/**
 * Hook to update tenant branding
 */
export function useUpdateTenantBrandingMutation(tenantId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (payload: UpdateTenantBrandingRequest) => {
      return updateTenantBrandingApi(tenantId, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.branding(tenantId) });
    },
  });
}
