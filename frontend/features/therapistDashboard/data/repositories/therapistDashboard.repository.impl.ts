/**
 * Therapist Dashboard Repository Implementation
 * React Query hooks for therapist dashboard data
 */

import { useQuery, useMutation, useQueryClient, UseQueryOptions, UseMutationOptions } from '@tanstack/react-query';
import {
  getTherapistWorklistApi,
  getTherapistLeaveRequestsApi,
  createTherapistLeaveRequestApi,
  cancelTherapistLeaveRequestApi,
  ApiNotImplementedError,
} from '../datasources/therapistDashboard.api';
import { TherapistDashboardResponse } from '../../../staffDashboards/data/models/staffDashboards.dtos';
import {
  StaffLeaveResponse,
  StaffLeaveCreate,
  PaginatedLeaveResponse,
} from '../../../staff/data/models/staff.dtos';
import {
  WorklistParams,
  WorklistPeriod,
  filterSessionsByPeriod,
  calculateKpiFromSessions,
  TherapistKpiSummary,
} from '../models/therapistDashboard.dtos';

// ============================================
// QUERY KEYS
// ============================================

export const therapistDashboardKeys = {
  all: ['therapistDashboard'] as const,
  
  // Worklist/Dashboard
  worklist: (tenantId: string, params?: WorklistParams) => 
    [...therapistDashboardKeys.all, 'worklist', tenantId, params] as const,
  
  // KPIs (derived from worklist)
  kpis: (tenantId: string, period?: string) => 
    [...therapistDashboardKeys.all, 'kpis', tenantId, period] as const,
  
  // Leave
  leaveRequests: (tenantId: string, staffId: string, params?: { status?: string }) =>
    [...therapistDashboardKeys.all, 'leaveRequests', tenantId, staffId, params] as const,
  
  // Unsupported features (keys for future use)
  documents: (tenantId: string, staffId: string) =>
    [...therapistDashboardKeys.all, 'documents', tenantId, staffId] as const,
  bankDetails: (tenantId: string, staffId: string) =>
    [...therapistDashboardKeys.all, 'bankDetails', tenantId, staffId] as const,
  payslips: (tenantId: string, staffId: string) =>
    [...therapistDashboardKeys.all, 'payslips', tenantId, staffId] as const,
  learning: (tenantId: string, staffId: string) =>
    [...therapistDashboardKeys.all, 'learning', tenantId, staffId] as const,
};

// ============================================
// WORKLIST QUERY HOOKS
// ============================================

/**
 * Hook to get therapist worklist/dashboard data
 */
export const useTherapistWorklistQuery = (
  tenantId: string,
  params?: WorklistParams,
  options?: Omit<UseQueryOptions<TherapistDashboardResponse, Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<TherapistDashboardResponse, Error>({
    queryKey: therapistDashboardKeys.worklist(tenantId, params),
    queryFn: () => getTherapistWorklistApi(tenantId, params),
    enabled: !!tenantId,
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Auto-refresh every minute
    ...options,
  });
};

/**
 * Hook to get filtered worklist by period
 * Uses the base worklist query but filters client-side
 */
export const useFilteredWorklistQuery = (
  tenantId: string,
  period: WorklistPeriod = 'today',
  options?: Omit<UseQueryOptions<TherapistDashboardResponse, Error>, 'queryKey' | 'queryFn' | 'select'>
) => {
  return useQuery<TherapistDashboardResponse, Error, TherapistDashboardResponse>({
    queryKey: therapistDashboardKeys.worklist(tenantId, { period }),
    queryFn: () => getTherapistWorklistApi(tenantId),
    enabled: !!tenantId,
    staleTime: 30 * 1000,
    select: (data) => {
      const filteredSessions = filterSessionsByPeriod(data.sessions, period);
      return {
        ...data,
        sessions: filteredSessions,
        total_count: filteredSessions.length,
      };
    },
    ...options,
  });
};

// ============================================
// KPI QUERY HOOKS
// ============================================

/**
 * Hook to get therapist KPIs
 * Derives KPIs from worklist data
 */
export const useTherapistKpisQuery = (
  tenantId: string,
  period: WorklistPeriod = 'today',
  options?: Omit<UseQueryOptions<TherapistKpiSummary, Error>, 'queryKey' | 'queryFn'>
) => {
  const periodLabels: Record<WorklistPeriod, string> = {
    today: 'Today',
    next_7_days: 'Next 7 Days',
    past_7_days: 'Last 7 Days',
  };

  return useQuery<TherapistKpiSummary, Error>({
    queryKey: therapistDashboardKeys.kpis(tenantId, period),
    queryFn: async () => {
      const data = await getTherapistWorklistApi(tenantId);
      const filteredSessions = filterSessionsByPeriod(data.sessions, period);
      return calculateKpiFromSessions(filteredSessions, periodLabels[period]);
    },
    enabled: !!tenantId,
    staleTime: 30 * 1000,
    ...options,
  });
};

// ============================================
// LEAVE MANAGEMENT HOOKS
// ============================================

/**
 * Hook to get therapist's leave requests
 */
export const useTherapistLeaveRequestsQuery = (
  tenantId: string,
  staffId: string,
  params?: { status?: string; skip?: number; limit?: number },
  options?: Omit<UseQueryOptions<PaginatedLeaveResponse, Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<PaginatedLeaveResponse, Error>({
    queryKey: therapistDashboardKeys.leaveRequests(tenantId, staffId, params),
    queryFn: () => getTherapistLeaveRequestsApi(tenantId, staffId, params),
    enabled: !!tenantId && !!staffId,
    staleTime: 60 * 1000, // 1 minute
    ...options,
  });
};

/**
 * Hook to create a leave request
 */
export const useCreateLeaveRequestMutation = (
  tenantId: string,
  staffId: string,
  options?: Omit<UseMutationOptions<StaffLeaveResponse, Error, StaffLeaveCreate>, 'mutationFn'>
) => {
  const queryClient = useQueryClient();
  
  return useMutation<StaffLeaveResponse, Error, StaffLeaveCreate>({
    mutationFn: (payload) => createTherapistLeaveRequestApi(tenantId, staffId, payload),
    onSuccess: () => {
      // Invalidate leave queries to refetch
      queryClient.invalidateQueries({
        queryKey: therapistDashboardKeys.leaveRequests(tenantId, staffId),
      });
    },
    ...options,
  });
};

/**
 * Hook to cancel a leave request
 */
export const useCancelLeaveRequestMutation = (
  tenantId: string,
  staffId: string,
  options?: Omit<UseMutationOptions<StaffLeaveResponse, Error, string>, 'mutationFn'>
) => {
  const queryClient = useQueryClient();
  
  return useMutation<StaffLeaveResponse, Error, string>({
    mutationFn: (leaveId) => cancelTherapistLeaveRequestApi(tenantId, leaveId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: therapistDashboardKeys.leaveRequests(tenantId, staffId),
      });
    },
    ...options,
  });
};

// ============================================
// STUB HOOKS FOR UNSUPPORTED FEATURES
// These return immediate error state for UI handling
// ============================================

/**
 * Hook stub for documents (NOT SUPPORTED)
 * Returns error state immediately for UI to show disabled state
 */
export const useTherapistDocumentsQuery = (
  tenantId: string,
  staffId: string
) => {
  return useQuery({
    queryKey: therapistDashboardKeys.documents(tenantId, staffId),
    queryFn: () => Promise.reject(new ApiNotImplementedError('Employment documents')),
    enabled: false, // Never actually fetch
    retry: false,
  });
};

/**
 * Hook stub for bank details (NOT SUPPORTED)
 */
export const useTherapistBankDetailsQuery = (
  tenantId: string,
  staffId: string
) => {
  return useQuery({
    queryKey: therapistDashboardKeys.bankDetails(tenantId, staffId),
    queryFn: () => Promise.reject(new ApiNotImplementedError('Bank details')),
    enabled: false,
    retry: false,
  });
};

/**
 * Hook stub for payslips (NOT SUPPORTED)
 */
export const useTherapistPayslipsQuery = (
  tenantId: string,
  staffId: string
) => {
  return useQuery({
    queryKey: therapistDashboardKeys.payslips(tenantId, staffId),
    queryFn: () => Promise.reject(new ApiNotImplementedError('Salary slips')),
    enabled: false,
    retry: false,
  });
};

/**
 * Hook stub for learning items (NOT SUPPORTED)
 */
export const useTherapistLearningItemsQuery = (
  tenantId: string,
  staffId: string
) => {
  return useQuery({
    queryKey: therapistDashboardKeys.learning(tenantId, staffId),
    queryFn: () => Promise.reject(new ApiNotImplementedError('Learning content')),
    enabled: false,
    retry: false,
  });
};
