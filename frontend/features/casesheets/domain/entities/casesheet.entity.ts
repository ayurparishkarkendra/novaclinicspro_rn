/**
 * Casesheet Entity
 * Domain entity representing a clinical casesheet
 */

export type CasesheetStatus = 'DRAFT' | 'FINAL' | 'SIGNED';

export interface CasesheetDataBasic {
  chief_complaint?: string;
  provisional_diagnosis?: string;
  final_diagnosis?: string;
  subjective?: string;
  objective?: string;
  assessment?: string;
  plan?: string;
  [key: string]: any;
}

export interface CasesheetExtension {
  template_id: string;
  data: Record<string, any>;
}

export interface CasesheetData {
  basic: CasesheetDataBasic;
  extensions?: CasesheetExtension[];
}

export interface CasesheetEntity {
  id: string;
  tenantId: string;
  clientId: string;
  templateId: string | null;
  appointmentId: string | null;
  chiefComplaint: string | null;
  provisionalDiagnosis: string | null;
  finalDiagnosis: string | null;
  status: CasesheetStatus;
  documentVersion: number;
  recordedAt: Date;
  recordedByStaffId: string | null;
  signedByStaffId: string | null;
  signedAt: Date | null;
  dataJson: CasesheetData;
  headerSnapshot: Record<string, any> | null;
  footerSnapshot: Record<string, any> | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Check if casesheet can be edited
 */
export const canEditCasesheet = (entity: CasesheetEntity, isDoctor: boolean = false): boolean => {
  if (entity.status === 'DRAFT') return true;
  if (entity.status === 'SIGNED' && isDoctor) return true;
  return false;
};

/**
 * Get allowed status transitions
 */
export const getAllowedCasesheetTransitions = (status: CasesheetStatus): CasesheetStatus[] => {
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
 * Check if casesheet can be archived
 */
export const canArchiveCasesheet = (entity: CasesheetEntity): boolean => {
  return entity.status !== 'SIGNED';
};

/**
 * Get status display information
 */
export const getCasesheetStatusInfo = (status: CasesheetStatus): { label: string; color: string; icon: string } => {
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
