/**
 * Appointment Validation Utilities
 * Frontend validation for appointment booking scenarios
 * 
 * CRITICAL: This validation runs on LOCAL time for the clinic.
 * The Date object passed in should represent the clinic's local time.
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
 * Get backend day of week from JS Date
 * Backend uses: 0=Monday, 1=Tuesday, ..., 6=Sunday
 * JS uses: 0=Sunday, 1=Monday, ..., 6=Saturday
 */
const getBackendDayOfWeek = (jsDay: number): number => {
  // JS: 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
  // Backend: 0=Mon, 1=Tue, 2=Wed, 3=Thu, 4=Fri, 5=Sat, 6=Sun
  return jsDay === 0 ? 6 : jsDay - 1;
};

/**
 * Get day name from JS day (0=Sunday)
 */
const getDayName = (jsDay: number): string => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[jsDay] || 'Unknown';
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
 * Validate appointment and return all flags with warnings
 * 
 * IMPORTANT: appointmentDateTime should be a Date object in LOCAL timezone
 * representing the clinic's local time for the appointment.
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

  // Get day of week in LOCAL timezone
  const jsDay = appointmentDateTime.getDay(); // 0=Sunday, 1=Monday, etc.
  const backendDay = getBackendDayOfWeek(jsDay); // Convert to backend format
  const dayName = getDayName(jsDay);
  
  // Get time in LOCAL timezone
  const appointmentMinutes = appointmentDateTime.getHours() * 60 + appointmentDateTime.getMinutes();
  const timeStr = appointmentDateTime.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  // DEBUG: Log validation details
  console.log('[Validation] Checking appointment:', {
    dateTime: appointmentDateTime.toISOString(),
    localString: appointmentDateTime.toLocaleString('en-IN'),
    jsDay: jsDay,
    backendDay: backendDay,
    dayName: dayName,
    appointmentMinutes: appointmentMinutes,
    timeStr: timeStr,
    operatingHoursCount: operatingHours.length,
  });

  // Check 1: Past time
  if (isPastAppointment(appointmentDateTime)) {
    result.isPast = true;
    result.hasWarnings = true;
    result.warnings.push('This appointment is in the past');
  }

  // Find operating hours for this day (using backend day format)
  const dayHours = operatingHours.filter(
    (oh) => oh.day_of_week === backendDay && oh.is_active
  );

  console.log('[Validation] Operating hours for backend day', backendDay, '(', dayName, '):', dayHours.length, 'periods');
  console.log('[Validation] All operating hours:', operatingHours.map(oh => ({
    day: oh.day_of_week,
    active: oh.is_active,
    open: oh.open_time,
    close: oh.close_time,
  })));

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
    // Skip if times are null (this indicates a weekly off)
    if (!hours.open_time || !hours.close_time) {
      continue;
    }
    
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
