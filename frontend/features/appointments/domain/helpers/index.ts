/**
 * Appointment Domain Helpers - Barrel Export
 * 
 * Centralized export point for all appointment domain utilities.
 * Import from this file instead of individual modules for cleaner imports.
 */

// Appointment inspection and staff name helpers
export {
  isTherapyAppointment,
  isDoctorAppointment,
  hasMultipleTherapists,
  getDoctorName,
  getTherapistNames,
  getStaffName,
  getTherapistCount,
  getTherapistIds,
} from './appointment.helpers';

// Status utilities
export {
  getStatusKey,
  getStatusLabel,
  getStatusColor,
} from './status.utils';

// Duration utilities
export {
  calculateDuration,
  formatDuration,
} from './duration.utils';

// Date utilities - re-exported from core for convenience
export {
  isToday,
  generateDateRange,
  toISODateString,
} from '../../../../core/utils/dateTimeUtils';

// WhatsApp messaging
export {
  getRoleLabel,
  generateWhatsAppConfirmationMessage,
  generateWhatsAppCreatedMessage,
  generateWhatsAppCancellationMessage,
  generateWhatsAppRescheduleMessage,
  generateWhatsAppSeriesMessage,
  generateWhatsAppNoShowMessage,
  generateWhatsAppCompletedMessage,
  openWhatsApp,
} from '../messaging/whatsapp/appointment.messages';
