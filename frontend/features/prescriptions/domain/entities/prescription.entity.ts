/**
 * Prescription Entity
 * Domain entity representing a prescription
 */

export type PrescriptionStatus = 'DRAFT' | 'FINAL' | 'SIGNED';
export type ShareChannel = 'SMS' | 'WhatsApp' | 'Email';

export interface MedicationItem {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  route?: string;
  instructions?: string;
  quantity?: number;
  unit?: string;
}

export interface PrescriptionData {
  medications: MedicationItem[];
  dietary_advice?: string;
  lifestyle_advice?: string;
  follow_up_instructions?: string;
  warnings?: string[];
}

export interface PrescriptionEntity {
  id: string;
  tenantId: string;
  clientId: string;
  appointmentId: string | null;
  issuedByStaffId: string | null;
  prescriptionData: PrescriptionData;
  notes: string | null;
  nextVisitDays: number | null;
  sourceDocumentId: string | null;
  sourceDocumentType: string | null;
  repeatedFromPrescriptionId: string | null;
  status: PrescriptionStatus;
  documentVersion: number;
  signedByStaffId: string | null;
  signedAt: Date | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Check if prescription can be edited
 */
export const canEditPrescription = (entity: PrescriptionEntity, isDoctor: boolean = false): boolean => {
  if (entity.status === 'DRAFT') return true;
  if (entity.status === 'SIGNED' && isDoctor) return true;
  return false;
};

/**
 * Check if prescription can be shared
 */
export const canSharePrescription = (entity: PrescriptionEntity): boolean => {
  return entity.status === 'SIGNED';
};

/**
 * Check if prescription can be repeated
 */
export const canRepeatPrescription = (entity: PrescriptionEntity): boolean => {
  return entity.isActive;
};

/**
 * Get allowed status transitions
 */
export const getAllowedPrescriptionTransitions = (status: PrescriptionStatus): PrescriptionStatus[] => {
  switch (status) {
    case 'DRAFT':
      return ['FINAL'];
    case 'FINAL':
      return ['SIGNED'];
    case 'SIGNED':
      return [];
    default:
      return [];
  }
};

/**
 * Get status display information
 */
export const getPrescriptionStatusInfo = (status: PrescriptionStatus): { label: string; color: string; icon: string } => {
  switch (status) {
    case 'DRAFT':
      return { label: 'Draft', color: '#F59E0B', icon: 'create-outline' };
    case 'FINAL':
      return { label: 'Final', color: '#3B82F6', icon: 'checkmark-circle-outline' };
    case 'SIGNED':
      return { label: 'Signed', color: '#10B981', icon: 'shield-checkmark' };
    default:
      return { label: status, color: '#6B7280', icon: 'help-circle-outline' };
  }
};

/**
 * Format medication for display
 */
export const formatMedicationDisplay = (med: MedicationItem): string => {
  const parts = [med.name];
  if (med.dosage) parts.push(med.dosage);
  if (med.frequency) parts.push(med.frequency);
  if (med.duration) parts.push(`for ${med.duration}`);
  return parts.join(' - ');
};

/**
 * Get medication count from prescription data
 */
export const getMedicationCount = (data: PrescriptionData): number => {
  return data.medications?.length || 0;
};
