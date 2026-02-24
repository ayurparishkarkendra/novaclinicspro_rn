/**
 * Staff Dashboards Repository Implementation
 * React Query hooks for role-specific dashboards
 */

import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import {
  getDoctorDashboardApi,
  getTherapistDashboardApi,
  getFrontdeskDashboardApi,
} from '../datasources/staffDashboards.api';
import {
  DoctorDashboardResponse,
  TherapistDashboardResponse,
  FrontdeskDashboardResponse,
} from '../models/staffDashboards.dtos';

// ============================================
// QUERY KEYS
// ============================================

export const staffDashboardsKeys = {
  all: ['staffDashboards'] as const,
  doctor: (tenantId: string) => [...staffDashboardsKeys.all, 'doctor', tenantId] as const,
  therapist: (tenantId: string) => [...staffDashboardsKeys.all, 'therapist', tenantId] as const,
  frontdesk: (tenantId: string, params?: { doctor_id?: string; room_id?: string; status?: string }) =>
    [...staffDashboardsKeys.all, 'frontdesk', tenantId, params] as const,
};

// ============================================
// QUERY HOOKS
// ============================================

/**
 * Hook to get doctor dashboard data
 */
export const useDoctorDashboardQuery = (
  tenantId: string,
  params?: {
    date?: string;
  },
  options?: Omit<UseQueryOptions<DoctorDashboardResponse, Error>, 'queryKey' | 'queryFn'>
) => {
  // Ensure params is always an object for consistent query key
  const normalizedParams = params || {};
  
  console.log('[useDoctorDashboardQuery] Query params:', {
    tenantId,
    params: normalizedParams,
    queryKey: [...staffDashboardsKeys.doctor(tenantId), normalizedParams],
  });
  
  return useQuery<DoctorDashboardResponse, Error>({
    queryKey: [...staffDashboardsKeys.doctor(tenantId), normalizedParams],
    queryFn: () => {
      console.log('[useDoctorDashboardQuery] Executing query with params:', normalizedParams);
      return getDoctorDashboardApi(tenantId, normalizedParams);
    },
    enabled: !!tenantId,
    staleTime: 0, // Always refetch when query key changes
    ...options,
  });
};

/**
 * Hook to get therapist dashboard data
 */
export const useTherapistDashboardQuery = (
  tenantId: string,
  options?: Omit<UseQueryOptions<TherapistDashboardResponse, Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<TherapistDashboardResponse, Error>({
    queryKey: staffDashboardsKeys.therapist(tenantId),
    queryFn: () => getTherapistDashboardApi(tenantId),
    enabled: !!tenantId,
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
    ...options,
  });
};

/**
 * Hook to get frontdesk dashboard data
 */
export const useFrontdeskDashboardQuery = (
  tenantId: string,
  params?: { doctor_id?: string; room_id?: string; status?: string },
  options?: Omit<UseQueryOptions<FrontdeskDashboardResponse, Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<FrontdeskDashboardResponse, Error>({
    queryKey: staffDashboardsKeys.frontdesk(tenantId, params),
    queryFn: () => getFrontdeskDashboardApi(tenantId, params),
    enabled: !!tenantId,
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
    ...options,
  });
};
