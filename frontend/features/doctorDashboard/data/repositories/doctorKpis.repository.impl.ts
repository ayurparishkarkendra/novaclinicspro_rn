/**
 * Doctor KPIs Repository Implementation
 * React Query hooks for doctor KPI data
 */

import { useQuery, UseQueryOptions, useQueryClient } from '@tanstack/react-query';
import { getDoctorKpisApi } from '../datasources/doctorKpis.api';
import type {
  DoctorKpiResponseDTO,
  DoctorKpiQueryParams,
  KPIPeriodType,
} from '../models/doctorKpis.dtos';

// ============================================
// QUERY KEYS
// ============================================

export const doctorKpiKeys = {
  all: ['doctorKpis'] as const,
  
  kpis: (tenantId: string, staffId: string, params: DoctorKpiQueryParams) =>
    [...doctorKpiKeys.all, 'kpis', tenantId, staffId, params] as const,
};

// ============================================
// KPI QUERY HOOK
// ============================================

/**
 * Hook to get doctor KPI metrics
 * Uses backend KPI endpoint directly - no client-side computation
 */
export const useDoctorKpisQuery = (
  tenantId: string,
  staffId: string,
  params: {
    period: KPIPeriodType;
    fromDate?: string;
    toDate?: string;
  },
  options?: Omit<UseQueryOptions<DoctorKpiResponseDTO, Error>, 'queryKey' | 'queryFn'>
) => {
  const queryParams: DoctorKpiQueryParams = {
    period: params.period,
    from_date: params.fromDate,
    to_date: params.toDate,
  };

  return useQuery<DoctorKpiResponseDTO, Error>({
    queryKey: doctorKpiKeys.kpis(tenantId, staffId, queryParams),
    queryFn: () => getDoctorKpisApi(tenantId, staffId, queryParams),
    enabled: !!tenantId && !!staffId,
    staleTime: 5 * 60 * 1000, // 5 minutes - aligns with backend cache
    retry: (failureCount, error) => {
      // Don't retry on 4xx errors
      const status = (error as any)?.response?.status;
      if (status && status >= 400 && status < 500) {
        return false;
      }
      return failureCount < 2;
    },
    ...options,
  });
};

/**
 * Hook to prefetch KPI data for a different period
 * Useful when user is about to change periods
 */
export const usePrefetchDoctorKpis = () => {
  const queryClient = useQueryClient();

  return (
    tenantId: string,
    staffId: string,
    params: {
      period: KPIPeriodType;
      fromDate?: string;
      toDate?: string;
    }
  ) => {
    const queryParams: DoctorKpiQueryParams = {
      period: params.period,
      from_date: params.fromDate,
      to_date: params.toDate,
    };

    return queryClient.prefetchQuery({
      queryKey: doctorKpiKeys.kpis(tenantId, staffId, queryParams),
      queryFn: () => getDoctorKpisApi(tenantId, staffId, queryParams),
      staleTime: 5 * 60 * 1000,
    });
  };
};

/**
 * Hook to invalidate all doctor KPI queries
 * Call this after actions that might affect KPIs (e.g., completing an appointment)
 */
export const useInvalidateDoctorKpis = () => {
  const queryClient = useQueryClient();

  return (tenantId?: string, staffId?: string) => {
    if (tenantId && staffId) {
      // Invalidate specific doctor's KPIs
      queryClient.invalidateQueries({
        queryKey: [...doctorKpiKeys.all, 'kpis', tenantId, staffId],
      });
    } else {
      // Invalidate all doctor KPIs
      queryClient.invalidateQueries({
        queryKey: doctorKpiKeys.all,
      });
    }
  };
};
