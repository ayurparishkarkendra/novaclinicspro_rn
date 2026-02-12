/**
 * Appointments Repository Interface
 * Defines the contract for appointment data operations
 */

import {
  AppointmentCreate,
  AppointmentUpdate,
  AppointmentResponse,
  AppointmentReschedule,
  AppointmentRescheduleResponse,
  ListAppointmentsParams,
  PaginatedAppointmentsResponse,
} from '../../data/models/appointments.dtos';

/**
 * Appointments repository interface
 */
export interface IAppointmentsRepository {
  listAppointments(
    tenantId: string,
    params?: ListAppointmentsParams
  ): Promise<PaginatedAppointmentsResponse>;
  getAppointment(tenantId: string, appointmentId: string): Promise<AppointmentResponse>;
  createAppointment(tenantId: string, data: AppointmentCreate): Promise<AppointmentResponse>;
  updateAppointment(
    tenantId: string,
    appointmentId: string,
    data: AppointmentUpdate
  ): Promise<AppointmentResponse>;
  deleteAppointment(tenantId: string, appointmentId: string): Promise<void>;
  cancelAppointment(tenantId: string, appointmentId: string): Promise<AppointmentResponse>;
  rescheduleAppointment(
    tenantId: string,
    appointmentId: string,
    data: AppointmentReschedule
  ): Promise<AppointmentRescheduleResponse>;
}
