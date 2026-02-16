/**
 * Centralized Date/Time Utilities
 * 
 * SINGLE SOURCE OF TRUTH for all date/time formatting in the app.
 * All components should import from this file instead of implementing their own.
 * 
 * IMPORTANT: The backend stores times like "2026-02-14T16:00:00Z" where 16:00
 * represents the user's intended local time (4 PM IST), NOT UTC.
 * We must extract hours/minutes directly from the ISO string to avoid
 * timezone conversion that would shift 16:00 to 21:30 in IST.
 */

// ============================================
// TIME EXTRACTION HELPERS
// ============================================

/**
 * Extract time pattern (HH:MM) from ISO string without timezone conversion
 */
export const extractTimePattern = (dateStr: string): string => {
  const timeMatch = dateStr.match(/T(\d{2}):(\d{2})/);
  if (timeMatch) {
    return `${timeMatch[1]}:${timeMatch[2]}`;
  }
  return '00:00';
};

/**
 * Extract hour from ISO string (0-23)
 */
export const extractHour = (dateStr: string): number => {
  const timeMatch = dateStr.match(/T(\d{2}):/);
  return timeMatch ? parseInt(timeMatch[1], 10) : 0;
};

/**
 * Extract minute from ISO string (0-59)
 */
export const extractMinute = (dateStr: string): number => {
  const timeMatch = dateStr.match(/T\d{2}:(\d{2})/);
  return timeMatch ? parseInt(timeMatch[1], 10) : 0;
};

// ============================================
// DATE FORMATTING
// ============================================

/**
 * Format date for display (e.g., "15 Feb 2026")
 * Safe version that handles null/undefined/Date objects
 */
export const formatDate = (dateStr: string | Date | undefined | null): string => {
  if (!dateStr) return '—';
  try {
    const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
    if (isNaN(date.getTime())) return '—';
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return '—';
  }
};

/**
 * Format short date (e.g., "15 Feb")
 */
export const formatShortDate = (dateStr: string | Date | undefined | null): string => {
  if (!dateStr) return '—';
  try {
    const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
    if (isNaN(date.getTime())) return '—';
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
    });
  } catch {
    return '—';
  }
};

/**
 * Get day of week (e.g., "Sun", "Mon")
 */
export const formatDayOfWeek = (dateStr: string | Date | undefined | null): string => {
  if (!dateStr) return '';
  try {
    const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
    if (isNaN(date.getTime())) return '';
    return date.toLocaleDateString('en-IN', { weekday: 'short' });
  } catch {
    return '';
  }
};

// ============================================
// TIME FORMATTING
// ============================================

/**
 * Format time for display WITHOUT timezone conversion.
 * 
 * Backend returns times like "2026-02-14T16:00:00Z" where 16:00 represents
 * the user's intended local time (4 PM). We must NOT convert this to local timezone
 * as that would shift 16:00 UTC to 21:30 IST incorrectly.
 * 
 * @param dateStr - ISO date string, Date object, or null
 * @returns Formatted time string (e.g., "04:00 pm")
 */
export const formatTime = (dateStr: string | Date | undefined | null): string => {
  if (!dateStr) return '—';
  try {
    // If it's a string, extract hours/minutes directly from the ISO string
    // to avoid timezone conversion
    if (typeof dateStr === 'string') {
      // Parse ISO format: "2026-02-14T16:00:00Z" or "2026-02-14T16:00:00"
      const timeMatch = dateStr.match(/T(\d{2}):(\d{2})/);
      if (timeMatch) {
        const hours = parseInt(timeMatch[1], 10);
        const minutes = parseInt(timeMatch[2], 10);
        const period = hours >= 12 ? 'pm' : 'am';
        const displayHour = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
        return `${displayHour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${period}`;
      }
    }
    // Fallback for Date objects - use UTC methods to avoid conversion
    const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
    if (isNaN(date.getTime())) return '—';
    const hours = date.getUTCHours();
    const minutes = date.getUTCMinutes();
    const period = hours >= 12 ? 'pm' : 'am';
    const displayHour = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    return `${displayHour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${period}`;
  } catch {
    return '—';
  }
};

/**
 * Format time from hour and minute numbers
 * @param hour - Hour (0-23)
 * @param minute - Minute (0-59)
 * @returns Formatted time string (e.g., "04:00 pm")
 */
export const formatTimeFromParts = (hour: number, minute: number): string => {
  const period = hour >= 12 ? 'pm' : 'am';
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`;
};

// ============================================
// DATE + TIME FORMATTING
// ============================================

/**
 * Format date and time together (e.g., "15 Feb, 04:00 pm")
 */
export const formatDateTime = (dateStr: string | Date | undefined | null): string => {
  if (!dateStr) return '—';
  const date = formatDate(dateStr);
  const time = formatTime(dateStr);
  if (date === '—' || time === '—') return '—';
  return `${date}, ${time}`;
};

// ============================================
// DURATION FORMATTING
// ============================================

/**
 * Calculate appointment duration in minutes
 */
export const calculateDuration = (start: string, end: string | null): number | null => {
  if (!end) return null;
  const startDate = new Date(start);
  const endDate = new Date(end);
  return Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60));
};

/**
 * Format duration for display (e.g., "60 min" or "1h 30min")
 */
export const formatDuration = (minutes: number | null): string => {
  if (!minutes) return '—';
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}min`;
};

// ============================================
// ISO STRING BUILDERS
// ============================================

/**
 * Build ISO string from date and time with LOCAL time preservation.
 * The resulting string will have the format YYYY-MM-DDTHH:MM:00Z
 * where HH:MM is the LOCAL time (not converted to UTC).
 * 
 * @param date - Date object for the date part
 * @param time - Date object for the time part (hours/minutes)
 * @returns ISO string with local time
 */
export const buildLocalTimeISO = (date: Date, time: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hour = String(time.getHours()).padStart(2, '0');
  const minute = String(time.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hour}:${minute}:00Z`;
};

/**
 * Convert date to YYYY-MM-DD string
 */
export const toISODateString = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// ============================================
// DATE COMPARISON HELPERS
// ============================================

/**
 * Check if date is today
 */
export const isToday = (dateStr: string | Date): boolean => {
  const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
  const today = new Date();
  return date.toDateString() === today.toDateString();
};

/**
 * Check if date is before today (strictly past)
 */
export const isBeforeToday = (dateStr: string | Date): boolean => {
  const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  return date < today;
};

/**
 * Check if date is after today (strictly future)
 */
export const isAfterToday = (dateStr: string | Date): boolean => {
  const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  return date > today;
};
