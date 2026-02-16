/**
 * Feedback Repository Implementation
 * React Query hooks for feedback data management
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { UseQueryOptions, UseMutationOptions } from '@tanstack/react-query';
import {
  getFeedbackFormApi,
  submitFeedbackApi,
  getStaffKpisApi,
  getStaffFeedbackListApi,
  getClinicFeedbackSummaryApi,
} from '../datasources/feedback.api';
import type {
  FeedbackFormData,
  FeedbackSubmitPayload,
  FeedbackSubmitResponse,
  StaffKPIQueryParams,
  StaffKPIResponse,
  StaffFeedbackListQueryParams,
  StaffFeedbackListResponse,
  ClinicFeedbackSummaryQueryParams,
  ClinicFeedbackSummaryResponse,
  KPIPeriod,
  StaffType,
} from '../models/feedback.dtos';

// Query keys for cache management
export const feedbackQueryKeys = {
  all: ['feedback'] as const,
  form: (token: string) => [...feedbackQueryKeys.all, 'form', token] as const,
  staffKpis: (tenantId: string, staffId: string, params: StaffKPIQueryParams) =>
    [...feedbackQueryKeys.all, 'staff-kpis', tenantId, staffId, params] as const,
  staffFeedbackList: (tenantId: string, staffId: string, params: StaffFeedbackListQueryParams) =>
    [...feedbackQueryKeys.all, 'staff-feedback', tenantId, staffId, params] as const,
  clinicSummary: (tenantId: string, params?: ClinicFeedbackSummaryQueryParams) =>
    [...feedbackQueryKeys.all, 'clinic-summary', tenantId, params] as const,
};

// ==================== Patient Feedback Form Hooks ====================

/**
 * Hook to get feedback form data for a token
 */
export function useFeedbackFormQuery(
  token: string,
  options?: Omit<UseQueryOptions<FeedbackFormData, Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: feedbackQueryKeys.form(token),
    queryFn: () => getFeedbackFormApi(token),
    enabled: !!token,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1, // Only retry once for invalid tokens
    ...options,
  });
}

/**
 * Hook to submit feedback
 */
export function useSubmitFeedbackMutation(
  token: string,
  options?: UseMutationOptions<FeedbackSubmitResponse, Error, FeedbackSubmitPayload>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: FeedbackSubmitPayload) => submitFeedbackApi(token, payload),
    onSuccess: () => {
      // Invalidate the form query after successful submission
      queryClient.invalidateQueries({ queryKey: feedbackQueryKeys.form(token) });
    },
    ...options,
  });
}

// ==================== Staff KPIs Hooks ====================

/**
 * Hook to get staff KPI metrics
 */
export function useStaffKpisQuery(
  tenantId: string,
  staffId: string,
  params: {
    period: KPIPeriod;
    staffType: StaffType;
    fromDate?: string;
    toDate?: string;
  },
  options?: Omit<UseQueryOptions<StaffKPIResponse, Error>, 'queryKey' | 'queryFn'>
) {
  const queryParams: StaffKPIQueryParams = {
    period: params.period,
    staff_type: params.staffType,
    from_date: params.fromDate,
    to_date: params.toDate,
  };

  return useQuery({
    queryKey: feedbackQueryKeys.staffKpis(tenantId, staffId, queryParams),
    queryFn: () => getStaffKpisApi(tenantId, staffId, queryParams),
    enabled: !!tenantId && !!staffId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    ...options,
  });
}

/**
 * Hook to get staff feedback list with pagination
 */
export function useStaffFeedbackListQuery(
  tenantId: string,
  staffId: string,
  params: {
    staffType: StaffType;
    fromDate?: string;
    toDate?: string;
    limit?: number;
    offset?: number;
  },
  options?: Omit<UseQueryOptions<StaffFeedbackListResponse, Error>, 'queryKey' | 'queryFn'>
) {
  const queryParams: StaffFeedbackListQueryParams = {
    staff_type: params.staffType,
    from_date: params.fromDate,
    to_date: params.toDate,
    limit: params.limit ?? 20,
    offset: params.offset ?? 0,
  };

  return useQuery({
    queryKey: feedbackQueryKeys.staffFeedbackList(tenantId, staffId, queryParams),
    queryFn: () => getStaffFeedbackListApi(tenantId, staffId, queryParams),
    enabled: !!tenantId && !!staffId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    ...options,
  });
}

// ==================== Clinic Summary Hooks ====================

/**
 * Hook to get clinic-wide feedback summary
 */
export function useClinicFeedbackSummaryQuery(
  tenantId: string,
  params?: {
    fromDate?: string;
    toDate?: string;
  },
  options?: Omit<UseQueryOptions<ClinicFeedbackSummaryResponse, Error>, 'queryKey' | 'queryFn'>
) {
  const queryParams: ClinicFeedbackSummaryQueryParams | undefined = params
    ? {
        from_date: params.fromDate,
        to_date: params.toDate,
      }
    : undefined;

  return useQuery({
    queryKey: feedbackQueryKeys.clinicSummary(tenantId, queryParams),
    queryFn: () => getClinicFeedbackSummaryApi(tenantId, queryParams),
    enabled: !!tenantId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
}
