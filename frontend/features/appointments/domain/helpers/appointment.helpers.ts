/**
 * Appointment Domain Helpers
 * 
 * CLEAN ARCHITECTURE: Domain layer utilities for appointment business logic.
 * Used by: UI components, domain services, presentation layer.
 * 
 * These helpers inspect appointment data and extract meaningful information
 * without performing formatting or messaging operations.
 */

import { AppointmentResponse } from '../../data/models/appointments.dtos';

// ============================================
// APPOINTMENT TYPE INSPECTION
// ============================================

/**
 * Check if appointment is a therapy appointment (has therapists)
 * @param appointment - The appointment to check
 * @returns true if appointment has therapist_ids
 */
export const isTherapyAppointment = (appointment: AppointmentResponse | null): boolean => {
  if (!appointment) return false;
  return appointment.therapist_ids && appointment.therapist_ids.length > 0;
};

/**
 * Check if appointment is a doctor consultation (has doctor, no therapists)
 * @param appointment - The appointment to check
 * @returns true if appointment has doctor_id but no therapist_ids
 */
export const isDoctorAppointment = (appointment: AppointmentResponse | null): boolean => {
  if (!appointment) return false;
  return !!appointment.doctor_id && (!appointment.therapist_ids || appointment.therapist_ids.length === 0);
};

/**
 * Check if appointment has multiple therapists
 * @param appointment - The appointment to check
 * @returns true if appointment has more than one therapist
 */
export const hasMultipleTherapists = (appointment: AppointmentResponse | null): boolean => {
  return (appointment?.staff_assignments?.length || 0) > 1;
};

// ============================================
// STAFF NAME EXTRACTION
// ============================================

/**
 * Get doctor name for doctor consultations
 * Handles multiple field sources (staff_name from dashboard API, doctor_name from expanded fields)
 * @param appointment - The appointment
 * @returns Doctor name or fallback message
 */
export const getDoctorName = (appointment: AppointmentResponse | null): string => {
  if (!appointment) return 'Unassigned';

  // Check staff_name field (used by dashboard API)
  if ((appointment as any).staff_name) {
    return (appointment as any).staff_name;
  }

  // Check doctor_name field (expanded field)
  if (appointment.doctor_name) {
    return appointment.doctor_name;
  }

  // If doctor_id exists but name not expanded
  if (appointment.doctor_id) {
    return 'Doctor Assigned';
  }

  return 'Unassigned';
};

/**
 * Get comma-separated therapist names for therapy appointments
 * @param appointment - The appointment
 * @returns Therapist names or fallback message
 */
export const getTherapistNames = (appointment: AppointmentResponse | null): string => {
  if (!appointment) return 'Unassigned';

  // Use staff_assignments (expanded therapist names)
  if (appointment.staff_assignments && appointment.staff_assignments.length > 0) {
    return appointment.staff_assignments.map(staff => staff.name).join(', ');
  }

  // If therapist_ids exist but names aren't expanded, show count
  if (appointment.therapist_ids && appointment.therapist_ids.length > 0) {
    const count = appointment.therapist_ids.length;
    return count === 1 ? 'Therapist Assigned' : `${count} Therapists Assigned`;
  }

  return 'Unassigned';
};

/**
 * Get staff name for display - automatically determines if doctor or therapist appointment
 * This is the primary helper for displaying staff names in UI components.
 * @param appointment - The appointment
 * @returns Staff name(s) appropriate for the appointment type
 */
export const getStaffName = (appointment: AppointmentResponse | null): string => {
  if (!appointment) return 'Unassigned';

  // Therapy appointment - show therapist names
  if (isTherapyAppointment(appointment)) {
    return getTherapistNames(appointment);
  }

  // Doctor appointment - show doctor name
  if (isDoctorAppointment(appointment)) {
    return getDoctorName(appointment);
  }

  // Fallback: If we can't determine type but staff_name is present (e.g., dashboard API)
  // This handles cases where doctor_id/therapist_ids are not included in the response
  if ((appointment as any).staff_name) {
    return (appointment as any).staff_name;
  }

  return 'Unassigned';
};

// ============================================
// STAFF COUNT & IDS
// ============================================

/**
 * Get therapist count from therapist_ids or staff_assignments
 * @param appointment - The appointment
 * @returns Number of therapists assigned
 */
export const getTherapistCount = (appointment: AppointmentResponse | null): number => {
  if (!appointment) return 0;

  // Use therapist_ids array length
  if (appointment.therapist_ids && appointment.therapist_ids.length > 0) {
    return appointment.therapist_ids.length;
  }

  // Fallback to staff_assignments
  if (appointment.staff_assignments && appointment.staff_assignments.length > 0) {
    return appointment.staff_assignments.length;
  }

  return 0;
};

/**
 * Get all therapist IDs from therapist_ids array
 * @param appointment - The appointment
 * @returns Array of therapist IDs
 */
export const getTherapistIds = (appointment: AppointmentResponse | null): string[] => {
  if (!appointment) return [];

  // Use therapist_ids array
  if (appointment.therapist_ids && appointment.therapist_ids.length > 0) {
    return appointment.therapist_ids;
  }

  // Fallback to staff_assignments IDs
  if (appointment.staff_assignments && appointment.staff_assignments.length > 0) {
    return appointment.staff_assignments.map(staff => staff.id);
  }

  return [];
};
