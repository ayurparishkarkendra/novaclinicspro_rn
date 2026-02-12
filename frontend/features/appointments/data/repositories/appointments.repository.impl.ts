/**
 * Appointments Repository Implementation
 * React Query hooks for appointment management
 */

import { useQuery, useMutation, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import {
  listAppointmentsApi,
  getAppointmentApi,
  createAppointmentApi,
  updateAppointmentApi,
  deleteAppointmentApi,
  cancelAppointmentApi,
  rescheduleAppointmentApi,
} from '../datasources/appointments.api';
import {
  AppointmentCreate,
  AppointmentUpdate,
  AppointmentResponse,
  AppointmentReschedule,
  AppointmentRescheduleResponse,
  ListAppointmentsParams,
  PaginatedAppointmentsResponse,
} from '../models/appointments.dtos';

// ============================================
// QUERY KEYS
// ============================================

export const appointmentsKeys = {
  all: ['appointments'] as const,
  lists: () => [...appointmentsKeys.all, 'list'] as const,
  list: (tenantId: string, params?: ListAppointmentsParams) =>
    [...appointmentsKeys.lists(), tenantId, params] as const,
  details: () => [...appointmentsKeys.all, 'detail'] as const,
  detail: (tenantId: string, appointmentId: string) =>
    [...appointmentsKeys.details(), tenantId, appointmentId] as const,
};

// ============================================
// QUERY HOOKS
// ============================================

/**
 * Hook to list appointments for a tenant
 */
export const useAppointmentsListQuery = (
  tenantId: string,
  params?: ListAppointmentsParams,
  options?: Omit<UseQueryOptions<PaginatedAppointmentsResponse, Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<PaginatedAppointmentsResponse, Error>({
    queryKey: appointmentsKeys.list(tenantId, params),
    queryFn: () => listAppointmentsApi(tenantId, params),
    enabled: !!tenantId,
    ...options,
  });
};

/**
 * Hook to get a single appointment
 */
export const useAppointmentDetailQuery = (
  tenantId: string,
  appointmentId: string,
  options?: Omit<UseQueryOptions<AppointmentResponse, Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<AppointmentResponse, Error>({
    queryKey: appointmentsKeys.detail(tenantId, appointmentId),
    queryFn: () => getAppointmentApi(tenantId, appointmentId),
    enabled: !!tenantId && !!appointmentId,
    ...options,
  });
};

// ============================================
// MUTATION HOOKS
// ============================================

/**
 * Hook to create an appointment
 */
export const useCreateAppointmentMutation = (tenantId: string) => {
  const queryClient = useQueryClient();

  return useMutation<AppointmentResponse, Error, AppointmentCreate>({
    mutationFn: (payload) => createAppointmentApi(tenantId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: appointmentsKeys.lists() });
    },
  });
};

/**
 * Hook to update an appointment
 */
export const useUpdateAppointmentMutation = (tenantId: string, appointmentId: string) => {
  const queryClient = useQueryClient();

  return useMutation<AppointmentResponse, Error, AppointmentUpdate>({
    mutationFn: (payload) => updateAppointmentApi(tenantId, appointmentId, payload),
    onSuccess: (data) => {
      queryClient.setQueryData(appointmentsKeys.detail(tenantId, appointmentId), data);
      queryClient.invalidateQueries({ queryKey: appointmentsKeys.lists() });
    },
  });
};

/**
 * Hook to delete an appointment
 */
export const useDeleteAppointmentMutation = (tenantId: string) => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: (appointmentId) => deleteAppointmentApi(tenantId, appointmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: appointmentsKeys.lists() });
    },
  });
};

/**
 * Hook to cancel an appointment
 */
export const useCancelAppointmentMutation = (tenantId: string) => {
  const queryClient = useQueryClient();

  return useMutation<AppointmentResponse, Error, string>({
    mutationFn: (appointmentId) => cancelAppointmentApi(tenantId, appointmentId),
    onSuccess: (data) => {
      queryClient.setQueryData(appointmentsKeys.detail(tenantId, data.id), data);
      queryClient.invalidateQueries({ queryKey: appointmentsKeys.lists() });
    },
  });
};

/**
 * Hook to reschedule an appointment
 */
export const useRescheduleAppointmentMutation = (tenantId: string, appointmentId: string) => {
  const queryClient = useQueryClient();

  return useMutation<AppointmentRescheduleResponse, Error, AppointmentReschedule>({
    mutationFn: (payload) => rescheduleAppointmentApi(tenantId, appointmentId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: appointmentsKeys.detail(tenantId, appointmentId) });
      queryClient.invalidateQueries({ queryKey: appointmentsKeys.lists() });
    },
  });
};
