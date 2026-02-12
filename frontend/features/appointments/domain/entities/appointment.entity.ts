/**
 * Appointment Entity
 * Domain model for appointments
 */

import { AppointmentStatus } from '../../data/models/appointments.dtos';

/**
 * Appointment entity representing a clinic appointment
 */
export interface Appointment {
  id: string;
  tenantId: string;
  clientId: string;
  staffId: string | null;
  roomId: string | null;
  treatmentId: string | null;
  appointmentStart: Date;
  appointmentEnd: Date | null;
  status: AppointmentStatus;
  notes: string | null;
  isActive: boolean;
  createdAt: Date;
  appointmentType: string | null;
  seriesId: string | null;
}

/**
 * Appointment summary for list views
 */
export interface AppointmentSummary {
  id: string;
  clientId: string;
  clientName: string;
  staffName: string | null;
  appointmentStart: Date;
  status: AppointmentStatus;
  treatmentName: string | null;
}
