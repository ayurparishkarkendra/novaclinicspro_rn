/**
 * Casesheets DTOs
 * Data Transfer Objects matching OpenAPI schemas for clinical case sheets
 */

// ============================================
// ENUMS
// ============================================

/** Casesheet document status */
export type CasesheetStatus = 'DRAFT' | 'FINAL' | 'SIGNED';

/** Clinic type for casesheet */
export type ClinicType = 'ayurveda' | 'general' | 'dental' | 'other';

// ============================================
// REQUEST DTOs
// ============================================

/** Create casesheet request */
export interface CasesheetCreateRequest {
  clinic_type: ClinicType;
  data_json: Record<string, any>;
  template_id?: string;
  appointment_id?: string;
  encounter_id?: string;
  episode_id?: string; // Added: Link casesheet to episode directly
}

/** Update casesheet request */
export interface CasesheetUpdateRequest {
  data_json: Record<string, any>;
}

/** Transition casesheet status request */
export interface CasesheetStatusTransitionRequest {
  status: CasesheetStatus;
}

/** List casesheets params */
export interface ListCasesheetsParams {
  skip?: number;
  limit?: number;
  status?: CasesheetStatus;
  from_date?: string;
  to_date?: string;
}

// ============================================
// RESPONSE DTOs
// ============================================

/** Casesheet response */
export interface CasesheetResponse {
  id: string;
  tenant_id: string;
  client_id: string;
  template_id: string | null;
  appointment_id: string | null;
  episode_id: string | null;
  treatment_sheet_id: string | null; // ID of associated treatment sheet (if exists)
  chief_complaint: string | null;
  provisional_diagnosis: string | null;
  final_diagnosis: string | null;
  status: CasesheetStatus;
  document_version: number;
  recorded_at: string;
  recorded_by_staff_id: string | null;
  signed_by_staff_id: string | null;
  signed_at: string | null;
  data_json: Record<string, any>;
  header_snapshot: Record<string, any> | null;
  footer_snapshot: Record<string, any> | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/** Paginated casesheet list response */
export interface CasesheetListResponse {
  items: CasesheetResponse[];
  total: number;
  skip: number;
  limit: number;
}

/** Print casesheet response (returns HTML/PDF data) */
export interface CasesheetPrintResponse {
  content: string;
  content_type: 'text/html' | 'application/pdf';
  filename?: string;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/** Get status display label */
export const getStatusLabel = (status: CasesheetStatus): string => {
  const labels: Record<CasesheetStatus, string> = {
    DRAFT: 'Draft',
    FINAL: 'Final',
    SIGNED: 'Signed',
  };
  return labels[status] || status;
};

/** Get status color */
export const getStatusColor = (status: CasesheetStatus): string => {
  const colors: Record<CasesheetStatus, string> = {
    DRAFT: '#F59E0B',   // Amber/warning
    FINAL: '#3B82F6',   // Blue/info
    SIGNED: '#10B981',  // Green/success
  };
  return colors[status] || '#6B7280';
};

/** Check if casesheet is editable */
export const isEditable = (status: CasesheetStatus): boolean => {
  return status === 'DRAFT';
};

/** Get allowed transitions from current status */
export const getAllowedTransitions = (status: CasesheetStatus): CasesheetStatus[] => {
  switch (status) {
    case 'DRAFT':
      return ['FINAL'];
    case 'FINAL':
      return ['SIGNED'];
    case 'SIGNED':
      return []; // No transitions allowed from SIGNED
    default:
      return [];
  }
};

/** Format date for display */
export const formatDate = (dateStr: string | null): string => {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
};

/** Format date and time for display */
export const formatDateTime = (dateStr: string | null): string => {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
};
