/**
 * Bulk Upload DTOs
 * Data Transfer Objects matching OpenAPI schemas for bulk upload operations
 */

// ============================================
// ENUMS & TYPES
// ============================================

/** Entity types that can be bulk uploaded */
export type BulkEntityType = 'clients' | 'treatments' | 'inventory' | 'appointments';

/** Job status */
export type JobStatus = 'pending' | 'mapping' | 'validating' | 'validated' | 'committing' | 'committed' | 'failed';

/** Row validation status */
export type RowStatus = 'valid' | 'invalid' | 'committed';

// ============================================
// REQUEST DTOs
// ============================================

/** Column mapping request */
export interface ColumnMappingRequest {
  mapping: Record<string, string>; // csv_column -> field_name
}

/** Staging row update request */
export interface StagingRowUpdateRequest {
  mapped_data: Record<string, any>;
}

// ============================================
// RESPONSE DTOs
// ============================================

/** Bulk upload initial response */
export interface BulkUploadResponse {
  job_id: string;
  entity_type: BulkEntityType;
  filename: string | null;
  total_rows: number;
  detected_columns: string[];
  suggested_mapping: Record<string, string> | null;
  template_used: boolean | null;
}

/** Job summary */
export interface JobSummary {
  id: string;
  tenant_id: string;
  entity_type: BulkEntityType;
  status: JobStatus;
  filename: string | null;
  total_rows: number;
  valid_rows: number;
  invalid_rows: number;
  committed_rows: number;
  error_summary: Record<string, any> | null;
  mapping: Record<string, string> | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

/** Staging row */
export interface StagingRow {
  id: string;
  row_index: number;
  raw_data: Record<string, any>;
  mapped_data: Record<string, any>;
  validation_errors: Record<string, string[]> | null;
  is_valid: boolean;
  is_committed: boolean;
  committed_id: string | null;
}

/** Validation summary */
export interface ValidationSummary {
  total_rows: number;
  valid_rows: number;
  invalid_rows: number;
  error_summary: Record<string, number>;
}

/** Commit result */
export interface CommitResult {
  success: boolean;
  message: string;
  created: number;
  updated: number;
  failed: number;
  committed_rows: number;
  error_details: Record<string, any> | null;
}

/** Job with rows response */
export interface JobWithRowsResponse {
  job: JobSummary;
  rows: StagingRow[];
  total_rows: number;
  skip: number;
  limit: number;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/** Get entity type display label */
export const getEntityTypeLabel = (type: BulkEntityType): string => {
  const labels: Record<BulkEntityType, string> = {
    clients: 'Clients',
    treatments: 'Treatments',
    inventory: 'Inventory Items',
    appointments: 'Appointments',
  };
  return labels[type] || type;
};

/** Get entity type icon name */
export const getEntityTypeIcon = (type: BulkEntityType): string => {
  const icons: Record<BulkEntityType, string> = {
    clients: 'people',
    treatments: 'medical',
    inventory: 'cube',
    appointments: 'calendar',
  };
  return icons[type] || 'document';
};

/** Get job status display label */
export const getJobStatusLabel = (status: JobStatus): string => {
  const labels: Record<JobStatus, string> = {
    pending: 'Pending',
    mapping: 'Mapping Columns',
    validating: 'Validating...',
    validated: 'Ready to Commit',
    committing: 'Committing...',
    committed: 'Completed',
    failed: 'Failed',
  };
  return labels[status] || status;
};

/** Get job status color */
export const getJobStatusColor = (status: JobStatus): string => {
  const colors: Record<JobStatus, string> = {
    pending: '#6B7280',      // Gray
    mapping: '#3B82F6',      // Blue
    validating: '#F59E0B',   // Amber
    validated: '#10B981',    // Green
    committing: '#F59E0B',   // Amber
    committed: '#10B981',    // Green
    failed: '#EF4444',       // Red
  };
  return colors[status] || '#6B7280';
};

/** Check if job is in progress */
export const isJobInProgress = (status: JobStatus): boolean => {
  return ['validating', 'committing'].includes(status);
};

/** Check if job can be committed */
export const canCommitJob = (status: JobStatus, validRows: number): boolean => {
  return status === 'validated' && validRows > 0;
};

/** Format percentage */
export const formatPercentage = (value: number, total: number): string => {
  if (total === 0) return '0%';
  return `${Math.round((value / total) * 100)}%`;
};

/** Required fields for each entity type */
export const getRequiredFields = (type: BulkEntityType): string[] => {
  const fields: Record<BulkEntityType, string[]> = {
    clients: ['name', 'phone'],
    treatments: ['name', 'duration_minutes'],
    inventory: ['name'],
    appointments: ['client_id', 'staff_id', 'start_time'],
  };
  return fields[type] || [];
};

/** Get sample fields for each entity type */
export const getSampleFields = (type: BulkEntityType): string[] => {
  const fields: Record<BulkEntityType, string[]> = {
    clients: ['name', 'phone', 'email', 'date_of_birth', 'gender', 'address'],
    treatments: ['name', 'duration_minutes', 'price', 'category', 'description'],
    inventory: ['name', 'brand', 'category', 'unit', 'price', 'reorder_point'],
    appointments: ['client_id', 'staff_id', 'treatment_id', 'start_time', 'end_time', 'notes'],
  };
  return fields[type] || [];
};
