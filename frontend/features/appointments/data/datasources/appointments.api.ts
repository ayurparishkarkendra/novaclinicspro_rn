/**
 * Appointments API
 * Handles all HTTP calls for appointment management
 *
 * IMPORTANT: All paths must start with /api/v1/...
 */

import { axiosClient } from '../../../../core/api/axiosClient';
import {
  AppointmentCreate,
  AppointmentUpdate,
  AppointmentResponse,
  AppointmentReschedule,
  AppointmentRescheduleResponse,
  ListAppointmentsParams,
  PaginatedAppointmentsResponse,
  AppointmentsListResponse,
  SearchAppointmentsParams,
  AvailableSlotsRequest,
  AvailableSlotsResponse,
  ValidateAppointmentRequest,
  ValidationResponse,
  TherapyPlanRequest,
  TherapyPlanResponse,
  BulkCreateRequest,
  BulkCreateResponse,
  AvailableTherapist,
} from '../models/appointments.dtos';

/**
 * List appointments for a tenant
 * GET /api/v1/clinic/{tenant_id}/appointments
 */
export const listAppointmentsApi = async (
  tenantId: string,
  params?: ListAppointmentsParams
): Promise<PaginatedAppointmentsResponse> => {
  const response = await axiosClient.get(
    `/api/v1/clinic/${tenantId}/appointments`,
    { params }
  );
  return response.data;
};

/**
 * Get a single appointment
 * GET /api/v1/clinic/{tenant_id}/appointments/{appointment_id}
 */
export const getAppointmentApi = async (
  tenantId: string,
  appointmentId: string
): Promise<AppointmentResponse> => {
  const response = await axiosClient.get(
    `/api/v1/clinic/${tenantId}/appointments/${appointmentId}`
  );
  return response.data;
};

/**
 * Create an appointment
 * POST /api/v1/clinic/{tenant_id}/appointments
 */
export const createAppointmentApi = async (
  tenantId: string,
  payload: AppointmentCreate
): Promise<AppointmentResponse> => {
  const response = await axiosClient.post(
    `/api/v1/clinic/${tenantId}/appointments`,
    payload
  );
  return response.data;
};

/**
 * Update an appointment
 * PATCH /api/v1/clinic/{tenant_id}/appointments/{appointment_id}
 */
export const updateAppointmentApi = async (
  tenantId: string,
  appointmentId: string,
  payload: AppointmentUpdate
): Promise<AppointmentResponse> => {
  const response = await axiosClient.patch(
    `/api/v1/clinic/${tenantId}/appointments/${appointmentId}`,
    payload
  );
  return response.data;
};

/**
 * Delete an appointment
 * DELETE /api/v1/clinic/{tenant_id}/appointments/{appointment_id}
 */
export const deleteAppointmentApi = async (
  tenantId: string,
  appointmentId: string
): Promise<void> => {
  await axiosClient.delete(
    `/api/v1/clinic/${tenantId}/appointments/${appointmentId}`
  );
};

/**
 * Cancel an appointment
 * PATCH /api/v1/clinic/{tenant_id}/appointments/{appointment_id}/cancel
 */
export const cancelAppointmentApi = async (
  tenantId: string,
  appointmentId: string
): Promise<AppointmentResponse> => {
  const response = await axiosClient.patch(
    `/api/v1/clinic/${tenantId}/appointments/${appointmentId}/cancel`
  );
  return response.data;
};

/**
 * Reschedule an appointment
 * POST /api/v1/clinic/{tenant_id}/appointments/{appointment_id}/reschedule
 */
export const rescheduleAppointmentApi = async (
  tenantId: string,
  appointmentId: string,
  payload: AppointmentReschedule
): Promise<AppointmentRescheduleResponse> => {
  const response = await axiosClient.post(
    `/api/v1/clinic/${tenantId}/appointments/${appointmentId}/reschedule`,
    payload
  );
  return response.data;
};
