/**
 * Treatment Sheet Entity
 * Domain entity representing a treatment sheet
 */

export type TreatmentSheetStatus = 'DRAFT' | 'FINAL' | 'SIGNED';
export type TreatmentSheetRowStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface TreatmentSheetRowEntity {
  id: string;
  treatmentSheetId: string;
  treatmentId: string;
  treatmentName: string;
  quantity: number;
  unit: string;
  scheduledDate: Date | null;
  assignedTherapistId: string | null;
  status: TreatmentSheetRowStatus;
  completedAt: Date | null;
  completedByStaffId: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface TreatmentSheetEntity {
  id: string;
  tenantId: string;
  clientId: string;
  casesheetId: string | null;
  appointmentId: string | null;
  encounterId: string | null;
  treatmentPlanSummary: string | null;
  status: TreatmentSheetStatus;
  documentVersion: number;
  recordedByStaffId: string | null;
  signedByStaffId: string | null;
  signedAt: Date | null;
  rows: TreatmentSheetRowEntity[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Check if treatment sheet can be edited
 */
export const canEditTreatmentSheet = (entity: TreatmentSheetEntity, isDoctor: boolean = false): boolean => {
  if (entity.status === 'DRAFT') return true;
  if (entity.status === 'SIGNED' && isDoctor) return true;
  return false;
};

/**
 * Get allowed status transitions
 */
export const getAllowedTreatmentSheetTransitions = (status: TreatmentSheetStatus): TreatmentSheetStatus[] => {
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
 * Check if treatment sheet can be archived
 */
export const canArchiveTreatmentSheet = (entity: TreatmentSheetEntity): boolean => {
  return entity.status !== 'SIGNED';
};

/**
 * Get status display information
 */
export const getTreatmentSheetStatusInfo = (status: TreatmentSheetStatus): { label: string; color: string; icon: string } => {
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
 * Get row status display information
 */
export const getTreatmentRowStatusInfo = (status: TreatmentSheetRowStatus): { label: string; color: string; icon: string } => {
  switch (status) {
    case 'PENDING':
      return { label: 'Pending', color: '#6B7280', icon: 'time-outline' };
    case 'IN_PROGRESS':
      return { label: 'In Progress', color: '#F59E0B', icon: 'play-outline' };
    case 'COMPLETED':
      return { label: 'Completed', color: '#10B981', icon: 'checkmark-circle' };
    case 'CANCELLED':
      return { label: 'Cancelled', color: '#EF4444', icon: 'close-circle-outline' };
    default:
      return { label: status, color: '#6B7280', icon: 'help-circle-outline' };
  }
};

/**
 * Calculate treatment sheet progress
 */
export const calculateTreatmentProgress = (rows: TreatmentSheetRowEntity[]): { completed: number; total: number; percentage: number } => {
  const total = rows.length;
  const completed = rows.filter(r => r.status === 'COMPLETED').length;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
  return { completed, total, percentage };
};
