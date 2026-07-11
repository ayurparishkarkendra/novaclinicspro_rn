/**
 * Appointment Duration Utilities
 * 
 * CLEAN ARCHITECTURE: Domain layer utilities for duration calculations.
 * Used by: UI components, domain services for displaying appointment durations.
 */

// ============================================
// DURATION CALCULATION
// ============================================

/**
 * Calculate appointment duration in minutes
 * @param start - ISO datetime string for appointment start
 * @param end - ISO datetime string for appointment end (nullable)
 * @returns Duration in minutes, or null if end time not provided
 */
export const calculateDuration = (start: string, end: string | null): number | null => {
  if (!end) return null;
  
  const startDate = new Date(start);
  const endDate = new Date(end);
  
  return Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60));
};

// ============================================
// DURATION FORMATTING
// ============================================

/**
 * Format duration for display
 * Converts minutes to human-readable format (e.g., "1 hr 30 min", "45 min")
 * @param minutes - Duration in minutes (nullable)
 * @returns Formatted duration string
 */
export const formatDuration = (minutes: number | null): string => {
  if (!minutes) return '—';
  
  if (minutes < 60) {
    return `${minutes} min`;
  }
  
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (mins === 0) {
    return `${hours} hr`;
  }
  
  return `${hours} hr ${mins} min`;
};
