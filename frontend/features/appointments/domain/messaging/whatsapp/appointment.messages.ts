/**
 * WhatsApp Appointment Messages
 * 
 * CLEAN ARCHITECTURE: Messaging layer for WhatsApp communication.
 * Used by: UI components when sending WhatsApp notifications to clients.
 * 
 * DRY IMPROVEMENT: Uses template helpers to avoid duplicating message structure.
 */

// ============================================
// ROLE LABEL HELPER
// ============================================

/**
 * Get role label based on appointment type or staff role
 * Determines whether to display "Doctor" or "Therapist" in messages
 * @param appointmentType - Type of appointment (optional)
 * @param staffRole - Role of staff member (optional)
 * @returns Role label for display
 */
export const getRoleLabel = (appointmentType?: string | null, staffRole?: string | null): string => {
  // If appointment type explicitly indicates doctor consultation
  if (
    appointmentType?.toUpperCase() === 'DOCTOR_CONSULTATION' ||
    appointmentType?.toUpperCase() === 'CONSULTATION' ||
    appointmentType?.toUpperCase() === 'DOCTOR'
  ) {
    return 'Doctor';
  }

  // If appointment type explicitly indicates therapy
  if (
    appointmentType?.toUpperCase() === 'THERAPY' ||
    appointmentType?.toUpperCase() === 'THERAPY_SESSION' ||
    appointmentType?.toUpperCase() === 'MULTI'
  ) {
    return 'Therapist';
  }

  // Check staff role/type
  const role = (staffRole || '').toLowerCase();
  if (role.includes('doctor') || role.includes('vaidya') || role.includes('physician')) {
    return 'Doctor';
  }
  if (role.includes('therapist')) {
    return 'Therapist';
  }

  // Default fallback
  return 'Staff';
};

// ============================================
// MESSAGE TEMPLATE HELPERS (DRY)
// ============================================

/**
 * Generate greeting line
 * DRY: Reusable greeting template
 */
const getGreeting = (clientName: string): string => {
  return `Hi ${clientName},`;
};

/**
 * Generate clinic info line
 * DRY: Reusable clinic template
 */
const getClinicInfo = (clinicName: string): string => {
  return `📍 Clinic: ${clinicName}`;
};

/**
 * Generate contact line
 * DRY: Reusable contact template
 */
const getContactLine = (clinicPhone: string, action: string = 'any changes'): string => {
  return `For ${action}, please call us at ${clinicPhone}.`;
};

/**
 * Generate closing line
 * DRY: Reusable closing template
 */
const getClosing = (): string => {
  return `Thank you!`;
};

// ============================================
// APPOINTMENT CONFIRMATION MESSAGES
// ============================================

/**
 * Generate WhatsApp confirmation message
 * Used when appointment is confirmed
 */
export const generateWhatsAppConfirmationMessage = (
  clientName: string,
  clinicName: string,
  date: string,
  time: string,
  staffName: string,
  treatmentName: string,
  clinicPhone: string,
  appointmentType?: string | null
): string => {
  const roleLabel = getRoleLabel(appointmentType);
  
  return `${getGreeting(clientName)}

Your appointment has been confirmed! 📅

${getClinicInfo(clinicName)}
📅 Date: ${date}
🕐 Time: ${time}
👨‍⚕️ ${roleLabel}: ${staffName}
💆 Treatment: ${treatmentName}

Please arrive 10 minutes early.

${getContactLine(clinicPhone)}

${getClosing()}`;
};

/**
 * Generate WhatsApp appointment created message
 * Used when appointment is first booked
 */
export const generateWhatsAppCreatedMessage = (
  clientName: string,
  clinicName: string,
  date: string,
  time: string,
  staffName: string,
  treatmentName: string,
  clinicPhone: string,
  appointmentType?: string | null
): string => {
  const roleLabel = getRoleLabel(appointmentType);
  
  return `${getGreeting(clientName)}

Your appointment has been booked! 📅

${getClinicInfo(clinicName)}
📅 Date: ${date}
🕐 Time: ${time}
👨‍⚕️ ${roleLabel}: ${staffName}
💆 Treatment: ${treatmentName}

Please arrive 10 minutes early.

${getContactLine(clinicPhone)}

${getClosing()}`;
};

// ============================================
// APPOINTMENT CANCELLATION MESSAGES
// ============================================

/**
 * Generate WhatsApp cancellation message
 * Used when appointment is cancelled
 */
export const generateWhatsAppCancellationMessage = (
  clientName: string,
  date: string,
  time: string,
  treatmentName: string,
  clinicPhone: string
): string => {
  return `${getGreeting(clientName)}

Your appointment has been cancelled. ❌

📅 Date: ${date}
🕐 Time: ${time}
💆 Treatment: ${treatmentName}

${getContactLine(clinicPhone, 'rescheduling')}

${getClosing()}`;
};

// ============================================
// APPOINTMENT RESCHEDULE MESSAGES
// ============================================

/**
 * Generate WhatsApp reschedule message
 * Used when appointment time is changed
 */
export const generateWhatsAppRescheduleMessage = (
  clientName: string,
  oldDate: string,
  oldTime: string,
  newDate: string,
  newTime: string,
  staffName: string,
  treatmentName: string,
  appointmentType?: string | null
): string => {
  const roleLabel = getRoleLabel(appointmentType);
  
  return `${getGreeting(clientName)}

Your appointment has been rescheduled. 📅

Previous:
📅 ${oldDate} at ${oldTime}

New:
📅 ${newDate} at ${newTime}
👨‍⚕️ ${roleLabel}: ${staffName}
💆 Treatment: ${treatmentName}

Please confirm if this works for you.

${getClosing()}`;
};

// ============================================
// MULTI-DAY THERAPY MESSAGES
// ============================================

/**
 * Generate WhatsApp multi-day therapy series message
 * Used when therapy plan with multiple sessions is created
 */
export const generateWhatsAppSeriesMessage = (
  clientName: string,
  clinicName: string,
  treatmentName: string,
  totalSessions: number,
  firstSessionDate: string,
  firstSessionTime: string,
  clinicPhone: string
): string => {
  return `${getGreeting(clientName)}

Your therapy plan has been scheduled! 📅

${getClinicInfo(clinicName)}
💆 Treatment: ${treatmentName}
📊 Total Sessions: ${totalSessions}

First Session:
📅 ${firstSessionDate} at ${firstSessionTime}

You will receive reminders before each session.

${getContactLine(clinicPhone)}

${getClosing()}`;
};

// ============================================
// APPOINTMENT STATUS MESSAGES
// ============================================

/**
 * Generate WhatsApp no-show message
 * Used when client misses appointment
 */
export const generateWhatsAppNoShowMessage = (
  clientName: string,
  date: string,
  time: string,
  treatmentName: string,
  clinicPhone: string
): string => {
  return `${getGreeting(clientName)}

We noticed you missed your appointment today.

📅 Date: ${date}
🕐 Time: ${time}
💆 Treatment: ${treatmentName}

We hope everything is okay! ${getContactLine(clinicPhone, 'rescheduling')}

${getClosing()}`;
};

/**
 * Generate WhatsApp appointment completed message
 * Used after appointment is completed
 */
export const generateWhatsAppCompletedMessage = (
  clientName: string,
  date: string,
  treatmentName: string,
  clinicPhone: string
): string => {
  return `${getGreeting(clientName)}

Thank you for visiting us today! 🙏

💆 Treatment: ${treatmentName}
📅 Date: ${date}

We hope you had a great experience. If you have any questions or need to book your next appointment, please call us at ${clinicPhone}.

Take care and see you soon!`;
};

// ============================================
// WHATSAPP URL HELPER
// ============================================

/**
 * Generate WhatsApp URL with pre-filled message
 * Opens WhatsApp with message ready to send
 * @param phone - Phone number (will be cleaned)
 * @param message - Message text (will be URL encoded)
 * @returns WhatsApp URL
 */
export const openWhatsApp = (phone: string, message: string): string => {
  // Clean phone number - remove non-numeric except +
  const cleanPhone = phone.replace(/[^\d+]/g, '');
  const encodedMessage = encodeURIComponent(message);
  
  return `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
};
