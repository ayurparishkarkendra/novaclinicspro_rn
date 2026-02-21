/**
 * Appointment Validation Utilities
 * Frontend validation for appointment booking scenarios
 */

import { OperatingHourResponse } from '../../operatingHours/data/models/operatingHours.dtos';

export interface ValidationResult {
  hasWarnings: boolean;
  isPast: boolean;
  isOutsideOperatingHours: boolean;
  isDuringBreak: boolean;
  isOnWeeklyOff: boolean;
  warnings: string[];
}

/**
 * Check if appointment time is in the past
 */
export const isPastAppointment = (appointmentDateTime: Date): boolean => {
  const now = new Date();
  return appointmentDateTime < now;
};

/**
 * Get day of week from date (0 = Monday, 6 = Sunday)
 */
const getDayOfWeek = (date: Date): number => {
  const day = date.getDay();
  // Convert JS day (0=Sunday) to backend format (0=Monday)
  return day === 0 ? 6 : day - 1;
};

/**
 * Parse time string (HH:MM:SS or HH:MM) to minutes since midnight
 */
const parseTimeToMinutes = (timeStr: string): number => {
  const parts = timeStr.split(':');
  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  return hours * 60 + minutes;
};

/**
 * Get day name from day of week number
 */
const getDayName = (dayOfWeek: number): string => {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  return days[dayOfWeek] || 'Unknown';
};

/**
 * Validate appointment and return all flags with warnings
 */
export const validateAppointmentTime = (
  appointmentDateTime: Date,
  operatingHours: OperatingHourResponse[]
): ValidationResult => {
  const result: ValidationResult = {
    hasWarnings: false,
    isPast: false,
    isOutsideOperatingHours: false,
    isDuringBreak: false,
    isOnWeeklyOff: false,
    warnings: [],
  };

  const dayOfWeek = getDayOfWeek(appointmentDateTime);
  const dayName = getDayName(dayOfWeek);
  const appointmentMinutes = appointmentDateTime.getHours() * 60 + appointmentDateTime.getMinutes();
  const timeStr = appointmentDateTime.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  // Check 1: Past time
  if (isPastAppointment(appointmentDateTime)) {
    result.isPast = true;
    result.hasWarnings = true;
    result.warnings.push('This appointment is in the past');
  }

  // Find operating hours for this day
  const dayHours = operatingHours.filter(
    (oh) => oh.day_of_week === dayOfWeek && oh.is_active
  );

  // Check 2: Weekly off
  if (dayHours.length === 0) {
    result.isOnWeeklyOff = true;
    result.hasWarnings = true;
    result.warnings.push(`${dayName} is a weekly off (clinic closed)`);
    return result; // No need to check further if it's a weekly off
  }

  // Check 3 & 4: Operating hours and break time
  let isWithinAnyPeriod = false;

  for (const hours of dayHours) {
    // Skip if times are null
    if (!hours.open_time || !hours.close_time) continue;
    
    const openMinutes = parseTimeToMinutes(hours.open_time);
    const closeMinutes = parseTimeToMinutes(hours.close_time);

    // Check if within main operating hours
    if (appointmentMinutes >= openMinutes && appointmentMinutes < closeMinutes) {
      isWithinAnyPeriod = true;

      // Check if during break time
      if (hours.break_start && hours.break_end) {
        const breakStartMinutes = parseTimeToMinutes(hours.break_start);
        const breakEndMinutes = parseTimeToMinutes(hours.break_end);

        if (appointmentMinutes >= breakStartMinutes && appointmentMinutes < breakEndMinutes) {
          result.isDuringBreak = true;
          result.hasWarnings = true;
          result.warnings.push(`Time ${timeStr} is during clinic break hours`);
        }
      }
      break;
    }
  }

  // If not within any operating period, it's outside operating hours
  if (!isWithinAnyPeriod) {
    result.isOutsideOperatingHours = true;
    result.hasWarnings = true;
    result.warnings.push(`Time ${timeStr} is outside clinic operating hours`);
  }

  return result;
};

/**
 * Format validation result into a confirmation message
 */
export const formatValidationMessage = (result: ValidationResult): string => {
  if (!result.hasWarnings) {
    return '';
  }

  const message = result.warnings.join(' and ');
  return `${message}. Do you still want to book this appointment?`;
};
